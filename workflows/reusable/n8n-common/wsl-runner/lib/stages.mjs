/**
 * Stages utilities
 * 固定 stage -> node_id 映射与执行序列
 */

/**
 * Stage 到 Node ID 映射
 */
export const STAGE_TO_NODE_MAP = {
  0: 'stage.intake',
  1: 'stage.preflight',
  2: 'execute.plan',
  3: 'execute.plan', // taskpack 阶段映射到 plan
  4: 'execute.edit',
  5: 'execute.lint',
  6: 'execute.test',
  7: 'stage.notify',
  99: 'stage.done',
  100: 'stage.git',
};

/**
 * Node ID 到 Stage 映射
 */
export const NODE_TO_STAGE_MAP = {
  'stage.intake': 0,
  'stage.preflight': 1,
  'execute.plan': 2,
  'execute.edit': 4,
  'execute.lint': 5,
  'execute.test': 6,
  'execute.summary': 6, // summary 和 test 同 stage
  'stage.notify': 7,
  'stage.done': 99,
  'stage.git': 100,
};

/**
 * 执行序列（按顺序执行的节点列表）
 */
export const EXECUTION_SEQUENCE = [
  'stage.intake',
  'stage.preflight',
  'execute.plan',
  'execute.edit',
  'execute.lint',
  'execute.test',
  'execute.summary',
  'stage.notify',
  'stage.done',
  'stage.git',
];

/**
 * 节点超时配置（毫秒）
 */
export const NODE_TIMEOUTS = {
  'stage.intake': 5 * 60 * 1000,      // 5 分钟
  'stage.preflight': 5 * 60 * 1000,   // 5 分钟
  'execute.plan': 5 * 60 * 1000,      // 5 分钟
  'execute.edit': 60 * 60 * 1000,     // 60 分钟
  'execute.lint': 20 * 60 * 1000,     // 20 分钟
  'execute.test': 30 * 60 * 1000,     // 30 分钟
  'execute.summary': 5 * 60 * 1000,   // 5 分钟
  'stage.notify': 5 * 60 * 1000,      // 5 分钟
  'stage.done': 5 * 60 * 1000,        // 5 分钟
  'stage.git': 5 * 60 * 1000,         // 5 分钟
};

/**
 * 可重试的节点
 */
export const RETRYABLE_NODES = [
  'execute.edit',
  'execute.lint',
  'execute.test',
];

/**
 * 最大重试次数
 */
export const MAX_RETRY_ATTEMPTS = 2;

/**
 * 重试延迟（毫秒）
 */
export const RETRY_DELAY_MS = 10000;

/**
 * 获取节点超时时间
 * @param {string} nodeId 节点 ID
 * @returns {number} 超时毫秒
 */
export function getNodeTimeout(nodeId) {
  return NODE_TIMEOUTS[nodeId] || 5 * 60 * 1000;
}

/**
 * 检查节点是否可重试
 * @param {string} nodeId 节点 ID
 * @returns {boolean}
 */
export function isRetryable(nodeId) {
  return RETRYABLE_NODES.includes(nodeId);
}

/**
 * 获取节点后续节点列表
 * @param {string} nodeId 节点 ID
 * @returns {string[]}
 */
export function getSuccessorNodes(nodeId) {
  const index = EXECUTION_SEQUENCE.indexOf(nodeId);
  if (index < 0) return [];
  return EXECUTION_SEQUENCE.slice(index + 1);
}

/**
 * Stage 转 Node ID
 * @param {number} stage 
 * @returns {string}
 */
export function stageToNodeId(stage) {
  return STAGE_TO_NODE_MAP[stage] || 'stage.intake';
}

/**
 * Node ID 转 Stage
 * @param {string} nodeId 
 * @returns {number}
 */
export function nodeIdToStage(nodeId) {
  return NODE_TO_STAGE_MAP[nodeId] ?? 0;
}

