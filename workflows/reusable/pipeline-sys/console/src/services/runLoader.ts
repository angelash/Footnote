/**
 * Run Loader Service
 * 安全读取某个 run 的工件文件
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getRunDir } from './runsIndex.js';
import { safeResolveUnderRun } from './pathGuards.js';
import { isValidStatusV1, isValidGraphV1, isValidNodeRunsSnapshotV1 } from '@pipeline-sys/shared';
import type { IStatusV1, IGraphV1, INodeRunsSnapshotV1 } from '@pipeline-sys/shared';

/**
 * V2 FlowRunner 状态格式
 */
interface IStatusV2 {
  run_id: string;
  flow_id: string;
  flow_name?: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  error?: string | null;
}

/**
 * 检查是否为 v2 格式
 */
function isValidStatusV2(obj: unknown): obj is IStatusV2 {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.run_id === 'string' &&
    typeof s.flow_id === 'string' &&
    typeof s.status === 'string' &&
    typeof s.started_at === 'string'
  );
}

/**
 * 将 v2 状态转换为 v1 兼容格式
 */
function convertV2ToV1(v2: IStatusV2): IStatusV1 {
  return {
    run_id: v2.run_id,
    task_id: v2.flow_id,
    stage: v2.status === 'SUCCESS' ? 99 : v2.status === 'RUNNING' ? 50 : 0,
    current_node_id: '',
    attempt: 1,
    ok: v2.status === 'SUCCESS',
    started_at: v2.started_at,
    updated_at: v2.finished_at || v2.started_at,
  };
}

/**
 * 加载 status.json（支持 v1 和 v2 格式）
 */
export async function loadStatus(runId: string): Promise<IStatusV1 | null> {
  const runDir = getRunDir(runId);
  const statusPath = path.join(runDir, 'status.json');
  
  try {
    const content = await fs.readFile(statusPath, 'utf8');
    const data = JSON.parse(content);
    
    // 先尝试 v1 格式
    if (isValidStatusV1(data)) {
      return data;
    }
    
    // 再尝试 v2 格式并转换
    if (isValidStatusV2(data)) {
      return convertV2ToV1(data);
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * V2 Graph 节点
 */
interface IGraphNodeV2 {
  id: string;
  type: string;
  name?: string;
  status: string;
}

/**
 * V2 Graph 边（实际数据用 source/target）
 */
interface IGraphEdgeV2 {
  source: string;
  target: string;
  label?: string;
}

/**
 * V2 Graph 格式
 */
interface IGraphV2 {
  nodes: IGraphNodeV2[];
  edges?: IGraphEdgeV2[];
}

/**
 * 检查是否为 v2 格式 graph
 */
function isValidGraphV2(obj: unknown): obj is IGraphV2 {
  if (!obj || typeof obj !== 'object') return false;
  const g = obj as Record<string, unknown>;
  return Array.isArray(g.nodes);
}

/**
 * 将 v2 graph 转换为 v1 兼容格式
 */
function convertGraphV2ToV1(v2: IGraphV2, runId: string): IGraphV1 {
  const nodes: IGraphV1['nodes'] = v2.nodes.map((n) => ({
    id: n.id,
    type: n.type as IGraphV1['nodes'][number]['type'],
    title: n.name || n.id,  // v1 用 title，v2 用 name
    parent_id: null,
    outputs: [],
  }));
  
  // v2 edge 用 source/target，v1 用 from/to
  const edges: IGraphV1['edges'] = v2.edges?.map(e => ({
    from: e.source,
    to: e.target,
  })) || [];
  
  return {
    version: 'v1',
    run_id: runId,
    nodes,
    edges,
    layout: { direction: 'TB', group_padding: 16 },
  };
}

/**
 * 加载 graph.json（支持 v1 和 v2 格式）
 */
export async function loadGraph(runId: string): Promise<IGraphV1 | null> {
  const runDir = getRunDir(runId);
  const graphPath = path.join(runDir, 'graph.json');
  
  try {
    const content = await fs.readFile(graphPath, 'utf8');
    const data = JSON.parse(content);
    
    // 先尝试 v1 格式
    if (isValidGraphV1(data)) {
      return data;
    }
    
    // 再尝试 v2 格式并转换
    if (isValidGraphV2(data)) {
      return convertGraphV2ToV1(data, runId);
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * V2 NodeRuns 格式（直接是 nodeId -> nodeData 的映射）
 */
interface INodeRunV2 {
  status: string;
  output?: unknown;
  error?: string;
  duration?: number;
}

type INodeRunsV2 = Record<string, INodeRunV2>;

/**
 * 检查是否为 v2 格式 node_runs
 */
function isValidNodeRunsV2(obj: unknown): obj is INodeRunsV2 {
  if (!obj || typeof obj !== 'object') return false;
  // v2 格式没有 version 字段，直接是 nodeId -> data 的映射
  const runs = obj as Record<string, unknown>;
  if ('version' in runs) return false; // v1 有 version
  
  // 检查每个值是否有 status 字段
  for (const value of Object.values(runs)) {
    if (!value || typeof value !== 'object') return false;
    if (!('status' in value)) return false;
  }
  return true;
}

/**
 * 将 v2 node_runs 转换为 v1 兼容格式
 */
function convertNodeRunsV2ToV1(v2: INodeRunsV2, runId: string): INodeRunsSnapshotV1 {
  const nodes: INodeRunsSnapshotV1['nodes'] = {};
  
  for (const [nodeId, nodeData] of Object.entries(v2)) {
    nodes[nodeId] = {
      status: nodeData.status as INodeRunsSnapshotV1['nodes'][string]['status'],
      output: nodeData.output,
      error: nodeData.error,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: nodeData.duration || 0,
    };
  }
  
  return {
    version: 'v1',
    run_id: runId,
    updated_at: new Date().toISOString(),
    nodes,
  };
}

/**
 * 加载 node_runs.json（支持 v1 和 v2 格式）
 */
export async function loadNodeRuns(runId: string): Promise<INodeRunsSnapshotV1 | null> {
  const runDir = getRunDir(runId);
  const nodeRunsPath = path.join(runDir, 'node_runs.json');
  
  try {
    const content = await fs.readFile(nodeRunsPath, 'utf8');
    const data = JSON.parse(content);
    
    // 先尝试 v1 格式
    if (isValidNodeRunsSnapshotV1(data)) {
      return data;
    }
    
    // 再尝试 v2 格式并转换
    if (isValidNodeRunsV2(data)) {
      return convertNodeRunsV2ToV1(data, runId);
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * 读取 run 目录内的任意文件（路径受限）
 */
export async function readRunFile(runId: string, relPath: string): Promise<{
  content: string;
  size: number;
  mtime: string;
} | null> {
  const runDir = getRunDir(runId);
  
  try {
    const absPath = safeResolveUnderRun(runDir, relPath);
    const stat = await fs.stat(absPath);
    
    if (!stat.isFile()) {
      return null;
    }
    
    const content = await fs.readFile(absPath, 'utf8');
    
    return {
      content,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * 获取 events.ndjson 路径
 */
export function getEventsPath(runId: string): string {
  const runDir = getRunDir(runId);
  return path.join(runDir, 'events.ndjson');
}

