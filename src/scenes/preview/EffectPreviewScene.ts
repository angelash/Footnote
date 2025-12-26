/**
 * 特效预览场景
 * 
 * 预览能力/系统/环境特效
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';
import { EFFECTS_ABILITIES, EFFECTS_SYSTEM, EFFECTS_ENVIRONMENTAL, ALL_EFFECTS } from '@/data/webpAssets';

interface IEffectCategory {
  name: string;
  color: string;
  effects: IEffectItem[];
}

interface IEffectItem {
  key: string;
  name: string;
  url: string;
}

export class EffectPreviewScene extends BasePreviewScene {
  protected title = '✨ 特效预览';
  protected subtitle = '预览能力/系统/环境特效';

  private previewContainer!: Phaser.GameObjects.Container;
  private isFullPreview = false;

  constructor() {
    super({ key: 'EffectPreviewScene' });
  }

  protected createContent(width: number, height: number): void {
    let currentY = 20;

    const categories = this.getEffectCategories();

    // 统计
    const totalEffects = Object.keys(ALL_EFFECTS).length;
    const stats = this.add.text(width / 2, currentY, `共 ${totalEffects} 个特效`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#686868',
    }).setOrigin(0.5);
    this.contentContainer.add(stats);
    currentY += 40;

    // 分类展示
    categories.forEach((category) => {
      if (category.effects.length === 0) return;

      // 分类标题
      const sectionTitle = this.createSectionTitle(30, currentY, `${category.name} (${category.effects.length})`);
      sectionTitle.setColor(category.color);
      this.contentContainer.add(sectionTitle);
      currentY += 35;

      // 特效卡片
      const cardWidth = 200;
      const cardHeight = 180;
      const cardPadding = 15;
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
    const nameMap: Record<string, string> = {
      'fx_depth_perception': '深度感知',
      'fx_depth_intervention': '深度介入',
      'fx_time_intervention': '时间干预',
      'fx_drift_afterimage': '漂移残影',
      'fx_system_verdict': '系统判定',
      'fx_data_ripple': '数据涟漪',
      'fx_verdict': '判决效果',
      'fx_dimensional_scar': '维度伤痕',
      'fx_scar': '伤痕效果',
      'fx_drift': '漂移效果',
    };

    return [
      {
        name: '能力特效 (Abilities)',
        color: '#00FFAA',
        effects: Object.entries(EFFECTS_ABILITIES).map(([key, url]) => ({
          key,
          name: nameMap[key] || key,
          url,
        })),
      },
      {
        name: '系统特效 (System)',
        color: '#4A9EFF',
        effects: Object.entries(EFFECTS_SYSTEM).map(([key, url]) => ({
          key,
          name: nameMap[key] || key,
          url,
        })),
      },
      {
        name: '环境特效 (Environmental)',
        color: '#FFD700',
        effects: Object.entries(EFFECTS_ENVIRONMENTAL).map(([key, url]) => ({
          key,
          name: nameMap[key] || key,
          url,
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
    bg.lineStyle(1, 0x2A2A30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 8);
    container.add(bg);

    // 预览区域背景
    const previewBg = this.add.graphics();
    previewBg.fillStyle(0x0A0A0F, 1);
    previewBg.fillRoundedRect(10, 10, width - 20, height - 60, 6);
    container.add(previewBg);

    // 加载特效图片
    if (this.textures.exists(effect.key)) {
      const effectImg = this.add.image(width / 2, (height - 50) / 2 + 5, effect.key);
      const scale = Math.min((width - 30) / effectImg.width, (height - 70) / effectImg.height);
      effectImg.setScale(scale);
      container.add(effectImg);
    } else {
      // 加载
      this.load.image(effect.key, effect.url);
      const loading = this.add.text(width / 2, (height - 50) / 2 + 5, '⏳', {
        fontSize: '32px',
      }).setOrigin(0.5);
      container.add(loading);

      this.load.once('complete', () => {
        loading.destroy();
        if (this.textures.exists(effect.key)) {
          const effectImg = this.add.image(width / 2, (height - 50) / 2 + 5, effect.key);
          const scale = Math.min((width - 30) / effectImg.width, (height - 70) / effectImg.height);
          effectImg.setScale(scale);
          container.add(effectImg);
        }
      });
      this.load.start();
    }

    // 特效名称
    const nameText = this.add.text(width / 2, height - 35, effect.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: '13px',
      color: accentColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(nameText);

    // 特效键名
    const keyText = this.add.text(width / 2, height - 15, effect.key, {
      fontFamily: 'Noto Sans SC',
      fontSize: '10px',
      color: '#4A4A4A',
    }).setOrigin(0.5);
    container.add(keyText);

    // 交互
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1E1E24, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      const color = Phaser.Display.Color.HexStringToColor(accentColor).color;
      bg.lineStyle(2, color, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x141419, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(1, 0x2A2A30, 1);
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

    // 背景
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.95).setOrigin(0);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this.hideFullPreview());
    this.previewContainer.add(overlay);

    // 特效图片
    if (this.textures.exists(effect.key)) {
      const effectImg = this.add.image(width / 2, height / 2, effect.key);
      const maxScale = Math.min((width - 80) / effectImg.width, (height - 200) / effectImg.height);
      effectImg.setScale(Math.min(maxScale, 2)); // 最大2倍
      this.previewContainer.add(effectImg);
    } else {
      const noImage = this.add.text(width / 2, height / 2, '图片未加载', {
        fontFamily: 'Noto Sans SC',
        fontSize: '18px',
        color: '#686868',
      }).setOrigin(0.5);
      this.previewContainer.add(noImage);
    }

    // 信息面板
    const infoPanel = this.add.graphics();
    infoPanel.fillStyle(0x141419, 0.9);
    infoPanel.fillRoundedRect(20, 20, width - 40, 70, 8);
    this.previewContainer.add(infoPanel);

    const nameText = this.add.text(40, 35, effect.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: '20px',
      color: accentColor,
      fontStyle: 'bold',
    });
    this.previewContainer.add(nameText);

    const keyText = this.add.text(40, 62, `键名: ${effect.key}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#686868',
    });
    this.previewContainer.add(keyText);

    // 关闭按钮
    const closeBtn = this.add.text(width - 50, 40, '✕', {
      fontSize: '28px',
      color: '#A8A6A3',
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF4444'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#A8A6A3'));
    closeBtn.on('pointerdown', () => this.hideFullPreview());
    this.previewContainer.add(closeBtn);

    // 底部提示
    const tipText = this.add.text(width / 2, height - 30, '点击空白处或按 ESC 关闭', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#4A4A4A',
    }).setOrigin(0.5);
    this.previewContainer.add(tipText);

    this.previewContainer.setVisible(true);
    this.previewContainer.setAlpha(0);
    this.tweens.add({
      targets: this.previewContainer,
      alpha: 1,
      duration: 200,
    });
  }

  private hideFullPreview(): void {
    this.isFullPreview = false;

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
}

