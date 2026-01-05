/**
 * Guards 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  isValidNodeStatus,
  isValidEventType,
  isValidEventV1,
  isValidGraphV1,
  isValidNodeRunsSnapshotV1,
  isValidStatusV1,
  parseNdjsonLine,
  parseEventsNdjson,
} from '../guards';
import { NodeStatus, EventType } from '../enums';

describe('isValidNodeStatus', () => {
  it('should return true for valid status', () => {
    expect(isValidNodeStatus('PENDING')).toBe(true);
    expect(isValidNodeStatus('RUNNING')).toBe(true);
    expect(isValidNodeStatus('SUCCESS')).toBe(true);
    expect(isValidNodeStatus('FAILED')).toBe(true);
  });

  it('should return false for invalid status', () => {
    expect(isValidNodeStatus('INVALID')).toBe(false);
    expect(isValidNodeStatus('')).toBe(false);
    expect(isValidNodeStatus(null)).toBe(false);
    expect(isValidNodeStatus(123)).toBe(false);
  });
});

describe('isValidEventType', () => {
  it('should return true for valid event type', () => {
    expect(isValidEventType('RUN_STARTED')).toBe(true);
    expect(isValidEventType('NODE_FINISHED')).toBe(true);
  });

  it('should return false for invalid event type', () => {
    expect(isValidEventType('INVALID')).toBe(false);
  });
});

describe('isValidEventV1', () => {
  it('should validate a correct event', () => {
    const event = {
      ts: '2026-01-05T12:00:00Z',
      run_id: 'RUN-123',
      type: EventType.NODE_STARTED,
      node_id: 'stage.intake',
      seq: 1,
      payload: { attempt: 1 },
    };
    expect(isValidEventV1(event)).toBe(true);
  });

  it('should reject invalid events', () => {
    expect(isValidEventV1(null)).toBe(false);
    expect(isValidEventV1({})).toBe(false);
    expect(isValidEventV1({ ts: '2026-01-05' })).toBe(false);
    expect(isValidEventV1({
      ts: '2026-01-05',
      run_id: 'RUN-123',
      type: 'INVALID',
      node_id: '',
      seq: 1,
      payload: {},
    })).toBe(false);
  });
});

describe('isValidGraphV1', () => {
  it('should validate a correct graph', () => {
    const graph = {
      version: 'v1',
      run_id: 'RUN-123',
      nodes: [],
      edges: [],
      layout: { direction: 'TB', group_padding: 16 },
    };
    expect(isValidGraphV1(graph)).toBe(true);
  });

  it('should reject invalid graphs', () => {
    expect(isValidGraphV1(null)).toBe(false);
    expect(isValidGraphV1({ version: 'v2' })).toBe(false);
    expect(isValidGraphV1({ version: 'v1', run_id: 'RUN-123' })).toBe(false);
  });
});

describe('isValidNodeRunsSnapshotV1', () => {
  it('should validate a correct snapshot', () => {
    const snapshot = {
      version: 'v1',
      run_id: 'RUN-123',
      updated_at: '2026-01-05T12:00:00Z',
      nodes: {},
    };
    expect(isValidNodeRunsSnapshotV1(snapshot)).toBe(true);
  });

  it('should reject invalid snapshots', () => {
    expect(isValidNodeRunsSnapshotV1(null)).toBe(false);
    expect(isValidNodeRunsSnapshotV1({ version: 'v2' })).toBe(false);
  });
});

describe('isValidStatusV1', () => {
  it('should validate a correct status', () => {
    const status = {
      run_id: 'RUN-123',
      task_id: 'TASK-001',
      stage: 1,
      current_node_id: 'stage.preflight',
      attempt: 1,
      ok: false,
      started_at: '2026-01-05T12:00:00Z',
      updated_at: '2026-01-05T12:00:00Z',
      repo: { root: '/path', branch: 'main', head: 'abc123' },
    };
    expect(isValidStatusV1(status)).toBe(true);
  });

  it('should reject invalid status', () => {
    expect(isValidStatusV1(null)).toBe(false);
    expect(isValidStatusV1({ run_id: 'RUN-123' })).toBe(false);
  });
});

describe('parseNdjsonLine', () => {
  it('should parse valid event line', () => {
    const line = JSON.stringify({
      ts: '2026-01-05T12:00:00Z',
      run_id: 'RUN-123',
      type: 'RUN_STARTED',
      node_id: '',
      seq: 1,
      payload: {},
    });
    const event = parseNdjsonLine(line);
    expect(event).not.toBeNull();
    expect(event!.seq).toBe(1);
  });

  it('should return null for empty line', () => {
    expect(parseNdjsonLine('')).toBeNull();
    expect(parseNdjsonLine('   ')).toBeNull();
  });

  it('should return null for invalid JSON', () => {
    expect(parseNdjsonLine('not json')).toBeNull();
  });

  it('should return null for invalid event', () => {
    expect(parseNdjsonLine('{"invalid": true}')).toBeNull();
  });
});

describe('parseEventsNdjson', () => {
  it('should parse multiple events', () => {
    const content = [
      '{"ts":"2026-01-05T12:00:00Z","run_id":"RUN-123","type":"RUN_STARTED","node_id":"","seq":1,"payload":{}}',
      '{"ts":"2026-01-05T12:00:01Z","run_id":"RUN-123","type":"NODE_STARTED","node_id":"stage.intake","seq":2,"payload":{"attempt":1}}',
      '',
      '{"ts":"2026-01-05T12:00:02Z","run_id":"RUN-123","type":"NODE_FINISHED","node_id":"stage.intake","seq":3,"payload":{"status":"SUCCESS"}}',
    ].join('\n');

    const events = parseEventsNdjson(content);
    expect(events).toHaveLength(3);
    expect(events[0].seq).toBe(1);
    expect(events[1].seq).toBe(2);
    expect(events[2].seq).toBe(3);
  });

  it('should handle empty content', () => {
    expect(parseEventsNdjson('')).toHaveLength(0);
  });
});

