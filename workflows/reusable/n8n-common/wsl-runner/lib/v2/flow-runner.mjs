/**
 * Flow Runner - v2 流程调度器
 * 
 * 负责解析和执行 FlowSpec 定义的工作流
 * 
 * 功能:
 * - 解析 FlowSpec JSON
 * - 拓扑排序和节点调度
 * - 执行节点并管理状态
 * - 处理控制流（条件、并行、循环）
 * - 生成运行工件（graph.json, events.ndjson, status.json）
 * - 支持取消、超时、重试
 * 
 * @module lib/v2/flow-runner
 */

import { EventEmitter } from 'node:events';
import { parseFlowSpec, ParseError } from './parser.mjs';
import { ExecutionContext, createContextFromFlow } from './context.mjs';
import { interpolate, interpolateDeep } from './expression.mjs';
import { getExecutor, hasExecutor } from './executors/index.mjs';

/**
 * 运行状态
 */
export const RunStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT',
};

/**
 * 节点状态
 */
export const NodeStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT',
};

/**
 * 事件类型
 */
export const EventType = {
  RUN_STARTED: 'RUN_STARTED',
  RUN_FINISHED: 'RUN_FINISHED',
  RUN_CANCELLED: 'RUN_CANCELLED',
  NODE_STARTED: 'NODE_STARTED',
  NODE_FINISHED: 'NODE_FINISHED',
  NODE_LOG: 'NODE_LOG',
  NODE_RETRY: 'NODE_RETRY',
  NODE_TIMEOUT: 'NODE_TIMEOUT',
};

/**
 * 生成运行 ID
 */
function generateRunId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `run-${timestamp}-${random}`;
}

/**
 * 获取入口节点（没有被其他节点引用的节点）
 */
function findEntryNodes(flowSpec) {
  const nodes = flowSpec.nodes || [];
  const edges = flowSpec.edges || [];
  
  // 收集所有被引用的目标节点
  const targetNodes = new Set();
  
  // 从 edges 中收集
  for (const edge of edges) {
    if (edge.to) targetNodes.add(edge.to);
    if (edge.target) targetNodes.add(edge.target);
  }
  
  // 从 on_success/on_failure 中收集
  for (const node of nodes) {
    if (node.on_success) {
      const targets = Array.isArray(node.on_success) ? node.on_success : [node.on_success];
      targets.forEach(t => targetNodes.add(t));
    }
    if (node.on_failure) {
      const targets = Array.isArray(node.on_failure) ? node.on_failure : [node.on_failure];
      targets.forEach(t => targetNodes.add(t));
    }
    if (node.onTrue) {
      const targets = Array.isArray(node.onTrue) ? node.onTrue : [node.onTrue];
      targets.forEach(t => targetNodes.add(t));
    }
    if (node.onFalse) {
      const targets = Array.isArray(node.onFalse) ? node.onFalse : [node.onFalse];
      targets.forEach(t => targetNodes.add(t));
    }
    if (node.depends_on) {
      // depends_on 表示当前节点依赖其他节点，不影响入口判断
    }
  }
  
  // 找出不在目标集合中的节点
  const entryNodes = nodes
    .map(n => n.id)
    .filter(id => !targetNodes.has(id));
  
  // 如果所有节点都被引用，返回第一个节点
  if (entryNodes.length === 0 && nodes.length > 0) {
    return [nodes[0].id];
  }
  
  return entryNodes;
}

/**
 * 从节点定义获取后继节点
 */
function getNodeSuccessors(node) {
  const successors = [];
  
  if (node.on_success) {
    const targets = Array.isArray(node.on_success) ? node.on_success : [node.on_success];
    successors.push(...targets);
  }
  
  return successors;
}

/**
 * Flow Runner 配置
 * @typedef {Object} FlowRunnerConfig
 * @property {string} [runId] - 运行ID（默认自动生成）
 * @property {string} [runDir] - 工件输出目录
 * @property {number} [defaultTimeout] - 默认节点超时（毫秒）
 * @property {boolean} [emitEvents] - 是否发出事件
 * @property {Function} [artifactWriter] - 工件写入器
 */

/**
 * Flow Runner
 */
export class FlowRunner extends EventEmitter {
  /**
   * @param {FlowRunnerConfig} config
   */
  constructor(config = {}) {
    super();
    
    this.runId = config.runId || generateRunId();
    this.runDir = config.runDir || null;
    this.defaultTimeout = config.defaultTimeout || 30 * 60 * 1000; // 30分钟
    this.emitEvents = config.emitEvents !== false;
    this.artifactWriter = config.artifactWriter || null;

    // 运行状态
    this.status = RunStatus.PENDING;
    this.flowSpec = null;
    this.context = null;
    this.startTime = null;
    this.endTime = null;
    this.error = null;

    // 取消控制
    this.abortController = new AbortController();
    this.cancelled = false;

    // 事件日志
    this.events = [];
    
    // 节点状态缓存
    this.nodeResults = new Map();
  }

