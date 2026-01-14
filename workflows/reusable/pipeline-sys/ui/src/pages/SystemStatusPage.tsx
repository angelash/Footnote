/**
 * SystemStatusPage
 * 系统状态详情页
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchSystemStatus, 
  fetchSystemLogs, 
  restartRunner,
  type ISystemStatus,
  type ILogEntry,
  type ServiceStatus,
} from '../api/systemApi';
import './SystemStatusPage.css';

/**
 * 格式化时间戳
 */
function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * 获取诊断状态类型
 */
function getDiagnosisType(status: ISystemStatus | null): 'ok' | 'warning' | 'error' {
  if (!status) return 'error';
  if (status.runner.status === 'online' && status.console.ok) return 'ok';
  if (status.runner.status === 'restarting') return 'warning';
  return 'error';
}

/**
 * 状态徽章组件
 */
function StatusBadge({ status }: { status: ServiceStatus }) {
  const labels: Record<ServiceStatus, string> = {
    online: 'Online',
    offline: 'Offline',
    restarting: 'Restarting',
    unknown: 'Unknown',
  };

  return (
    <span className={`status-badge ${status}`}>
      <span className="status-badge-dot" />
      {labels[status]}
    </span>
  );
}

export function SystemStatusPage() {
  const [status, setStatus] = useState<ISystemStatus | null>(null);
  const [logs, setLogs] = useState<ILogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取状态
  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchSystemStatus();
      setStatus(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // 获取日志
  const loadLogs = useCallback(async () => {
    try {
      const data = await fetchSystemLogs(100);
      setLogs(data.logs || []);
    } catch (e) {
      console.error('Failed to load logs:', e);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadStatus(), loadLogs()]);
      setLoading(false);
    };
    load();

    // 定时刷新状态
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [loadStatus, loadLogs]);

  // 处理重启
  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      await restartRunner();
      // 刷新状态和日志
      setTimeout(async () => {
        await loadStatus();
        await loadLogs();
        setIsRestarting(false);
      }, 3000);
    } catch (e) {
      setError((e as Error).message);
      setIsRestarting(false);
    }
  };

  if (loading) {
    return (
      <div className="system-status-page">
        <div className="loading">
          <div className="loading-spinner" />
          Loading system status...
        </div>
      </div>
    );
  }

  const diagnosisType = getDiagnosisType(status);

  return (
    <div className="system-status-page">
      {/* 页面标题 */}
      <div className="page-header">
        <h1 className="page-title">System Status</h1>
        <p className="page-subtitle">Monitor service health and manage system components</p>
      </div>

      {/* 状态卡片 */}
      <div className="status-cards">
        {/* Console Service */}
        <div className="status-card">
          <div className="status-card-header">
            <span className="status-card-title">Console Service</span>
            <StatusBadge status={status?.console.ok ? 'online' : 'offline'} />
          </div>
          <div className="status-card-body">
            <div className="status-row">
              <span className="status-row-label">Host</span>
              <span className="status-row-value">
                {status?.console.host}:{status?.console.port}
              </span>
            </div>
            <div className="status-row">
              <span className="status-row-label">Uptime</span>
              <span className="status-row-value">{status?.console.uptime}</span>
            </div>
          </div>
        </div>

        {/* WSL Runner */}
        <div className="status-card">
          <div className="status-card-header">
            <span className="status-card-title">WSL Runner</span>
            <StatusBadge status={status?.runner.status || 'unknown'} />
          </div>
          <div className="status-card-body">
            <div className="status-row">
              <span className="status-row-label">Last Check</span>
              <span className="status-row-value">
                {status?.runner.last_check ? formatTimestamp(status.runner.last_check) : '-'}
              </span>
            </div>
            <div className="status-row">
              <span className="status-row-label">Retry Count</span>
              <span className="status-row-value">{status?.runner.retry_count ?? 0}</span>
            </div>
            <div className="status-row">
              <span className="status-row-label">Restart Count</span>
              <span className="status-row-value">{status?.runner.restart_count ?? 0}</span>
            </div>
            {status?.runner.error && (
              <div className="status-row">
                <span className="status-row-label">Error</span>
                <span className="status-row-value error">{status.runner.error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Task Queue */}
        <div className="status-card">
          <div className="status-card-header">
            <span className="status-card-title">Task Queue</span>
            <StatusBadge status={status?.runner.ok ? 'online' : 'offline'} />
          </div>
          <div className="status-card-body">
            <div className="status-row">
              <span className="status-row-label">Pending Tasks</span>
              <span className="status-row-value">{status?.queue.pending ?? 0}</span>
            </div>
            <div className="status-row">
              <span className="status-row-label">Running Tasks</span>
              <span className="status-row-value">{status?.queue.running ?? 0}</span>
            </div>
            {status?.queue.error && (
              <div className="status-row">
                <span className="status-row-label">Error</span>
                <span className="status-row-value error">{status.queue.error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 诊断信息 */}
      <div className="diagnosis-section">
        <h2 className="diagnosis-title">Diagnosis</h2>
        <div className={`diagnosis-content ${diagnosisType}`}>
          {status?.diagnosis || 'Unable to determine system status'}
        </div>
        {error && (
          <div className="diagnosis-content error" style={{ marginTop: '12px' }}>
            Error: {error}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="action-buttons">
        <button
          className="action-btn primary"
          onClick={handleRestart}
          disabled={isRestarting || status?.runner.status === 'restarting'}
        >
          {isRestarting ? 'Restarting...' : 'Restart WSL Runner'}
        </button>
        <button className="action-btn secondary" onClick={loadLogs}>
          Refresh Logs
        </button>
        <button className="action-btn secondary" onClick={loadStatus}>
          Refresh Status
        </button>
      </div>

      {/* 日志 */}
      <div className="logs-section">
        <div className="logs-header">
          <h2 className="logs-title">Service Logs</h2>
          <button className="logs-refresh-btn" onClick={loadLogs}>
            Refresh
          </button>
        </div>
        <div className="logs-container">
          {logs.length === 0 ? (
            <div className="logs-empty">No logs available</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="log-entry">
                <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                <span className={`log-level ${log.level}`}>{log.level.toUpperCase()}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
