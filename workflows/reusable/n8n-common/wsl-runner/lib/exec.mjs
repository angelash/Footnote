/**
 * Exec utilities
 * spawn + killpg + timeout 包装，流式写日志
 */

import { spawn } from 'node:child_process';
import { emitNodeLog } from './events.mjs';

/**
 * 执行命令
 * @param {object} options 选项
 * @param {string} options.cmd 命令
 * @param {string[]} options.args 参数
 * @param {string} options.cwd 工作目录
 * @param {object} options.env 环境变量
 * @param {number} options.timeoutMs 超时毫秒
 * @param {string} options.projectRoot 项目根目录
 * @param {string} options.runId run ID
 * @param {string} options.nodeId 节点 ID
 * @param {function} options.onCancel 取消检查回调
 * @returns {Promise<{code: number, stdout: string, stderr: string, timedOut: boolean, cancelled: boolean}>}
 */
export async function execWithTimeout({
  cmd,
  args,
  cwd,
  env,
  timeoutMs,
  projectRoot,
  runId,
  nodeId,
  onCancel,
}) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let timedOut = false;
    let cancelled = false;
    
    const child = spawn(cmd, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true, // 允许杀进程组
    });
    
    const stdout = [];
    const stderr = [];
    let stderrBuffer = '';
    let stdoutBuffer = '';
    
    // 流式输出到日志
    child.stdout.on('data', async (data) => {
      const text = data.toString();
      stdout.push(data);
      stdoutBuffer += text;
      
      // 按行分割并发送
      const lines = stdoutBuffer.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        await emitNodeLog(projectRoot, runId, nodeId, 'stdout', lines[i]);
      }
      stdoutBuffer = lines[lines.length - 1];
    });
    
    child.stderr.on('data', async (data) => {
      const text = data.toString();
      stderr.push(data);
      stderrBuffer += text;
      
      // 按行分割并发送
      const lines = stderrBuffer.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        await emitNodeLog(projectRoot, runId, nodeId, 'stderr', lines[i]);
      }
      stderrBuffer = lines[lines.length - 1];
    });
    
    // 超时定时器
    let timeoutTimer = null;
    if (timeoutMs > 0) {
      timeoutTimer = setTimeout(() => {
        timedOut = true;
        killProcessGroup(child.pid);
      }, timeoutMs);
    }
    
    // 取消检查定时器
    let cancelCheckTimer = null;
    if (onCancel) {
      cancelCheckTimer = setInterval(async () => {
        if (await onCancel()) {
          cancelled = true;
          killProcessGroup(child.pid);
        }
      }, 1000);
    }
    
    child.on('close', (code) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (cancelCheckTimer) clearInterval(cancelCheckTimer);
      
      // 发送剩余的缓冲内容
      if (stdoutBuffer) {
        emitNodeLog(projectRoot, runId, nodeId, 'stdout', stdoutBuffer);
      }
      if (stderrBuffer) {
        emitNodeLog(projectRoot, runId, nodeId, 'stderr', stderrBuffer);
      }
      
      resolve({
        code: code ?? 0,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
        timedOut,
        cancelled,
        elapsed_ms: Date.now() - startTime,
      });
    });
    
    child.on('error', (err) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (cancelCheckTimer) clearInterval(cancelCheckTimer);
      
      resolve({
        code: 1,
        stdout: '',
        stderr: err.message,
        timedOut: false,
        cancelled: false,
        elapsed_ms: Date.now() - startTime,
      });
    });
  });
}

/**
 * 杀死进程组
 * @param {number} pid 进程 ID
 */
function killProcessGroup(pid) {
  if (!pid) return;
  
  try {
    // 尝试杀死进程组
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      // 回退到杀单个进程
      process.kill(pid, 'SIGTERM');
    } catch {
      // 忽略
    }
  }
  
  // 强制杀死
  setTimeout(() => {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // 忽略
      }
    }
  }, 5000);
}

/**
 * 简单执行命令（不带日志流）
 */
export async function run(cmd, args, opts) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      ...opts,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (d) => stdout.push(d));
    child.stderr.on('data', (d) => stderr.push(d));
    child.on('close', (code) => {
      resolve({
        code: code ?? 0,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
      });
    });
    child.on('error', (err) => {
      resolve({
        code: 1,
        stdout: '',
        stderr: err.message,
      });
    });
  });
}

