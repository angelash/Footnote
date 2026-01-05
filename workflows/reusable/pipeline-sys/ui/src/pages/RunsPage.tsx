/**
 * Runs Page
 * 运行列表页面
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRunStore } from '../state/runStore';
import { fetchRuns } from '../api/consoleApi';
import { StatusBadge } from '../components/Common/StatusBadge';
import './RunsPage.css';

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

        {runs.length > 0 && (
          <table className="runs-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Run ID</th>
                <th>Task ID</th>
                <th>Stage</th>
                <th>Started</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.run_id}>
                  <td>
                    <StatusBadge ok={run.ok} />
                  </td>
                  <td>
                    <Link to={`/runs/${run.run_id}`} className="run-link">
                      {run.run_id}
                    </Link>
                  </td>
                  <td className="task-id">{run.task_id}</td>
                  <td className="stage">{run.stage}</td>
                  <td className="time">{formatTime(run.started_at)}</td>
                  <td className="time">{formatTime(run.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

