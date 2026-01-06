/**
 * Transform Node Executor
 * 
 * 数据转换节点，支持 JavaScript 表达式
 * 
 * Config:
 * - expression: 转换表达式
 * - language: 表达式语言 ('javascript' 默认, 'jsonata' 暂不支持)
 * 
 * 表达式上下文可访问:
 * - inputs: 流程输入参数
 * - variables: 运行时变量
 * - nodes: 节点状态和输出
 * - env: 环境变量
 * - $: 前一个节点的输出 (如果有)
 * 
 * @module lib/v2/executors/transform
 */

import { NodeExecutor, successResult, failureResult } from '../executor-base.mjs';
import { evaluate, validateExpression, ExpressionError } from '../expression.mjs';

/**
 * Transform 节点执行器
 */
export class TransformExecutor extends NodeExecutor {
  constructor() {
    super('transform');
  }

  /**
   * 执行数据转换
   * @param {Object} config - 节点配置
   * @param {Object} context - 执行上下文
   * @param {Object} options - 执行选项
   * @returns {Promise<NodeResult>}
   */
  async execute(config, context, options) {
    const {
      expression,
      language = 'javascript',
    } = config;

    if (!expression) {
      return failureResult('Transform expression is required');
    }

    if (language !== 'javascript') {
      return failureResult(`Unsupported language: ${language}. Currently only 'javascript' is supported.`);
    }

    this.info(`Evaluating transform expression`, { length: expression.length });

    try {
      // 验证表达式安全性
      validateExpression(expression);

      // 构建执行上下文
      const evalContext = context.getSnapshot();
      
      // 添加 $ 作为前一个节点输出的快捷方式
      // 从节点状态中找到最后一个成功完成的节点
      const nodeStates = Object.values(evalContext.nodes);
      const lastSuccessNode = nodeStates
        .filter(n => n.status === 'SUCCESS' && n.output != null)
        .sort((a, b) => new Date(b.finished_at) - new Date(a.finished_at))[0];
      
      if (lastSuccessNode) {
        evalContext.$ = lastSuccessNode.output;
        evalContext.previous = lastSuccessNode.output;
      }

      // 添加常用工具函数
      evalContext.pick = (obj, ...keys) => {
        const result = {};
        for (const key of keys) {
          if (key in obj) result[key] = obj[key];
        }
        return result;
      };

      evalContext.omit = (obj, ...keys) => {
        const result = { ...obj };
        for (const key of keys) {
          delete result[key];
        }
        return result;
      };

      evalContext.merge = (...objects) => Object.assign({}, ...objects);

      evalContext.map = (arr, fn) => arr.map(fn);
      evalContext.filter = (arr, fn) => arr.filter(fn);
      evalContext.reduce = (arr, fn, init) => arr.reduce(fn, init);
      evalContext.find = (arr, fn) => arr.find(fn);
      evalContext.some = (arr, fn) => arr.some(fn);
      evalContext.every = (arr, fn) => arr.every(fn);

      evalContext.keys = Object.keys;
      evalContext.values = Object.values;
      evalContext.entries = Object.entries;
      evalContext.fromEntries = Object.fromEntries;

      evalContext.now = () => new Date().toISOString();
      evalContext.uuid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // 执行表达式
      const result = evaluate(expression, evalContext);

      this.info(`Transform completed`, { resultType: typeof result });

      return successResult(result);

    } catch (err) {
      if (err instanceof ExpressionError) {
        this.error(`Expression error: ${err.message}`, { expression: err.expression });
        return failureResult(`Expression error: ${err.toString()}`);
      }
      this.error(`Transform failed: ${err.message}`);
      return failureResult(`Transform failed: ${err.message}`);
    }
  }
}

/**
 * 创建 Transform 执行器实例
 * @returns {TransformExecutor}
 */
export function createTransformExecutor() {
  return new TransformExecutor();
}

export default TransformExecutor;

