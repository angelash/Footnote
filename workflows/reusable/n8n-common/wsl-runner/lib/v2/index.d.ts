/**
 * Pipeline-Sys v2 TypeScript Type Definitions
 *
 * 为 FlowSpec 配置化流程执行引擎提供完整的类型定义
 *
 * @module lib/v2
 * @version 2.0.0
 */

import { EventEmitter } from 'node:events';

// ============================================================================
// Parser Types
// ============================================================================

/** 支持的节点类型 */
export type NodeType =
  | 'shell'
  | 'http'
  | 'condition'
  | 'parallel'
  | 'loop'
  | 'subflow'
  | 'transform'
  | 'file'
  | 'notify'
  | 'manual'
  | 'custom';

/** 支持的节点类型数组 */
export const NODE_TYPES: readonly NodeType[];

/** 解析错误 */
export class ParseError extends Error {
  name: 'ParseError';
  path: string;
  value: unknown;

  constructor(message: string, path?: string, value?: unknown);
  toString(): string;
}

/** 输入参数类型 */
export type InputParamType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';

/** 输入参数定义 */
export interface InputParamDefinition {
  type: InputParamType;
  required?: boolean;
  default?: unknown;
  description?: string;
}

/** 输出参数定义 */
export interface OutputParamDefinition {
  type?: string;
  from?: string;
  description?: string;
}

/** 变量定义 */
export interface VariableDefinition {
  type?: string;
  default?: unknown;
  description?: string;
}

/** 重试配置 */
export interface RetryConfig {
  enabled?: boolean;
  maxAttempts?: number;
  delay?: number;
  backoff?: 'fixed' | 'linear' | 'exponential';
  backoffMultiplier?: number;
}

/** 错误处理策略 */
export type OnErrorStrategy = 'fail' | 'skip' | 'continue';

/** 解析后的节点 */
export interface ParsedNode {
  id: string;
  type: NodeType;
  name: string;
  description: string;
  disabled: boolean;
  config: Record<string, unknown>;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  timeout?: number;
  retry: RetryConfig | null;
  condition: string | null;
  onError: OnErrorStrategy;
  meta: Record<string, unknown>;
}

/** 边定义 */
export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  condition?: string | null;
  type?: string;
}

/** 流程设置 */
export interface FlowSettings {
  timeout?: number;
  concurrency: number;
  retryOnFailure: boolean;
  continueOnError: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  hooks: Record<string, unknown>;
}

/** 解析后的流程 */
export interface ParsedFlow {
  version: string;
  name: string;
  description: string;
  author: string;
  tags: string[];
  inputs: Record<string, InputParamDefinition>;
  outputs: Record<string, OutputParamDefinition>;
  variables: Record<string, VariableDefinition | unknown>;
  nodes: ParsedNode[];
  edges: FlowEdge[];
  settings: FlowSettings;
  nodeMap: Map<string, ParsedNode>;
}

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors: ParseError[];
  warnings: ParseError[];
}

/** 从文件加载 FlowSpec */
export function loadFlowSpec(filePath: string): Promise<Record<string, unknown>>;

/** 验证 FlowSpec 结构 */
export function validateFlowSpec(spec: Record<string, unknown>): ValidationResult;

/** 解析 FlowSpec */
export function parseFlowSpec(spec: Record<string, unknown>): ParsedFlow;

/** 从文件加载并解析 FlowSpec */
export function loadAndParseFlowSpec(filePath: string): Promise<ParsedFlow>;

/** 获取节点的后继节点列表 */
export function getSuccessors(flow: ParsedFlow, nodeId: string): string[];

/** 获取节点的前驱节点列表 */
export function getPredecessors(flow: ParsedFlow, nodeId: string): string[];

/** 获取流程的入口节点 */
export function getEntryNodes(flow: ParsedFlow): ParsedNode[];

/** 获取流程的出口节点 */
export function getExitNodes(flow: ParsedFlow): ParsedNode[];

