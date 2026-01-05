/**
 * Path Guards
 * 路径归一化与防穿越
 */

import path from 'node:path';

/**
 * 安全解析路径，防止路径穿越
 * @param projectRoot 项目根目录
 * @param relPath 相对路径
 * @returns 绝对路径
 * @throws 路径穿越时抛出错误
 */
export function safeResolveUnderProject(projectRoot: string, relPath: string): string {
  // 跨平台路径处理
  const abs = path.resolve(projectRoot, relPath);
  const pr = path.resolve(projectRoot);
  
  if (!abs.startsWith(pr + path.sep) && abs !== pr) {
    throw new Error(`Path escapes project_root: ${relPath}`);
  }
  
  return abs;
}

/**
 * 安全解析 run 目录下的相对路径
 * @param runDir run 目录绝对路径
 * @param relPath 相对于 run 目录的路径
 * @returns 绝对路径
 * @throws 路径穿越时抛出错误
 */
export function safeResolveUnderRun(runDir: string, relPath: string): string {
  const abs = path.resolve(runDir, relPath);
  const rd = path.resolve(runDir);
  
  if (!abs.startsWith(rd + path.sep) && abs !== rd) {
    throw new Error(`Path escapes run directory: ${relPath}`);
  }
  
  return abs;
}

/**
 * 检查路径是否为隐藏目录（如 _lock）
 */
export function isHiddenDir(name: string): boolean {
  return name.startsWith('_') || name.startsWith('.');
}

/**
 * 归一化路径（移除 ..、.、多余斜杠）
 */
export function normalizePath(p: string): string {
  return path.normalize(p);
}

