/**
 * Runner Client
 * 转发到 WSL Runner 的 HTTP client
 */

import { config } from '../config.js';

export interface ICancelRequest {
  run_id: string;
  project_root?: string;
}

export interface IRetryRequest {
  run_id: string;
  node_id: string;
  project_root?: string;
}

export interface IRunnerResponse {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * 发送取消请求到 Runner
 */
export async function cancelRun(runId: string): Promise<IRunnerResponse> {
  const url = `${config.runnerBaseUrl}/fixed-flow/cancel`;
  
  const body: ICancelRequest = {
    run_id: runId,
    project_root: config.projectRoot,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json() as IRunnerResponse;
    return data;
  } catch (e) {
    return {
      ok: false,
      error: `Failed to connect to runner: ${(e as Error).message}`,
    };
  }
}

/**
 * 发送重试请求到 Runner
 */
export async function retryNode(runId: string, nodeId: string): Promise<IRunnerResponse> {
  const url = `${config.runnerBaseUrl}/fixed-flow/retry`;
  
  const body: IRetryRequest = {
    run_id: runId,
    node_id: nodeId,
    project_root: config.projectRoot,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json() as IRunnerResponse;
    return data;
  } catch (e) {
    return {
      ok: false,
      error: `Failed to connect to runner: ${(e as Error).message}`,
    };
  }
}

/**
 * 检查 Runner 健康状态
 */
export async function checkRunnerHealth(): Promise<boolean> {
  const url = `${config.runnerBaseUrl}/health`;

  try {
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json() as IRunnerResponse;
    return data.ok === true;
  } catch {
    return false;
  }
}


/**
 * 閫氱敤 Runner Client - axios-like 鎺ュ彛
 */
interface IErrorResponse {
  error?: string;
  [key: string]: unknown;
}

export const runnerClient = {
  async get(path: string): Promise<{ data: unknown }> {
    const url = `${config.runnerBaseUrl}${path}`;
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json() as IErrorResponse;
    if (!response.ok) {
      const error = new Error(data.error || 'Request failed') as Error & { response?: { status: number; data: unknown } };
      error.response = { status: response.status, data };
      throw error;
    }
    return { data };
  },

  async post(path: string, body?: unknown): Promise<{ data: unknown }> {
    const url = `${config.runnerBaseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json() as IErrorResponse;
    if (!response.ok) {
      const error = new Error(data.error || 'Request failed') as Error & { response?: { status: number; data: unknown } };
      error.response = { status: response.status, data };
      throw error;
    }
    return { data };
  },

  async delete(path: string): Promise<{ data: unknown }> {
    const url = `${config.runnerBaseUrl}${path}`;
    const response = await fetch(url, { method: 'DELETE' });
    const data = await response.json() as IErrorResponse;
    if (!response.ok) {
      const error = new Error(data.error || 'Request failed') as Error & { response?: { status: number; data: unknown } };
      error.response = { status: response.status, data };
      throw error;
    }
    return { data };
  },
};