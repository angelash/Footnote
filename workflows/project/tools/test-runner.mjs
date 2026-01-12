import { createFlowRunner } from '../../reusable/n8n-common/wsl-runner/lib/v2/index.mjs';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = '/mnt/f/workspace/github/Footnote';

// 读取 FlowSpec
const flowSpec = JSON.parse(readFileSync(
  join(projectRoot, 'workflows/reusable/pipeline-sys/v2-design/examples/l0-audit-intake.flowspec.json'),
  'utf8'
));

// 创建运行目录
const runId = `TEST-${Date.now()}`;
const runDir = join(projectRoot, 'workflows/project/logs/automation_runs', runId);
mkdirSync(runDir, { recursive: true });

console.log('Run ID:', runId);
console.log('Run Dir:', runDir);

// 创建 FlowRunner
const runner = createFlowRunner({
  runId,
  runDir,
  artifactWriter: async (name, data) => {
    console.log('[artifact]', name);
  },
  emitEvents: true,
});

// 监听所有事件
runner.on('run_started', (data) => console.log('[run_started]', data));
runner.on('run_finished', (data) => console.log('[run_finished]', data));
runner.on('node_started', (data) => console.log('[node_started]', data?.nodeId));
runner.on('node_finished', (data) => console.log('[node_finished]', data?.nodeId, data?.status));
runner.on('node_log', (data) => console.log('[log]', data?.message?.slice(0, 100)));
runner.on('error', (err) => console.error('[error]', err));

// 执行
console.log('Starting flow...');

// 设置超时
const timeout = setTimeout(() => {
  console.log('Timeout! Checking runner state...');
  console.log('Runner status:', runner.status);
  console.log('Runner nodeResults size:', runner.nodeResults?.size || 0);
  if (runner.nodeResults) {
    console.log('Completed nodes:');
    for (const [id, result] of runner.nodeResults) {
      console.log(`  ${id}: ${result.status} (${result.duration}ms)`);
    }
  }
  // 检查哪些节点还没完成
  const allNodeIds = flowSpec.nodes.map(n => n.id);
  const completedIds = new Set(runner.nodeResults?.keys() || []);
  const pendingIds = allNodeIds.filter(id => !completedIds.has(id));
  console.log('Pending nodes:', pendingIds.slice(0, 5), '...');
  process.exit(1);
}, 25000);

try {
  const result = await runner.run(flowSpec, {
    project_root: projectRoot,
    audit_scope: 'all',
    period_days: 1,
    include_code_review: false,
    include_design_review: false,
    include_qa_signoff: false,
    auto_trigger_missing: false,
    requester: 'test',
  });
  
  clearTimeout(timeout);
  console.log('Result:', JSON.stringify(result, null, 2));
} catch (err) {
  clearTimeout(timeout);
  console.error('Error:', err);
  console.error('Stack:', err.stack);
}
