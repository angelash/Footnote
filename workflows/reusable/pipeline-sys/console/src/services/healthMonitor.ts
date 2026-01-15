/**
 * Health Monitor Service
 * 服务健康状态监控与自动恢复
 */

import { spawn } from 'child_process';
import { config } from '../config.js';
import { checkRunnerHealth, runnerClient } from '../clients/runnerClient.js';
import * as path from 'path';
import * as fs from 'fs';

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
interface ILogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

/**
 * Health Monitor 单例
 */
class HealthMonitor {
  private startTime: Date;
  private runnerStatus: IRunnerStatus;
  private queueStatus: IQueueStatus;
  private checkInterval: NodeJS.Timeout | null = null;
  private logs: ILogEntry[] = [];
  private maxLogs = 200;
  private consecutiveFailures = 0;
  private maxFailuresBeforeRestart = 3;
  private isRestarting = false;
  private logFilePath: string;

  constructor() {
    this.startTime = new Date();
    this.runnerStatus = {
      ok: false,
      status: 'unknown',
      last_check: new Date().toISOString(),
      retry_count: 0,
      restart_count: 0,
    };
    this.queueStatus = {
      pending: 0,
      running: 0,
    };
    this.logFilePath = path.join(config.projectRoot, 'workflows/project/logs/service_health.log');
    this.ensureLogDir();
  }

