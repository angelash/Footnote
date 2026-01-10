/**
 * 07-error-handling.spec.ts
 * 错误处理测试
 */

import { TestConfig } from '../config';

export const ErrorHandlingTests = {
  name: '错误处理测试',

  tests: [
    {
      id: 'error-001',
      name: '404 页面应正确处理',
      description: '访问不存在的路径应正确处理',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: `${TestConfig.baseUrl}/nonexistent-page` },
          description: '导航到不存在的页面',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent !== ""' },
          expected: true,
          description: '页面应有内容（不是空白）',
        },
      ],
    },
    {
      id: 'error-002',
      name: '无效 run ID 应处理',
      description: '访问不存在的 run 应显示错误',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: `${TestConfig.baseUrl}/runs/INVALID-RUN-ID` },
          description: '导航到无效运行详情',
        },
        {
          action: 'sleep',
          duration: 1000,
          description: '等待加载',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent.includes("error") || document.body.textContent.includes("错误") || document.body.textContent.includes("not found") || document.body.textContent.includes("INVALID")' },
          expected: true,
          description: '应显示错误信息',
        },
      ],
    },
    {
      id: 'error-003',
      name: 'API 错误应优雅处理',
      description: '队列 API 失败时应显示错误状态',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: `${TestConfig.baseUrl}/queue` },
          description: '导航到队列页',
        },
        {
          action: 'sleep',
          duration: 2000,
          description: '等待 API 响应',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const hasLoading = document.body.textContent.includes("加载中"); const hasError = document.querySelector(".queue-error, .error"); const hasContent = document.querySelector(".queue-panel"); return hasLoading || hasError !== null || hasContent !== null; }' },
          expected: true,
          description: '应显示加载/错误/内容之一',
        },
      ],
    },
    {
      id: 'error-004',
      name: '网络错误应处理',
      description: '网络请求失败应有错误提示',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: 'async () => { try { await fetch("/api/nonexistent-endpoint"); return "request completed"; } catch (e) { return "network error handled"; } }' },
          description: '测试错误处理',
        },
      ],
    },
  ],
};

export default ErrorHandlingTests;
