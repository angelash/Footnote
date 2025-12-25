/**
 * 物品栏UI
 * 展示已收集的卡片和物品
 * @module systems/ui/InventoryUI
 */

import Phaser from 'phaser';
import { narrativeEngine, CardCategory } from '@/systems/narrative';
import { TEXT_STYLES, COLORS } from '@/config/game.config';
import type { ICard as INarrativeCard } from '@/systems/narrative';

// ==================== 配置常量 ====================

const CONFIG = {
  /** 面板宽度 */
  PANEL_WIDTH: 650,
  /** 面板高度 */
  PANEL_HEIGHT: 900,
  /** 卡片缩略图大小 */
  CARD_THUMB_WIDTH: 140,
  CARD_THUMB_HEIGHT: 180,
  /** 每行卡片数 */
  CARDS_PER_ROW: 4,
  /** 卡片间距 */
  CARD_SPACING: 15,
};

// ==================== 类型定义 ====================

interface IInventoryUIConfig {
  scene: Phaser.Scene;
  onCardSelect?: (cardId: string) => void;
  onClose?: () => void;
}

type TabType = 'all' | 'archive' | 'item' | 'prayer' | 'verdict';

// ==================== InventoryUI类 ====================

/**
 * 物品栏UI
 */
export class InventoryUI {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  private _cardsContainer!: Phaser.GameObjects.Container;
  private _currentTab: TabType = 'all';
  private _callbacks: IInventoryUIConfig;
  private _tabButtons: Map<TabType, Phaser.GameObjects.Container> = new Map();

  constructor(config: IInventoryUIConfig) {
    this._scene = config.scene;
    this._callbacks = config;
    this._createUI();
  }

  // ==================== 公共方法 ====================

  /**
   * 显示物品栏
   */
  show(): void {
    this._refreshCards();
    
    this._container.setVisible(true);
    this._container.setAlpha(0);

    this._scene.tweens.add({
      targets: this._container,
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });
  }

