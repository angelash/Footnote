import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // 基础路径
  base: './',

  // 路径别名
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

  // 开发服务器
  server: {
    port: 5173,
    host: true, // 允许局域网访问
    open: true,
  },

  // 构建配置
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          vendor: ['idb', 'yaml'],
        },
      },
    },
    // 资源内联阈值 (4kb)
    assetsInlineLimit: 4096,
  },

  // 优化依赖
  optimizeDeps: {
    include: ['phaser', 'idb', 'yaml'],
  },

  // 定义全局常量
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  // 资源处理
  assetsInclude: ['**/*.yaml', '**/*.yml'],
});

