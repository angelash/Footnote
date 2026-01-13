#!/usr/bin/env node
/**
 * run-audit.mjs - 独立的审核执行器
 * 
 * 绕过 wsl-runner 服务，直接运行 FlowRunner
 * 适合长时间运行的 AI 审核任务
 * 
 * 用法:
 *   node run-audit.mjs [options]
 * 
 * 选项:
 *   --ai              启用 AI 代码审查和设计审查
 *   --period=N        审核周期（天数，默认 7）
 *   --scope=SCOPE     审核范围（all/milestone/chapter，默认 all）
 *   --output=DIR      输出目录（默认 automation_runs）
 */

import { createFlowRunner } from '../../reusable/n8n-common/wsl-runner/lib/v2/index.mjs';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = '/mnt/f/workspace/github/Footnote';

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    ai: false,
    period: 7,
    scope: 'all',
    output: join(projectRoot, 'workflows/project/logs/automation_runs'),
  };

  for (const arg of args) {
    if (arg === '--ai') {
      options.ai = true;
    } else if (arg.startsWith('--period=')) {
      options.period = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--scope=')) {
      options.scope = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
用法: node run-audit.mjs [options]

选项:
  --ai              启用 AI 代码审查和设计审查
  --period=N        审核周期（天数，默认 7）
  --scope=SCOPE     审核范围（all/milestone/chapter，默认 all）
  --output=DIR      输出目录

示例:
  node run-audit.mjs                    # 简单审核
  node run-audit.mjs --ai               # 带 AI 分析
  node run-audit.mjs --ai --period=30   # 30 天 AI 审核
`);
      process.exit(0);
    }
  }

  return options;
}

// 生成 Run ID
function generateRunId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  const rand = Math.random().toString(36).slice(2, 6);
  return `RUN-${date}-${time}-${rand}`;
}

// 格式化耗时
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

async function main() {
  const options = parseArgs();
  const runId = generateRunId();
  const runDir = join(options.output, runId);

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              独立审核执行器 (run-audit.mjs)                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Run ID:     ${runId}`);
  console.log(`AI 分析:    ${options.ai ? '✓ 启用' : '✗ 禁用'}`);
  console.log(`审核周期:   ${options.period} 天`);
  console.log(`审核范围:   ${options.scope}`);
  console.log(`输出目录:   ${runDir}`);
  console.log('');

  // 创建输出目录
  mkdirSync(runDir, { recursive: true });

  // 读取 FlowSpec
  const flowSpecPath = join(projectRoot, 'workflows/reusable/pipeline-sys/v2-design/examples/l0-audit-intake.flowspec.json');
  const flowSpec = JSON.parse(readFileSync(flowSpecPath, 'utf8'));

  console.log(`FlowSpec:   ${flowSpec.name} v${flowSpec.version}`);
  console.log(`节点数量:   ${flowSpec.nodes.length}`);
  console.log('');

  // 创建 artifact writer
  const artifactWriter = async (name, data) => {
    const filePath = join(runDir, name);
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  [artifact] ${name}`);
  };

  // 创建 FlowRunner
  const runner = createFlowRunner({
    runId,
    runDir,
    artifactWriter,
    emitEvents: true,
    queueManager: null, // 不使用队列管理器
  });

  // 监听事件
  let nodeCount = 0;
  runner.on('node_started', ({ nodeId }) => {
    nodeCount++;
    process.stdout.write(`\r  [${nodeCount}/${flowSpec.nodes.length}] 执行: ${nodeId}...`);
  });

  runner.on('node_finished', ({ nodeId, status }) => {
    const icon = status === 'SUCCESS' ? '✓' : status === 'FAILED' ? '✗' : '○';
    console.log(`\r  [${icon}] ${nodeId}: ${status}                    `);
  });

  // 输入参数
  const inputs = {
    project_root: projectRoot,
    audit_scope: options.scope,
    period_days: options.period,
    include_code_review: options.ai,
    include_design_review: options.ai,
    include_qa_signoff: false,
    auto_trigger_missing: false,
    requester: 'run-audit-cli',
  };

  console.log('─'.repeat(60));
  console.log('开始执行...');
  console.log('');

  const startTime = Date.now();

  try {
    const result = await runner.run(flowSpec, inputs);
    const duration = Date.now() - startTime;

    console.log('');
    console.log('─'.repeat(60));
    console.log('');

    if (result.status === 'SUCCESS') {
      console.log(`✅ 审核完成！`);
      console.log(`   状态:     ${result.status}`);
      console.log(`   耗时:     ${formatDuration(duration)}`);
      console.log(`   输出目录: ${runDir}`);

      // 检查并显示报告
      const auditId = result.output?.intake?.audit_id;
      if (auditId) {
        const progressReport = join(projectRoot, `workflows/project/logs/audits/${auditId}-progress.md`);
        if (existsSync(progressReport)) {
          console.log(`   进度报告: ${progressReport}`);
        }
      }
    } else {
      console.log(`❌ 审核失败`);
      console.log(`   状态:     ${result.status}`);
      console.log(`   错误:     ${result.error || '未知错误'}`);
      console.log(`   耗时:     ${formatDuration(duration)}`);
    }

    console.log('');

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('');
    console.log('─'.repeat(60));
    console.log('');
    console.log(`❌ 执行异常: ${error.message}`);
    console.log(`   耗时: ${formatDuration(duration)}`);
    console.log('');
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('\n[FATAL] Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

main();