// ============================================================================
// Expression Types
// ============================================================================

/** 表达式错误 */
export class ExpressionError extends Error {
  name: 'ExpressionError';
  expression: string;
  reason: string;

  constructor(message: string, expression: string, reason?: string);
  toString(): string;
}

/** 验证表达式安全性 */
export function validateExpression(expression: string): boolean;

/** 提取模板变量引用 */
export function extractVariableRefs(template: string): string[];

/** 安全获取嵌套属性 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown;

/** 替换模板变量 */
export function interpolate(template: string, context: Record<string, unknown>): string;

/** 递归替换对象中的模板变量 */
export function interpolateDeep<T>(obj: T, context: Record<string, unknown>): T;

/** 求值表达式 */
export function evaluate(expression: string, context?: Record<string, unknown>): unknown;

/** 求值条件表达式 */
export function evaluateCondition(condition: string, context?: Record<string, unknown>): boolean;

/** 解析输出映射表达式 */
export function resolveOutputMapping(expr: string, nodeOutput: unknown): unknown;

/** 检查字符串是否包含模板变量 */
export function hasTemplateVars(str: string): boolean;

/** 获取表达式中引用的所有变量路径 */
export function getReferencedVariables(expression: string): string[];

// ============================================================================
// Context Types
// ============================================================================

/** 节点状态 */
export type NodeStatusType =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'SKIPPED'
  | 'CANCELLED'
  | 'TIMEOUT';

/** 节点运行状态 */
export interface NodeRunState {
  id: string;
  status: NodeStatusType;
  started_at: string | null;
  finished_at: string | null;
  duration: number | null;
  output: unknown;
  error: string | null;
  attempt: number;
}

/** 上下文快照 */
export interface ContextSnapshot {
  inputs: Record<string, unknown>;
  variables: Record<string, unknown>;
  nodes: Record<string, NodeRunState>;
  env: Record<string, string>;
  run: {
    id: string;
    flowName: string;
    startedAt: string;
  };
}

/** 执行上下文配置 */
export interface ExecutionContextOptions {
  inputs?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  env?: Record<string, string>;
  runId?: string;
  flowName?: string;
}

/** 执行上下文类 */
export class ExecutionContext {
  constructor(options?: ExecutionContextOptions);

  readonly inputs: Record<string, unknown>;
  readonly variables: Record<string, unknown>;
  readonly env: Record<string, string>;
  readonly nodes: Record<string, NodeRunState>;
  readonly runId: string;
  readonly flowName: string;
  readonly startedAt: string;

  setVariable(name: string, value: unknown): void;
  setVariables(vars: Record<string, unknown>): void;
  getVariable(name: string): unknown;
  deleteVariable(name: string): void;
  setNodeOutput(nodeId: string, output: unknown): void;

  initNodeState(nodeId: string): void;
  markNodeStarted(nodeId: string, attempt?: number): void;
  markNodeSuccess(nodeId: string, output?: unknown): void;
  markNodeFailed(nodeId: string, error: string, output?: unknown): void;
  markNodeSkipped(nodeId: string, reason?: string): void;
  markNodeCancelled(nodeId: string): void;
  markNodeTimeout(nodeId: string): void;

  getNodeState(nodeId: string): NodeRunState | null;
  getNodeOutput(nodeId: string): unknown;
  isNodeFinished(nodeId: string): boolean;
  isNodeSuccess(nodeId: string): boolean;

  getSnapshot(): ContextSnapshot;
  interpolate(template: string): string;
  interpolateDeep<T>(obj: T): T;
  evaluate(expression: string): unknown;
  evaluateCondition(condition: string): boolean;

  createChildContext(overrides?: Record<string, unknown>): ExecutionContext;
  mergeChildContext(childContext: ExecutionContext, variablesToMerge?: string[] | null): void;

  serialize(): Record<string, unknown>;
  static deserialize(data: Record<string, unknown>): ExecutionContext;
}

