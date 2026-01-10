/**
 * 01-navigation.spec.ts
 * 导航测试
 */

import { TestConfig } from '../config';

export const NavigationTests = {
  name: '导航测试',

  tests: [
    {
      id: 'nav-001',
      name: '页面应正确加载',
      description: '访问首页应重定向到任务页面',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: TestConfig.baseUrl },
          description: '导航到首页',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => window.location.pathname' },
          expected: '/task',
          description: '验证重定向到任务页面',
        },
      ],
    },
    {
      id: 'nav-002',
      name: '导航栏应显示',
      description: '页面应显示导航栏和所有链接',
      steps: [
        {
          action: 'snapshot',
          tool: 'take_snapshot',
          description: '获取页面快照',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".app-nav") !== null' },
          expected: true,
          description: '验证导航栏存在',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelectorAll(".nav-links a").length' },
          expected: 4,
          description: '验证有4个导航链接',
        },
      ],
    },
    {
      id: 'nav-003',
      name: '点击运行列表应导航',
      description: '点击"运行列表"链接应导航到 /runs',
      steps: [
        {
          action: 'click',
          tool: 'click',
          params: { uid: 'runs-link' },
          description: '点击运行列表链接',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待导航',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => window.location.pathname' },
          expected: '/runs',
          description: '验证路径为 /runs',
        },
      ],
    },
    {
      id: 'nav-004',
      name: '点击任务队列应导航',
      description: '点击"任务队列"链接应导航到 /queue',
      steps: [
        {
          action: 'click',
          tool: 'click',
          params: { uid: 'queue-link' },
          description: '点击任务队列链接',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待导航',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => window.location.pathname' },
          expected: '/queue',
          description: '验证路径为 /queue',
        },
      ],
    },
    {
      id: 'nav-005',
      name: '点击审查中心应导航',
      description: '点击"审查中心"链接应导航到 /review',
      steps: [
        {
          action: 'click',
          tool: 'click',
          params: { uid: 'review-link' },
          description: '点击审查中心链接',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待导航',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => window.location.pathname' },
          expected: '/review',
          description: '验证路径为 /review',
        },
      ],
    },
    {
      id: 'nav-006',
      name: '活动链接应高亮',
      description: '当前页面对应的导航链接应有 active 类',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: `${TestConfig.baseUrl}/runs` },
          description: '导航到运行列表页',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(\'a[href="/runs"]\')?.classList.contains("active")' },
          expected: true,
          description: '验证运行列表链接高亮',
        },
      ],
    },
  ],
};

export default NavigationTests;
