/**
 * Run Store 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useRunStore } from '../../state/runStore';
import type { IRunListItem, IStatus, IGraph, INodeRunsSnapshot, IEvent } from '../../types/dto';
import { EventType, NodeStatus, NodeType } from '../../types/dto';

// 重置 store 状态
const resetStore = () => {
  useRunStore.setState({
    runs: [],
    runsLoading: false,
    runsError: null,
    currentRunId: null,
    currentStatus: null,
    currentGraph: null,
    currentNodeRuns: null,
    currentLoading: false,
    currentError: null,
    selectedNodeId: null,
    events: [],
    eventsConnected: false,
  });
};

// Mock data
const mockStatus: IStatus = {
  run_id: 'RUN-123',
  task_id: 'TASK-001',
  stage: 99,
  current_node_id: 'stage.done',
  attempt: 1,
  ok: true,
  started_at: '2026-01-05T12:00:00Z',
  updated_at: '2026-01-05T12:05:00Z',
  repo: { root: '/test', branch: 'main', head: 'abc123' },
};

const mockGraph: IGraph = {
  version: 'v1',
  run_id: 'RUN-123',
  nodes: [
    { id: 'stage.intake', type: NodeType.STAGE, title: 'Intake', parent_id: null, outputs: [] },
  ],
  edges: [],
  layout: { direction: 'TB', group_padding: 16 },
};

const mockNodeRuns: INodeRunsSnapshot = {
  version: 'v1',
  run_id: 'RUN-123',
  updated_at: '2026-01-05T12:00:00Z',
  nodes: {
    'stage.intake': {
      status: NodeStatus.SUCCESS,
      attempt: 1,
      started_at: '2026-01-05T12:00:00Z',
      ended_at: '2026-01-05T12:00:05Z',
      elapsed_ms: 5000,
      last_error: null,
      outputs: [],
    },
  },
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

    it('should have runsLoading as false', () => {
      expect(useRunStore.getState().runsLoading).toBe(false);
    });

    it('should have currentLoading as false', () => {
      expect(useRunStore.getState().currentLoading).toBe(false);
    });
  });

  describe('setRuns', () => {
    it('should update runs array', () => {
      const mockRuns: IRunListItem[] = [
        { run_id: 'RUN-001', task_id: 'TASK-001', ok: true, stage: 99, current_node_id: 'stage.done', started_at: '2026-01-05T12:00:00Z', updated_at: '2026-01-05T12:05:00Z' },
        { run_id: 'RUN-002', task_id: 'TASK-002', ok: false, stage: 3, current_node_id: 'execute.edit', started_at: '2026-01-05T11:00:00Z', updated_at: '2026-01-05T11:30:00Z' },
      ];

      useRunStore.getState().setRuns(mockRuns);
      expect(useRunStore.getState().runs).toEqual(mockRuns);
    });
  });

  describe('setCurrentRun', () => {
    it('should update current run data', () => {
      useRunStore.getState().setCurrentRun('RUN-123', mockStatus, mockGraph, mockNodeRuns);
      
      expect(useRunStore.getState().currentRunId).toBe('RUN-123');
      expect(useRunStore.getState().currentStatus).toEqual(mockStatus);
      expect(useRunStore.getState().currentGraph).toEqual(mockGraph);
      expect(useRunStore.getState().currentNodeRuns).toEqual(mockNodeRuns);
    });
  });

  describe('clearCurrentRun', () => {
    it('should clear all current run data', () => {
      useRunStore.getState().setCurrentRun('RUN-123', mockStatus, mockGraph, mockNodeRuns);
      useRunStore.getState().clearCurrentRun();

      expect(useRunStore.getState().currentRunId).toBeNull();
      expect(useRunStore.getState().currentStatus).toBeNull();
      expect(useRunStore.getState().currentGraph).toBeNull();
      expect(useRunStore.getState().currentNodeRuns).toBeNull();
    });
  });

  describe('setSelectedNodeId', () => {
    it('should update selectedNodeId', () => {
      useRunStore.getState().setSelectedNodeId('stage.intake');
      expect(useRunStore.getState().selectedNodeId).toBe('stage.intake');
    });

    it('should allow null', () => {
      useRunStore.getState().setSelectedNodeId('stage.intake');
      useRunStore.getState().setSelectedNodeId(null);
      expect(useRunStore.getState().selectedNodeId).toBeNull();
    });
  });

  describe('addEvent', () => {
    it('should append event to events array', () => {
      const event1: IEvent = {
        ts: '2026-01-05T12:00:00Z',
        run_id: 'RUN-123',
        type: EventType.RUN_STARTED,
        node_id: '',
        seq: 1,
        payload: {},
      };
      const event2: IEvent = {
        ts: '2026-01-05T12:00:01Z',
        run_id: 'RUN-123',
        type: EventType.NODE_STARTED,
        node_id: 'stage.intake',
        seq: 2,
        payload: { attempt: 1 },
      };

      useRunStore.getState().addEvent(event1);
      useRunStore.getState().addEvent(event2);

      expect(useRunStore.getState().events).toHaveLength(2);
      expect(useRunStore.getState().events[0].seq).toBe(1);
      expect(useRunStore.getState().events[1].seq).toBe(2);
    });
  });

  describe('clearEvents', () => {
    it('should clear all events', () => {
      useRunStore.getState().addEvent({
        ts: '2026-01-05T12:00:00Z',
        run_id: 'RUN-123',
        type: EventType.RUN_STARTED,
        node_id: '',
        seq: 1,
        payload: {},
      });

      useRunStore.getState().clearEvents();
      expect(useRunStore.getState().events).toEqual([]);
    });
  });

  describe('setRunsLoading', () => {
    it('should update runsLoading state', () => {
      useRunStore.getState().setRunsLoading(true);
      expect(useRunStore.getState().runsLoading).toBe(true);

      useRunStore.getState().setRunsLoading(false);
      expect(useRunStore.getState().runsLoading).toBe(false);
    });
  });

  describe('setRunsError', () => {
    it('should update runsError state', () => {
      useRunStore.getState().setRunsError('Something went wrong');
      expect(useRunStore.getState().runsError).toBe('Something went wrong');
    });

    it('should allow null', () => {
      useRunStore.getState().setRunsError('Error');
      useRunStore.getState().setRunsError(null);
      expect(useRunStore.getState().runsError).toBeNull();
    });
  });

  describe('setCurrentLoading', () => {
    it('should update currentLoading state', () => {
      useRunStore.getState().setCurrentLoading(true);
      expect(useRunStore.getState().currentLoading).toBe(true);
    });
  });

  describe('setCurrentError', () => {
    it('should update currentError state', () => {
      useRunStore.getState().setCurrentError('Error loading run');
      expect(useRunStore.getState().currentError).toBe('Error loading run');
    });
  });

  describe('setEventsConnected', () => {
    it('should update eventsConnected state', () => {
      useRunStore.getState().setEventsConnected(true);
      expect(useRunStore.getState().eventsConnected).toBe(true);
    });
  });
});
