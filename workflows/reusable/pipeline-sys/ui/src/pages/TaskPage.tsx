/**
 * TaskPage - 任务管理页面
 */

import React from 'react';
import { TaskSubmitPanel } from '../components/Task/TaskSubmitPanel';
import './TaskPage.css';

export const TaskPage: React.FC = () => {
  const handleSuccess = () => {
    // 任务提交成功后可以跳转或刷新
    console.log('Task submitted successfully');
  };

  return (
    <div className="task-page">
      <TaskSubmitPanel onSuccess={handleSuccess} />
    </div>
  );
};

export default TaskPage;
