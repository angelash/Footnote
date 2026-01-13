/**
 * Runner 问题诊断脚本
 * 
 * 测试：为什么 HTTP 触发的异步任务节点不执行
 */

import { createFlowRunner } from '../../reusable/n8n-common/wsl-runner/lib/v2/index.mjs';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// 自动检测项目根目录（统一使用相对路径计算）
const projectRoot = join(__dirname, '../../..').replace(/\\/g, '/');

// 读取 FlowSpec
const flowSpec = JSON.parse(readFileSync(
  join(projectRoot, 'workflows/reusable/pipeline-sys/v2-design/examples/l0-audit-intake.flowspec.json'),
  'utf8'
));

const runId = `DIAG-${Date.now()}`;
const runDir = join(projectRoot, 'workflows/project/logs/automation_runs', runId);
mkdirSync(runDir, { recursive: true });

console.log('=== Runner 诊断 ===');
console.log('Run ID:', runId);
console.log('');

// 模拟 Runner 的 artifactWriter
const artifactWriter = async (name, data) => {
  console.log(`[artifact] Writing ${name}`);
  const filePath = join(runDir, name);
  writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// 创建 FlowRunner（模拟 Runner 服务的方式）
const runner = createFlowRunner({
  runId,
  runDir,
  artifactWriter,
  emitEvents: true,
});

// 监听事件
let eventCount = 0;
runner.on('run_started', () => { console.log('[EVENT] run_started'); eventCount++; });
runner.on('run_finished', (d) => { console.log('[EVENT] run_finished:', d?.status); eventCount++; });
runner.on('node_started', (d) => { console.log('[EVENT] node_started:', d?.nodeId); eventCount++; });
runner.on('node_finished', (d) => { console.log('[EVENT] node_finished:', d?.nodeId, d?.status); eventCount++; });

const inputs = {
  project_root: projectRoot,
  audit_scope: 'all',
  period_days: 1,
  include_code_review: false,
  include_design_review: false,
  include_qa_signoff: false,
  auto_trigger_missing: false,
  requester: 'diagnostic',
};

// 测试 1: 同步等待执行
console.log('--- 测试 1: 同步执行 ---');
const syncResult = await runner.run(flowSpec, inputs);
console.log('同步执行完成:', syncResult.status, `(${eventCount} events)`);
console.log('');

// 测试 2: 模拟异步执行（像 Runner 那样）
console.log('--- 测试 2: 异步执行模拟 ---');
eventCount = 0;
const runner2 = createFlowRunner({
  runId: runId + '-async',
  runDir: runDir + '-async',
  artifactWriter: async (name, data) => {
    console.log(`[artifact-async] ${name}`);
  },
  emitEvents: true,
});

runner2.on('run_started', () => console.log('[ASYNC] run_started'));
runner2.on('run_finished', (d) => console.log('[ASYNC] run_finished:', d?.status));
runner2.on('node_started', (d) => console.log('[ASYNC] node_started:', d?.nodeId));
runner2.on('node_finished', (d) => console.log('[ASYNC] node_finished:', d?.nodeId, d?.status));

mkdirSync(runDir + '-async', { recursive: true });

// 异步调用，不等待
const asyncPromise = runner2.run(flowSpec, inputs);
console.log('异步调用已发起，立即返回...');

// 等待一段时间看看会发生什么
await new Promise(resolve => setTimeout(resolve, 5000));
console.log('5秒后检查...');
console.log('Runner2 status:', runner2.status);
console.log('Runner2 nodeResults size:', runner2.nodeResults?.size || 0);

// 继续等待完成
console.log('等待异步执行完成...');
const asyncResult = await asyncPromise;
console.log('异步执行完成:', asyncResult.status);

console.log('');
console.log('=== 诊断完成 ===');
