/**
 * Runs Routes
 * /api/runs、/api/runs/:runId
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { listRuns, runExists } from '../services/runsIndex.js';
import { loadStatus, loadGraph, loadNodeRuns } from '../services/runLoader.js';
import type { IRunsListResponse, IRunDetailResponse, IErrorResponse } from '../types/dto.js';

/**
 * 注册 runs 路由
 */
export async function registerRunsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/runs
   * 获取所有 run 列表
   */
  app.get('/api/runs', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const runs = await listRuns();
      const response: IRunsListResponse = {
        runs,
        total: runs.length,
      };
      return reply.send(response);
    } catch (e) {
      const error: IErrorResponse = {
        ok: false,
        error: (e as Error).message,
        code: 'LIST_RUNS_FAILED',
      };
      return reply.status(500).send(error);
    }
  });

  /**
   * GET /api/runs/:runId
   * 获取单个 run 详情
   */
  app.get<{
    Params: { runId: string };
  }>('/api/runs/:runId', async (request, reply) => {
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

      const [status, graph, nodeRuns] = await Promise.all([
        loadStatus(runId),
        loadGraph(runId),
        loadNodeRuns(runId),
      ]);

      if (!status) {
        const error: IErrorResponse = {
          ok: false,
          error: `Status not found for run: ${runId}`,
          code: 'STATUS_NOT_FOUND',
        };
        return reply.status(404).send(error);
      }

      const response: IRunDetailResponse = {
        status,
        graph,
        nodeRuns,
      };
      return reply.send(response);
    } catch (e) {
      const error: IErrorResponse = {
        ok: false,
        error: (e as Error).message,
        code: 'LOAD_RUN_FAILED',
      };
      return reply.status(500).send(error);
    }
  });
}