/** 创建执行上下文 */
export function createContext(options?: ExecutionContextOptions): ExecutionContext;

/** 从流程定义创建执行上下文 */
export function createContextFromFlow(
  flow: ParsedFlow,
  inputValues?: Record<string, unknown>,
  options?: { env?: Record<string, string>; runId?: string }
): ExecutionContext;

// ============================================================================
// Executor Base Types
// ============================================================================

/** 节点执行结果 */
export interface NodeResult {
  ok: boolean;
  output: unknown;
  error?: string | null;
  duration: number;
  meta?: Record<string, unknown>;
  skipped?: boolean;
  reason?: string;
  next?: string[];
}

/** 执行选项 */
export interface ExecuteOptions {
  signal?: AbortSignal;
  timeout?: number;
  retry?: RetryConfig;
  onLog?: (log: LogEntry) => void;
  onStdout?: (text: string) => void;
  onStderr?: (text: string) => void;
}

/** 日志条目 */
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/** 节点执行器基类 */
export class NodeExecutor extends EventEmitter {
  constructor(nodeType: string);

  readonly nodeType: string;
  readonly type: string;
  readonly isRunning: boolean;

  onStart(node: ParsedNode, context: ExecutionContext, options: ExecuteOptions): Promise<void>;
  onComplete(node: ParsedNode, context: ExecutionContext, result: NodeResult): Promise<void>;
  execute(
    config: Record<string, unknown>,
    context: ExecutionContext,
    options: ExecuteOptions
  ): Promise<NodeResult>;

