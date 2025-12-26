/**
 * 《备注 / Footnote》开发预览入口
 * 
 * 独立的资源预览系统入口
 * 启动方式: npm run preview
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game.config';

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
    width: 1080,  // 预览工具使用更大的宽度
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
      console.log('[Footnote Preview] 预览工具启动中...');
    },
    postBoot: (game) => {
      console.log('[Footnote Preview] 预览工具已就绪');
      console.log('[Footnote Preview] 支持的预览类型:');
      console.log('  - scene: 场景预览 (Prefab模式)');
      console.log('  - object: 物件预览 (碰撞/交互/动画)');
      console.log('  - character: 角色预览');
      console.log('  - animation: 动画预览');
      console.log('  - ui: UI预览 (完整界面)');
      console.log('  - effect: 特效预览');
      console.log('  - audio: 音频预览');
      console.log('  - card: 卡片预览');
      console.log('  - dialogue: 对话预览');
      console.log('[Footnote Preview] URL参数快速跳转: ?preview=scene');
      
      // 开发模式下暴露游戏实例
      if (import.meta.env.DEV) {
        (window as any).__PREVIEW_GAME__ = game;
      }
    },
  },
};

// 启动预览
const game = new Phaser.Game(config);

// 处理页面可见性变化
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

export { game };

