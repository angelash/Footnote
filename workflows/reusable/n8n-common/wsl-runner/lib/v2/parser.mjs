/**
 * FlowSpec Parser v2
 * 
 * 解析和验证 FlowSpec JSON 配置文件
 * 
 * @module lib/v2/parser
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * FlowSpec 版本正则
 */
const VERSION_PATTERN = /^2\.[0-9]+\.[0-9]+$/;

/**
 * 节点 ID 正则
 */
const NODE_ID_PATTERN = /^[a-z][a-z0-9_.-]*$/;

/**
 * 支持的节点类型
 */
export const NODE_TYPES = [
  'shell',
  'http',
  'condition',
  'parallel',
  'loop',
  'subflow',
  'transform',
  'file',
  'notify',
  'manual',
  'custom',
];

/**
 * 解析错误类
 */
export class ParseError extends Error {
  /**
   * @param {string} message - 错误信息
   * @param {string} [path] - 错误位置路径
   * @param {*} [value] - 错误值
   */
  constructor(message, path = '', value = undefined) {
    super(message);
    this.name = 'ParseError';
    this.path = path;
    this.value = value;
  }

  toString() {
    let msg = this.message;
    if (this.path) {
      msg += ` at ${this.path}`;
    }
    if (this.value !== undefined) {
      msg += ` (got: ${JSON.stringify(this.value)})`;
    }
    return msg;
  }
}

/**
 * 验证结果
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 是否有效
 * @property {ParseError[]} errors - 错误列表
 * @property {ParseError[]} warnings - 警告列表
 */

/**
 * 解析后的流程对象
 * @typedef {Object} ParsedFlow
 * @property {string} version - 版本号
 * @property {string} name - 流程名称
 * @property {string} [description] - 描述
 * @property {Object} inputs - 输入参数定义
 * @property {Object} outputs - 输出参数定义
 * @property {Object} variables - 变量定义
 * @property {ParsedNode[]} nodes - 节点列表
 * @property {Object[]} edges - 边列表
 * @property {Object} settings - 设置
 * @property {Map<string, ParsedNode>} nodeMap - 节点 ID 到节点的映射
 */

/**
 * 解析后的节点
 * @typedef {Object} ParsedNode
 * @property {string} id - 节点 ID
 * @property {string} type - 节点类型
 * @property {string} [name] - 显示名称
 * @property {Object} config - 节点配置
 * @property {Object} inputs - 输入映射
 * @property {Object} outputs - 输出定义
 * @property {number} [timeout] - 超时时间
 * @property {Object} [retry] - 重试配置
 * @property {string} [condition] - 执行条件
 * @property {string} onError - 错误处理策略
 * @property {boolean} disabled - 是否禁用
 */

/**
 * 从文件加载 FlowSpec
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>} 原始 JSON 对象
 */
export async function loadFlowSpec(filePath) {
  const absolutePath = path.resolve(filePath);
  
  try {
    const content = await fs.readFile(absolutePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new ParseError(`FlowSpec file not found: ${absolutePath}`);
    }
    if (err instanceof SyntaxError) {
      throw new ParseError(`Invalid JSON in FlowSpec: ${err.message}`);
    }
    throw err;
  }
}

/**
 * 验证 FlowSpec 结构
 * @param {Object} spec - FlowSpec 对象
 * @returns {ValidationResult} 验证结果
 */
