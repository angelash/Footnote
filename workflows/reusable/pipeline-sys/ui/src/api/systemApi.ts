/**
 * System API Client
 * 系统状态监控 API
 */

export const API_BASE = '/api';

/**
 * 服务状态
 */
export type ServiceStatus = 'online' | 'offline' | 'restarting' | 'unknown';

/**
 * Runner 状态详情
 */
export interface IRunnerStatus {
  ok: boolean;
  status: ServiceStatus;
  error?: string;
  last_check: string;
  retry_count: number;
  last_restart?: string;
  restart_count: number;
}

/**
 * 队列状态
 */
export interface IQueueStatus {
  pending: number;
  running: number;
  error?: string;
}

/**
 * 系统整体状态
 */
export interface ISystemStatus {
  console: {
    ok: boolean;
    status: ServiceStatus;
    uptime: string;
    host: string;
    port: number;
  };
  runner: IRunnerStatus;
  queue: IQueueStatus;
  diagnosis: string;
}

/**
 * 重启结果
 */
export interface IRestartResult {
  ok: boolean;
  message: string;
  error?: string;
}

/**
 * 日志条目
 */
export interface ILogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

/**
 * 日志响应
 */
export interface ILogsResponse {
  ok: boolean;
  logs: ILogEntry[];
}

/**
 * 获取系统状态
 */
export async function fetchSystemStatus(): Promise<ISystemStatus> {
  const response = await fetch(`${API_BASE}/system/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch system status: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 重启 WSL Runner
 */
export async function restartRunner(): Promise<IRestartResult> {
  const response = await fetch(`${API_BASE}/system/restart-runner`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to restart runner: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取服务日志
 */
export async function fetchSystemLogs(lines = 50): Promise<ILogsResponse> {
  const response = await fetch(`${API_BASE}/system/logs?lines=${lines}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.statusText}`);
  }
  return response.json();
}
