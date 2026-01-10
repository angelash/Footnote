/**
 * File Routes 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

// Mock services
vi.mock('../../services/runsIndex.js', () => ({
  runExists: vi.fn(),
}));

vi.mock('../../services/runLoader.js', () => ({
  readRunFile: vi.fn(),
}));

// Import after mocking
import { registerFileRoutes } from '../../routes/file.js';
import { runExists } from '../../services/runsIndex.js';
import { readRunFile } from '../../services/runLoader.js';

describe('File Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await registerFileRoutes(app);
    await app.ready();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/runs/:runId/file', () => {
    it('should return file content', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(true);
      vi.mocked(readRunFile).mockResolvedValueOnce({
        content: '{"result": true}',
        size: 17,
        mtime: '2026-01-05T12:00:00Z',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs/RUN-001/file?path=output.json',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.content).toBe('{"result": true}');
      expect(body.size).toBe(17);
    });

    it('should return 400 when path is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/runs/RUN-001/file',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('MISSING_PATH');
    });

    it('should return 404 when run does not exist', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(false);

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs/RUN-NONEXISTENT/file?path=output.json',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('RUN_NOT_FOUND');
    });

    it('should return 404 when file does not exist', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(true);
      vi.mocked(readRunFile).mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs/RUN-001/file?path=nonexistent.txt',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('FILE_NOT_FOUND');
    });

    it('should return 403 for path traversal attempt', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(true);
      vi.mocked(readRunFile).mockRejectedValueOnce(new Error('Path escapes root'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs/RUN-001/file?path=../../../etc/passwd',
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('PATH_TRAVERSAL');
    });

    it('should return 500 for other errors', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(true);
      vi.mocked(readRunFile).mockRejectedValueOnce(new Error('IO error'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs/RUN-001/file?path=output.json',
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('READ_FILE_FAILED');
    });

    it('should handle URL encoded paths', async () => {
      vi.mocked(runExists).mockResolvedValueOnce(true);
      vi.mocked(readRunFile).mockResolvedValueOnce({
        content: 'test',
        size: 4,
        mtime: '2026-01-05T12:00:00Z',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/runs/RUN-001/file?path=nodes%2Foutput.json',
      });

      expect(response.statusCode).toBe(200);
      expect(vi.mocked(readRunFile)).toHaveBeenCalledWith('RUN-001', 'nodes/output.json');
    });
  });
});
