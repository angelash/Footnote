/**
 * 角色预览场景
 * 
 * 预览8个角色的所有表情
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';
import { CHARACTERS, CharacterId, getPortraitKey, ICharacterInfo } from '@/config/characters.config';
import { CHARACTER_PORTRAITS } from '@/data/webpAssets';

export class CharacterPreviewScene extends BasePreviewScene {
  protected title = '👤 角色预览';
  protected subtitle = '预览8个角色的所有表情';

  private previewContainer!: Phaser.GameObjects.Container;
  private isFullPreview = false;
  private currentCharacter: ICharacterInfo | null = null;

  constructor() {
    super({ key: 'CharacterPreviewScene' });
  }

  protected createContent(width: number, height: number): void {
    let currentY = 20;

    // 统计
    const totalPortraits = Object.keys(CHARACTER_PORTRAITS).length;
    const stats = this.add.text(width / 2, currentY, `8个角色，共 ${totalPortraits} 张头像`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#686868',
    }).setOrigin(0.5);
    this.contentContainer.add(stats);
    currentY += 40;

    // 角色列表
    const characters = Object.values(CHARACTERS);
    const cardWidth = width - 60;
    const cardHeight = 120;
    const cardPadding = 15;

    characters.forEach((character, index) => {
      const y = currentY + index * (cardHeight + cardPadding);
      const card = this.createCharacterCard(30, y, cardWidth, cardHeight, character);
      this.contentContainer.add(card);
    });

    currentY += characters.length * (cardHeight + cardPadding) + 20;
    this.setContentHeight(currentY);

    // 全屏预览容器
    this.previewContainer = this.add.container(0, 0);
    this.previewContainer.setDepth(200);
    this.previewContainer.setVisible(false);
  }

  private createCharacterCard(
    x: number,
    y: number,
    width: number,
    height: number,
    character: ICharacterInfo
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(0, 0, width, height, 12);
    bg.lineStyle(1, 0x2A2A30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 12);
    container.add(bg);

    // 头像预览区
    const portraitKey = getPortraitKey(character.id, character.defaultExpression);
    const portraitUrl = CHARACTER_PORTRAITS[portraitKey];

    if (portraitUrl && this.textures.exists(portraitKey)) {
      const portrait = this.add.image(55, height / 2, portraitKey);
      portrait.setDisplaySize(70, 70);
      container.add(portrait);
    } else {
      // 占位
      const placeholder = this.add.graphics();
      placeholder.fillStyle(0x1E1E24, 1);
      placeholder.fillCircle(55, height / 2, 35);
      container.add(placeholder);

      const placeholderText = this.add.text(55, height / 2, '👤', {
        fontSize: '28px',
      }).setOrigin(0.5);
      container.add(placeholderText);
    }

    // 角色名称
    const nameText = this.add.text(120, 20, character.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: '20px',
      color: '#E8E6E3',
      fontStyle: 'bold',
    });
    container.add(nameText);

    // 角色称号
    const titleText = this.add.text(120, 48, character.title, {
      fontFamily: 'Noto Sans SC',
      fontSize: '13px',
      color: '#00FFAA',
    });
    container.add(titleText);

    // 表情数量
    const expressionCount = this.add.text(120, 72, `${character.expressions.length} 种表情`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#686868',
    });
    container.add(expressionCount);

    // 表情列表预览（小图标）
    const expressionPreview = this.add.text(120, 92, character.expressions.slice(0, 5).join(' · ') + (character.expressions.length > 5 ? ' ...' : ''), {
      fontFamily: 'Noto Sans SC',
      fontSize: '11px',
      color: '#4A4A4A',
    });
    container.add(expressionPreview);

    // 查看按钮
    const viewBtn = this.add.text(width - 60, height / 2, '查看 →', {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#4A9EFF',
    }).setOrigin(0.5);
    container.add(viewBtn);

    // 交互
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1E1E24, 1);
      bg.fillRoundedRect(0, 0, width, height, 12);
      bg.lineStyle(2, 0x00FFAA, 1);
      bg.strokeRoundedRect(0, 0, width, height, 12);
      viewBtn.setColor('#00FFAA');
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x141419, 1);
      bg.fillRoundedRect(0, 0, width, height, 12);
      bg.lineStyle(1, 0x2A2A30, 1);
      bg.strokeRoundedRect(0, 0, width, height, 12);
      viewBtn.setColor('#4A9EFF');
    });

    container.on('pointerdown', () => {
      this.showCharacterDetail(character);
    });

    return container;
  }

  private showCharacterDetail(character: ICharacterInfo): void {
    this.currentCharacter = character;
    this.isFullPreview = true;
    const { width, height } = this.scale;

    // 清空预览容器
    this.previewContainer.removeAll(true);

    // 半透明背景
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.95).setOrigin(0);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this.hideFullPreview());
    this.previewContainer.add(overlay);

    // 角色信息头部
    const headerPanel = this.add.graphics();
    headerPanel.fillStyle(0x141419, 1);
    headerPanel.fillRect(0, 0, width, 100);
    this.previewContainer.add(headerPanel);

    // 角色名
    const nameText = this.add.text(30, 25, `${character.name} (${character.nameEn})`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '24px',
      color: '#00FFAA',
      fontStyle: 'bold',
    });
    this.previewContainer.add(nameText);

    // 称号
    const titleText = this.add.text(30, 58, character.title, {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#A8A6A3',
    });
    this.previewContainer.add(titleText);

    // 关闭按钮
    const closeBtn = this.add.text(width - 40, 35, '✕', {
      fontSize: '28px',
      color: '#A8A6A3',
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF4444'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#A8A6A3'));
    closeBtn.on('pointerdown', () => this.hideFullPreview());
    this.previewContainer.add(closeBtn);

    // 表情网格
    const cardWidth = 140;
    const cardHeight = 180;
    const padding = 15;
    const startX = 30;
    const startY = 120;
    const cardsPerRow = Math.floor((width - 60) / (cardWidth + padding));

    character.expressions.forEach((expression, index) => {
      const col = index % cardsPerRow;
      const row = Math.floor(index / cardsPerRow);
      const x = startX + col * (cardWidth + padding);
      const y = startY + row * (cardHeight + padding);

      const card = this.createExpressionCard(x, y, cardWidth, cardHeight, character.id, expression);
      this.previewContainer.add(card);
    });

    // 底部提示
    const tipText = this.add.text(width / 2, height - 30, '点击表情可放大查看 | 按 ESC 关闭', {
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

  private createExpressionCard(
    x: number,
    y: number,
    width: number,
    height: number,
    characterId: CharacterId,
    expression: string
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x1E1E24, 1);
    bg.fillRoundedRect(0, 0, width, height, 8);
    bg.lineStyle(1, 0x2A2A30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 8);
    container.add(bg);

    // 头像
    const portraitKey = getPortraitKey(characterId, expression as any);
    const portraitUrl = CHARACTER_PORTRAITS[portraitKey];

    if (portraitUrl) {
      if (this.textures.exists(portraitKey)) {
        const portrait = this.add.image(width / 2, (height - 30) / 2, portraitKey);
        portrait.setDisplaySize(width - 20, width - 20);
        container.add(portrait);
      } else {
        // 动态加载
        this.load.image(portraitKey, portraitUrl);
        this.load.once('complete', () => {
          if (this.textures.exists(portraitKey)) {
            const portrait = this.add.image(width / 2, (height - 30) / 2, portraitKey);
            portrait.setDisplaySize(width - 20, width - 20);
            container.add(portrait);
          }
        });
        this.load.start();

        // 加载中
        const loading = this.add.text(width / 2, (height - 30) / 2, '⏳', {
          fontSize: '24px',
        }).setOrigin(0.5);
        container.add(loading);
      }
    } else {
      // 无图片
      const noImage = this.add.text(width / 2, (height - 30) / 2, '❌', {
        fontSize: '24px',
      }).setOrigin(0.5);
      container.add(noImage);
    }

    // 表情名
    const expressionText = this.add.text(width / 2, height - 20, expression, {
      fontFamily: 'Noto Sans SC',
      fontSize: '11px',
      color: '#A8A6A3',
    }).setOrigin(0.5);
    container.add(expressionText);

    // 交互
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2A2A30, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(2, 0x00FFAA, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
      expressionText.setColor('#00FFAA');
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1E1E24, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(1, 0x2A2A30, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
      expressionText.setColor('#A8A6A3');
    });

    return container;
  }

  private hideFullPreview(): void {
    this.isFullPreview = false;
    this.currentCharacter = null;

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

