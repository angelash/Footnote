/**
 * 物品栏UI
 * 展示已收集的卡片和物品
 * 支持键盘导航和屏幕阅读器
 * @module systems/ui/InventoryUI
 */

import Phaser from 'phaser';
import { narrativeEngine, CardCategory } from '@/systems/narrative';
import { TEXT_STYLES, COLORS } from '@/config/game.config';
import { UI, UI_FONT_SIZE } from '@/config/ui.config';
import { a11yManager } from '@/systems/accessibility/A11yManager';
import type { ICard as INarrativeCard } from '@/systems/narrative';

// ==================== 配置常量 ====================

const CONFIG = {
  /** 面板宽度 */
  PANEL_WIDTH: UI.PANEL.MD.WIDTH + 100,
  /** 面板高度 */
  PANEL_HEIGHT: 1000,
  /** 卡片缩略图大小 */
  CARD_THUMB_WIDTH: UI.CARD.THUMB.WIDTH,
  CARD_THUMB_HEIGHT: UI.CARD.THUMB.HEIGHT,
  /** 每行卡片数 */
  CARDS_PER_ROW: 3,
  /** 卡片间距 */
  CARD_SPACING: UI.SPACING.LG,
};

// ==================== 类型定义 ====================

interface IInventoryUIConfig {
  scene: Phaser.Scene;
  onCardSelect?: (cardId: string) => void;
  onClose?: () => void;
}

type TabType = 'all' | 'archive' | 'item' | 'prayer' | 'verdict';

// ==================== InventoryUI类 ====================

