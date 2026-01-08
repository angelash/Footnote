/**
 * Queue API Client
 * 队列管理 API 客户端
 */

import { API_BASE } from './consoleApi';

// 队列状态
export interface QueueStatus {
  ok: boolean;
  paused: boolean;
  current: string | null;
  queue: QueuedTask[];
  history_count: number;
}

// 队列任务
export interface QueuedTask {
  id: string;
  flowspec: string;
  inputs: Record<string, unknown>;
  priority: number;
  parent_id: string | null;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  queued_at: string;
  started_at?: string;
  finished_at?: string;
  error?: string;
  result?: Record<string, unknown>;
}

// 历史响应
export interface HistoryResponse {
  ok: boolean;
  history: QueuedTask[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * 获取队列状态
 */
export async function getQueueStatus(): Promise<QueueStatus> {
  const response = await fetch(`${API_BASE}/queue`);
  if (!response.ok) {
    throw new Error(`Failed to fetch queue status: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取队列历史
 */
export async function getQueueHistory(limit = 20, offset = 0): Promise<HistoryResponse> {
  const response = await fetch(`${API_BASE}/queue/history?limit=${limit}&offset=${offset}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch queue history: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 暂停队列
 */
export async function pauseQueue(): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/queue/pause`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to pause queue: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 恢复队列
 */
export async function resumeQueue(): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/queue/resume`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to resume queue: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 清空队列
 */
export async function clearQueue(): Promise<{ ok: boolean; cleared_count: number }> {
  const response = await fetch(`${API_BASE}/queue/clear`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to clear queue: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取任务详情
 */
export async function getTask(taskId: string): Promise<{ ok: boolean; task: QueuedTask }> {
  const response = await fetch(`${API_BASE}/queue/${encodeURIComponent(taskId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch task: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 取消任务
 */
export async function cancelTask(taskId: string): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/queue/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to cancel task: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 重试任务
 */
export async function retryTask(taskId: string): Promise<{ ok: boolean; new_task_id: string }> {
  const response = await fetch(`${API_BASE}/queue/${encodeURIComponent(taskId)}/retry`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to retry task: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 调整优先级
 */
export async function setTaskPriority(
  taskId: string,
  priority: number
): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/queue/${encodeURIComponent(taskId)}/priority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority }),
  });
  if (!response.ok) {
    throw new Error(`Failed to set priority: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取子任务
 */
export async function getSubtasks(taskId: string): Promise<{
  ok: boolean;
  parent_id: string;
  count: number;
  subtasks: QueuedTask[];
}> {
  const response = await fetch(`${API_BASE}/queue/${encodeURIComponent(taskId)}/subtasks`);
  if (!response.ok) {
    throw new Error(`Failed to fetch subtasks: ${response.statusText}`);
  }
  return response.json();
}
