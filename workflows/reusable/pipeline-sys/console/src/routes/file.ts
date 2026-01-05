/**
 * File Routes
 * /api/runs/:runId/file
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { runExists } from '../services/runsIndex.js';
import { readRunFile } from '../services/runLoader.js';
import type { IFileReadResponse, IErrorResponse } from '../types/dto.js';

/**
 * 注册 file 路由
 */
export async function registerFileRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/runs/:runId/file?path=<rel_path>
   * 读取 run 目录内的文件
   */
  app.get<{
    Params: { runId: string };
    Querystring: { path?: string };
  }>('/api/runs/:runId/file', async (request, reply) => {
    const { runId } = request.params;
    const relPath = request.query.path;

    if (!relPath) {
      const error: IErrorResponse = {
        ok: false,
        error: 'Missing required query parameter: path',
        code: 'MISSING_PATH',
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

      const file = await readRunFile(runId, relPath);
      if (!file) {
        const error: IErrorResponse = {
          ok: false,
          error: `File not found: ${relPath}`,
          code: 'FILE_NOT_FOUND',
        };
        return reply.status(404).send(error);
      }

      const response: IFileReadResponse = file;
      return reply.send(response);
    } catch (e) {
      const errorMessage = (e as Error).message;
      
      // 路径穿越错误
      if (errorMessage.includes('escapes')) {
        const error: IErrorResponse = {
          ok: false,
          error: 'Invalid path: path traversal not allowed',
          code: 'PATH_TRAVERSAL',
        };
        return reply.status(403).send(error);
      }

      const error: IErrorResponse = {
        ok: false,
        error: errorMessage,
        code: 'READ_FILE_FAILED',
      };
      return reply.status(500).send(error);
    }
  });
}