/** 焦点组ID */
const FOCUS_GROUP_TABS = 'inventory-tabs';
const FOCUS_GROUP_CARDS = 'inventory-cards';

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

  // 键盘导航
  private _keyDownHandler: ((event: KeyboardEvent) => void) | null = null;
  private _cardThumbnails: Phaser.GameObjects.Container[] = [];
  private _currentFocusMode: 'tabs' | 'cards' = 'tabs';

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

    // 设置键盘导航
    this._setupKeyboardNavigation();
    this._setupTabsFocusGroup();

    // 播报物品栏打开
    a11yManager.announceUIState('卡片收藏', 'opened');
  }

  /**
   * 隐藏物品栏
   */
  hide(): void {
    // 移除键盘导航
    this._removeKeyboardNavigation();

    // 播报物品栏关闭
    a11yManager.announceUIState('卡片收藏', 'closed');

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
    this._removeKeyboardNavigation();
    this._container.destroy();
  }

  // ==================== 私有方法 - UI创建 ====================

  private _createUI(): void {
    const { width, height } = this._scene.scale;

    this._container = this._scene.add.container(0, 0);
    this._container.setDepth(1500);
    this._container.setVisible(false);

    // 半透明背景
    const overlay = this._scene.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setInteractive()
      .on('pointerdown', () => this.hide());
    this._container.add(overlay);

    // 主面板
    const panel = this._scene.add.container(width / 2, height / 2);
    this._container.add(panel);

    // 面板背景
    const panelBg = this._scene.add.graphics();
    panelBg.fillStyle(COLORS.BG_SECONDARY, 0.98);
    panelBg.fillRoundedRect(
      -CONFIG.PANEL_WIDTH / 2,
      -CONFIG.PANEL_HEIGHT / 2,
      CONFIG.PANEL_WIDTH,
      CONFIG.PANEL_HEIGHT,
      16
    );
    panelBg.lineStyle(2, COLORS.BORDER, 1);
    panelBg.strokeRoundedRect(
      -CONFIG.PANEL_WIDTH / 2,
      -CONFIG.PANEL_HEIGHT / 2,
      CONFIG.PANEL_WIDTH,
      CONFIG.PANEL_HEIGHT,
      16
    );
    panel.add(panelBg);

    // 标题
    const title = this._scene.add
      .text(0, -CONFIG.PANEL_HEIGHT / 2 + 40, '卡片收藏', {
        ...TEXT_STYLES.TITLE,
        fontSize: UI_FONT_SIZE.SECTION,
      })
      .setOrigin(0.5);
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

    const x = this._scene.add
      .text(0, 0, '×', {
        fontSize: UI_FONT_SIZE.ICON,
        color: '#888888',
      })
      .setOrigin(0.5);

    container.add([bg, x]);
    container.setSize(UI.BUTTON.MIN_TOUCH_SIZE, UI.BUTTON.MIN_TOUCH_SIZE);
    container
      .setInteractive({ useHandCursor: true })
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

  private _createTabButton(
    x: number,
    y: number,
    label: string,
    type: TabType
  ): Phaser.GameObjects.Container {
    const container = this._scene.add.container(x, y);
    const tabWidth = 90;
    const tabHeight = UI.BUTTON.MIN_TOUCH_SIZE;

    const bg = this._scene.add.graphics();
    bg.setName('bg');

    const text = this._scene.add
      .text(0, 0, label, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.SMALL,
      })
      .setOrigin(0.5);
    text.setName('text');

    container.add([bg, text]);
    container.setSize(tabWidth, tabHeight);
    container.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
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
        bg.fillRoundedRect(-45, -22, 90, UI.BUTTON.MIN_TOUCH_SIZE, 6);
        bg.lineStyle(1, COLORS.ACCENT, 1);
        bg.strokeRoundedRect(-45, -22, 90, UI.BUTTON.MIN_TOUCH_SIZE, 6);
        text.setColor('#00FFAA');
      } else {
        text.setColor('#A8A6A3');
      }
    });
  }

  private _createStats(panel: Phaser.GameObjects.Container): void {
    const y = CONFIG.PANEL_HEIGHT / 2 - 50;

    const totalCards = narrativeEngine.getCardCount();
    const obtainedCount = narrativeEngine.getObtainedCards().length;

    const statsText = this._scene.add
      .text(0, y, `已收集: ${obtainedCount} / ${totalCards}`, {
        ...TEXT_STYLES.MUTED,
        fontSize: UI_FONT_SIZE.SMALL,
      })
      .setOrigin(0.5);
    statsText.setName('statsText');
    panel.add(statsText);
  }

  // ==================== 私有方法 - 卡片渲染 ====================

  private _refreshCards(): void {
    // 清除现有卡片
    this._cardsContainer.removeAll(true);
    this._cardThumbnails = [];

    // 获取卡片
    let cards: INarrativeCard[];
    if (this._currentTab === 'all') {
      // 获取所有已获得的卡片
      cards = narrativeEngine.getObtainedCards();
    } else {
      const categoryMap: Record<TabType, CardCategory> = {
        all: CardCategory.ARCHIVE,
        archive: CardCategory.ARCHIVE,
        item: CardCategory.ITEM,
        prayer: CardCategory.PRAYER,
        verdict: CardCategory.VERDICT,
      };
      cards = narrativeEngine.getCardsByCategory(categoryMap[this._currentTab]);
    }

    if (cards.length === 0) {
      const emptyText = this._scene.add
        .text(0, 100, '暂无卡片', {
          ...TEXT_STYLES.MUTED,
          fontSize: UI_FONT_SIZE.NORMAL,
        })
        .setOrigin(0.5);
      this._cardsContainer.add(emptyText);

      // 播报空状态
      a11yManager.announce('暂无卡片');
      return;
    }

    // 渲染卡片网格
    const startX =
      -((CONFIG.CARDS_PER_ROW - 1) * (CONFIG.CARD_THUMB_WIDTH + CONFIG.CARD_SPACING)) / 2;
    const startY = -CONFIG.PANEL_HEIGHT / 2 + 180;

    cards.forEach((card, index) => {
      const row = Math.floor(index / CONFIG.CARDS_PER_ROW);
      const col = index % CONFIG.CARDS_PER_ROW;
      const x = startX + col * (CONFIG.CARD_THUMB_WIDTH + CONFIG.CARD_SPACING);
      const y = startY + row * (CONFIG.CARD_THUMB_HEIGHT + CONFIG.CARD_SPACING);

      const cardThumb = this._createCardThumbnail(card, x, y);
      cardThumb.setData('card', card); // 保存卡片数据
      this._cardThumbnails.push(cardThumb);
      this._cardsContainer.add(cardThumb);
    });

    // 设置卡片焦点组
    this._setupCardsFocusGroup();

    // 播报卡片数量
    a11yManager.announce(`共 ${cards.length} 张卡片`);
  }

  private _createCardThumbnail(
    card: INarrativeCard,
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this._scene.add.container(x, y);

    // 卡片背景
    const bg = this._scene.add.graphics();
    const cardColor = this._getCardColor(card.category);
    bg.fillStyle(cardColor, 0.9);
    bg.fillRoundedRect(
      -CONFIG.CARD_THUMB_WIDTH / 2,
      -CONFIG.CARD_THUMB_HEIGHT / 2,
      CONFIG.CARD_THUMB_WIDTH,
      CONFIG.CARD_THUMB_HEIGHT,
      8
    );
    bg.lineStyle(1, COLORS.BORDER, 1);
    bg.strokeRoundedRect(
      -CONFIG.CARD_THUMB_WIDTH / 2,
      -CONFIG.CARD_THUMB_HEIGHT / 2,
      CONFIG.CARD_THUMB_WIDTH,
      CONFIG.CARD_THUMB_HEIGHT,
      8
    );

    // 类型图标
    const icon = this._scene.add.text(
      -CONFIG.CARD_THUMB_WIDTH / 2 + 10,
      -CONFIG.CARD_THUMB_HEIGHT / 2 + 10,
      this._getCategoryIcon(card.category),
      { fontSize: UI_FONT_SIZE.SMALL }
    );

    // 卡片标题
    const title = this._scene.add
      .text(0, 0, card.title, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.TINY,
        wordWrap: { width: CONFIG.CARD_THUMB_WIDTH - 20 },
        align: 'center',
      })
      .setOrigin(0.5);

    // 章节标记
    const chapter = this._scene.add
      .text(0, CONFIG.CARD_THUMB_HEIGHT / 2 - 20, card.chapter, {
        ...TEXT_STYLES.MUTED,
        fontSize: UI_FONT_SIZE.TINY,
      })
      .setOrigin(0.5);

    container.add([bg, icon, title, chapter]);
    container.setSize(CONFIG.CARD_THUMB_WIDTH, CONFIG.CARD_THUMB_HEIGHT);

    // 检查是否已查看
    const isViewed = narrativeEngine.hasCard(card.id);
    if (!isViewed) {
      // 新卡片标记
      const newBadge = this._scene.add
        .text(CONFIG.CARD_THUMB_WIDTH / 2 - 10, -CONFIG.CARD_THUMB_HEIGHT / 2 + 10, 'NEW', {
          fontSize: UI_FONT_SIZE.TINY,
          color: '#FFD700',
          backgroundColor: '#000000',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(1, 0);
      container.add(newBadge);
    }

    // 对可使用的卡片（ITEM/PRAYER）显示使用按钮
    const isUsable = narrativeEngine.isCardUsable(card.id);
    if (isUsable && (card.category === CardCategory.ITEM || card.category === CardCategory.PRAYER)) {
      const useBtn = this._createUseButton(card);
      useBtn.setPosition(0, CONFIG.CARD_THUMB_HEIGHT / 2 - 35);
      container.add(useBtn);
    }

    // 交互
    container
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(cardColor, 1);
        bg.fillRoundedRect(
          -CONFIG.CARD_THUMB_WIDTH / 2,
          -CONFIG.CARD_THUMB_HEIGHT / 2,
          CONFIG.CARD_THUMB_WIDTH,
          CONFIG.CARD_THUMB_HEIGHT,
          8
        );
        bg.lineStyle(2, COLORS.ACCENT, 1);
        bg.strokeRoundedRect(
          -CONFIG.CARD_THUMB_WIDTH / 2,
          -CONFIG.CARD_THUMB_HEIGHT / 2,
          CONFIG.CARD_THUMB_WIDTH,
          CONFIG.CARD_THUMB_HEIGHT,
          8
        );

        this._scene.tweens.add({
          targets: container,
          scale: 1.05,
          duration: 100,
        });
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(cardColor, 0.9);
        bg.fillRoundedRect(
          -CONFIG.CARD_THUMB_WIDTH / 2,
          -CONFIG.CARD_THUMB_HEIGHT / 2,
          CONFIG.CARD_THUMB_WIDTH,
          CONFIG.CARD_THUMB_HEIGHT,
          8
        );
        bg.lineStyle(1, COLORS.BORDER, 1);
        bg.strokeRoundedRect(
          -CONFIG.CARD_THUMB_WIDTH / 2,
          -CONFIG.CARD_THUMB_HEIGHT / 2,
          CONFIG.CARD_THUMB_WIDTH,
          CONFIG.CARD_THUMB_HEIGHT,
          8
        );

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

  /**
   * 创建使用按钮
   */
  private _createUseButton(card: INarrativeCard): Phaser.GameObjects.Container {
    const container = this._scene.add.container(0, 0);
    const btnWidth = 60;
    const btnHeight = 24;

    // 按钮背景
    const bg = this._scene.add.graphics();
    bg.fillStyle(0x00aa88, 0.9);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);
    bg.lineStyle(1, 0x00ffaa, 1);
    bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);

    // 按钮文字
    const text = this._scene.add
      .text(0, 0, '使用', {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#FFFFFF',
      })
      .setOrigin(0.5);

    // 效果预览（显示使用效果）
    const effectPreview = narrativeEngine.getCardEffectPreview(card.id);
    if (effectPreview.length > 0) {
      const previewText = this._scene.add
        .text(0, -18, effectPreview.join(' '), {
          fontSize: UI_FONT_SIZE.TINY,
          color: '#00FFAA',
        })
        .setOrigin(0.5);
      container.add(previewText);
    }

    container.add([bg, text]);
    container.setSize(btnWidth, btnHeight);

    // 交互
    container
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x00cc99, 1);
        bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);
        bg.lineStyle(2, 0x00ffaa, 1);
        bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x00aa88, 0.9);
        bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);
        bg.lineStyle(1, 0x00ffaa, 1);
        bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 4);
      })
      .on('pointerdown', () => {
        // 使用卡片
        const success = narrativeEngine.useCard(card.id);
        if (success) {
          // 显示使用成功提示
          this._showUseToast(card.title);

          // 刷新卡片显示
          this._refreshCards();

          // 播报使用成功
          a11yManager.announce(`已使用：${card.title}`, 'assertive');
        }
      });

    return container;
  }

  /**
   * 显示使用提示
   */
  private _showUseToast(cardTitle: string): void {
    const { width, height } = this._scene.scale;
    const toast = this._scene.add
      .text(width / 2, height / 2 - 200, `已使用：${cardTitle}`, {
        fontSize: UI_FONT_SIZE.NORMAL,
        color: '#00FFAA',
        backgroundColor: '#1a1a2e',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(2000)
      .setAlpha(0);

    this._scene.tweens.add({
      targets: toast,
      alpha: 1,
      y: height / 2 - 220,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this._scene.time.delayedCall(1500, () => {
          this._scene.tweens.add({
            targets: toast,
            alpha: 0,
            y: height / 2 - 240,
            duration: 200,
            onComplete: () => toast.destroy(),
          });
        });
      },
    });
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

  // ==================== 私有方法 - 键盘导航 ====================

  /**
   * 设置键盘导航
   */
  private _setupKeyboardNavigation(): void {
    if (this._keyDownHandler) return;

    this._keyDownHandler = (event: KeyboardEvent): void => {
      if (!this.isVisible()) return;

      // 构建按键标识
      let keyCode = event.code;
      if (event.shiftKey && keyCode === 'Tab') {
        keyCode = 'ShiftTab';
      }

      // 让 A11yManager 处理导航
      if (a11yManager.handleKeyboardNavigation(keyCode)) {
        event.preventDefault();
        return;
      }

      // ESC 关闭
      if (event.code === 'Escape') {
        this.hide();
        event.preventDefault();
        return;
      }

      // 切换标签/卡片模式
      if (event.code === 'ArrowDown' && this._currentFocusMode === 'tabs') {
        this._switchToCardsFocus();
        event.preventDefault();
        return;
      }

      if (event.code === 'ArrowUp' && this._currentFocusMode === 'cards') {
        this._switchToTabsFocus();
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('keydown', this._keyDownHandler);
  }

  /**
   * 移除键盘导航
   */
  private _removeKeyboardNavigation(): void {
    if (this._keyDownHandler) {
      window.removeEventListener('keydown', this._keyDownHandler);
      this._keyDownHandler = null;
    }

    // 销毁焦点组
    a11yManager.destroyFocusGroup(FOCUS_GROUP_TABS);
    a11yManager.destroyFocusGroup(FOCUS_GROUP_CARDS);
  }

  /**
   * 设置标签焦点组
   */
  private _setupTabsFocusGroup(): void {
    const focusGroup = a11yManager.createFocusGroup(FOCUS_GROUP_TABS, {
      wrapAround: true,
      autoFocus: true,
      groupName: '分类标签',
    });

    const tabs: { type: TabType; label: string }[] = [
      { type: 'all', label: '全部' },
      { type: 'archive', label: '档案' },
      { type: 'item', label: '物品' },
      { type: 'prayer', label: '祷词' },
      { type: 'verdict', label: '判决' },
    ];

    tabs.forEach((tab) => {
      const button = this._tabButtons.get(tab.type);
      if (button) {
        focusGroup.add({
          id: `tab-${tab.type}`,
          label: tab.label,
          role: 'tab',
          enabled: true,
          onFocus: () => this._highlightTab(tab.type, true),
          onBlur: () => this._highlightTab(tab.type, false),
          onActivate: () => {
            this._currentTab = tab.type;
            this._updateTabStyles();
            this._refreshCards();
            this._setupCardsFocusGroup();
          },
        });
      }
    });

    a11yManager.setActiveFocusGroup(FOCUS_GROUP_TABS);
    this._currentFocusMode = 'tabs';
  }

  /**
   * 设置卡片焦点组
   */
  private _setupCardsFocusGroup(): void {
    // 先销毁旧的卡片焦点组
    a11yManager.destroyFocusGroup(FOCUS_GROUP_CARDS);

    if (this._cardThumbnails.length === 0) return;

    const focusGroup = a11yManager.createFocusGroup(FOCUS_GROUP_CARDS, {
      wrapAround: true,
      autoFocus: false,
      groupName: '卡片列表',
    });

    this._cardThumbnails.forEach((card, index) => {
      const cardData = card.getData('card') as INarrativeCard | undefined;
      if (cardData) {
        focusGroup.add({
          id: `card-${index}`,
          label: cardData.title,
          role: 'listitem',
          enabled: true,
          onFocus: () => this._highlightCard(index, true),
          onBlur: () => this._highlightCard(index, false),
          onActivate: () => this._callbacks.onCardSelect?.(cardData.id),
        });
      }
    });
  }

  /**
   * 切换到卡片焦点
   */
  private _switchToCardsFocus(): void {
    if (this._cardThumbnails.length === 0) return;

    this._currentFocusMode = 'cards';
    a11yManager.setActiveFocusGroup(FOCUS_GROUP_CARDS);
    const focusGroup = a11yManager.getFocusGroup(FOCUS_GROUP_CARDS);
    focusGroup?.focusFirst();
  }

  /**
   * 切换到标签焦点
   */
  private _switchToTabsFocus(): void {
    this._currentFocusMode = 'tabs';
    a11yManager.setActiveFocusGroup(FOCUS_GROUP_TABS);
  }

  /**
   * 高亮标签
   */
  private _highlightTab(type: TabType, highlight: boolean): void {
    const btn = this._tabButtons.get(type);
    if (!btn) return;

    const bg = btn.getByName('bg') as Phaser.GameObjects.Graphics;
    const text = btn.getByName('text') as Phaser.GameObjects.Text;
    const isActive = type === this._currentTab;

    bg.clear();
    if (highlight || isActive) {
      bg.fillStyle(COLORS.ACCENT, highlight ? 0.4 : 0.2);
      bg.fillRoundedRect(-45, -22, 90, UI.BUTTON.MIN_TOUCH_SIZE, 6);
      bg.lineStyle(highlight ? 2 : 1, COLORS.ACCENT, 1);
      bg.strokeRoundedRect(-45, -22, 90, UI.BUTTON.MIN_TOUCH_SIZE, 6);
      text.setColor('#00FFAA');
    } else {
      text.setColor('#A8A6A3');
    }
  }

  /**
   * 高亮卡片
   */
  private _highlightCard(index: number, highlight: boolean): void {
    const container = this._cardThumbnails[index];
    if (!container) return;

    const bg = container.list[0] as Phaser.GameObjects.Graphics;
    const cardData = container.getData('card') as INarrativeCard | undefined;
    const cardColor = cardData ? this._getCardColor(cardData.category) : COLORS.BG_TERTIARY;

    bg.clear();
    if (highlight) {
      bg.fillStyle(cardColor, 1);
      bg.fillRoundedRect(
        -CONFIG.CARD_THUMB_WIDTH / 2,
        -CONFIG.CARD_THUMB_HEIGHT / 2,
        CONFIG.CARD_THUMB_WIDTH,
        CONFIG.CARD_THUMB_HEIGHT,
        8
      );
      bg.lineStyle(2, COLORS.ACCENT, 1);
      bg.strokeRoundedRect(
        -CONFIG.CARD_THUMB_WIDTH / 2,
        -CONFIG.CARD_THUMB_HEIGHT / 2,
        CONFIG.CARD_THUMB_WIDTH,
        CONFIG.CARD_THUMB_HEIGHT,
        8
      );

      this._scene.tweens.add({
        targets: container,
        scale: 1.05,
        duration: 100,
      });
    } else {
      bg.fillStyle(cardColor, 0.9);
      bg.fillRoundedRect(
        -CONFIG.CARD_THUMB_WIDTH / 2,
        -CONFIG.CARD_THUMB_HEIGHT / 2,
        CONFIG.CARD_THUMB_WIDTH,
        CONFIG.CARD_THUMB_HEIGHT,
        8
      );
      bg.lineStyle(1, COLORS.BORDER, 1);
      bg.strokeRoundedRect(
        -CONFIG.CARD_THUMB_WIDTH / 2,
        -CONFIG.CARD_THUMB_HEIGHT / 2,
        CONFIG.CARD_THUMB_WIDTH,
        CONFIG.CARD_THUMB_HEIGHT,
        8
      );

      this._scene.tweens.add({
        targets: container,
        scale: 1,
        duration: 100,
      });
    }
  }
}
