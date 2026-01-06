/**
 * Variable Context Manager v2
 * 
 * 管理流程运行时的变量上下文
 * 
 * 作用域层级（从高到低优先级）：
 * 1. nodes - 节点输出
 * 2. variables - 运行时变量
 * 3. inputs - 输入参数
 * 4. env - 环境变量
 * 
 * @module lib/v2/context
 */

import { interpolate, interpolateDeep, evaluate, evaluateCondition } from './expression.mjs';

/**
 * 节点运行状态
 * @typedef {Object} NodeRunState
 * @property {string} id - 节点 ID
 * @property {string} status - 状态 (PENDING/RUNNING/SUCCESS/FAILED/SKIPPED/CANCELLED/TIMEOUT)
 * @property {string} started_at - 开始时间
 * @property {string} [finished_at] - 结束时间
 * @property {number} [duration] - 耗时(ms)
 * @property {*} output - 节点输出
 * @property {string} [error] - 错误信息
 * @property {number} attempt - 当前尝试次数
 */

/**
 * 上下文快照
 * @typedef {Object} ContextSnapshot
 * @property {Object} inputs - 输入参数
 * @property {Object} variables - 变量
 * @property {Object<string, NodeRunState>} nodes - 节点状态
 * @property {Object} env - 环境变量
 */

/**
 * 执行上下文类
 */
export class ExecutionContext {
  /**
   * @param {Object} options - 配置选项
   * @param {Object} [options.inputs={}] - 输入参数
   * @param {Object} [options.variables={}] - 初始变量
   * @param {Object} [options.env={}] - 环境变量
   */
  constructor(options = {}) {
    /** @type {Object} 输入参数（只读） */
    this._inputs = Object.freeze({ ...options.inputs });
    
    /** @type {Object} 运行时变量 */
    this._variables = { ...options.variables };
    
    /** @type {Object} 环境变量（只读） */
    this._env = Object.freeze({ ...options.env });
    
    /** @type {Map<string, NodeRunState>} 节点运行状态 */
    this._nodes = new Map();
    
    /** @type {string} 运行 ID */
    this._runId = options.runId || '';
    
    /** @type {string} 流程名称 */
    this._flowName = options.flowName || '';
    
    /** @type {string} 开始时间 */
    this._startedAt = new Date().toISOString();
  }

  /**
   * 获取输入参数
   * @returns {Object} 输入参数
   */
  get inputs() {
    return this._inputs;
  }

  /**
   * 获取变量
   * @returns {Object} 变量
   */
  get variables() {
    return { ...this._variables };
  }

  /**
   * 获取环境变量
   * @returns {Object} 环境变量
   */
  get env() {
    return this._env;
  }

  /**
   * 获取节点状态对象
   * @returns {Object} 节点状态对象
   */
  get nodes() {
    const result = {};
    for (const [id, state] of this._nodes) {
      result[id] = { ...state };
    }
    return result;
  }

  /**
   * 获取运行 ID
   * @returns {string}
   */
  get runId() {
    return this._runId;
  }

  /**
   * 获取流程名称
   * @returns {string}
   */
  get flowName() {
    return this._flowName;
  }

  /**
   * 获取开始时间
   * @returns {string}
   */
  get startedAt() {
    return this._startedAt;
  }

  /**
   * 设置变量
   * @param {string} name - 变量名
   * @param {*} value - 变量值
   */
  setVariable(name, value) {
    this._variables[name] = value;
  }

  /**
   * 批量设置变量
   * @param {Object} vars - 变量对象
   */
  setVariables(vars) {
    Object.assign(this._variables, vars);
  }

  /**
   * 获取变量
   * @param {string} name - 变量名
   * @returns {*} 变量值
   */
  getVariable(name) {
    return this._variables[name];
  }

  /**
   * 删除变量
   * @param {string} name - 变量名
   */
  deleteVariable(name) {
    delete this._variables[name];
  }

  /**
   * 初始化节点状态
   * @param {string} nodeId - 节点 ID
   */
  initNodeState(nodeId) {
    this._nodes.set(nodeId, {
      id: nodeId,
      status: 'PENDING',
      started_at: null,
      finished_at: null,
      duration: null,
      output: null,
      error: null,
      attempt: 0,
    });
  }

