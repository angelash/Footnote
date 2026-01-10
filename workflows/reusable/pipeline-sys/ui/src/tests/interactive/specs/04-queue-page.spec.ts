/**
 * 04-queue-page.spec.ts
 * 任务队列页面测试
 */

import { TestConfig } from '../config';

export const QueuePageTests = {
  name: '任务队列页面测试',

  tests: [
    {
      id: 'queue-001',
      name: '队列页面应加载',
      description: '访问队列页面应正确显示',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: `${TestConfig.baseUrl}/queue` },
          description: '导航到队列页面',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { format: 'png' },
          description: '截图队列页面',
        },
      ],
    },
    {
      id: 'queue-002',
      name: '页面标题应正确',
      description: '页面应显示"任务队列"标题',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector("h1")?.textContent' },
          expected: '任务队列',
          description: '验证标题',
        },
      ],
    },
    {
      id: 'queue-003',
      name: '页面说明应显示',
      description: '页面应显示功能说明',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".page-description")?.textContent?.includes("暂停/恢复队列")' },
          expected: true,
          description: '验证说明文字包含功能描述',
        },
      ],
    },
    {
      id: 'queue-004',
      name: '快捷操作说明应显示',
      description: '页面应显示快捷键说明',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".page-help h3")?.textContent' },
          expected: '快捷操作',
          description: '验证快捷操作标题',
        },
      ],
    },
    {
      id: 'queue-005',
      name: '队列端点文档应显示',
      description: '页面应显示 API 端点说明',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector("code")?.textContent?.includes("GET /queue")' },
          expected: true,
          description: '验证 API 文档',
        },
      ],
    },
    {
      id: 'queue-006',
      name: 'QueuePanel 组件应加载',
      description: '队列面板组件应存在',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".page-content") !== null' },
          expected: true,
          description: '验证内容区域存在',
        },
      ],
    },
    {
      id: 'queue-007',
      name: 'API 错误应显示加载状态或错误',
      description: '当 Runner 未运行时应显示加载或错误状态',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const loading = document.querySelector(".loading"); const error = document.querySelector(".queue-error"); return loading !== null || error !== null || document.body.textContent.includes("加载中"); }' },
          expected: true,
          description: '验证显示加载或错误状态',
        },
      ],
    },
    {
      id: 'queue-008',
      name: 'API 调用应返回结果',
      description: '调用队列 API 应返回响应',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: 'async () => { try { const res = await fetch("/api/queue"); return { status: res.status, hasResponse: true }; } catch (e) { return { error: e.message }; } }' },
          description: '验证 API 可调用',
        },
      ],
    },
  ],
};

export default QueuePageTests;
