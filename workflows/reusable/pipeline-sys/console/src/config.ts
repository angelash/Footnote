/**
 * Pipeline-Sys Console Configuration
 * 环境变量解析与默认值
 */

export interface IConsoleConfig {
  /** 服务监听地址 */
  host: string;
  /** 服务监听端口 */
  port: number;
  /** 项目根目录（WSL 路径） */
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
    projectRoot: process.env.PROJECT_ROOT || '/home/shash/work/Footnote',
    runnerBaseUrl: process.env.RUNNER_BASE_URL || 'http://127.0.0.1:3210',
    automationRunsDir: 'workflows/project/logs/automation_runs',
  };
}

export const config = loadConfig();