  /**
   * 标记节点开始运行
   * @param {string} nodeId - 节点 ID
   * @param {number} [attempt=1] - 尝试次数
   */
  markNodeStarted(nodeId, attempt = 1) {
    const state = this._nodes.get(nodeId) || { id: nodeId };
    state.status = 'RUNNING';
    state.started_at = new Date().toISOString();
    state.attempt = attempt;
    state.error = null;
    this._nodes.set(nodeId, state);
  }

  /**
   * 标记节点成功完成
   * @param {string} nodeId - 节点 ID
   * @param {*} output - 节点输出
   */
  markNodeSuccess(nodeId, output = null) {
    const state = this._nodes.get(nodeId);
    if (!state) return;
    
    const finishedAt = new Date().toISOString();
    state.status = 'SUCCESS';
    state.finished_at = finishedAt;
    state.duration = new Date(finishedAt).getTime() - new Date(state.started_at).getTime();
    state.output = output;
  }

  /**
   * 标记节点失败
   * @param {string} nodeId - 节点 ID
   * @param {string} error - 错误信息
   * @param {*} [output] - 部分输出
   */
  markNodeFailed(nodeId, error, output = null) {
    const state = this._nodes.get(nodeId);
    if (!state) return;
    
    const finishedAt = new Date().toISOString();
    state.status = 'FAILED';
    state.finished_at = finishedAt;
    state.duration = new Date(finishedAt).getTime() - new Date(state.started_at).getTime();
    state.error = error;
    state.output = output;
  }

  /**
   * 标记节点跳过
   * @param {string} nodeId - 节点 ID
   * @param {string} [reason] - 跳过原因
   */
  markNodeSkipped(nodeId, reason = '') {
    const state = this._nodes.get(nodeId) || { id: nodeId };
    state.status = 'SKIPPED';
    state.finished_at = new Date().toISOString();
    state.error = reason || 'Skipped';
    this._nodes.set(nodeId, state);
  }

  /**
   * 标记节点取消
   * @param {string} nodeId - 节点 ID
   */
  markNodeCancelled(nodeId) {
    const state = this._nodes.get(nodeId);
    if (!state) return;
    
    state.status = 'CANCELLED';
    state.finished_at = new Date().toISOString();
    if (state.started_at) {
      state.duration = new Date(state.finished_at).getTime() - new Date(state.started_at).getTime();
    }
  }

  /**
   * 标记节点超时
   * @param {string} nodeId - 节点 ID
   */
  markNodeTimeout(nodeId) {
    const state = this._nodes.get(nodeId);
    if (!state) return;
    
    state.status = 'TIMEOUT';
    state.finished_at = new Date().toISOString();
    state.duration = new Date(state.finished_at).getTime() - new Date(state.started_at).getTime();
    state.error = 'Timeout';
  }

  /**
   * 获取节点状态
   * @param {string} nodeId - 节点 ID
   * @returns {NodeRunState|null} 节点状态
   */
  getNodeState(nodeId) {
    const state = this._nodes.get(nodeId);
    return state ? { ...state } : null;
  }

  /**
   * 获取节点输出
   * @param {string} nodeId - 节点 ID
   * @returns {*} 节点输出
   */
  getNodeOutput(nodeId) {
    const state = this._nodes.get(nodeId);
    return state?.output;
  }

  /**
   * 检查节点是否已完成
   * @param {string} nodeId - 节点 ID
   * @returns {boolean}
   */
  isNodeFinished(nodeId) {
    const state = this._nodes.get(nodeId);
    if (!state) return false;
    return ['SUCCESS', 'FAILED', 'SKIPPED', 'CANCELLED', 'TIMEOUT'].includes(state.status);
  }

  /**
   * 检查节点是否成功
   * @param {string} nodeId - 节点 ID
   * @returns {boolean}
   */
  isNodeSuccess(nodeId) {
    const state = this._nodes.get(nodeId);
    return state?.status === 'SUCCESS';
  }

  /**
   * 获取完整的上下文快照（用于表达式求值）
   * @returns {ContextSnapshot}
   */
  getSnapshot() {
    return {
      inputs: this._inputs,
      variables: this._variables,
      nodes: this.nodes,
      env: this._env,
      run: {
        id: this._runId,
        flowName: this._flowName,
        startedAt: this._startedAt,
      },
    };
  }

  /**
   * 替换字符串中的模板变量
   * @param {string} template - 模板字符串
   * @returns {string} 替换后的字符串
   */
  interpolate(template) {
    return interpolate(template, this.getSnapshot());
  }

  /**
   * 递归替换对象中的模板变量
   * @param {*} obj - 任意值
   * @returns {*} 替换后的值
   */
  interpolateDeep(obj) {
    return interpolateDeep(obj, this.getSnapshot());
  }

