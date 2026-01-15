/**
 * Shell Node Executor
 * 
 * 执行 Shell 命令
 * 
 * 支持的 Shell:
 * - bash (默认)
 * - sh
 * - zsh
 * - powershell
 * - cmd
 * 
 * Config:
 * - command: 要执行的命令
 * - shell: Shell 类型
 * - cwd: 工作目录
 * - env: 环境变量
 * - stdin: 标准输入
 * - captureStdout: 是否捕获 stdout (默认 true)
 * - captureStderr: 是否捕获 stderr (默认 true)
 * 
 * @module lib/v2/executors/shell
 */

import { spawn } from 'node:child_process';
import { NodeExecutor, successResult, failureResult } from '../executor-base.mjs';

/**
 * Shell 配置映射
 */
/**
 * Shell 配置映射
 * 使用绝对路径以确保在 WSL 环境中能正确找到 shell 可执行文件
 */
const SHELL_CONFIG = {
  bash: { cmd: '/usr/bin/bash', args: ['-c'] },
  sh: { cmd: '/bin/sh', args: ['-c'] },
  zsh: { cmd: '/usr/bin/zsh', args: ['-c'] },
  powershell: { cmd: 'powershell', args: ['-Command'] },
  cmd: { cmd: 'cmd', args: ['/c'] },
};

/**
 * Shell 节点执行器
 */
export class ShellExecutor extends NodeExecutor {
  constructor() {
    super('shell');
  }

  /**
   * 执行 Shell 命令
   * @param {Object} config - 节点配置
   * @param {Object} context - 执行上下文
   * @param {Object} options - 执行选项
   * @returns {Promise<NodeResult>}
   */
  async execute(config, context, options) {
    const {
      command,
      shell = 'bash',
      cwd = process.cwd(),
      env = {},
      stdin = '',
      captureStdout = true,
      captureStderr = true,
    } = config;

    if (!command) {
      return failureResult('Shell command is required');
    }

    const shellConfig = SHELL_CONFIG[shell];
    if (!shellConfig) {
      return failureResult(`Unsupported shell: ${shell}. Supported: ${Object.keys(SHELL_CONFIG).join(', ')}`);
    }

    this.info(`Executing: ${command}`, { shell, cwd, shellCmd: shellConfig.cmd });

    return new Promise((resolve, reject) => {
      const stdout = [];
      const stderr = [];
      let settled = false;

      // 合并环境变量
      const mergedEnv = { ...process.env, ...env };

      // 启动进程
      const proc = spawn(shellConfig.cmd, [...shellConfig.args, command], {
        cwd,
        env: mergedEnv,
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // 处理 stdin
      if (stdin) {
        proc.stdin.write(stdin);
        proc.stdin.end();
      } else {
        proc.stdin.end();
      }

      // 从 options 中提取流式输出回调
      const { onStdout, onStderr } = options || {};

      // 捕获 stdout
      if (captureStdout) {
        proc.stdout.on('data', (data) => {
          const text = data.toString();
          stdout.push(text);
          this.debug(`stdout: ${text.trim()}`);
          // 流式回调（用于实时推送到 UI）
          if (onStdout) {
            try { onStdout(text); } catch { /* ignore callback errors */ }
          }
        });
      }

      // 捕获 stderr
      if (captureStderr) {
        proc.stderr.on('data', (data) => {
          const text = data.toString();
          stderr.push(text);
          this.debug(`stderr: ${text.trim()}`);
          // 流式回调（用于实时推送到 UI）
          if (onStderr) {
            try { onStderr(text); } catch { /* ignore callback errors */ }
          }
        });
      }

      // 处理取消信号
      const handleAbort = () => {
        if (!settled) {
          settled = true;
          proc.kill('SIGTERM');
          // 给进程一点时间优雅退出
          setTimeout(() => {
            if (!proc.killed) {
              proc.kill('SIGKILL');
            }
          }, 1000);
          reject(new Error('Execution cancelled'));
        }
      };

      if (options.signal) {
        options.signal.addEventListener('abort', handleAbort);
      }

      // 处理错误
      proc.on('error', (err) => {
        if (!settled) {
          settled = true;
          if (options.signal) {
            options.signal.removeEventListener('abort', handleAbort);
          }
          this.error(`Process error: ${err.message}`);
          resolve(failureResult(`Process error: ${err.message}`, {
            stdout: stdout.join(''),
            stderr: stderr.join(''),
          }));
        }
      });

      // 处理退出
      proc.on('close', (code, signal) => {
        if (!settled) {
          settled = true;
          if (options.signal) {
            options.signal.removeEventListener('abort', handleAbort);
          }

          const output = {
            stdout: stdout.join(''),
            stderr: stderr.join(''),
            exitCode: code,
            signal,
          };

          if (code === 0) {
            this.info(`Command completed with exit code 0`);
            resolve(successResult(output));
          } else {
            this.warn(`Command failed with exit code ${code}`);
            resolve(failureResult(`Command exited with code ${code}`, output));
          }
        }
      });
    });
  }
}

/**
 * 创建 Shell 执行器实例
 * @returns {ShellExecutor}
 */
export function createShellExecutor() {
  return new ShellExecutor();
}

export default ShellExecutor;

