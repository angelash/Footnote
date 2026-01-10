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
      name: '审查面板应显示',
      description: '页面应显示审查面板',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".review-page, .review-panel") !== null' },
          expected: true,
          description: '验证审查面板存在',
        },
      ],
    },
  ],
};

export default ReviewPageTests;
