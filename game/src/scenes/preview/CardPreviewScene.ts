/**
 * 卡片预览场景
 *
 * 预览游戏卡片系统 - 从真实 YAML 数据加载
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';
import { loadCards } from '@/data/NarrativeDataLoader';
import { CONSTANTS } from '@/config/game.config';
// 注意：CARD_TYPE_COLORS 已在 colors.config 中定义，可供扩展使用
import type { ICard } from '@/types';

// 卡片类型配置（使用统一配置）
const CARD_TYPE_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  [CONSTANTS.CARD_TYPE.ARCHIVE]: { name: '档案', color: '#00FFAA', icon: '📁' },
  [CONSTANTS.CARD_TYPE.ITEM]: { name: '物品', color: '#FFD700', icon: '🎒' },
  [CONSTANTS.CARD_TYPE.MAP]: { name: '地图', color: '#4A9EFF', icon: '🗺️' },
  [CONSTANTS.CARD_TYPE.PRAYER]: { name: '祈言', color: '#9933FF', icon: '🙏' },
  [CONSTANTS.CARD_TYPE.RECEIPT]: { name: '收据', color: '#A8A6A3', icon: '🧾' },
  [CONSTANTS.CARD_TYPE.VERDICT]: { name: '判词', color: '#FF4444', icon: '⚖️' },
  [CONSTANTS.CARD_TYPE.DIARY]: { name: '日记', color: '#FF8C00', icon: '📔' },
};

// 卡片文件列表
const CARD_FILES = [
  'c0_cards', 'c1_cards', 'c2_cards', 'c3_cards',
  'c4_cards', 'c5_cards', 'cf_cards', 'rv_cards',
];

// 内部卡片数据格式（兼容旧代码）
interface ICardData {
  id: string;
  type: string;
  name: string;
  front: string[];
  detail: string[];
  chapter: string;
}

export class CardPreviewScene extends BasePreviewScene {
  protected title = '🃏 卡片预览';
  protected subtitle = '预览游戏卡片系统（从真实数据加载）';

  private previewContainer!: Phaser.GameObjects.Container;
  private isFullPreview = false;
  private _loadedCards: ICard[] = [];

  constructor() {
    super({ key: 'CardPreviewScene' });
  }

  protected createContent(width: number, _height: number): void {
    // 显示加载中
    const loadingText = this.add
      .text(width / 2, 200, '正在加载卡片数据...', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#686868',
      })
      .setOrigin(0.5);
    this.contentContainer.add(loadingText);

    // 异步加载真实卡片数据
    this._loadRealCards().then((cards) => {
      this._loadedCards = cards;
      loadingText.destroy();
      this._renderContent(width);
    });
  }

  private _renderContent(width: number): void {
    let currentY = 30;

    // 获取卡片数据
    const sampleCards = this._convertCardsToPreviewFormat(this._loadedCards);

    // 统计
    const stats = this.add
      .text(width / 2, currentY, `共 ${this._loadedCards.length} 张卡片，${Object.keys(CARD_TYPE_CONFIG).length} 种类型`, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#686868',
      })
      .setOrigin(0.5);
    this.contentContainer.add(stats);
    currentY += 55;

    // 卡片类型说明
    const typeSection = this.createSectionTitle(30, currentY, '卡片类型');
    this.contentContainer.add(typeSection);
    currentY += 55;

    // 类型网格 - 放大尺寸
    const typeItems = Object.entries(CARD_TYPE_CONFIG);
    const typeWidth = 230;
    const typeHeight = 90;
    const typePadding = 20;
    const typesPerRow = 4;

    typeItems.forEach(([type, config], index) => {
      const col = index % typesPerRow;
      const row = Math.floor(index / typesPerRow);
      const x = 30 + col * (typeWidth + typePadding);
      const y = currentY + row * (typeHeight + typePadding);

      const typeCard = this.createTypeCard(x, y, typeWidth, typeHeight, type, config);
      this.contentContainer.add(typeCard);
    });

    const typeRows = Math.ceil(typeItems.length / typesPerRow);
    currentY += typeRows * (typeHeight + typePadding) + 40;

    // 分隔线
    const divider1 = this.createDivider(currentY, width);
    this.contentContainer.add(divider1);
    currentY += 40;

    // 示例卡片
    const cardSection = this.createSectionTitle(30, currentY, '示例卡片');
    this.contentContainer.add(cardSection);
    currentY += 55;

    // 卡片网格 - 放大尺寸
    const cardWidth = 300;
    const cardHeight = 400;
    const cardPadding = 30;
    const cardsPerRow = 3;

    sampleCards.forEach((card, index) => {
      const col = index % cardsPerRow;
      const row = Math.floor(index / cardsPerRow);
      const x = 30 + col * (cardWidth + cardPadding);
      const y = currentY + row * (cardHeight + cardPadding);

      const cardContainer = this.createCardPreview(x, y, cardWidth, cardHeight, card);
      this.contentContainer.add(cardContainer);
    });

    const cardRows = Math.ceil(sampleCards.length / cardsPerRow);
    currentY += cardRows * (cardHeight + cardPadding) + 30;

    this.setContentHeight(currentY);

    // 全屏预览容器
    this.previewContainer = this.add.container(0, 0);
    this.previewContainer.setDepth(200);
    this.previewContainer.setVisible(false);
  }

  /**
   * 从真实 YAML 文件加载卡片数据
   */
  private async _loadRealCards(): Promise<ICard[]> {
    const allCards: ICard[] = [];

    for (const file of CARD_FILES) {
      try {
        const response = await fetch(`/src/data/cards/${file}.yaml`);
        if (response.ok) {
          const content = await response.text();
          const cards = loadCards(content);
          allCards.push(...cards);
        }
      } catch (error) {
        console.warn(`加载卡片文件失败: ${file}`, error);
      }
    }

    return allCards;
  }

  /**
   * 将 ICard 转换为预览格式
   */
  private _convertCardsToPreviewFormat(cards: ICard[]): ICardData[] {
    return cards.map((card) => ({
      id: card.id,
      type: card.type,
      name: card.name,
      front: card.front || [],
      detail: card.detail || [],
      chapter: card.chapter || 'unknown',
    }));
  }

  /**
   * 按类型分组卡片
   */
  private _groupCardsByType(cards: ICard[]): Record<string, ICard[]> {
    const groups: Record<string, ICard[]> = {};
    for (const card of cards) {
      if (!groups[card.type]) {
        groups[card.type] = [];
      }
      groups[card.type].push(card);
    }
    return groups;
  }

  private createTypeCard(
    x: number,
    y: number,
    width: number,
    height: number,
    type: string,
    config: { name: string; color: string; icon: string }
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    const colorValue = Phaser.Display.Color.HexStringToColor(config.color).color;
    bg.fillStyle(colorValue, 0.1);
    bg.fillRoundedRect(0, 0, width, height, 10);
    bg.lineStyle(2, colorValue, 0.5);
    bg.strokeRoundedRect(0, 0, width, height, 10);
    container.add(bg);

    const icon = this.add
      .text(20, height / 2, config.icon, {
        fontSize: '36px',
      })
      .setOrigin(0, 0.5);
    container.add(icon);

    const name = this.add.text(70, height / 2 - 12, config.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: config.color,
      fontStyle: 'bold',
    });
    container.add(name);

    const typeText = this.add.text(70, height / 2 + 18, type, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#4A4A4A',
    });
    container.add(typeText);

    return container;
  }

  private createCardPreview(
    x: number,
    y: number,
    width: number,
    height: number,
    card: ICardData
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const config = CARD_TYPE_CONFIG[card.type] || CARD_TYPE_CONFIG.archive;
    const colorValue = Phaser.Display.Color.HexStringToColor(config.color).color;

    // 卡片背景
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(0, 0, width, height, 16);
    bg.lineStyle(2, colorValue, 0.8);
    bg.strokeRoundedRect(0, 0, width, height, 16);
    container.add(bg);

    // 顶部装饰条
    const topBar = this.add.graphics();
    topBar.fillStyle(colorValue, 0.3);
    topBar.fillRoundedRect(0, 0, width, 60, { tl: 16, tr: 16, bl: 0, br: 0 });
    container.add(topBar);

    // 类型图标
    const icon = this.add
      .text(width / 2, 32, config.icon, {
        fontSize: '32px',
      })
      .setOrigin(0.5);
    container.add(icon);

    // 卡片标题
    const title = this.add
      .text(width / 2, 90, card.name, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#E8E6E3',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(title);

    // 类型标签
    const typeBadge = this.add.graphics();
    typeBadge.fillStyle(colorValue, 0.2);
    typeBadge.fillRoundedRect(width / 2 - 50, 120, 100, 32, 6);
    container.add(typeBadge);

    const typeText = this.add
      .text(width / 2, 136, config.name, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: config.color,
      })
      .setOrigin(0.5);
    container.add(typeText);

    // 分隔线
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x2a2a30, 1);
    divider.lineBetween(20, 165, width - 20, 165);
    container.add(divider);

    // 卡片内容（正面）
    const content = this.add.text(20, 180, card.front.join('\n'), {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#A8A6A3',
      wordWrap: { width: width - 40 },
      lineSpacing: 8,
    });
    container.add(content);

    // 章节信息
    const chapterText = this.add
      .text(width / 2, height - 45, card.chapter, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#4A4A4A',
      })
      .setOrigin(0.5);
    container.add(chapterText);

    // 卡片ID
    const idText = this.add
      .text(width / 2, height - 18, card.id, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.TINY,
        color: '#3A3A40',
      })
      .setOrigin(0.5);
    container.add(idText);

    // 交互
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1e1e24, 1);
      bg.fillRoundedRect(0, 0, width, height, 12);
      bg.lineStyle(2, colorValue, 1);
      bg.strokeRoundedRect(0, 0, width, height, 12);

      this.tweens.add({
        targets: container,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 100,
      });
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x141419, 1);
      bg.fillRoundedRect(0, 0, width, height, 12);
      bg.lineStyle(2, colorValue, 0.8);
      bg.strokeRoundedRect(0, 0, width, height, 12);

      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    container.on('pointerdown', () => {
      this.showCardDetail(card);
    });

    return container;
  }

  private showCardDetail(card: ICardData): void {
    this.isFullPreview = true;
    const { width, height } = this.scale;
    const config = CARD_TYPE_CONFIG[card.type] || CARD_TYPE_CONFIG.archive;
    const colorValue = Phaser.Display.Color.HexStringToColor(config.color).color;

    this.previewContainer.removeAll(true);

    // 背景
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this.hideFullPreview());
    this.previewContainer.add(overlay);

    // 放大的卡片
    const cardWidth = 500;
    const cardHeight = 700;
    const cardX = width / 2 - cardWidth / 2;
    const cardY = height / 2 - cardHeight / 2;

    // 卡片背景
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x141419, 1);
    cardBg.fillRoundedRect(cardX, cardY, cardWidth, cardHeight, 20);
    cardBg.lineStyle(3, colorValue, 1);
    cardBg.strokeRoundedRect(cardX, cardY, cardWidth, cardHeight, 20);
    this.previewContainer.add(cardBg);

    // 顶部装饰
    const topBar = this.add.graphics();
    topBar.fillStyle(colorValue, 0.3);
    topBar.fillRoundedRect(cardX, cardY, cardWidth, 100, { tl: 20, tr: 20, bl: 0, br: 0 });
    this.previewContainer.add(topBar);

    // 类型图标
    const icon = this.add
      .text(width / 2, cardY + 50, config.icon, {
        fontSize: '48px',
      })
      .setOrigin(0.5);
    this.previewContainer.add(icon);

    // 标题
    const title = this.add
      .text(width / 2, cardY + 135, card.name, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SECTION,
        color: '#E8E6E3',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.previewContainer.add(title);

    // 类型标签
    const typeBadge = this.add.graphics();
    typeBadge.fillStyle(colorValue, 0.2);
    typeBadge.fillRoundedRect(width / 2 - 65, cardY + 175, 130, 40, 8);
    this.previewContainer.add(typeBadge);

    const typeText = this.add
      .text(width / 2, cardY + 195, config.name, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: config.color,
      })
      .setOrigin(0.5);
    this.previewContainer.add(typeText);

    // 分隔线
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x2a2a30, 1);
    divider.lineBetween(cardX + 35, cardY + 235, cardX + cardWidth - 35, cardY + 235);
    this.previewContainer.add(divider);

    // 内容（正面 + 背面）
    const fullContent = [...card.front, '', ...card.detail].join('\n');
    const content = this.add.text(cardX + 35, cardY + 265, fullContent, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#A8A6A3',
      wordWrap: { width: cardWidth - 70 },
      lineSpacing: 12,
    });
    this.previewContainer.add(content);

    // 底部信息
    const chapterText = this.add
      .text(width / 2, cardY + cardHeight - 70, `章节: ${card.chapter}`, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#686868',
      })
      .setOrigin(0.5);
    this.previewContainer.add(chapterText);

    const idText = this.add
      .text(width / 2, cardY + cardHeight - 35, card.id, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#4A4A4A',
      })
      .setOrigin(0.5);
    this.previewContainer.add(idText);

    // 关闭按钮
    const closeBtn = this.add
      .text(cardX + cardWidth - 40, cardY + 35, '✕', {
        fontSize: '36px',
        color: '#A8A6A3',
      })
      .setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF4444'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#A8A6A3'));
    closeBtn.on('pointerdown', () => this.hideFullPreview());
    this.previewContainer.add(closeBtn);

    // 底部提示
    const tipText = this.add
      .text(width / 2, height - 40, '点击空白处或按 ESC 关闭', {
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
