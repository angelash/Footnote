/**
 * Pipeline-Sys v2 Core Modules
 * 
 * FlowSpec 配置化流程执行引擎
 * 
 * @module lib/v2
 */

// Parser - 流程解析
export {
  loadFlowSpec,
  validateFlowSpec,
  parseFlowSpec,
  loadAndParseFlowSpec,
  getSuccessors,
  getPredecessors,
  getEntryNodes,
  getExitNodes,
  ParseError,
  NODE_TYPES,
} from './parser.mjs';

// Expression - 表达式引擎
export {
  validateExpression,
  extractVariableRefs,
  getNestedValue,
  interpolate,
  interpolateDeep,
  evaluate,
  evaluateCondition,
  resolveOutputMapping,
  hasTemplateVars,
  getReferencedVariables,
  ExpressionError,
} from './expression.mjs';

// Context - 变量上下文
export {
  ExecutionContext,
  createContext,
  createContextFromFlow,
} from './context.mjs';

// Executor Base - 节点执行器基类
export {
  NodeExecutor,
  ExecutorRegistry,
  globalRegistry,
  createExecutor,
  successResult,
  failureResult,
} from './executor-base.mjs';

// Executors - 内置执行器
export {
  registerBuiltinExecutors,
  getExecutor,
  hasExecutor,
  getRegisteredTypes,
  // 基础执行器
  ShellExecutor,
  TransformExecutor,
  FileExecutor,
  HttpExecutor,
  NotifyExecutor,
  createShellExecutor,
  createTransformExecutor,
  createFileExecutor,
  createHttpExecutor,
  createNotifyExecutor,
  // 控制流执行器
  ConditionExecutor,
  ParallelExecutor,
  LoopExecutor,
  SubflowExecutor,
  createConditionExecutor,
  createParallelExecutor,
  createLoopExecutor,
  createSubflowExecutor,
} from './executors/index.mjs';

// Flow Runner - 流程调度器
export {
  FlowRunner,
  createFlowRunner,
  runFlow,
  RunStatus,
  NodeStatus,
  EventType,
} from './flow-runner.mjs';

/**
 * v2 版本号
 */
export const VERSION = '2.0.0';

/**
 * 快速创建流程运行环境
 * @param {string} flowPath - 流程文件路径
 * @param {Object} inputs - 输入参数
 * @param {Object} [options={}] - 额外选项
 * @returns {Promise<{flow: Object, context: ExecutionContext}>}
 */
export async function prepare(flowPath, inputs = {}, options = {}) {
  const { loadAndParseFlowSpec } = await import('./parser.mjs');
  const { createContextFromFlow } = await import('./context.mjs');
  
  const flow = await loadAndParseFlowSpec(flowPath);
  const context = createContextFromFlow(flow, inputs, options);
  
  return { flow, context };
}

export default {
  VERSION,
  prepare,
};

