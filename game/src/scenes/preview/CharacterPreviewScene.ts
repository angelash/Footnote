/**
 * 角色预览场景 (Prefab 模式)
 *
 * 预览8个角色的完整表现：
 * - 所有表情立绘
 * - 在对话框中的展示效果
 * - 角色信息卡片
 */

import Phaser from 'phaser';
import { createLogger } from '@/utils/Logger';

const logger = createLogger('CharacterPreview');
import { BasePreviewScene } from './BasePreviewScene';
import {
  CHARACTERS,
  CharacterId,
  getPortraitKey,
  ICharacterInfo,
  type CharacterExpression,
} from '@/config/characters.config';
import { CHARACTER_PORTRAITS } from '@/data/webpAssets';
import { DialogueUI } from '@/systems/ui/DialogueUI';
import { getCharacterSampleDialogues } from './PreviewDataLoader';
import type { IDialogue } from '@/types';

export class CharacterPreviewScene extends BasePreviewScene {
  protected title = '👤 角色预览';
  protected subtitle = '预览角色立绘、表情和对话框表现';

  private previewContainer!: Phaser.GameObjects.Container;
  private isFullPreview = false;
  private _currentCharacter: ICharacterInfo | null = null;

  // 对话预览
  private _dialoguePreviewContainer!: Phaser.GameObjects.Container;
  private _dialogueUI: DialogueUI | null = null;

  constructor() {
    super({ key: 'CharacterPreviewScene' });
  }

  protected createContent(width: number, _height: number): void {
    let currentY = 30;

    // 统计
    const totalPortraits = Object.keys(CHARACTER_PORTRAITS).length;
    const stats = this.add
      .text(width / 2, currentY, `8个角色，共 ${totalPortraits} 张头像`, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#686868',
      })
      .setOrigin(0.5);
    this.contentContainer.add(stats);
    currentY += 50;

    // 角色列表
    const characters = Object.values(CHARACTERS);
    const cardWidth = width - 80;
    const cardHeight = 200;
    const cardPadding = 25;

    characters.forEach((character, index) => {
      const y = currentY + index * (cardHeight + cardPadding);
      const card = this.createCharacterCard(40, y, cardWidth, cardHeight, character);
      this.contentContainer.add(card);
    });

    currentY += characters.length * (cardHeight + cardPadding) + 20;
    this.setContentHeight(currentY);

    // 全屏预览容器
    this.previewContainer = this.add.container(0, 0);
    this.previewContainer.setDepth(200);
    this.previewContainer.setVisible(false);

    // 对话预览容器
    this._dialoguePreviewContainer = this.add.container(0, 0);
    this._dialoguePreviewContainer.setDepth(300);
    this._dialoguePreviewContainer.setVisible(false);
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
    bg.lineStyle(1, 0x2a2a30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 12);
    container.add(bg);

    // 头像预览区
    const portraitKey = getPortraitKey(character.id, character.defaultExpression);
    const portraitUrl = CHARACTER_PORTRAITS[portraitKey];

    if (portraitUrl && this.textures.exists(portraitKey)) {
      const portrait = this.add.image(70, height / 2, portraitKey);
      portrait.setDisplaySize(90, 90);
      container.add(portrait);
    } else {
      // 占位
      const placeholder = this.add.graphics();
      placeholder.fillStyle(0x1e1e24, 1);
      placeholder.fillCircle(70, height / 2, 45);
      container.add(placeholder);

      const placeholderText = this.add
        .text(70, height / 2, '👤', {
          fontSize: '36px',
        })
        .setOrigin(0.5);
      container.add(placeholderText);
    }

