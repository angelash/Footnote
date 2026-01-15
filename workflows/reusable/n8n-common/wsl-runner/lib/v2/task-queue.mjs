/**
 * Task Queue Manager
 * 
 * 任务队列管理器，实现：
 * - 任务入队/出队
 * - 基于领域的并行执行
 * - 队列暂停/恢复
 * - 任务取消/重试
 * - 优先级调度
 * - 状态持久化
 * 
 * @module lib/v2/task-queue
 */

import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { 
  ParallelScheduler, 
  TaskDomain, 
  AccessMode, 
  inferDomainFromFlowspec,
  inferRoleFromFlowspec,
  inferAccessModeFromRole,
} from './parallel-scheduler.mjs';

/**
 * 任务状态
 */
export const TaskStatus = {
  QUEUED: 'queued',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

/**
 * 队列事件类型
 */
export const QueueEventType = {
  TASK_ADDED: 'QUEUE_TASK_ADDED',
  TASK_STARTED: 'QUEUE_TASK_STARTED',
  TASK_COMPLETED: 'QUEUE_TASK_COMPLETED',
  TASK_FAILED: 'QUEUE_TASK_FAILED',
  TASK_CANCELLED: 'QUEUE_TASK_CANCELLED',
  QUEUE_PAUSED: 'QUEUE_PAUSED',
  QUEUE_RESUMED: 'QUEUE_RESUMED',
  SUBTASK_DISPATCHED: 'SUBTASK_DISPATCHED',
};

// 重新导出领域和访问模式
export { TaskDomain, AccessMode };

/**
 * 生成任务 ID
 */
function generateTaskId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `run-${timestamp}-${random}`;
}

/**
 * 队列任务
 * @typedef {Object} QueuedTask
 * @property {string} id - 任务 ID
 * @property {string} flowspec - FlowSpec 路径
 * @property {Object} inputs - 输入参数
 * @property {number} priority - 优先级（越大越优先）
 * @property {string} [parent_id] - 父任务 ID
 * @property {string} status - 任务状态
 * @property {string} domain - 任务领域
 * @property {string} access_mode - 访问模式
 * @property {string} [lock_key] - 锁键（用于同领域串行）
 * @property {string} queued_at - 入队时间
 * @property {string} [started_at] - 开始时间
 * @property {string} [finished_at] - 结束时间
 * @property {string} [error] - 错误信息
 * @property {Object} [result] - 执行结果
 */

/**
 * 队列状态
 * @typedef {Object} QueueState
 * @property {boolean} paused - 队列是否暂停
 * @property {QueuedTask[]} tasks - 任务列表
 * @property {QueuedTask[]} history - 历史记录
 */

/**
 * 任务队列管理器
 */
export class TaskQueueManager extends EventEmitter {
  /**
   * @param {Object} options - 配置选项
   * @param {string} options.projectRoot - 项目根目录
   * @param {Function} options.executor - 任务执行器 (task) => Promise<result>
   * @param {string} [options.queueFile] - 队列文件路径
   * @param {number} [options.maxHistory] - 最大历史记录数
   * @param {number} [options.maxQueueSize] - 最大队列长度
   * @param {Object} [options.concurrency] - 并发配置
   */
  constructor(options = {}) {
    super();
    
    this.projectRoot = options.projectRoot || process.cwd();
    this.executor = options.executor;
    this.queueFile = options.queueFile || 
      path.join(this.projectRoot, 'workflows/project/logs/queue.json');
    this.maxHistory = options.maxHistory || 100;
    this.maxQueueSize = options.maxQueueSize || 1000;
    
    /** @type {QueueState} */
    this.state = {
      paused: false,
      tasks: [],
      history: [],
    };
    
    // 并行调度器
    this.scheduler = new ParallelScheduler(options.concurrency || {});
    
    // 运行中的任务
    /** @type {Map<string, { task: QueuedTask, promise: Promise, abortController: AbortController }>} */
    this.runningTasks = new Map();
    
    /** @type {boolean} */
    this.processing = false;
    
    // 锁文件路径
    this.lockFile = this.queueFile + '.lock';
  }

