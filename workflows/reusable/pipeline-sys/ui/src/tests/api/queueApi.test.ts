/**
 * Queue API 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  getQueueStatus,
  getQueueHistory,
  pauseQueue,
  resumeQueue,
  clearQueue,
  cancelTask,
  retryTask,
  setTaskPriority,
  getSubtasks,
} from '../../api/queueApi';

describe('Queue API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getQueueStatus', () => {
    it('should fetch queue status', async () => {
      const mockResponse = {
        ok: true,
        paused: false,
        running_tasks: [{ id: 'TASK-001', status: 'running', domain: 'code' }],
        running_count: 1,
        queue: [{ id: 'TASK-002', status: 'queued', domain: 'design' }],
        scheduler: { running_by_domain: {}, running_lock_keys: [], total_running: 1 },
        history_count: 10,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getQueueStatus();

      expect(mockFetch).toHaveBeenCalled();
      expect(result.paused).toBe(false);
      expect(result.running_tasks).toHaveLength(1);
      expect(result.running_count).toBe(1);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(getQueueStatus()).rejects.toThrow('Failed to fetch queue status');
    });
  });

  describe('getQueueHistory', () => {
    it('should fetch queue history', async () => {
      const mockResponse = {
        ok: true,
        history: [{ id: 'TASK-001', status: 'completed' }],
        total: 1,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getQueueHistory(10, 0);

      expect(mockFetch).toHaveBeenCalled();
      expect(result.history).toHaveLength(1);
    });

    it('should use default limit and offset', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, history: [], total: 0 }),
      });

      await getQueueHistory();

      // Verify the call was made with default parameters
      expect(mockFetch).toHaveBeenCalled();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('limit=20');
      expect(url).toContain('offset=0');
    });
  });

  describe('pauseQueue', () => {
    it('should pause queue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, message: 'Queue paused' }),
      });

      const result = await pauseQueue();

      expect(mockFetch).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });
  });

  describe('resumeQueue', () => {
    it('should resume queue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, message: 'Queue resumed' }),
      });

      const result = await resumeQueue();

      expect(mockFetch).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });
  });

  describe('clearQueue', () => {
    it('should clear queue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, cleared_count: 5 }),
      });

      const result = await clearQueue();

      expect(mockFetch).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });
  });

  describe('cancelTask', () => {
    it('should cancel task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, message: 'Task cancelled' }),
      });

      const result = await cancelTask('TASK-001');

      expect(mockFetch).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(cancelTask('TASK-NONEXISTENT')).rejects.toThrow('Failed to cancel task');
    });
  });

  describe('retryTask', () => {
    it('should retry task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, new_task_id: 'TASK-002' }),
      });

      const result = await retryTask('TASK-001');

      expect(mockFetch).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });
  });

  describe('setTaskPriority', () => {
    it('should set task priority', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, message: 'Priority updated' }),
      });

      const result = await setTaskPriority('TASK-001', 10);

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[1].method).toBe('POST');
      expect(JSON.parse(call[1].body)).toEqual({ priority: 10 });
      expect(result.ok).toBe(true);
    });
  });

  describe('getSubtasks', () => {
    it('should fetch subtasks', async () => {
      const mockResponse = {
        ok: true,
        parent_id: 'TASK-001',
        count: 2,
        subtasks: [
          { id: 'SUBTASK-001', parent_id: 'TASK-001', status: 'completed' },
          { id: 'SUBTASK-002', parent_id: 'TASK-001', status: 'running' },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getSubtasks('TASK-001');

      expect(mockFetch).toHaveBeenCalled();
      expect(result.subtasks).toHaveLength(2);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(getSubtasks('TASK-NONEXISTENT')).rejects.toThrow('Failed to fetch subtasks');
    });
  });
});
