/**
 * NodeRuns 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  createEmptyNodeRun,
  createInitialNodeRunsSnapshot,
} from '../nodeRuns';
import { NodeStatus } from '../enums';
import { FIXED_FLOW_NODE_IDS } from '../graph';

describe('createEmptyNodeRun', () => {
  it('should create a node run with PENDING status', () => {
    const nodeRun = createEmptyNodeRun();
    expect(nodeRun.status).toBe(NodeStatus.PENDING);
  });

  it('should create a node run with zero attempt', () => {
    const nodeRun = createEmptyNodeRun();
    expect(nodeRun.attempt).toBe(0);
  });

  it('should have null timestamps', () => {
    const nodeRun = createEmptyNodeRun();
    expect(nodeRun.started_at).toBeNull();
    expect(nodeRun.ended_at).toBeNull();
    expect(nodeRun.elapsed_ms).toBeNull();
  });

  it('should have null error and empty outputs', () => {
    const nodeRun = createEmptyNodeRun();
    expect(nodeRun.last_error).toBeNull();
    expect(nodeRun.outputs).toEqual([]);
  });
});

describe('createInitialNodeRunsSnapshot', () => {
  const runId = 'RUN-20260105-123456-abcd';
  const snapshot = createInitialNodeRunsSnapshot(runId, [...FIXED_FLOW_NODE_IDS]);

  it('should have version v1', () => {
    expect(snapshot.version).toBe('v1');
  });

  it('should set run_id correctly', () => {
    expect(snapshot.run_id).toBe(runId);
  });

  it('should have updated_at timestamp', () => {
    expect(snapshot.updated_at).toBeDefined();
    expect(new Date(snapshot.updated_at).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('should have nodes for all fixed flow node IDs', () => {
    for (const nodeId of FIXED_FLOW_NODE_IDS) {
      expect(snapshot.nodes[nodeId]).toBeDefined();
      expect(snapshot.nodes[nodeId].status).toBe(NodeStatus.PENDING);
    }
  });

  it('should have correct number of nodes', () => {
    expect(Object.keys(snapshot.nodes)).toHaveLength(FIXED_FLOW_NODE_IDS.length);
  });
});