  /**
   * 初始化队列（从文件恢复状态）
   */
  async init() {
    try {
      const content = await fs.readFile(this.queueFile, 'utf8');
      const savedState = JSON.parse(content);
      
      // 恢复队列状态
      this.state.paused = savedState.paused || false;
      this.state.tasks = savedState.tasks || [];
      this.state.history = savedState.history || [];
      
      // 将中断的 running 任务标记为 failed（服务重启时无法确定执行状态）
      const interruptedTasks = [];
      this.state.tasks = this.state.tasks.filter(task => {
        if (task.status === TaskStatus.RUNNING) {
          // 标记为失败并移到历史
          task.status = TaskStatus.FAILED;
          task.error = 'Task interrupted by service restart';
          task.finished_at = new Date().toISOString();
          interruptedTasks.push(task);
          return false; // 从队列中移除
        }
        return true;
      });
      
      // 将中断的任务加入历史
      interruptedTasks.forEach(task => {
        this._addToHistory(task);
      });
      
      // 同时更新 automation_runs 中的 status.json（避免僵尸状态）
      await this._cleanupInterruptedRunStatus(interruptedTasks);
      
      if (interruptedTasks.length > 0) {
        console.log(`[TaskQueue] Marked ${interruptedTasks.length} interrupted tasks as failed`);
        await this._persist();
      }
      
      console.log(`[TaskQueue] Restored ${this.state.tasks.length} queued tasks`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn(`[TaskQueue] Failed to load queue state: ${err.message}`);
      }
      // 文件不存在或解析失败，使用默认状态
    }
    
    // 扫描并清理 automation_runs 中的所有僵尸状态
    await this._cleanupAllZombieRuns();
    
    // 启动处理循环
    this._startProcessing();
  }
  
  /**
   * 扫描并清理所有僵尸状态的运行记录
   * （服务重启后，automation_runs 中可能有 RUNNING 状态但实际已中断的任务）
   */
  async _cleanupAllZombieRuns() {
    const runsDir = path.join(this.projectRoot, 'workflows/project/logs/automation_runs');
    
    try {
      const entries = await fs.readdir(runsDir).catch(() => []);
      let cleaned = 0;
      
      for (const entry of entries) {
        if (entry.startsWith('_') || entry.startsWith('.')) continue; // 跳过隐藏目录
        
        const statusPath = path.join(runsDir, entry, 'status.json');
        try {
          const content = await fs.readFile(statusPath, 'utf8');
          const status = JSON.parse(content);
          
          // 如果状态是 RUNNING，但不在当前运行中的任务列表里，则是僵尸
          if (status.status === 'RUNNING' && !this.runningTasks.has(entry)) {
            status.status = 'FAILED';
            status.error = 'Task interrupted by service restart (zombie cleanup)';
            status.finished_at = new Date().toISOString();
            await fs.writeFile(statusPath, JSON.stringify(status, null, 2));
            cleaned++;
          }
        } catch {
          // 忽略无效的运行记录
        }
      }
      
      if (cleaned > 0) {
        console.log(`[TaskQueue] Cleaned up ${cleaned} zombie run status files`);
      }
    } catch (err) {
      console.warn(`[TaskQueue] Failed to cleanup zombie runs: ${err.message}`);
    }
  }
  
  /**
   * 清理中断任务的 status.json（防止僵尸状态）
   * @param {QueuedTask[]} tasks - 中断的任务列表
   */
  async _cleanupInterruptedRunStatus(tasks) {
    for (const task of tasks) {
      try {
        const statusPath = path.join(this.projectRoot, 'workflows/project/logs/automation_runs', task.id, 'status.json');
        const statusContent = await fs.readFile(statusPath, 'utf8').catch(() => null);
        
        if (statusContent) {
          const status = JSON.parse(statusContent);
          // 如果 status.json 还显示 RUNNING，更新为 FAILED
          if (status.status === 'RUNNING') {
            status.status = 'FAILED';
            status.error = 'Task interrupted by service restart';
            status.finished_at = new Date().toISOString();
            await fs.writeFile(statusPath, JSON.stringify(status, null, 2));
            console.log(`[TaskQueue] Updated status.json for interrupted task: ${task.id}`);
          }
        }
      } catch (err) {
        console.warn(`[TaskQueue] Failed to cleanup status for ${task.id}: ${err.message}`);
      }
    }
  }

