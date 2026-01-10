/**
 * Pipeline UI ChromeMCP 交互测试配置
 */

export const TestConfig = {
  // UI URL
  baseUrl: 'http://localhost:5173',

  // 超时设置（毫秒）
  timeouts: {
    pageLoad: 10000,
    navigation: 3000,
    animation: 500,
    apiCall: 5000,
  },

  // 页面路由
  routes: {
    task: '/task',
    runs: '/runs',
    queue: '/queue',
    review: '/review',
  },

  // 导航链接选择器
  selectors: {
    nav: '.app-nav',
    navBrand: '.nav-brand',
    navLinks: '.nav-links a',
    main: '.app-main',
    taskLink: 'a[href="/task"]',
    runsLink: 'a[href="/runs"]',
    queueLink: 'a[href="/queue"]',
    reviewLink: 'a[href="/review"]',
  },
};

// MCP 服务器标识
export const MCP_SERVER = 'user-chrome-devtools';

export default TestConfig;
