/**
 * RunnerClient 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config
vi.mock('../config.js', () => ({
  config: {
    runnerBaseUrl: 'http://mock-runner:3210',
    projectRoot: '/mock/project',
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
const { cancelRun, retryNode, checkRunnerHealth, runnerClient } = await import('../clients/runnerClient.js');

describe('cancelRun', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should send cancel request to runner', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ ok: true }),
    });

    const result = await cancelRun('RUN-001');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://mock-runner:3210/fixed-flow/cancel',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: 'RUN-001',
          project_root: '/mock/project',
        }),
      }
    );
    expect(result.ok).toBe(true);
  });

  it('should return error when runner is unreachable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const result = await cancelRun('RUN-001');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Failed to connect to runner');
  });
});

describe('retryNode', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should send retry request to runner', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ ok: true }),
    });

    const result = await retryNode('RUN-001', 'stage.intake');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://mock-runner:3210/fixed-flow/retry',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: 'RUN-001',
          node_id: 'stage.intake',
          project_root: '/mock/project',
        }),
      }
    );
    expect(result.ok).toBe(true);
  });

  it('should return error when runner is unreachable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const result = await retryNode('RUN-001', 'stage.intake');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Failed to connect to runner');
  });
});

describe('checkRunnerHealth', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return true when runner is healthy', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ ok: true }),
    });

    const result = await checkRunnerHealth();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://mock-runner:3210/health',
      { method: 'GET' }
    );
    expect(result).toBe(true);
  });

  it('should return false when runner returns ok: false', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ ok: false }),
    });

    const result = await checkRunnerHealth();
    expect(result).toBe(false);
  });

  it('should return false when runner is unreachable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const result = await checkRunnerHealth();
    expect(result).toBe(false);
  });
});

describe('runnerClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('get', () => {
    it('should make GET request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const result = await runnerClient.get('/test-path');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://mock-runner:3210/test-path',
        { method: 'GET' }
      );
      expect(result.data).toEqual({ data: 'test' });
    });

    it('should throw error for non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await expect(runnerClient.get('/not-found')).rejects.toThrow('Not found');
    });
  });

  describe('post', () => {
    it('should make POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const body = { task: 'test' };
      const result = await runnerClient.post('/test-path', body);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://mock-runner:3210/test-path',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      expect(result.data).toEqual({ success: true });
    });

    it('should make POST request without body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await runnerClient.post('/test-path');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://mock-runner:3210/test-path',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: undefined,
        }
      );
    });

    it('should throw error for non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await expect(runnerClient.post('/error-path', {})).rejects.toThrow('Server error');
    });
  });

  describe('delete', () => {
    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ deleted: true }),
      });

      const result = await runnerClient.delete('/test-path');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://mock-runner:3210/test-path',
        { method: 'DELETE' }
      );
      expect(result.data).toEqual({ deleted: true });
    });

    it('should throw error for non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Forbidden' }),
      });

      await expect(runnerClient.delete('/forbidden')).rejects.toThrow('Forbidden');
    });
  });
});
