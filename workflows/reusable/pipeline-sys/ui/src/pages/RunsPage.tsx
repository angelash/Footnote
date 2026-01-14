/**
 * Runs Page
 * 运行列表页面 - 支持任务树展示
 */

import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRunStore } from '../state/runStore';
import { fetchRuns } from '../api/consoleApi';
import type { IRunListItem } from '../types/dto';
import './RunsPage.css';

/**
 * 任务树节点
 */
interface IRunTreeNode extends IRunListItem {
  children: IRunTreeNode[];
  depth: number;
}

/**
 * 构建任务树
 */
function buildRunTree(runs: IRunListItem[]): IRunTreeNode[] {
  // 创建 runId -> run 的映射
  const runMap = new Map<string, IRunTreeNode>();
  runs.forEach(run => {
    runMap.set(run.run_id, { ...run, children: [], depth: 0 });
  });

  // 找出所有子任务 ID
  const childIds = new Set<string>();
  runs.forEach(run => {
    if (run.subtask_ids) {
      run.subtask_ids.forEach(id => childIds.add(id));
    }
  });

  // 构建树结构
  const rootNodes: IRunTreeNode[] = [];
  
  runMap.forEach((node, runId) => {
    // 查找父节点
    let parentFound = false;
    runs.forEach(run => {
      if (run.subtask_ids?.includes(runId)) {
        const parent = runMap.get(run.run_id);
        if (parent) {
          node.depth = parent.depth + 1;
          parent.children.push(node);
          parentFound = true;
        }
      }
    });

    // 如果没有父节点，则为根节点
    if (!parentFound && !childIds.has(runId)) {
      rootNodes.push(node);
    } else if (!parentFound && childIds.has(runId)) {
      // 是子任务但父任务不在列表中，也显示为根
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

/**
 * 扁平化任务树（保持层级顺序）
 */
function flattenTree(nodes: IRunTreeNode[]): IRunTreeNode[] {
  const result: IRunTreeNode[] = [];
  
  function traverse(node: IRunTreeNode) {
    result.push(node);
    // 子节点按时间倒序
    node.children
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .forEach(traverse);
  }
  
  nodes.forEach(traverse);
  return result;
}

/**
 * 获取状态标签
 */
function getStatusLabel(run: IRunListItem): string {
  if (run.raw_status) {
    return run.raw_status;
  }
  if (run.ok) return 'SUCCESS';
  if (run.stage > 0 && run.stage < 99) return 'RUNNING';
  return 'FAILED';
}

/**
 * 获取状态颜色类名
 */
function getStatusClass(run: IRunListItem): string {
  const status = getStatusLabel(run);
  switch (status) {
    case 'SUCCESS': return 'status-success';
    case 'RUNNING': return 'status-running';
    case 'PENDING': return 'status-pending';
    default: return 'status-failed';
  }
}

export function RunsPage() {
  const { runs, runsLoading, runsError, setRuns, setRunsLoading, setRunsError } = useRunStore();

  useEffect(() => {
    const loadRuns = async () => {
      setRunsLoading(true);
      try {
        const data = await fetchRuns();
        setRuns(data.runs);
        setRunsError(null);
      } catch (e) {
        setRunsError((e as Error).message);
      } finally {
        setRunsLoading(false);
      }
    };

    loadRuns();
    
    // 每 5 秒刷新一次
    const interval = setInterval(loadRuns, 5000);
    return () => clearInterval(interval);
  }, [setRuns, setRunsLoading, setRunsError]);

  // 构建任务树
  const treeNodes = useMemo(() => {
    const tree = buildRunTree(runs);
    return flattenTree(tree);
  }, [runs]);

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString();
  };

  return (
    <div className="runs-page">
      <header className="runs-header">
        <h1>Pipeline-Sys Console</h1>
        <p className="runs-subtitle">Behavior Tree Visualization & Control</p>
      </header>

      <main className="runs-content">
        {runsLoading && runs.length === 0 && (
          <div className="runs-loading">Loading runs...</div>
        )}

        {runsError && (
          <div className="runs-error">
            <span className="error-icon">⚠️</span>
            <span>{runsError}</span>
          </div>
        )}

        {!runsLoading && !runsError && runs.length === 0 && (
          <div className="runs-empty">
            <span className="empty-icon">📭</span>
            <p>No runs found</p>
            <p className="empty-hint">Runs will appear here when triggered via n8n or API</p>
          </div>
        )}

        {treeNodes.length > 0 && (
          <table className="runs-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Run ID / Flow</th>
                <th>Task ID</th>
                <th>Started</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {treeNodes.map((run) => (
                <tr key={run.run_id} className={`depth-${Math.min(run.depth, 3)}`}>
                  <td>
                    <div className="status-cell">
                      {run.depth > 0 && (
                        <span className="tree-indent" style={{ width: `${run.depth * 20}px` }}>
                          <span className="tree-line">└</span>
                        </span>
                      )}
                      <span className={`status-dot ${getStatusClass(run)}`} />
                      <span className={`status-label ${getStatusClass(run)}`}>
                        {getStatusLabel(run)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="run-info">
                      <Link to={`/runs/${run.run_id}`} className="run-link">
                        {run.run_id}
                      </Link>
                      {run.flow_name && (
                        <span className="flow-name">{run.flow_name}</span>
                      )}
                      {run.children.length > 0 && (
                        <span className="subtask-count">
                          {run.children.length} subtask{run.children.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="task-id">{run.flow_id || run.task_id}</td>
                  <td className="time">{formatTime(run.started_at)}</td>
                  <td className="time">{run.updated_at ? formatTime(run.updated_at) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

