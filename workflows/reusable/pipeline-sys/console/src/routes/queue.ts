/**
 * Queue Routes
 * 任务队列管理路由 - 代理到 WSL Runner
 */

import { FastifyInstance } from 'fastify';
import { runnerClient } from '../clients/runnerClient.js';

/**
 * 注册队列路由
 */
export async function registerQueueRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/queue - 获取队列状态
  app.get('/api/queue', async (request, reply) => {
    try {
      const response = await runnerClient.get('/queue');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to get queue status';
      return reply.status(500).send({ ok: false, error: message });
    }
  });

  // GET /api/queue/history - 获取历史记录
  app.get('/api/queue/history', async (request, reply) => {
    try {
      const { limit = '20', offset = '0' } = request.query as { limit?: string; offset?: string };
      const response = await runnerClient.get(`/queue/history?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to get queue history';
      return reply.status(500).send({ ok: false, error: message });
    }
  });

  // POST /api/queue/pause - 暂停队列
  app.post('/api/queue/pause', async (request, reply) => {
    try {
      const response = await runnerClient.post('/queue/pause');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to pause queue';
      return reply.status(500).send({ ok: false, error: message });
    }
  });

  // POST /api/queue/resume - 恢复队列
  app.post('/api/queue/resume', async (request, reply) => {
    try {
      const response = await runnerClient.post('/queue/resume');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to resume queue';
      return reply.status(500).send({ ok: false, error: message });
    }
  });

  // POST /api/queue/clear - 清空队列
  app.post('/api/queue/clear', async (request, reply) => {
    try {
      const response = await runnerClient.post('/queue/clear');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to clear queue';
      return reply.status(500).send({ ok: false, error: message });
    }
  });

  // GET /api/queue/:taskId - 获取任务详情
  app.get<{ Params: { taskId: string } }>('/api/queue/:taskId', async (request, reply) => {
    try {
      const { taskId } = request.params;
      const response = await runnerClient.get(`/queue/${encodeURIComponent(taskId)}`);
      return response.data;
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || error.message || 'Failed to get task';
      return reply.status(status).send({ ok: false, error: message });
    }
  });

  // DELETE /api/queue/:taskId - 取消任务
  app.delete<{ Params: { taskId: string } }>('/api/queue/:taskId', async (request, reply) => {
    try {
      const { taskId } = request.params;
      const response = await runnerClient.delete(`/queue/${encodeURIComponent(taskId)}`);
      return response.data;
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || error.message || 'Failed to cancel task';
      return reply.status(status).send({ ok: false, error: message });
    }
  });

  // POST /api/queue/:taskId/retry - 重试任务
  app.post<{ Params: { taskId: string } }>('/api/queue/:taskId/retry', async (request, reply) => {
    try {
      const { taskId } = request.params;
      const response = await runnerClient.post(`/queue/${encodeURIComponent(taskId)}/retry`);
      return response.data;
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || error.message || 'Failed to retry task';
      return reply.status(status).send({ ok: false, error: message });
    }
  });

  // POST /api/queue/:taskId/priority - 调整优先级
  app.post<{ Params: { taskId: string }; Body: { priority: number } }>(
    '/api/queue/:taskId/priority',
    async (request, reply) => {
      try {
        const { taskId } = request.params;
        const { priority } = request.body || {};
        
        if (typeof priority !== 'number') {
          return reply.status(400).send({ ok: false, error: 'priority (number) is required' });
        }
        
        const response = await runnerClient.post(
          `/queue/${encodeURIComponent(taskId)}/priority`,
          { priority }
        );
        return response.data;
      } catch (error: any) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.error || error.message || 'Failed to update priority';
        return reply.status(status).send({ ok: false, error: message });
      }
    }
  );

  // GET /api/queue/:taskId/subtasks - 获取子任务
  app.get<{ Params: { taskId: string } }>('/api/queue/:taskId/subtasks', async (request, reply) => {
    try {
      const { taskId } = request.params;
      const response = await runnerClient.get(`/queue/${encodeURIComponent(taskId)}/subtasks`);
      return response.data;
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || error.message || 'Failed to get subtasks';
      return reply.status(status).send({ ok: false, error: message });
    }
  });

  app.log.info('[Queue Routes] Registered queue management routes');
}
