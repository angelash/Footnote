/**
 * ErrorBanner 组件
 * 在页面顶部显示服务异常提示
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchSystemStatus, restartRunner, type ISystemStatus } from '../../api/systemApi';
import './ErrorBanner.css';

export function ErrorBanner() {
  const [status, setStatus] = useState<ISystemStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // 获取状态
  const fetchStatus = useCallback(async () => {
    try {
      const data = await fetchSystemStatus();
      setStatus(data);
      
      // 如果服务恢复正常，自动关闭 banner
      if (data.runner.ok && data.console.ok) {
        setDismissed(false); // 重置 dismissed 状态，以便下次出问题时能显示
      }
    } catch {
      // 如果无法获取状态，也显示错误
      setStatus(null);
    }
  }, []);

  // 定时刷新
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // 处理重启
  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      await restartRunner();
      setTimeout(fetchStatus, 3000);
    } catch (e) {
      console.error('Restart failed:', e);
    } finally {
      setTimeout(() => setIsRestarting(false), 5000);
    }
  };

  // 判断是否需要显示 banner
  const hasIssue = status && (!status.runner.ok || status.runner.status === 'restarting');
  const isRestarting_ = status?.runner.status === 'restarting' || isRestarting;

  // 如果没有问题或已关闭，不显示
  if (!hasIssue || dismissed) {
    return null;
  }

  // 确定 banner 类型
  const bannerType = isRestarting_ ? 'warning' : 'error';

  return (
    <div className={`error-banner ${bannerType}`}>
      <span className="error-banner-icon">
        {isRestarting_ ? '🔄' : '⚠️'}
      </span>
      
      <div className="error-banner-content">
        <h3 className="error-banner-title">
          {isRestarting_ ? 'WSL Runner Restarting' : 'WSL Runner Unavailable'}
        </h3>
        
        {status?.runner.error && (
          <p className="error-banner-message">
            Reason: {status.runner.error}
          </p>
        )}
        
        <p className="error-banner-diagnosis">
          {status?.diagnosis}
        </p>

        {isRestarting_ && (
          <div className="error-banner-progress">
            <span className="error-banner-spinner" />
            <span>Attempting to restart service...</span>
          </div>
        )}

        <div className="error-banner-actions">
          {!isRestarting_ && (
            <button
              className="error-banner-btn primary"
              onClick={handleRestart}
              disabled={isRestarting}
            >
              Restart Runner
            </button>
          )}
          <Link 
            to="/system" 
            className="error-banner-btn secondary"
          >
            View Details
          </Link>
        </div>
      </div>

      <button 
        className="error-banner-close"
        onClick={() => setDismissed(true)}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
