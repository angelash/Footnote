/**
 * Path utilities
 * 路径安全解析与计算
 */

import path from 'node:path';

export const AUTOMATION_RUNS_DIR = 'workflows/project/logs/automation_runs';
export const LOCK_DIR = path.posix.join(AUTOMATION_RUNS_DIR, '_lock');

/**
 * 安全解析路径，防止路径穿越
 * @param {string} projectRoot 项目根目录
 * @param {string} relPath 相对路径
 * @returns {string} 绝对路径
 * @throws 路径穿越时抛出错误
 */
export function safeResolveUnderProject(projectRoot, relPath) {
  const abs = path.posix.resolve(projectRoot, relPath);
  const pr = path.posix.resolve(projectRoot);
  if (!abs.startsWith(pr + '/') && abs !== pr) {
    throw new Error(`Path escapes project_root: ${relPath}`);
  }
  return abs;
}

/**
 * 获取 run 目录路径
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 * @returns {string} run 目录绝对路径
 */
export function getRunDir(projectRoot, runId) {
  const runRelDir = path.posix.join(AUTOMATION_RUNS_DIR, runId);
  return safeResolveUnderProject(projectRoot, runRelDir);
}

/**
 * 获取锁目录路径
 * @param {string} projectRoot 项目根目录
 * @returns {string} 锁目录绝对路径
 */
export function getLockDir(projectRoot) {
  return safeResolveUnderProject(projectRoot, LOCK_DIR);
}

/**
 * 获取 run 内文件路径
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 * @param {string} fileName 文件名
 * @returns {string} 文件绝对路径
 */
export function getRunFilePath(projectRoot, runId, fileName) {
  const runDir = getRunDir(projectRoot, runId);
  return path.posix.join(runDir, fileName);
}

