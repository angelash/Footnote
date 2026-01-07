#!/usr/bin/env node
/**
 * Mermaid 预检（GitHub 渲染兼容性）
 *
 * 目标：
 * - 在本地/CI 提前发现 Mermaid code fence 中的常见渲染炸点
 * - 输出到“文件 + mermaid block 起始行 + 规则提示”，方便快速定位修复
 *
 * 说明：
 * - 本脚本默认是“轻量 lint”（零额外依赖），不会真正渲染 SVG。
 * - 可选 `--strict` 模式会尝试调用 `npx @mermaid-js/mermaid-cli` 做渲染预编译（需要网络/Chromium，较重）。
 *
 * 用法：
 *   node workflows/reusable/pipeline-sys/tools/validate-mermaid.mjs [paths...] [--strict]
 *
 * 例：
 *   node workflows/reusable/pipeline-sys/tools/validate-mermaid.mjs workflows/reusable/pipeline-sys
 *   node workflows/reusable/pipeline-sys/tools/validate-mermaid.mjs . --strict
 */

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const argv = process.argv.slice(2);
const strict = argv.includes('--strict');
const targets = argv.filter((a) => a !== '--strict');

const DEFAULT_TARGET = path.resolve(process.cwd(), 'workflows/reusable/pipeline-sys');
const scanTargets = targets.length > 0 ? targets.map((t) => path.resolve(process.cwd(), t)) : [DEFAULT_TARGET];

const IGNORE_DIR_NAMES = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.turbo', '.next']);

/**
 * @param {string} p
 */
async function statSafe(p) {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function walkMarkdown(dir) {
  /** @type {string[]} */
  const out = [];
  const st = await statSafe(dir);
  if (!st) return out;
  if (st.isFile()) {
    if (dir.toLowerCase().endsWith('.md')) out.push(dir);
    return out;
  }

  /** @type {string[]} */
  const stack = [dir];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (!cur) continue;
    const base = path.basename(cur);
    if (IGNORE_DIR_NAMES.has(base)) continue;

    let entries;
    try {
      entries = await fs.readdir(cur, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        if (!IGNORE_DIR_NAMES.has(ent.name)) stack.push(full);
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.md')) {
        out.push(full);
      }
    }
  }
  return out;
}

/**
 * @param {string} content
 * @returns {Array<{diagram: string; startLine: number; fenceStartIndex: number}>}
 */
