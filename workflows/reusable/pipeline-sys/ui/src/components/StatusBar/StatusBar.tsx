/**
 * StatusBar 组件
 * 在导航栏显示服务状态指示器
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchSystemStatus, restartRunner, type ISystemStatus, type ServiceStatus } from '../../api/systemApi';
import './StatusBar.css';

/**
 * 获取整体健康状态
 */
function getOverallStatus(status: ISystemStatus | null): ServiceStatus {
  if (!status) return 'unknown';
  if (!status.console.ok) return 'offline';
  if (status.runner.status === 'restarting') return 'restarting';
  if (!status.runner.ok) return 'offline';
  return 'online';
}

/**
 * 获取状态显示文本
 */
function getStatusText(status: ISystemStatus | null): string {
  if (!status) return '加载中...';
  const overall = getOverallStatus(status);
  switch (overall) {
    case 'online':
      return '系统正常';
    case 'offline':
      return '服务异常';
    case 'restarting':
      return '重启中...';
    default:
      return '未知';
  }
}

export function StatusBar() {
  const [status, setStatus] = useState<ISystemStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取状态
  const fetchStatus = useCallback(async () => {
    try {
      const data = await fetchSystemStatus();
      setStatus(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // 定时刷新
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // 每 5 秒刷新
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // 处理重启
  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      await restartRunner();
      // 等待一会儿后刷新状态
      setTimeout(fetchStatus, 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsRestarting(false);
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.status-bar')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const overallStatus = getOverallStatus(status);
  const statusText = getStatusText(status);
  const hasIssue = overallStatus === 'offline' || overallStatus === 'restarting';

  return (
    <div className="status-bar">
      <div 
        className="status-indicator"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`status-dot ${overallStatus}`} />
        <span className={`status-text ${hasIssue ? 'error' : ''}`}>
          {statusText}
        </span>
      </div>

      {isOpen && (
        <div className="status-dropdown">
          <div className="status-dropdown-header">
            <span className="status-dropdown-title">系统状态</span>
            <Link to="/system" className="status-dropdown-link" onClick={() => setIsOpen(false)}>
              查看详情
            </Link>
          </div>

          {/* Console 状态 */}
          <div className="status-item">
            <span className="status-item-label">
              控制台服务
            </span>
            <span className={`status-item-value ${status?.console.ok ? 'online' : 'offline'}`}>
              {status?.console.ok ? '在线' : '离线'}
            </span>
          </div>

          {/* Runner 状态 */}
          <div className="status-item">
            <span className="status-item-label">
              WSL 执行器
            </span>
            <span className={`status-item-value ${status?.runner.status || 'unknown'}`}>
              {status?.runner.status === 'online' && '在线'}
              {status?.runner.status === 'offline' && '离线'}
              {status?.runner.status === 'restarting' && '重启中...'}
              {status?.runner.status === 'unknown' && '未知'}
            </span>
          </div>

          {/* 队列状态 */}
          <div className="status-item">
            <span className="status-item-label">
              任务队列
            </span>
            <span className="status-item-value" style={{ color: '#d1d5db' }}>
              等待 {status?.queue.pending ?? 0} / 运行 {status?.queue.running ?? 0}
            </span>
          </div>

          {/* 诊断信息 */}
          {status?.diagnosis && (
            <div className={`status-diagnosis ${hasIssue ? 'error' : ''}`}>
              {status.diagnosis}
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="status-diagnosis error">
              错误: {error}
            </div>
          )}

          {/* 操作按钮 */}
          {hasIssue && (
            <div className="status-actions">
              <button
                className="status-action-btn primary"
                onClick={handleRestart}
                disabled={isRestarting || status?.runner.status === 'restarting'}
              >
                {isRestarting ? '重启中...' : '重启执行器'}
              </button>
              <Link 
                to="/system" 
                className="status-action-btn secondary"
                onClick={() => setIsOpen(false)}
              >
                查看日志
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
