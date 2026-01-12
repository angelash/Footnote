#!/usr/bin/env node
/**
 * ai-design-review.mjs - 使用 cursor-agent 进行 AI 设计审查
 * 
 * 功能：
 * - 读取设计文档内容
 * - 生成审查提示词
 * - 调用 cursor-agent 执行分析
 * - 解析 AI 输出并保存结果
 * 
 * 用法：
 *   node ai-design-review.mjs --project-root=/path/to/project --doc-path=design/spec.md --output=/path/to/output.json
 */

import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置
const CONFIG = {
  cursorAgent: process.env.CURSOR_AGENT || `${process.env.HOME}/.local/bin/cursor-agent`,
  model: process.env.AI_MODEL || 'gpt-5.2',
  maxDocLength: 10000,
  promptTemplate: path.join(__dirname, 'prompts', 'design-review.md'),
};

/**
 * 推断文档类型
 */
function inferDocType(docPath) {
  const lowerPath = docPath.toLowerCase();
  
  if (lowerPath.includes('bible')) return 'bible';
  if (lowerPath.includes('spec')) return 'spec';
  if (lowerPath.includes('taskpack')) return 'taskpack';
  if (lowerPath.includes('charter')) return 'charter';
  if (lowerPath.includes('plan')) return 'plan';
  
  return 'document';
}

/**
 * 生成审查提示词
 */
async function generatePrompt(docPath, docContent, docType) {
  const template = await fs.readFile(CONFIG.promptTemplate, 'utf8');
  
  // 截断过长的文档
  let content = docContent;
  if (content.length > CONFIG.maxDocLength) {
    content = content.slice(0, CONFIG.maxDocLength) + '\n\n... (truncated)';
  }
  
  return template
    .replace('{{DOC_PATH}}', docPath)
    .replace('{{DOC_TYPE}}', docType)
    .replace('{{DOC_CONTENT}}', content);
}

/**
 * 调用 cursor-agent 执行分析
 */
async function runCursorAgent(prompt, projectRoot) {
  console.error('[ai-design-review] Calling cursor-agent via stdin...');

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
      console.error(`[ai-design-review] cursor-agent exited with code ${code}`);
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
      console.error('[ai-design-review] cursor-agent timeout, killing...');
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
      console.error('[ai-design-review] Failed to parse JSON from code block:', e.message);
    }
  }

  // 尝试直接解析
  try {
    const start = output.indexOf('{');
    const end = output.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(output.slice(start, end + 1));
    }
  } catch (e) {
    console.error('[ai-design-review] Failed to parse JSON:', e.message);
  }

  // 返回默认结果
  return {
    scores: { completeness: 70, consistency: 70, feasibility: 70, clarity: 70 },
    issues: [],
    missing_elements: [],
    inconsistencies: [],
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
    completeness: 0.30,
    consistency: 0.25,
    feasibility: 0.25,
    clarity: 0.20,
  };

  let total = 0;
  for (const [dim, weight] of Object.entries(weights)) {
    total += (scores[dim] || 70) * weight;
  }
  return Math.round(total);
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
  const docPath = getArg('doc-path', '');
  const outputPath = getArg('output', '');
  const taskId = getArg('task-id', `DR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`);

  if (!docPath) {
    console.error('[ai-design-review] --doc-path is required');
    process.exit(1);
  }

  console.error(`[ai-design-review] Project: ${projectRoot}`);
  console.error(`[ai-design-review] Document: ${docPath}`);
  console.error(`[ai-design-review] Task ID: ${taskId}`);

  // 1. 读取文档
  const fullDocPath = path.join(projectRoot, docPath);
  let docContent;
  try {
    docContent = await fs.readFile(fullDocPath, 'utf8');
  } catch (err) {
    console.error(`[ai-design-review] Failed to read document: ${err.message}`);
    const result = {
      review_id: taskId,
      doc_path: docPath,
      result: 'ERROR',
      error: `Failed to read document: ${err.message}`,
      completed_at: new Date().toISOString(),
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.error(`[ai-design-review] Document length: ${docContent.length} chars`);

  // 2. 推断文档类型
  const docType = inferDocType(docPath);
  console.error(`[ai-design-review] Document type: ${docType}`);

  // 3. 生成提示词
  console.error('[ai-design-review] Generating prompt...');
  const prompt = await generatePrompt(docPath, docContent, docType);

  // 4. 调用 AI 分析
  let aiResult;
  try {
    const agentResult = await runCursorAgent(prompt, projectRoot);
    console.error(`[ai-design-review] cursor-agent exit code: ${agentResult.code}`);
    
    if (agentResult.stderr) {
      console.error('[ai-design-review] stderr:', agentResult.stderr.slice(0, 500));
    }

    aiResult = parseAIOutput(agentResult.stdout);
  } catch (err) {
    console.error('[ai-design-review] AI analysis failed:', err.message);
    aiResult = {
      scores: { completeness: 70, consistency: 70, feasibility: 70, clarity: 70 },
      issues: [],
      missing_elements: [],
      inconsistencies: [],
      summary: `AI 分析失败: ${err.message}`,
      recommendations: [],
      _error: err.message,
    };
  }

  // 5. 构建最终结果
  const totalScore = calculateTotalScore(aiResult.scores || {});
  const hasBlocker = aiResult.issues?.some(i => i.severity === 'blocker');
  
  let resultStatus;
  if (hasBlocker) {
    resultStatus = 'REJECTED';
  } else if (totalScore >= 70) {
    resultStatus = 'APPROVED';
  } else {
    resultStatus = 'REVISION_REQUIRED';
  }

  const result = {
    review_id: taskId,
    doc_path: docPath,
    doc_type: docType,
    result: resultStatus,
    score: totalScore,
    dimensions: aiResult.scores || {},
    issues: aiResult.issues || [],
    missing_elements: aiResult.missing_elements || [],
    inconsistencies: aiResult.inconsistencies || [],
    suggestions: aiResult.recommendations || [],
    summary: aiResult.summary || '',
    reviewer: 'AI (cursor-agent)',
    model: CONFIG.model,
    completed_at: new Date().toISOString(),
  };

  // 6. 输出结果
  const outputJson = JSON.stringify(result, null, 2);

  if (outputPath) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, outputJson, 'utf8');
    console.error(`[ai-design-review] Result saved to: ${outputPath}`);
  }

  console.log(outputJson);
}

// 导出
export { generatePrompt, parseAIOutput, calculateTotalScore, inferDocType };

// 运行
main().catch(err => {
  console.error('[ai-design-review] Fatal error:', err);
  process.exit(1);
});
