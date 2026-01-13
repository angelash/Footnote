#!/usr/bin/env node
/**
 * ai-code-review.mjs - 使用 cursor-agent 进行 AI 代码审查
 * 
 * 功能：
 * - 支持审查范围配置（profile）
 * - 支持标注跳过已处理的问题
 * - 收集代码变更信息
 * - 生成审查提示词
 * - 调用 cursor-agent 执行分析
 * - 解析 AI 输出并保存结果
 * 
 * 用法：
 *   node ai-code-review.mjs --project-root=/path/to/project --commit-range="HEAD~5..HEAD" --output=/path/to/output.json --profile=game-product
 */

import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getProfile, filterFiles, getCommitFilter } from './profile-loader.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置
const CONFIG = {
  cursorAgent: process.env.CURSOR_AGENT || `${process.env.HOME}/.local/bin/cursor-agent`,
  model: process.env.AI_MODEL || 'opus-4.5',
  maxDiffLines: 500,
  maxFileCount: 20,
  promptTemplate: path.join(__dirname, 'prompts', 'code-review.md'),
};

/**
 * 执行 shell 命令
 */
async function exec(command, cwd) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const proc = spawn(cmd, args, {
      cwd,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        resolve({ stdout, stderr, code }); // 不 reject，让调用者处理
      }
    });

    proc.on('error', reject);
  });
}

/**
 * 获取变更文件列表（支持 profile 过滤）
 */
async function getChangedFiles(projectRoot, commitRange, profile = null) {
  // 构建命令，可选添加路径过滤
  let command = `git diff --name-only ${commitRange}`;
  const commitFilter = profile ? getCommitFilter(profile) : '';
  if (commitFilter) {
    command += ` -- ${commitFilter}`;
  }
  
  const result = await exec(command, projectRoot);
  if (result.code !== 0) {
    console.error('Failed to get changed files:', result.stderr);
    return [];
  }
  
  let files = result.stdout.trim().split('\n').filter(Boolean);
  
  // 应用 profile 路径过滤
  if (profile) {
    files = filterFiles(files, profile);
    console.error(`[ai-code-review] Profile filter: ${files.length} files after filtering`);
  }
  
  return files.slice(0, CONFIG.maxFileCount);
}

/**
 * 获取代码差异
 */
async function getDiffContent(projectRoot, commitRange) {
  const result = await exec(`git diff ${commitRange} --unified=3`, projectRoot);
  if (result.code !== 0) {
    console.error('Failed to get diff:', result.stderr);
    return '';
  }
  
  const lines = result.stdout.split('\n');
  if (lines.length > CONFIG.maxDiffLines) {
    return lines.slice(0, CONFIG.maxDiffLines).join('\n') + '\n\n... (truncated)';
  }
  return result.stdout;
}

/**
 * 生成审查提示词
 */
async function generatePrompt(changedFiles, diffContent) {
  const template = await fs.readFile(CONFIG.promptTemplate, 'utf8');
  
  return template
    .replace('{{CHANGED_FILES}}', changedFiles.join('\n'))
    .replace('{{DIFF_CONTENT}}', diffContent);
}

/**
 * 调用 cursor-agent 执行分析
 */
async function runCursorAgent(prompt, projectRoot) {
  console.error('[ai-code-review] Calling cursor-agent via stdin...');

  return new Promise((resolve, reject) => {
    const proc = spawn(CONFIG.cursorAgent, [
      '--model', CONFIG.model,
    ], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      console.error(`[ai-code-review] cursor-agent exited with code ${code}`);
      resolve({ stdout, stderr, code });
    });

    proc.on('error', (err) => {
      reject(err);
    });

    // 发送提示词到 stdin 并关闭
    proc.stdin.write(prompt);
    proc.stdin.end();

    // 超时处理 (3分钟)
    setTimeout(() => {
      console.error('[ai-code-review] cursor-agent timeout, killing...');
      proc.kill('SIGTERM');
      resolve({ stdout, stderr: 'timeout', code: -1 });
    }, 180000);
  });
}

/**
 * 解析 AI 输出中的 JSON
 */
