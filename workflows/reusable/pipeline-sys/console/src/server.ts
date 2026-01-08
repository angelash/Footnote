/**
 * Pipeline-Sys Console Server
 * Fastify 实例、路由注册、错误处理
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { registerRunsRoutes } from './routes/runs.js';
import { registerEventsRoutes } from './routes/events.js';
import { registerFileRoutes } from './routes/file.js';
import { registerControlRoutes } from './routes/control.js';
import { registerQueueRoutes } from './routes/queue.js';
import { checkRunnerHealth } from './clients/runnerClient.js';

/**
 * 创建并配置 Fastify 实例
 */
export async function createServer() {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // 注册 CORS
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // 健康检查
  app.get('/health', async () => {
    const runnerHealthy = await checkRunnerHealth();
    return {
      ok: true,
      service: 'pipeline-sys-console',
      runner_healthy: runnerHealthy,
      config: {
        host: config.host,
        port: config.port,
        project_root: config.projectRoot,
        runner_base_url: config.runnerBaseUrl,
      },
    };
  });

  // 注册路由
  await registerRunsRoutes(app);
  await registerEventsRoutes(app);
  await registerFileRoutes(app);
  await registerControlRoutes(app);
  await registerQueueRoutes(app);

  // 全局错误处理
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.status(500).send({
      ok: false,
      error: error.message,
      code: 'INTERNAL_ERROR',
    });
  });

  // 404 处理
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      ok: false,
      error: `Route not found: ${request.method} ${request.url}`,
      code: 'NOT_FOUND',
    });
  });

  return app;
}

