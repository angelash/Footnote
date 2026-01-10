/**
 * 03-runs-page.spec.ts
 * 运行列表页面测试
 */

import { TestConfig } from '../config';

export const RunsPageTests = {
  name: '运行列表页面测试',

  tests: [
    {
      id: 'runs-001',
      name: '运行列表页应加载',
      description: '访问运行列表页面应正确显示',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: `${TestConfig.baseUrl}/runs` },
          description: '导航到运行列表页面',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { format: 'png' },
          description: '截图运行列表页面',
        },
      ],
    },
    {
      id: 'runs-002',
      name: '应显示运行列表',
      description: '页面应显示运行列表容器',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".runs-page, .runs-list") !== null' },
          expected: true,
          description: '验证运行列表容器存在',
        },
      ],
    },
    {
      id: 'runs-003',
      name: '点击运行项应进入详情',
      description: '点击运行列表项应导航到详情页',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const item = document.querySelector(".run-item, .run-card, [data-run-id]"); if (item) { item.click(); return true; } return false; }' },
          description: '点击第一个运行项',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待导航',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => window.location.pathname.startsWith("/runs/")' },
          expected: true,
          description: '验证导航到详情页',
        },
      ],
    },
  ],
};

export default RunsPageTests;
