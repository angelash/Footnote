/**
 * 02-task-page.spec.ts
 * 任务页面测试
 */

import { TestConfig } from '../config';

export const TaskPageTests = {
  name: '任务页面测试',

  tests: [
    {
      id: 'task-001',
      name: '任务页面应加载',
      description: '访问任务页面应正确显示',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: `${TestConfig.baseUrl}/task` },
          description: '导航到任务页面',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { format: 'png' },
          description: '截图任务页面',
        },
      ],
    },
    {
      id: 'task-002',
      name: '任务提交面板应显示',
      description: '页面应显示任务提交面板',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".task-submit-panel") !== null' },
          expected: true,
          description: '验证任务提交面板存在',
        },
      ],
    },
    {
      id: 'task-003',
      name: '应有任务输入框',
      description: '页面应有任务描述输入框',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector("textarea, input[type=text]") !== null' },
          expected: true,
          description: '验证输入框存在',
        },
      ],
    },
    {
      id: 'task-004',
      name: '应有提交按钮',
      description: '页面应有提交任务按钮',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector("button") !== null' },
          expected: true,
          description: '验证提交按钮存在',
        },
      ],
    },
  ],
};

export default TaskPageTests;
