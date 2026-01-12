/**
 * 诊断脚本：模拟 Runner HTTP 服务的完整行为
 */

import http from 'http';
import { createFlowRunner } from '../../reusable/n8n-common/wsl-runner/lib/v2/index.mjs';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const projectRoot = '/mnt/f/workspace/github/Footnote';
const PORT = 3299; // 使用不同端口避免冲突

// 读取 FlowSpec
const flowSpec = JSON.parse(readFileSync(
  join(projectRoot, 'workflows/reusable/pipeline-sys/v2-design/examples/l0-audit-intake.flowspec.json'),
  'utf8'
));

console.log('=== HTTP 模拟诊断 ===');
console.log('Port:', PORT);

// 追踪异步任务
const runningTasks = new Map();

// 模拟 handleV2Run
async function handleV2Run(body) {
  const runId = `DIAG-HTTP-${Date.now()}`;
  const runDir = join(projectRoot, 'workflows/project/logs/automation_runs', runId);
  mkdirSync(runDir, { recursive: true });

  console.log(`[handleV2Run] Creating runner for ${runId}`);

  const artifactWriter = async (name, data) => {
    console.log(`[${runId}] artifact: ${name}`);
    writeFileSync(join(runDir, name), JSON.stringify(data, null, 2));
  };

  const runner = createFlowRunner({
    runId,
    runDir,
    artifactWriter,
    emitEvents: true,
  });

  const executeFlow = async () => {
    console.log(`[${runId}] executeFlow STARTED`);
    try {
      const result = await runner.run(flowSpec, body.inputs || {});
      console.log(`[${runId}] executeFlow COMPLETED: ${result.status}`);
      return result;
    } catch (e) {
      console.error(`[${runId}] executeFlow ERROR: ${e.message}`);
      throw e;
    }
  };

  if (body.async) {
    console.log(`[${runId}] Starting ASYNC execution`);
    
    // 关键：这是 Runner 中的异步调用方式
    const promise = executeFlow().catch(e => {
      console.error(`[${runId}] Async error:`, e);
    });
    
    runningTasks.set(runId, promise);
    
    console.log(`[${runId}] Returning immediately (async: true)`);
    return { ok: true, run_id: runId, started_async: true };
  } else {
    console.log(`[${runId}] Waiting for SYNC execution`);
    const result = await executeFlow();
    return { ok: true, run_id: runId, result };
  }
}

// 创建 HTTP 服务器
const server = http.createServer(async (req, res) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);

  if (req.method === 'POST' && req.url === '/test') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const parsed = JSON.parse(body || '{}');
    
    try {
      const result = await handleV2Run({
        inputs: {
          project_root: projectRoot,
          audit_scope: 'all',
          period_days: 1,
          include_code_review: false,
          include_design_review: false,
          include_qa_signoff: false,
          auto_trigger_missing: false,
          requester: 'http-test',
        },
        async: parsed.async !== false,
      });
      
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
    for (const [id, promise] of runningTasks) {
      tasks.push({ id, pending: true });
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tasks, count: tasks.length }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server listening on http://127.0.0.1:${PORT}`);
  console.log('');
  console.log('Test commands:');
  console.log(`  curl -X POST http://127.0.0.1:${PORT}/test -d '{"async":true}'`);
  console.log(`  curl http://127.0.0.1:${PORT}/status`);
  console.log('');
  console.log('Waiting for requests... (Ctrl+C to stop)');
});

// 保持进程运行
process.on('SIGINT', () => {
  console.log('\\nShutting down...');
  server.close();
  process.exit(0);
});