function parseAIOutput(output) {
  // 尝试提取 JSON 块
  const jsonMatch = output.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error('[ai-code-review] Failed to parse JSON from code block:', e.message);
    }
  }

  // 尝试直接解析
  try {
    // 查找第一个 { 和最后一个 }
    const start = output.indexOf('{');
    const end = output.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(output.slice(start, end + 1));
    }
  } catch (e) {
    console.error('[ai-code-review] Failed to parse JSON:', e.message);
  }

  // 返回默认结果
  return {
    scores: { logic: 70, style: 70, security: 70, performance: 70, maintainability: 70 },
    issues: [],
    summary: 'AI 分析结果解析失败，使用默认评分',
    recommendations: ['请检查 AI 输出日志'],
    _raw_output: output.slice(0, 1000),
    _parse_error: true,
  };
}

/**
 * 计算综合评分
 */
function calculateTotalScore(scores) {
  const weights = {
    logic: 0.30,
    style: 0.20,
    security: 0.25,
    performance: 0.15,
    maintainability: 0.10,
  };

  let total = 0;
  for (const [dim, weight] of Object.entries(weights)) {
    total += (scores[dim] || 70) * weight;
  }
  return Math.round(total);
}

/**
 * 加载历史标注
 */
async function loadAnnotations(projectRoot, auditId) {
  if (!auditId) return { annotations: [], skip_rules: [] };
  
  // 尝试从审核目录加载标注
  const annotationsPath = path.join(projectRoot, 'workflows/project/logs/audits', auditId, 'annotations.json');
  try {
    const content = await fs.readFile(annotationsPath, 'utf8');
    return JSON.parse(content);
  } catch {
    // 没有标注文件
    return { annotations: [], skip_rules: [] };
  }
}

/**
 * 检查问题是否应该跳过（基于标注）
 */
function shouldSkipIssue(issue, annotations) {
  const { annotations: anns = [], skip_rules = [] } = annotations;
  
  // 检查是否有 dismissed/wontfix 标注
  for (const ann of anns) {
    if (ann.status === 'dismissed' || ann.status === 'wontfix') {
      const target = ann.target || {};
      // 匹配文件和行号
      if (target.file === issue.file && target.line === issue.line) {
        return { skip: true, reason: ann.status, annotation_id: ann.id };
      }
      // 匹配描述
      if (target.description_contains && issue.description?.includes(target.description_contains)) {
        return { skip: true, reason: ann.status, annotation_id: ann.id };
      }
    }
  }
  
  // 检查跳过规则
  for (const rule of skip_rules) {
    if (rule.expires_at && new Date(rule.expires_at) < new Date()) continue;
    
    const pattern = rule.pattern || {};
    let matches = true;
    
    if (pattern.file && !matchGlobPattern(issue.file, pattern.file)) {
      matches = false;
    }
    if (pattern.description_contains && !issue.description?.includes(pattern.description_contains)) {
      matches = false;
    }
    
    if (matches) {
      return { skip: true, reason: 'skip_rule', rule_id: rule.id };
    }
  }
  
  return { skip: false };
}

/**
 * 简单的 glob 匹配
 */
function matchGlobPattern(str, pattern) {
  const regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*');
  return new RegExp(regex).test(str);
}

/**
 * 过滤已标注的问题
 */
