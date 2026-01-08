/**
 * Task Queue Manager
 * 
 * 任务队列管理器，实现：
 * - 任务入队/出队
 * - 串行执行（同一时间只执行一个任务）
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
 * @property {string|null} current - 当前执行的任务 ID
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
      current: null,
      tasks: [],
      history: [],
    };
    
    /** @type {Map<string, AbortController>} */
    this.abortControllers = new Map();
    
    /** @type {boolean} */
    this.processing = false;
    
    /** @type {Promise<void>|null} */
    this.processingPromise = null;
    
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
      
      // 将中断的 running 任务改为 queued（重启后重新执行）
      this.state.tasks.forEach(task => {
        if (task.status === TaskStatus.RUNNING) {
          task.status = TaskStatus.QUEUED;
          delete task.started_at;
        }
      });
      
      this.state.current = null;
      
      console.log(`[TaskQueue] Restored ${this.state.tasks.length} queued tasks`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn(`[TaskQueue] Failed to load queue state: ${err.message}`);
      }
      // 文件不存在或解析失败，使用默认状态
    }
    
    // 启动处理循环
    this._startProcessing();
  }

  /**
   * 入队任务
   * @param {Object} taskConfig - 任务配置
   * @param {string} taskConfig.flowspec - FlowSpec 路径
   * @param {Object} [taskConfig.inputs] - 输入参数
   * @param {number} [taskConfig.priority] - 优先级
   * @param {string} [taskConfig.parent_id] - 父任务 ID
   * @param {string} [taskConfig.id] - 自定义任务 ID
   * @returns {Promise<QueuedTask>} 入队的任务
   */
  async enqueue(taskConfig) {
    if (this.state.tasks.length >= this.maxQueueSize) {
      throw new Error(`Queue is full (max ${this.maxQueueSize} tasks)`);
    }
    
    const task = {
      id: taskConfig.id || generateTaskId(),
      flowspec: taskConfig.flowspec,
      inputs: taskConfig.inputs || {},
      priority: taskConfig.priority ?? 10,
      parent_id: taskConfig.parent_id || null,
      status: TaskStatus.QUEUED,
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
    
    console.log(`[TaskQueue] Task ${task.id} queued (priority: ${task.priority})`);
    
    return task;
  }

  /**
   * 获取队列状态
   * @returns {Object} 队列状态
   */
  getStatus() {
    return {
      paused: this.state.paused,
      current: this.state.current,
      queue: this.state.tasks.map(t => ({
        id: t.id,
        flowspec: t.flowspec,
        inputs: t.inputs,
        priority: t.priority,
        parent_id: t.parent_id,
        status: t.status,
        queued_at: t.queued_at,
        started_at: t.started_at,
      })),
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
    // 先在队列中查找
    let task = this.state.tasks.find(t => t.id === taskId);
    if (task) return task;
    
    // 再在历史中查找
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
    // 如果是当前运行的任务，发送取消信号
    if (this.state.current === taskId) {
      const controller = this.abortControllers.get(taskId);
      if (controller) {
        controller.abort();
      }
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
    const index = this.state.tasks.findIndex(t => t.id === taskId);
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
   * 处理下一个任务
   */
  async _processNext() {
    // 如果队列暂停或已在处理，跳过
    if (this.state.paused || this.state.current) return;
    
    // 获取下一个 queued 任务
    const task = this.state.tasks.find(t => t.status === TaskStatus.QUEUED);
    if (!task) return;
    
    // 标记为运行中
    task.status = TaskStatus.RUNNING;
    task.started_at = new Date().toISOString();
    this.state.current = task.id;
    
    await this._persist();
    
    this._emitEvent(QueueEventType.TASK_STARTED, { task_id: task.id });
    console.log(`[TaskQueue] Task ${task.id} started`);
    
    // 创建取消控制器
    const abortController = new AbortController();
    this.abortControllers.set(task.id, abortController);
    
    try {
      // 执行任务
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
    this.abortControllers.delete(task.id);
    this.state.current = null;
    
    // 从队列移除，加入历史
    const taskIndex = this.state.tasks.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
      this.state.tasks.splice(taskIndex, 1);
    }
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
    
    // 处理下一个
    setImmediate(() => this._processNext());
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
      
      // 写入状态
      const content = JSON.stringify({
        paused: this.state.paused,
        tasks: this.state.tasks,
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
    
    // 取消当前任务
    if (this.state.current) {
      await this.cancel(this.state.current);
    }
    
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
