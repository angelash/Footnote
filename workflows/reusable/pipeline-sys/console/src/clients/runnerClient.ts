/**
 * Runner Client
 * 转发到 WSL Runner 的 HTTP client
 * 
 * 注意：WSL2 端口转发可能不稳定，当直接 HTTP 连接失败时，
 * 会回退到使用 wsl curl 命令进行请求。
 */

import { config } from '../config.js';
import { spawnSync } from 'child_process';

/**
 * 检查是否在 Windows 上运行
 */
const isWindows = process.platform === 'win32';

/**
 * 通过 WSL curl 发送请求（当直接连接失败时的回退方案）
 */
async function wslFetch(url: string, options?: { method?: string; body?: string }): Promise<{ ok: boolean; status: number; data: unknown }> {
  const method = options?.method || 'GET';
  // 将 WSL IP URL 转换为 localhost URL（因为在 WSL 内部访问）
  const wslUrl = url.replace(/http:\/\/[\d.]+:(\d+)/, 'http://127.0.0.1:$1');
  
  const curlArgs = ['-s', '-w', '\\n%{http_code}', '-X', method];
  if (options?.body) {
    curlArgs.push('-H', 'Content-Type: application/json', '-d', options.body);
  }
  curlArgs.push(wslUrl);

  const result = spawnSync('wsl', ['-e', 'curl', ...curlArgs], {
    encoding: 'utf8',
    timeout: 10000,
  });

  if (result.error || result.status !== 0) {
    throw new Error(`WSL curl failed: ${result.stderr || result.error?.message}`);
  }

  const lines = result.stdout.trim().split('\n');
  const statusCode = parseInt(lines.pop() || '500', 10);
  const body = lines.join('\n');

  try {
    const data = JSON.parse(body);
    return { ok: statusCode >= 200 && statusCode < 300, status: statusCode, data };
  } catch {
    return { ok: false, status: statusCode, data: { error: body } };
  }
}

/**
 * 带回退的 fetch - 直接连接失败时使用 WSL 代理
 */
async function fetchWithFallback(url: string, options?: RequestInit): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2秒超时
    
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (directError) {
    // 直接连接失败，在 Windows 上尝试 WSL 代理
    if (isWindows) {
      const wslResult = await wslFetch(url, {
        method: options?.method,
        body: options?.body as string,
      });
      
      // 创建一个模拟的 Response 对象
      return {
        ok: wslResult.ok,
        status: wslResult.status,
        json: async () => wslResult.data,
        text: async () => JSON.stringify(wslResult.data),
      } as Response;
    }
    throw directError;
  }
}

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
    const response = await fetchWithFallback(url, {
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
    const response = await fetchWithFallback(url, {
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
    const response = await fetchWithFallback(url, { method: 'GET' });
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
    const response = await fetchWithFallback(url, { method: 'GET' });
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
    const response = await fetchWithFallback(url, {
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
    const response = await fetchWithFallback(url, { method: 'DELETE' });
    const data = await response.json() as IErrorResponse;
    if (!response.ok) {
      const error = new Error(data.error || 'Request failed') as Error & { response?: { status: number; data: unknown } };
      error.response = { status: response.status, data };
      throw error;
    }
    return { data };
  },
};