function filterAnnotatedIssues(issues, annotations) {
  const filtered = [];
  const skipped = [];
  
  for (const issue of issues) {
    const skipResult = shouldSkipIssue(issue, annotations);
    if (skipResult.skip) {
      skipped.push({
        original_issue: issue,
        skip_reason: skipResult.reason,
        annotation_id: skipResult.annotation_id,
        rule_id: skipResult.rule_id,
      });
    } else {
      filtered.push(issue);
    }
  }
  
  return { issues: filtered, skipped_issues: skipped };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  // 解析参数
  const getArg = (name, defaultValue = '') => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };

  const projectRoot = getArg('project-root', process.cwd());
  const commitRange = getArg('commit-range', 'HEAD~5..HEAD');
  const outputPath = getArg('output', '');
  const taskId = getArg('task-id', `CR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`);
  const profileName = getArg('profile', 'all');
  const previousAuditId = getArg('previous-audit', '');

  console.error(`[ai-code-review] Project: ${projectRoot}`);
  console.error(`[ai-code-review] Commit range: ${commitRange}`);
  console.error(`[ai-code-review] Task ID: ${taskId}`);
  console.error(`[ai-code-review] Profile: ${profileName}`);

  // 0. 加载配置和历史标注
  const profile = await getProfile(profileName);
  console.error(`[ai-code-review] Using profile: ${profile.name}`);
  
  const annotations = await loadAnnotations(projectRoot, previousAuditId);
  if (annotations.annotations?.length > 0 || annotations.skip_rules?.length > 0) {
    console.error(`[ai-code-review] Loaded ${annotations.annotations?.length || 0} annotations, ${annotations.skip_rules?.length || 0} skip rules`);
  }

  // 1. 收集变更信息（应用 profile 过滤）
  console.error('[ai-code-review] Collecting changes...');
  const changedFiles = await getChangedFiles(projectRoot, commitRange, profile);
  
  if (changedFiles.length === 0) {
    console.error('[ai-code-review] No changes found (after profile filter)');
    const result = {
      review_id: taskId,
      result: 'SKIPPED',
      reason: `No changes in commit range for profile '${profileName}'`,
      profile: profileName,
      completed_at: new Date().toISOString(),
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.error(`[ai-code-review] Found ${changedFiles.length} changed files`);

  const diffContent = await getDiffContent(projectRoot, commitRange);

  // 2. 生成提示词
  console.error('[ai-code-review] Generating prompt...');
  const prompt = await generatePrompt(changedFiles, diffContent);

  // 3. 调用 AI 分析
  let aiResult;
  try {
    const agentResult = await runCursorAgent(prompt, projectRoot);
    console.error(`[ai-code-review] cursor-agent exit code: ${agentResult.code}`);
    
    if (agentResult.stderr) {
      console.error('[ai-code-review] stderr:', agentResult.stderr.slice(0, 500));
    }

    aiResult = parseAIOutput(agentResult.stdout);
  } catch (err) {
    console.error('[ai-code-review] AI analysis failed:', err.message);
    aiResult = {
      scores: { logic: 70, style: 70, security: 70, performance: 70, maintainability: 70 },
      issues: [],
      summary: `AI 分析失败: ${err.message}`,
      recommendations: [],
      _error: err.message,
    };
  }

  // 4. 过滤已标注的问题
  const { issues: filteredIssues, skipped_issues } = filterAnnotatedIssues(
    aiResult.issues || [],
    annotations
  );
  
  if (skipped_issues.length > 0) {
    console.error(`[ai-code-review] Skipped ${skipped_issues.length} issues based on annotations`);
  }

  // 5. 构建最终结果
  const totalScore = calculateTotalScore(aiResult.scores || {});
  const passed = totalScore >= 70 && !filteredIssues.some(i => i.severity === 'blocker');

  const result = {
    review_id: taskId,
    task_id: taskId,
    result: passed ? 'APPROVED' : 'CHANGES_REQUESTED',
    score: totalScore,
    dimensions: aiResult.scores || {},
    issues: filteredIssues,
    skipped_issues: skipped_issues.length > 0 ? skipped_issues : undefined,
    summary: aiResult.summary || '',
    recommendations: aiResult.recommendations || [],
    reviewer: 'AI (cursor-agent)',
    model: CONFIG.model,
    profile: profileName,
    commit_range: commitRange,
    changed_files: changedFiles,
    completed_at: new Date().toISOString(),
  };

  // 6. 输出结果
  const outputJson = JSON.stringify(result, null, 2);

  if (outputPath) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, outputJson, 'utf8');
    console.error(`[ai-code-review] Result saved to: ${outputPath}`);
  }

  console.log(outputJson);
}

// 导出
export { getChangedFiles, getDiffContent, generatePrompt, parseAIOutput, calculateTotalScore };

// 运行
main().catch(err => {
  console.error('[ai-code-review] Fatal error:', err);
  process.exit(1);
});