export function validateFlowSpec(spec) {
  const errors = [];
  const warnings = [];

  // 检查必填字段
  if (!spec.version) {
    errors.push(new ParseError('Missing required field: version', 'version'));
  } else if (!VERSION_PATTERN.test(spec.version)) {
    errors.push(new ParseError('Invalid version format, must be 2.x.x', 'version', spec.version));
  }

  if (!spec.name) {
    errors.push(new ParseError('Missing required field: name', 'name'));
  } else if (typeof spec.name !== 'string' || spec.name.length === 0) {
    errors.push(new ParseError('Name must be a non-empty string', 'name', spec.name));
  }

  if (!spec.nodes) {
    errors.push(new ParseError('Missing required field: nodes', 'nodes'));
  } else if (!Array.isArray(spec.nodes)) {
    errors.push(new ParseError('Nodes must be an array', 'nodes', typeof spec.nodes));
  } else if (spec.nodes.length === 0) {
    errors.push(new ParseError('Nodes array cannot be empty', 'nodes'));
  } else {
    // 验证每个节点
    const nodeIds = new Set();
    spec.nodes.forEach((node, index) => {
      const nodePath = `nodes[${index}]`;
      const nodeErrors = validateNode(node, nodePath);
      errors.push(...nodeErrors);

      // 检查节点 ID 唯一性
      if (node.id) {
        if (nodeIds.has(node.id)) {
          errors.push(new ParseError(`Duplicate node ID: ${node.id}`, nodePath));
        }
        nodeIds.add(node.id);
      }
    });
  }

  // 验证输入参数
  if (spec.inputs) {
    Object.entries(spec.inputs).forEach(([key, param]) => {
      const paramErrors = validateInputParam(param, `inputs.${key}`);
      errors.push(...paramErrors);
    });
  }

  // 验证输出参数
  if (spec.outputs) {
    Object.entries(spec.outputs).forEach(([key, param]) => {
      if (!param.type && !param.from) {
        warnings.push(new ParseError('Output should have type or from', `outputs.${key}`));
      }
    });
  }

  // 验证边
  if (spec.edges) {
    if (!Array.isArray(spec.edges)) {
      errors.push(new ParseError('Edges must be an array', 'edges'));
    } else {
      const nodeIds = new Set(spec.nodes?.map(n => n.id) || []);
      spec.edges.forEach((edge, index) => {
        const edgePath = `edges[${index}]`;
        if (!edge.from) {
          errors.push(new ParseError('Edge missing "from" field', edgePath));
        } else if (!nodeIds.has(edge.from)) {
          errors.push(new ParseError(`Edge "from" references unknown node: ${edge.from}`, edgePath));
        }
        if (!edge.to) {
          errors.push(new ParseError('Edge missing "to" field', edgePath));
        } else if (!nodeIds.has(edge.to)) {
          errors.push(new ParseError(`Edge "to" references unknown node: ${edge.to}`, edgePath));
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证单个节点
 * @param {Object} node - 节点对象
 * @param {string} path - 路径
 * @returns {ParseError[]} 错误列表
 */
function validateNode(node, path) {
  const errors = [];

  if (!node.id) {
    errors.push(new ParseError('Node missing required field: id', path));
  } else if (!NODE_ID_PATTERN.test(node.id)) {
    errors.push(new ParseError(
      'Node ID must start with lowercase letter and contain only lowercase letters, numbers, underscores, dots, or hyphens',
      `${path}.id`,
      node.id
    ));
  }

  if (!node.type) {
    errors.push(new ParseError('Node missing required field: type', path));
  } else if (!NODE_TYPES.includes(node.type)) {
    errors.push(new ParseError(
      `Unknown node type: ${node.type}. Valid types: ${NODE_TYPES.join(', ')}`,
      `${path}.type`,
      node.type
    ));
  }

  // 验证超时
  if (node.timeout !== undefined) {
    if (typeof node.timeout !== 'number' || node.timeout < 1000) {
      errors.push(new ParseError('Timeout must be a number >= 1000 (ms)', `${path}.timeout`, node.timeout));
    }
  }

  // 验证重试配置
  if (node.retry) {
    if (node.retry.maxAttempts !== undefined) {
      if (typeof node.retry.maxAttempts !== 'number' || node.retry.maxAttempts < 1 || node.retry.maxAttempts > 10) {
        errors.push(new ParseError('retry.maxAttempts must be between 1 and 10', `${path}.retry.maxAttempts`, node.retry.maxAttempts));
      }
    }
    if (node.retry.delay !== undefined) {
      if (typeof node.retry.delay !== 'number' || node.retry.delay < 0) {
        errors.push(new ParseError('retry.delay must be a non-negative number', `${path}.retry.delay`, node.retry.delay));
      }
    }
    if (node.retry.backoff !== undefined) {
      const validBackoff = ['fixed', 'linear', 'exponential'];
      if (!validBackoff.includes(node.retry.backoff)) {
        errors.push(new ParseError(`retry.backoff must be one of: ${validBackoff.join(', ')}`, `${path}.retry.backoff`, node.retry.backoff));
      }
    }
  }

  // 验证错误处理策略
  if (node.onError !== undefined) {
    const validOnError = ['fail', 'skip', 'continue'];
    if (!validOnError.includes(node.onError)) {
      errors.push(new ParseError(`onError must be one of: ${validOnError.join(', ')}`, `${path}.onError`, node.onError));
    }
  }

  // 验证节点类型特定配置
  if (node.type && node.config) {
    const configErrors = validateNodeConfig(node.type, node.config, `${path}.config`);
    errors.push(...configErrors);
  }

  return errors;
}

/**
 * 验证输入参数定义
 * @param {Object} param - 参数定义
 * @param {string} path - 路径
 * @returns {ParseError[]} 错误列表
 */
function validateInputParam(param, path) {
  const errors = [];
  const validTypes = ['string', 'number', 'boolean', 'object', 'array', 'file'];

  if (!param.type) {
    errors.push(new ParseError('Input parameter missing type', path));
  } else if (!validTypes.includes(param.type)) {
    errors.push(new ParseError(`Invalid input type: ${param.type}. Valid types: ${validTypes.join(', ')}`, `${path}.type`, param.type));
  }

  return errors;
}

/**
 * 验证节点配置
 * @param {string} type - 节点类型
 * @param {Object} config - 配置对象
 * @param {string} path - 路径
 * @returns {ParseError[]} 错误列表
 */
function validateNodeConfig(type, config, path) {
  const errors = [];

  switch (type) {
    case 'shell':
      if (!config.command) {
        errors.push(new ParseError('Shell node requires "command" in config', path));
      }
      break;

    case 'http':
      if (!config.url) {
        errors.push(new ParseError('HTTP node requires "url" in config', path));
      }
      break;

    case 'condition':
      if (!config.expression) {
        errors.push(new ParseError('Condition node requires "expression" in config', path));
      }
      break;

    case 'parallel':
      if (!config.branches || !Array.isArray(config.branches)) {
        errors.push(new ParseError('Parallel node requires "branches" array in config', path));
      } else if (config.branches.length < 2) {
        errors.push(new ParseError('Parallel node requires at least 2 branches', `${path}.branches`));
      }
      break;

    case 'loop':
      if (!config.mode) {
        errors.push(new ParseError('Loop node requires "mode" in config', path));
      } else {
        const validModes = ['for', 'forEach', 'while'];
        if (!validModes.includes(config.mode)) {
          errors.push(new ParseError(`Loop mode must be one of: ${validModes.join(', ')}`, `${path}.mode`, config.mode));
        }
        if (config.mode === 'for' && !config.iterations) {
          errors.push(new ParseError('Loop mode "for" requires "iterations"', path));
        }
        if (config.mode === 'forEach' && !config.collection) {
          errors.push(new ParseError('Loop mode "forEach" requires "collection"', path));
        }
        if (config.mode === 'while' && !config.condition) {
          errors.push(new ParseError('Loop mode "while" requires "condition"', path));
        }
      }
      if (!config.body || !Array.isArray(config.body)) {
        errors.push(new ParseError('Loop node requires "body" array in config', path));
      }
      break;

    case 'subflow':
      if (!config.flowPath) {
        errors.push(new ParseError('Subflow node requires "flowPath" in config', path));
      }
      break;

    case 'transform':
      if (!config.expression) {
        errors.push(new ParseError('Transform node requires "expression" in config', path));
      }
      break;

    case 'file':
      if (!config.operation) {
        errors.push(new ParseError('File node requires "operation" in config', path));
      }
      if (!config.path) {
        errors.push(new ParseError('File node requires "path" in config', path));
      }
      break;

    case 'notify':
      if (!config.channel) {
        errors.push(new ParseError('Notify node requires "channel" in config', path));
      }
      break;

    case 'custom':
      if (!config.handler) {
        errors.push(new ParseError('Custom node requires "handler" in config', path));
      }
      break;
  }

  return errors;
}

/**
 * 解析 FlowSpec 并返回增强后的流程对象
 * @param {Object} spec - FlowSpec 对象
 * @returns {ParsedFlow} 解析后的流程对象
 * @throws {ParseError} 验证失败时抛出
 */
export function parseFlowSpec(spec) {
  // 验证
  const validation = validateFlowSpec(spec);
  if (!validation.valid) {
    const errorMessages = validation.errors.map(e => e.toString()).join('\n');
    throw new ParseError(`FlowSpec validation failed:\n${errorMessages}`);
  }

  // 构建节点映射
  const nodeMap = new Map();
  const nodes = spec.nodes.map(node => {
    const parsed = {
      id: node.id,
      type: node.type,
      name: node.name || node.id,
      description: node.description || '',
      disabled: node.disabled || false,
      config: node.config || {},
      inputs: node.inputs || {},
      outputs: node.outputs || {},
      timeout: node.timeout,
      retry: node.retry ? {
        enabled: node.retry.enabled !== false,
        maxAttempts: node.retry.maxAttempts || 3,
        delay: node.retry.delay || 1000,
        backoff: node.retry.backoff || 'fixed',
        backoffMultiplier: node.retry.backoffMultiplier || 2,
      } : null,
      condition: node.condition || null,
      onError: node.onError || 'fail',
      meta: node.meta || {},
    };
    nodeMap.set(parsed.id, parsed);
    return parsed;
  });

  // 生成默认边（如果没有自定义边，按顺序连接）
  let edges = [];
  if (spec.edges && spec.edges.length > 0) {
    edges = spec.edges.map(edge => ({
      from: edge.from,
      to: edge.to,
      label: edge.label || '',
      condition: edge.condition || null,
      type: edge.type || 'default',
    }));
  } else {
    // 自动生成顺序边
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        from: nodes[i].id,
        to: nodes[i + 1].id,
        label: '',
        condition: null,
        type: 'default',
      });
    }
  }

  return {
    version: spec.version,
    name: spec.name,
    description: spec.description || '',
    author: spec.author || '',
    tags: spec.tags || [],
    inputs: spec.inputs || {},
    outputs: spec.outputs || {},
    variables: spec.variables || {},
    nodes,
    edges,
    settings: {
      timeout: spec.settings?.timeout,
      concurrency: spec.settings?.concurrency || 1,
      retryOnFailure: spec.settings?.retryOnFailure || false,
      continueOnError: spec.settings?.continueOnError || false,
      logLevel: spec.settings?.logLevel || 'info',
      hooks: spec.settings?.hooks || {},
    },
    nodeMap,
  };
}

/**
 * 从文件加载并解析 FlowSpec
 * @param {string} filePath - 文件路径
 * @returns {Promise<ParsedFlow>} 解析后的流程对象
 */
export async function loadAndParseFlowSpec(filePath) {
  const spec = await loadFlowSpec(filePath);
  return parseFlowSpec(spec);
}

/**
 * 获取节点的后继节点列表
 * @param {ParsedFlow} flow - 解析后的流程
 * @param {string} nodeId - 节点 ID
 * @returns {string[]} 后继节点 ID 列表
 */
export function getSuccessors(flow, nodeId) {
  return flow.edges
    .filter(edge => edge.from === nodeId)
    .map(edge => edge.to);
}

/**
 * 获取节点的前驱节点列表
 * @param {ParsedFlow} flow - 解析后的流程
 * @param {string} nodeId - 节点 ID
 * @returns {string[]} 前驱节点 ID 列表
 */
export function getPredecessors(flow, nodeId) {
  return flow.edges
    .filter(edge => edge.to === nodeId)
    .map(edge => edge.from);
}

/**
 * 获取流程的入口节点（没有前驱的节点）
 * @param {ParsedFlow} flow - 解析后的流程
 * @returns {ParsedNode[]} 入口节点列表
 */
export function getEntryNodes(flow) {
  const nodesWithPredecessors = new Set(flow.edges.map(e => e.to));
  return flow.nodes.filter(node => !nodesWithPredecessors.has(node.id));
}

/**
 * 获取流程的出口节点（没有后继的节点）
 * @param {ParsedFlow} flow - 解析后的流程
 * @returns {ParsedNode[]} 出口节点列表
 */
export function getExitNodes(flow) {
  const nodesWithSuccessors = new Set(flow.edges.map(e => e.from));
  return flow.nodes.filter(node => !nodesWithSuccessors.has(node.id));
}

export default {
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
};

