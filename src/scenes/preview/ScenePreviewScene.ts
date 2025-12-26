/**
 * 场景预览场景
 * 
 * 预览所有Zone的背景和物件布局
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';
import { ZONES, ChapterId, getZonesByChapter } from '@/config/zones.config';
import { SCENE_BACKGROUNDS } from '@/data/webpAssets';

// 章节配置
const CHAPTERS = [
  { id: ChapterId.C0, name: '序章 (C0)', color: '#4A9EFF' },
  { id: ChapterId.C1, name: '第1章 (C1)', color: '#00CC66' },
  { id: ChapterId.C2, name: '第2章 (C2)', color: '#FFD700' },
  { id: ChapterId.C3, name: '第3章 (C3)', color: '#FF6600' },
  { id: ChapterId.C4, name: '第4章 (C4)', color: '#FF4444' },
  { id: ChapterId.C5, name: '第5章 (C5)', color: '#9933FF' },
  { id: ChapterId.CF, name: '终章 (CF)', color: '#00FFAA' },
];

export class ScenePreviewScene extends BasePreviewScene {
  protected title = '🏠 场景预览';
  protected subtitle = '预览所有Zone背景和物件布局';

  private previewContainer!: Phaser.GameObjects.Container;
  private currentZoneId: string | null = null;
  private isFullPreview = false;

  constructor() {
    super({ key: 'ScenePreviewScene' });
  }

  protected createContent(width: number, height: number): void {
    let currentY = 20;
    const cardWidth = 200;
    const cardHeight = 150;
    const cardPadding = 15;
    const cardsPerRow = 3;

    // 统计信息
    const totalZones = Object.keys(ZONES).length;
    const stats = this.add.text(width / 2, currentY, `共 ${totalZones} 个Zone`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#686868',
    }).setOrigin(0.5);
    this.contentContainer.add(stats);
    currentY += 40;

    // 按章节分类显示
    CHAPTERS.forEach((chapter) => {
      const zones = getZonesByChapter(chapter.id);
      if (zones.length === 0) return;

      // 章节标题
      const sectionTitle = this.createSectionTitle(30, currentY, `${chapter.name} (${zones.length}个)`);
      sectionTitle.setColor(chapter.color);
      this.contentContainer.add(sectionTitle);
      currentY += 35;

      // Zone卡片网格
      zones.forEach((zone, index) => {
        const col = index % cardsPerRow;
        const row = Math.floor(index / cardsPerRow);
        const x = 30 + col * (cardWidth + cardPadding);
        const y = currentY + row * (cardHeight + cardPadding);

        const card = this.createZoneCard(x, y, cardWidth, cardHeight, zone.id, zone.name, zone.backgroundKey);
        this.contentContainer.add(card);
      });

      // 计算行数
      const rows = Math.ceil(zones.length / cardsPerRow);
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

  private createZoneCard(
    x: number,
    y: number,
    width: number,
    height: number,
    zoneId: string,
    zoneName: string,
    backgroundKey: string
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(0, 0, width, height, 8);
    bg.lineStyle(1, 0x2A2A30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 8);
    container.add(bg);

    // 尝试加载背景缩略图
    const bgUrl = SCENE_BACKGROUNDS[backgroundKey];
    if (bgUrl && this.textures.exists(backgroundKey)) {
      const thumbnail = this.add.image(width / 2, (height - 40) / 2, backgroundKey);
      const scale = Math.min((width - 10) / thumbnail.width, (height - 50) / thumbnail.height);
      thumbnail.setScale(scale);
      container.add(thumbnail);
    } else {
      // 占位图
      const placeholder = this.add.graphics();
      placeholder.fillStyle(0x1E1E24, 1);
      placeholder.fillRect(5, 5, width - 10, height - 50);
      container.add(placeholder);

      // 占位文字
      const placeholderText = this.add.text(width / 2, (height - 40) / 2, '📷', {
        fontSize: '32px',
      }).setOrigin(0.5);
      container.add(placeholderText);
    }

    // Zone ID
    const idText = this.add.text(width / 2, height - 35, zoneId, {
      fontFamily: 'Noto Sans SC',
      fontSize: '11px',
      color: '#00FFAA',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(idText);

    // Zone名称
    const nameText = this.add.text(width / 2, height - 18, zoneName, {
      fontFamily: 'Noto Sans SC',
      fontSize: '11px',
      color: '#A8A6A3',
    }).setOrigin(0.5);
    container.add(nameText);

    // 交互
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1E1E24, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(2, 0x00FFAA, 1);
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
      this.showFullPreview(zoneId);
    });

    return container;
  }

  private showFullPreview(zoneId: string): void {
    const zone = ZONES[zoneId];
    if (!zone) return;

    this.currentZoneId = zoneId;
    this.isFullPreview = true;
    const { width, height } = this.scale;

    // 清空预览容器
    this.previewContainer.removeAll(true);

    // 半透明背景
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0);
    this.previewContainer.add(overlay);

    // 背景图
    const bgUrl = SCENE_BACKGROUNDS[zone.backgroundKey];
    if (bgUrl) {
      // 检查纹理是否已加载
      if (this.textures.exists(zone.backgroundKey)) {
        const bgImage = this.add.image(width / 2, height / 2, zone.backgroundKey);
        const scale = Math.min((width - 40) / bgImage.width, (height - 150) / bgImage.height);
        bgImage.setScale(scale);
        this.previewContainer.add(bgImage);
      } else {
        // 加载纹理
        this.load.image(zone.backgroundKey, bgUrl);
        this.load.once('complete', () => {
          if (this.currentZoneId === zoneId) {
            const bgImage = this.add.image(width / 2, height / 2, zone.backgroundKey);
            const scale = Math.min((width - 40) / bgImage.width, (height - 150) / bgImage.height);
            bgImage.setScale(scale);
            this.previewContainer.add(bgImage);
          }
        });
        this.load.start();

        // 加载中文字
        const loadingText = this.add.text(width / 2, height / 2, '加载中...', {
          fontFamily: 'Noto Sans SC',
          fontSize: '16px',
          color: '#686868',
        }).setOrigin(0.5);
        this.previewContainer.add(loadingText);
      }
    } else {
      // 无背景
      const noImageText = this.add.text(width / 2, height / 2, '暂无背景图', {
        fontFamily: 'Noto Sans SC',
        fontSize: '18px',
        color: '#686868',
      }).setOrigin(0.5);
      this.previewContainer.add(noImageText);
    }

    // 信息面板
    const infoPanel = this.add.graphics();
    infoPanel.fillStyle(0x141419, 0.9);
    infoPanel.fillRoundedRect(20, 20, width - 40, 80, 8);
    this.previewContainer.add(infoPanel);

    // Zone信息
    const infoTitle = this.add.text(40, 35, `${zone.id} - ${zone.name}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '18px',
      color: '#00FFAA',
      fontStyle: 'bold',
    });
    this.previewContainer.add(infoTitle);

    const infoDesc = this.add.text(40, 62, zone.description, {
      fontFamily: 'Noto Sans SC',
      fontSize: '13px',
      color: '#A8A6A3',
    });
    this.previewContainer.add(infoDesc);

    // 背景键名
    const keyText = this.add.text(40, 82, `纹理: ${zone.backgroundKey}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '11px',
      color: '#4A4A4A',
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

    // 点击背景关闭
    overlay.setInteractive();
    overlay.on('pointerdown', () => this.hideFullPreview());

    this.previewContainer.setVisible(true);

    // 动画
    this.previewContainer.setAlpha(0);
    this.tweens.add({
      targets: this.previewContainer,
      alpha: 1,
      duration: 200,
    });
  }

  private hideFullPreview(): void {
    this.isFullPreview = false;
    this.currentZoneId = null;

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

