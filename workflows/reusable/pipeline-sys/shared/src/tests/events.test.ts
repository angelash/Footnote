/**
 * Events Types 单元测试
 */

import { describe, it, expect } from 'vitest';
import { EventType, NodeStatus, LogStream } from '../enums.js';
import { EVENT_RULES } from '../events.js';
import type {
  IEventV1,
  IEventBaseV1,
  IRunStartedPayload,
  IRunFinishedPayload,
  INodeStartedPayload,
  INodeLogPayload,
  INodeFinishedPayload,
  INodeRetryScheduledPayload,
  INodeTimeoutPayload,
  ICancelRequestedPayload,
  ICancelledPayload,
  ILockAcquiredPayload,
  ILockStaleClearedPayload,
  ILockReleasedPayload,
} from '../events.js';

describe('EVENT_RULES', () => {
  it('should have MAX_PAYLOAD_BYTES constant', () => {
    expect(EVENT_RULES.MAX_PAYLOAD_BYTES).toBe(64 * 1024);
  });

  it('should have MAX_LOG_TEXT_LENGTH constant', () => {
    expect(EVENT_RULES.MAX_LOG_TEXT_LENGTH).toBe(4000);
  });
});

describe('Event Types', () => {
  describe('IEventBaseV1', () => {
    it('should define base event structure', () => {
      const baseEvent: IEventBaseV1 = {
        ts: '2026-01-05T12:00:00Z',
        run_id: 'RUN-001',
        type: EventType.RUN_STARTED,
        node_id: '',
        seq: 1,
      };

      expect(baseEvent.ts).toBe('2026-01-05T12:00:00Z');
      expect(baseEvent.run_id).toBe('RUN-001');
      expect(baseEvent.type).toBe(EventType.RUN_STARTED);
      expect(baseEvent.seq).toBe(1);
    });
  });

  describe('IRunStartedPayload', () => {
    it('should define run started payload', () => {
      const payload: IRunStartedPayload = {
        task_id: 'TASK-001',
        title: 'Feature Implementation',
        project_root: '/home/user/project',
      };

      expect(payload.task_id).toBe('TASK-001');
      expect(payload.title).toBe('Feature Implementation');
      expect(payload.project_root).toBe('/home/user/project');
    });

    it('should allow optional title', () => {
      const payload: IRunStartedPayload = {
        task_id: 'TASK-001',
        project_root: '/home/user/project',
      };

      expect(payload.title).toBeUndefined();
    });
  });

  describe('IRunFinishedPayload', () => {
    it('should define run finished payload for success', () => {
      const payload: IRunFinishedPayload = {
        ok: true,
        elapsed_ms: 30000,
        final_node_id: 'stage.done',
      };

      expect(payload.ok).toBe(true);
      expect(payload.elapsed_ms).toBe(30000);
      expect(payload.error).toBeUndefined();
    });

    it('should define run finished payload for failure', () => {
      const payload: IRunFinishedPayload = {
        ok: false,
        elapsed_ms: 15000,
        final_node_id: 'execute.test',
        error: 'Test failed: assertion error',
      };

      expect(payload.ok).toBe(false);
      expect(payload.error).toBe('Test failed: assertion error');
    });
  });

  describe('INodeStartedPayload', () => {
    it('should define node started payload', () => {
      const payload: INodeStartedPayload = {
        attempt: 1,
        timeout_ms: 300000,
      };

      expect(payload.attempt).toBe(1);
      expect(payload.timeout_ms).toBe(300000);
    });
  });

  describe('INodeLogPayload', () => {
    it('should define node log payload for stdout', () => {
      const payload: INodeLogPayload = {
        stream: LogStream.STDOUT,
        text: 'Build completed successfully',
      };

      expect(payload.stream).toBe(LogStream.STDOUT);
      expect(payload.text).toBe('Build completed successfully');
    });

    it('should define node log payload for stderr', () => {
      const payload: INodeLogPayload = {
        stream: LogStream.STDERR,
        text: 'Warning: deprecated API usage',
      };

      expect(payload.stream).toBe(LogStream.STDERR);
    });

    it('should define node log payload with artifact', () => {
      const payload: INodeLogPayload = {
        stream: LogStream.SYSTEM,
        text: 'Artifact saved',
        artifact_ref: 'outputs/result.json',
      };

      expect(payload.artifact_ref).toBe('outputs/result.json');
    });
  });

  describe('INodeFinishedPayload', () => {
    it('should define node finished payload for success', () => {
      const payload: INodeFinishedPayload = {
        status: NodeStatus.SUCCESS,
        exit_code: 0,
        elapsed_ms: 5000,
      };

      expect(payload.status).toBe(NodeStatus.SUCCESS);
      expect(payload.exit_code).toBe(0);
    });

    it('should define node finished payload for failure', () => {
      const payload: INodeFinishedPayload = {
        status: NodeStatus.FAILED,
        exit_code: 1,
        elapsed_ms: 3000,
        error: 'Process exited with code 1',
      };

      expect(payload.status).toBe(NodeStatus.FAILED);
      expect(payload.error).toBe('Process exited with code 1');
    });
  });

  describe('INodeRetryScheduledPayload', () => {
    it('should define retry scheduled payload', () => {
      const payload: INodeRetryScheduledPayload = {
        attempt: 2,
        max_attempts: 3,
        delay_ms: 5000,
        reason: 'Transient network error',
      };

      expect(payload.attempt).toBe(2);
      expect(payload.max_attempts).toBe(3);
      expect(payload.delay_ms).toBe(5000);
      expect(payload.reason).toBe('Transient network error');
    });
  });

  describe('INodeTimeoutPayload', () => {
    it('should define timeout payload', () => {
      const payload: INodeTimeoutPayload = {
        timeout_ms: 300000,
        elapsed_ms: 300100,
      };

      expect(payload.timeout_ms).toBe(300000);
      expect(payload.elapsed_ms).toBe(300100);
    });
  });

  describe('ICancelRequestedPayload', () => {
    it('should define cancel requested payload', () => {
      const payload: ICancelRequestedPayload = {
        requested_by: 'user@example.com',
      };

      expect(payload.requested_by).toBe('user@example.com');
    });
  });

  describe('ICancelledPayload', () => {
    it('should define cancelled payload', () => {
      const payload: ICancelledPayload = {
        cancelled_node_id: 'execute.build',
        skipped_nodes: ['execute.test', 'execute.deploy', 'stage.done'],
      };

      expect(payload.cancelled_node_id).toBe('execute.build');
      expect(payload.skipped_nodes).toHaveLength(3);
    });
  });

  describe('ILockAcquiredPayload', () => {
    it('should define lock acquired payload', () => {
      const payload: ILockAcquiredPayload = {
        lock_path: '/var/locks/RUN-001.lock',
        pid: 12345,
        host: 'worker-1',
      };

      expect(payload.lock_path).toBe('/var/locks/RUN-001.lock');
      expect(payload.pid).toBe(12345);
      expect(payload.host).toBe('worker-1');
    });
  });

  describe('ILockStaleClearedPayload', () => {
    it('should define stale cleared payload for TTL expired', () => {
      const payload: ILockStaleClearedPayload = {
        stale_run_id: 'RUN-OLD',
        reason: 'ttl_expired',
      };

      expect(payload.stale_run_id).toBe('RUN-OLD');
      expect(payload.reason).toBe('ttl_expired');
    });

    it('should define stale cleared payload for PID not found', () => {
      const payload: ILockStaleClearedPayload = {
        stale_run_id: 'RUN-ORPHAN',
        reason: 'pid_not_found',
      };

      expect(payload.reason).toBe('pid_not_found');
    });
  });

  describe('ILockReleasedPayload', () => {
    it('should define lock released payload', () => {
      const payload: ILockReleasedPayload = {
        lock_path: '/var/locks/RUN-001.lock',
      };

      expect(payload.lock_path).toBe('/var/locks/RUN-001.lock');
    });
  });

  describe('IEventV1 (Full Event)', () => {
    it('should create RUN_STARTED event', () => {
      const event: IEventV1 = {
        ts: '2026-01-05T12:00:00Z',
        run_id: 'RUN-001',
        type: EventType.RUN_STARTED,
        node_id: '',
        seq: 1,
        payload: {
          task_id: 'TASK-001',
          project_root: '/project',
        },
      };

      expect(event.type).toBe(EventType.RUN_STARTED);
      expect((event.payload as IRunStartedPayload).task_id).toBe('TASK-001');
    });

    it('should create NODE_FINISHED event', () => {
      const event: IEventV1 = {
        ts: '2026-01-05T12:05:00Z',
        run_id: 'RUN-001',
        type: EventType.NODE_FINISHED,
        node_id: 'execute.build',
        seq: 10,
        payload: {
          status: NodeStatus.SUCCESS,
          elapsed_ms: 5000,
        },
      };

      expect(event.type).toBe(EventType.NODE_FINISHED);
      expect(event.node_id).toBe('execute.build');
    });
  });
});
