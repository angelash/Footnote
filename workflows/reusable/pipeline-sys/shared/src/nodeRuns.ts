/**
 * Pipeline-Sys v1 NodeRuns Types
 * 对应 <run_id>/node_runs.json
 */

import { NodeStatus, OutputKind } from './enums.js';

/**
 * 节点输出引用（与 graph.ts 保持一致）
 */
export interface INodeOutputRefV1 {
  label: string;
  rel_path: string;
  kind: OutputKind;
}

/**
 * 单个节点的运行状态
 */
export interface INodeRunV1 {
  /** 节点状态 */
  status: NodeStatus;
  /** 当前尝试次数（从 1 开始） */
  attempt: number;
  /** 开始时间 ISO8601 */
  started_at: string | null;
  /** 结束时间 ISO8601 */
  ended_at: string | null;
  /** 耗时毫秒 */
  elapsed_ms: number | null;
  /** 最后错误信息 */
  last_error: string | null;
  /** 输出列表 */
  outputs: INodeOutputRefV1[];
}

/**
 * 节点运行状态快照
 * 对应 node_runs.json
 */
export interface INodeRunsSnapshotV1 {
  /** 版本标识 */
  version: 'v1';
  /** 运行 ID */
  run_id: string;
  /** 更新时间 ISO8601 */
  updated_at: string;
  /** 节点状态映射 */
  nodes: Record<string, INodeRunV1>;
}

/**
 * 创建空的节点运行状态
 */
export function createEmptyNodeRun(): INodeRunV1 {
  return {
    status: NodeStatus.PENDING,
    attempt: 0,
    started_at: null,
    ended_at: null,
    elapsed_ms: null,
    last_error: null,
    outputs: [],
  };
}

/**
 * 创建初始节点运行快照
 */
export function createInitialNodeRunsSnapshot(runId: string, nodeIds: string[]): INodeRunsSnapshotV1 {
  const nodes: Record<string, INodeRunV1> = {};
  for (const id of nodeIds) {
    nodes[id] = createEmptyNodeRun();
  }
  return {
    version: 'v1',
    run_id: runId,
    updated_at: new Date().toISOString(),
    nodes,
  };
}

