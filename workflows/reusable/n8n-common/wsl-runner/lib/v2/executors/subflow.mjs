/**
 * Subflow Node Executor
 * 
 * 子流程节点，允许调用其他 FlowSpec 定义的流程
 * 
 * Config:
 * - flowId: 子流程ID（必须在流程库中注册）
 * - flowPath: 子流程文件路径（可选，用于动态加载）
 * - inputs: 传递给子流程的输入参数（对象）
 * - outputs: 从子流程输出中提取的变量映射
 * - async: 是否异步执行（默认 false，等待子流程完成）
 * - timeout: 子流程执行超时（毫秒，默认使用节点超时）
 * 
 * 输入映射示例:
 * inputs: {
 *   param1: "${variables.someValue}",
 *   param2: "${nodes.prevNode.output.data}"
 * }
 * 
 * 输出映射示例:
 * outputs: {
 *   result: "${output.finalResult}",
 *   status: "${output.status}"
 * }
 * 
 * Output:
 * - flowId: 执行的子流程ID
 * - runId: 子流程运行ID
 * - inputs: 传递的输入
 * - outputs: 提取的输出
 * - duration: 执行时长
 * - status: 子流程最终状态
 * 
 * @module lib/v2/executors/subflow
 */

import { NodeExecutor, successResult, failureResult } from '../executor-base.mjs';
import { interpolateDeep, ExpressionError } from '../expression.mjs';

/**
 * Subflow 节点执行器
 */
export class SubflowExecutor extends NodeExecutor {
  /**
   * 子流程加载器（由流程运行器注入）
   * @type {Function|null}
   */
  flowLoader = null;

  /**
   * 子流程运行器（由流程运行器注入）
   * @type {Function|null}
   */
  flowRunner = null;

  constructor() {
    super('subflow');
  }

  /**
   * 设置子流程加载器
   * @param {Function} loader - 加载器函数 (flowId) => Promise<FlowSpec>
   */
  setFlowLoader(loader) {
    this.flowLoader = loader;
  }

  /**
   * 设置子流程运行器
   * @param {Function} runner - 运行器函数 (flowSpec, inputs, options) => Promise<RunResult>
   */
  setFlowRunner(runner) {
    this.flowRunner = runner;
  }

  /**
   * 执行子流程
   * @param {Object} config - 节点配置
   * @param {Object} context - 执行上下文
   * @param {Object} options - 执行选项
   * @returns {Promise<NodeResult>}
   */
  async execute(config, context, options) {
    const {
      flowId,
      flowPath,
      inputs = {},
      outputs = {},
      async: isAsync = false,
      timeout,
    } = config;

    if (!flowId && !flowPath) {
      return failureResult('Either flowId or flowPath is required');
    }

    const identifier = flowId || flowPath;
    this.info(`Executing subflow: ${identifier}`, { isAsync });

    const startTime = Date.now();

    try {
      // 解析输入参数
      const evalContext = context.getSnapshot();
      let resolvedInputs;
      try {
        resolvedInputs = interpolateDeep(inputs, evalContext);
      } catch (err) {
        if (err instanceof ExpressionError) {
          return failureResult(`Input interpolation error: ${err.toString()}`);
        }
        throw err;
      }

      this.debug(`Resolved inputs:`, resolvedInputs);

      // 加载子流程
      if (!this.flowLoader) {
        // 如果没有加载器，返回占位结果（实际执行由流程运行器处理）
        this.warn('No flow loader configured, returning placeholder result');
        return successResult({
          flowId: identifier,
          runId: null,
          inputs: resolvedInputs,
          outputs: {},
          duration: 0,
          status: 'PENDING',
          message: 'Subflow execution pending - no runner configured',
        });
      }

      // 加载流程定义
      const flowSpec = await this.flowLoader(flowId || flowPath);
      if (!flowSpec) {
        return failureResult(`Subflow not found: ${identifier}`);
      }

      // 运行子流程
      if (!this.flowRunner) {
        return failureResult('No flow runner configured');
      }

      // 创建子流程运行选项
      const subflowOptions = {
        ...options,
        parentContext: context,
        timeout: timeout || options.timeout,
      };

      // 如果是异步执行，启动后立即返回
      if (isAsync) {
        // 异步执行，不等待完成
        const runPromise = this.flowRunner(flowSpec, resolvedInputs, subflowOptions);
        
        // 生成运行ID
        const runId = `subflow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        
        // 将 Promise 存储到上下文中，供后续查询
        context.setVariable(`_subflow_${runId}`, { promise: runPromise, startTime });

        return successResult({
          flowId: identifier,
          runId,
          inputs: resolvedInputs,
          outputs: {},
          duration: Date.now() - startTime,
          status: 'RUNNING',
          async: true,
        });
      }

      // 同步执行，等待完成
      const runResult = await this.flowRunner(flowSpec, resolvedInputs, subflowOptions);
      const duration = Date.now() - startTime;

      // 提取输出
      let extractedOutputs = {};
      if (outputs && Object.keys(outputs).length > 0) {
        const outputContext = {
          output: runResult.output,
          status: runResult.status,
          nodes: runResult.nodes,
        };
        try {
          extractedOutputs = interpolateDeep(outputs, outputContext);
        } catch (err) {
          this.warn(`Output extraction error: ${err.message}`);
        }
      } else {
        extractedOutputs = runResult.output;
      }

      if (runResult.success) {
        this.info(`Subflow completed successfully`, { duration });
        return successResult({
          flowId: identifier,
          runId: runResult.runId,
          inputs: resolvedInputs,
          outputs: extractedOutputs,
          duration,
          status: 'SUCCESS',
        });
      } else {
        this.warn(`Subflow failed: ${runResult.error}`);
        return failureResult(`Subflow failed: ${runResult.error}`, {
          flowId: identifier,
          runId: runResult.runId,
          inputs: resolvedInputs,
          outputs: extractedOutputs,
          duration,
          status: 'FAILED',
        });
      }

    } catch (err) {
      const duration = Date.now() - startTime;
      this.error(`Subflow execution error: ${err.message}`);
      return failureResult(`Subflow execution error: ${err.message}`, {
        flowId: identifier,
        runId: null,
        inputs: inputs,
        outputs: {},
        duration,
        status: 'ERROR',
      });
    }
  }

  /**
   * 等待异步子流程完成
   * @param {string} runId - 子流程运行ID
   * @param {Object} context - 执行上下文
   * @param {Object} options - 执行选项
   * @returns {Promise<NodeResult>}
   */
  async waitForSubflow(runId, context, options) {
    const subflowData = context.getVariable(`_subflow_${runId}`);
    if (!subflowData || !subflowData.promise) {
      return failureResult(`Subflow run not found: ${runId}`);
    }

    try {
      const runResult = await subflowData.promise;
      const duration = Date.now() - subflowData.startTime;

      // 清理上下文中的数据
      context.setVariable(`_subflow_${runId}`, null);

      if (runResult.success) {
        return successResult({
          runId,
          outputs: runResult.output,
          duration,
          status: 'SUCCESS',
        });
      } else {
        return failureResult(`Subflow failed: ${runResult.error}`, {
          runId,
          outputs: runResult.output,
          duration,
          status: 'FAILED',
        });
      }
    } catch (err) {
      return failureResult(`Error waiting for subflow: ${err.message}`);
    }
  }
}

/**
 * 创建 Subflow 执行器实例
 * @returns {SubflowExecutor}
 */
export function createSubflowExecutor() {
  return new SubflowExecutor();
}

export default SubflowExecutor;

