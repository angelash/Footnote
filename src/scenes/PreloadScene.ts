/**
 * 预加载场景
 * 负责加载游戏所有资源
 */
import Phaser from 'phaser';
import { SCENES } from '@/config/game.config';
import { PIXEL_IMAGE_ASSETS, PIXEL_SPRITESHEETS } from '@/data/pixelAssets';

export class PreloadScene extends Phaser.Scene {
  private _loadingBar!: Phaser.GameObjects.Graphics;
  private _progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  preload(): void {
    this._createLoadingUI();
    this._setupLoadingEvents();
    this._loadAssets();
  }

  create(): void {
    console.log('[PreloadScene] 资源加载完成');

    // 隐藏HTML加载屏幕
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }

    // TODO: 初始化全局系统
    // - WorldState
    // - SaveManager
    // - NarrativeEngine

    // 跳转到菜单场景
    this.scene.start(SCENES.MENU);
  }

  private _createLoadingUI(): void {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 加载条背景
    this._loadingBar = this.add.graphics();
    this._loadingBar.fillStyle(0x1E1E24, 1);
    this._loadingBar.fillRect(centerX - 150, centerY, 300, 4);

    // 加载条进度
    this._progressBar = this.add.graphics();
  }

  private _setupLoadingEvents(): void {
    // 更新HTML加载进度
    const progressElement = document.getElementById('loading-progress');
    const textElement = document.getElementById('loading-text');

    this.load.on('progress', (value: number) => {
      // 更新Phaser加载条
      const { width, height } = this.scale;
      const centerX = width / 2;
      const centerY = height / 2;

      this._progressBar.clear();
      this._progressBar.fillStyle(0x00FFAA, 1);
      this._progressBar.fillRect(centerX - 150, centerY, 300 * value, 4);

      // 更新HTML加载条
      if (progressElement) {
        progressElement.style.width = `${Math.floor(value * 100)}%`;
      }
    });

    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      if (textElement) {
        textElement.textContent = `正在加载: ${file.key}`;
      }
    });

    this.load.on('complete', () => {
      if (textElement) {
        textElement.textContent = '加载完成';
      }
    });
  }

  private _loadAssets(): void {
    // ===== 图片资源 =====
    this._loadImages();

    // ===== 音频资源 =====
    this._loadAudio();

    // ===== 数据文件 =====
    this._loadData();

    // ===== 字体 =====
    // 字体通过CSS加载，这里只需等待
  }

  private _loadImages(): void {
    // 角色立绘
    // this.load.svg('char_cenhui', 'assets/images/characters/portraits/char_cenhui.svg');
    // this.load.svg('char_gulin', 'assets/images/characters/portraits/char_gulin.svg');
    // ... 其他角色

    // 背景场景
    // this.load.svg('bg_c0z1', 'assets/images/backgrounds/c0/bg_c0z1.svg');
    // ... 其他背景

    // UI元素
    // this.load.svg('ui_dialogue_box', 'assets/images/ui/panels/dialogue_box.svg');
    // this.load.svg('ui_card_template', 'assets/images/ui/cards/card_template.svg');
    // ... 其他UI

    // 临时占位：创建一些基础几何图形作为占位符
    this._createPlaceholders();

    // ===== 像素PNG资源（配置化场景会用到）=====
    Object.entries(PIXEL_IMAGE_ASSETS).forEach(([key, url]) => {
      this.load.image(key, url);
    });
    Object.entries(PIXEL_SPRITESHEETS).forEach(([key, sheet]) => {
      this.load.spritesheet(key, sheet.url, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    });
  }

  private _loadAudio(): void {
    // 背景音乐
    // this.load.audio('bgm_main', 'assets/audio/bgm/main.mp3');

    // 音效
    // this.load.audio('sfx_click', 'assets/audio/sfx/click.mp3');
    // this.load.audio('sfx_card_collect', 'assets/audio/sfx/card_collect.mp3');
    // this.load.audio('sfx_depth_activate', 'assets/audio/sfx/depth_activate.mp3');
  }

  private _loadData(): void {
    // 对话数据
    // this.load.yaml('dialogues_c0', 'assets/data/dialogues/c0.yaml');
    // this.load.yaml('dialogues_c1', 'assets/data/dialogues/c1.yaml');
    // ... 其他章节

    // 卡片数据
    // this.load.json('cards', 'assets/data/cards.json');

    // Zone数据
    // this.load.yaml('zones', 'assets/data/zones.yaml');

    // 伏笔数据
    // this.load.yaml('foreshadows', 'assets/data/foreshadows.yaml');

    // 角色数据
    // this.load.yaml('characters', 'assets/data/characters.yaml');
  }

  private _createPlaceholders(): void {
    // 开发阶段：创建程序化占位图形
    // 这些将在美术资源就绪后替换

    const graphics = this.make.graphics({ x: 0, y: 0 });

    // 占位背景
    graphics.fillStyle(0x0A0A0F, 1);
    graphics.fillRect(0, 0, 750, 1334);
    graphics.generateTexture('placeholder_bg', 750, 1334);

    // 占位角色
    graphics.clear();
    graphics.fillStyle(0x4A9EFF, 1);
    graphics.fillCircle(32, 32, 32);
    graphics.generateTexture('placeholder_char', 64, 64);

    // 占位UI按钮
    graphics.clear();
    graphics.fillStyle(0x1E1E24, 1);
    graphics.fillRoundedRect(0, 0, 200, 60, 8);
    graphics.lineStyle(2, 0x00FFAA, 1);
    graphics.strokeRoundedRect(0, 0, 200, 60, 8);
    graphics.generateTexture('placeholder_button', 200, 60);

    graphics.destroy();
  }
}

