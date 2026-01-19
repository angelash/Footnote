/**
 * 启动场景
 * 负责基础检查和最小资源加载
 */
import Phaser from 'phaser';
import { SCENES } from '@/config/game.config';
import { createLogger } from '@/utils/Logger';

const logger = createLogger('BootScene');

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload(): void {
    // 加载最小必需资源（加载界面用）
    // 这里可以加载logo等
  }

  create(): void {
    logger.info('启动检查...');

    // 检查浏览器支持
    this._checkBrowserSupport();

    // 检查存储支持
    this._checkStorageSupport();

    // 设置游戏全局配置
    this._setupGlobalConfig();

    // 跳转到预加载场景
    this.scene.start(SCENES.PRELOAD);
  }

  private _checkBrowserSupport(): void {
    // 检查WebGL支持
    if (!this.game.device.features.webGL) {
      logger.warn('WebGL不可用，将使用Canvas渲染');
    }

    // 检查音频支持
    if (!this.game.device.audio.webAudio) {
      logger.warn('WebAudio不可用，音频功能可能受限');
    }

    // 检查触摸支持
    if (this.game.device.input.touch) {
      logger.info('触摸设备');
    }
  }

  private _checkStorageSupport(): void {
    // 检查IndexedDB支持
    if (!window.indexedDB) {
      logger.error('IndexedDB不可用，存档功能将无法使用');
      // 可以考虑回退到localStorage
    }

    // 检查localStorage支持
    try {
      localStorage.setItem('__test__', '1');
      localStorage.removeItem('__test__');
    } catch (e) {
      logger.warn('localStorage不可用');
    }
  }

  private _setupGlobalConfig(): void {
    // 设置游戏暂停行为
    this.game.events.on('blur', () => {
      logger.debug('游戏失去焦点');
    });

    this.game.events.on('focus', () => {
      logger.debug('游戏获得焦点');
    });

    // 开发模式下的调试工具
    if (import.meta.env.DEV) {
      this._setupDebugTools();
    }
  }

  private _setupDebugTools(): void {
    // 键盘快捷键
    this.input.keyboard?.on('keydown-F1', () => {
      logger.debug('游戏状态:', this.game);
    });

    this.input.keyboard?.on('keydown-F2', () => {
      // 切换FPS显示
      this.game.config.fps.forceSetTimeOut = !this.game.config.fps.forceSetTimeOut;
    });
  }
}