  log(level: string, message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;

  shouldAbort(signal?: AbortSignal): boolean;
  throwIfAborted(signal?: AbortSignal): void;
  cancel(): void;

  run(node: ParsedNode, context: ExecutionContext, options?: ExecuteOptions): Promise<NodeResult>;
}

/** 执行器注册表 */
export class ExecutorRegistry {
  register(nodeType: string, ExecutorClass: typeof NodeExecutor): void;
  get(nodeType: string): NodeExecutor | null;
  has(nodeType: string): boolean;
  getRegisteredTypes(): string[];
  unregister(nodeType: string): void;
}

/** 全局执行器注册表 */
export const globalRegistry: ExecutorRegistry;

/** 创建简单的函数执行器 */
export function createExecutor(
  nodeType: string,
  executeFn: (
    config: Record<string, unknown>,
    context: ExecutionContext,
    options: ExecuteOptions,
    executor: NodeExecutor
  ) => Promise<NodeResult>
): typeof NodeExecutor;

/** 创建成功结果 */
export function successResult(output: unknown, meta?: Record<string, unknown>): NodeResult;

/** 创建失败结果 */
export function failureResult(
  error: string,
  output?: unknown,
  meta?: Record<string, unknown>
): NodeResult;

// ============================================================================
// Executors Types
// ============================================================================

/** 注册所有内置执行器 */
export function registerBuiltinExecutors(): void;

/** 获取执行器实例 */
export function getExecutor(nodeType: string): NodeExecutor | null;

/** 检查节点类型是否已注册 */
export function hasExecutor(nodeType: string): boolean;

/** 获取所有已注册的节点类型 */
export function getRegisteredTypes(): string[];

/** Shell 执行器 */
export class ShellExecutor extends NodeExecutor {}

/** Transform 执行器 */
export class TransformExecutor extends NodeExecutor {}

/** File 执行器 */
export class FileExecutor extends NodeExecutor {}

/** HTTP 执行器 */
export class HttpExecutor extends NodeExecutor {}

/** Notify 执行器 */
export class NotifyExecutor extends NodeExecutor {}

/** Condition 执行器 */
export class ConditionExecutor extends NodeExecutor {}

/** Parallel 执行器 */
export class ParallelExecutor extends NodeExecutor {}

/** Loop 执行器 */
export class LoopExecutor extends NodeExecutor {}

/** Subflow 执行器 */
export class SubflowExecutor extends NodeExecutor {}

/** 创建 Shell 执行器 */
export function createShellExecutor(): ShellExecutor;

/** 创建 Transform 执行器 */
export function createTransformExecutor(): TransformExecutor;

/** 创建 File 执行器 */
export function createFileExecutor(): FileExecutor;

/** 创建 HTTP 执行器 */
export function createHttpExecutor(): HttpExecutor;

/** 创建 Notify 执行器 */
export function createNotifyExecutor(): NotifyExecutor;

/** 创建 Condition 执行器 */
export function createConditionExecutor(): ConditionExecutor;

/** 创建 Parallel 执行器 */
export function createParallelExecutor(): ParallelExecutor;

/** 创建 Loop 执行器 */
export function createLoopExecutor(): LoopExecutor;

/** 创建 Subflow 执行器 */
export function createSubflowExecutor(): SubflowExecutor;

// ============================================================================
// Flow Runner Types
// ============================================================================

/** 运行状态 */
export const RunStatus: {
  readonly PENDING: 'PENDING';
  readonly RUNNING: 'RUNNING';
  readonly SUCCESS: 'SUCCESS';
  readonly FAILED: 'FAILED';
  readonly CANCELLED: 'CANCELLED';
  readonly TIMEOUT: 'TIMEOUT';
};

export type RunStatusType = (typeof RunStatus)[keyof typeof RunStatus];

/** 节点状态 */
export const NodeStatus: {
  readonly PENDING: 'PENDING';
  readonly RUNNING: 'RUNNING';
  readonly SUCCESS: 'SUCCESS';
  readonly FAILED: 'FAILED';
  readonly SKIPPED: 'SKIPPED';
  readonly CANCELLED: 'CANCELLED';
  readonly TIMEOUT: 'TIMEOUT';
};

/** 事件类型 */
export const EventType: {
  readonly RUN_STARTED: 'RUN_STARTED';
  readonly RUN_FINISHED: 'RUN_FINISHED';
  readonly RUN_CANCELLED: 'RUN_CANCELLED';
  readonly NODE_STARTED: 'NODE_STARTED';
  readonly NODE_FINISHED: 'NODE_FINISHED';
  readonly NODE_LOG: 'NODE_LOG';
  readonly NODE_RETRY: 'NODE_RETRY';
  readonly NODE_TIMEOUT: 'NODE_TIMEOUT';
};

export type EventTypeValue = (typeof EventType)[keyof typeof EventType];

/** 事件格式（IEventV1） */
export interface FlowEvent {
  seq: number;
  type: EventTypeValue | string;
  ts: string;
  run_id: string;
  node_id: string;
  payload: Record<string, unknown>;
}

/** 工件写入器 */
export type ArtifactWriter = (
  filename: string,
  content: unknown,
  options?: { append?: boolean; raw?: boolean }
) => Promise<void>;

/** Flow Runner 配置 */
export interface FlowRunnerConfig {
  runId?: string;
  runDir?: string | null;
  defaultTimeout?: number;
  emitEvents?: boolean;
  artifactWriter?: ArtifactWriter | null;
  queueManager?: TaskQueueManager | null;
  baseUrl?: string;
}

/** 运行结果 */
export interface RunResult {
  runId: string;
  flowId: string | undefined;
  status: RunStatusType;
  success: boolean;
  startTime: number;
  endTime: number;
  duration: number;
  error: string | null;
  output: Record<string, unknown>;
  nodes: Record<string, NodeResult>;
  events: FlowEvent[];
}

/** 图节点 */
export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  status: NodeStatusType;
}

/** 图边 */
export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

/** 图结构 */
export interface FlowGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Flow Runner 类 */
export class FlowRunner extends EventEmitter {
  constructor(config?: FlowRunnerConfig);

  readonly runId: string;
  readonly runDir: string | null;
  readonly status: RunStatusType;
  readonly flowSpec: ParsedFlow | null;
  readonly context: ExecutionContext | null;
  readonly startTime: number | null;
  readonly endTime: number | null;
  readonly error: string | null;
  readonly events: FlowEvent[];
  readonly nodeResults: Map<string, NodeResult>;
  readonly subtasks: SubtaskInfo[];

