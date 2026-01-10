/**
 * Console API 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { fetchRuns, fetchRunDetail, fetchRunFile, cancelRun, retryNode, API_BASE } from '../../api/consoleApi';

describe('Console API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('fetchRuns', () => {
    it('should fetch runs list', async () => {
      const mockResponse = {
        runs: [
          { run_id: 'RUN-001', task_id: 'TASK-001', ok: true, stage: 99 },
        ],
        total: 1,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchRuns();

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE}/runs`);
      expect(result.runs).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(fetchRuns()).rejects.toThrow('Failed to fetch runs');
    });
  });

  describe('fetchRunDetail', () => {
    it('should fetch run detail', async () => {
      const mockResponse = {
        status: { run_id: 'RUN-001', ok: true },
        graph: null,
        nodeRuns: null,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchRunDetail('RUN-001');

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE}/runs/RUN-001`);
      expect(result.status.run_id).toBe('RUN-001');
    });

    it('should throw error for non-existent run', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(fetchRunDetail('RUN-NONEXISTENT')).rejects.toThrow('Failed to fetch run detail');
    });
  });

  describe('fetchRunFile', () => {
    it('should fetch file content', async () => {
      const mockResponse = {
        content: '{"result": true}',
        size: 17,
        mtime: '2026-01-05T12:00:00Z',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchRunFile('RUN-001', 'output.json');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/runs/RUN-001/file?path=${encodeURIComponent('output.json')}`
      );
      expect(result.content).toBe('{"result": true}');
    });

    it('should encode path parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: '', size: 0, mtime: '' }),
      });

      await fetchRunFile('RUN-001', 'nodes/plan.json');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('nodes%2Fplan.json')
      );
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(fetchRunFile('RUN-001', 'nonexistent.txt')).rejects.toThrow('Failed to fetch file');
    });
  });

  describe('cancelRun', () => {
    it('should send cancel request', async () => {
      const mockResponse = { ok: true, message: 'Cancelled' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await cancelRun('RUN-001');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/runs/RUN-001/cancel`,
        { method: 'POST' }
      );
      expect(result.ok).toBe(true);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(cancelRun('RUN-001')).rejects.toThrow('Failed to cancel run');
    });
  });

  describe('retryNode', () => {
    it('should send retry request', async () => {
      const mockResponse = { ok: true, message: 'Retry scheduled' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await retryNode('RUN-001', 'stage.intake');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/runs/RUN-001/retry`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ node_id: 'stage.intake' }),
        }
      );
      expect(result.ok).toBe(true);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(retryNode('RUN-001', 'stage.intake')).rejects.toThrow('Failed to retry node');
    });
  });
});
