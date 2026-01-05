/**
 * Graph utilities
 * 写入 graph.json（固定流程模板）
 */

import path from 'node:path';
import { writeJson } from './io.mjs';
import { getRunDir } from './paths.mjs';

/**
 * 节点类型
 */
export const NodeType = {
  STAGE: 'stage',
  GROUP: 'group',
  TASK: 'task',
};

/**
 * 输出类型
 */
export const OutputKind = {
  JSON: 'json',
  MARKDOWN: 'markdown',
  TEXT: 'text',
  FILE: 'file',
};

/**
 * 创建 v1 固定流程图谱
 * @param {string} runId run ID
 * @returns {object} graph.json 数据
 */
export function createFixedFlowGraph(runId) {
  return {
    version: 'v1',
    run_id: runId,
    nodes: [
      {
        id: 'stage.intake',
        type: NodeType.STAGE,
        title: 'Intake',
        parent_id: null,
        outputs: [{ label: '入口参数', rel_path: '00_intake.json', kind: OutputKind.JSON }],
      },
      {
        id: 'stage.preflight',
        type: NodeType.STAGE,
        title: 'Preflight',
        parent_id: null,
        outputs: [{ label: '预检结果', rel_path: '01_preflight.json', kind: OutputKind.JSON }],
      },
      {
        id: 'execute',
        type: NodeType.GROUP,
        title: 'Execute',
        parent_id: null,
        outputs: [],
      },
      {
        id: 'execute.plan',
        type: NodeType.TASK,
        title: 'Plan',
        parent_id: 'execute',
        outputs: [{ label: '计划', rel_path: 'nodes/execute.plan.json', kind: OutputKind.JSON }],
      },
      {
        id: 'execute.edit',
        type: NodeType.TASK,
        title: 'Edit',
        parent_id: 'execute',
        outputs: [{ label: '编辑结果', rel_path: 'nodes/execute.edit.json', kind: OutputKind.JSON }],
      },
      {
        id: 'execute.lint',
        type: NodeType.TASK,
        title: 'Lint',
        parent_id: 'execute',
        outputs: [{ label: 'Lint 结果', rel_path: 'nodes/execute.lint.json', kind: OutputKind.JSON }],
      },
      {
        id: 'execute.test',
        type: NodeType.TASK,
        title: 'Test',
        parent_id: 'execute',
        outputs: [{ label: '测试结果', rel_path: 'nodes/execute.test.json', kind: OutputKind.JSON }],
      },
      {
        id: 'execute.summary',
        type: NodeType.TASK,
        title: 'Summary',
        parent_id: 'execute',
        outputs: [{ label: '执行摘要', rel_path: 'nodes/execute.summary.md', kind: OutputKind.MARKDOWN }],
      },
      {
        id: 'stage.notify',
        type: NodeType.STAGE,
        title: 'Notify',
        parent_id: null,
        outputs: [{ label: '通知结果', rel_path: '07_notify.json', kind: OutputKind.JSON }],
      },
      {
        id: 'stage.done',
        type: NodeType.STAGE,
        title: 'Done',
        parent_id: null,
        outputs: [],
      },
      {
        id: 'stage.git',
        type: NodeType.STAGE,
        title: 'Git',
        parent_id: null,
        outputs: [{ label: 'Git 结果', rel_path: '06_git.json', kind: OutputKind.JSON }],
      },
    ],
    edges: [
      { from: 'stage.intake', to: 'stage.preflight' },
      { from: 'stage.preflight', to: 'execute.plan' },
      { from: 'execute.plan', to: 'execute.edit' },
      { from: 'execute.edit', to: 'execute.lint' },
      { from: 'execute.lint', to: 'execute.test' },
      { from: 'execute.test', to: 'execute.summary' },
      { from: 'execute.summary', to: 'stage.notify' },
      { from: 'stage.notify', to: 'stage.done' },
      { from: 'stage.done', to: 'stage.git' },
    ],
    layout: {
      direction: 'TB',
      group_padding: 16,
    },
  };
}

/**
 * 写入 graph.json
 * @param {string} projectRoot 项目根目录
 * @param {string} runId run ID
 */
export async function writeGraph(projectRoot, runId) {
  const runDir = getRunDir(projectRoot, runId);
  const graphPath = path.posix.join(runDir, 'graph.json');
  const graph = createFixedFlowGraph(runId);
  await writeJson(graphPath, graph);
  return graph;
}

/**
 * 固定流程节点 ID 列表
 */
export const FIXED_FLOW_NODE_IDS = [
  'stage.intake',
  'stage.preflight',
  'execute',
  'execute.plan',
  'execute.edit',
  'execute.lint',
  'execute.test',
  'execute.summary',
  'stage.notify',
  'stage.done',
  'stage.git',
];

