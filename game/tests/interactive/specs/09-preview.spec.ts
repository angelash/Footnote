/**
 * 09-preview.spec.ts
 * 预览场景测试
 * 
 * 测试内容：
 * - DevPreviewScene
 * - CardPreviewScene
 * - CharacterPreviewScene
 * - DialoguePreviewScene
 * - UIPreviewScene
 * - ScenePreviewScene
 * - AnimationPreviewScene
 * - AudioPreviewScene
 * - EffectPreviewScene
 */

import { TestConfig, GameScripts } from '../config';
import { GameHelpers } from '../helpers/game-helpers';

const MCP_SERVER = 'user-chrome-devtools';

// 预览场景 URL
const PREVIEW_URLS = {
  dev: `${TestConfig.gameUrl}?preview=dev`,
  card: `${TestConfig.gameUrl}?preview=card`,
  character: `${TestConfig.gameUrl}?preview=character`,
  dialogue: `${TestConfig.gameUrl}?preview=dialogue`,
  ui: `${TestConfig.gameUrl}?preview=ui`,
  scene: `${TestConfig.gameUrl}?preview=scene`,
  animation: `${TestConfig.gameUrl}?preview=animation`,
  audio: `${TestConfig.gameUrl}?preview=audio`,
  effect: `${TestConfig.gameUrl}?preview=effect`,
  object: `${TestConfig.gameUrl}?preview=object`,
};

/**
 * 测试套件：预览场景
 */