  /**
   * 隐藏物品栏
   */
  hide(): void {
    this._scene.tweens.add({
      targets: this._container,
      alpha: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        this._container.setVisible(false);
        this._callbacks.onClose?.();
      },
    });
  }

  /**
   * 是否可见
   */
  isVisible(): boolean {
    return this._container.visible;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this._container.destroy();
  }

  // ==================== 私有方法 - UI创建 ====================

  private _createUI(): void {
    const { width, height } = this._scene.scale;

    this._container = this._scene.add.container(0, 0);
    this._container.setDepth(1500);
    this._container.setVisible(false);

    // 半透明背景
    const overlay = this._scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setInteractive()
      .on('pointerdown', () => this.hide());
    this._container.add(overlay);

    // 主面板
    const panel = this._scene.add.container(width / 2, height / 2);
    this._container.add(panel);

    // 面板背景
    const panelBg = this._scene.add.graphics();
    panelBg.fillStyle(COLORS.BG_SECONDARY, 0.98);
    panelBg.fillRoundedRect(-CONFIG.PANEL_WIDTH / 2, -CONFIG.PANEL_HEIGHT / 2, CONFIG.PANEL_WIDTH, CONFIG.PANEL_HEIGHT, 16);
    panelBg.lineStyle(2, COLORS.BORDER, 1);
    panelBg.strokeRoundedRect(-CONFIG.PANEL_WIDTH / 2, -CONFIG.PANEL_HEIGHT / 2, CONFIG.PANEL_WIDTH, CONFIG.PANEL_HEIGHT, 16);
    panel.add(panelBg);

    // 标题
    const title = this._scene.add.text(0, -CONFIG.PANEL_HEIGHT / 2 + 40, '卡片收藏', {
      ...TEXT_STYLES.TITLE,
      fontSize: '28px',
    }).setOrigin(0.5);
    panel.add(title);

    // 关闭按钮
    const closeBtn = this._createCloseButton();
    closeBtn.setPosition(CONFIG.PANEL_WIDTH / 2 - 40, -CONFIG.PANEL_HEIGHT / 2 + 40);
    panel.add(closeBtn);

    // 标签栏
    this._createTabs(panel);

    // 卡片容器
    this._cardsContainer = this._scene.add.container(0, 30);
    panel.add(this._cardsContainer);

    // 统计信息
    this._createStats(panel);
  }

  private _createCloseButton(): Phaser.GameObjects.Container {
    const container = this._scene.add.container(0, 0);

    const bg = this._scene.add.graphics();
    bg.fillStyle(COLORS.BG_TERTIARY, 1);
    bg.fillCircle(0, 0, 18);
    bg.lineStyle(1, COLORS.BORDER, 1);
    bg.strokeCircle(0, 0, 18);

    const x = this._scene.add.text(0, 0, '×', {
      fontSize: '24px',
      color: '#888888',
    }).setOrigin(0.5);

    container.add([bg, x]);
    container.setSize(36, 36);
    container.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.BG_SECONDARY, 1);
        bg.fillCircle(0, 0, 18);
        bg.lineStyle(1, COLORS.ACCENT, 1);
        bg.strokeCircle(0, 0, 18);
        x.setColor('#FFFFFF');
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(COLORS.BG_TERTIARY, 1);
        bg.fillCircle(0, 0, 18);
        bg.lineStyle(1, COLORS.BORDER, 1);
        bg.strokeCircle(0, 0, 18);
        x.setColor('#888888');
      })
      .on('pointerdown', () => this.hide());

    return container;
  }

  private _createTabs(panel: Phaser.GameObjects.Container): void {
    const tabs: { type: TabType; label: string }[] = [
      { type: 'all', label: '全部' },
      { type: 'archive', label: '档案' },
      { type: 'item', label: '物品' },
      { type: 'prayer', label: '祷词' },
      { type: 'verdict', label: '判决' },
    ];

    const tabWidth = 100;
    const startX = -((tabs.length - 1) * tabWidth) / 2;

    tabs.forEach((tab, index) => {
      const x = startX + index * tabWidth;
      const tabBtn = this._createTabButton(x, -CONFIG.PANEL_HEIGHT / 2 + 90, tab.label, tab.type);
      this._tabButtons.set(tab.type, tabBtn);
      panel.add(tabBtn);
    });

    this._updateTabStyles();
  }

  private _createTabButton(x: number, y: number, label: string, type: TabType): Phaser.GameObjects.Container {
    const container = this._scene.add.container(x, y);
    const tabWidth = 90;
    const tabHeight = 32;

    const bg = this._scene.add.graphics();
    bg.setName('bg');
    
    const text = this._scene.add.text(0, 0, label, {
      ...TEXT_STYLES.BODY,
      fontSize: '14px',
    }).setOrigin(0.5);
    text.setName('text');

    container.add([bg, text]);
    container.setSize(tabWidth, tabHeight);
    container.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this._currentTab = type;
        this._updateTabStyles();
        this._refreshCards();
      });

    return container;
  }

  private _updateTabStyles(): void {
    this._tabButtons.forEach((btn, type) => {
      const bg = btn.getByName('bg') as Phaser.GameObjects.Graphics;
      const text = btn.getByName('text') as Phaser.GameObjects.Text;
      const isActive = type === this._currentTab;

      bg.clear();
      if (isActive) {
        bg.fillStyle(COLORS.ACCENT, 0.2);
        bg.fillRoundedRect(-45, -16, 90, 32, 6);
        bg.lineStyle(1, COLORS.ACCENT, 1);
        bg.strokeRoundedRect(-45, -16, 90, 32, 6);
        text.setColor('#00FFAA');
      } else {
        text.setColor('#A8A6A3');
      }
    });
  }

  private _createStats(panel: Phaser.GameObjects.Container): void {
    const y = CONFIG.PANEL_HEIGHT / 2 - 50;

    const totalCards = narrativeEngine.getCardCount();
    const obtainedCount = narrativeEngine.getCardsByCategory('all').length;

    const statsText = this._scene.add.text(0, y, `已收集: ${obtainedCount} / ${totalCards}`, {
      ...TEXT_STYLES.MUTED,
      fontSize: '14px',
    }).setOrigin(0.5);
    statsText.setName('statsText');
    panel.add(statsText);
  }

  // ==================== 私有方法 - 卡片渲染 ====================

  private _refreshCards(): void {
    // 清除现有卡片
    this._cardsContainer.removeAll(true);

    // 获取卡片
    let cards: INarrativeCard[];
    if (this._currentTab === 'all') {
      cards = narrativeEngine.getCardsByCategory('all');
    } else {
      const categoryMap: Record<TabType, CardCategory> = {
        'all': CardCategory.ARCHIVE,
        'archive': CardCategory.ARCHIVE,
        'item': CardCategory.ITEM,
        'prayer': CardCategory.PRAYER,
        'verdict': CardCategory.VERDICT,
      };
      cards = narrativeEngine.getCardsByCategory(categoryMap[this._currentTab]);
    }

    if (cards.length === 0) {
      const emptyText = this._scene.add.text(0, 100, '暂无卡片', {
        ...TEXT_STYLES.MUTED,
        fontSize: '18px',
      }).setOrigin(0.5);
      this._cardsContainer.add(emptyText);
      return;
    }

    // 渲染卡片网格
    const startX = -((CONFIG.CARDS_PER_ROW - 1) * (CONFIG.CARD_THUMB_WIDTH + CONFIG.CARD_SPACING)) / 2;
    const startY = -CONFIG.PANEL_HEIGHT / 2 + 180;

    cards.forEach((card, index) => {
      const row = Math.floor(index / CONFIG.CARDS_PER_ROW);
      const col = index % CONFIG.CARDS_PER_ROW;
      const x = startX + col * (CONFIG.CARD_THUMB_WIDTH + CONFIG.CARD_SPACING);
      const y = startY + row * (CONFIG.CARD_THUMB_HEIGHT + CONFIG.CARD_SPACING);

      const cardThumb = this._createCardThumbnail(card, x, y);
      this._cardsContainer.add(cardThumb);
    });
  }

  private _createCardThumbnail(card: INarrativeCard, x: number, y: number): Phaser.GameObjects.Container {
    const container = this._scene.add.container(x, y);

    // 卡片背景
    const bg = this._scene.add.graphics();
    const cardColor = this._getCardColor(card.category);
    bg.fillStyle(cardColor, 0.9);
    bg.fillRoundedRect(-CONFIG.CARD_THUMB_WIDTH / 2, -CONFIG.CARD_THUMB_HEIGHT / 2, CONFIG.CARD_THUMB_WIDTH, CONFIG.CARD_THUMB_HEIGHT, 8);
    bg.lineStyle(1, COLORS.BORDER, 1);
    bg.strokeRoundedRect(-CONFIG.CARD_THUMB_WIDTH / 2, -CONFIG.CARD_THUMB_HEIGHT / 2, CONFIG.CARD_THUMB_WIDTH, CONFIG.CARD_THUMB_HEIGHT, 8);

    // 类型图标
    const icon = this._scene.add.text(
      -CONFIG.CARD_THUMB_WIDTH / 2 + 10,
      -CONFIG.CARD_THUMB_HEIGHT / 2 + 10,
      this._getCategoryIcon(card.category),
      { fontSize: '18px' }
    );

    // 卡片标题
    const title = this._scene.add.text(0, 0, card.title, {
      ...TEXT_STYLES.BODY,
      fontSize: '12px',
      wordWrap: { width: CONFIG.CARD_THUMB_WIDTH - 20 },
      align: 'center',
    }).setOrigin(0.5);

    // 章节标记
    const chapter = this._scene.add.text(
      0,
      CONFIG.CARD_THUMB_HEIGHT / 2 - 20,
      card.chapter,
      {
        ...TEXT_STYLES.MUTED,
        fontSize: '10px',
      }
    ).setOrigin(0.5);

    container.add([bg, icon, title, chapter]);
    container.setSize(CONFIG.CARD_THUMB_WIDTH, CONFIG.CARD_THUMB_HEIGHT);

    // 检查是否已查看
    const isViewed = narrativeEngine.hasCard(card.id);
    if (!isViewed) {
      // 新卡片标记
      const newBadge = this._scene.add.text(
        CONFIG.CARD_THUMB_WIDTH / 2 - 10,
        -CONFIG.CARD_THUMB_HEIGHT / 2 + 10,
        'NEW',
        {
          fontSize: '10px',
          color: '#FFD700',
          backgroundColor: '#000000',
          padding: { x: 4, y: 2 },
        }
      ).setOrigin(1, 0);
      container.add(newBadge);
    }

    // 交互
    container.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(cardColor, 1);
        bg.fillRoundedRect(-CONFIG.CARD_THUMB_WIDTH / 2, -CONFIG.CARD_THUMB_HEIGHT / 2, CONFIG.CARD_THUMB_WIDTH, CONFIG.CARD_THUMB_HEIGHT, 8);
        bg.lineStyle(2, COLORS.ACCENT, 1);
        bg.strokeRoundedRect(-CONFIG.CARD_THUMB_WIDTH / 2, -CONFIG.CARD_THUMB_HEIGHT / 2, CONFIG.CARD_THUMB_WIDTH, CONFIG.CARD_THUMB_HEIGHT, 8);
        
        this._scene.tweens.add({
          targets: container,
          scale: 1.05,
          duration: 100,
        });
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(cardColor, 0.9);
        bg.fillRoundedRect(-CONFIG.CARD_THUMB_WIDTH / 2, -CONFIG.CARD_THUMB_HEIGHT / 2, CONFIG.CARD_THUMB_WIDTH, CONFIG.CARD_THUMB_HEIGHT, 8);
        bg.lineStyle(1, COLORS.BORDER, 1);
        bg.strokeRoundedRect(-CONFIG.CARD_THUMB_WIDTH / 2, -CONFIG.CARD_THUMB_HEIGHT / 2, CONFIG.CARD_THUMB_WIDTH, CONFIG.CARD_THUMB_HEIGHT, 8);
        
        this._scene.tweens.add({
          targets: container,
          scale: 1,
          duration: 100,
        });
      })
      .on('pointerdown', () => {
        this._callbacks.onCardSelect?.(card.id);
      });

    return container;
  }

  private _getCardColor(category: CardCategory): number {
    const colors: Record<string, number> = {
      [CardCategory.ARCHIVE]: 0x1a3a4a,
      [CardCategory.ITEM]: 0x3a1a4a,
      [CardCategory.PRAYER]: 0x4a3a1a,
      [CardCategory.VERDICT]: 0x4a1a1a,
      [CardCategory.DIARY]: 0x2a2a3a,
    };
    return colors[category] || COLORS.BG_TERTIARY;
  }

  private _getCategoryIcon(category: CardCategory): string {
    const icons: Record<string, string> = {
      [CardCategory.ARCHIVE]: '📋',
      [CardCategory.ITEM]: '🔧',
      [CardCategory.PRAYER]: '🙏',
      [CardCategory.VERDICT]: '⚖️',
      [CardCategory.DIARY]: '📖',
    };
    return icons[category] || '📄';
  }
}



