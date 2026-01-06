/**
 * Condition Node Executor
 * 
 * 条件分支节点
 * 
 * Config:
 * - expression: 条件表达式（返回 truthy/falsy）
 * - onTrue: 条件为真时跳转的节点ID（或节点ID数组）
 * - onFalse: 条件为假时跳转的节点ID（或节点ID数组）
 * 
 * 表达式上下文可访问:
 * - inputs: 流程输入
 * - variables: 运行时变量
 * - nodes: 节点状态和输出
 * - env: 环境变量
 * - $: 前一个节点的输出
 * 
 * Output:
 * - condition: 条件表达式结果
 * - branch: 选择的分支 ('true' | 'false')
 * - next: 下一个节点ID列表
 * 
 * @module lib/v2/executors/condition
 */

import { NodeExecutor, successResult, failureResult } from '../executor-base.mjs';
import { evaluateCondition, ExpressionError } from '../expression.mjs';

/**
 * Condition 节点执行器
 */
export class ConditionExecutor extends NodeExecutor {
  constructor() {
    super('condition');
  }

  /**
   * 执行条件判断
   * @param {Object} config - 节点配置
   * @param {Object} context - 执行上下文
   * @param {Object} options - 执行选项
   * @returns {Promise<NodeResult>}
   */
  async execute(config, context, options) {
    const {
      expression,
      onTrue,
      onFalse,
    } = config;

    if (!expression) {
      return failureResult('Condition expression is required');
    }

    this.info(`Evaluating condition: ${expression.substring(0, 100)}...`);

    try {
      // 构建评估上下文
      const evalContext = context.getSnapshot();
      
      // 添加 $ 作为前一个节点输出的快捷方式
      const nodeStates = Object.values(evalContext.nodes);
      const lastSuccessNode = nodeStates
        .filter(n => n.status === 'SUCCESS' && n.output != null)
        .sort((a, b) => new Date(b.finished_at) - new Date(a.finished_at))[0];
      
      if (lastSuccessNode) {
        evalContext.$ = lastSuccessNode.output;
        evalContext.previous = lastSuccessNode.output;
      }

      // 评估条件
      const conditionResult = evaluateCondition(expression, evalContext);
      const branch = conditionResult ? 'true' : 'false';
      const nextNodes = conditionResult ? onTrue : onFalse;

      // 标准化下一个节点列表
      let next = [];
      if (nextNodes) {
        next = Array.isArray(nextNodes) ? nextNodes : [nextNodes];
      }

      this.info(`Condition result: ${conditionResult} → branch: ${branch}`, { next });

      return successResult({
        condition: conditionResult,
        branch,
        next,
        expression,
      });

    } catch (err) {
      if (err instanceof ExpressionError) {
        this.error(`Expression error: ${err.message}`);
        return failureResult(`Condition expression error: ${err.toString()}`);
      }
      this.error(`Condition evaluation failed: ${err.message}`);
      return failureResult(`Condition evaluation failed: ${err.message}`);
    }
  }

  /**
   * 获取条件节点的下一个节点
   * 需要在流程运行器中特殊处理
   * @param {Object} result - 执行结果
   * @returns {string[]} 下一个节点ID列表
   */
  getNextNodes(result) {
    if (result.ok && result.output?.next) {
      return result.output.next;
    }
    return [];
  }
}

/**
 * 创建 Condition 执行器实例
 * @returns {ConditionExecutor}
 */
export function createConditionExecutor() {
  return new ConditionExecutor();
}

export default ConditionExecutor;

