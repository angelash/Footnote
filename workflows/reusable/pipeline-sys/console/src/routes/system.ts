/**
 * System Routes
 * /api/system/status、/api/system/restart-runner
 * 系统状态监控和服务管理
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getHealthMonitor, type ISystemStatus } from '../services/healthMonitor.js';

/**
 * 注册 system 路由
 */
export async function registerSystemRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/system/status
   * 获取系统整体状态
   */
  app.get('/api/system/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const monitor = getHealthMonitor();
      const status = monitor.getStatus();
      return reply.send(status);
    } catch (e) {
      return reply.status(500).send({
        ok: false,
        error: (e as Error).message,
        code: 'SYSTEM_STATUS_FAILED',
      });
    }
  });

  /**
   * POST /api/system/restart-runner
   * 手动触发 WSL Runner 重启
   */
  app.post('/api/system/restart-runner', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const monitor = getHealthMonitor();
      const result = await monitor.restartRunner();
      return reply.send(result);
    } catch (e) {
      return reply.status(500).send({
        ok: false,
        error: (e as Error).message,
        code: 'RESTART_RUNNER_FAILED',
      });
    }
  });

  /**
   * GET /api/system/logs
   * 获取服务健康日志
   */
  app.get<{
    Querystring: { lines?: string };
  }>('/api/system/logs', async (request, reply) => {
    try {
      const monitor = getHealthMonitor();
      const lines = parseInt(request.query.lines || '50', 10);
      const logs = monitor.getLogs(lines);
      return reply.send({ ok: true, logs });
    } catch (e) {
      return reply.status(500).send({
        ok: false,
        error: (e as Error).message,
        code: 'GET_LOGS_FAILED',
      });
    }
  });
}
