#!/usr/bin/env node
/**
 * ai-progress-assessment.mjs - 使用 cursor-agent 进行 AI 项目进度综合评估
 * 
 * 功能：
 * - 汇总项目进度数据
 * - 生成评估提示词
 * - 调用 cursor-agent 执行分析
 * - 解析 AI 输出并保存结果
 * 
 * 用法：
 *   node ai-progress-assessment.mjs --project-root=/path/to/project --data-file=/path/to/data.json --output=/path/to/output.json
 */

import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置
const CONFIG = {
  cursorAgent: process.env.CURSOR_AGENT || `${process.env.HOME}/.local/bin/cursor-agent`,
  model: process.env.AI_MODEL || 'gpt-5.2-high',
  promptTemplate: path.join(__dirname, 'prompts', 'progress-assessment.md'),
};

// 模块名称映射
const MODULE_NAMES = {
  narrative: '叙事',
  system: '系统',
  ui: 'UI',
  level: '关卡',
  art: '美术',
  qa: 'QA',
  infra: '基础设施',
  other: '其他',
};

// 章节名称映射
const CHAPTER_NAMES = {
  C0: '序章',
  C1: '第一章',
  C2: '第二章',
  C3: '第三章',
  C4: '第四章',
  C5: '终章',
  common: '通用',
};

/**
 * 格式化工作项统计
 */
function formatWorkItemsStats(breakdown) {
  const overall = breakdown?.overall || { total: 0, done: 0, in_progress: 0, blocked: 0 };
  return `
总工作项: ${overall.total}
- 已完成: ${overall.done} (${overall.pct || '0%'})
- 进行中: ${overall.in_progress}
- 阻塞: ${overall.blocked}
- 待处理: ${overall.total - overall.done - overall.in_progress - overall.blocked}
`.trim();
}

/**
 * 格式化模块进度
 */
function formatModuleProgress(breakdown) {
  const byModule = breakdown?.by_module || {};
  const lines = ['| 模块 | 完成/总数 | 进度 |', '|------|----------|------|'];
  
  for (const [key, stat] of Object.entries(byModule)) {
    if (stat.total > 0) {
      const name = MODULE_NAMES[key] || key;
      lines.push(`| ${name} | ${stat.done}/${stat.total} | ${stat.pct || '0%'} |`);
    }
  }
  
  return lines.length > 2 ? lines.join('\n') : '（无数据）';
}

/**
 * 格式化章节进度
 */
function formatChapterProgress(breakdown) {
  const byChapter = breakdown?.by_chapter || {};
  const lines = ['| 章节 | 完成/总数 | 进度 |', '|------|----------|------|'];
  
  for (const [key, stat] of Object.entries(byChapter)) {
    if (stat.total > 0) {
      const name = CHAPTER_NAMES[key] || key;
      lines.push(`| ${name} | ${stat.done}/${stat.total} | ${stat.pct || '0%'} |`);
    }
  }
  
  return lines.length > 2 ? lines.join('\n') : '（无数据）';
}

/**
 * 格式化优先级进度
 */
function formatPriorityProgress(breakdown) {
  const byPriority = breakdown?.by_priority || {};
  const lines = ['| 优先级 | 完成/总数 | 进度 |', '|--------|----------|------|'];
  
  for (const [key, stat] of Object.entries(byPriority)) {
    if (stat.total > 0) {
      lines.push(`| ${key} | ${stat.done}/${stat.total} | ${stat.pct || '0%'} |`);
    }
  }
  
  return lines.length > 2 ? lines.join('\n') : '（无数据）';
}

/**
 * 格式化审查汇总
 */
function formatReviewSummary(reviews) {
  if (!reviews) return '（无审查数据）';
  
  const lines = [];
  
  if (reviews.code_reviews) {
    lines.push(`代码审查: ${reviews.code_reviews.passed}/${reviews.code_reviews.count} 通过，均分 ${reviews.code_reviews.avg_score || '-'}`);
  }
  if (reviews.design_reviews) {
    lines.push(`设计审查: ${reviews.design_reviews.passed}/${reviews.design_reviews.count} 通过，均分 ${reviews.design_reviews.avg_score || '-'}`);
  }
  if (reviews.qa_signoffs) {
    lines.push(`QA签字: ${reviews.qa_signoffs.passed}/${reviews.qa_signoffs.count} 通过`);
  }
  
  return lines.length > 0 ? lines.join('\n') : '（无审查数据）';
}

/**
 * 生成评估提示词
 */
