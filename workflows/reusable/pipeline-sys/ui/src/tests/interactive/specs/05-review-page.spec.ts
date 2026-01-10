/**
 * 05-review-page.spec.ts
 * 审查中心页面测试
 */

import { TestConfig } from '../config';

export const ReviewPageTests = {
  name: '审查中心页面测试',

  tests: [
    {
      id: 'review-001',
      name: '审查页面应加载',
      description: '访问审查页面应正确显示',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: `${TestConfig.baseUrl}/review` },
          description: '导航到审查页面',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { format: 'png' },
          description: '截图审查页面',
        },
      ],
    },
    {
      id: 'review-002',
      name: '页面标题应正确',
      description: '页面应显示审查中心标题',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector("h2")?.textContent?.includes("审查中心")' },
          expected: true,
          description: '验证标题',
        },
      ],
    },
    {
      id: 'review-003',
      name: '操作按钮应显示',
      description: '页面应有刷新、审核、发起按钮',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const text = document.body.textContent; return text.includes("刷新") && text.includes("审核") && text.includes("发起审查"); }' },
          expected: true,
          description: '验证操作按钮',
        },
      ],
    },
    {
      id: 'review-004',
      name: '统计卡片应显示',
      description: '页面应显示统计数据',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const text = document.body.textContent; return text.includes("总审查数") && text.includes("已通过") && text.includes("待处理") && text.includes("未通过"); }' },
          expected: true,
          description: '验证统计卡片',
        },
      ],
    },
    {
      id: 'review-005',
      name: '标签页应显示',
      description: '页面应有审核报告和审查记录标签',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const text = document.body.textContent; return text.includes("审核报告") && text.includes("审查记录"); }' },
          expected: true,
          description: '验证标签页',
        },
      ],
    },
    {
      id: 'review-006',
      name: '审核报告列表应显示',
      description: '页面应显示审核报告列表',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent.includes("AUDIT-")' },
          expected: true,
          description: '验证审核报告存在',
        },
      ],
    },
    {
      id: 'review-007',
      name: '健康状态应显示',
      description: '报告应显示 HEALTHY 状态',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent.includes("HEALTHY")' },
          expected: true,
          description: '验证健康状态',
        },
      ],
    },
    {
      id: 'review-008',
      name: '通过率应显示',
      description: '报告应显示通过率',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent.includes("通过率")' },
          expected: true,
          description: '验证通过率显示',
        },
      ],
    },
    {
      id: 'review-009',
      name: '决策建议应显示',
      description: '报告应显示决策建议',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent.includes("决策建议") || document.body.textContent.includes("PROCEED")' },
          expected: true,
          description: '验证决策建议',
        },
      ],
    },
    {
      id: 'review-010',
      name: '点击报告应展开详情',
      description: '点击审核报告应显示详情',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("AUDIT-")); if (btn) { btn.click(); return true; } return false; }' },
          description: '点击第一个报告',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待展开',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { format: 'png' },
          description: '截图展开状态',
        },
      ],
    },
  ],
};

export default ReviewPageTests;