  run(flowSpecOrPath: ParsedFlow | string, inputs?: Record<string, unknown>): Promise<RunResult>;
  cancel(): void;
}

/** 创建 FlowRunner 实例 */
export function createFlowRunner(config?: FlowRunnerConfig): FlowRunner;

/** 执行流程便捷函数 */
export function runFlow(
  flowSpec: ParsedFlow | string,
  inputs?: Record<string, unknown>,
  config?: FlowRunnerConfig
): Promise<RunResult>;

// ============================================================================
// Task Queue Types
// ============================================================================

/** 任务状态 */
export const TaskStatus: {
  readonly QUEUED: 'queued';
  readonly RUNNING: 'running';
  readonly PAUSED: 'paused';
  readonly COMPLETED: 'completed';
  readonly FAILED: 'failed';
  readonly CANCELLED: 'cancelled';
};

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

/** 队列事件类型 */
export const QueueEventType: {
  readonly TASK_ADDED: 'QUEUE_TASK_ADDED';
  readonly TASK_STARTED: 'QUEUE_TASK_STARTED';
  readonly TASK_COMPLETED: 'QUEUE_TASK_COMPLETED';
  readonly TASK_FAILED: 'QUEUE_TASK_FAILED';
  readonly TASK_CANCELLED: 'QUEUE_TASK_CANCELLED';
  readonly QUEUE_PAUSED: 'QUEUE_PAUSED';
  readonly QUEUE_RESUMED: 'QUEUE_RESUMED';
  readonly SUBTASK_DISPATCHED: 'SUBTASK_DISPATCHED';
};

export type QueueEventTypeValue = (typeof QueueEventType)[keyof typeof QueueEventType];

/** 任务领域 */
export const TaskDomain: {
  readonly DESIGN: 'design';
  readonly ART: 'art';
  readonly CODE: 'code';
  readonly WHITEBOX: 'whitebox';
  readonly READONLY: 'readonly';
};

export type TaskDomainType = (typeof TaskDomain)[keyof typeof TaskDomain];

/** 访问模式 */
export const AccessMode: {
  readonly READ: 'read';
  readonly WRITE: 'write';
};

export type AccessModeType = (typeof AccessMode)[keyof typeof AccessMode];

/** 队列任务 */
export interface QueuedTask {
  id: string;
  flowspec: string;
  inputs: Record<string, unknown>;
  priority: number;
  parent_id: string | null;
  status: TaskStatusType;
  domain: TaskDomainType;
  access_mode: AccessModeType;
  lock_key: string | null;
  queued_at: string;
  started_at?: string;
  finished_at?: string;
  error?: string;
  result?: RunResult;
}

/** 子任务信息 */
export interface SubtaskInfo {
  id: string;
  flowspec: string;
  inputs: Record<string, unknown>;
  priority: number;
  parent_id: string;
  status: string;
  queued_at: string;
}

/** 队列状态 */
export interface QueueState {
  paused: boolean;
  tasks: QueuedTask[];
  history: QueuedTask[];
}

/** 调度器状态 */
export interface SchedulerStatus {
  running_by_domain: Record<
    string,
    {
      count: number;
      max: number;
      tasks: string[];
    }
  >;
  running_lock_keys: string[];
  total_running: number;
}

/** 队列状态响应 */
export interface QueueStatus {
  paused: boolean;
  running_tasks: QueuedTask[];
  running_count: number;
  queue: QueuedTask[];
  scheduler: SchedulerStatus;
  history_count: number;
}

/** 任务执行器函数 */
export type TaskExecutor = (
  task: QueuedTask,
  options: { signal: AbortSignal; queueManager: TaskQueueManager }
) => Promise<RunResult>;

