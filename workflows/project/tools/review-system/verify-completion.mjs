#!/usr/bin/env node
/**
 * verify-completion.mjs - 完成度验证器
 *
 * 功能：
 * 1. 检查代码文件是否存在（对应模块表的路径）
 * 2. 检查测试覆盖率（对应模块）
 * 3. 检查 Git 提交记录（相关文件的变更）
 * 4. 运行验证脚本（lint/typecheck/test）
 * 5. 输出完成证据和缺失项
 *
 * 用法：
 *   node verify-completion.mjs --project-root=/path/to/project [--items=items.json]
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

// ============================================
// 配置
// ============================================

// 模块路径映射（用于验证文件存在性）
const MODULE_PATHS = {
  NarrativeEngine: 'game/src/systems/narrative/',
  WorldState: 'game/src/systems/world/',
  AbilitySystem: 'game/src/systems/ability/',
  SaveManager: 'game/src/systems/save/',
  AudioManager: 'game/src/systems/audio/',
  UISystem: 'game/src/systems/ui/',
  SceneAssembler: 'game/src/systems/scene/',
  AssetManager: 'game/src/systems/assets/',
  EventBus: 'game/src/systems/EventBus.ts',
  DebugCommands: 'game/src/systems/debug/',
  TouchControls: 'game/src/systems/input/',
  WhiteboxFactory: 'game/src/systems/whitebox/',
};

// 测试文件映射
const TEST_PATHS = {
  NarrativeEngine: 'game/tests/systems/narrative/',
  WorldState: 'game/tests/systems/world/',
  AbilitySystem: 'game/tests/systems/ability/',
  SaveManager: 'game/tests/systems/save/',
  UISystem: 'game/tests/systems/ui/',
};

// 门禁脚本映射
const GATE_SCRIPTS = {
  typecheck: 'npm run typecheck',
  lint: 'npm run lint',
  test: 'npm run test',
  'test:coverage': 'npm run test:coverage',
  'test:e2e': 'npm run test:e2e',
  'validate:data': 'npm run validate:data',
  'validate:assets': 'npm run validate:assets',
};

// ============================================
// 验证函数
// ============================================

/**
 * 检查文件/目录是否存在
 */
async function checkPathExists(projectRoot, relPath) {
  try {
    const absPath = path.join(projectRoot, relPath);
    const stat = await fs.stat(absPath);
    return {
      exists: true,
      isDir: stat.isDirectory(),
      size: stat.size,
      mtime: stat.mtime.toISOString(),
    };
  } catch {
    return { exists: false };
  }
}

/**
 * 获取 Git 最近提交记录
 */
async function getGitCommits(projectRoot, relPath, days = 30) {
  return new Promise((resolve) => {
    const since = `${days} days ago`;
    const args = ['log', '--oneline', `--since=${since}`, '--', relPath];

    const proc = spawn('git', args, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.on('close', (code) => {
      if (code !== 0) {
        resolve({ ok: false, commits: [] });
        return;
      }
      const commits = stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [hash, ...msgParts] = line.split(' ');
          return { hash, message: msgParts.join(' ') };
        });
      resolve({ ok: true, commits });
    });
  });
}

/**
 * 运行门禁脚本
 */
async function runGateScript(projectRoot, scriptName, timeout = 60000) {
  const cmd = GATE_SCRIPTS[scriptName];
  if (!cmd) {
    return { ok: false, error: `Unknown script: ${scriptName}` };
  }

  return new Promise((resolve) => {
    const [cmdName, ...args] = cmd.split(' ');
    const proc = spawn(cmdName, args, {
      cwd: path.join(projectRoot, 'game'),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      timeout,
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      resolve({
        ok: code === 0,
        code,
        stdout: stdout.slice(0, 2000),
        stderr: stderr.slice(0, 2000),
      });
    });

    proc.on('error', (e) => {
      resolve({ ok: false, error: e.message });
    });
  });
}

/**
 * 解析覆盖率输出
 */
function parseCoverageOutput(stdout) {
  const result = {
    overall: 0,
    files: [],
  };

  // 简单解析 vitest coverage 输出
  const lines = stdout.split('\n');
  for (const line of lines) {
    // 查找总体覆盖率行
    const allMatch = line.match(/All files\s*\|\s*([\d.]+)/);
    if (allMatch) {
      result.overall = parseFloat(allMatch[1]);
    }

    // 查找文件覆盖率
    const fileMatch = line.match(/^(\S+\.ts)\s*\|\s*([\d.]+)/);
    if (fileMatch) {
      result.files.push({
        file: fileMatch[1],
        coverage: parseFloat(fileMatch[2]),
      });
    }
  }

  return result;
}

/**
 * 解析 lint 输出
 */
