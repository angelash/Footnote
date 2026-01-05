/**
 * Console API Client
 * 调用 Console API（run 列表/详情/文件）
 */

import type {
  IRunsListResponse,
  IRunDetailResponse,
  IFileReadResponse,
  IControlResponse,
} from '../types/dto';

const API_BASE = '/api';

/**
 * 获取所有 run 列表
 */
export async function fetchRuns(): Promise<IRunsListResponse> {
  const response = await fetch(`${API_BASE}/runs`);
  if (!response.ok) {
    throw new Error(`Failed to fetch runs: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取单个 run 详情
 */
export async function fetchRunDetail(runId: string): Promise<IRunDetailResponse> {
  const response = await fetch(`${API_BASE}/runs/${runId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch run detail: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 读取 run 目录内的文件
 */
export async function fetchRunFile(runId: string, relPath: string): Promise<IFileReadResponse> {
  const response = await fetch(`${API_BASE}/runs/${runId}/file?path=${encodeURIComponent(relPath)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 取消运行
 */
export async function cancelRun(runId: string): Promise<IControlResponse> {
  const response = await fetch(`${API_BASE}/runs/${runId}/cancel`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to cancel run: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 重试节点
 */
export async function retryNode(runId: string, nodeId: string): Promise<IControlResponse> {
  const response = await fetch(`${API_BASE}/runs/${runId}/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ node_id: nodeId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to retry node: ${response.statusText}`);
  }
  return response.json();
}

