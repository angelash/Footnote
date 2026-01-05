/**
 * Pipeline-Sys v1 Enums
 * 定义节点状态和事件类型的固定枚举
 */

/**
 * 节点状态枚举
 * @description 所有节点状态取值固定
 */
export enum NodeStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
  TIMEOUT = 'TIMEOUT',
}

/**
 * 事件类型枚举
 * @description v1 支持的事件类型固定
 */
export enum EventType {
  // Run 生命周期
  RUN_STARTED = 'RUN_STARTED',
  RUN_FINISHED = 'RUN_FINISHED',
  RUN_CANCEL_REQUESTED = 'RUN_CANCEL_REQUESTED',
  RUN_CANCELLED = 'RUN_CANCELLED',

  // Node 生命周期
  NODE_STARTED = 'NODE_STARTED',
  NODE_LOG = 'NODE_LOG',
  NODE_FINISHED = 'NODE_FINISHED',
  NODE_RETRY_SCHEDULED = 'NODE_RETRY_SCHEDULED',
  NODE_TIMEOUT = 'NODE_TIMEOUT',

  // Lock 事件
  LOCK_ACQUIRED = 'LOCK_ACQUIRED',
  LOCK_STALE_CLEARED = 'LOCK_STALE_CLEARED',
  LOCK_RELEASED = 'LOCK_RELEASED',
}

/**
 * 日志流类型
 */
export enum LogStream {
  STDOUT = 'stdout',
  STDERR = 'stderr',
  SYSTEM = 'system',
}

/**
 * 输出类型
 */
export enum OutputKind {
  JSON = 'json',
  MARKDOWN = 'markdown',
  TEXT = 'text',
  FILE = 'file',
}

/**
 * 节点类型
 */
export enum NodeType {
  STAGE = 'stage',
  GROUP = 'group',
  TASK = 'task',
}

