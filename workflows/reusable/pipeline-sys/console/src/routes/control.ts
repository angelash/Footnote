/**
 * Control Routes
 * /api/runs/:runId/cancel、/retry
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { runExists } from '../services/runsIndex.js';
import { cancelRun, retryNode } from '../clients/runnerClient.js';
import type { IControlResponse, IRetryRequest, IErrorResponse } from '../types/dto.js';

/**
 * 注册 control 路由
 */
export async function registerControlRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/runs/:runId/cancel
   * 取消运行
   */
  app.post<{
    Params: { runId: string };
  }>('/api/runs/:runId/cancel', async (request, reply) => {
    const { runId } = request.params;

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

      const result = await cancelRun(runId);
      
      if (!result.ok) {
        const response: IControlResponse = {
          ok: false,
          message: 'Cancel request failed',
          error: result.error,
        };
        return reply.status(500).send(response);
      }

      const response: IControlResponse = {
        ok: true,
        message: `Cancel request sent for run: ${runId}`,
      };
      return reply.send(response);
    } catch (e) {
      const error: IErrorResponse = {
        ok: false,
        error: (e as Error).message,
        code: 'CANCEL_FAILED',
      };
      return reply.status(500).send(error);
    }
  });

  /**
   * POST /api/runs/:runId/retry
   * 重试节点
   */
  app.post<{
    Params: { runId: string };
    Body: IRetryRequest;
  }>('/api/runs/:runId/retry', async (request, reply) => {
    const { runId } = request.params;
    const { node_id } = request.body || {};

    if (!node_id) {
      const error: IErrorResponse = {
        ok: false,
        error: 'Missing required field: node_id',
        code: 'MISSING_NODE_ID',
      };
      return reply.status(400).send(error);
    }

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

      const result = await retryNode(runId, node_id);
      
      if (!result.ok) {
        const response: IControlResponse = {
          ok: false,
          message: 'Retry request failed',
          error: result.error,
        };
        return reply.status(500).send(response);
      }

      const response: IControlResponse = {
        ok: true,
        message: `Retry request sent for node: ${node_id} in run: ${runId}`,
      };
      return reply.send(response);
    } catch (e) {
      const error: IErrorResponse = {
        ok: false,
        error: (e as Error).message,
        code: 'RETRY_FAILED',
      };
      return reply.status(500).send(error);
    }
  });
}