    // 角色名称
    const nameText = this.add.text(160, 30, character.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SECTION,
      color: '#E8E6E3',
      fontStyle: 'bold',
    });
    container.add(nameText);

    // 角色称号
    const titleText = this.add.text(160, 75, character.title, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#00FFAA',
    });
    container.add(titleText);

    // 表情数量
    const expressionCount = this.add.text(160, 115, `${character.expressions.length} 种表情`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#686868',
    });
    container.add(expressionCount);

    // 表情列表预览（小图标）
    const expressionPreview = this.add.text(
      160,
      150,
      character.expressions.slice(0, 5).join(' · ') +
        (character.expressions.length > 5 ? ' ...' : ''),
      {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#4A4A4A',
      }
    );
    container.add(expressionPreview);

    // 查看按钮
    const viewBtn = this.add
      .text(width - 100, height / 2, '查看 →', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#4A9EFF',
      })
      .setOrigin(0.5);
    container.add(viewBtn);

    // 交互
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1e1e24, 1);
      bg.fillRoundedRect(0, 0, width, height, 12);
      bg.lineStyle(2, 0x00ffaa, 1);
      bg.strokeRoundedRect(0, 0, width, height, 12);
      viewBtn.setColor('#00FFAA');
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x141419, 1);
      bg.fillRoundedRect(0, 0, width, height, 12);
      bg.lineStyle(1, 0x2a2a30, 1);
      bg.strokeRoundedRect(0, 0, width, height, 12);
      viewBtn.setColor('#4A9EFF');
    });

    container.on('pointerdown', () => {
      this.showCharacterDetail(character);
    });

    return container;
  }

  private showCharacterDetail(character: ICharacterInfo): void {
    this._currentCharacter = character;
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
      fontSize: this.FONT_SIZE.SECTION,
      color: '#00FFAA',
      fontStyle: 'bold',
    });
    this.previewContainer.add(nameText);

    // 称号
    const titleText = this.add.text(30, 70, character.title, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#A8A6A3',
    });
    this.previewContainer.add(titleText);

    // 关闭按钮
    const closeBtn = this.add
      .text(width - 40, 45, '✕', {
        fontSize: '36px',
        color: '#A8A6A3',
      })
      .setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF4444'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#A8A6A3'));
    closeBtn.on('pointerdown', () => this.hideFullPreview());
    this.previewContainer.add(closeBtn);

    // 表情网格
    const cardWidth = 180;
    const cardHeight = 220;
    const padding = 20;
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

    // 对话预览按钮
    const dialoguePreviewBtn = this.add.graphics();
    dialoguePreviewBtn.fillStyle(0x4a9eff, 0.2);
    dialoguePreviewBtn.fillRoundedRect(width / 2 - 140, height - 100, 280, 55, 10);
    dialoguePreviewBtn.lineStyle(2, 0x4a9eff, 1);
    dialoguePreviewBtn.strokeRoundedRect(width / 2 - 140, height - 100, 280, 55, 10);
    this.previewContainer.add(dialoguePreviewBtn);

    const dialogueBtnText = this.add
      .text(width / 2, height - 72, '💬 预览对话框效果', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#4A9EFF',
      })
      .setOrigin(0.5);
    this.previewContainer.add(dialogueBtnText);

    const dialogueHitArea = this.add
      .rectangle(width / 2, height - 72, 280, 55, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    dialogueHitArea.on('pointerover', () => dialogueBtnText.setColor('#00FFAA'));
    dialogueHitArea.on('pointerout', () => dialogueBtnText.setColor('#4A9EFF'));
    dialogueHitArea.on('pointerdown', () => this._showDialoguePreview(character));
    this.previewContainer.add(dialogueHitArea);

    // 底部提示
    const tipText = this.add
      .text(width / 2, height - 30, '点击表情查看 | 按 ESC 关闭', {
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
    bg.fillStyle(0x1e1e24, 1);
    bg.fillRoundedRect(0, 0, width, height, 8);
    bg.lineStyle(1, 0x2a2a30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 8);
    container.add(bg);

    // 头像
    const portraitKey = getPortraitKey(characterId, expression as CharacterExpression);
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
        const loading = this.add
          .text(width / 2, (height - 30) / 2, '⏳', {
            fontSize: '24px',
          })
          .setOrigin(0.5);
        container.add(loading);
      }
    } else {
      // 无图片
      const noImage = this.add
        .text(width / 2, (height - 30) / 2, '❌', {
          fontSize: '24px',
        })
        .setOrigin(0.5);
      container.add(noImage);
    }

    // 表情名
    const expressionText = this.add
      .text(width / 2, height - 25, expression, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#A8A6A3',
      })
      .setOrigin(0.5);
    container.add(expressionText);

    // 交互
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2a2a30, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(2, 0x00ffaa, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
      expressionText.setColor('#00FFAA');
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1e1e24, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(1, 0x2a2a30, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
      expressionText.setColor('#A8A6A3');
    });

    return container;
  }

  private hideFullPreview(): void {
    this.isFullPreview = false;
    this._currentCharacter = null;

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

  /**
   * 显示对话框预览
   */
  private _showDialoguePreview(character: ICharacterInfo): void {
    const { width, height } = this.scale;

    // 清空容器
    this._dialoguePreviewContainer.removeAll(true);

    // 半透明遮罩
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this._hideDialoguePreview());
    this._dialoguePreviewContainer.add(overlay);

    // 模拟游戏场景背景
    const sceneBg = this.add.graphics();
    sceneBg.fillStyle(0x1a1a1f, 1);
    sceneBg.fillRect(50, 100, width - 100, height - 300);
    sceneBg.lineStyle(1, 0x2a2a30, 1);
    sceneBg.strokeRect(50, 100, width - 100, height - 300);
    this._dialoguePreviewContainer.add(sceneBg);

    // 标题
    const title = this.add
      .text(width / 2, 60, `💬 ${character.name} 对话框预览`, {
        fontFamily: 'Noto Sans SC',
        fontSize: '18px',
        color: '#00FFAA',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this._dialoguePreviewContainer.add(title);

    // 创建对话UI
    this._dialogueUI = new DialogueUI({
      scene: this,
      onDialogueEnd: (): void => {
        logger.debug('对话结束');
      },
    });

    // 异步加载真实对话数据，然后显示对话
    getCharacterSampleDialogues().then((sampleDialogues) => {
      const dialogue: IDialogue = {
        id: `preview_${character.id}`,
        speaker: character.name,
        text:
          sampleDialogues[character.id] ||
          `这是${character.name}的示例对话文本，用于展示角色在对话框中的表现效果。`,
        expression: character.defaultExpression,
      };

      this.time.delayedCall(300, () => {
        this._dialogueUI?.showDialogue(dialogue);
      });
    });

    // 关闭按钮
    const closeBtn = this.add
      .text(width - 60, 60, '✕ 关闭', {
        fontFamily: 'Noto Sans SC',
        fontSize: '14px',
        color: '#686868',
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF4444'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#686868'));
    closeBtn.on('pointerdown', () => this._hideDialoguePreview());
    this._dialoguePreviewContainer.add(closeBtn);

    // 切换表情提示
    const expressionTip = this.add
      .text(width / 2, height - 30, '💡 这是使用 DialogueUI 组件渲染的真实对话框', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.TINY,
        color: '#4A4A4A',
      })
      .setOrigin(0.5);
    this._dialoguePreviewContainer.add(expressionTip);

    this._dialoguePreviewContainer.setVisible(true);
  }

  /**
   * 隐藏对话框预览
   */
  private _hideDialoguePreview(): void {
    this._dialogueUI?.destroy();
    this._dialogueUI = null;
    this._dialoguePreviewContainer.setVisible(false);
    this._dialoguePreviewContainer.removeAll(true);
  }

  protected setupKeyboard(): void {
    super.setupKeyboard();

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this._dialoguePreviewContainer.visible) {
        this._hideDialoguePreview();
      } else if (this.isFullPreview) {
        this.hideFullPreview();
      } else {
        this.goBack();
      }
    });
  }

  shutdown(): void {
    this._dialogueUI?.destroy();
    super.shutdown();
  }
}
