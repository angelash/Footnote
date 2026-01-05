/**
 * Pipeline-Sys v1 Events Types
 * 对应 <run_id>/events.ndjson
 */

import { EventType, LogStream, NodeStatus } from './enums.js';

/**
 * 基础事件结构
 */
export interface IEventBaseV1 {
  /** ISO8601 时间戳 */
  ts: string;
  /** 运行 ID */
  run_id: string;
  /** 事件类型 */
  type: EventType;
  /** 节点 ID（非节点事件为空字符串） */
  node_id: string;
  /** 序列号（从 1 开始递增） */
  seq: number;
}

// ============ Payload 类型 ============

export interface IRunStartedPayload {
  task_id: string;
  title?: string;
  project_root: string;
}

export interface IRunFinishedPayload {
  ok: boolean;
  elapsed_ms: number;
  final_node_id: string;
  error?: string;
}

export interface INodeStartedPayload {
  attempt: number;
  timeout_ms: number;
}

export interface INodeLogPayload {
  stream: LogStream;
  text: string;
  artifact_ref?: string;
}

export interface INodeFinishedPayload {
  status: NodeStatus;
  exit_code?: number;
  elapsed_ms: number;
  error?: string;
}

export interface INodeRetryScheduledPayload {
  attempt: number;
  max_attempts: number;
  delay_ms: number;
  reason: string;
}

export interface INodeTimeoutPayload {
  timeout_ms: number;
  elapsed_ms: number;
}

export interface ICancelRequestedPayload {
  requested_by: string;
}

export interface ICancelledPayload {
  cancelled_node_id: string;
  skipped_nodes: string[];
}

export interface ILockAcquiredPayload {
  lock_path: string;
  pid: number;
  host: string;
}

export interface ILockStaleClearedPayload {
  stale_run_id: string;
  reason: 'ttl_expired' | 'pid_not_found';
}

export interface ILockReleasedPayload {
  lock_path: string;
}

// ============ 联合类型 ============

export type IEventPayloadV1 =
  | IRunStartedPayload
  | IRunFinishedPayload
  | INodeStartedPayload
  | INodeLogPayload
  | INodeFinishedPayload
  | INodeRetryScheduledPayload
  | INodeTimeoutPayload
  | ICancelRequestedPayload
  | ICancelledPayload
  | ILockAcquiredPayload
  | ILockStaleClearedPayload
  | ILockReleasedPayload
  | Record<string, unknown>;

/**
 * 完整事件结构
 */
export interface IEventV1 extends IEventBaseV1 {
  payload: IEventPayloadV1;
}

/**
 * 带类型推断的事件工厂
 */
export interface ITypedEvents {
  RUN_STARTED: IEventBaseV1 & { type: EventType.RUN_STARTED; payload: IRunStartedPayload };
  RUN_FINISHED: IEventBaseV1 & { type: EventType.RUN_FINISHED; payload: IRunFinishedPayload };
  NODE_STARTED: IEventBaseV1 & { type: EventType.NODE_STARTED; payload: INodeStartedPayload };
  NODE_LOG: IEventBaseV1 & { type: EventType.NODE_LOG; payload: INodeLogPayload };
  NODE_FINISHED: IEventBaseV1 & { type: EventType.NODE_FINISHED; payload: INodeFinishedPayload };
  NODE_RETRY_SCHEDULED: IEventBaseV1 & { type: EventType.NODE_RETRY_SCHEDULED; payload: INodeRetryScheduledPayload };
  NODE_TIMEOUT: IEventBaseV1 & { type: EventType.NODE_TIMEOUT; payload: INodeTimeoutPayload };
  RUN_CANCEL_REQUESTED: IEventBaseV1 & { type: EventType.RUN_CANCEL_REQUESTED; payload: ICancelRequestedPayload };
  RUN_CANCELLED: IEventBaseV1 & { type: EventType.RUN_CANCELLED; payload: ICancelledPayload };
  LOCK_ACQUIRED: IEventBaseV1 & { type: EventType.LOCK_ACQUIRED; payload: ILockAcquiredPayload };
  LOCK_STALE_CLEARED: IEventBaseV1 & { type: EventType.LOCK_STALE_CLEARED; payload: ILockStaleClearedPayload };
  LOCK_RELEASED: IEventBaseV1 & { type: EventType.LOCK_RELEASED; payload: ILockReleasedPayload };
}

/**
 * 事件写入规则常量
 */
export const EVENT_RULES = {
  /** 单条事件 payload 最大字节数 */
  MAX_PAYLOAD_BYTES: 64 * 1024,
  /** NODE_LOG 文本截断长度 */
  MAX_LOG_TEXT_LENGTH: 4000,
} as const;

