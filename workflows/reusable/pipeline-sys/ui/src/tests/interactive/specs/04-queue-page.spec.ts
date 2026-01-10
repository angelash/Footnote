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
      name: '队列面板应显示',
      description: '页面应显示队列面板',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".queue-page, .queue-panel") !== null' },
          expected: true,
          description: '验证队列面板存在',
        },
      ],
    },
  ],
};

export default QueuePageTests;
