/**
 * Status Types 单元测试
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_LOCK_TTL_MS, LOCK_HEARTBEAT_INTERVAL_MS } from '../status.js';
import type { IStatusV1, IRepoInfoV1, IControlV1, ILockMetaV1 } from '../status.js';

describe('Status Constants', () => {
  describe('DEFAULT_LOCK_TTL_MS', () => {
    it('should be 2 hours in milliseconds', () => {
      expect(DEFAULT_LOCK_TTL_MS).toBe(7200000);
      expect(DEFAULT_LOCK_TTL_MS).toBe(2 * 60 * 60 * 1000);
    });
  });

  describe('LOCK_HEARTBEAT_INTERVAL_MS', () => {
    it('should be 10 seconds in milliseconds', () => {
      expect(LOCK_HEARTBEAT_INTERVAL_MS).toBe(10000);
      expect(LOCK_HEARTBEAT_INTERVAL_MS).toBe(10 * 1000);
    });
  });
});

describe('Status Types', () => {
  describe('IRepoInfoV1', () => {
    it('should accept valid repo info', () => {
      const repoInfo: IRepoInfoV1 = {
        root: '/home/user/project',
        branch: 'main',
        head: 'abc123def456',
      };

      expect(repoInfo.root).toBe('/home/user/project');
      expect(repoInfo.branch).toBe('main');
      expect(repoInfo.head).toBe('abc123def456');
    });
  });

  describe('IStatusV1', () => {
    it('should accept valid status', () => {
      const status: IStatusV1 = {
        run_id: 'RUN-001',
        task_id: 'TASK-001',
        stage: 99,
        current_node_id: 'stage.done',
        attempt: 1,
        ok: true,
        started_at: '2026-01-05T12:00:00Z',
        updated_at: '2026-01-05T12:05:00Z',
        repo: {
          root: '/project',
          branch: 'main',
          head: 'abc123',
        },
      };

      expect(status.run_id).toBe('RUN-001');
      expect(status.ok).toBe(true);
      expect(status.error).toBeUndefined();
    });

    it('should accept status with error', () => {
      const status: IStatusV1 = {
        run_id: 'RUN-002',
        task_id: 'TASK-002',
        stage: 3,
        current_node_id: 'execute.edit',
        attempt: 2,
        ok: false,
        error: 'Task failed: timeout',
        started_at: '2026-01-05T12:00:00Z',
        updated_at: '2026-01-05T12:30:00Z',
        repo: {
          root: '/project',
          branch: 'feature-x',
          head: 'def456',
        },
        note: 'Retry scheduled',
      };

      expect(status.ok).toBe(false);
      expect(status.error).toBe('Task failed: timeout');
      expect(status.note).toBe('Retry scheduled');
    });
  });

  describe('IControlV1', () => {
    it('should accept cancel request', () => {
      const control: IControlV1 = {
        cancel: {
          requested_at: '2026-01-05T12:10:00Z',
          requested_by: 'user@example.com',
        },
      };

      expect(control.cancel?.requested_at).toBe('2026-01-05T12:10:00Z');
      expect(control.cancel?.requested_by).toBe('user@example.com');
    });

    it('should accept retry request', () => {
      const control: IControlV1 = {
        retry: {
          requested_at: '2026-01-05T12:15:00Z',
          node_id: 'stage.execute',
          requested_by: 'admin',
        },
      };

      expect(control.retry?.node_id).toBe('stage.execute');
    });

    it('should accept both cancel and retry', () => {
      const control: IControlV1 = {
        cancel: {
          requested_at: '2026-01-05T12:10:00Z',
          requested_by: 'user1',
        },
        retry: {
          requested_at: '2026-01-05T12:15:00Z',
          node_id: 'stage.execute',
          requested_by: 'user2',
        },
      };

      expect(control.cancel).toBeDefined();
      expect(control.retry).toBeDefined();
    });

    it('should accept empty control', () => {
      const control: IControlV1 = {};

      expect(control.cancel).toBeUndefined();
      expect(control.retry).toBeUndefined();
    });
  });

  describe('ILockMetaV1', () => {
    it('should accept valid lock meta', () => {
      const lockMeta: ILockMetaV1 = {
        run_id: 'RUN-001',
        project_root: '/home/user/project',
        pid: 12345,
        host: 'worker-node-1',
        started_at: '2026-01-05T12:00:00Z',
        updated_at: '2026-01-05T12:30:00Z',
        ttl_ms: DEFAULT_LOCK_TTL_MS,
      };

      expect(lockMeta.run_id).toBe('RUN-001');
      expect(lockMeta.pid).toBe(12345);
      expect(lockMeta.ttl_ms).toBe(DEFAULT_LOCK_TTL_MS);
    });
  });
});