  /**
   * 确保日志目录存在
   */
  private ensureLogDir(): void {
    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 添加日志
   */
  private log(level: ILogEntry['level'], message: string): void {
    const entry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 写入文件
    const line = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}\n`;
    try {
      fs.appendFileSync(this.logFilePath, line);
    } catch {
      // 忽略写入错误
    }

    // 同时输出到控制台
    if (level === 'error') {
      console.error(`[HealthMonitor] ${message}`);
    } else if (level === 'warn') {
      console.warn(`[HealthMonitor] ${message}`);
    } else {
      console.log(`[HealthMonitor] ${message}`);
    }
  }

  /**
   * 启动健康检查
   */
  start(intervalMs = 10000): void {
    if (this.checkInterval) {
      return;
    }

    this.log('info', `Starting health monitor (interval: ${intervalMs}ms)`);

    // 立即执行一次检查
    this.performCheck();

    // 设置定时检查
    this.checkInterval = setInterval(() => {
      this.performCheck();
    }, intervalMs);
  }

  /**
   * 停止健康检查
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.log('info', 'Health monitor stopped');
    }
  }

  /**
   * 执行健康检查
   */
  private async performCheck(): Promise<void> {
    const now = new Date().toISOString();
    this.runnerStatus.last_check = now;

    try {
      const healthy = await checkRunnerHealth();

      if (healthy) {
        this.runnerStatus.ok = true;
        this.runnerStatus.status = 'online';
        this.runnerStatus.error = undefined;
        this.consecutiveFailures = 0;

        // 获取队列状态
        await this.fetchQueueStatus();
      } else {
        this.handleCheckFailure('Health check returned false');
      }
    } catch (e) {
      this.handleCheckFailure((e as Error).message);
    }
  }

  /**
   * 处理检查失败
   */
  private handleCheckFailure(error: string): void {
    this.runnerStatus.ok = false;
    this.runnerStatus.status = 'offline';
    this.runnerStatus.error = error;
    this.runnerStatus.retry_count++;
    this.consecutiveFailures++;

    this.log('warn', `Runner health check failed (${this.consecutiveFailures}/${this.maxFailuresBeforeRestart}): ${error}`);

    // 禁用自动重启 - WSL 命令会触发 PM2 信号问题导致服务崩溃
    // 用户需要手动在 WSL 终端中运行: pm2 restart wsl-cursor-runner
    // if (this.consecutiveFailures >= this.maxFailuresBeforeRestart && !this.isRestarting) {
    //   this.log('warn', 'Triggering automatic restart...');
    //   this.restartRunner();
    // }
  }

  /**
   * 获取队列状态
   */
  private async fetchQueueStatus(): Promise<void> {
    try {
      const response = await runnerClient.get('/queue');
      const data = response.data as { pending?: number; running?: number; tasks?: Array<{ status?: string }> };
      this.queueStatus = {
        pending: data.pending ?? data.tasks?.filter(t => t.status === 'pending')?.length ?? 0,
        running: data.running ?? data.tasks?.filter(t => t.status === 'running')?.length ?? 0,
      };
    } catch (e) {
      this.queueStatus.error = (e as Error).message;
    }
  }

  /**
   * 重启 WSL Runner
   */
  async restartRunner(): Promise<IRestartResult> {
    if (this.isRestarting) {
      return {
        ok: false,
        message: 'Restart already in progress',
      };
    }

    this.isRestarting = true;
    this.runnerStatus.status = 'restarting';
    this.log('info', 'Restarting WSL Runner...');

    try {
      // 检测是否在 Windows 上运行
      if (process.platform !== 'win32') {
        this.isRestarting = false;
        return {
          ok: false,
          message: 'Auto-restart only supported on Windows',
          error: 'Not running on Windows',
        };
      }

      // 使用 PM2 重启命令（避免直接 kill 导致信号传播问题）
      // PM2 方式比直接 pkill 更安全，不会触发 SIGINT 传播
      const cmd = 'pm2 restart wsl-cursor-runner --update-env';

      // 使用 spawn 执行 WSL 命令
      const child = spawn('wsl', ['-e', 'bash', '-c', cmd], {
        detached: true,
        stdio: 'ignore',
        // 使用 setsid 创建新会话，防止信号传播
        shell: false,
      });
      child.unref();

      this.runnerStatus.last_restart = new Date().toISOString();
      this.runnerStatus.restart_count++;
      this.log('info', 'WSL Runner restart command sent');

      // 等待 5 秒后检查
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 检查是否成功启动
      const healthy = await checkRunnerHealth();

      this.isRestarting = false;

      if (healthy) {
        this.runnerStatus.status = 'online';
        this.runnerStatus.ok = true;
        this.runnerStatus.error = undefined;
        this.consecutiveFailures = 0;
        this.log('info', 'WSL Runner restarted successfully');
        return {
          ok: true,
          message: 'WSL Runner restarted successfully',
        };
      } else {
        this.runnerStatus.status = 'offline';
        this.log('error', 'WSL Runner restart failed - still not responding');
        return {
          ok: false,
          message: 'Restart command sent but service not responding',
          error: 'Service not responding after restart',
        };
      }
    } catch (e) {
      this.isRestarting = false;
      this.runnerStatus.status = 'offline';
      const error = (e as Error).message;
      this.log('error', `WSL Runner restart error: ${error}`);
      return {
        ok: false,
        message: 'Failed to restart WSL Runner',
        error,
      };
    }
  }

  /**
   * 格式化运行时间
   */
  private formatUptime(): string {
    const ms = Date.now() - this.startTime.getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * 生成诊断信息
   */
  private getDiagnosis(): string {
    if (this.runnerStatus.ok) {
      return '所有服务运行正常';
    }

    if (this.isRestarting) {
      return 'WSL 执行器正在重启...';
    }

    if (this.runnerStatus.error?.includes('ECONNREFUSED')) {
      return 'WSL 执行器未运行 - 将尝试自动重启';
    }

    if (this.runnerStatus.error?.includes('timeout')) {
      return 'WSL 执行器无响应 - 可能过载或卡死';
    }

    if (this.consecutiveFailures >= this.maxFailuresBeforeRestart) {
      return `WSL 执行器在 ${this.runnerStatus.restart_count} 次重启后仍然离线 - 可能需要人工介入`;
    }

    return `WSL 执行器健康检查失败: ${this.runnerStatus.error || '未知错误'}`;
  }

  /**
   * 获取系统状态
   */
  getStatus(): ISystemStatus {
    return {
      console: {
        ok: true,
        status: 'online',
        uptime: this.formatUptime(),
        host: config.host,
        port: config.port,
      },
      runner: { ...this.runnerStatus },
      queue: { ...this.queueStatus },
      diagnosis: this.getDiagnosis(),
    };
  }

  /**
   * 获取日志
   */
  getLogs(lines = 50): ILogEntry[] {
    return this.logs.slice(-lines);
  }
}

// 单例实例
let healthMonitor: HealthMonitor | null = null;

/**
 * 获取或创建 HealthMonitor 实例
 */
export function getHealthMonitor(): HealthMonitor {
  if (!healthMonitor) {
    healthMonitor = new HealthMonitor();
  }
  return healthMonitor;
}

/**
 * 启动健康监控
 */
export function startHealthMonitor(intervalMs = 10000): void {
  getHealthMonitor().start(intervalMs);
}

/**
 * 停止健康监控
 */
export function stopHealthMonitor(): void {
  if (healthMonitor) {
    healthMonitor.stop();
  }
}
