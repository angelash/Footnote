/**
 * Lock utilities
 * 防僵尸锁：lock.json、心跳、TTL、pid 检查
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getLockDir } from './paths.mjs';
import { writeJson, readJson, exists } from './io.mjs';
import { emitLockAcquired, emitLockStaleCleared, emitLockReleased } from './events.mjs';

const DEFAULT_LOCK_TTL_MS = 7200000; // 2 小时
const HEARTBEAT_INTERVAL_MS = 10000; // 10 秒

// 心跳定时器
let heartbeatTimer = null;

/**
 * 检查进程是否存在
 * @param {number} pid 进程 ID
 * @returns {boolean}
 */
function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取锁实例目录
 */
function getLockInstanceDir(projectRoot, runId) {
  const lockDir = getLockDir(projectRoot);
  return path.posix.join(lockDir, runId);
}

/**
 * 获取锁元信息文件路径
 */
function getLockMetaPath(projectRoot, runId) {
  return path.posix.join(getLockInstanceDir(projectRoot, runId), 'lock.json');
}

/**
 * 清理过期锁
 * @param {string} projectRoot 项目根目录
 * @param {string} currentRunId 当前 run ID（用于事件记录）
 * @returns {Promise<string[]>} 被清理的 run ID 列表
 */
export async function clearStaleLocks(projectRoot, currentRunId) {
  const lockDir = getLockDir(projectRoot);
  const clearedRunIds = [];
  
  try {
    await fs.mkdir(lockDir, { recursive: true });
    const entries = await fs.readdir(lockDir);
    
    for (const entry of entries) {
      if (entry === currentRunId) continue;
      
      const lockInstanceDir = path.posix.join(lockDir, entry);
      const lockMetaPath = path.posix.join(lockInstanceDir, 'lock.json');
      
      try {
        const stat = await fs.stat(lockInstanceDir);
        if (!stat.isDirectory()) continue;
        
        const lockMeta = await readJson(lockMetaPath);
        if (!lockMeta) {
          // 无效锁目录，清理
          await fs.rm(lockInstanceDir, { recursive: true, force: true });
          clearedRunIds.push(entry);
          continue;
        }
        
        const now = Date.now();
        const updatedAt = new Date(lockMeta.updated_at).getTime();
        const ttl = lockMeta.ttl_ms || DEFAULT_LOCK_TTL_MS;
        
        // 检查 TTL
        if (now - updatedAt > ttl) {
          await fs.rm(lockInstanceDir, { recursive: true, force: true });
          clearedRunIds.push(entry);
          await emitLockStaleCleared(projectRoot, currentRunId, entry, 'ttl_expired');
          continue;
        }
        
        // 检查进程是否存在
        if (!processExists(lockMeta.pid)) {
          await fs.rm(lockInstanceDir, { recursive: true, force: true });
          clearedRunIds.push(entry);
          await emitLockStaleCleared(projectRoot, currentRunId, entry, 'pid_not_found');
          continue;
        }
      } catch {
        // 忽略单个锁检查错误
        continue;
      }
    }
  } catch (e) {
    // 锁目录不存在，忽略
    if (e.code !== 'ENOENT') throw e;
  }
  
  return clearedRunIds;
}

/**
 * 获取锁
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 * @returns {Promise<{ok: boolean, error?: string, occupiedBy?: string}>}
 */
export async function acquireLock(projectRoot, runId) {
  // 先清理过期锁
  await clearStaleLocks(projectRoot, runId);
  
  const lockDir = getLockDir(projectRoot);
  const lockInstanceDir = getLockInstanceDir(projectRoot, runId);
  const lockMetaPath = getLockMetaPath(projectRoot, runId);
  
  try {
    // 确保锁根目录存在
    await fs.mkdir(lockDir, { recursive: true });
    
    // 检查是否有其他活跃锁
    const entries = await fs.readdir(lockDir);
    for (const entry of entries) {
      if (entry === runId) continue;
      
      const otherLockDir = path.posix.join(lockDir, entry);
      const otherLockMeta = path.posix.join(otherLockDir, 'lock.json');
      
      try {
        const stat = await fs.stat(otherLockDir);
        if (!stat.isDirectory()) continue;
        
        const meta = await readJson(otherLockMeta);
        if (meta) {
          return {
            ok: false,
            error: 'lock_busy',
            occupiedBy: entry,
          };
        }
      } catch {
        continue;
      }
    }
    
    // 创建锁目录
    await fs.mkdir(lockInstanceDir);
    
    // 写入锁元信息
    const lockMeta = {
      run_id: runId,
      project_root: projectRoot,
      pid: process.pid,
      host: os.hostname(),
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ttl_ms: DEFAULT_LOCK_TTL_MS,
    };
    await writeJson(lockMetaPath, lockMeta);
    
    // 发送锁获取事件
    await emitLockAcquired(projectRoot, runId, lockInstanceDir, process.pid, os.hostname());
    
    // 启动心跳
    startHeartbeat(projectRoot, runId);
    
    return { ok: true };
  } catch (e) {
    if (e.code === 'EEXIST') {
      return {
        ok: false,
        error: 'lock_busy',
        occupiedBy: runId,
      };
    }
    throw e;
  }
}

/**
 * 释放锁
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 */
export async function releaseLock(projectRoot, runId) {
  // 停止心跳
  stopHeartbeat();
  
  const lockInstanceDir = getLockInstanceDir(projectRoot, runId);
  
  try {
    await fs.rm(lockInstanceDir, { recursive: true, force: true });
    await emitLockReleased(projectRoot, runId, lockInstanceDir);
  } catch {
    // 忽略释放错误
  }
}

/**
 * 更新锁心跳
 */
async function updateHeartbeat(projectRoot, runId) {
  const lockMetaPath = getLockMetaPath(projectRoot, runId);
  
  try {
    const lockMeta = await readJson(lockMetaPath);
    if (lockMeta) {
      lockMeta.updated_at = new Date().toISOString();
      await writeJson(lockMetaPath, lockMeta);
    }
  } catch {
    // 忽略心跳更新错误
  }
}

/**
 * 启动心跳
 */
function startHeartbeat(projectRoot, runId) {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    updateHeartbeat(projectRoot, runId);
  }, HEARTBEAT_INTERVAL_MS);
}

/**
 * 停止心跳
 */
function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

