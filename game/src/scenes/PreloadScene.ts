/**
 * 预加载场景
 * 负责加载游戏所有资源
 */
import Phaser from 'phaser';
import { SCENES } from '@/config/game.config';
import { createLogger } from '@/utils/Logger';

const logger = createLogger('PreloadScene');
import { PIXEL_IMAGE_ASSETS, PIXEL_SPRITESHEETS } from '@/data/pixelAssets';
import {
  CHARACTER_PORTRAITS,
  SCENE_BACKGROUNDS,
  ALL_SCENE_OBJECTS,
  ALL_EFFECTS,
  ANIMATED_OBJECTS,
  WEBP_ASSET_STATS,
} from '@/data/webpAssets';
import { BGM_CONFIGS, SFX_CONFIGS, AMBIENCE_CONFIGS } from '@/data/audioConfig';

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
    logger.info('资源加载完成');

    // 创建动画
    this._createAnimations();

    // 隐藏HTML加载屏幕
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }

    // 跳转到菜单场景
    this.scene.start(SCENES.MENU);
  }

  /**
   * 创建精灵动画
   */
  private _createAnimations(): void {
    // 岑回待机动画
    if (this.textures.exists('px_sprite_cenhui_idle')) {
      this.anims.create({
        key: 'cenhui_idle',
        frames: this.anims.generateFrameNumbers('px_sprite_cenhui_idle', { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1,
      });
    }

    // 岑回行走动画
    if (this.textures.exists('px_sprite_cenhui_walk')) {
      this.anims.create({
        key: 'cenhui_walk',
        frames: this.anims.generateFrameNumbers('px_sprite_cenhui_walk', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // 顾临待机动画
    if (this.textures.exists('px_sprite_gulin_idle')) {
      this.anims.create({
        key: 'gulin_idle',
        frames: this.anims.generateFrameNumbers('px_sprite_gulin_idle', { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1,
      });
    }

    // 阿棠待机动画
    if (this.textures.exists('px_sprite_atang_idle')) {
      this.anims.create({
        key: 'atang_idle',
        frames: this.anims.generateFrameNumbers('px_sprite_atang_idle', { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1,
      });
    }

    // 幽灵待机动画
    if (this.textures.exists('px_sprite_ghost_idle')) {
      this.anims.create({
        key: 'ghost_idle',
        frames: this.anims.generateFrameNumbers('px_sprite_ghost_idle', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    // 深度感知效果
    if (this.textures.exists('px_seq_depth_perception')) {
      this.anims.create({
        key: 'fx_depth_perception',
        frames: this.anims.generateFrameNumbers('px_seq_depth_perception', { start: 0, end: 11 }),
        frameRate: 12,
        repeat: -1,
      });
    }

    // 深度介入效果
    if (this.textures.exists('px_seq_depth_intervention')) {
      this.anims.create({
        key: 'fx_depth_intervention',
        frames: this.anims.generateFrameNumbers('px_seq_depth_intervention', { start: 0, end: 11 }),
        frameRate: 16,
        repeat: 0,
      });
    }

    // 时间干预效果
    if (this.textures.exists('px_seq_time_intervention')) {
      this.anims.create({
        key: 'fx_time_intervention',
        frames: this.anims.generateFrameNumbers('px_seq_time_intervention', { start: 0, end: 11 }),
        frameRate: 12,
        repeat: 0,
      });
    }

    // 加载动画
    if (this.textures.exists('px_seq_loader')) {
      this.anims.create({
        key: 'fx_loader',
        frames: this.anims.generateFrameNumbers('px_seq_loader', { start: 0, end: 11 }),
        frameRate: 12,
        repeat: -1,
      });
    }

    // 故障效果
    if (this.textures.exists('px_seq_glitch')) {
      this.anims.create({
        key: 'fx_glitch',
        frames: this.anims.generateFrameNumbers('px_seq_glitch', { start: 0, end: 11 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // ===== WebP可动物件动画 =====
    this._createWebpAnimations();

    logger.info('动画创建完成');
  }

  /**
   * 创建WebP可动物件动画
   */
  private _createWebpAnimations(): void {
    // 台灯闪烁动画
    if (this.textures.exists('anim_lamp_flicker_frame_0')) {
      this.anims.create({
        key: 'webp_lamp_flicker',
        frames: [
          { key: 'anim_lamp_flicker_frame_0' },
          { key: 'anim_lamp_flicker_frame_1' },
          { key: 'anim_lamp_flicker_frame_2' },
          { key: 'anim_lamp_flicker_frame_3' },
        ],
        frameRate: 4,
        repeat: -1,
      });
    }

    // 油灯火焰动画
    if (this.textures.exists('anim_oil_lamp_frame_0')) {
      this.anims.create({
        key: 'webp_oil_lamp',
        frames: [
          { key: 'anim_oil_lamp_frame_0' },
          { key: 'anim_oil_lamp_frame_1' },
          { key: 'anim_oil_lamp_frame_2' },
          { key: 'anim_oil_lamp_frame_3' },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }

    // 蜡烛燃烧动画
    if (this.textures.exists('anim_candle_frame_0')) {
      this.anims.create({
        key: 'webp_candle',
        frames: [
          { key: 'anim_candle_frame_0' },
          { key: 'anim_candle_frame_1' },
          { key: 'anim_candle_frame_2' },
          { key: 'anim_candle_frame_3' },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }

    // 监视器闪烁动画
    if (this.textures.exists('anim_monitor_frame_0')) {
      this.anims.create({
        key: 'webp_monitor',
        frames: [
          { key: 'anim_monitor_frame_0' },
          { key: 'anim_monitor_frame_1' },
          { key: 'anim_monitor_frame_2' },
          { key: 'anim_monitor_frame_3' },
        ],
        frameRate: 3,
        repeat: -1,
      });
    }

    // 裂缝颤动动画
    if (this.textures.exists('anim_crack_frame_0')) {
      this.anims.create({
        key: 'webp_crack',
        frames: [
          { key: 'anim_crack_frame_0' },
          { key: 'anim_crack_frame_1' },
          { key: 'anim_crack_frame_2' },
          { key: 'anim_crack_frame_3' },
        ],
        frameRate: 2,
        repeat: -1,
      });
    }

    // 符文发光动画
    if (this.textures.exists('anim_rune_frame_0')) {
      this.anims.create({
        key: 'webp_rune',
        frames: [
          { key: 'anim_rune_frame_0' },
          { key: 'anim_rune_frame_1' },
          { key: 'anim_rune_frame_2' },
          { key: 'anim_rune_frame_3' },
        ],
        frameRate: 4,
        repeat: -1,
      });
    }

    logger.info('WebP动画创建完成');
  }

  private _createLoadingUI(): void {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 加载条背景
    this._loadingBar = this.add.graphics();
    this._loadingBar.fillStyle(0x1e1e24, 1);
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
      this._progressBar.fillStyle(0x00ffaa, 1);
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

    // ===== WebP资产（智绘AI生成）=====
    logger.info(`开始加载 ${WEBP_ASSET_STATS.total} 个WebP资产...`);

    // 角色头像
    Object.entries(CHARACTER_PORTRAITS).forEach(([key, url]) => {
      this.load.image(key, url);
    });

    // 场景背景
    Object.entries(SCENE_BACKGROUNDS).forEach(([key, url]) => {
      this.load.image(key, url);
    });

    // 场景物件
    Object.entries(ALL_SCENE_OBJECTS).forEach(([key, url]) => {
      this.load.image(key, url);
    });

    // 特效
    Object.entries(ALL_EFFECTS).forEach(([key, url]) => {
      this.load.image(key, url);
    });

    // 可动物件动画帧
    Object.entries(ANIMATED_OBJECTS).forEach(([key, anim]) => {
      anim.frames.forEach((url, index) => {
        this.load.image(`${key}_frame_${index}`, url);
      });
    });
  }

  private _loadAudio(): void {
    const totalAudio = BGM_CONFIGS.length + SFX_CONFIGS.length + AMBIENCE_CONFIGS.length;
    logger.info(`开始加载 ${totalAudio} 个音频资产...`);

    // 加载BGM
    BGM_CONFIGS.forEach((config) => {
      this.load.audio(config.id, config.file);
    });

    // 加载音效
    SFX_CONFIGS.forEach((config) => {
      this.load.audio(config.id, config.file);
    });

    // 加载环境音
    AMBIENCE_CONFIGS.forEach((config) => {
      this.load.audio(config.id, config.file);
    });
  }

  private _loadData(): void {
    // 对话数据（YAML格式）
    const dialogueFiles = [
      // 序章
      'c0_z1',
      'c0_z2',
      'c0_z3',
      'c0_z4',
      // 第1章
      'c1_z1',
      'c1_z2',
      'c1_z3',
      'c1_z4',
      'c1_z5',
      'c1_z6',
      // 第2章
      'c2_z1',
      'c2_z2',
      'c2_z3',
      'c2_z4',
      'c2_z5',
      'c2_z6',
      'c2_z7',
      // 第3章
      'c3_z1',
      'c3_z2',
      'c3_z3',
      'c3_z4',
      'c3_z5',
      'c3_z6',
      'c3_z7',
      // 第4章
      'c4_z1',
      'c4_z2',
      'c4_z3',
      'c4_z4',
      'c4_z5',
      'c4_z6',
      'c4_z7',
      'c4_z8',
      // 第5章
      'c5_z1',
      'c5_z2',
      'c5_z3',
      'c5_z4',
      'c5_z5',
      'c5_z6',
      'c5_z7',
      // 终章
      'cf_z1',
      'cf_z2',
      'cf_z3',
      'cf_z4',
      'cf_z5',
      'cf_z6',
      // 重返变体
      'rv_dialogues',
      // NG+对话
      'ngplus_dialogues',
    ];
    dialogueFiles.forEach((file) => {
      this.load.text(`dialogue_${file}`, `src/data/dialogues/${file}.yaml`);
    });

    // 卡片数据
    const cardFiles = [
      'c0_cards',
      'c1_cards',
      'c2_cards',
      'c3_cards',
      'c4_cards',
      'c5_cards',
      'cf_cards',
      'rv_cards',
    ];
    cardFiles.forEach((file) => {
      this.load.text(`cards_${file}`, `src/data/cards/${file}.yaml`);
    });

    // 伏笔数据
    this.load.text('foreshadows', 'src/data/foreshadows/foreshadows.yaml');

    // Zone配置数据（场景组装器用）
    // 已在 _loadImages 中通过 YAML 加载

    // 角色数据
    // this.load.yaml('characters', 'assets/data/characters.yaml');
  }

  private _createPlaceholders(): void {
    // 开发阶段：创建程序化占位图形
    // 这些将在美术资源就绪后替换

    const graphics = this.make.graphics({ x: 0, y: 0 });

    // 占位背景
    graphics.fillStyle(0x0a0a0f, 1);
    graphics.fillRect(0, 0, 750, 1334);
    graphics.generateTexture('placeholder_bg', 750, 1334);

    // 占位角色
    graphics.clear();
    graphics.fillStyle(0x4a9eff, 1);
    graphics.fillCircle(32, 32, 32);
    graphics.generateTexture('placeholder_char', 64, 64);

    // 占位UI按钮
    graphics.clear();
    graphics.fillStyle(0x1e1e24, 1);
    graphics.fillRoundedRect(0, 0, 200, 60, 8);
    graphics.lineStyle(2, 0x00ffaa, 1);
    graphics.strokeRoundedRect(0, 0, 200, 60, 8);
    graphics.generateTexture('placeholder_button', 200, 60);

    graphics.destroy();
  }
}
