/**
 * Queue Page
 * 队列管理页面
 */

import { useNavigate } from 'react-router-dom';
import { QueuePanel } from '../components/Queue/QueuePanel';
import './QueuePage.css';

export function QueuePage() {
  const navigate = useNavigate();

  const handleTaskClick = (taskId: string) => {
    // 导航到运行详情页
    navigate(`/runs/${taskId}`);
  };

  return (
    <div className="queue-page">
      <div className="page-header">
        <h1>任务队列</h1>
        <p className="page-description">
          管理和监控任务队列。您可以暂停/恢复队列、取消任务、调整优先级、重试失败的任务。
        </p>
      </div>

      <div className="page-content">
        <QueuePanel onTaskClick={handleTaskClick} />
      </div>

      <div className="page-help">
        <h3>快捷操作</h3>
        <ul>
          <li>
            <kbd>P</kbd> 暂停/恢复队列
          </li>
          <li>
            <kbd>↑</kbd> / <kbd>↓</kbd> 调整任务优先级
          </li>
          <li>
            <kbd>Delete</kbd> 取消选中的任务
          </li>
          <li>
            <kbd>R</kbd> 重试失败的任务
          </li>
        </ul>

        <h3>队列端点</h3>
        <code>
          GET /queue
          <br />
          POST /queue/pause
          <br />
          POST /queue/resume
          <br />
          POST /queue/clear
          <br />
          DELETE /queue/:taskId
          <br />
          POST /queue/:taskId/retry
          <br />
          POST /queue/:taskId/priority
        </code>
      </div>
    </div>
  );
}
