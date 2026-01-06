/**
 * Node Executor Base Class v2
 * 
 * 节点执行器的抽象基类，定义执行器接口和通用逻辑
 * 
 * 生命周期:
 * 1. onStart() - 执行前钩子
 * 2. execute() - 核心执行逻辑
 * 3. onComplete() - 执行后钩子
 * 
 * 事件:
 * - NODE_STARTED
 * - NODE_LOG
 * - NODE_FINISHED
 * - NODE_TIMEOUT
 * - NODE_RETRY_SCHEDULED
 * 
 * @module lib/v2/executor-base
 */

import { EventEmitter } from 'node:events';

/**
 * 节点执行结果
 * @typedef {Object} NodeResult
 * @property {boolean} ok - 是否成功
 * @property {*} output - 输出数据
 * @property {string} [error] - 错误信息
 * @property {number} duration - 执行时长(ms)
 * @property {Object} [meta] - 元数据
 */

/**
 * 执行选项
 * @typedef {Object} ExecuteOptions
 * @property {AbortSignal} [signal] - 取消信号
 * @property {number} [timeout] - 超时时间(ms)
 * @property {Object} [retry] - 重试配置
 * @property {Function} [onLog] - 日志回调
 */

/**
 * 节点执行器基类
 * @abstract
 */
export class NodeExecutor extends EventEmitter {
  /**
   * @param {string} nodeType - 节点类型
   */
  constructor(nodeType) {
    super();
    
    /** @type {string} 节点类型 */
    this.nodeType = nodeType;
    
    /** @type {boolean} 是否正在执行 */
    this._running = false;
    
    /** @type {AbortController|null} 当前执行的取消控制器 */
    this._abortController = null;
  }

  /**
   * 获取节点类型
   * @returns {string}
   */
  get type() {
    return this.nodeType;
  }

  /**
   * 检查是否正在执行
   * @returns {boolean}
   */
  get isRunning() {
    return this._running;
  }

  /**
   * 执行前钩子（子类可覆盖）
   * @param {Object} node - 节点定义
   * @param {Object} context - 执行上下文
   * @param {ExecuteOptions} options - 执行选项
   * @returns {Promise<void>}
   */
  async onStart(node, context, options) {
    // 默认空实现，子类可覆盖
  }

  /**
   * 执行后钩子（子类可覆盖）
   * @param {Object} node - 节点定义
   * @param {Object} context - 执行上下文
   * @param {NodeResult} result - 执行结果
   * @returns {Promise<void>}
   */
  async onComplete(node, context, result) {
    // 默认空实现，子类可覆盖
  }

  /**
   * 核心执行逻辑（子类必须实现）
   * @abstract
   * @param {Object} config - 节点配置（已替换变量）
   * @param {Object} context - 执行上下文
   * @param {ExecuteOptions} options - 执行选项
   * @returns {Promise<NodeResult>}
   */
  async execute(config, context, options) {
    throw new Error('NodeExecutor.execute() must be implemented by subclass');
  }

  /**
   * 发送日志
   * @param {string} level - 日志级别 (debug/info/warn/error)
   * @param {string} message - 日志消息
   * @param {Object} [data] - 附加数据
   */
  log(level, message, data = {}) {
    this.emit('log', { level, message, data, timestamp: new Date().toISOString() });
  }

  /**
   * 发送 debug 日志
   * @param {string} message - 消息
   * @param {Object} [data] - 数据
   */
  debug(message, data) {
    this.log('debug', message, data);
  }

  /**
   * 发送 info 日志
   * @param {string} message - 消息
   * @param {Object} [data] - 数据
   */
  info(message, data) {
    this.log('info', message, data);
  }

  /**
   * 发送 warn 日志
   * @param {string} message - 消息
   * @param {Object} [data] - 数据
   */
  warn(message, data) {
    this.log('warn', message, data);
  }

  /**
   * 发送 error 日志
   * @param {string} message - 消息
   * @param {Object} [data] - 数据
   */
  error(message, data) {
    this.log('error', message, data);
  }

