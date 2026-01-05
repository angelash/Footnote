/**
 * Events utilities
 * 事件流写入（NDJSON）
 */

import path from 'node:path';
import { appendText, ensureDir } from './io.mjs';
import { getRunDir } from './paths.mjs';

const MAX_LOG_TEXT_LENGTH = 4000;
const MAX_PAYLOAD_BYTES = 64 * 1024;

// 全局序列号计数器（按 runId 分开）
const seqCounters = new Map();

/**
 * 获取下一个序列号
 * @param {string} runId run ID
 * @returns {number}
 */
function getNextSeq(runId) {
  const current = seqCounters.get(runId) || 0;
  const next = current + 1;
  seqCounters.set(runId, next);
  return next;
}

/**
 * 重置序列号（新 run 开始时调用）
 * @param {string} runId run ID
 */
export function resetSeq(runId) {
  seqCounters.set(runId, 0);
}

/**
 * 追加事件到 events.ndjson
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 * @param {string} type 事件类型
 * @param {string} nodeId 节点 ID（非节点事件传空字符串）
 * @param {object} payload 事件载荷
 */
export async function appendEvent(projectRoot, runId, type, nodeId, payload) {
  const runDir = getRunDir(projectRoot, runId);
  const eventsPath = path.posix.join(runDir, 'events.ndjson');
  
  await ensureDir(runDir);
  
  const seq = getNextSeq(runId);
  
  // 截断大 payload
  let safePayload = payload;
  const payloadStr = JSON.stringify(payload);
  if (payloadStr.length > MAX_PAYLOAD_BYTES) {
    safePayload = { 
      _truncated: true, 
      _original_size: payloadStr.length,
      summary: String(payload.summary || payload.text || '').slice(0, 500)
    };
  }
  
  const event = {
    ts: new Date().toISOString(),
    run_id: runId,
    type,
    node_id: nodeId,
    seq,
    payload: safePayload,
  };
  
  await appendText(eventsPath, JSON.stringify(event) + '\n');
  
  return event;
}

/**
 * 创建事件辅助函数
 */
export const EventTypes = {
  RUN_STARTED: 'RUN_STARTED',
  RUN_FINISHED: 'RUN_FINISHED',
  RUN_CANCEL_REQUESTED: 'RUN_CANCEL_REQUESTED',
  RUN_CANCELLED: 'RUN_CANCELLED',
  NODE_STARTED: 'NODE_STARTED',
  NODE_LOG: 'NODE_LOG',
  NODE_FINISHED: 'NODE_FINISHED',
  NODE_RETRY_SCHEDULED: 'NODE_RETRY_SCHEDULED',
  NODE_TIMEOUT: 'NODE_TIMEOUT',
  LOCK_ACQUIRED: 'LOCK_ACQUIRED',
  LOCK_STALE_CLEARED: 'LOCK_STALE_CLEARED',
  LOCK_RELEASED: 'LOCK_RELEASED',
};

/**
 * 发送 RUN_STARTED 事件
 */
export async function emitRunStarted(projectRoot, runId, taskId, title) {
  return appendEvent(projectRoot, runId, EventTypes.RUN_STARTED, '', {
    task_id: taskId,
    title,
    project_root: projectRoot,
  });
}

/**
 * 发送 RUN_FINISHED 事件
 */
export async function emitRunFinished(projectRoot, runId, ok, elapsedMs, finalNodeId, error) {
  return appendEvent(projectRoot, runId, EventTypes.RUN_FINISHED, '', {
    ok,
    elapsed_ms: elapsedMs,
    final_node_id: finalNodeId,
    error,
  });
}

/**
 * 发送 NODE_STARTED 事件
 */
export async function emitNodeStarted(projectRoot, runId, nodeId, attempt, timeoutMs) {
  return appendEvent(projectRoot, runId, EventTypes.NODE_STARTED, nodeId, {
    attempt,
    timeout_ms: timeoutMs,
  });
}

/**
 * 发送 NODE_LOG 事件
 */
export async function emitNodeLog(projectRoot, runId, nodeId, stream, text, artifactRef) {
  // 截断日志文本
  const truncatedText = text.length > MAX_LOG_TEXT_LENGTH 
    ? text.slice(0, MAX_LOG_TEXT_LENGTH) + '...[truncated]'
    : text;
    
  return appendEvent(projectRoot, runId, EventTypes.NODE_LOG, nodeId, {
    stream,
    text: truncatedText,
    artifact_ref: artifactRef,
  });
}

/**
 * 发送 NODE_FINISHED 事件
 */
export async function emitNodeFinished(projectRoot, runId, nodeId, status, exitCode, elapsedMs, error) {
  return appendEvent(projectRoot, runId, EventTypes.NODE_FINISHED, nodeId, {
    status,
    exit_code: exitCode,
    elapsed_ms: elapsedMs,
    error,
  });
}

/**
 * 发送 NODE_TIMEOUT 事件
 */
export async function emitNodeTimeout(projectRoot, runId, nodeId, timeoutMs, elapsedMs) {
  return appendEvent(projectRoot, runId, EventTypes.NODE_TIMEOUT, nodeId, {
    timeout_ms: timeoutMs,
    elapsed_ms: elapsedMs,
  });
}

/**
 * 发送 NODE_RETRY_SCHEDULED 事件
 */
export async function emitNodeRetryScheduled(projectRoot, runId, nodeId, attempt, maxAttempts, delayMs, reason) {
  return appendEvent(projectRoot, runId, EventTypes.NODE_RETRY_SCHEDULED, nodeId, {
    attempt,
    max_attempts: maxAttempts,
    delay_ms: delayMs,
    reason,
  });
}

/**
 * 发送 RUN_CANCEL_REQUESTED 事件
 */
export async function emitCancelRequested(projectRoot, runId, requestedBy) {
  return appendEvent(projectRoot, runId, EventTypes.RUN_CANCEL_REQUESTED, '', {
    requested_by: requestedBy,
  });
}

/**
 * 发送 RUN_CANCELLED 事件
 */
export async function emitCancelled(projectRoot, runId, cancelledNodeId, skippedNodes) {
  return appendEvent(projectRoot, runId, EventTypes.RUN_CANCELLED, '', {
    cancelled_node_id: cancelledNodeId,
    skipped_nodes: skippedNodes,
  });
}

/**
 * 发送 LOCK_ACQUIRED 事件
 */
export async function emitLockAcquired(projectRoot, runId, lockPath, pid, host) {
  return appendEvent(projectRoot, runId, EventTypes.LOCK_ACQUIRED, '', {
    lock_path: lockPath,
    pid,
    host,
  });
}

/**
 * 发送 LOCK_STALE_CLEARED 事件
 */
export async function emitLockStaleCleared(projectRoot, runId, staleRunId, reason) {
  return appendEvent(projectRoot, runId, EventTypes.LOCK_STALE_CLEARED, '', {
    stale_run_id: staleRunId,
    reason,
  });
}

/**
 * 发送 LOCK_RELEASED 事件
 */
export async function emitLockReleased(projectRoot, runId, lockPath) {
  return appendEvent(projectRoot, runId, EventTypes.LOCK_RELEASED, '', {
    lock_path: lockPath,
  });
}

