/**
 * 特效预览场景
 *
 * 预览能力/系统/环境特效
 * - 静态特效图片预览
 * - 动画特效播放
 * - 特效叠加演示
 * - 特效参数调节
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';
import {
  EFFECTS_ABILITIES,
  EFFECTS_SYSTEM,
  EFFECTS_ENVIRONMENTAL,
  ALL_EFFECTS,
} from '@/data/webpAssets';

interface IEffectCategory {
  name: string;
  color: string;
  effects: IEffectItem[];
}

interface IEffectItem {
  key: string;
  name: string;
  url: string;
  isAnimated?: boolean;
  description?: string;
}

interface IAnimationConfig {
  frameCount: number;
  frameRate: number;
  repeat: number; // -1 = 无限循环
}

export class EffectPreviewScene extends BasePreviewScene {
  protected title = '✨ 特效预览';
  protected subtitle = '预览能力/系统/环境特效动画';

  private previewContainer!: Phaser.GameObjects.Container;
  private isFullPreview = false;

  // 动画相关
  private _currentAnimation: Phaser.GameObjects.Sprite | null = null;
  private _animationTimer: Phaser.Time.TimerEvent | null = null;
  private _particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private _animationConfigs: Map<string, IAnimationConfig> = new Map();

  constructor() {
    super({ key: 'EffectPreviewScene' });
    this._initAnimationConfigs();
  }

  /**
   * 初始化动画配置
   */
  private _initAnimationConfigs(): void {
    // 能力特效动画配置
    this._animationConfigs.set('fx_depth_perception', { frameCount: 8, frameRate: 12, repeat: -1 });
    this._animationConfigs.set('fx_depth_intervention', {
      frameCount: 12,
      frameRate: 15,
      repeat: -1,
    });
    this._animationConfigs.set('fx_time_intervention', {
      frameCount: 16,
      frameRate: 18,
      repeat: -1,
    });
    this._animationConfigs.set('fx_drift_afterimage', {
      frameCount: 10,
      frameRate: 12,
      repeat: -1,
    });

    // 系统特效动画配置
    this._animationConfigs.set('fx_system_verdict', { frameCount: 6, frameRate: 10, repeat: 0 });
    this._animationConfigs.set('fx_data_ripple', { frameCount: 8, frameRate: 12, repeat: 3 });
    this._animationConfigs.set('fx_verdict', { frameCount: 6, frameRate: 8, repeat: 0 });

    // 环境特效动画配置
    this._animationConfigs.set('fx_dimensional_scar', { frameCount: 10, frameRate: 8, repeat: -1 });
    this._animationConfigs.set('fx_scar', { frameCount: 6, frameRate: 6, repeat: 2 });
    this._animationConfigs.set('fx_drift', { frameCount: 12, frameRate: 10, repeat: -1 });
  }

  protected createContent(width: number, height: number): void {
    let currentY = 30;

    const categories = this.getEffectCategories();

    // 统计
    const totalEffects = Object.keys(ALL_EFFECTS).length;
    const stats = this.add
      .text(width / 2, currentY, `共 ${totalEffects} 个特效`, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#686868',
      })
      .setOrigin(0.5);
    this.contentContainer.add(stats);
    currentY += 60;

    // 分类展示
    categories.forEach((category) => {
      if (category.effects.length === 0) return;

      // 分类标题
      const sectionTitle = this.createSectionTitle(
        30,
        currentY,
        `${category.name} (${category.effects.length})`
      );
      sectionTitle.setColor(category.color);
      this.contentContainer.add(sectionTitle);
      currentY += 55;

      // 特效卡片 - 放大卡片尺寸
      const cardWidth = 320;
      const cardHeight = 260;
      const cardPadding = 25;
      const cardsPerRow = 3;

      category.effects.forEach((effect, index) => {
        const col = index % cardsPerRow;
        const row = Math.floor(index / cardsPerRow);
        const x = 30 + col * (cardWidth + cardPadding);
        const y = currentY + row * (cardHeight + cardPadding);

        const card = this.createEffectCard(x, y, cardWidth, cardHeight, effect, category.color);
        this.contentContainer.add(card);
      });

      const rows = Math.ceil(category.effects.length / cardsPerRow);
      currentY += rows * (cardHeight + cardPadding) + 20;

      // 分隔线
      const divider = this.createDivider(currentY, width);
      this.contentContainer.add(divider);
      currentY += 30;
    });

    this.setContentHeight(currentY);

    // 全屏预览容器
    this.previewContainer = this.add.container(0, 0);
    this.previewContainer.setDepth(200);
    this.previewContainer.setVisible(false);
  }

  private getEffectCategories(): IEffectCategory[] {
    const effectMeta: Record<string, { name: string; desc: string; animated?: boolean }> = {
      // 能力特效
      fx_depth_perception: {
        name: '深度感知',
        desc: '岑回的第一能力，感知隐藏信息',
        animated: true,
      },
      fx_depth_intervention: {
        name: '深度介入',
        desc: '可改变结构，会留下维度伤痕',
        animated: true,
      },
      fx_time_intervention: {
        name: '时间干预',
        desc: '回溯节点，产生时间污染',
        animated: true,
      },
      fx_drift_afterimage: {
        name: '漂移残影',
        desc: '对账失败者的视觉残留',
        animated: true,
      },
      // 系统特效
      fx_system_verdict: {
        name: '系统判定',
        desc: '当R值达到阈值时触发',
        animated: true,
      },
      fx_data_ripple: {
        name: '数据涟漪',
        desc: '信息流动的可视化表现',
        animated: true,
      },
      fx_verdict: {
        name: '判决效果',
        desc: '最终判定的闪现效果',
        animated: true,
      },
      // 环境特效
      fx_dimensional_scar: {
        name: '维度伤痕',
        desc: '深度介入留下的永久痕迹',
        animated: true,
      },
      fx_scar: {
        name: '伤痕效果',
        desc: '世界被改变后的裂痕',
        animated: true,
      },
      fx_drift: {
        name: '漂移效果',
        desc: '存在不稳定时的视觉抖动',
        animated: true,
      },
    };

    return [
      {
        name: '🔮 能力特效 (Abilities)',
        color: '#00FFAA',
        effects: Object.entries(EFFECTS_ABILITIES).map(([key, url]) => ({
          key,
          name: effectMeta[key]?.name || key,
          url,
          isAnimated: effectMeta[key]?.animated,
          description: effectMeta[key]?.desc,
        })),
      },
      {
        name: '⚙️ 系统特效 (System)',
        color: '#4A9EFF',
        effects: Object.entries(EFFECTS_SYSTEM).map(([key, url]) => ({
          key,
          name: effectMeta[key]?.name || key,
          url,
          isAnimated: effectMeta[key]?.animated,
          description: effectMeta[key]?.desc,
        })),
      },
      {
        name: '🌍 环境特效 (Environmental)',
        color: '#FFD700',
        effects: Object.entries(EFFECTS_ENVIRONMENTAL).map(([key, url]) => ({
          key,
          name: effectMeta[key]?.name || key,
          url,
          isAnimated: effectMeta[key]?.animated,
          description: effectMeta[key]?.desc,
        })),
      },
    ];
  }

  private createEffectCard(
    x: number,
    y: number,
    width: number,
    height: number,
    effect: IEffectItem,
    accentColor: string
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(0, 0, width, height, 8);
    bg.lineStyle(1, 0x2a2a30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 8);
    container.add(bg);

    // 预览区域背景
    const previewBg = this.add.graphics();
    previewBg.fillStyle(0x0a0a0f, 1);
    previewBg.fillRoundedRect(15, 15, width - 30, height - 90, 8);
    container.add(previewBg);

    // 加载特效图片
    if (this.textures.exists(effect.key)) {
      const effectImg = this.add.image(width / 2, (height - 80) / 2 + 10, effect.key);
      const scale = Math.min((width - 50) / effectImg.width, (height - 110) / effectImg.height);
      effectImg.setScale(scale);
      container.add(effectImg);
    } else {
      // 加载
      this.load.image(effect.key, effect.url);
      const loading = this.add
        .text(width / 2, (height - 80) / 2 + 10, '⏳', {
          fontSize: '48px',
        })
        .setOrigin(0.5);
      container.add(loading);

      this.load.once('complete', () => {
        loading.destroy();
        if (this.textures.exists(effect.key)) {
          const effectImg = this.add.image(width / 2, (height - 80) / 2 + 10, effect.key);
          const scale = Math.min((width - 50) / effectImg.width, (height - 110) / effectImg.height);
          effectImg.setScale(scale);
          container.add(effectImg);
        }
      });
      this.load.start();
    }

    // 特效名称
    const nameText = this.add
      .text(width / 2, height - 55, effect.name, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: accentColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(nameText);

    // 特效键名
    const keyText = this.add
      .text(width / 2, height - 25, effect.key, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#4A4A4A',
      })
      .setOrigin(0.5);
    container.add(keyText);

    // 交互
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1e1e24, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      const color = Phaser.Display.Color.HexStringToColor(accentColor).color;
      bg.lineStyle(2, color, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x141419, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(1, 0x2a2a30, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
    });

    container.on('pointerdown', () => {
      this.showFullPreview(effect, accentColor);
    });

    return container;
  }

  private showFullPreview(effect: IEffectItem, accentColor: string): void {
    this.isFullPreview = true;
    const { width, height } = this.scale;

    this.previewContainer.removeAll(true);
    this._stopCurrentAnimation();

    // 背景 - 模拟游戏场景
    const overlay = this.add.rectangle(0, 0, width, height, 0x0a0a0f, 1).setOrigin(0);
    overlay.setInteractive();
    this.previewContainer.add(overlay);

    // 场景网格背景（增加深度感）
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a1a20, 0.5);
    for (let i = 0; i < width; i += 50) {
      grid.lineBetween(i, 0, i, height);
    }
    for (let i = 0; i < height; i += 50) {
      grid.lineBetween(0, i, width, i);
    }
    this.previewContainer.add(grid);

    // 中心焦点效果
    const focusGlow = this.add.graphics();
    focusGlow.fillStyle(Phaser.Display.Color.HexStringToColor(accentColor).color, 0.05);
    focusGlow.fillCircle(width / 2, height / 2, 200);
    focusGlow.fillStyle(Phaser.Display.Color.HexStringToColor(accentColor).color, 0.03);
    focusGlow.fillCircle(width / 2, height / 2, 300);
    this.previewContainer.add(focusGlow);

    // 特效展示区
    this._showEffectAnimation(effect, accentColor, width, height);

    // 信息面板
    const infoPanel = this.add.graphics();
    infoPanel.fillStyle(0x141419, 0.95);
    infoPanel.fillRoundedRect(20, 20, width - 40, 140, 12);
    infoPanel.lineStyle(2, Phaser.Display.Color.HexStringToColor(accentColor).color, 0.5);
    infoPanel.strokeRoundedRect(20, 20, width - 40, 140, 12);
    this.previewContainer.add(infoPanel);

    const nameText = this.add.text(45, 40, effect.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SECTION,
      color: accentColor,
      fontStyle: 'bold',
    });
    this.previewContainer.add(nameText);

    // 描述
    if (effect.description) {
      const descText = this.add.text(45, 85, effect.description, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#A8A6A3',
      });
      this.previewContainer.add(descText);
    }

    // 动画状态标签
    const animConfig = this._animationConfigs.get(effect.key);
    const animLabel = this.add.text(
      45,
      125,
      animConfig
        ? `🎬 动画: ${animConfig.frameCount}帧 @ ${animConfig.frameRate}fps | ${animConfig.repeat === -1 ? '循环' : `播放${animConfig.repeat + 1}次`}`
        : '📷 静态图片',
      {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#686868',
      }
    );
    this.previewContainer.add(animLabel);

    const keyText = this.add
      .text(width - 50, 125, effect.key, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#4A4A4A',
      })
      .setOrigin(1, 0);
    this.previewContainer.add(keyText);

    // 关闭按钮
    const closeBtn = this.add
      .text(width - 55, 55, '✕', {
        fontSize: '36px',
        color: '#A8A6A3',
      })
      .setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF4444'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#A8A6A3'));
    closeBtn.on('pointerdown', () => this.hideFullPreview());
    this.previewContainer.add(closeBtn);

    // 控制面板
    this._createControlPanel(effect, accentColor, width, height);

    // 底部提示
    const tipText = this.add
      .text(width / 2, height - 30, '按 ESC 关闭 | 点击「重播」重新播放动画', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#4A4A4A',
      })
      .setOrigin(0.5);
    this.previewContainer.add(tipText);

    this.previewContainer.setVisible(true);
    this.previewContainer.setAlpha(0);
    this.tweens.add({
      targets: this.previewContainer,
      alpha: 1,
      duration: 200,
    });
  }

  /**
   * 显示特效动画
   */
  private _showEffectAnimation(
    effect: IEffectItem,
    accentColor: string,
    width: number,
    height: number
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // 检查是否有对应的精灵表动画
    const animConfig = this._animationConfigs.get(effect.key);

    if (this.textures.exists(effect.key)) {
      if (animConfig && effect.isAnimated) {
        // 创建精灵表动画（模拟）
        // 由于实际精灵表可能不存在，这里用程序化动画模拟
        this._createProceduralAnimation(effect.key, centerX, centerY, accentColor, animConfig);
      } else {
        // 静态图片 + 呼吸效果
        const effectImg = this.add.image(centerX, centerY, effect.key);
        const maxScale = Math.min(
          (width - 100) / effectImg.width,
          (height - 300) / effectImg.height
        );
        effectImg.setScale(Math.min(maxScale, 1.5));
        this.previewContainer.add(effectImg);

        // 添加呼吸效果
        this.tweens.add({
          targets: effectImg,
          scaleX: effectImg.scaleX * 1.05,
          scaleY: effectImg.scaleY * 1.05,
          alpha: 0.8,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    } else {
      // 资源未加载 - 显示占位
      this._createPlaceholderEffect(centerX, centerY, effect.name, accentColor);
    }
  }

  /**
   * 创建程序化动画（用于演示）
   */
  private _createProceduralAnimation(
    effectKey: string,
    x: number,
    y: number,
    color: string,
    config: IAnimationConfig
  ): void {
    const colorInt = Phaser.Display.Color.HexStringToColor(color).color;

    // 根据特效类型创建不同的程序化动画
    if (effectKey.includes('perception')) {
      // 深度感知 - 脉冲波纹
      this._createPulseRipple(x, y, colorInt, config);
    } else if (effectKey.includes('intervention')) {
      // 介入效果 - 能量爆发
      this._createEnergyBurst(x, y, colorInt, config);
    } else if (effectKey.includes('time')) {
      // 时间干预 - 时钟波动
      this._createTimeWave(x, y, colorInt, config);
    } else if (effectKey.includes('drift') || effectKey.includes('afterimage')) {
      // 漂移/残影 - 幽灵轨迹
      this._createGhostTrail(x, y, colorInt, config);
    } else if (effectKey.includes('verdict') || effectKey.includes('system')) {
      // 系统判定 - 文字闪烁
      this._createVerdictFlash(x, y, colorInt, config);
    } else if (effectKey.includes('scar') || effectKey.includes('dimensional')) {
      // 伤痕 - 裂缝效果
      this._createScarEffect(x, y, colorInt, config);
    } else if (effectKey.includes('ripple') || effectKey.includes('data')) {
      // 数据涟漪
      this._createDataRipple(x, y, colorInt, config);
    } else {
      // 默认粒子效果
      this._createDefaultParticles(x, y, colorInt, config);
    }
  }

  /**
   * 脉冲波纹效果
   */
  private _createPulseRipple(x: number, y: number, color: number, _config: IAnimationConfig): void {
    const createRipple = () => {
      const ripple = this.add.graphics();
      ripple.lineStyle(3, color, 0.8);
      ripple.strokeCircle(x, y, 10);
      this.previewContainer.add(ripple);

      this.tweens.add({
        targets: ripple,
        scaleX: 15,
        scaleY: 15,
        alpha: 0,
        duration: 2000,
        ease: 'Cubic.easeOut',
        onComplete: () => ripple.destroy(),
      });
    };

    createRipple();
    this._animationTimer = this.time.addEvent({
      delay: 800,
      callback: createRipple,
      loop: true,
    });

    // 中心点
    const center = this.add.graphics();
    center.fillStyle(color, 0.8);
    center.fillCircle(x, y, 8);
    this.previewContainer.add(center);

    this.tweens.add({
      targets: center,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 能量爆发效果
   */
  private _createEnergyBurst(x: number, y: number, color: number, _config: IAnimationConfig): void {
    const rayCount = 12;
    const rays: Phaser.GameObjects.Graphics[] = [];

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const ray = this.add.graphics();
      ray.lineStyle(2, color, 0.7);
      ray.lineBetween(x, y, x + Math.cos(angle) * 100, y + Math.sin(angle) * 100);
      rays.push(ray);
      this.previewContainer.add(ray);
    }

    // 旋转动画
    this._animationTimer = this.time.addEvent({
      delay: 50,
      callback: () => {
        rays.forEach((ray, i) => {
          const angle = (i / rayCount) * Math.PI * 2 + this.time.now / 1000;
          ray.clear();
          ray.lineStyle(2, color, 0.7);
          const len = 80 + Math.sin(this.time.now / 200 + i) * 30;
          ray.lineBetween(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        });
      },
      loop: true,
    });

    // 中心光球
    const core = this.add.graphics();
    core.fillStyle(color, 0.9);
    core.fillCircle(x, y, 15);
    this.previewContainer.add(core);
  }

  /**
   * 时间波动效果
   */
  private _createTimeWave(x: number, y: number, color: number, _config: IAnimationConfig): void {
    // 时钟刻度
    const clockGraphics = this.add.graphics();
    clockGraphics.lineStyle(2, color, 0.5);
    clockGraphics.strokeCircle(x, y, 80);

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const inner = 65;
      const outer = 75;
      clockGraphics.lineBetween(
        x + Math.cos(angle) * inner,
        y + Math.sin(angle) * inner,
        x + Math.cos(angle) * outer,
        y + Math.sin(angle) * outer
      );
    }
    this.previewContainer.add(clockGraphics);

    // 时针
    const hand = this.add.graphics();
    hand.lineStyle(3, color, 0.9);
    hand.lineBetween(x, y, x, y - 50);
    this.previewContainer.add(hand);

    // 波动动画
    this.tweens.add({
      targets: clockGraphics,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 时针旋转
    let rotation = 0;
    this._animationTimer = this.time.addEvent({
      delay: 50,
      callback: () => {
        rotation += 0.1;
        hand.clear();
        hand.lineStyle(3, color, 0.9);
        hand.lineBetween(x, y, x + Math.sin(rotation) * 50, y - Math.cos(rotation) * 50);
      },
      loop: true,
    });
  }

  /**
   * 幽灵轨迹效果
   */
  private _createGhostTrail(x: number, y: number, color: number, _config: IAnimationConfig): void {
    const ghosts: Phaser.GameObjects.Graphics[] = [];
    let phase = 0;

    this._animationTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        phase += 0.15;
        const offsetX = Math.sin(phase) * 60;
        const offsetY = Math.cos(phase * 0.7) * 40;

        const ghost = this.add.graphics();
        ghost.fillStyle(color, 0.6);
        ghost.fillRoundedRect(x + offsetX - 20, y + offsetY - 30, 40, 60, 8);
        ghost.setAlpha(0.8);
        this.previewContainer.add(ghost);
        ghosts.push(ghost);

        this.tweens.add({
          targets: ghost,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            const idx = ghosts.indexOf(ghost);
            if (idx > -1) ghosts.splice(idx, 1);
            ghost.destroy();
          },
        });
      },
      loop: true,
    });

    // 主体
    const mainGhost = this.add.graphics();
    mainGhost.fillStyle(color, 1);
    mainGhost.fillRoundedRect(x - 25, y - 35, 50, 70, 10);
    this.previewContainer.add(mainGhost);
  }

  /**
   * 判决闪烁效果
   */
  private _createVerdictFlash(
    x: number,
    y: number,
    color: number,
    _config: IAnimationConfig
  ): void {
    const verdictText = this.add
      .text(x, y, '「判定」', {
        fontFamily: 'Noto Sans SC',
        fontSize: '48px',
        color: `#${color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.previewContainer.add(verdictText);

    // 闪烁效果
    this.tweens.add({
      targets: verdictText,
      alpha: 0.3,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    // 背景闪光
    const flash = this.add.graphics();
    flash.fillStyle(color, 0.1);
    flash.fillRect(0, y - 50, this.scale.width, 100);
    this.previewContainer.add(flash);
    this.previewContainer.sendToBack(flash);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 伤痕效果
   */
  private _createScarEffect(x: number, y: number, color: number, _config: IAnimationConfig): void {
    const scar = this.add.graphics();
    scar.lineStyle(4, color, 0.8);

    // 不规则裂缝
    const points = [
      { x: x - 80, y: y - 50 },
      { x: x - 30, y: y - 20 },
      { x: x + 10, y: y + 30 },
      { x: x + 60, y: y + 10 },
      { x: x + 90, y: y + 50 },
    ];

    scar.beginPath();
    scar.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((p) => scar.lineTo(p.x, p.y));
    scar.strokePath();
    this.previewContainer.add(scar);

    // 发光效果
    this.tweens.add({
      targets: scar,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 闪电分支
    points.forEach((p) => {
      if (Math.random() > 0.5) {
        const branch = this.add.graphics();
        branch.lineStyle(2, color, 0.5);
        branch.lineBetween(p.x, p.y, p.x + (Math.random() - 0.5) * 40, p.y + Math.random() * 30);
        this.previewContainer.add(branch);

        this.tweens.add({
          targets: branch,
          alpha: 0,
          duration: 300,
          delay: Math.random() * 500,
          yoyo: true,
          repeat: -1,
        });
      }
    });
  }

  /**
   * 数据涟漪效果
   */
  private _createDataRipple(x: number, y: number, color: number, _config: IAnimationConfig): void {
    const hexSize = 30;
    const hexes: Phaser.GameObjects.Graphics[] = [];

    // 六边形网格
    for (let row = -2; row <= 2; row++) {
      for (let col = -2; col <= 2; col++) {
        const offsetX = col * hexSize * 1.5;
        const offsetY = row * hexSize * Math.sqrt(3) + ((col % 2) * hexSize * Math.sqrt(3)) / 2;

        const hex = this.add.graphics();
        hex.lineStyle(1, color, 0.3);
        this._drawHexagon(hex, x + offsetX, y + offsetY, hexSize / 2);
        hex.setAlpha(0.2);
        this.previewContainer.add(hex);
        hexes.push(hex);
      }
    }

    // 波纹动画
    let rippleCenter = 0;
    this._animationTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        rippleCenter += 0.5;
        hexes.forEach((hex, i) => {
          const dist = Math.abs(i - hexes.length / 2);
          const wave = Math.sin(rippleCenter - dist * 0.3);
          hex.setAlpha(0.2 + wave * 0.3);
        });
      },
      loop: true,
    });
  }

  private _drawHexagon(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    size: number
  ): void {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
      points.push({
        x: x + Math.cos(angle) * size,
        y: y + Math.sin(angle) * size,
      });
    }
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((p) => graphics.lineTo(p.x, p.y));
    graphics.closePath();
    graphics.strokePath();
  }

  /**
   * 默认粒子效果
   */
  private _createDefaultParticles(
    x: number,
    y: number,
    color: number,
    _config: IAnimationConfig
  ): void {
    // 创建简单的粒子效果
    const particles: Phaser.GameObjects.Graphics[] = [];

    this._animationTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        const particle = this.add.graphics();
        particle.fillStyle(color, 0.8);
        particle.fillCircle(
          x + (Math.random() - 0.5) * 100,
          y + (Math.random() - 0.5) * 100,
          3 + Math.random() * 5
        );
        this.previewContainer.add(particle);
        particles.push(particle);

        this.tweens.add({
          targets: particle,
          alpha: 0,
          y: '-=50',
          duration: 1000,
          onComplete: () => {
            const idx = particles.indexOf(particle);
            if (idx > -1) particles.splice(idx, 1);
            particle.destroy();
          },
        });
      },
      loop: true,
    });
  }

  /**
   * 创建占位特效
   */
  private _createPlaceholderEffect(x: number, y: number, name: string, color: string): void {
    const placeholder = this.add.graphics();
    placeholder.lineStyle(3, Phaser.Display.Color.HexStringToColor(color).color, 0.5);
    placeholder.strokeRoundedRect(x - 120, y - 120, 240, 240, 16);
    placeholder.lineStyle(1, 0x2a2a30, 0.5);
    placeholder.lineBetween(x - 120, y - 120, x + 120, y + 120);
    placeholder.lineBetween(x + 120, y - 120, x - 120, y + 120);
    this.previewContainer.add(placeholder);

    const icon = this.add
      .text(x, y - 30, '✨', {
        fontSize: '64px',
      })
      .setOrigin(0.5);
    this.previewContainer.add(icon);

    const text = this.add
      .text(x, y + 45, '资源待制作', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#686868',
      })
      .setOrigin(0.5);
    this.previewContainer.add(text);

    const nameText = this.add
      .text(x, y + 80, name, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: color,
      })
      .setOrigin(0.5);
    this.previewContainer.add(nameText);

    // 呼吸效果
    this.tweens.add({
      targets: [icon, placeholder],
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 创建控制面板
   */
  private _createControlPanel(
    effect: IEffectItem,
    accentColor: string,
    width: number,
    height: number
  ): void {
    const panelY = height - 100;
    const panelWidth = 450;
    const panelX = (width - panelWidth) / 2;

    // 面板背景
    const panel = this.add.graphics();
    panel.fillStyle(0x141419, 0.9);
    panel.fillRoundedRect(panelX, panelY, panelWidth, 65, 10);
    panel.lineStyle(1, 0x2a2a30, 1);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, 65, 10);
    this.previewContainer.add(panel);

    // 重播按钮
    const replayBtn = this.add
      .text(panelX + 75, panelY + 32, '🔄 重播', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#A8A6A3',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    replayBtn.on('pointerover', () => replayBtn.setColor(accentColor));
    replayBtn.on('pointerout', () => replayBtn.setColor('#A8A6A3'));
    replayBtn.on('pointerdown', () => {
      this._stopCurrentAnimation();
      this._showEffectAnimation(effect, accentColor, width, height);
      this.showToast('动画已重播', 'info');
    });
    this.previewContainer.add(replayBtn);

    // 暂停/播放按钮
    let isPaused = false;
    const pauseBtn = this.add
      .text(panelX + 225, panelY + 32, '⏸️ 暂停', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#A8A6A3',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerover', () => pauseBtn.setColor(accentColor));
    pauseBtn.on('pointerout', () => pauseBtn.setColor('#A8A6A3'));
    pauseBtn.on('pointerdown', () => {
      isPaused = !isPaused;
      if (isPaused) {
        this._animationTimer?.paused && (this._animationTimer.paused = true);
        this.tweens.pauseAll();
        pauseBtn.setText('▶️ 播放');
      } else {
        this._animationTimer?.paused && (this._animationTimer.paused = false);
        this.tweens.resumeAll();
        pauseBtn.setText('⏸️ 暂停');
      }
    });
    this.previewContainer.add(pauseBtn);

    // 信息按钮
    const infoBtn = this.add
      .text(panelX + 375, panelY + 32, 'ℹ️ 信息', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#A8A6A3',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    infoBtn.on('pointerover', () => infoBtn.setColor(accentColor));
    infoBtn.on('pointerout', () => infoBtn.setColor('#A8A6A3'));
    infoBtn.on('pointerdown', () => {
      const animConfig = this._animationConfigs.get(effect.key);
      this.showToast(
        animConfig
          ? `帧数: ${animConfig.frameCount} | 帧率: ${animConfig.frameRate}fps`
          : '静态特效图片',
        'info'
      );
    });
    this.previewContainer.add(infoBtn);
  }

  /**
   * 停止当前动画
   */
  private _stopCurrentAnimation(): void {
    if (this._animationTimer) {
      this._animationTimer.destroy();
      this._animationTimer = null;
    }
    if (this._currentAnimation) {
      this._currentAnimation.destroy();
      this._currentAnimation = null;
    }
    if (this._particleEmitter) {
      this._particleEmitter.stop();
      this._particleEmitter = null;
    }
  }

  private hideFullPreview(): void {
    this.isFullPreview = false;
    this._stopCurrentAnimation();

    this.tweens.add({
      targets: this.previewContainer,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.previewContainer.setVisible(false);
        this.previewContainer.removeAll(true);
      },
    });
  }

  protected setupKeyboard(): void {
    super.setupKeyboard();

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.isFullPreview) {
        this.hideFullPreview();
      } else {
        this.goBack();
      }
    });
  }

  shutdown(): void {
    this._stopCurrentAnimation();
    super.shutdown();
  }
}