  /**
   * 检查是否应该取消执行
   * @param {AbortSignal} [signal] - 取消信号
   * @returns {boolean}
   */
  shouldAbort(signal) {
    return signal?.aborted || this._abortController?.signal.aborted;
  }

  /**
   * 抛出取消错误
   * @throws {Error}
   */
  throwIfAborted(signal) {
    if (this.shouldAbort(signal)) {
      throw new Error('Execution cancelled');
    }
  }

  /**
   * 取消当前执行
   */
  cancel() {
    if (this._abortController) {
      this._abortController.abort();
    }
  }

  /**
   * 运行节点（包含完整生命周期）
   * @param {Object} node - 节点定义
   * @param {Object} context - 执行上下文
   * @param {ExecuteOptions} [options={}] - 执行选项
   * @returns {Promise<NodeResult>}
   */
  async run(node, context, options = {}) {
    if (this._running) {
      throw new Error(`Node executor for ${this.nodeType} is already running`);
    }

    this._running = true;
    this._abortController = new AbortController();
    
    const startTime = Date.now();
    const signal = options.signal || this._abortController.signal;
    
    try {
      // 发送开始事件
      this.emit('started', { node, timestamp: new Date().toISOString() });
      
      // 执行前钩子
      await this.onStart(node, context, options);
      
      // 检查条件
      if (node.condition) {
        const shouldRun = context.evaluateCondition(node.condition);
        if (!shouldRun) {
          const result = {
            ok: true,
            output: null,
            skipped: true,
            reason: 'Condition not met',
            duration: Date.now() - startTime,
          };
          this.emit('finished', { node, result, timestamp: new Date().toISOString() });
          return result;
        }
      }
      
      // 替换配置中的变量
      const resolvedConfig = context.interpolateDeep(node.config || {});
      
      // 执行核心逻辑（带超时和重试）
      const result = await this._executeWithRetry(
        resolvedConfig,
        context,
        {
          ...options,
          signal,
          timeout: node.timeout || options.timeout,
          retry: node.retry || options.retry,
        }
      );
      
      result.duration = Date.now() - startTime;
      
      // 执行后钩子
      await this.onComplete(node, context, result);
      
      // 发送完成事件
      this.emit('finished', { node, result, timestamp: new Date().toISOString() });
      
      return result;
      
    } catch (err) {
      const result = {
        ok: false,
        output: null,
        error: err.message,
        duration: Date.now() - startTime,
      };
      
      // 发送完成事件（失败）
      this.emit('finished', { node, result, timestamp: new Date().toISOString() });
      
      // 根据错误处理策略决定是否抛出
      if (node.onError === 'fail') {
        throw err;
      }
      
      return result;
      
    } finally {
      this._running = false;
      this._abortController = null;
    }
  }

