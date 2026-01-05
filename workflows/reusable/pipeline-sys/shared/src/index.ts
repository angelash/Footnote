/**
 * Pipeline-Sys Shared Types
 * v1 共享类型与枚举
 */

// Enums
export { NodeStatus, EventType, LogStream, OutputKind, NodeType } from './enums.js';

// Graph
export type { IOutputRefV1, INodeV1, IEdgeV1, ILayoutV1, IGraphV1, FixedFlowNodeId } from './graph.js';
export { FIXED_FLOW_NODE_IDS, createFixedFlowGraph } from './graph.js';

// Events
export type {
  IEventBaseV1,
  IEventV1,
  IEventPayloadV1,
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
  ITypedEvents,
} from './events.js';
export { EVENT_RULES } from './events.js';

// NodeRuns
export type { INodeOutputRefV1, INodeRunV1, INodeRunsSnapshotV1 } from './nodeRuns.js';
export { createEmptyNodeRun, createInitialNodeRunsSnapshot } from './nodeRuns.js';

// Status
export type { IRepoInfoV1, IStatusV1, IControlV1, ILockMetaV1 } from './status.js';
export { DEFAULT_LOCK_TTL_MS, LOCK_HEARTBEAT_INTERVAL_MS } from './status.js';

// Guards
export {
  isValidNodeStatus,
  isValidEventType,
  isValidEventV1,
  isValidGraphV1,
  isValidNodeRunsSnapshotV1,
  isValidStatusV1,
  parseNdjsonLine,
  parseEventsNdjson,
} from './guards.js';

