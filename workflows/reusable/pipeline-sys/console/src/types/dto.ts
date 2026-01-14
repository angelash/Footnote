/**
 * Console API DTOs
 * 与前端交互的数据传输对象
 */

import type { IGraphV1, INodeRunsSnapshotV1, IStatusV1 } from '@pipeline-sys/shared';

/**
 * 运行列表项
 */
export interface IRunListItem {
  run_id: string;
  task_id: string;
  ok: boolean;
  stage: number;
  current_node_id: string;
  started_at: string;
  updated_at: string;
  // 扩展字段
  parent_id?: string;
  subtask_ids?: string[];
  flow_id?: string;
  flow_name?: string;
  raw_status?: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
}

/**
 * 运行列表响应
 */
export interface IRunsListResponse {
  runs: IRunListItem[];
  total: number;
}

/**
 * 运行详情响应
 */
export interface IRunDetailResponse {
  status: IStatusV1;
  graph: IGraphV1 | null;
  nodeRuns: INodeRunsSnapshotV1 | null;
}

/**
 * 文件读取请求
 */
export interface IFileReadRequest {
  path: string;
}

/**
 * 文件读取响应
 */
export interface IFileReadResponse {
  content: string;
  size: number;
  mtime: string;
}

/**
 * 控制操作响应
 */
export interface IControlResponse {
  ok: boolean;
  message: string;
  error?: string;
}

/**
 * 重试请求
 */
export interface IRetryRequest {
  node_id: string;
}

/**
 * 错误响应
 */
export interface IErrorResponse {
  ok: false;
  error: string;
  code?: string;
}

