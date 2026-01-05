/**
 * Pipeline-Sys UI App
 * 主应用组件
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RunsPage } from '../pages/RunsPage';
import { RunDetailPage } from '../pages/RunDetailPage';

export function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/runs" replace />} />
          <Route path="/runs" element={<RunsPage />} />
          <Route path="/runs/:runId" element={<RunDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

