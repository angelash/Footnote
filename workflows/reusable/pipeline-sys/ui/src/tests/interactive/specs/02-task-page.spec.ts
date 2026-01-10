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
      name: '页面标题应正确',
      description: '页面应显示发起任务相关标题',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector("h2")?.textContent?.includes("发起")' },
          expected: true,
          description: '验证标题包含"发起"',
        },
      ],
    },
    {
      id: 'task-003',
      name: '步骤指示器应显示',
      description: '页面应显示3个步骤',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const text = document.body.textContent; return text.includes("1. 选择类型") && text.includes("2. 选择角色") && text.includes("3. 填写详情"); }' },
          expected: true,
          description: '验证三个步骤显示',
        },
      ],
    },
    {
      id: 'task-004',
      name: '任务类型选项应显示',
      description: '页面应显示任务类型选项按钮',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelectorAll("button").length >= 6' },
          expected: true,
          description: '验证至少有6个任务类型按钮',
        },
      ],
    },
    {
      id: 'task-005',
      name: '智能派单选项应存在',
      description: '页面应有智能派单按钮',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent.includes("智能派单")' },
          expected: true,
          description: '验证智能派单选项',
        },
      ],
    },
    {
      id: 'task-006',
      name: '工程开发选项应存在',
      description: '页面应有工程开发按钮',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent.includes("工程开发")' },
          expected: true,
          description: '验证工程开发选项',
        },
      ],
    },
    {
      id: 'task-007',
      name: '美术制作选项应存在',
      description: '页面应有美术制作按钮',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent.includes("美术制作")' },
          expected: true,
          description: '验证美术制作选项',
        },
      ],
    },
    {
      id: 'task-008',
      name: '关卡设计选项应存在',
      description: '页面应有关卡设计按钮',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent.includes("关卡设计")' },
          expected: true,
          description: '验证关卡设计选项',
        },
      ],
    },
    {
      id: 'task-009',
      name: '点击类型应进入下一步',
      description: '选择任务类型后应进入角色选择',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("智能派单")); if (btn) { btn.click(); return true; } return false; }' },
          description: '点击智能派单',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待状态更新',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { format: 'png' },
          description: '截图选择后状态',
        },
      ],
    },
  ],
};

export default TaskPageTests;
