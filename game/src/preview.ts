/**
 * 《备注 / Footnote》开发预览入口
 *
 * 独立的资源预览系统入口
 * 启动方式: npm run preview
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game.config';
import { createLogger } from './utils/Logger';

const logger = createLogger('Preview');

// 扩展 Window 接口以支持调试变量
declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Window {
    __PREVIEW_GAME__?: Phaser.Game;
  }
}

// 预览场景导入
import { DevPreviewScene } from './scenes/preview/DevPreviewScene';
import { ScenePreviewScene } from './scenes/preview/ScenePreviewScene';
import { ObjectPreviewScene } from './scenes/preview/ObjectPreviewScene';
import { CharacterPreviewScene } from './scenes/preview/CharacterPreviewScene';
import { AnimationPreviewScene } from './scenes/preview/AnimationPreviewScene';
import { UIPreviewScene } from './scenes/preview/UIPreviewScene';
import { EffectPreviewScene } from './scenes/preview/EffectPreviewScene';
import { AudioPreviewScene } from './scenes/preview/AudioPreviewScene';
import { CardPreviewScene } from './scenes/preview/CardPreviewScene';
import { DialoguePreviewScene } from './scenes/preview/DialoguePreviewScene';

// 预览场景注册
const previewScenes = [
  DevPreviewScene,
  ScenePreviewScene,
  ObjectPreviewScene,
  CharacterPreviewScene,
  AnimationPreviewScene,
  UIPreviewScene,
  EffectPreviewScene,
  AudioPreviewScene,
  CardPreviewScene,
  DialoguePreviewScene,
];

// 创建预览游戏配置
const config: Phaser.Types.Core.GameConfig = {
  ...GAME_CONFIG,
  scene: previewScenes,
  parent: 'game-container',

  // 渲染配置
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },

  // 缩放配置（预览工具使用更大尺寸以便查看）
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080, // 预览工具使用更大的宽度
    height: 1920, // 预览工具使用更大的高度
    min: {
      width: 640,
      height: 960,
    },
    max: {
      width: 1440,
      height: 2560,
    },
  },

  // 音频配置
  audio: {
    disableWebAudio: false,
  },

  // DOM元素支持
  dom: {
    createContainer: true,
  },

  // 输入配置
  input: {
    activePointers: 3,
    touch: {
      target: null,
      capture: true,
    },
  },

  // 回调
  callbacks: {
    preBoot: () => {
      logger.info('预览工具启动中...');
    },
    postBoot: (game) => {
      logger.info('预览工具已就绪');
      logger.info('支持的预览类型:');
      logger.info('  - scene: 场景预览 (Prefab模式)');
      logger.info('  - object: 物件预览 (碰撞/交互/动画)');
      logger.info('  - character: 角色预览');
      logger.info('  - animation: 动画预览');
      logger.info('  - ui: UI预览 (完整界面)');
      logger.info('  - effect: 特效预览');
      logger.info('  - audio: 音频预览');
      logger.info('  - card: 卡片预览');
      logger.info('  - dialogue: 对话预览');
      logger.info('URL参数快速跳转: ?preview=scene');

      // 开发模式下暴露游戏实例
      if (import.meta.env.DEV) {
        window.__PREVIEW_GAME__ = game;
      }
    },
  },
};

// 启动预览
const game = new Phaser.Game(config);

// 焦点状态管理器（与 main.ts 同步）
// 统一处理页面可见性和窗口焦点，防止重复暂停/恢复导致的卡死
const focusManager = {
  _isPaused: false,
  _debounceTimer: null as ReturnType<typeof setTimeout> | null,
  _pausedScenes: new Set<string>(),

  pause(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }

    if (this._isPaused) return;
    this._isPaused = true;
    this._pausedScenes.clear();

    game.scene.scenes.forEach((scene) => {
      try {
        if (scene.scene.isActive() && !scene.scene.isPaused()) {
          scene.scene.pause();
          this._pausedScenes.add(scene.scene.key);
        }
      } catch (error) {
        logger.warn(`暂停场景失败: ${scene.scene.key}`, error);
      }
    });

    try {
      game.sound.pauseAll();
    } catch (error) {
      logger.warn('暂停音频失败', error);
    }
  },

  resume(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    this._debounceTimer = setTimeout(() => {
      if (!this._isPaused) return;
      this._isPaused = false;

      this._pausedScenes.forEach((sceneKey) => {
        try {
          const scene = game.scene.getScene(sceneKey);
          if (scene && scene.scene.isPaused()) {
            scene.scene.resume();
          }
        } catch (error) {
          logger.warn(`恢复场景失败: ${sceneKey}`, error);
        }
      });

      this._pausedScenes.clear();

      try {
        game.sound.resumeAll();
      } catch (error) {
        logger.warn('恢复音频失败', error);
      }
    }, 100);
  },
};

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    focusManager.pause();
  } else {
    focusManager.resume();
  }
});

// 处理窗口失焦
window.addEventListener('blur', () => {
  focusManager.pause();
});

window.addEventListener('focus', () => {
  focusManager.resume();
});

// 防止iOS橡皮筋效果
document.body.addEventListener(
  'touchmove',
  (e) => {
    if (e.target === document.body) {
      e.preventDefault();
    }
  },
  { passive: false }
);

export { game };
