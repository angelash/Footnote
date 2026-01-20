/**
 * 预加载场景
 * 实现分级加载策略：核心资源优先，其他按需懒加载
 * @module scenes/PreloadScene
 */
import Phaser from 'phaser';
import { SCENES } from '@/config/game.config';
import { LOAD_STRATEGY, PERFORMANCE_THRESHOLDS } from '@/config/performance.config';
import { createLogger } from '@/utils/Logger';
import { performanceMonitor } from '@/systems/debug/PerformanceMonitor';

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
  private _loadStartTime: number = 0;

  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  preload(): void {
    // 开始性能追踪
    this._loadStartTime = performance.now();
    performanceMonitor.startLoadTracking();

    this._createLoadingUI();
    this._setupLoadingEvents();

    // 分级加载：只加载核心资源和首屏资源
    this._loadCriticalAssets();
  }

  create(): void {
    // 结束性能追踪
    const loadMetrics = performanceMonitor.endLoadTracking();
    const loadTime = performance.now() - this._loadStartTime;

    logger.info(`核心资源加载完成，耗时: ${Math.round(loadTime)}ms`);
    logger.info('加载统计:', loadMetrics);

    // 检查是否超过首屏时间门禁
    if (loadTime > PERFORMANCE_THRESHOLDS.FIRST_SCREEN_MS) {
      logger.warn(
        `首屏加载时间 ${Math.round(loadTime)}ms 超过目标 ${PERFORMANCE_THRESHOLDS.FIRST_SCREEN_MS}ms`
      );
    }

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

    // 后台懒加载其他资源（使用 requestIdleCallback）
    this._scheduleIdleLoading();

    // 跳转到菜单场景
    this.scene.start(SCENES.MENU);
  }

  /**
   * 调度空闲时间加载非核心资源
   */
  private _scheduleIdleLoading(): void {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(
        () => {
          this._loadDeferredAssets();
        },
        { timeout: LOAD_STRATEGY.IDLE_PRELOAD_TIMEOUT_MS }
      );
    } else {
      // 降级方案：使用 setTimeout
      setTimeout(() => {
        this._loadDeferredAssets();
      }, 2000);
    }
  }

  /**
   * 延迟加载非核心资源
   * 这些资源在后台加载，不阻塞首屏
   */
  private _loadDeferredAssets(): void {
    logger.info('开始后台加载延迟资源...');

    // 加载序章对话数据
    const firstChapterDialogues = LOAD_STRATEGY.FIRST_CHAPTER_ASSETS.dialogues;
    firstChapterDialogues.forEach((file) => {
      this.load.text(`dialogue_${file}`, `src/data/dialogues/${file}.yaml`);
    });

    // 加载序章卡片数据
    const firstChapterCards = LOAD_STRATEGY.FIRST_CHAPTER_ASSETS.cards;
    firstChapterCards.forEach((file) => {
      this.load.text(`cards_${file}`, `src/data/cards/${file}.yaml`);
    });

    this.load.once('complete', () => {
      logger.info('延迟资源加载完成');
    });

    this.load.start();
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

  /**
   * 加载核心资源（分级策略 - 仅加载启动和首屏必需资源）
   */
  private _loadCriticalAssets(): void {
    // ===== 核心图片资源（占位符）=====
    this._createPlaceholders();

    // ===== 核心像素资源（UI必需）=====
    this._loadCorePixelAssets();

    // ===== 首屏资源 =====
    this._loadFirstScreenAssets();

    // ===== 核心音频（标题BGM）=====
    this._loadCoreAudio();

    // 字体通过CSS加载，这里只需等待
  }

  /**
   * 加载核心像素资源
   */
  private _loadCorePixelAssets(): void {
    // 只加载核心精灵表（用于主角）
    const coreSpriteSheets = ['px_sprite_cenhui_idle', 'px_sprite_cenhui_walk'];

    Object.entries(PIXEL_SPRITESHEETS).forEach(([key, sheet]) => {
      if (coreSpriteSheets.includes(key)) {
        this.load.spritesheet(key, sheet.url, {
          frameWidth: sheet.frameWidth,
          frameHeight: sheet.frameHeight,
        });
        performanceMonitor.recordAssetLoad('images', true);
      }
    });

    // 加载核心图片资源
    const coreImages = ['px_bg_placeholder', 'px_counter_r', 'px_counter_p', 'px_counter_w'];
    Object.entries(PIXEL_IMAGE_ASSETS).forEach(([key, url]) => {
      if (coreImages.includes(key)) {
        this.load.image(key, url);
        performanceMonitor.recordAssetLoad('images', true);
      }
    });
  }

  /**
   * 加载首屏资源
   */
  private _loadFirstScreenAssets(): void {
    // 序章背景（只加载第一个Zone）
    const firstZoneBackgrounds = ['bg_c0z1_corridor', 'bg_c0z2_cenhui_room'];
    Object.entries(SCENE_BACKGROUNDS).forEach(([key, url]) => {
      if (firstZoneBackgrounds.includes(key)) {
        this.load.image(key, url);
        performanceMonitor.recordAssetLoad('images', true);
      }
    });

    // 核心角色头像
    if (CHARACTER_PORTRAITS['cenhui']) {
      Object.entries(CHARACTER_PORTRAITS['cenhui']).forEach(([key, url]) => {
        this.load.image(`portrait_cenhui_${key}`, url);
        performanceMonitor.recordAssetLoad('images', true);
      });
    }
  }

  /**
   * 加载核心音频
   */
  private _loadCoreAudio(): void {
    // 只加载标题BGM和基本音效
    const coreAudio = ['bgm_title', 'sfx_ui_click', 'sfx_ui_hover'];

    BGM_CONFIGS.forEach((config) => {
      if (coreAudio.includes(config.id)) {
        this.load.audio(config.id, config.file);
        performanceMonitor.recordAssetLoad('audio', true);
      }
    });

    SFX_CONFIGS.forEach((config) => {
      if (coreAudio.includes(config.id)) {
        this.load.audio(config.id, config.file);
        performanceMonitor.recordAssetLoad('audio', true);
      }
    });
  }

  /**
   * [公开] 全量加载所有资源（供调试/测试使用）
   * 注意：此方法不再在正常流程中调用，仅供需要全量预加载的场景使用
   * @example window.__FOOTNOTE_DEBUG__.loadAllAssets()
   */
  public loadAllAssets(): void {
    // ===== 图片资源 =====
    this._loadImages();

    // ===== 音频资源 =====
    this._loadAudio();

    // ===== 数据文件 =====
    this._loadData();

    // ===== 字体 =====
    // 字体通过CSS加载，这里只需等待
  }

  /**
   * [延迟加载] 加载所有图片资源
   * 此方法由 AssetManager 按需调用，不再在首屏加载
   */
  private _loadImages(): void {
    // ===== 像素PNG资源（配置化场景会用到）=====
    Object.entries(PIXEL_IMAGE_ASSETS).forEach(([key, url]) => {
      this.load.image(key, url);
      performanceMonitor.recordAssetLoad('images', true);
    });
    Object.entries(PIXEL_SPRITESHEETS).forEach(([key, sheet]) => {
      this.load.spritesheet(key, sheet.url, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
      performanceMonitor.recordAssetLoad('images', true);
    });

    // ===== WebP资产（智绘AI生成）=====
    logger.info(`延迟加载 ${WEBP_ASSET_STATS.total} 个WebP资产...`);

    // 角色头像
    Object.entries(CHARACTER_PORTRAITS).forEach(([key, url]) => {
      this.load.image(key, url);
      performanceMonitor.recordAssetLoad('images', true);
    });

    // 场景背景
    Object.entries(SCENE_BACKGROUNDS).forEach(([key, url]) => {
      this.load.image(key, url);
      performanceMonitor.recordAssetLoad('images', true);
    });

    // 场景物件
    Object.entries(ALL_SCENE_OBJECTS).forEach(([key, url]) => {
      this.load.image(key, url);
      performanceMonitor.recordAssetLoad('images', true);
    });

    // 特效
    Object.entries(ALL_EFFECTS).forEach(([key, url]) => {
      this.load.image(key, url);
      performanceMonitor.recordAssetLoad('images', true);
    });

    // 可动物件动画帧
    Object.entries(ANIMATED_OBJECTS).forEach(([key, anim]) => {
      anim.frames.forEach((url, index) => {
        this.load.image(`${key}_frame_${index}`, url);
        performanceMonitor.recordAssetLoad('images', true);
      });
    });
  }

  /**
   * [延迟加载] 加载所有音频资源
   * 此方法由 AssetManager 按需调用，不再在首屏加载
   */
  private _loadAudio(): void {
    const totalAudio = BGM_CONFIGS.length + SFX_CONFIGS.length + AMBIENCE_CONFIGS.length;
    logger.info(`延迟加载 ${totalAudio} 个音频资产...`);

    // 加载BGM
    BGM_CONFIGS.forEach((config) => {
      this.load.audio(config.id, config.file);
      performanceMonitor.recordAssetLoad('audio', true);
    });

    // 加载音效
    SFX_CONFIGS.forEach((config) => {
      this.load.audio(config.id, config.file);
      performanceMonitor.recordAssetLoad('audio', true);
    });

    // 加载环境音
    AMBIENCE_CONFIGS.forEach((config) => {
      this.load.audio(config.id, config.file);
      performanceMonitor.recordAssetLoad('audio', true);
    });
  }

  /**
   * [延迟加载] 加载所有数据文件
   * 此方法由 AssetManager 按需调用，数据文件按章节懒加载
   */
  private _loadData(): void {
    // 对话数据（YAML格式）- 按章节分组，由 AssetManager 按需加载
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
      performanceMonitor.recordAssetLoad('data', true);
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
      performanceMonitor.recordAssetLoad('data', true);
    });

    // 伏笔数据
    this.load.text('foreshadows', 'src/data/foreshadows/foreshadows.yaml');
    performanceMonitor.recordAssetLoad('data', true);

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