function extractMermaidBlocks(content) {
  /** @type {Array<{diagram: string; startLine: number; fenceStartIndex: number}>} */
  const blocks = [];
  const re = /```mermaid\s*\r?\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const fenceStartIndex = m.index;
    const before = content.slice(0, fenceStartIndex);
    const startLine = before.split(/\r?\n/).length; // 1-based
    blocks.push({ diagram: m[1] ?? '', startLine, fenceStartIndex });
  }
  return blocks;
}

/**
 * 轻量规则：针对 GitHub Mermaid 常见“解析炸点”的启发式检查
 *
 * @param {string} diagram
 * @returns {string[]} issues
 */
function lintGithubMermaid(diagram) {
  /** @type {string[]} */
  const issues = [];

  // 1) label 中出现 ASCII 括号 ( )，且处于方括号 label 内：A[xxx(yyy)] / B[/xxx(yyy)/]
  //    GitHub Mermaid 经常在这里解析失败。建议：改为中文括号（ ）或去掉括号，并用引号包裹 label：A["xxx（yyy）"]
  const bracketLabelWithAsciiParens = /\[[^\]\r\n]*\([^\)\r\n]*\)[^\]\r\n]*\]/;
  if (bracketLabelWithAsciiParens.test(diagram)) {
    issues.push('检测到方括号 label 内含 ASCII 括号 ( )：建议用中文括号（ ）或去掉括号，并用 A["..."] 引号包裹 label');
  }

  // 2) label/文本里出现尖括号 <...>（常见于 <run_id>），GitHub 解析/渲染容易出问题
  //    注意：<br/> 是项目推荐写法，属于允许列表，不应报警
  const angleRe = /<[^>\r\n]+>/g;
  const angleMatches = diagram.match(angleRe) || [];
  const badAngles = angleMatches.filter((m) => {
    const t = m.trim().toLowerCase();
    return t !== '<br/>' && t !== '<br />' && t !== '<br>';
  });
  if (badAngles.length > 0) {
    const examples = badAngles.slice(0, 3).join(', ');
    issues.push(`检测到尖括号 <...>（例如 ${examples}）：建议改成 {run_id} 或 run_id，避免 GitHub Mermaid 解析异常`);
  }

  // 3) 对于 flowchart/graph，建议把含标点/空格的 label 统一改成引号包裹
  //    这里只做提醒：出现未引号包裹的 ( ) 形状语法不处理（那是 Mermaid 语法本身）
  if (/^\s*(flowchart|graph)\b/m.test(diagram)) {
    const hasBracketShape = /\w+\[[^\]]+\]/.test(diagram) || /\w+\(\([^\)]+\)\)/.test(diagram);
    if (hasBracketShape && !/\"\s*[^\"\r\n]+\"\s*\]/.test(diagram)) {
      issues.push('建议：对包含标点/空格的节点文本统一使用 A["..."]（GitHub 更稳定），避免未加引号导致的解析歧义');
    }
  }

  // 4) HTML <br/> OK，但某些旧解析器对 <br> 不稳定，这里仅提示
  if (/<br\s*>/i.test(diagram) && !/<br\s*\/>/i.test(diagram)) {
    issues.push('检测到 <br>：建议统一使用 <br/>（更稳）');
  }

  return issues;
}

/**
 * strict 模式：调用 mermaid-cli 预编译渲染（失败即报错）
 *
 * @param {string} diagram
 * @returns {Promise<{ok: boolean; error?: string}>}
 */
async function strictRender(diagram) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mermaid-validate-'));
  const inFile = path.join(tmpDir, 'diagram.mmd');
  const outFile = path.join(tmpDir, 'diagram.svg');
  await fs.writeFile(inFile, diagram, 'utf8');

  return await new Promise((resolve) => {
    const child = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['-y', '@mermaid-js/mermaid-cli', '-i', inFile, '-o', outFile],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );

    let stderr = '';
    child.stderr.on('data', (d) => (stderr += String(d)));

    child.on('close', (code) => {
      resolve(code === 0 ? { ok: true } : { ok: false, error: (stderr || `mmdc exit ${code}`).trim() });
    });
  });
}

/** @type {Array<{file: string; startLine: number; message: string; kind: 'error' | 'warn'}>} */
const findings = [];
let mermaidBlocksScanned = 0;

for (const target of scanTargets) {
  const mdFiles = await walkMarkdown(target);
  for (const file of mdFiles) {
    let content;
    try {
      content = await fs.readFile(file, 'utf8');
    } catch {
      continue;
    }

    const blocks = extractMermaidBlocks(content);
    for (const b of blocks) {
      mermaidBlocksScanned += 1;
      const issues = lintGithubMermaid(b.diagram);
      for (const issue of issues) {
        findings.push({ file, startLine: b.startLine, message: issue, kind: 'warn' });
      }

      if (strict) {
        const res = await strictRender(b.diagram);
        if (!res.ok) {
          findings.push({
            file,
            startLine: b.startLine,
            message: `strict 渲染失败：${res.error}`,
            kind: 'error'
          });
        }
      }
    }
  }
}

const errors = findings.filter((f) => f.kind === 'error');
const warns = findings.filter((f) => f.kind === 'warn');

if (errors.length === 0 && warns.length === 0) {
  if (mermaidBlocksScanned === 0) {
    console.log('[validate-mermaid] OK：未发现 Mermaid code fence');
  } else {
    console.log(`[validate-mermaid] OK：扫描 ${mermaidBlocksScanned} 个 Mermaid code fence，0 个错误，0 个警告`);
  }
  process.exit(0);
}

for (const f of findings) {
  const rel = path.relative(process.cwd(), f.file);
  const prefix = f.kind === 'error' ? 'ERROR' : 'WARN';
  console.log(`[validate-mermaid] ${prefix} ${rel}:${f.startLine} ${f.message}`);
}

if (errors.length > 0) {
  console.error(`[validate-mermaid] 失败：扫描 ${mermaidBlocksScanned} 个 Mermaid code fence，${errors.length} 个错误，${warns.length} 个警告`);
  process.exit(1);
}

console.log(`[validate-mermaid] 完成：扫描 ${mermaidBlocksScanned} 个 Mermaid code fence，0 个错误，${warns.length} 个警告`);
process.exit(0);


