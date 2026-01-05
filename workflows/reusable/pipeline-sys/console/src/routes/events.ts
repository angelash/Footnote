/**
 * Events Routes
 * /api/runs/:runId/events (SSE)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { runExists } from '../services/runsIndex.js';
import { getEventsPath } from '../services/runLoader.js';
import { EventsTailer } from '../services/eventsTailer.js';
import type { IErrorResponse } from '../types/dto.js';

/**
 * 注册 events 路由
 */
export async function registerEventsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/runs/:runId/events
   * SSE 事件流
   */
  app.get<{
    Params: { runId: string };
    Headers: { 'last-event-id'?: string };
  }>('/api/runs/:runId/events', async (request, reply) => {
    const { runId } = request.params;
    const lastEventId = request.headers['last-event-id'];
    const fromSeq = lastEventId ? parseInt(lastEventId, 10) : 0;

    try {
      const exists = await runExists(runId);
      if (!exists) {
        const error: IErrorResponse = {
          ok: false,
          error: `Run not found: ${runId}`,
          code: 'RUN_NOT_FOUND',
        };
        return reply.status(404).send(error);
      }

      const eventsPath = getEventsPath(runId);
      const tailer = new EventsTailer(eventsPath, { fromSeq });

      // 设置 SSE 响应头
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      // 发送初始连接确认
      reply.raw.write(`event: connected\ndata: ${JSON.stringify({ run_id: runId, from_seq: fromSeq })}\n\n`);

      // 处理客户端断开
      request.raw.on('close', () => {
        tailer.stop();
      });

      // 开始 tail 并发送事件
      tailer.on('event', (event) => {
        const data = `id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        reply.raw.write(data);
      });

      tailer.on('error', (e) => {
        reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: (e as Error).message })}\n\n`);
      });

      // 开始 tail
      await tailer.start();

      // 保持连接打开
      // Fastify 会在客户端断开时自动清理
    } catch (e) {
      const error: IErrorResponse = {
        ok: false,
        error: (e as Error).message,
        code: 'EVENTS_STREAM_FAILED',
      };
      return reply.status(500).send(error);
    }
  });
}

