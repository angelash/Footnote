import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* 测试并行执行 */
  fullyParallel: true,
  
  /* CI环境禁止retry */
  forbidOnly: !!process.env.CI,
  
  /* CI环境retry次数 */
  retries: process.env.CI ? 2 : 0,
  
  /* 并行工作进程数 */
  workers: process.env.CI ? 1 : undefined,
  
  /* 报告器 */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  
  /* 全局配置 */
  use: {
    /* 基础URL */
    baseURL: 'http://localhost:5173',
    
    /* 追踪信息 */
    trace: 'on-first-retry',
    
    /* 截图 */
    screenshot: 'only-on-failure',
    
    /* 视频 */
    video: 'on-first-retry',
  },

  /* 项目配置 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    
    /* 回归测试项目 */
    {
      name: 'regression',
      use: { 
        ...devices['Desktop Chrome'],
        screenshot: 'on',
      },
      testMatch: /regression.*\.spec\.ts/,
    },
  ],

  /* 开发服务器 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

