/**
 * Enums 单元测试
 */

import { describe, it, expect } from 'vitest';
import { NodeStatus, EventType, LogStream, OutputKind, NodeType } from '../enums';

describe('NodeStatus', () => {
  it('should have all required status values', () => {
    expect(NodeStatus.PENDING).toBe('PENDING');
    expect(NodeStatus.RUNNING).toBe('RUNNING');
    expect(NodeStatus.SUCCESS).toBe('SUCCESS');
    expect(NodeStatus.FAILED).toBe('FAILED');
    expect(NodeStatus.SKIPPED).toBe('SKIPPED');
    expect(NodeStatus.CANCELLED).toBe('CANCELLED');
    expect(NodeStatus.TIMEOUT).toBe('TIMEOUT');
  });

  it('should have exactly 7 status values', () => {
    const values = Object.values(NodeStatus);
    expect(values).toHaveLength(7);
  });
});

describe('EventType', () => {
  it('should have all run lifecycle events', () => {
    expect(EventType.RUN_STARTED).toBe('RUN_STARTED');
    expect(EventType.RUN_FINISHED).toBe('RUN_FINISHED');
    expect(EventType.RUN_CANCEL_REQUESTED).toBe('RUN_CANCEL_REQUESTED');
    expect(EventType.RUN_CANCELLED).toBe('RUN_CANCELLED');
  });

  it('should have all node lifecycle events', () => {
    expect(EventType.NODE_STARTED).toBe('NODE_STARTED');
    expect(EventType.NODE_LOG).toBe('NODE_LOG');
    expect(EventType.NODE_FINISHED).toBe('NODE_FINISHED');
    expect(EventType.NODE_RETRY_SCHEDULED).toBe('NODE_RETRY_SCHEDULED');
    expect(EventType.NODE_TIMEOUT).toBe('NODE_TIMEOUT');
  });

  it('should have all lock events', () => {
    expect(EventType.LOCK_ACQUIRED).toBe('LOCK_ACQUIRED');
    expect(EventType.LOCK_STALE_CLEARED).toBe('LOCK_STALE_CLEARED');
    expect(EventType.LOCK_RELEASED).toBe('LOCK_RELEASED');
  });
});

describe('LogStream', () => {
  it('should have stdout, stderr, and system', () => {
    expect(LogStream.STDOUT).toBe('stdout');
    expect(LogStream.STDERR).toBe('stderr');
    expect(LogStream.SYSTEM).toBe('system');
  });
});

describe('OutputKind', () => {
  it('should have all output kinds', () => {
    expect(OutputKind.JSON).toBe('json');
    expect(OutputKind.MARKDOWN).toBe('markdown');
    expect(OutputKind.TEXT).toBe('text');
    expect(OutputKind.FILE).toBe('file');
  });
});

describe('NodeType', () => {
  it('should have all node types', () => {
    expect(NodeType.STAGE).toBe('stage');
    expect(NodeType.GROUP).toBe('group');
    expect(NodeType.TASK).toBe('task');
  });
});