  /**
   * 带重试的执行
   * @private
   */
  async _executeWithRetry(config, context, options) {
    const retry = options.retry || {};
    const maxAttempts = retry.enabled ? (retry.maxAttempts || 3) : 1;
    const delay = retry.delay || 1000;
    const backoff = retry.backoff || 'fixed';
    const backoffMultiplier = retry.backoffMultiplier || 2;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // 检查取消
        this.throwIfAborted(options.signal);
        
        // 发送尝试日志
        if (attempt > 1) {
          this.info(`Retry attempt ${attempt}/${maxAttempts}`);
          this.emit('retry', { attempt, maxAttempts, timestamp: new Date().toISOString() });
        }
        
        // 执行（带超时）
        const result = await this._executeWithTimeout(config, context, options);
        return result;
        
      } catch (err) {
        lastError = err;
        
        // 取消错误不重试
        if (err.message === 'Execution cancelled' || err.message === 'Execution timeout') {
          throw err;
        }
        
        // 最后一次尝试失败
        if (attempt >= maxAttempts) {
          break;
        }
        
        // 计算重试延迟
        let retryDelay = delay;
        if (backoff === 'linear') {
          retryDelay = delay * attempt;
        } else if (backoff === 'exponential') {
          retryDelay = delay * Math.pow(backoffMultiplier, attempt - 1);
        }
        
        this.warn(`Execution failed, retrying in ${retryDelay}ms...`, { error: err.message });
        
        // 等待重试
        await this._sleep(retryDelay, options.signal);
      }
    }
    
    throw lastError;
  }

  /**
   * 带超时的执行
   * @private
   */
  async _executeWithTimeout(config, context, options) {
    const timeout = options.timeout;
    
    if (!timeout) {
      return await this.execute(config, context, options);
    }
    
    return new Promise((resolve, reject) => {
      let timeoutId;
      let settled = false;
      
      // 设置超时
      timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.emit('timeout', { timeout, timestamp: new Date().toISOString() });
          reject(new Error('Execution timeout'));
        }
      }, timeout);
      
      // 执行
      this.execute(config, context, options)
        .then(result => {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            resolve(result);
          }
        })
        .catch(err => {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            reject(err);
          }
        });
      
      // 监听取消
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            reject(new Error('Execution cancelled'));
          }
        });
      }
    });
  }

  /**
   * 睡眠（可取消）
   * @private
   */
  _sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, ms);
      
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Execution cancelled'));
        });
      }
    });
  }
}

/**
 * 节点执行器注册表
 */
export class ExecutorRegistry {
  constructor() {
    /** @type {Map<string, typeof NodeExecutor>} */
    this._executors = new Map();
  }

  /**
   * 注册执行器
   * @param {string} nodeType - 节点类型
   * @param {typeof NodeExecutor} ExecutorClass - 执行器类
   */
  register(nodeType, ExecutorClass) {
    this._executors.set(nodeType, ExecutorClass);
  }

  /**
   * 获取执行器
   * @param {string} nodeType - 节点类型
   * @returns {NodeExecutor|null}
   */
  get(nodeType) {
    const ExecutorClass = this._executors.get(nodeType);
    if (!ExecutorClass) {
      return null;
    }
    return new ExecutorClass(nodeType);
  }

  /**
   * 检查是否已注册
   * @param {string} nodeType - 节点类型
   * @returns {boolean}
   */
  has(nodeType) {
    return this._executors.has(nodeType);
  }

  /**
   * 获取所有已注册的节点类型
   * @returns {string[]}
   */
  getRegisteredTypes() {
    return Array.from(this._executors.keys());
  }

  /**
   * 取消注册
   * @param {string} nodeType - 节点类型
   */
  unregister(nodeType) {
    this._executors.delete(nodeType);
  }
}

/**
 * 全局执行器注册表
 */
export const globalRegistry = new ExecutorRegistry();

/**
 * 创建简单的函数执行器
 * @param {string} nodeType - 节点类型
 * @param {Function} executeFn - 执行函数
 * @returns {typeof NodeExecutor}
 */
export function createExecutor(nodeType, executeFn) {
  return class extends NodeExecutor {
    constructor() {
      super(nodeType);
    }

    async execute(config, context, options) {
      return await executeFn(config, context, options, this);
    }
  };
}

/**
 * 创建成功结果
 * @param {*} output - 输出数据
 * @param {Object} [meta] - 元数据
 * @returns {NodeResult}
 */
export function successResult(output, meta = {}) {
  return {
    ok: true,
    output,
    error: null,
    duration: 0,
    meta,
  };
}

/**
 * 创建失败结果
 * @param {string} error - 错误信息
 * @param {*} [output] - 部分输出
 * @param {Object} [meta] - 元数据
 * @returns {NodeResult}
 */
export function failureResult(error, output = null, meta = {}) {
  return {
    ok: false,
    output,
    error,
    duration: 0,
    meta,
  };
}

export default {
  NodeExecutor,
  ExecutorRegistry,
  globalRegistry,
  createExecutor,
  successResult,
  failureResult,
};

