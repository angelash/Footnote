import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    /* 全局API */
    globals: true,
    
    /* 环境 */
    environment: 'jsdom',
    
    /* 测试文件 */
    include: ['src/**/*.test.ts', 'tests/unit/**/*.ts'],
    
    /* 排除 */
    exclude: ['node_modules', 'dist', 'tests/e2e'],
    
    /* 覆盖率 */
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'src/types/',
        '**/*.d.ts',
      ],
      thresholds: {
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },
    
    /* 设置文件 */
    setupFiles: ['./tests/setup.ts'],
    
    /* 超时 */
    testTimeout: 10000,
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/scenes': resolve(__dirname, 'src/scenes'),
      '@/systems': resolve(__dirname, 'src/systems'),
      '@/entities': resolve(__dirname, 'src/entities'),
      '@/data': resolve(__dirname, 'src/data'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types'),
    },
  },
});

