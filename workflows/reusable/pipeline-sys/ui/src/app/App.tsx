/**
 * Pipeline-Sys UI App
 * 主应用组件
 */

import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { RunsPage } from '../pages/RunsPage';
import { RunDetailPage } from '../pages/RunDetailPage';
import { QueuePage } from '../pages/QueuePage';
import { ReviewPage } from '../pages/ReviewPage';
import { TaskPage } from '../pages/TaskPage';
import './App.css';

export function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* 导航栏 */}
        <nav className="app-nav">
          <div className="nav-brand">Pipeline-Sys</div>
          <div className="nav-links">
            <NavLink to="/task" className={({ isActive }) => (isActive ? 'active' : '')}>
              ➕ 发起任务
            </NavLink>
            <NavLink to="/runs" className={({ isActive }) => (isActive ? 'active' : '')}>
              📋 运行列表
            </NavLink>
            <NavLink to="/queue" className={({ isActive }) => (isActive ? 'active' : '')}>
              🚦 任务队列
            </NavLink>
            <NavLink to="/review" className={({ isActive }) => (isActive ? 'active' : '')}>
              🔍 审查中心
            </NavLink>
          </div>
        </nav>

        {/* 路由 */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/task" replace />} />
            <Route path="/task" element={<TaskPage />} />
            <Route path="/runs" element={<RunsPage />} />
            <Route path="/runs/:runId" element={<RunDetailPage />} />
            <Route path="/queue" element={<QueuePage />} />
            <Route path="/review" element={<ReviewPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

