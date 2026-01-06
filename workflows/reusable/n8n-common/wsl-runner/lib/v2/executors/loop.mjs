/**
 * Loop Node Executor
 * 
 * 循环执行节点
 * 
 * 支持的循环类型:
 * - forEach: 遍历数组
 * - times: 执行固定次数
 * - while: 条件循环
 * - doWhile: 先执行后判断的条件循环
 * 
 * Config:
 * - type: 循环类型 ('forEach' | 'times' | 'while' | 'doWhile')
 * - items: 要遍历的数组表达式 (forEach)
 * - times: 执行次数 (times)
 * - condition: 循环条件表达式 (while/doWhile)
 * - itemAs: 当前项变量名 (默认 'item')
 * - indexAs: 当前索引变量名 (默认 'index')
 * - body: 循环体节点列表
 * - maxIterations: 最大迭代次数（防止无限循环，默认 1000）
 * 
 * Output:
 * - iterations: 迭代结果数组
 * - totalIterations: 总迭代次数
 * - completed: 是否正常完成（非提前中断）
 * 
 * @module lib/v2/executors/loop
 */

import { NodeExecutor, successResult, failureResult } from '../executor-base.mjs';
import { evaluate, evaluateCondition, ExpressionError } from '../expression.mjs';

/**
 * 默认最大迭代次数
 */
const DEFAULT_MAX_ITERATIONS = 1000;

/**
 * Loop 节点执行器
 */
export class LoopExecutor extends NodeExecutor {
  constructor() {
    super('loop');
  }

  /**
   * 执行循环
   * @param {Object} config - 节点配置
   * @param {Object} context - 执行上下文
   * @param {Object} options - 执行选项
   * @returns {Promise<NodeResult>}
   */
  async execute(config, context, options) {
    const {
      type = 'forEach',
      items,
      times,
      condition,
      itemAs = 'item',
      indexAs = 'index',
      body = [],
      maxIterations = DEFAULT_MAX_ITERATIONS,
      executor,
    } = config;

    this.info(`Starting ${type} loop`, { maxIterations });

    try {
      switch (type) {
        case 'forEach':
          return await this._executeForEach(config, context, options);

        case 'times':
          return await this._executeTimes(config, context, options);

        case 'while':
          return await this._executeWhile(config, context, options);

        case 'doWhile':
          return await this._executeDoWhile(config, context, options);

        default:
          return failureResult(`Unsupported loop type: ${type}`);
      }
    } catch (err) {
      if (err instanceof ExpressionError) {
        return failureResult(`Loop expression error: ${err.toString()}`);
      }
      this.error(`Loop execution failed: ${err.message}`);
      return failureResult(`Loop execution failed: ${err.message}`);
    }
  }

  /**
   * forEach 循环
   */
  async _executeForEach(config, context, options) {
    const {
      items,
      itemAs = 'item',
      indexAs = 'index',
      body = [],
      maxIterations = DEFAULT_MAX_ITERATIONS,
      executor,
    } = config;

    if (!items) {
      return failureResult('Items expression is required for forEach loop');
    }

    // 获取要遍历的数组
    const evalContext = context.getSnapshot();
    const itemsArray = evaluate(items, evalContext);

    if (!Array.isArray(itemsArray)) {
      return failureResult(`Items expression must evaluate to an array, got: ${typeof itemsArray}`);
    }

    const iterations = [];
    const effectiveMax = Math.min(itemsArray.length, maxIterations);

    for (let i = 0; i < effectiveMax; i++) {
      if (options.signal?.aborted) {
        this.warn(`Loop cancelled at iteration ${i}`);
        return successResult({
          iterations,
          totalIterations: i,
          completed: false,
          cancelled: true,
        });
      }

      const item = itemsArray[i];

      // 设置循环变量
      context.setVariable(itemAs, item);
      context.setVariable(indexAs, i);
      context.setVariable('_loopIndex', i);
      context.setVariable('_loopLength', itemsArray.length);

      let iterationResult = { index: i, item };

      // 如果有执行器，执行循环体
      if (executor && typeof executor === 'function') {
        try {
          const bodyResult = await executor(body, context, options);
          iterationResult.output = bodyResult;
          iterationResult.success = true;
        } catch (err) {
          iterationResult.error = err.message;
          iterationResult.success = false;
        }
      } else {
        // 标记需要执行的节点
        iterationResult.nodes = body.map(n => n.id || n);
        iterationResult.success = true;
      }

      iterations.push(iterationResult);
    }

    this.info(`forEach loop completed`, { totalIterations: iterations.length });

    return successResult({
      iterations,
      totalIterations: iterations.length,
      completed: true,
      itemsCount: itemsArray.length,
    });
  }

