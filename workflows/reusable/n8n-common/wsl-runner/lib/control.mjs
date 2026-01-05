/**
 * Control utilities
 * control.json 读写与请求处理
 */

import path from 'node:path';
import { writeJson, readJson } from './io.mjs';
import { getRunDir } from './paths.mjs';

/**
 * 获取 control.json 路径
 */
function getControlPath(projectRoot, runId) {
  const runDir = getRunDir(projectRoot, runId);
  return path.posix.join(runDir, 'control.json');
}

/**
 * 读取控制请求
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 * @returns {Promise<object|null>}
 */
export async function readControl(projectRoot, runId) {
  const controlPath = getControlPath(projectRoot, runId);
  return readJson(controlPath);
}

/**
 * 写入取消请求
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 * @param {string} requestedBy 请求者
 */
export async function writeCancelRequest(projectRoot, runId, requestedBy = 'api') {
  const controlPath = getControlPath(projectRoot, runId);
  let control = await readJson(controlPath) || {};
  
  control.cancel = {
    requested_at: new Date().toISOString(),
    requested_by: requestedBy,
  };
  
  await writeJson(controlPath, control);
  return control;
}

/**
 * 写入重试请求
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 * @param {string} nodeId 节点 ID
 * @param {string} requestedBy 请求者
 */
export async function writeRetryRequest(projectRoot, runId, nodeId, requestedBy = 'api') {
  const controlPath = getControlPath(projectRoot, runId);
  let control = await readJson(controlPath) || {};
  
  control.retry = {
    requested_at: new Date().toISOString(),
    node_id: nodeId,
    requested_by: requestedBy,
  };
  
  await writeJson(controlPath, control);
  return control;
}

/**
 * 检查是否有取消请求
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 * @returns {Promise<boolean>}
 */
export async function hasCancelRequest(projectRoot, runId) {
  const control = await readControl(projectRoot, runId);
  return !!(control && control.cancel);
}

/**
 * 检查是否有重试请求
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 * @param {string} nodeId 节点 ID
 * @returns {Promise<boolean>}
 */
export async function hasRetryRequest(projectRoot, runId, nodeId) {
  const control = await readControl(projectRoot, runId);
  return !!(control && control.retry && control.retry.node_id === nodeId);
}

/**
 * 清除重试请求
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 */
export async function clearRetryRequest(projectRoot, runId) {
  const controlPath = getControlPath(projectRoot, runId);
  let control = await readJson(controlPath) || {};
  
  delete control.retry;
  
  await writeJson(controlPath, control);
  return control;
}

