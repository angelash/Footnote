/**
 * Lighthouse CI 配置
 * 性能自动化测试与基线验证
 * @see https://github.com/GoogleChrome/lighthouse-ci
 */
module.exports = {
  ci: {
    // 收集配置
    collect: {
      // 启动本地服务器
      startServerCommand: 'npm run serve',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      
      // 测试 URL
      url: [
        'http://localhost:4173/', // 预览服务器默认端口
      ],
      
      // 运行次数（取中位数）
      numberOfRuns: 3,
      
      // Lighthouse 配置
      settings: {
        // 模拟 4G 网络（符合 QA Bible 门禁要求）
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 150,           // 4G RTT
          throughputKbps: 1638, // 4G 下行带宽
          cpuSlowdownMultiplier: 4, // CPU 限速（模拟中端设备）
        },
        
        // 设备模拟
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          disabled: false,
        },
        
        // 只收集性能相关审计
        onlyCategories: ['performance'],
        
        // 跳过不相关的审计
        skipAudits: [
          'uses-http2',           // 本地测试无需
          'uses-long-cache-ttl',  // 本地测试无需
        ],
      },
    },
    
    // 断言配置（性能门禁）
    assert: {
      assertions: {
        // === 核心 Web Vitals ===
        
        // First Contentful Paint < 3s（QA Bible 门禁）
        'first-contentful-paint': ['error', { maxNumericValue: 3000 }],
        
        // Largest Contentful Paint < 4s
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        
        // Total Blocking Time < 300ms（交互响应门禁）
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Cumulative Layout Shift < 0.1
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        
        // Speed Index < 4s
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        
        // === 性能分数 ===
        
        // 总体性能分数 >= 70（允许游戏场景有一定开销）
        'categories:performance': ['warn', { minScore: 0.7 }],
        
        // === 资源优化 ===
        
        // 未使用的 JavaScript < 500KB
        'unused-javascript': ['warn', { maxNumericValue: 512000 }],
        
        // 主线程工作 < 4s
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }],
        
        // JavaScript 执行时间 < 3s
        'bootup-time': ['warn', { maxNumericValue: 3000 }],
      },
    },
    
    // 上传配置（可选：上传到 LHCI 服务器）
    upload: {
      // 临时存储（本地文件）
      target: 'temporary-public-storage',
      
      // 或使用文件系统存储
      // target: 'filesystem',
      // outputDir: './lighthouse-reports',
    },
  },
};