export const PreviewTests = {
  name: '预览场景测试',

  tests: [
    // ==================== DevPreviewScene ====================
    {
      id: 'preview-001',
      name: 'DevPreviewScene 应能加载',
      description: '验证开发预览场景正确加载',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.dev },
          description: '导航到 DevPreview',
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
          description: '等待加载',
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'DevPreviewScene',
          description: '验证场景',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/preview-dev.png`,
          },
          description: '截图验证',
        },
      ],
    },

    {
      id: 'preview-002',
      name: 'DevPreviewScene 应显示预览菜单',
      description: '验证开发预览显示所有可用的预览选项',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.dev },
          description: '导航到 DevPreview',
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('DevPreviewScene');
              if (!scene) return null;
              return scene.getPreviewOptions ? scene.getPreviewOptions() : [];
            }`,
          },
          validate: (options: string[] | null) => options !== null && options.length > 0,
          description: '验证有预览选项',
        },
      ],
    },

    // ==================== CardPreviewScene ====================
    {
      id: 'preview-003',
      name: 'CardPreviewScene 应能加载',
      description: '验证卡片预览场景正确加载',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.card },
          description: '导航到 CardPreview',
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'CardPreviewScene',
          description: '验证场景',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/preview-card.png`,
          },
          description: '截图验证',
        },
      ],
    },

    {
      id: 'preview-004',
      name: 'CardPreviewScene 应显示卡片',
      description: '验证卡片预览显示卡片内容',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.card },
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('CardPreviewScene');
              if (!scene) return null;
              return scene.getDisplayedCards ? scene.getDisplayedCards().length : 0;
            }`,
          },
          validate: (count: number | null) => count !== null && count > 0,
          description: '验证显示卡片',
        },
      ],
    },

    // ==================== CharacterPreviewScene ====================
    {
      id: 'preview-005',
      name: 'CharacterPreviewScene 应能加载',
      description: '验证角色预览场景正确加载',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.character },
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'CharacterPreviewScene',
          description: '验证场景',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/preview-character.png`,
          },
          description: '截图验证',
        },
      ],
    },

    // ==================== DialoguePreviewScene ====================
    {
      id: 'preview-006',
      name: 'DialoguePreviewScene 应能加载',
      description: '验证对话预览场景正确加载',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.dialogue },
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'DialoguePreviewScene',
          description: '验证场景',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/preview-dialogue.png`,
          },
          description: '截图验证',
        },
      ],
    },

    {
      id: 'preview-007',
      name: 'DialoguePreview 应能播放对话',
      description: '验证对话预览能够播放对话',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.dialogue },
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        // 点击播放
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '按空格播放',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('DialoguePreviewScene');
              if (!scene) return false;
              return scene.isDialoguePlaying ? scene.isDialoguePlaying() : false;
            }`,
          },
          expected: true,
          description: '验证对话播放中',
        },
      ],
    },

    // ==================== UIPreviewScene ====================
    {
      id: 'preview-008',
      name: 'UIPreviewScene 应能加载',
      description: '验证 UI 预览场景正确加载',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.ui },
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'UIPreviewScene',
          description: '验证场景',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/preview-ui.png`,
          },
          description: '截图验证',
        },
      ],
    },

    // ==================== ScenePreviewScene ====================
    {
      id: 'preview-009',
      name: 'ScenePreviewScene 应能加载',
      description: '验证场景预览正确加载',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.scene },
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'ScenePreviewScene',
          description: '验证场景',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/preview-scene.png`,
          },
          description: '截图验证',
        },
      ],
    },

    // ==================== AnimationPreviewScene ====================
    {
      id: 'preview-010',
      name: 'AnimationPreviewScene 应能加载',
      description: '验证动画预览场景正确加载',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.animation },
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'AnimationPreviewScene',
          description: '验证场景',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/preview-animation.png`,
          },
          description: '截图验证',
        },
      ],
    },

    // ==================== AudioPreviewScene ====================
    {
      id: 'preview-011',
      name: 'AudioPreviewScene 应能加载',
      description: '验证音频预览场景正确加载',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.audio },
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'AudioPreviewScene',
          description: '验证场景',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/preview-audio.png`,
          },
          description: '截图验证',
        },
      ],
    },

    // ==================== EffectPreviewScene ====================
    {
      id: 'preview-012',
      name: 'EffectPreviewScene 应能加载',
      description: '验证特效预览场景正确加载',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.effect },
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'EffectPreviewScene',
          description: '验证场景',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/preview-effect.png`,
          },
          description: '截图验证',
        },
      ],
    },

    // ==================== ObjectPreviewScene ====================
    {
      id: 'preview-013',
      name: 'ObjectPreviewScene 应能加载',
      description: '验证对象预览场景正确加载',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.object },
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'ObjectPreviewScene',
          description: '验证场景',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/preview-object.png`,
          },
          description: '截图验证',
        },
      ],
    },

    // ==================== 预览场景共同功能测试 ====================
    {
      id: 'preview-014',
      name: '所有预览场景应支持 ESC 返回',
      description: '验证预览场景按 ESC 能返回主菜单或上一级',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: PREVIEW_URLS.card },
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'Escape' },
          description: '按 ESC',
        },
        {
          action: 'sleep',
          duration: 1000,
        },
        // 应该返回到 DevPreviewScene 或 MenuScene
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          validate: (scene: string | null) => {
            return scene === 'DevPreviewScene' || scene === 'MenuScene';
          },
          description: '验证返回到上一级',
        },
      ],
    },

    {
      id: 'preview-015',
      name: '预览场景应无 JS 错误',
      description: '验证所有预览场景加载时无错误',
      steps: [
        // 注入错误收集器
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              window.__JS_ERRORS__ = [];
              window.addEventListener('error', (e) => {
                window.__JS_ERRORS__.push(e.message);
              });
              return true;
            }`,
          },
          description: '注入错误收集器',
        },
        // 遍历所有预览场景
        ...Object.entries(PREVIEW_URLS).flatMap(([name, url]) => [
          {
            action: 'navigate',
            tool: 'navigate_page',
            params: { type: 'url', url },
            description: `访问 ${name} 预览`,
          },
          {
            action: 'wait',
            tool: 'evaluate_script',
            params: { function: GameHelpers.getLoadingCompleteScript() },
            waitFor: true,
            maxRetries: 30,
            retryInterval: 1000,
          },
          {
            action: 'sleep',
            duration: 1000,
          },
        ]),
        // 检查错误
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => window.__JS_ERRORS__ || []`,
          },
          validate: (errors: string[]) => errors.length === 0,
          description: '验证无 JS 错误',
        },
      ],
    },
  ],
};

export default PreviewTests;
