/**
 * Run Detail Page
 * 运行详情页面：行为树 + 面板 + 时间线
 */

import { useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRunStore } from '../state/runStore';
import { fetchRunDetail, cancelRun } from '../api/consoleApi';
import { createEventsSse } from '../api/eventsSse';
import { GraphView } from '../components/BehaviorTree/GraphView';
import { NodeDetailPanel } from '../components/Panel/NodeDetailPanel';
import { EventsTimeline } from '../components/Timeline/EventsTimeline';
import { StatusBadge } from '../components/Common/StatusBadge';
import './RunDetailPage.css';

export function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const {
    currentStatus,
    currentGraph,
    currentNodeRuns,
    currentLoading,
    currentError,
    selectedNodeId,
    eventsConnected,
    setCurrentRun,
    setCurrentLoading,
    setCurrentError,
    clearCurrentRun,
    addEvent,
    setEventsConnected,
    updateNodeFromEvent,
  } = useRunStore();

  // 加载 run 详情
  useEffect(() => {
    if (!runId) return;

    const loadRun = async () => {
      setCurrentLoading(true);
      try {
        const data = await fetchRunDetail(runId);
        setCurrentRun(runId, data.status, data.graph, data.nodeRuns);
        setCurrentError(null);
      } catch (e) {
        setCurrentError((e as Error).message);
      } finally {
        setCurrentLoading(false);
      }
    };

    loadRun();

    return () => {
      clearCurrentRun();
    };
  }, [runId, setCurrentRun, setCurrentLoading, setCurrentError, clearCurrentRun]);

  // 订阅 SSE 事件
  useEffect(() => {
    if (!runId) return;

    const sse = createEventsSse(runId, {
      onEvent: (event) => {
        addEvent(event);
        updateNodeFromEvent(event);
      },
      onOpen: () => setEventsConnected(true),
      onClose: () => setEventsConnected(false),
      onError: (error) => {
        console.error('[SSE] Error:', error);
        setEventsConnected(false);
      },
    });

    return () => {
      sse.close();
    };
  }, [runId, addEvent, updateNodeFromEvent, setEventsConnected]);

  // 取消运行
  const handleCancel = useCallback(async () => {
    if (!runId) return;
    if (!confirm('确定要取消这个运行吗？')) return;

    try {
      await cancelRun(runId);
    } catch (e) {
      alert(`取消失败: ${(e as Error).message}`);
    }
  }, [runId]);

  if (currentLoading) {
    return (
      <div className="run-detail-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading run details...</p>
        </div>
      </div>
    );
  }

  if (currentError) {
    return (
      <div className="run-detail-page">
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <p>{currentError}</p>
          <Link to="/runs" className="back-link">← Back to runs</Link>
        </div>
      </div>
    );
  }

  if (!currentStatus) {
    return null;
  }

  return (
    <div className="run-detail-page">
      {/* Header */}
      <header className="run-header">
        <div className="run-header-left">
          <Link to="/runs" className="back-link">← Runs</Link>
          <h1>{currentStatus.run_id}</h1>
          <StatusBadge ok={currentStatus.ok} />
          {eventsConnected && <span className="live-badge">● LIVE</span>}
        </div>
        <div className="run-header-right">
          <span className="task-id">Task: {currentStatus.task_id}</span>
          <button 
            className="cancel-button"
            onClick={handleCancel}
            disabled={currentStatus.ok || currentStatus.stage >= 99}
          >
            Cancel
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="run-content">
        {/* Left: Graph */}
        <div className="run-graph-container">
          {currentGraph ? (
            <GraphView graph={currentGraph} nodeRuns={currentNodeRuns} />
          ) : (
            <div className="no-graph">
              <div className="no-graph-icon">📋</div>
              <h3>此运行无流程图数据</h3>
              <p>可能的原因：</p>
              <ul>
                <li>这是由 cursor-agent 直接执行的任务（非 FlowSpec 流程）</li>
                <li>运行还在初始化阶段</li>
                <li>日志文件格式不兼容</li>
              </ul>
              <p className="no-graph-hint">
                如果这是 cursor-agent 任务，请查看运行目录中的日志文件获取详情。
              </p>
            </div>
          )}
        </div>

        {/* Right: Panel */}
        <div className="run-panel-container">
          <NodeDetailPanel
            runId={runId!}
            nodeId={selectedNodeId}
            graph={currentGraph}
            nodeRuns={currentNodeRuns}
          />
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="run-timeline-container">
        <EventsTimeline />
      </div>
    </div>
  );
}

