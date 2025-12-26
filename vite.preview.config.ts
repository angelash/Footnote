/**
 * Vite 预览模式配置
 * 
 * 用于开发预览工具的独立构建配置
 */

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
      '@/config': resolve(__dirname, 'src/config'),
    },
  },

  // 开发服务器
  server: {
    port: 5174, // 使用不同端口
    host: true,
    open: '/preview.html',
  },

  // 构建配置
  build: {
    target: 'es2020',
    outDir: 'dist-preview',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        preview: resolve(__dirname, 'preview.html'),
      },
    },
  },

  // 优化依赖
  optimizeDeps: {
    include: ['phaser', 'yaml'],
  },

  // 定义全局常量
  define: {
    __DEV__: JSON.stringify(true),
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  // 资源处理
  assetsInclude: ['**/*.yaml', '**/*.yml'],
});

