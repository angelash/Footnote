/**
 * 01-boot.spec.ts
 * 游戏启动和加载测试
 * 
 * 测试内容：
 * - 页面加载
 * - 加载屏幕显示
 * - 资源加载进度
 * - 游戏初始化完成
 * - Canvas 渲染正常
 */

import { TestConfig, GameScripts } from '../config';
import { GameHelpers } from '../helpers/game-helpers';
import { createAssertions } from '../helpers/assertions';

// MCP 服务器标识
const MCP_SERVER = 'user-chrome-devtools';

/**
 * 测试套件：游戏启动和加载
 */
export const BootTests = {
  name: '游戏启动和加载测试',
  
  tests: [
    {
      id: 'boot-001',
      name: '页面应正确加载',
      description: '验证游戏页面可以正常访问和加载',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: TestConfig.gameUrl },
          description: '导航到游戏页面',
        },
        {
          action: 'snapshot',
          tool: 'take_snapshot',
          params: {},
          description: '获取页面快照',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.title' },
          expected: '备注 / Footnote',
          description: '验证页面标题',
        },
      ],
    },

    {
      id: 'boot-002',
      name: '加载屏幕应显示',
      description: '验证加载屏幕在游戏启动时正确显示',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: TestConfig.gameUrl },
          description: '导航到游戏页面',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const loadingScreen = document.getElementById('loading-screen');
              return loadingScreen !== null;
            }`,
          },
          expected: true,
          description: '验证加载屏幕元素存在',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const title = document.querySelector('.loading-title');
              return title ? title.textContent : null;
            }`,
          },
          expected: '备 注',
          description: '验证加载屏幕标题',
        },
      ],
    },

    {
      id: 'boot-003',
      name: '资源加载应完成',
      description: '验证游戏资源能够完全加载',
      timeout: 30000,
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: TestConfig.gameUrl },
          description: '导航到游戏页面',
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: {
            function: GameHelpers.getLoadingCompleteScript(),
          },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
          description: '等待加载完成',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const loadingScreen = document.getElementById('loading-screen');
              return loadingScreen && loadingScreen.classList.contains('hidden');
            }`,
          },
          expected: true,
          description: '验证加载屏幕已隐藏',
        },
      ],
    },

    {
      id: 'boot-004',
      name: 'Canvas 应正确渲染',
      description: '验证 Phaser 游戏 Canvas 正确创建和渲染',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: TestConfig.gameUrl },
          description: '导航到游戏页面',
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
          description: '等待加载完成',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const canvas = document.querySelector('${TestConfig.canvas.selector}');
              return canvas !== null;
            }`,
          },
          expected: true,
          description: '验证 Canvas 元素存在',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getCanvasSizeScript() },
          validate: (result: { width: number; height: number } | null) => {
            return result !== null && result.width > 0 && result.height > 0;
          },
          description: '验证 Canvas 尺寸正常',
        },
      ],
    },

    {
      id: 'boot-005',
      name: 'Phaser 游戏实例应创建',
      description: '验证 Phaser 游戏实例正确创建',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: TestConfig.gameUrl },
          description: '导航到游戏页面',
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
          description: '等待加载完成',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              return game !== undefined && game !== null;
            }`,
          },
          expected: true,
          description: '验证 Phaser 游戏实例存在',
        },
      ],
    },

    {
      id: 'boot-006',
      name: '应进入主菜单场景',
      description: '验证游戏启动后进入主菜单场景',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: TestConfig.gameUrl },
          description: '导航到游戏页面',
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
          description: '等待加载完成',
        },
        {
          action: 'sleep',
          duration: 2000,
          description: '等待场景切换动画',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'MenuScene',
          description: '验证当前场景为 MenuScene',
        },
      ],
    },

    {
      id: 'boot-007',
      name: '无 JavaScript 错误',
      description: '验证游戏启动过程中没有 JS 错误',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: TestConfig.gameUrl },
          description: '导航到游戏页面',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              // 收集错误（需要提前注入错误收集器）
              return window.__JS_ERRORS__ || [];
            }`,
          },
          validate: (errors: string[]) => errors.length === 0,
          description: '验证没有 JS 错误',
        },
      ],
    },

    {
      id: 'boot-008',
      name: '首屏加载时间应小于 5 秒',
      description: '验证游戏首屏加载性能',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => window.__LOAD_START_TIME__ = Date.now()`,
          },
          description: '记录开始时间',
        },
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: TestConfig.gameUrl },
          description: '导航到游戏页面',
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 50,
          retryInterval: 100,
          description: '等待加载完成',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => Date.now() - (window.__LOAD_START_TIME__ || Date.now())`,
          },
          validate: (loadTime: number) => loadTime < 5000,
          description: '验证加载时间小于 5 秒',
        },
      ],
    },

    {
      id: 'boot-009',
      name: '刷新后应正确重新加载',
      description: '验证页面刷新后游戏能正确重新加载',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: TestConfig.gameUrl },
          description: '导航到游戏页面',
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
          description: '等待加载完成',
        },
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'reload' },
          description: '刷新页面',
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
          description: '等待重新加载完成',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'MenuScene',
          description: '验证刷新后进入主菜单',
        },
      ],
    },

    {
      id: 'boot-010',
      name: '截图验证',
      description: '截图验证游戏启动画面',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: TestConfig.gameUrl },
          description: '导航到游戏页面',
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
          description: '等待加载完成',
        },
        {
          action: 'sleep',
          duration: 1000,
          description: '等待渲染稳定',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/boot-menu.png`,
          },
          description: '截图保存',
        },
      ],
    },
  ],
};

export default BootTests;
