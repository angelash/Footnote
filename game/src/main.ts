/**
 * 《备注 / Footnote》游戏入口
 *
 * 叙事驱动的2D系统策略冒险H5游戏
 * 核心体验：你生活在一个二维世界，但你能短暂触碰更高维度——代价是：世界会记住你做过的一切。
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game.config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { createLogger, LogLevel, configureLogger } from './utils/Logger';

// 初始化 Logger
if (import.meta.env.PROD) {
  configureLogger({ level: LogLevel.WARN });
}

const logger = createLogger('Main');

// 扩展 Window 接口以支持调试变量
declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Window {
    __GAME__?: Phaser.Game;
    __DEBUG_STATE__?: unknown;
  }
}

// 场景注册
const scenes = [BootScene, PreloadScene, MenuScene, GameScene];

// 创建游戏配置
const config: Phaser.Types.Core.GameConfig = {
  ...GAME_CONFIG,
  scene: scenes,
  parent: 'game-container',

  // 渲染配置
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },

  // 缩放配置（适配移动端）
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 750,
    height: 1334,
    min: {
      width: 320,
      height: 568,
    },
    max: {
      width: 750,
      height: 1624,
    },
  },

  // 物理引擎（如需要）
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: import.meta.env.DEV,
    },
  },

  // 音频配置
  audio: {
    disableWebAudio: false,
  },

  // DOM元素支持（用于UI覆盖层）
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
      logger.info('游戏初始化中...');
    },
    postBoot: (game) => {
      logger.info('游戏启动完成');

      // 开发模式下暴露游戏实例
      if (import.meta.env.DEV) {
        window.__GAME__ = game;
        window.__DEBUG_STATE__ = null; // 将由WorldState设置
      }
    },
  },
};

// 启动游戏
const game = new Phaser.Game(config);

// 焦点状态管理器
// 统一处理页面可见性和窗口焦点，防止重复暂停/恢复导致的卡死
const focusManager = {
  _isPaused: false,
  _debounceTimer: null as ReturnType<typeof setTimeout> | null,
  _pausedScenes: new Set<string>(),

  /**
   * 暂停游戏（带防抖）
   * 只在确实需要暂停且未暂停时执行
   */
  pause(): void {
    // 清除之前的恢复定时器
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }

    if (this._isPaused) {
      logger.debug('游戏已暂停，跳过重复暂停');
      return;
    }

    this._isPaused = true;
    this._pausedScenes.clear();

    // 暂停所有活跃场景
    game.scene.scenes.forEach((scene) => {
      try {
        // 只暂停活跃且未暂停的场景
        if (scene.scene.isActive() && !scene.scene.isPaused()) {
          scene.scene.pause();
          this._pausedScenes.add(scene.scene.key);
          logger.debug(`场景暂停: ${scene.scene.key}`);
        }
      } catch (error) {
        logger.warn(`暂停场景失败: ${scene.scene.key}`, error);
      }
    });

    // 暂停所有音频
    try {
      game.sound.pauseAll();
    } catch (error) {
      logger.warn('暂停音频失败', error);
    }

    logger.info('游戏已暂停');
  },

  /**
   * 恢复游戏（带防抖延迟）
   * 延迟执行以避免快速切换导致的状态混乱
   */
  resume(): void {
    // 清除之前的恢复定时器
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    // 延迟 100ms 恢复，避免快速切换导致的问题
    this._debounceTimer = setTimeout(() => {
      if (!this._isPaused) {
        logger.debug('游戏未暂停，跳过恢复');
        return;
      }

      this._isPaused = false;

      // 只恢复之前由 focusManager 暂停的场景
      this._pausedScenes.forEach((sceneKey) => {
        try {
          const scene = game.scene.getScene(sceneKey);
          if (scene && scene.scene.isPaused()) {
            scene.scene.resume();
            logger.debug(`场景恢复: ${sceneKey}`);
          }
        } catch (error) {
          logger.warn(`恢复场景失败: ${sceneKey}`, error);
        }
      });

      this._pausedScenes.clear();

      // 恢复所有音频
      try {
        game.sound.resumeAll();
      } catch (error) {
        logger.warn('恢复音频失败', error);
      }

      logger.info('游戏已恢复');
    }, 100);
  },
};

// 处理页面可见性变化（省电 + 防止后台运行）
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    focusManager.pause();
  } else {
    focusManager.resume();
  }
});

// 处理窗口失焦（用户切换到其他窗口）
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

// PWA Service Worker 注册
if ('serviceWorker' in navigator) {
  const pwaLogger = createLogger('PWA');
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      pwaLogger.info('Service Worker 注册成功:', registration.scope);

      // 检查更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              pwaLogger.info('发现新版本，刷新页面以更新');
              // 可以在这里显示更新提示
            }
          });
        }
      });
    } catch (error) {
      pwaLogger.warn('Service Worker 注册失败:', error);
    }
  });
}

export { game };
