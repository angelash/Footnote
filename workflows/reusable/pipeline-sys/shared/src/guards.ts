/**
 * Pipeline-Sys v1 Runtime Guards
 * 轻量运行时校验
 */

import { NodeStatus, EventType } from './enums.js';
import type { IEventV1 } from './events.js';
import type { IGraphV1 } from './graph.js';
import type { INodeRunsSnapshotV1 } from './nodeRuns.js';
import type { IStatusV1 } from './status.js';

/**
 * 检查值是否为有效的 NodeStatus
 */
export function isValidNodeStatus(value: unknown): value is NodeStatus {
  return typeof value === 'string' && Object.values(NodeStatus).includes(value as NodeStatus);
}

/**
 * 检查值是否为有效的 EventType
 */
export function isValidEventType(value: unknown): value is EventType {
  return typeof value === 'string' && Object.values(EventType).includes(value as EventType);
}

/**
 * 检查对象是否为有效的 IEventV1
 */
export function isValidEventV1(obj: unknown): obj is IEventV1 {
  if (!obj || typeof obj !== 'object') return false;
  const e = obj as Record<string, unknown>;
  return (
    typeof e.ts === 'string' &&
    typeof e.run_id === 'string' &&
    isValidEventType(e.type) &&
    typeof e.node_id === 'string' &&
    typeof e.seq === 'number' &&
    e.payload !== undefined
  );
}

/**
 * 检查对象是否为有效的 IGraphV1
 */
export function isValidGraphV1(obj: unknown): obj is IGraphV1 {
  if (!obj || typeof obj !== 'object') return false;
  const g = obj as Record<string, unknown>;
  return (
    g.version === 'v1' &&
    typeof g.run_id === 'string' &&
    Array.isArray(g.nodes) &&
    Array.isArray(g.edges)
  );
}

/**
 * 检查对象是否为有效的 INodeRunsSnapshotV1
 */
export function isValidNodeRunsSnapshotV1(obj: unknown): obj is INodeRunsSnapshotV1 {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Record<string, unknown>;
  return (
    s.version === 'v1' &&
    typeof s.run_id === 'string' &&
    typeof s.updated_at === 'string' &&
    s.nodes !== undefined &&
    typeof s.nodes === 'object'
  );
}

/**
 * 检查对象是否为有效的 IStatusV1
 */
export function isValidStatusV1(obj: unknown): obj is IStatusV1 {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.run_id === 'string' &&
    typeof s.task_id === 'string' &&
    typeof s.stage === 'number' &&
    typeof s.ok === 'boolean' &&
    typeof s.started_at === 'string' &&
    typeof s.updated_at === 'string'
  );
}

/**
 * 解析 NDJSON 行
 */
export function parseNdjsonLine(line: string): IEventV1 | null {
  if (!line.trim()) return null;
  try {
    const obj = JSON.parse(line);
    if (isValidEventV1(obj)) return obj;
    return null;
  } catch {
    return null;
  }
}

/**
 * 解析整个 events.ndjson 内容
 */
export function parseEventsNdjson(content: string): IEventV1[] {
  return content
    .split('\n')
    .map(parseNdjsonLine)
    .filter((e): e is IEventV1 => e !== null);
}