  /**
   * times 循环
   */
  async _executeTimes(config, context, options) {
    const {
      times,
      indexAs = 'index',
      body = [],
      maxIterations = DEFAULT_MAX_ITERATIONS,
      executor,
    } = config;

    if (times === undefined || times === null) {
      return failureResult('Times value is required for times loop');
    }

    // 计算次数
    let count = times;
    if (typeof times === 'string') {
      const evalContext = context.getSnapshot();
      count = evaluate(times, evalContext);
    }

    if (typeof count !== 'number' || count < 0) {
      return failureResult(`Times must be a non-negative number, got: ${count}`);
    }

    const iterations = [];
    const effectiveMax = Math.min(count, maxIterations);

    for (let i = 0; i < effectiveMax; i++) {
      if (options.signal?.aborted) {
        return successResult({
          iterations,
          totalIterations: i,
          completed: false,
          cancelled: true,
        });
      }

      // 设置循环变量
      context.setVariable(indexAs, i);
      context.setVariable('_loopIndex', i);
      context.setVariable('_loopLength', count);

      let iterationResult = { index: i };

      if (executor && typeof executor === 'function') {
        try {
          const bodyResult = await executor(body, context, options);
          iterationResult.output = bodyResult;
          iterationResult.success = true;
        } catch (err) {
          iterationResult.error = err.message;
          iterationResult.success = false;
        }
      } else {
        iterationResult.nodes = body.map(n => n.id || n);
        iterationResult.success = true;
      }

      iterations.push(iterationResult);
    }

    this.info(`times loop completed`, { totalIterations: iterations.length });

    return successResult({
      iterations,
      totalIterations: iterations.length,
      completed: true,
      requestedTimes: count,
    });
  }

  /**
   * while 循环
   */
  async _executeWhile(config, context, options) {
    const {
      condition,
      indexAs = 'index',
      body = [],
      maxIterations = DEFAULT_MAX_ITERATIONS,
      executor,
    } = config;

    if (!condition) {
      return failureResult('Condition expression is required for while loop');
    }

    const iterations = [];
    let i = 0;

    while (i < maxIterations) {
      if (options.signal?.aborted) {
        return successResult({
          iterations,
          totalIterations: i,
          completed: false,
          cancelled: true,
        });
      }

      // 评估条件
      const evalContext = context.getSnapshot();
      const shouldContinue = evaluateCondition(condition, evalContext);

      if (!shouldContinue) {
        break;
      }

      // 设置循环变量
      context.setVariable(indexAs, i);
      context.setVariable('_loopIndex', i);

      let iterationResult = { index: i };

      if (executor && typeof executor === 'function') {
        try {
          const bodyResult = await executor(body, context, options);
          iterationResult.output = bodyResult;
          iterationResult.success = true;
        } catch (err) {
          iterationResult.error = err.message;
          iterationResult.success = false;
        }
      } else {
        iterationResult.nodes = body.map(n => n.id || n);
        iterationResult.success = true;
      }

      iterations.push(iterationResult);
      i++;
    }

    const hitMaxIterations = i >= maxIterations;
    if (hitMaxIterations) {
      this.warn(`while loop hit max iterations: ${maxIterations}`);
    }

    this.info(`while loop completed`, { totalIterations: i, hitMaxIterations });

    return successResult({
      iterations,
      totalIterations: i,
      completed: !hitMaxIterations,
      hitMaxIterations,
    });
  }

  /**
   * do-while 循环
   */
  async _executeDoWhile(config, context, options) {
    const {
      condition,
      indexAs = 'index',
      body = [],
      maxIterations = DEFAULT_MAX_ITERATIONS,
      executor,
    } = config;

    if (!condition) {
      return failureResult('Condition expression is required for doWhile loop');
    }

    const iterations = [];
    let i = 0;

    do {
      if (options.signal?.aborted) {
        return successResult({
          iterations,
          totalIterations: i,
          completed: false,
          cancelled: true,
        });
      }

      // 设置循环变量
      context.setVariable(indexAs, i);
      context.setVariable('_loopIndex', i);

      let iterationResult = { index: i };

      if (executor && typeof executor === 'function') {
        try {
          const bodyResult = await executor(body, context, options);
          iterationResult.output = bodyResult;
          iterationResult.success = true;
        } catch (err) {
          iterationResult.error = err.message;
          iterationResult.success = false;
        }
      } else {
        iterationResult.nodes = body.map(n => n.id || n);
        iterationResult.success = true;
      }

      iterations.push(iterationResult);
      i++;

      // 评估条件
      const evalContext = context.getSnapshot();
      const shouldContinue = evaluateCondition(condition, evalContext);

      if (!shouldContinue) {
        break;
      }

    } while (i < maxIterations);

    const hitMaxIterations = i >= maxIterations;
    if (hitMaxIterations) {
      this.warn(`doWhile loop hit max iterations: ${maxIterations}`);
    }

    this.info(`doWhile loop completed`, { totalIterations: i, hitMaxIterations });

    return successResult({
      iterations,
      totalIterations: i,
      completed: !hitMaxIterations,
      hitMaxIterations,
    });
  }
}

/**
 * 创建 Loop 执行器实例
 * @returns {LoopExecutor}
 */
export function createLoopExecutor() {
  return new LoopExecutor();
}

export default LoopExecutor;

