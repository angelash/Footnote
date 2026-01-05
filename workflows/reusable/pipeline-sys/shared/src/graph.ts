/**
 * Pipeline-Sys v1 Graph Types
 * 对应 <run_id>/graph.json
 */

import { NodeType, OutputKind } from './enums.js';

/**
 * 节点输出引用
 */
export interface IOutputRefV1 {
  /** 输出标签 */
  label: string;
  /** 相对路径（相对于 run 目录） */
  rel_path: string;
  /** 输出类型 */
  kind: OutputKind;
}

/**
 * 图谱节点
 */
export interface INodeV1 {
  /** 节点唯一标识 */
  id: string;
  /** 节点类型 */
  type: NodeType;
  /** 显示标题 */
  title: string;
  /** 父节点 ID（用于分组） */
  parent_id: string | null;
  /** 节点输出列表 */
  outputs: IOutputRefV1[];
}

/**
 * 图谱边
 */
export interface IEdgeV1 {
  /** 起始节点 ID */
  from: string;
  /** 目标节点 ID */
  to: string;
}

/**
 * 布局配置
 */
export interface ILayoutV1 {
  /** 布局方向 */
  direction: 'TB' | 'LR';
  /** 分组内边距 */
  group_padding: number;
}

/**
 * 图谱 v1 结构
 * 对应 graph.json
 */
export interface IGraphV1 {
  /** 版本标识 */
  version: 'v1';
  /** 运行 ID */
  run_id: string;
  /** 节点列表 */
  nodes: INodeV1[];
  /** 边列表 */
  edges: IEdgeV1[];
  /** 布局配置 */
  layout: ILayoutV1;
}

/**
 * v1 固定流程的节点 ID 列表
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
] as const;

export type FixedFlowNodeId = (typeof FIXED_FLOW_NODE_IDS)[number];

/**
 * 创建 v1 固定流程图谱模板
 */
export function createFixedFlowGraph(runId: string): IGraphV1 {
  return {
    version: 'v1',
    run_id: runId,
    nodes: [
      { id: 'stage.intake', type: NodeType.STAGE, title: 'Intake', parent_id: null, outputs: [{ label: '入口参数', rel_path: '00_intake.json', kind: OutputKind.JSON }] },
      { id: 'stage.preflight', type: NodeType.STAGE, title: 'Preflight', parent_id: null, outputs: [{ label: '预检结果', rel_path: '01_preflight.json', kind: OutputKind.JSON }] },
      { id: 'execute', type: NodeType.GROUP, title: 'Execute', parent_id: null, outputs: [] },
      { id: 'execute.plan', type: NodeType.TASK, title: 'Plan', parent_id: 'execute', outputs: [{ label: '计划', rel_path: 'nodes/execute.plan.json', kind: OutputKind.JSON }] },
      { id: 'execute.edit', type: NodeType.TASK, title: 'Edit', parent_id: 'execute', outputs: [{ label: '编辑结果', rel_path: 'nodes/execute.edit.json', kind: OutputKind.JSON }] },
      { id: 'execute.lint', type: NodeType.TASK, title: 'Lint', parent_id: 'execute', outputs: [{ label: 'Lint 结果', rel_path: 'nodes/execute.lint.json', kind: OutputKind.JSON }] },
      { id: 'execute.test', type: NodeType.TASK, title: 'Test', parent_id: 'execute', outputs: [{ label: '测试结果', rel_path: 'nodes/execute.test.json', kind: OutputKind.JSON }] },
      { id: 'execute.summary', type: NodeType.TASK, title: 'Summary', parent_id: 'execute', outputs: [{ label: '执行摘要', rel_path: 'nodes/execute.summary.md', kind: OutputKind.MARKDOWN }] },
      { id: 'stage.notify', type: NodeType.STAGE, title: 'Notify', parent_id: null, outputs: [{ label: '通知结果', rel_path: '07_notify.json', kind: OutputKind.JSON }] },
      { id: 'stage.done', type: NodeType.STAGE, title: 'Done', parent_id: null, outputs: [] },
      { id: 'stage.git', type: NodeType.STAGE, title: 'Git', parent_id: null, outputs: [{ label: 'Git 结果', rel_path: '06_git.json', kind: OutputKind.JSON }] },
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

