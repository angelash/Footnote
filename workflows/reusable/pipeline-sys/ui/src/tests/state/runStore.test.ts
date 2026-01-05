/**
 * Run Store 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useRunStore } from '../../state/runStore';

// 重置 store 状态
const resetStore = () => {
  useRunStore.setState({
    runs: [],
    currentRunId: null,
    selectedNodeId: null,
    nodeRunsSnapshot: null,
    events: [],
    loading: false,
    error: null,
  });
};

describe('useRunStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('should have empty runs array', () => {
      expect(useRunStore.getState().runs).toEqual([]);
    });

    it('should have null currentRunId', () => {
      expect(useRunStore.getState().currentRunId).toBeNull();
    });

    it('should have null selectedNodeId', () => {
      expect(useRunStore.getState().selectedNodeId).toBeNull();
    });

    it('should have loading as false', () => {
      expect(useRunStore.getState().loading).toBe(false);
    });
  });

  describe('setRuns', () => {
    it('should update runs array', () => {
      const mockRuns = [
        { run_id: 'RUN-001', task_id: 'TASK-001', ok: true, stage: 99, current_node_id: 'stage.done', started_at: '2026-01-05T12:00:00Z', updated_at: '2026-01-05T12:05:00Z' },
        { run_id: 'RUN-002', task_id: 'TASK-002', ok: false, stage: 3, current_node_id: 'execute.edit', started_at: '2026-01-05T11:00:00Z', updated_at: '2026-01-05T11:30:00Z' },
      ];

      useRunStore.getState().setRuns(mockRuns);
      expect(useRunStore.getState().runs).toEqual(mockRuns);
    });
  });

  describe('setCurrentRunId', () => {
    it('should update currentRunId', () => {
      useRunStore.getState().setCurrentRunId('RUN-123');
      expect(useRunStore.getState().currentRunId).toBe('RUN-123');
    });

    it('should allow null', () => {
      useRunStore.getState().setCurrentRunId('RUN-123');
      useRunStore.getState().setCurrentRunId(null);
      expect(useRunStore.getState().currentRunId).toBeNull();
    });
  });

  describe('setSelectedNodeId', () => {
    it('should update selectedNodeId', () => {
      useRunStore.getState().setSelectedNodeId('stage.intake');
      expect(useRunStore.getState().selectedNodeId).toBe('stage.intake');
    });
  });

  describe('setNodeRunsSnapshot', () => {
    it('should update nodeRunsSnapshot', () => {
      const mockSnapshot = {
        version: 'v1',
        run_id: 'RUN-123',
        updated_at: '2026-01-05T12:00:00Z',
        nodes: {
          'stage.intake': {
            status: 'SUCCESS',
            attempt: 1,
            started_at: '2026-01-05T12:00:00Z',
            ended_at: '2026-01-05T12:00:05Z',
            elapsed_ms: 5000,
            last_error: null,
            outputs: [],
          },
        },
      };

      useRunStore.getState().setNodeRunsSnapshot(mockSnapshot);
      expect(useRunStore.getState().nodeRunsSnapshot).toEqual(mockSnapshot);
    });
  });

  describe('appendEvent', () => {
    it('should append event to events array', () => {
      const event1 = {
        ts: '2026-01-05T12:00:00Z',
        run_id: 'RUN-123',
        type: 'RUN_STARTED',
        node_id: '',
        seq: 1,
        payload: {},
      };
      const event2 = {
        ts: '2026-01-05T12:00:01Z',
        run_id: 'RUN-123',
        type: 'NODE_STARTED',
        node_id: 'stage.intake',
        seq: 2,
        payload: { attempt: 1 },
      };

      useRunStore.getState().appendEvent(event1);
      useRunStore.getState().appendEvent(event2);

      expect(useRunStore.getState().events).toHaveLength(2);
      expect(useRunStore.getState().events[0].seq).toBe(1);
      expect(useRunStore.getState().events[1].seq).toBe(2);
    });
  });

  describe('clearEvents', () => {
    it('should clear all events', () => {
      useRunStore.getState().appendEvent({
        ts: '2026-01-05T12:00:00Z',
        run_id: 'RUN-123',
        type: 'RUN_STARTED',
        node_id: '',
        seq: 1,
        payload: {},
      });

      useRunStore.getState().clearEvents();
      expect(useRunStore.getState().events).toEqual([]);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      useRunStore.getState().setLoading(true);
      expect(useRunStore.getState().loading).toBe(true);

      useRunStore.getState().setLoading(false);
      expect(useRunStore.getState().loading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should update error state', () => {
      useRunStore.getState().setError('Something went wrong');
      expect(useRunStore.getState().error).toBe('Something went wrong');
    });

    it('should allow null', () => {
      useRunStore.getState().setError('Error');
      useRunStore.getState().setError(null);
      expect(useRunStore.getState().error).toBeNull();
    });
  });

  describe('getNodeStatus', () => {
    it('should return node status from snapshot', () => {
      const mockSnapshot = {
        version: 'v1',
        run_id: 'RUN-123',
        updated_at: '2026-01-05T12:00:00Z',
        nodes: {
          'stage.intake': {
            status: 'SUCCESS',
            attempt: 1,
            started_at: null,
            ended_at: null,
            elapsed_ms: null,
            last_error: null,
            outputs: [],
          },
          'stage.preflight': {
            status: 'RUNNING',
            attempt: 1,
            started_at: null,
            ended_at: null,
            elapsed_ms: null,
            last_error: null,
            outputs: [],
          },
        },
      };

      useRunStore.getState().setNodeRunsSnapshot(mockSnapshot);

      expect(useRunStore.getState().getNodeStatus('stage.intake')).toBe('SUCCESS');
      expect(useRunStore.getState().getNodeStatus('stage.preflight')).toBe('RUNNING');
    });

    it('should return PENDING for unknown node', () => {
      expect(useRunStore.getState().getNodeStatus('unknown')).toBe('PENDING');
    });
  });
});