  /**
   * 发出事件并记录
   */
  _emitEvent(type, data) {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      runId: this.runId,
      ...data,
    };
    
    this.events.push(event);
    
    if (this.emitEvents) {
      this.emit(type, event);
      this.emit('event', event);
    }

    return event;
  }

  /**
   * 执行流程
   * @param {Object|string} flowSpecOrPath - FlowSpec 对象或文件路径
   * @param {Object} inputs - 输入参数
   * @returns {Promise<RunResult>}
   */
  async run(flowSpecOrPath, inputs = {}) {
    this.startTime = Date.now();
    this.status = RunStatus.RUNNING;

    try {
      // 解析 FlowSpec
      if (typeof flowSpecOrPath === 'string') {
        this.flowSpec = await parseFlowSpec(flowSpecOrPath);
      } else {
        this.flowSpec = flowSpecOrPath;
      }

      // 创建执行上下文，传入输入参数
      this.context = createContextFromFlow(this.flowSpec, inputs);

      // 发出运行开始事件
      this._emitEvent(EventType.RUN_STARTED, {
        flowId: this.flowSpec.id,
        flowName: this.flowSpec.name,
        inputs,
      });

      // 写入初始工件
      await this._writeInitialArtifacts();

      // 获取入口节点
      const entryNodes = findEntryNodes(this.flowSpec);
      
      if (entryNodes.length === 0) {
        throw new Error('No entry nodes found in flow');
      }

      // 执行流程
      await this._executeNodes(entryNodes);

      // 检查是否被取消
      if (this.cancelled) {
        this.status = RunStatus.CANCELLED;
      } else {
        // 检查是否有失败节点
        const hasFailure = Array.from(this.nodeResults.values())
          .some(r => r.status === NodeStatus.FAILED);
        
        this.status = hasFailure ? RunStatus.FAILED : RunStatus.SUCCESS;
      }

    } catch (err) {
      this.status = RunStatus.FAILED;
      this.error = err.message;
      
      if (err instanceof ParseError) {
        this._emitEvent(EventType.NODE_LOG, {
          level: 'error',
          message: `Flow parse error: ${err.message}`,
        });
      }
    }

    this.endTime = Date.now();

    // 发出运行结束事件
    this._emitEvent(EventType.RUN_FINISHED, {
      status: this.status,
      duration: this.endTime - this.startTime,
      error: this.error,
    });

    // 写入最终工件
    await this._writeFinalArtifacts();

    return this._buildRunResult();
  }

  /**
   * 执行节点列表（支持并行）
   */
  async _executeNodes(nodeIds) {
    if (this.cancelled) return;

    // 分组：可以并行执行的节点
    const readyNodes = nodeIds.filter(id => this._canExecute(id));
    
    if (readyNodes.length === 0) return;

    // 并行执行所有就绪节点
    await Promise.all(readyNodes.map(id => this._executeNode(id)));
  }

  /**
   * 检查节点是否可以执行
   */
  _canExecute(nodeId) {
    // 已经执行过
    if (this.nodeResults.has(nodeId)) return false;
    
    // 检查前置节点是否都已完成
    const node = this._getNode(nodeId);
    if (!node) return false;

    // 如果有 depends_on，检查依赖
    if (node.depends_on) {
      const deps = Array.isArray(node.depends_on) ? node.depends_on : [node.depends_on];
      for (const depId of deps) {
        const depResult = this.nodeResults.get(depId);
        if (!depResult || depResult.status !== NodeStatus.SUCCESS) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 执行单个节点
   */
  async _executeNode(nodeId) {
    if (this.cancelled) return;

    const node = this._getNode(nodeId);
    if (!node) {
      console.warn(`Node not found: ${nodeId}`);
      return;
    }

    // 初始化节点状态
    this.context.initNodeState(nodeId);
    this.context.markNodeStarted(nodeId);

    // 发出节点开始事件
    this._emitEvent(EventType.NODE_STARTED, { nodeId, nodeType: node.type });

    const startTime = Date.now();
    let result;

    try {
      // 获取执行器
      const executor = getExecutor(node.type);
      if (!executor) {
        throw new Error(`No executor for node type: ${node.type}`);
      }

      // 解析节点配置中的变量
      const resolvedConfig = this._resolveNodeConfig(node);

      // 计算超时
      const timeout = node.timeout_ms || this.defaultTimeout;

      // 执行节点
      result = await executor.run(
        { ...node, config: resolvedConfig },
        this.context,
        {
          signal: this.abortController.signal,
          timeout,
        }
      );

      // 更新节点状态
      if (result.ok) {
        this.context.markNodeSuccess(nodeId, result.output);
        this.nodeResults.set(nodeId, {
          status: NodeStatus.SUCCESS,
          output: result.output,
          duration: Date.now() - startTime,
        });
      } else {
        this.context.markNodeFailed(nodeId, result.error);
        this.nodeResults.set(nodeId, {
          status: NodeStatus.FAILED,
          error: result.error,
          output: result.output,
          duration: Date.now() - startTime,
        });
      }

    } catch (err) {
      result = { ok: false, error: err.message };
      this.context.markNodeFailed(nodeId, err.message);
      this.nodeResults.set(nodeId, {
        status: err.name === 'AbortError' ? NodeStatus.CANCELLED : NodeStatus.FAILED,
        error: err.message,
        duration: Date.now() - startTime,
      });
    }

    // 发出节点结束事件
    const nodeResult = this.nodeResults.get(nodeId);
    this._emitEvent(EventType.NODE_FINISHED, {
      nodeId,
      status: nodeResult.status,
      duration: nodeResult.duration,
      error: nodeResult.error,
    });

    // 处理后续节点
    await this._handleNodeCompletion(node, result);
  }

  /**
   * 处理节点完成后的后续节点
   */
  async _handleNodeCompletion(node, result) {
    if (this.cancelled) return;

    let nextNodes = [];

    // 根据节点类型确定后续节点
    switch (node.type) {
      case 'condition':
        // 条件节点：根据结果选择分支
        if (result.ok && result.output?.next) {
          nextNodes = result.output.next;
        }
        break;

      case 'parallel':
        // 并行节点：等待所有分支完成后继续
        if (result.ok && node.on_success) {
          nextNodes = this._normalizeNext(node.on_success);
        }
        break;

      case 'loop':
        // 循环节点：循环完成后继续
        if (result.ok && node.on_success) {
          nextNodes = this._normalizeNext(node.on_success);
        }
        break;

      default:
        // 普通节点：根据成功/失败选择后续
        if (result.ok) {
          nextNodes = this._normalizeNext(node.on_success);
        } else {
          nextNodes = this._normalizeNext(node.on_failure);
          
          // 如果没有失败处理，且节点允许继续，使用成功路径
          if (nextNodes.length === 0 && node.onError === 'continue') {
            nextNodes = this._normalizeNext(node.on_success);
          }
        }
    }

    // 如果没有显式后续，尝试使用 FlowSpec 中的边
    if (nextNodes.length === 0 && this.flowSpec.edges) {
      const edges = this.flowSpec.edges || [];
      nextNodes = edges
        .filter(e => (e.from === node.id || e.source === node.id))
        .map(e => e.to || e.target);
    }

    // 执行后续节点
    if (nextNodes.length > 0) {
      await this._executeNodes(nextNodes);
    }
  }

  /**
   * 标准化后续节点
   */
  _normalizeNext(next) {
    if (!next) return [];
    return Array.isArray(next) ? next : [next];
  }

  /**
   * 解析节点配置中的变量
   * 注意：保留 onTrue/onFalse 用于条件节点
   */
  _resolveNodeConfig(node) {
    // 如果节点有 config 属性，使用它；否则从节点提取配置
    let config;
    if (node.config) {
      config = { ...node.config };
      // 条件节点需要 onTrue/onFalse
      if (node.type === 'condition') {
        config.onTrue = node.onTrue;
        config.onFalse = node.onFalse;
      }
    } else {
      config = { ...node };
      // 删除元数据字段（但保留条件节点需要的字段）
      delete config.id;
      delete config.type;
      delete config.name;
      delete config.on_success;
      delete config.on_failure;
      delete config.depends_on;
      delete config.timeout_ms;
      delete config.retry;
      delete config.onError;
      // 注意：不删除 onTrue/onFalse，条件节点需要
    }

    try {
      const ctx = this.context.getSnapshot();
      return interpolateDeep(config, ctx);
    } catch {
      return config;
    }
  }

  /**
   * 获取节点定义
   */
  _getNode(nodeId) {
    return this.flowSpec.nodes.find(n => n.id === nodeId);
  }

  /**
   * 取消执行
   */
  cancel() {
    this.cancelled = true;
    this.abortController.abort();
    
    this._emitEvent(EventType.RUN_CANCELLED, {
      reason: 'User requested cancellation',
    });
  }

  /**
   * 写入初始工件
   */
  async _writeInitialArtifacts() {
    if (!this.artifactWriter) return;

    // 写入 status.json
    await this.artifactWriter('status.json', {
      run_id: this.runId,
      flow_id: this.flowSpec.id,
      flow_name: this.flowSpec.name,
      status: this.status,
      started_at: new Date(this.startTime).toISOString(),
    });

    // 写入 graph.json
    const graph = this._buildGraph();
    await this.artifactWriter('graph.json', graph);
  }

  /**
   * 写入最终工件
   */
  async _writeFinalArtifacts() {
    if (!this.artifactWriter) return;

    // 更新 status.json
    await this.artifactWriter('status.json', {
      run_id: this.runId,
      flow_id: this.flowSpec.id,
      flow_name: this.flowSpec.name,
      status: this.status,
      started_at: new Date(this.startTime).toISOString(),
      finished_at: new Date(this.endTime).toISOString(),
      duration_ms: this.endTime - this.startTime,
      error: this.error,
    });

    // 写入 events.ndjson
    const eventsNdjson = this.events.map(e => JSON.stringify(e)).join('\n');
    await this.artifactWriter('events.ndjson', eventsNdjson, { raw: true });

    // 写入 node_runs.json
    const nodeRuns = {};
    for (const [nodeId, result] of this.nodeResults) {
      nodeRuns[nodeId] = result;
    }
    await this.artifactWriter('node_runs.json', nodeRuns);

    // 更新 graph.json（带状态）
    const graph = this._buildGraph();
    await this.artifactWriter('graph.json', graph);
  }

  /**
   * 构建图结构
   */
  _buildGraph() {
    const flowNodes = this.flowSpec?.nodes || [];
    const nodes = flowNodes.map(node => {
      const result = this.nodeResults.get(node.id);
      return {
        id: node.id,
        type: node.type,
        name: node.name || node.id,
        status: result?.status || NodeStatus.PENDING,
      };
    });

    // 构建边
    const edges = [];
    
    // 从 FlowSpec edges 中收集
    const flowEdges = this.flowSpec?.edges || [];
    for (const edge of flowEdges) {
      edges.push({
        source: edge.from || edge.source,
        target: edge.to || edge.target,
        label: edge.label,
      });
    }
    
    // 从节点的 on_success/on_failure 中收集
    for (const node of flowNodes) {
      if (node.on_success) {
        const targets = this._normalizeNext(node.on_success);
        for (const t of targets) {
          if (!edges.find(e => e.source === node.id && e.target === t)) {
            edges.push({ source: node.id, target: t });
          }
        }
      }
      
      if (node.on_failure) {
        const targets = this._normalizeNext(node.on_failure);
        for (const t of targets) {
          if (!edges.find(e => e.source === node.id && e.target === t)) {
            edges.push({ source: node.id, target: t, label: 'failure' });
          }
        }
      }

      // 处理条件节点的显式分支
      if (node.type === 'condition') {
        if (node.onTrue) {
          const targets = this._normalizeNext(node.onTrue);
          for (const t of targets) {
            if (!edges.find(e => e.source === node.id && e.target === t)) {
              edges.push({ source: node.id, target: t, label: 'true' });
            }
          }
        }
        if (node.onFalse) {
          const targets = this._normalizeNext(node.onFalse);
          for (const t of targets) {
            if (!edges.find(e => e.source === node.id && e.target === t)) {
              edges.push({ source: node.id, target: t, label: 'false' });
            }
          }
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * 构建运行结果
   */
  _buildRunResult() {
    const nodeOutputs = {};
    for (const [nodeId, result] of this.nodeResults) {
      if (result.output !== undefined) {
        nodeOutputs[nodeId] = result.output;
      }
    }

    return {
      runId: this.runId,
      flowId: this.flowSpec?.id,
      status: this.status,
      success: this.status === RunStatus.SUCCESS,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.endTime - this.startTime,
      error: this.error,
      output: nodeOutputs,
      nodes: Object.fromEntries(this.nodeResults),
      events: this.events,
    };
  }
}

/**
 * 创建 FlowRunner 实例
 * @param {FlowRunnerConfig} config
 * @returns {FlowRunner}
 */
export function createFlowRunner(config = {}) {
  return new FlowRunner(config);
}

/**
 * 执行流程的便捷函数
 * @param {Object|string} flowSpec - FlowSpec 对象或文件路径
 * @param {Object} inputs - 输入参数
 * @param {FlowRunnerConfig} config - 运行配置
 * @returns {Promise<RunResult>}
 */
export async function runFlow(flowSpec, inputs = {}, config = {}) {
  const runner = createFlowRunner(config);
  return runner.run(flowSpec, inputs);
}

export default FlowRunner;

