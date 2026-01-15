/**
 * Node Detail Panel Component
 * 节点详情面板（含实时日志流）
 */

import { useState, useEffect, useRef } from 'react';
import { fetchRunFile, retryNode } from '../../api/consoleApi';
import { StatusBadge } from '../Common/StatusBadge';
import { useRunStore } from '../../state/runStore';
import type { IGraph, INodeRunsSnapshot, IOutputRef, NodeStatus } from '../../types/dto';
import { EventType } from '../../types/dto';
import './NodeDetailPanel.css';

interface INodeDetailPanelProps {
  runId: string;
  nodeId: string | null;
  graph: IGraph | null;
  nodeRuns: INodeRunsSnapshot | null;
}

export function NodeDetailPanel({ runId, nodeId, graph, nodeRuns }: INodeDetailPanelProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<IOutputRef | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // 获取事件流（用于实时日志）
  const events = useRunStore((state) => state.events);

  // 获取节点信息
  const graphNode = nodeId ? graph?.nodes.find((n) => n.id === nodeId) : null;
  const nodeRun = nodeId ? nodeRuns?.nodes[nodeId] : null;

  // 过滤当前节点的 NODE_LOG 事件
  const nodeLogs = nodeId
    ? events.filter(
        (e) => e.type === EventType.NODE_LOG && e.node_id === nodeId
      )
    : [];

  // 自动滚动到底部
  useEffect(() => {
    if (logEndRef.current && nodeLogs.length > 0) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [nodeLogs.length]);

  // 加载文件内容
  useEffect(() => {
    if (!selectedOutput) {
      setFileContent(null);
      return;
    }

    const loadFile = async () => {
      setFileLoading(true);
      try {
        const data = await fetchRunFile(runId, selectedOutput.rel_path);
        setFileContent(data.content);
      } catch (e) {
        setFileContent(`Error loading file: ${(e as Error).message}`);
      } finally {
        setFileLoading(false);
      }
    };

    loadFile();
  }, [runId, selectedOutput]);

  // 重试节点
  const handleRetry = async () => {
    if (!nodeId) return;
    if (!confirm(`确定要重试节点 ${nodeId} 吗？`)) return;

    try {
      await retryNode(runId, nodeId);
    } catch (e) {
      alert(`重试失败: ${(e as Error).message}`);
    }
  };

  const canRetry = nodeRun && ['FAILED', 'TIMEOUT', 'CANCELLED'].includes(nodeRun.status);

  if (!nodeId || !graphNode) {
    return (
      <div className="node-detail-panel">
        <div className="panel-empty">
          <span className="empty-icon">◉</span>
          <p>Select a node to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="node-detail-panel">
      {/* Header */}
      <div className="panel-header">
        <h3>{graphNode.title}</h3>
        <span className="panel-node-id">{nodeId}</span>
      </div>

      {/* Status section */}
      <div className="panel-section">
        <h4>Status</h4>
        <div className="panel-status-row">
          <StatusBadge status={nodeRun?.status as NodeStatus} />
          {nodeRun?.attempt && nodeRun.attempt > 1 && (
            <span className="attempt-badge">Attempt {nodeRun.attempt}</span>
          )}
          {canRetry && (
            <button className="retry-button" onClick={handleRetry}>
              ↻ Retry
            </button>
          )}
        </div>
      </div>

      {/* Timing section */}
      {nodeRun && (
        <div className="panel-section">
          <h4>Timing</h4>
          <div className="panel-timing">
            {nodeRun.started_at && (
              <div className="timing-row">
                <span className="timing-label">Started:</span>
                <span className="timing-value">
                  {new Date(nodeRun.started_at).toLocaleTimeString()}
                </span>
              </div>
            )}
            {nodeRun.ended_at && (
              <div className="timing-row">
                <span className="timing-label">Ended:</span>
                <span className="timing-value">
                  {new Date(nodeRun.ended_at).toLocaleTimeString()}
                </span>
              </div>
            )}
            {nodeRun.elapsed_ms != null && (
              <div className="timing-row">
                <span className="timing-label">Duration:</span>
                <span className="timing-value">{nodeRun.elapsed_ms}ms</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error section */}
      {nodeRun?.last_error && (
        <div className="panel-section panel-error-section">
          <h4>Error</h4>
          <pre className="panel-error">{nodeRun.last_error}</pre>
        </div>
      )}

      {/* Real-time logs section */}
      {nodeLogs.length > 0 && (
        <div className="panel-section panel-logs-section">
          <h4>
            实时输出
            <span className="log-count">({nodeLogs.length})</span>
          </h4>
          <div className="panel-logs-container">
            <pre className="panel-logs">
              {nodeLogs.map((log, idx) => {
                const payload = log.payload as { stream?: string; text?: string };
                const isStderr = payload.stream === 'stderr';
                return (
                  <span key={idx} className={isStderr ? 'log-stderr' : 'log-stdout'}>
                    {payload.text || ''}
                  </span>
                );
              })}
              <div ref={logEndRef} />
            </pre>
          </div>
        </div>
      )}

      {/* Outputs section */}
      {graphNode.outputs.length > 0 && (
        <div className="panel-section">
          <h4>Outputs</h4>
          <div className="panel-outputs">
            {graphNode.outputs.map((output) => (
              <button
                key={output.rel_path}
                className={`output-button ${selectedOutput?.rel_path === output.rel_path ? 'active' : ''}`}
                onClick={() => setSelectedOutput(output)}
              >
                <span className="output-icon">
                  {output.kind === 'json' ? '{}' : output.kind === 'markdown' ? '📄' : '📁'}
                </span>
                <span className="output-label">{output.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File content */}
      {selectedOutput && (
        <div className="panel-section panel-file-section">
          <h4>{selectedOutput.label}</h4>
          {fileLoading ? (
            <div className="file-loading">Loading...</div>
          ) : (
            <pre className="panel-file-content">{fileContent}</pre>
          )}
        </div>
      )}
    </div>
  );
}

