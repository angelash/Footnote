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
  // 目标浏览器与 browserslist 对齐: iOS >= 14, Android >= 10, Chrome >= 90, Safari >= 14
  // es2020 特性在这些浏览器中均已支持
  build: {
    target: ['es2020', 'safari14', 'chrome90'],
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
        manualChunks: (id) => {
          // Phaser 单独分包（最大的依赖）
          if (id.includes('node_modules/phaser')) {
            return 'phaser';
          }
          // 第三方库
          if (id.includes('node_modules')) {
            if (id.includes('idb') || id.includes('yaml')) {
              return 'vendor';
            }
          }
          // 按章节分包场景配置
          if (id.includes('src/data/scenes/c0')) {
            return 'scenes-c0';
          }
          if (id.includes('src/data/scenes/c1')) {
            return 'scenes-c1';
          }
          if (id.includes('src/data/scenes/c2')) {
            return 'scenes-c2';
          }
          if (id.includes('src/data/scenes/c3')) {
            return 'scenes-c3';
          }
          if (id.includes('src/data/scenes/c4')) {
            return 'scenes-c4';
          }
          if (id.includes('src/data/scenes/c5')) {
            return 'scenes-c5';
          }
          if (id.includes('src/data/scenes/cf') || id.includes('src/data/scenes/rv')) {
            return 'scenes-finale';
          }
          // 对话数据分包
          if (id.includes('src/data/dialogues')) {
            return 'dialogues';
          }
          // 系统模块分包
          if (id.includes('src/systems/ui')) {
            return 'systems-ui';
          }
          if (id.includes('src/systems/game')) {
            return 'systems-game';
          }
        },
      },
    },
    // 资源内联阈值 (4kb)
    assetsInlineLimit: 4096,
    // 提高chunk大小警告阈值（Phaser本身就很大）
    chunkSizeWarningLimit: 1500,
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