async function generatePrompt(data) {
  const template = await fs.readFile(CONFIG.promptTemplate, 'utf8');
  
  return template
    .replace('{{WORK_ITEMS_STATS}}', formatWorkItemsStats(data.progress))
    .replace('{{MODULE_PROGRESS}}', formatModuleProgress(data.progress))
    .replace('{{CHAPTER_PROGRESS}}', formatChapterProgress(data.progress))
    .replace('{{PRIORITY_PROGRESS}}', formatPriorityProgress(data.progress))
    .replace('{{PERIOD_DAYS}}', String(data.period_days || 7))
    .replace('{{TASKPACKS_COUNT}}', String(data.scan_summary?.pending?.taskpacks || 0))
    .replace('{{SPECS_COUNT}}', String(data.scan_summary?.pending?.specs || 0))
    .replace('{{COMMITS_COUNT}}', String(data.scan_summary?.pending?.commits || 0))
    .replace('{{REVIEWS_COUNT}}', String(data.scan_summary?.existing_reviews || 0))
    .replace('{{REVIEW_SUMMARY}}', formatReviewSummary(data.reviews));
}

/**
 * 调用 cursor-agent 执行分析
 */
async function runCursorAgent(prompt, projectRoot) {
  console.error('[ai-progress-assessment] Calling cursor-agent...');

  return new Promise((resolve, reject) => {
    const proc = spawn(CONFIG.cursorAgent, [
      '--print',
      '--force',
      '--approve-mcps',
      '--output-format', 'text',
      '--model', CONFIG.model,
      prompt,
    ], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });

    proc.on('error', (err) => {
      reject(err);
    });

    // 超时处理 (10分钟，综合评估较复杂)
    setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('cursor-agent timeout'));
    }, 600000);
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
      console.error('[ai-progress-assessment] Failed to parse JSON from code block:', e.message);
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
    console.error('[ai-progress-assessment] Failed to parse JSON:', e.message);
  }

  // 返回默认结果
  return {
    scores: {
      completeness: 70,
      code_quality: 70,
      test_coverage: 70,
      doc_sync: 70,
      progress_health: 70,
    },
    total_score: 70,
    grade: 'C',
    risks: [],
    blockers: [],
    highlights: [],
    recommendations: [],
    decision: 'PROCEED_WITH_CAUTION',
    summary: 'AI 分析结果解析失败，使用默认评分',
    _raw_output: output.slice(0, 1000),
    _parse_error: true,
  };
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
  const dataFile = getArg('data-file', '');
  const outputPath = getArg('output', '');
  const auditId = getArg('audit-id', `AUDIT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`);

  console.error(`[ai-progress-assessment] Project: ${projectRoot}`);
  console.error(`[ai-progress-assessment] Data file: ${dataFile}`);
  console.error(`[ai-progress-assessment] Audit ID: ${auditId}`);

  // 1. 读取数据
  let data = {};
  if (dataFile) {
    try {
      const content = await fs.readFile(dataFile, 'utf8');
      data = JSON.parse(content);
    } catch (err) {
      console.error(`[ai-progress-assessment] Failed to read data file: ${err.message}`);
    }
  }

  // 2. 生成提示词
  console.error('[ai-progress-assessment] Generating prompt...');
  const prompt = await generatePrompt(data);

  // 3. 调用 AI 分析
  let aiResult;
  try {
    const agentResult = await runCursorAgent(prompt, projectRoot);
    console.error(`[ai-progress-assessment] cursor-agent exit code: ${agentResult.code}`);
    
    if (agentResult.stderr) {
      console.error('[ai-progress-assessment] stderr:', agentResult.stderr.slice(0, 500));
    }

    aiResult = parseAIOutput(agentResult.stdout);
  } catch (err) {
    console.error('[ai-progress-assessment] AI analysis failed:', err.message);
    aiResult = {
      scores: {
        completeness: 70,
        code_quality: 70,
        test_coverage: 70,
        doc_sync: 70,
        progress_health: 70,
      },
      total_score: 70,
      grade: 'C',
      risks: [],
      blockers: [],
      highlights: [],
      recommendations: [],
      decision: 'PROCEED_WITH_CAUTION',
      summary: `AI 分析失败: ${err.message}`,
      _error: err.message,
    };
  }

  // 4. 构建最终结果
  const result = {
    audit_id: auditId,
    assessment_type: 'ai_progress',
    scores: aiResult.scores || {},
    total_score: aiResult.total_score || 70,
    grade: aiResult.grade || 'C',
    risks: aiResult.risks || [],
    blockers: aiResult.blockers || [],
    highlights: aiResult.highlights || [],
    recommendations: aiResult.recommendations || [],
    decision: aiResult.decision || 'PROCEED_WITH_CAUTION',
    summary: aiResult.summary || '',
    assessor: 'AI (cursor-agent)',
    model: CONFIG.model,
    completed_at: new Date().toISOString(),
  };

  // 5. 输出结果
  const outputJson = JSON.stringify(result, null, 2);

  if (outputPath) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, outputJson, 'utf8');
    console.error(`[ai-progress-assessment] Result saved to: ${outputPath}`);
  }

  console.log(outputJson);
}

// 导出
export { generatePrompt, parseAIOutput, formatWorkItemsStats, formatModuleProgress, formatChapterProgress };

// 运行
main().catch(err => {
  console.error('[ai-progress-assessment] Fatal error:', err);
  process.exit(1);
});
