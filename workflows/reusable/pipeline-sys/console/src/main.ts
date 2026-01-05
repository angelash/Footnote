/**
 * Pipeline-Sys Console Entry Point
 * 进程入口（读取 env，启动 server）
 */

import { createServer } from './server.js';
import { config } from './config.js';

async function main() {
  console.log('[pipeline-sys-console] Starting...');
  console.log(`[pipeline-sys-console] Project root: ${config.projectRoot}`);
  console.log(`[pipeline-sys-console] Runner URL: ${config.runnerBaseUrl}`);

  const app = await createServer();

  try {
    await app.listen({
      host: config.host,
      port: config.port,
    });
    console.log(`[pipeline-sys-console] Listening on http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // 优雅关闭
  const shutdown = async () => {
    console.log('[pipeline-sys-console] Shutting down...');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[pipeline-sys-console] Fatal error:', err);
  process.exit(1);
});

