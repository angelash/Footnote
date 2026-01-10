/**
 * Control Routes 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

// Mock services
vi.mock('../../services/runsIndex.js', () => ({
  runExists: vi.fn(),
}));

vi.mock('../../clients/runnerClient.js', () => ({
  cancelRun: vi.fn(),
  retryNode: vi.fn(),
}));

// Import after mocking
import { registerControlRoutes } from '../../routes/control.js';
import { runExists } from '../../services/runsIndex.js';
import { cancelRun, retryNode } from '../../clients/runnerClient.js';

describe('Control Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await registerControlRoutes(app);
    await app.ready();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/runs/:runId/cancel', () => {
    it('should cancel run successfully', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(true);
      vi.mocked(cancelRun).mockResolvedValueOnce({ ok: true });

      const response = await app.inject({
        method: 'POST',
        url: '/api/runs/RUN-001/cancel',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.message).toContain('Cancel request sent');
    });

    it('should return 404 when run does not exist', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(false);

      const response = await app.inject({
        method: 'POST',
        url: '/api/runs/RUN-NONEXISTENT/cancel',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('RUN_NOT_FOUND');
    });

    it('should return 500 when cancel fails', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(true);
      vi.mocked(cancelRun).mockResolvedValueOnce({ ok: false, error: 'Runner error' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/runs/RUN-001/cancel',
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(false);
      expect(body.error).toBe('Runner error');
    });

    it('should return 500 when runExists throws', async () => {
      vi.mocked(runExists).mockRejectedValueOnce(new Error('IO error'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/runs/RUN-001/cancel',
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('CANCEL_FAILED');
    });
  });

  describe('POST /api/runs/:runId/retry', () => {
    it('should retry node successfully', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(true);
      vi.mocked(retryNode).mockResolvedValueOnce({ ok: true });

      const response = await app.inject({
        method: 'POST',
        url: '/api/runs/RUN-001/retry',
        payload: { node_id: 'stage.intake' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.message).toContain('Retry request sent');
    });

    it('should return 400 when node_id is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/runs/RUN-001/retry',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('MISSING_NODE_ID');
    });

    it('should return 404 when run does not exist', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(false);

      const response = await app.inject({
        method: 'POST',
        url: '/api/runs/RUN-NONEXISTENT/retry',
        payload: { node_id: 'stage.intake' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('RUN_NOT_FOUND');
    });

    it('should return 500 when retry fails', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(true);
      vi.mocked(retryNode).mockResolvedValueOnce({ ok: false, error: 'Node not found' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/runs/RUN-001/retry',
        payload: { node_id: 'stage.intake' },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(false);
    });
  });
});