  /**
   * 入队任务
   * @param {Object} taskConfig - 任务配置
   * @param {string} taskConfig.flowspec - FlowSpec 路径
   * @param {Object} [taskConfig.inputs] - 输入参数
   * @param {number} [taskConfig.priority] - 优先级
   * @param {string} [taskConfig.parent_id] - 父任务 ID
   * @param {string} [taskConfig.id] - 自定义任务 ID
   * @param {string} [taskConfig.domain] - 任务领域
   * @param {string} [taskConfig.access_mode] - 访问模式
   * @param {string} [taskConfig.lock_key] - 锁键
   * @returns {Promise<QueuedTask>} 入队的任务
   */
  async enqueue(taskConfig) {
    if (this.state.tasks.length >= this.maxQueueSize) {
      throw new Error(`Queue is full (max ${this.maxQueueSize} tasks)`);
    }
    
    // 推断领域和访问模式
    const role = inferRoleFromFlowspec(taskConfig.flowspec);
    const inferredDomain = inferDomainFromFlowspec(taskConfig.flowspec);
    const inferredAccessMode = role ? inferAccessModeFromRole(role) : AccessMode.WRITE;
    
    const task = {
      id: taskConfig.id || generateTaskId(),
      flowspec: taskConfig.flowspec,
      inputs: taskConfig.inputs || {},
      priority: taskConfig.priority ?? 10,
      parent_id: taskConfig.parent_id || null,
      status: TaskStatus.QUEUED,
      domain: taskConfig.domain || inferredDomain,
      access_mode: taskConfig.access_mode || inferredAccessMode,
      lock_key: taskConfig.lock_key || null,
      queued_at: new Date().toISOString(),
    };
    
    // 按优先级插入（高优先级在前）
    const insertIndex = this.state.tasks.findIndex(t => t.priority < task.priority);
    if (insertIndex === -1) {
      this.state.tasks.push(task);
    } else {
      this.state.tasks.splice(insertIndex, 0, task);
    }
    
    // 持久化
    await this._persist();
    
    // 发出事件
    this._emitEvent(QueueEventType.TASK_ADDED, { task });
    
    console.log(`[TaskQueue] Task ${task.id} queued (domain: ${task.domain}, priority: ${task.priority})`);
    
    // 触发处理
    this._processNext();
    
    return task;
  }

  /**
   * 获取队列状态
   * @returns {Object} 队列状态
   */
  getStatus() {
    // 获取运行中的任务列表
    const runningTasks = [];
    for (const [id, info] of this.runningTasks) {
      runningTasks.push({
        id: info.task.id,
        flowspec: info.task.flowspec,
        inputs: info.task.inputs,
        priority: info.task.priority,
        parent_id: info.task.parent_id,
        status: info.task.status,
        domain: info.task.domain,
        access_mode: info.task.access_mode,
        lock_key: info.task.lock_key,
        queued_at: info.task.queued_at,
        started_at: info.task.started_at,
      });
    }
    
    return {
      paused: this.state.paused,
      running_tasks: runningTasks,
      running_count: runningTasks.length,
      queue: this.state.tasks.filter(t => t.status === TaskStatus.QUEUED).map(t => ({
        id: t.id,
        flowspec: t.flowspec,
        inputs: t.inputs,
        priority: t.priority,
        parent_id: t.parent_id,
        status: t.status,
        domain: t.domain,
        access_mode: t.access_mode,
        lock_key: t.lock_key,
        queued_at: t.queued_at,
      })),
      scheduler: this.scheduler.getStatus(),
      history_count: this.state.history.length,
    };
  }

  /**
   * 获取历史记录
   * @param {number} [limit] - 返回数量限制
   * @param {number} [offset] - 偏移量
   * @returns {QueuedTask[]} 历史记录
   */
  getHistory(limit = 20, offset = 0) {
    return this.state.history.slice(offset, offset + limit);
  }

  /**
   * 获取任务详情
   * @param {string} taskId - 任务 ID
   * @returns {QueuedTask|null} 任务详情
   */
  getTask(taskId) {
    // 先在运行中查找
    const runningInfo = this.runningTasks.get(taskId);
    if (runningInfo) return runningInfo.task;
    
    // 再在队列中查找
    let task = this.state.tasks.find(t => t.id === taskId);
    if (task) return task;
    
    // 最后在历史中查找
    task = this.state.history.find(t => t.id === taskId);
    return task || null;
  }

  /**
   * 获取子任务列表
   * @param {string} parentId - 父任务 ID
   * @returns {QueuedTask[]} 子任务列表
   */
  getSubtasks(parentId) {
    const subtasks = [];
    
    // 从运行中查找
    for (const [id, info] of this.runningTasks) {
      if (info.task.parent_id === parentId) {
        subtasks.push(info.task);
      }
    }
    
    // 从队列中查找
    subtasks.push(...this.state.tasks.filter(t => t.parent_id === parentId));
    
    // 从历史中查找
    subtasks.push(...this.state.history.filter(t => t.parent_id === parentId));
    
    return subtasks.sort((a, b) => 
      new Date(a.queued_at).getTime() - new Date(b.queued_at).getTime()
    );
  }

