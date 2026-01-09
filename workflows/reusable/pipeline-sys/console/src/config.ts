/**
 * Pipeline-Sys Console Configuration
 * 环境变量解析与默认值
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 计算项目根目录
 * Console 位于 workflows/reusable/pipeline-sys/console/src/
 * 项目根在 5 层之上
 */
function getDefaultProjectRoot(): string {
  // 从 config.ts 所在位置向上回退 5 层到项目根目录
  // src -> console -> pipeline-sys -> reusable -> workflows -> [project root]
  return path.resolve(__dirname, '..', '..', '..', '..', '..');
}

export interface IConsoleConfig {
  /** 服务监听地址 */
  host: string;
  /** 服务监听端口 */
  port: number;
  /** 项目根目录 */
  projectRoot: string;
  /** Runner 服务基础 URL */
  runnerBaseUrl: string;
  /** 自动化运行日志相对目录 */
  automationRunsDir: string;
}

/**
 * 在 Windows 上尝试自动探测 WSL2 IP（用于访问 WSL 内 Runner）
 *
 * 背景：部分机器关闭了 WSL localhostForwarding，导致 Windows 无法通过 localhost:3210 访问 WSL 服务。
 * 这种情况下可以通过 WSL IP（如 172.x.x.x）访问。
 */
function detectWslIpOnWindows(): string | null {
  if (process.platform !== 'win32') return null;

  try {
    const r = spawnSync(
      'wsl',
      ['-e', 'bash', '-lc', "hostname -I | tr -d '\\n' | cut -d' ' -f1"],
      { encoding: 'utf8' }
    );
    const ip = String(r.stdout || '').trim();
    if (!ip) return null;
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return null;
    return ip;
  } catch {
    return null;
  }
}

/**
 * 从环境变量加载配置
 */
export function loadConfig(): IConsoleConfig {
  const envRunnerBaseUrl = process.env.RUNNER_BASE_URL;
  let runnerBaseUrl = envRunnerBaseUrl || 'http://localhost:3210';

  // Windows 下优先使用 WSL IP（若可探测到），提升兼容性
  if (!envRunnerBaseUrl && process.platform === 'win32') {
    const wslIp = detectWslIpOnWindows();
    if (wslIp) {
      runnerBaseUrl = `http://${wslIp}:3210`;
    }
  }

  return {
    host: process.env.PIPELINE_SYS_HOST || '127.0.0.1',
    port: parseInt(process.env.PIPELINE_SYS_PORT || '3230', 10),
    projectRoot: process.env.PROJECT_ROOT || getDefaultProjectRoot(),
    runnerBaseUrl,
    automationRunsDir: 'workflows/project/logs/automation_runs',
  };
}

export const config = loadConfig();

