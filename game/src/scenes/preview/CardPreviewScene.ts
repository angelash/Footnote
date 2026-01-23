/**
 * 卡片预览场景
 *
 * 预览游戏卡片系统
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';

// 卡片类型配置
const CARD_TYPE_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  archive: { name: '档案', color: '#00FFAA', icon: '📁' },
  item: { name: '物品', color: '#FFD700', icon: '🎒' },
  map: { name: '地图', color: '#4A9EFF', icon: '🗺️' },
  prayer: { name: '祈祷', color: '#9933FF', icon: '🙏' },
  receipt: { name: '收据', color: '#A8A6A3', icon: '🧾' },
  verdict: { name: '判决', color: '#FF4444', icon: '⚖️' },
  diary: { name: '日记', color: '#FF8C00', icon: '📔' },
};

// 示例卡片数据（统一格式）
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
  protected subtitle = '预览游戏卡片系统';

  private previewContainer!: Phaser.GameObjects.Container;
  private isFullPreview = false;

  constructor() {
    super({ key: 'CardPreviewScene' });
  }

  protected createContent(width: number, _height: number): void {
    let currentY = 30;

    // 获取示例卡片
    const sampleCards = this.getSampleCards();

    // 统计
    const stats = this.add
      .text(width / 2, currentY, `${Object.keys(CARD_TYPE_CONFIG).length} 种卡片类型`, {
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

  private getSampleCards(): ICardData[] {
    return [
      {
        id: 'CARD_C0_01',
        type: 'archive',
        name: '维修局员工证',
        front: ['岑回的员工证', '编号位置有明显的涂改痕迹'],
        detail: ['持证人：岑回', '编号：EX-7749', '——', '背面有一道细小的划痕'],
        chapter: 'C0',
      },
      {
        id: 'CARD_C1_01',
        type: 'item',
        name: '旧钥匙',
        front: ['一把锈迹斑斑的钥匙', '不知道能打开什么'],
        detail: ['材质：铜', '——', '似乎很久没人用过了'],
        chapter: 'C1',
      },
      {
        id: 'CARD_C2_01',
        type: 'archive',
        name: '边缘区地图',
        front: ['宋岚手绘的边缘区地图', '标注了多个危险位置'],
        detail: ['版本：V-A', '注：与官方版本存在差异', '——', '差异被记录下来'],
        chapter: 'C2',
      },
      {
        id: 'CARD_C3_01',
        type: 'prayer',
        name: '栖蓝的祈祷',
        front: ['愿那些被遗忘的名字', '在某个角落仍被记得'],
        detail: ['——', '这不是祈求，只是希望'],
        chapter: 'C3',
      },
      {
        id: 'CARD_C4_01',
        type: 'verdict',
        name: '系统判决书',
        front: ['对象：阿棠', '判定：对账失败'],
        detail: ['处理：等待收敛', '——', '系统从不解释"为什么"'],
        chapter: 'C4',
      },
      {
        id: 'CARD_C5_01',
        type: 'diary',
        name: '岑回的日记',
        front: ['今天又梦到了那个声音', '它说：你是例外'],
        detail: ['日期：?/?/?', '——', '我不确定这是梦还是记忆'],
        chapter: 'C5',
      },
    ];
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
