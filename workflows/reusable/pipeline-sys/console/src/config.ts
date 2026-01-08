/**
 * Pipeline-Sys Console Configuration
 * 环境变量解析与默认值
 */

import path from 'path';
import { fileURLToPath } from 'url';

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
 * 从环境变量加载配置
 */
export function loadConfig(): IConsoleConfig {
  return {
    host: process.env.PIPELINE_SYS_HOST || '127.0.0.1',
    port: parseInt(process.env.PIPELINE_SYS_PORT || '3230', 10),
    projectRoot: process.env.PROJECT_ROOT || getDefaultProjectRoot(),
    runnerBaseUrl: process.env.RUNNER_BASE_URL || 'http://127.0.0.1:3210',
    automationRunsDir: 'workflows/project/logs/automation_runs',
  };
}

export const config = loadConfig();

