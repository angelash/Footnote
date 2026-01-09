/**
 * Queue Panel Component
 * 任务队列面板 - 显示队列状态、任务列表、干涉操作
 */

import { useState, useEffect, useCallback } from 'react';
import {
  QueuedTask,
  getQueueStatus,
  getQueueHistory,
  pauseQueue,
  resumeQueue,
  clearQueue,
  cancelTask,
  retryTask,
  setTaskPriority,
  getSubtasks,
} from '../../api/queueApi';
import { StatusBadge } from '../Common/StatusBadge';
import { NodeStatus } from '../../types/dto';
import './QueuePanel.css';

interface QueuePanelProps {
  onTaskClick?: (taskId: string) => void;
}

export function QueuePanel({ onTaskClick }: QueuePanelProps) {
  const [paused, setPaused] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueuedTask[]>([]);
  const [history, setHistory] = useState<QueuedTask[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<Record<string, QueuedTask[]>>({});

  // 加载队列状态
  const loadStatus = useCallback(async () => {
    try {
      const status = await getQueueStatus();
      setPaused(status.paused);
      setCurrent(status.current);
      setQueue(status.queue);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // 加载历史记录
  const loadHistory = useCallback(async () => {
    try {
      const historyData = await getQueueHistory(20, 0);
      setHistory(historyData.history);
      setHistoryTotal(historyData.total);
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }, []);

  // 初始加载和定时刷新
  useEffect(() => {
    setLoading(true);
    Promise.all([loadStatus(), loadHistory()]).finally(() => setLoading(false));

    // 每 3 秒刷新
    const interval = setInterval(() => {
      loadStatus();
      loadHistory();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadStatus, loadHistory]);

  // 暂停/恢复
  const handleTogglePause = async () => {
    try {
      if (paused) {
        await resumeQueue();
      } else {
        await pauseQueue();
      }
      loadStatus();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // 清空队列
  const handleClear = async () => {
    if (!confirm('确定要清空所有待执行任务吗？')) return;
    try {
      await clearQueue();
      loadStatus();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // 取消任务
  const handleCancel = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await cancelTask(taskId);
      loadStatus();
      loadHistory();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // 重试任务
  const handleRetry = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await retryTask(taskId);
      loadStatus();
      loadHistory();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // 调整优先级
  const handlePriority = async (taskId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const task = queue.find((t) => t.id === taskId);
    if (!task) return;

    const newPriority = direction === 'up' ? task.priority + 1 : task.priority - 1;
    try {
      await setTaskPriority(taskId, newPriority);
      loadStatus();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // 展开/收起子任务
  const handleToggleSubtasks = async (taskId: string) => {
    if (expandedTask === taskId) {
      setExpandedTask(null);
    } else {
      setExpandedTask(taskId);
      if (!subtasks[taskId]) {
        try {
          const data = await getSubtasks(taskId);
          setSubtasks((prev) => ({ ...prev, [taskId]: data.subtasks }));
        } catch (e) {
          console.error('Failed to load subtasks:', e);
        }
      }
    }
  };

  // 渲染任务卡片
  const renderTaskCard = (task: QueuedTask, showControls = true) => {
    const statusMap: Record<string, NodeStatus> = {
      completed: NodeStatus.SUCCESS,
      failed: NodeStatus.FAILED,
      running: NodeStatus.RUNNING,
      queued: NodeStatus.PENDING,
      paused: NodeStatus.PENDING,
      cancelled: NodeStatus.CANCELLED,
    };

    const hasSubtasks = task.parent_id === null; // 只有父任务可能有子任务

    return (
      <div
        key={task.id}
        className={`queue-task-card ${task.status}`}
        onClick={() => onTaskClick?.(task.id)}
      >
        <div className="task-header">
          <div className="task-info">
            {hasSubtasks && (
              <button
                className="expand-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSubtasks(task.id);
                }}
              >
                {expandedTask === task.id ? '▼' : '▶'}
              </button>
            )}
            <span className="task-id">{task.id.slice(0, 20)}...</span>
            <StatusBadge status={statusMap[task.status] || NodeStatus.PENDING} />
            {task.parent_id && <span className="subtask-badge">子任务</span>}
          </div>
          <div className="task-meta">
            <span className="flowspec">{task.flowspec.split('/').pop()}</span>
            <span className="priority">P:{task.priority}</span>
          </div>
        </div>

        {showControls && task.status === 'queued' && (
          <div className="task-controls">
            <button
              className="btn-sm btn-up"
              onClick={(e) => handlePriority(task.id, 'up', e)}
              title="提高优先级"
            >
              ↑
            </button>
            <button
              className="btn-sm btn-down"
              onClick={(e) => handlePriority(task.id, 'down', e)}
              title="降低优先级"
            >
              ↓
            </button>
            <button
              className="btn-sm btn-cancel"
              onClick={(e) => handleCancel(task.id, e)}
              title="取消任务"
            >
              ×
            </button>
          </div>
        )}

        {(task.status === 'failed' || task.status === 'cancelled') && (
          <div className="task-controls">
            <button
              className="btn-sm btn-retry"
              onClick={(e) => handleRetry(task.id, e)}
              title="重试任务"
            >
              🔄
            </button>
          </div>
        )}

        {task.error && <div className="task-error">{task.error}</div>}

        {/* 子任务列表 */}
        {expandedTask === task.id && subtasks[task.id] && (
          <div className="subtasks-list">
            {subtasks[task.id].length === 0 ? (
              <div className="no-subtasks">暂无子任务</div>
            ) : (
              subtasks[task.id].map((st) => (
                <div key={st.id} className="subtask-item">
                  <StatusBadge status={statusMap[st.status] || 'pending'} />
                  <span className="subtask-id">{st.id.slice(0, 15)}...</span>
                  <span className="subtask-flowspec">{st.flowspec.split('/').pop()}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="queue-panel loading">加载中...</div>;
  }

  return (
    <div className="queue-panel">
      {/* 顶部控制栏 */}
      <div className="queue-header">
        <h3>🚦 任务队列</h3>
        <div className="queue-controls">
          <button
            className={`btn ${paused ? 'btn-resume' : 'btn-pause'}`}
            onClick={handleTogglePause}
          >
            {paused ? '▶ 恢复' : '⏸ 暂停'}
          </button>
          <button className="btn btn-clear" onClick={handleClear} disabled={queue.length === 0}>
            🗑 清空
          </button>
        </div>
      </div>

      {error && <div className="queue-error">{error}</div>}

      {/* 当前执行 */}
      <div className="queue-section">
        <h4>▶ 当前执行</h4>
        {current ? (
          <div className="current-task">
            {queue.find((t) => t.id === current)
              ? renderTaskCard(queue.find((t) => t.id === current)!, false)
              : `${current} (执行中)`}
          </div>
        ) : (
          <div className="no-task">{paused ? '队列已暂停' : '空闲'}</div>
        )}
      </div>

      {/* 等待队列 */}
      <div className="queue-section">
        <h4>📋 等待队列 ({queue.filter((t) => t.status === 'queued').length})</h4>
        <div className="queue-list">
          {queue.filter((t) => t.status === 'queued').length === 0 ? (
            <div className="no-task">暂无等待任务</div>
          ) : (
            queue.filter((t) => t.status === 'queued').map((task) => renderTaskCard(task))
          )}
        </div>
      </div>

      {/* 历史记录 */}
      <div className="queue-section">
        <h4>📜 历史 ({historyTotal})</h4>
        <div className="history-list">
          {history.slice(0, 10).map((task) => renderTaskCard(task, false))}
          {historyTotal > 10 && (
            <div className="more-history">还有 {historyTotal - 10} 条记录...</div>
          )}
        </div>
      </div>
    </div>
  );
}
