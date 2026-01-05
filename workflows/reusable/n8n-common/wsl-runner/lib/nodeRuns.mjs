/**
 * NodeRuns utilities
 * 维护 node_runs.json（状态快照）
 */

import path from 'node:path';
import { writeJson, readJson } from './io.mjs';
import { getRunDir } from './paths.mjs';
import { FIXED_FLOW_NODE_IDS } from './graph.mjs';

/**
 * 节点状态枚举
 */
export const NodeStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT',
};

/**
 * 创建空的节点运行状态
 * @returns {object}
 */
function createEmptyNodeRun() {
  return {
    status: NodeStatus.PENDING,
    attempt: 0,
    started_at: null,
    ended_at: null,
    elapsed_ms: null,
    last_error: null,
    outputs: [],
  };
}

/**
 * 创建初始节点运行快照
 * @param {string} runId run ID
 * @returns {object} node_runs.json 数据
 */
export function createInitialNodeRunsSnapshot(runId) {
  const nodes = {};
  for (const id of FIXED_FLOW_NODE_IDS) {
    nodes[id] = createEmptyNodeRun();
  }
  return {
    version: 'v1',
    run_id: runId,
    updated_at: new Date().toISOString(),
    nodes,
  };
}

/**
 * 写入初始 node_runs.json
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 */
export async function writeInitialNodeRuns(projectRoot, runId) {
  const runDir = getRunDir(projectRoot, runId);
  const nodeRunsPath = path.posix.join(runDir, 'node_runs.json');
  const snapshot = createInitialNodeRunsSnapshot(runId);
  await writeJson(nodeRunsPath, snapshot);
  return snapshot;
}

/**
 * 读取 node_runs.json
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 * @returns {Promise<object|null>}
 */
export async function loadNodeRuns(projectRoot, runId) {
  const runDir = getRunDir(projectRoot, runId);
  const nodeRunsPath = path.posix.join(runDir, 'node_runs.json');
  return readJson(nodeRunsPath);
}

/**
 * 更新节点状态
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 * @param {string} nodeId 节点 ID
 * @param {object} updates 更新内容
 */
export async function updateNodeRun(projectRoot, runId, nodeId, updates) {
  const runDir = getRunDir(projectRoot, runId);
  const nodeRunsPath = path.posix.join(runDir, 'node_runs.json');
  
  let snapshot = await readJson(nodeRunsPath);
  if (!snapshot) {
    snapshot = createInitialNodeRunsSnapshot(runId);
  }
  
  if (!snapshot.nodes[nodeId]) {
    snapshot.nodes[nodeId] = createEmptyNodeRun();
  }
  
  snapshot.nodes[nodeId] = {
    ...snapshot.nodes[nodeId],
    ...updates,
  };
  snapshot.updated_at = new Date().toISOString();
  
  await writeJson(nodeRunsPath, snapshot);
  return snapshot;
}

/**
 * 设置节点为 RUNNING
 */
export async function setNodeRunning(projectRoot, runId, nodeId, attempt) {
  return updateNodeRun(projectRoot, runId, nodeId, {
    status: NodeStatus.RUNNING,
    attempt,
    started_at: new Date().toISOString(),
    ended_at: null,
    elapsed_ms: null,
    last_error: null,
  });
}

/**
 * 设置节点为完成状态
 */
export async function setNodeFinished(projectRoot, runId, nodeId, status, elapsedMs, error) {
  return updateNodeRun(projectRoot, runId, nodeId, {
    status,
    ended_at: new Date().toISOString(),
    elapsed_ms: elapsedMs,
    last_error: error || null,
  });
}

/**
 * 批量设置节点状态
 */
export async function setNodesStatus(projectRoot, runId, nodeIds, status) {
  const runDir = getRunDir(projectRoot, runId);
  const nodeRunsPath = path.posix.join(runDir, 'node_runs.json');
  
  let snapshot = await readJson(nodeRunsPath);
  if (!snapshot) {
    snapshot = createInitialNodeRunsSnapshot(runId);
  }
  
  for (const nodeId of nodeIds) {
    if (!snapshot.nodes[nodeId]) {
      snapshot.nodes[nodeId] = createEmptyNodeRun();
    }
    snapshot.nodes[nodeId].status = status;
  }
  snapshot.updated_at = new Date().toISOString();
  
  await writeJson(nodeRunsPath, snapshot);
  return snapshot;
}