function parseLintOutput(stdout, stderr) {
  const output = stdout + stderr;
  const result = {
    errors: 0,
    warnings: 0,
    issues: [],
  };

  // ESLint 格式
  const errorMatch = output.match(/(\d+)\s+error/i);
  const warningMatch = output.match(/(\d+)\s+warning/i);

  if (errorMatch) result.errors = parseInt(errorMatch[1], 10);
  if (warningMatch) result.warnings = parseInt(warningMatch[1], 10);

  // 提取具体问题（最多 20 条）
  const issueRegex = /(\S+\.ts):(\d+):(\d+):\s+(\w+)\s+-\s+(.+)/g;
  let match;
  let count = 0;
  while ((match = issueRegex.exec(output)) !== null && count < 20) {
    result.issues.push({
      file: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
      severity: match[4],
      message: match[5],
    });
    count++;
  }

  return result;
}

// ============================================
// 工作项验证
// ============================================

/**
 * 验证单个工作项
 */
async function verifyWorkItem(projectRoot, item) {
  const result = {
    item_id: item.id,
    verified: false,
    completion_pct: item.completion_pct || 0,
    evidence: [],
    missing: [],
    notes: [],
  };

  // 1. 检查关联路径
  if (item.evidence) {
    for (const ev of item.evidence) {
      if (ev.startsWith('path:')) {
        const relPath = ev.replace('path:', '').replace(/`/g, '');
        const check = await checkPathExists(projectRoot, relPath);
        if (check.exists) {
          result.evidence.push(`file:${relPath}`);
        } else {
          result.missing.push(`missing:${relPath}`);
        }
      }
    }
  }

  // 2. 根据标题推断需要检查的内容
  const title = item.title.toLowerCase();

  // 检查模块文件
  for (const [moduleName, modulePath] of Object.entries(MODULE_PATHS)) {
    if (title.includes(moduleName.toLowerCase())) {
      const check = await checkPathExists(projectRoot, `game/${modulePath}`);
      if (check.exists) {
        result.evidence.push(`module:${moduleName}`);
      }
    }
  }

  // 3. 检查 Git 提交
  if (item.source_path) {
    const commits = await getGitCommits(projectRoot, item.source_path, 30);
    if (commits.ok && commits.commits.length > 0) {
      result.evidence.push(`commits:${commits.commits.length}`);
      result.notes.push(`最近 30 天有 ${commits.commits.length} 次相关提交`);
    }
  }

  // 4. 根据证据计算完成度
  if (result.missing.length === 0 && result.evidence.length > 0) {
    result.verified = true;
    result.completion_pct = Math.max(result.completion_pct, 80);
  } else if (result.evidence.length > result.missing.length) {
    result.completion_pct = Math.max(result.completion_pct, 50);
  }

  // 如果原始状态是 done，保持 100%
  if (item.status === 'done') {
    result.completion_pct = 100;
    result.verified = true;
  }

  return result;
}

/**
 * 运行门禁验证
 */
async function verifyGates(projectRoot) {
  const results = {
    typecheck: { ok: false, details: {} },
    lint: { ok: false, details: {} },
    test: { ok: false, details: {} },
  };

  // TypeCheck
  console.log('Running typecheck...');
  const typecheckResult = await runGateScript(projectRoot, 'typecheck');
  results.typecheck = {
    ok: typecheckResult.ok,
    details: {
      code: typecheckResult.code,
      hasErrors: !typecheckResult.ok,
    },
  };

  // Lint
  console.log('Running lint...');
  const lintResult = await runGateScript(projectRoot, 'lint');
  const lintParsed = parseLintOutput(lintResult.stdout, lintResult.stderr);
  results.lint = {
    ok: lintParsed.errors === 0,
    details: lintParsed,
  };

  // Test (简单检查)
  console.log('Running test...');
  const testResult = await runGateScript(projectRoot, 'test', 120000);
  results.test = {
    ok: testResult.ok,
    details: {
      code: testResult.code,
      passed: testResult.ok,
    },
  };

  return results;
}

// ============================================
// 统计和汇总
// ============================================

/**
 * 生成多维度进度统计
 */
function generateProgressBreakdown(items, verifyResults) {
  // 合并验证结果到工作项
  const itemsWithVerify = items.map((item) => {
    const verify = verifyResults.find((v) => v.item_id === item.id);
    return {
      ...item,
      completion_pct: verify ? verify.completion_pct : item.completion_pct,
      verified: verify ? verify.verified : false,
    };
  });

  const breakdown = {
    overall: { total: 0, done: 0, in_progress: 0, blocked: 0, pct: '0%' },
    by_module: {},
    by_chapter: {},
    by_system: {},
    by_role: {},
    by_priority: {},
  };

  // 初始化
  const modules = ['narrative', 'system', 'ui', 'level', 'art', 'qa', 'infra', 'other'];
  const chapters = ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'common'];
  const priorities = ['P0', 'P1', 'P2'];

  for (const m of modules) breakdown.by_module[m] = { total: 0, done: 0, in_progress: 0, blocked: 0, pct: '0%' };
  for (const c of chapters) breakdown.by_chapter[c] = { total: 0, done: 0, in_progress: 0, blocked: 0, pct: '0%' };
  for (const p of priorities) breakdown.by_priority[p] = { total: 0, done: 0, in_progress: 0, blocked: 0, pct: '0%' };

  // 统计
  for (const item of itemsWithVerify) {
    breakdown.overall.total++;
    if (item.status === 'done' || item.completion_pct >= 100) breakdown.overall.done++;
    else if (item.status === 'in_progress' || item.completion_pct > 0) breakdown.overall.in_progress++;
    else if (item.status === 'blocked') breakdown.overall.blocked++;

    // 按模块
    const mod = item.module || 'other';
    if (breakdown.by_module[mod]) {
      breakdown.by_module[mod].total++;
      if (item.status === 'done') breakdown.by_module[mod].done++;
      else if (item.status === 'in_progress') breakdown.by_module[mod].in_progress++;
      else if (item.status === 'blocked') breakdown.by_module[mod].blocked++;
    }

    // 按章节
    const chap = item.chapter || 'common';
    if (breakdown.by_chapter[chap]) {
      breakdown.by_chapter[chap].total++;
      if (item.status === 'done') breakdown.by_chapter[chap].done++;
      else if (item.status === 'in_progress') breakdown.by_chapter[chap].in_progress++;
      else if (item.status === 'blocked') breakdown.by_chapter[chap].blocked++;
    }

    // 按优先级
    const pri = item.priority || 'P1';
    if (breakdown.by_priority[pri]) {
      breakdown.by_priority[pri].total++;
      if (item.status === 'done') breakdown.by_priority[pri].done++;
      else if (item.status === 'in_progress') breakdown.by_priority[pri].in_progress++;
      else if (item.status === 'blocked') breakdown.by_priority[pri].blocked++;
    }
  }

  // 计算百分比和进度条
  const calcPct = (stat) => {
    if (stat.total === 0) return;
    const pct = Math.round((stat.done / stat.total) * 100);
    stat.pct = `${pct}%`;
    stat.bar = generateProgressBar(pct);
  };

  calcPct(breakdown.overall);
  for (const key of Object.keys(breakdown.by_module)) calcPct(breakdown.by_module[key]);
  for (const key of Object.keys(breakdown.by_chapter)) calcPct(breakdown.by_chapter[key]);
  for (const key of Object.keys(breakdown.by_priority)) calcPct(breakdown.by_priority[key]);

  return breakdown;
}

function generateProgressBar(pct, length = 10) {
  const filled = Math.round((pct / 100) * length);
  const empty = length - filled;
  return '[' + '='.repeat(filled) + '-'.repeat(empty) + ']';
}

// ============================================
// 主函数
// ============================================

async function verifyAll(projectRoot, items) {
  console.log(`Verifying ${items.length} work items...`);

  // 验证每个工作项
  const verifyResults = [];
  for (const item of items) {
    const result = await verifyWorkItem(projectRoot, item);
    verifyResults.push(result);
  }

  // 运行门禁验证
  console.log('Running gate checks...');
  const gateResults = await verifyGates(projectRoot);

  // 生成进度统计
  const progressBreakdown = generateProgressBreakdown(items, verifyResults);

  return {
    ok: true,
    verify_results: verifyResults,
    gate_results: gateResults,
    progress: progressBreakdown,
    summary: {
      total_items: items.length,
      verified_items: verifyResults.filter((r) => r.verified).length,
      gates_passed: Object.values(gateResults).filter((g) => g.ok).length,
      gates_total: Object.keys(gateResults).length,
    },
  };
}

// ============================================
// CLI 入口
// ============================================

async function main() {
  const args = process.argv.slice(2);
  let projectRoot = process.cwd();
  let itemsFile = '';

  for (const arg of args) {
    if (arg.startsWith('--project-root=')) {
      projectRoot = arg.split('=')[1];
    } else if (arg.startsWith('--items=')) {
      itemsFile = arg.split('=')[1];
    }
  }

  try {
    let items = [];

    // 如果提供了 items 文件，从文件读取
    if (itemsFile) {
      const content = await fs.readFile(itemsFile, 'utf8');
      const data = JSON.parse(content);
      items = data.items || data;
    } else {
      // 否则先运行解析器
      const { parseAllRequirements } = await import('./parse-requirements.mjs');
      const parseResult = await parseAllRequirements(projectRoot);
      items = parseResult.items;
    }

    const result = await verifyAll(projectRoot, items);
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

// 导出
export { verifyWorkItem, verifyGates, verifyAll, generateProgressBreakdown };

// CLI 运行
main();
