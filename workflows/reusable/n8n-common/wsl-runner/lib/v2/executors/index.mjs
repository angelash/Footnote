/**
 * Executors Index
 * 
 * 节点执行器注册和导出
 * 
 * @module lib/v2/executors
 */

import { globalRegistry } from '../executor-base.mjs';

// 导入所有执行器
import { ShellExecutor, createShellExecutor } from './shell.mjs';
import { TransformExecutor, createTransformExecutor } from './transform.mjs';
import { FileExecutor, createFileExecutor } from './file.mjs';
import { HttpExecutor, createHttpExecutor } from './http.mjs';
import { NotifyExecutor, createNotifyExecutor } from './notify.mjs';

/**
 * 注册所有内置执行器到全局注册表
 */
export function registerBuiltinExecutors() {
  globalRegistry.register('shell', ShellExecutor);
  globalRegistry.register('transform', TransformExecutor);
  globalRegistry.register('file', FileExecutor);
  globalRegistry.register('http', HttpExecutor);
  globalRegistry.register('notify', NotifyExecutor);
}

/**
 * 获取执行器实例
 * @param {string} nodeType - 节点类型
 * @returns {NodeExecutor|null} 执行器实例
 */
export function getExecutor(nodeType) {
  return globalRegistry.get(nodeType);
}

/**
 * 检查节点类型是否已注册
 * @param {string} nodeType - 节点类型
 * @returns {boolean}
 */
export function hasExecutor(nodeType) {
  return globalRegistry.has(nodeType);
}

/**
 * 获取所有已注册的节点类型
 * @returns {string[]}
 */
export function getRegisteredTypes() {
  return globalRegistry.getRegisteredTypes();
}

// 自动注册内置执行器
registerBuiltinExecutors();

// 导出所有执行器类
export {
  ShellExecutor,
  TransformExecutor,
  FileExecutor,
  HttpExecutor,
  NotifyExecutor,
};

// 导出工厂函数
export {
  createShellExecutor,
  createTransformExecutor,
  createFileExecutor,
  createHttpExecutor,
  createNotifyExecutor,
};

// 导出全局注册表
export { globalRegistry };

export default {
  registerBuiltinExecutors,
  getExecutor,
  hasExecutor,
  getRegisteredTypes,
  globalRegistry,
  ShellExecutor,
  TransformExecutor,
  FileExecutor,
  HttpExecutor,
  NotifyExecutor,
};

