/**
 * ChromeMCP 交互测试模块
 * 
 * 基于 Chrome DevTools MCP 服务器的真实浏览器交互测试
 */

export * from './config';
export * from './helpers';
export * from './specs';
export * from './runner';

// 快速访问
export { default as TestConfig } from './config';
export { default as InteractiveTestRunner } from './runner';