  /**
   * 求值表达式
   * @param {string} expression - 表达式
   * @returns {*} 求值结果
   */
  evaluate(expression) {
    return evaluate(expression, this.getSnapshot());
  }

  /**
   * 求值条件表达式
   * @param {string} condition - 条件表达式
   * @returns {boolean} 条件结果
   */
  evaluateCondition(condition) {
    return evaluateCondition(condition, this.getSnapshot());
  }

  /**
   * 创建子上下文（用于循环或子流程）
   * @param {Object} [overrides={}] - 覆盖的变量
   * @returns {ExecutionContext} 子上下文
   */
  createChildContext(overrides = {}) {
    const child = new ExecutionContext({
      inputs: this._inputs,
      variables: { ...this._variables, ...overrides },
      env: this._env,
      runId: this._runId,
      flowName: this._flowName,
    });
    
    // 复制节点状态
    for (const [id, state] of this._nodes) {
      child._nodes.set(id, { ...state });
    }
    
    return child;
  }

  /**
   * 合并子上下文的变更
   * @param {ExecutionContext} childContext - 子上下文
   * @param {string[]} [variablesToMerge] - 要合并的变量列表，默认全部
   */
  mergeChildContext(childContext, variablesToMerge = null) {
    // 合并变量
    if (variablesToMerge) {
      for (const name of variablesToMerge) {
        if (name in childContext._variables) {
          this._variables[name] = childContext._variables[name];
        }
      }
    } else {
      Object.assign(this._variables, childContext._variables);
    }
    
    // 合并节点状态
    for (const [id, state] of childContext._nodes) {
      if (!this._nodes.has(id) || this._nodes.get(id).status === 'PENDING') {
        this._nodes.set(id, { ...state });
      }
    }
  }

  /**
   * 序列化上下文（用于持久化）
   * @returns {Object} 序列化后的对象
   */
  serialize() {
    return {
      runId: this._runId,
      flowName: this._flowName,
      startedAt: this._startedAt,
      inputs: this._inputs,
      variables: this._variables,
      env: this._env,
      nodes: Object.fromEntries(this._nodes),
    };
  }

  /**
   * 从序列化数据恢复上下文
   * @param {Object} data - 序列化数据
   * @returns {ExecutionContext} 恢复的上下文
   */
  static deserialize(data) {
    const ctx = new ExecutionContext({
      inputs: data.inputs || {},
      variables: data.variables || {},
      env: data.env || {},
      runId: data.runId || '',
      flowName: data.flowName || '',
    });
    
    ctx._startedAt = data.startedAt || ctx._startedAt;
    
    if (data.nodes) {
      for (const [id, state] of Object.entries(data.nodes)) {
        ctx._nodes.set(id, { ...state });
      }
    }
    
    return ctx;
  }
}

/**
 * 创建执行上下文
 * @param {Object} options - 配置选项
 * @returns {ExecutionContext}
 */
export function createContext(options = {}) {
  return new ExecutionContext(options);
}

/**
 * 从流程定义创建执行上下文
 * @param {Object} flow - 解析后的流程定义
 * @param {Object} inputValues - 输入参数值
 * @param {Object} [options={}] - 额外选项
 * @returns {ExecutionContext}
 */
export function createContextFromFlow(flow, inputValues = {}, options = {}) {
  // 验证必填输入参数
  const validatedInputs = {};
  
  for (const [name, param] of Object.entries(flow.inputs || {})) {
    if (name in inputValues) {
      validatedInputs[name] = inputValues[name];
    } else if ('default' in param) {
      validatedInputs[name] = param.default;
    } else if (param.required) {
      throw new Error(`Missing required input parameter: ${name}`);
    }
  }
  
  // 初始化变量默认值
  const initialVariables = {};
  for (const [name, varDef] of Object.entries(flow.variables || {})) {
    if ('default' in varDef) {
      initialVariables[name] = varDef.default;
    }
  }
  
  // 创建上下文
  const ctx = new ExecutionContext({
    inputs: validatedInputs,
    variables: initialVariables,
    env: options.env || process.env,
    runId: options.runId || '',
    flowName: flow.name || '',
  });
  
  // 初始化所有节点状态
  for (const node of flow.nodes) {
    ctx.initNodeState(node.id);
  }
  
  return ctx;
}

export default {
  ExecutionContext,
  createContext,
  createContextFromFlow,
};

