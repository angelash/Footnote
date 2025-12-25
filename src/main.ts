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

// 场景注册
const scenes = [
  BootScene,
  PreloadScene,
  MenuScene,
  GameScene,
];

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
      console.log('[Footnote] 游戏初始化中...');
    },
    postBoot: (game) => {
      console.log('[Footnote] 游戏启动完成');
      
      // 开发模式下暴露游戏实例
      if (import.meta.env.DEV) {
        (window as any).__GAME__ = game;
        (window as any).__DEBUG_STATE__ = null; // 将由WorldState设置
      }
    },
  },
};

// 启动游戏
const game = new Phaser.Game(config);

// 处理页面可见性变化（省电）
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.scene.scenes.forEach(scene => {
      if (scene.scene.isActive()) {
        scene.scene.pause();
      }
    });
  } else {
    game.scene.scenes.forEach(scene => {
      if (scene.scene.isPaused()) {
        scene.scene.resume();
      }
    });
  }
});

// 处理窗口失焦
window.addEventListener('blur', () => {
  game.sound.pauseAll();
});

window.addEventListener('focus', () => {
  game.sound.resumeAll();
});

// 防止iOS橡皮筋效果
document.body.addEventListener('touchmove', (e) => {
  if (e.target === document.body) {
    e.preventDefault();
  }
}, { passive: false });

// PWA Service Worker 注册
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA] Service Worker 注册成功:', registration.scope);
      
      // 检查更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] 发现新版本，刷新页面以更新');
              // 可以在这里显示更新提示
            }
          });
        }
      });
    } catch (error) {
      console.warn('[PWA] Service Worker 注册失败:', error);
    }
  });
}

export { game };

