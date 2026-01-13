/**
 * 简化的 HTTP 服务诊断
 * 测试 setImmediate + async/await 的行为
 */
import http from 'http';
import { createFlowRunner } from '../../reusable/n8n-common/wsl-runner/lib/v2/index.mjs';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const projectRoot = '/mnt/f/workspace/github/Footnote';
const PORT = 3299;

// 追踪异步任务
const runningTasks = new Map();

// 读取 FlowSpec
const flowSpec = JSON.parse(readFileSync(
  join(projectRoot, 'workflows/reusable/pipeline-sys/v2-design/examples/l0-audit-intake.flowspec.json'),
  'utf8'
));

console.log('=== 简化 HTTP 诊断 ===');

async function handleRun(body) {
  const runId = `TEST-${Date.now()}`;
  const runDir = join(projectRoot, 'workflows/project/logs/automation_runs', runId);
  mkdirSync(runDir, { recursive: true });

  console.log(`[${runId}] Creating runner...`);

  const runner = createFlowRunner({
    runId,
    runDir,
    artifactWriter: async (name, data) => {
      console.log(`[${runId}] artifact: ${name}`);
      writeFileSync(join(runDir, name), JSON.stringify(data, null, 2));
    },
    emitEvents: true,
  });

  const inputs = {
    project_root: projectRoot,
    audit_scope: 'all',
    period_days: 1,
    include_code_review: false,
    include_design_review: false,
    include_qa_signoff: false,
    auto_trigger_missing: false,
    requester: 'test',
  };

  if (body.async) {
    console.log(`[${runId}] Starting ASYNC...`);
    
    // 方式 1: 直接调用（不用 setImmediate）
    const promise = (async () => {
      console.log(`[${runId}] Async function started`);
      try {
        const result = await runner.run(flowSpec, inputs);
        console.log(`[${runId}] Completed: ${result.status}`);
        return result;
      } catch (e) {
        console.error(`[${runId}] Error:`, e.message);
        return { error: e.message };
      } finally {
        runningTasks.delete(runId);
        console.log(`[${runId}] Removed from tracker`);
      }
    })();
    
    runningTasks.set(runId, promise);
    console.log(`[${runId}] Returning immediately`);
    
    return { ok: true, run_id: runId, async: true };
  } else {
    console.log(`[${runId}] SYNC execution...`);
    const result = await runner.run(flowSpec, inputs);
    console.log(`[${runId}] Completed: ${result.status}`);
    return { ok: true, run_id: runId, status: result.status };
  }
}

const server = http.createServer(async (req, res) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);

  if (req.method === 'POST' && req.url === '/run') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const parsed = JSON.parse(body || '{}');
    
    try {
      const result = await handleRun(parsed);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    const tasks = [];
    for (const [id] of runningTasks) {
      tasks.push(id);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: tasks.length, tasks }));
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, pid: process.pid }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server on http://127.0.0.1:${PORT}`);
  console.log('Test: curl -X POST http://127.0.0.1:' + PORT + '/run -d \'{"async":true}\'');
});

process.on('uncaughtException', (e) => console.error('[FATAL]', e));
process.on('unhandledRejection', (r) => console.error('[REJECTION]', r));
