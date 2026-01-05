/**
 * UI Types - 与后端 DTO 对齐
 */

// ============ Enums ============

export enum NodeStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
  TIMEOUT = 'TIMEOUT',
}

export enum EventType {
  RUN_STARTED = 'RUN_STARTED',
  RUN_FINISHED = 'RUN_FINISHED',
  RUN_CANCEL_REQUESTED = 'RUN_CANCEL_REQUESTED',
  RUN_CANCELLED = 'RUN_CANCELLED',
  NODE_STARTED = 'NODE_STARTED',
  NODE_LOG = 'NODE_LOG',
  NODE_FINISHED = 'NODE_FINISHED',
  NODE_RETRY_SCHEDULED = 'NODE_RETRY_SCHEDULED',
  NODE_TIMEOUT = 'NODE_TIMEOUT',
  LOCK_ACQUIRED = 'LOCK_ACQUIRED',
  LOCK_STALE_CLEARED = 'LOCK_STALE_CLEARED',
  LOCK_RELEASED = 'LOCK_RELEASED',
}

export enum OutputKind {
  JSON = 'json',
  MARKDOWN = 'markdown',
  TEXT = 'text',
  FILE = 'file',
}

export enum NodeType {
  STAGE = 'stage',
  GROUP = 'group',
  TASK = 'task',
}

// ============ Graph Types ============

export interface IOutputRef {
  label: string;
  rel_path: string;
  kind: OutputKind;
}

export interface IGraphNode {
  id: string;
  type: NodeType;
  title: string;
  parent_id: string | null;
  outputs: IOutputRef[];
}

export interface IGraphEdge {
  from: string;
  to: string;
}

export interface IGraph {
  version: string;
  run_id: string;
  nodes: IGraphNode[];
  edges: IGraphEdge[];
  layout: {
    direction: 'TB' | 'LR';
    group_padding: number;
  };
}

// ============ NodeRuns Types ============

export interface INodeRun {
  status: NodeStatus;
  attempt: number;
  started_at: string | null;
  ended_at: string | null;
  elapsed_ms: number | null;
  last_error: string | null;
  outputs: IOutputRef[];
}

export interface INodeRunsSnapshot {
  version: string;
  run_id: string;
  updated_at: string;
  nodes: Record<string, INodeRun>;
}

// ============ Status Types ============

export interface IRepoInfo {
  root: string;
  branch: string;
  head: string;
}

export interface IStatus {
  run_id: string;
  task_id: string;
  stage: number;
  current_node_id: string;
  attempt: number;
  ok: boolean;
  error?: string;
  started_at: string;
  updated_at: string;
  repo: IRepoInfo;
  note?: string;
}

// ============ Event Types ============

export interface IEvent {
  ts: string;
  run_id: string;
  type: EventType;
  node_id: string;
  seq: number;
  payload: Record<string, unknown>;
}

// ============ API Response Types ============

export interface IRunListItem {
  run_id: string;
  task_id: string;
  ok: boolean;
  stage: number;
  current_node_id: string;
  started_at: string;
  updated_at: string;
}

export interface IRunsListResponse {
  runs: IRunListItem[];
  total: number;
}

export interface IRunDetailResponse {
  status: IStatus;
  graph: IGraph | null;
  nodeRuns: INodeRunsSnapshot | null;
}

export interface IFileReadResponse {
  content: string;
  size: number;
  mtime: string;
}

export interface IControlResponse {
  ok: boolean;
  message: string;
  error?: string;
}

export interface IErrorResponse {
  ok: false;
  error: string;
  code?: string;
}

