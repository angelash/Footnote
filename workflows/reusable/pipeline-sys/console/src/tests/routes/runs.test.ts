/**
 * Runs Routes 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

// Mock services
vi.mock('../../services/runsIndex.js', () => ({
  listRuns: vi.fn(),
  runExists: vi.fn(),
}));

vi.mock('../../services/runLoader.js', () => ({
  loadStatus: vi.fn(),
  loadGraph: vi.fn(),
  loadNodeRuns: vi.fn(),
}));

// Import after mocking
import { registerRunsRoutes } from '../../routes/runs.js';
import { listRuns, runExists } from '../../services/runsIndex.js';
import { loadStatus, loadGraph, loadNodeRuns } from '../../services/runLoader.js';

describe('Runs Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await registerRunsRoutes(app);
    await app.ready();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/runs', () => {
    it('should return empty list when no runs', async () => {
      vi.mocked(listRuns).mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.runs).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should return list of runs', async () => {
      const mockRuns = [
        { run_id: 'RUN-001', task_id: 'TASK-001', ok: true, stage: 99, current_node_id: 'done', started_at: '2026-01-05T12:00:00Z', updated_at: '2026-01-05T12:05:00Z' },
        { run_id: 'RUN-002', task_id: 'TASK-002', ok: false, stage: 3, current_node_id: 'execute', started_at: '2026-01-05T11:00:00Z', updated_at: '2026-01-05T11:30:00Z' },
      ];
      vi.mocked(listRuns).mockResolvedValueOnce(mockRuns);

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.runs).toHaveLength(2);
      expect(body.total).toBe(2);
      expect(body.runs[0].run_id).toBe('RUN-001');
    });

    it('should return 500 when listRuns throws', async () => {
      vi.mocked(listRuns).mockRejectedValueOnce(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs',
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(false);
      expect(body.code).toBe('LIST_RUNS_FAILED');
    });
  });

  describe('GET /api/runs/:runId', () => {
    const mockStatus = {
      run_id: 'RUN-001',
      task_id: 'TASK-001',
      stage: 99,
      current_node_id: 'done',
      attempt: 1,
      ok: true,
      started_at: '2026-01-05T12:00:00Z',
      updated_at: '2026-01-05T12:05:00Z',
      repo: { root: '/test', branch: 'main', head: 'abc123' },
    };

    const mockGraph = {
      version: 'v1',
      run_id: 'RUN-001',
      nodes: [],
      edges: [],
      layout: { direction: 'TB' as const, group_padding: 16 },
    };

    const mockNodeRuns = {
      version: 'v1' as const,
      run_id: 'RUN-001',
      updated_at: '2026-01-05T12:05:00Z',
      nodes: {},
    };

    it('should return run details', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(true);
      vi.mocked(loadStatus).mockResolvedValueOnce(mockStatus);
      vi.mocked(loadGraph).mockResolvedValueOnce(mockGraph);
      vi.mocked(loadNodeRuns).mockResolvedValueOnce(mockNodeRuns);

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs/RUN-001',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status.run_id).toBe('RUN-001');
      expect(body.graph).toBeDefined();
      expect(body.nodeRuns).toBeDefined();
    });

    it('should return 404 when run does not exist', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(false);

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs/RUN-NONEXISTENT',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(false);
      expect(body.code).toBe('RUN_NOT_FOUND');
    });

    it('should return 404 when status is null', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(true);
      vi.mocked(loadStatus).mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs/RUN-001',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('STATUS_NOT_FOUND');
    });

    it('should return 500 when load fails', async () => {
      vi.mocked(runExists).mockRejectedValueOnce(new Error('IO error'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs/RUN-001',
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('LOAD_RUN_FAILED');
    });
  });
});