  /**
   * 暂停队列
   * @returns {Promise<void>}
   */
  async pause() {
    if (this.state.paused) return;
    
    this.state.paused = true;
    await this._persist();
    
    this._emitEvent(QueueEventType.QUEUE_PAUSED, {});
    console.log('[TaskQueue] Queue paused');
  }

  /**
   * 恢复队列
   * @returns {Promise<void>}
   */
  async resume() {
    if (!this.state.paused) return;
    
    this.state.paused = false;
    await this._persist();
    
    this._emitEvent(QueueEventType.QUEUE_RESUMED, {});
    console.log('[TaskQueue] Queue resumed');
    
    // 触发处理
    this._processNext();
  }

  /**
   * 取消任务
   * @param {string} taskId - 任务 ID
   * @returns {Promise<boolean>} 是否成功取消
   */
  async cancel(taskId) {
    // 如果是运行中的任务，发送取消信号
    const runningInfo = this.runningTasks.get(taskId);
    if (runningInfo) {
      runningInfo.abortController.abort();
      // 等待任务结束（会被标记为 cancelled）
      return true;
    }
    
    // 如果在队列中，直接移除
    const index = this.state.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      const task = this.state.tasks.splice(index, 1)[0];
      task.status = TaskStatus.CANCELLED;
      task.finished_at = new Date().toISOString();
      
      // 移入历史
      this._addToHistory(task);
      
      await this._persist();
      
      this._emitEvent(QueueEventType.TASK_CANCELLED, { task_id: taskId });
      console.log(`[TaskQueue] Task ${taskId} cancelled`);
      
      return true;
    }
    