/** 任务队列管理器配置 */
export interface TaskQueueManagerOptions {
  projectRoot?: string;
  executor: TaskExecutor;
  queueFile?: string;
  maxHistory?: number;
  maxQueueSize?: number;
  concurrency?: {
    design?: number;
    art?: number;
    code?: number;
    whitebox?: number;
    readonly?: number;
  };
}

/** 任务入队配置 */
export interface EnqueueConfig {
  flowspec: string;
  inputs?: Record<string, unknown>;
  priority?: number;
  parent_id?: string;
  id?: string;
  domain?: TaskDomainType;
  access_mode?: AccessModeType;
  lock_key?: string;
}

/** 任务队列管理器 */
export class TaskQueueManager extends EventEmitter {
  constructor(options: TaskQueueManagerOptions);

  readonly projectRoot: string;
  readonly executor: TaskExecutor;
  readonly state: QueueState;
  readonly scheduler: ParallelScheduler;

  init(): Promise<void>;
  enqueue(taskConfig: EnqueueConfig): Promise<QueuedTask>;
  getStatus(): QueueStatus;
  getHistory(limit?: number, offset?: number): QueuedTask[];
  getTask(taskId: string): QueuedTask | null;
  getSubtasks(parentId: string): QueuedTask[];
  pause(): Promise<void>;
  resume(): Promise<void>;
  cancel(taskId: string): Promise<boolean>;
  retry(taskId: string): Promise<QueuedTask | null>;
  setPriority(taskId: string, priority: number): Promise<boolean>;
  clear(): Promise<number>;
  shutdown(): Promise<void>;
}

/** 创建队列管理器实例 */
export function createTaskQueue(options: TaskQueueManagerOptions): TaskQueueManager;

// ============================================================================
// Parallel Scheduler Types
// ============================================================================

/** 角色到领域的映射 */
export const ROLE_DOMAIN_MAP: Record<string, TaskDomainType>;

/** 从 flowspec 路径推断角色 */
export function inferRoleFromFlowspec(flowspec: string): string | null;

/** 从角色推断领域 */
export function inferDomainFromRole(role: string): TaskDomainType;

/** 从 flowspec 推断领域 */
export function inferDomainFromFlowspec(flowspec: string): TaskDomainType;

/** 从角色推断访问模式 */
export function inferAccessModeFromRole(role: string): AccessModeType;

/** 并行调度器配置 */
export interface ParallelSchedulerOptions {
  design?: number;
  art?: number;
  code?: number;
  whitebox?: number;
  readonly?: number;
}

/** 并行调度器 */
export class ParallelScheduler {
  constructor(options?: ParallelSchedulerOptions);

  maxConcurrentByDomain: Record<TaskDomainType, number>;
  runningByDomain: Map<TaskDomainType, Set<string>>;
  runningLockKeys: Set<string>;

  canStart(task: { id: string; domain?: TaskDomainType; access_mode?: AccessModeType; lock_key?: string }): boolean;
  markRunning(task: { id: string; domain?: TaskDomainType; access_mode?: AccessModeType; lock_key?: string }): void;
  markFinished(task: { id: string; domain?: TaskDomainType; access_mode?: AccessModeType; lock_key?: string }): void;
  getRunningCount(domain: TaskDomainType): number;
  getAllRunningIds(): string[];
  getStatus(): SchedulerStatus;
  reset(): void;
}

/** 创建调度器实例 */
export function createScheduler(options?: ParallelSchedulerOptions): ParallelScheduler;

// ============================================================================
// Module Exports
// ============================================================================

/** v2 版本号 */
export const VERSION: '2.0.0';

/** 快速创建流程运行环境 */
export function prepare(
  flowPath: string,
  inputs?: Record<string, unknown>,
  options?: { env?: Record<string, string>; runId?: string }
): Promise<{ flow: ParsedFlow; context: ExecutionContext }>;

/** 默认导出 */
declare const v2: {
  VERSION: typeof VERSION;
  prepare: typeof prepare;
};

export default v2;