    return false;
  }

  /**
   * 重试任务
   * @param {string} taskId - 任务 ID
   * @returns {Promise<QueuedTask|null>} 新入队的任务
   */
  async retry(taskId) {
    // 从历史中查找失败的任务
    const historyIndex = this.state.history.findIndex(
      t => t.id === taskId && (t.status === TaskStatus.FAILED || t.status === TaskStatus.CANCELLED)
    );
    
    if (historyIndex === -1) {
      return null;
    }
    
    const originalTask = this.state.history[historyIndex];
    
    // 创建新任务（复用配置）
    const newTask = await this.enqueue({
      flowspec: originalTask.flowspec,
      inputs: originalTask.inputs,
      priority: originalTask.priority,
      parent_id: originalTask.parent_id,
      domain: originalTask.domain,
      access_mode: originalTask.access_mode,
      lock_key: originalTask.lock_key,
    });
    
    console.log(`[TaskQueue] Task ${taskId} retry as ${newTask.id}`);
    
    return newTask;
  }

  /**
   * 调整优先级
   * @param {string} taskId - 任务 ID
   * @param {number} priority - 新优先级
   * @returns {Promise<boolean>} 是否成功
   */
  async setPriority(taskId, priority) {
    const index = this.state.tasks.findIndex(t => t.id === taskId && t.status === TaskStatus.QUEUED);
    if (index === -1) return false;
    
    const task = this.state.tasks.splice(index, 1)[0];
    task.priority = priority;
    
    // 重新按优先级插入
    const insertIndex = this.state.tasks.findIndex(t => t.priority < priority);
    if (insertIndex === -1) {
      this.state.tasks.push(task);
    } else {
      this.state.tasks.splice(insertIndex, 0, task);
    }
    
    await this._persist();
    
    console.log(`[TaskQueue] Task ${taskId} priority changed to ${priority}`);
    
    return true;
  }

  /**
   * 清空待执行队列
   * @returns {Promise<number>} 清除的任务数
   */
  async clear() {
    const count = this.state.tasks.filter(t => t.status === TaskStatus.QUEUED).length;
    
    // 只清除 queued 状态的任务
    const cleared = this.state.tasks.filter(t => t.status === TaskStatus.QUEUED);
    this.state.tasks = this.state.tasks.filter(t => t.status !== TaskStatus.QUEUED);
    
    // 标记为取消并移入历史
    cleared.forEach(task => {
      task.status = TaskStatus.CANCELLED;
      task.finished_at = new Date().toISOString();
      this._addToHistory(task);
    });
    
    await this._persist();
    
    console.log(`[TaskQueue] Cleared ${count} queued tasks`);
    
    return count;
  }

  /**
   * 启动处理循环
   */
  _startProcessing() {
    if (this.processing) return;
    
    this.processing = true;
    this._processNext();
  }

  /**
   * 处理下一批任务（支持并行）
   */
  async _processNext() {
    // 如果队列暂停，跳过
    if (this.state.paused) return;
    
    // 获取所有可以启动的任务
    const queuedTasks = this.state.tasks.filter(t => t.status === TaskStatus.QUEUED);
    
    for (const task of queuedTasks) {
      // 检查是否可以启动
      if (!this.scheduler.canStart(task)) {
        continue;
      }
      
      // 启动任务
      this._startTask(task);
    }
  }

  /**
   * 启动单个任务
   * @param {QueuedTask} task
   */
  async _startTask(task) {
    // 标记为运行中
    task.status = TaskStatus.RUNNING;
    task.started_at = new Date().toISOString();
    
    // 从队列移到运行中
    const taskIndex = this.state.tasks.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
      this.state.tasks.splice(taskIndex, 1);
    }
    
    // 标记调度器
    this.scheduler.markRunning(task);
    
    await this._persist();
    
    this._emitEvent(QueueEventType.TASK_STARTED, { task_id: task.id });
    console.log(`[TaskQueue] Task ${task.id} started (domain: ${task.domain})`);
    
    // 创建取消控制器
    const abortController = new AbortController();
    
    // 执行任务
    const promise = (async () => {
      try {
        const result = await this.executor(task, {
          signal: abortController.signal,
          queueManager: this,
        });
        
        // 检查是否被取消
        if (abortController.signal.aborted) {
          task.status = TaskStatus.CANCELLED;
        } else {
          task.status = result.ok ? TaskStatus.COMPLETED : TaskStatus.FAILED;
          task.result = result;
          if (!result.ok) {
            task.error = result.error;
          }
        }
      } catch (err) {
        task.status = err.name === 'AbortError' ? TaskStatus.CANCELLED : TaskStatus.FAILED;
        task.error = err.message;
      }
      
      // 清理
      task.finished_at = new Date().toISOString();
      this.runningTasks.delete(task.id);
      this.scheduler.markFinished(task);
      
      // 加入历史
      this._addToHistory(task);
      
      await this._persist();
      
      // 发出完成事件
      const eventType = task.status === TaskStatus.COMPLETED 
        ? QueueEventType.TASK_COMPLETED 
        : task.status === TaskStatus.CANCELLED 
          ? QueueEventType.TASK_CANCELLED 
          : QueueEventType.TASK_FAILED;
      
      this._emitEvent(eventType, { 
        task_id: task.id, 
        status: task.status,
        error: task.error,
      });
      
      console.log(`[TaskQueue] Task ${task.id} ${task.status}`);
      
      // 处理下一批
      setImmediate(() => this._processNext());
    })();
    
    // 记录运行中的任务
    this.runningTasks.set(task.id, { task, promise, abortController });
  }

  /**
   * 添加到历史记录
   */
  _addToHistory(task) {
    this.state.history.unshift(task);
    
    // 限制历史记录数量
    if (this.state.history.length > this.maxHistory) {
      this.state.history = this.state.history.slice(0, this.maxHistory);
    }
  }

  /**
   * 持久化队列状态
   */
  async _persist() {
    try {
      // 确保目录存在
      await fs.mkdir(path.dirname(this.queueFile), { recursive: true });
      
      // 写入状态（包括运行中的任务）
      const tasksToSave = [...this.state.tasks];
      for (const [id, info] of this.runningTasks) {
        tasksToSave.push(info.task);
      }
      
      const content = JSON.stringify({
        paused: this.state.paused,
        tasks: tasksToSave,
        history: this.state.history,
        updated_at: new Date().toISOString(),
      }, null, 2);
      
      await fs.writeFile(this.queueFile, content, 'utf8');
    } catch (err) {
      console.error(`[TaskQueue] Failed to persist: ${err.message}`);
    }
  }

  /**
   * 发出事件
   */
  _emitEvent(type, data) {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      ...data,
    };
    
    this.emit(type, event);
    this.emit('event', event);
  }

  /**
   * 关闭队列管理器
   */
  async shutdown() {
    this.processing = false;
    
    // 取消所有运行中的任务
    for (const [id, info] of this.runningTasks) {
      info.abortController.abort();
    }
    
    // 等待所有任务结束
    const promises = [...this.runningTasks.values()].map(info => info.promise);
    await Promise.allSettled(promises);
    
    // 最终持久化
    await this._persist();
    
    console.log('[TaskQueue] Shutdown complete');
  }
}

/**
 * 创建队列管理器实例
 * @param {Object} options - 配置选项
 * @returns {TaskQueueManager}
 */
export function createTaskQueue(options) {
  return new TaskQueueManager(options);
}

export default TaskQueueManager;
