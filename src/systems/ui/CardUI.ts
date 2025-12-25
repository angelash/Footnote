/**
 * 卡片UI系统
 * 处理卡片获取弹窗、卡片详情展示、卡片收藏界面
 * @module systems/ui/CardUI
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { TEXT_STYLES, COLORS } from '@/config/game.config';
import type { ICard } from '@/types';

// ==================== 配置常量 ====================

const CONFIG = {
  /** 卡片宽度 */
  CARD_WIDTH: 280,
  /** 卡片高度 */
  CARD_HEIGHT: 400,
  /** 卡片圆角 */
  CARD_RADIUS: 16,
  /** 获取动画时长 */
  OBTAIN_ANIMATION_DURATION: 800,
  /** 翻转动画时长 */
  FLIP_DURATION: 300,
};

// ==================== 类型定义 ====================

interface ICardUIConfig {
  scene: Phaser.Scene;
  onCardClosed?: (cardId: string) => void;
}

// ==================== CardUI类 ====================

/**
 * 卡片UI管理器
 */
export class CardUI {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  private _currentCard: ICard | null = null;
  private _isShowingFront: boolean = true;
  private _onCardClosed?: (cardId: string) => void;

  // UI元素
  private _overlay!: Phaser.GameObjects.Rectangle;
  private _cardContainer!: Phaser.GameObjects.Container;
  private _cardBackground!: Phaser.GameObjects.Graphics;
  private _cardTitle!: Phaser.GameObjects.Text;
  private _cardContent!: Phaser.GameObjects.Text;
  private _cardTypeIcon!: Phaser.GameObjects.Text;
  private _flipHint!: Phaser.GameObjects.Text;
  private _closeButton!: Phaser.GameObjects.Container;

  constructor(config: ICardUIConfig) {
    this._scene = config.scene;
    this._onCardClosed = config.onCardClosed;
    this._createUI();
    this._setupInput();
  }

  // ==================== 公共方法 ====================

  /**
   * 显示卡片获取动画
   */
  showCardObtain(card: ICard): void {
    this._currentCard = card;
    this._isShowingFront = true;

    this._updateCardDisplay();
    this._container.setVisible(true);
    this._overlay.setAlpha(0);
    this._cardContainer.setScale(0.3);
    this._cardContainer.setAlpha(0);
    this._cardContainer.setAngle(-10);

    // 背景淡入
    this._scene.tweens.add({
      targets: this._overlay,
      alpha: 0.7,
      duration: 300,
      ease: 'Power2',
    });

    // 卡片弹出动画
    this._scene.tweens.add({
      targets: this._cardContainer,
      scale: 1,
      alpha: 1,
      angle: 0,
      duration: CONFIG.OBTAIN_ANIMATION_DURATION,
      ease: 'Back.easeOut',
      onComplete: () => {
        // 发光特效
        this._playGlowEffect();
      },
    });

    eventBus.emit(GameEvent.CARD_VIEW, { cardId: card.id });
  }

  /**
   * 显示卡片详情（不带获取动画）
   */
  showCard(card: ICard): void {
    this._currentCard = card;
    this._isShowingFront = true;

    this._updateCardDisplay();
    this._container.setVisible(true);
    this._overlay.setAlpha(0);
    this._cardContainer.setScale(0.9);
    this._cardContainer.setAlpha(0);

    this._scene.tweens.add({
      targets: this._overlay,
      alpha: 0.7,
      duration: 200,
      ease: 'Power2',
    });

    this._scene.tweens.add({
      targets: this._cardContainer,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });

    eventBus.emit(GameEvent.CARD_VIEW, { cardId: card.id });
  }

  /**
   * 关闭卡片展示
   */
  closeCard(): void {
    if (!this._currentCard) return;

    const cardId = this._currentCard.id;

    this._scene.tweens.add({
      targets: [this._overlay, this._cardContainer],
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this._container.setVisible(false);
        eventBus.emit(GameEvent.CARD_CLOSE, { cardId });
        this._onCardClosed?.(cardId);
        this._currentCard = null;
      },
    });
  }

  /**
   * 翻转卡片
   */
  flipCard(): void {
    if (!this._currentCard) return;

    // 翻转动画
    this._scene.tweens.add({
      targets: this._cardContainer,
      scaleX: 0,
      duration: CONFIG.FLIP_DURATION / 2,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this._isShowingFront = !this._isShowingFront;
        this._updateCardDisplay();
        
        this._scene.tweens.add({
          targets: this._cardContainer,
          scaleX: 1,
          duration: CONFIG.FLIP_DURATION / 2,
          ease: 'Power2.easeOut',
        });
      },
    });
  }

  /**
   * 是否正在显示卡片
   */
  isVisible(): boolean {
    return this._container.visible;
  }

  /**
   * 销毁UI
   */
  destroy(): void {
    this._container.destroy();
  }

  // ==================== 私有方法 - UI创建 ====================

  private _createUI(): void {
    const { width, height } = this._scene.scale;

    this._container = this._scene.add.container(0, 0);
    this._container.setDepth(1100);
    this._container.setVisible(false);

    // 半透明遮罩
    this._overlay = this._scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0
    );
    this._container.add(this._overlay);

    // 卡片容器
    this._cardContainer = this._scene.add.container(width / 2, height / 2);
    this._container.add(this._cardContainer);

    // 卡片背景
    this._cardBackground = this._scene.add.graphics();
    this._cardContainer.add(this._cardBackground);

    // 卡片类型图标
    this._cardTypeIcon = this._scene.add.text(
      -CONFIG.CARD_WIDTH / 2 + 15,
      -CONFIG.CARD_HEIGHT / 2 + 15,
      '',
      { fontSize: '24px' }
    );
    this._cardContainer.add(this._cardTypeIcon);

    // 卡片标题
    this._cardTitle = this._scene.add.text(
      0,
      -CONFIG.CARD_HEIGHT / 2 + 60,
      '',
      {
        ...TEXT_STYLES.TITLE,
        fontSize: '22px',
      }
    ).setOrigin(0.5);
    this._cardContainer.add(this._cardTitle);

    // 卡片内容
    this._cardContent = this._scene.add.text(
      0,
      -CONFIG.CARD_HEIGHT / 2 + 120,
      '',
      {
        ...TEXT_STYLES.BODY,
        fontSize: '14px',
        wordWrap: { width: CONFIG.CARD_WIDTH - 40 },
        lineSpacing: 6,
        align: 'center',
      }
    ).setOrigin(0.5, 0);
    this._cardContainer.add(this._cardContent);

    // 翻转提示
    this._flipHint = this._scene.add.text(
      0,
      CONFIG.CARD_HEIGHT / 2 - 30,
      '点击翻转',
      {
        ...TEXT_STYLES.MUTED,
        fontSize: '12px',
      }
    ).setOrigin(0.5);
    this._cardContainer.add(this._flipHint);

    // 关闭按钮
    this._createCloseButton();
  }

  private _createCloseButton(): void {
    this._closeButton = this._scene.add.container(
      CONFIG.CARD_WIDTH / 2 - 15,
      -CONFIG.CARD_HEIGHT / 2 + 15
    );

    const closeCircle = this._scene.add.graphics();
    closeCircle.fillStyle(0x333333, 0.8);
    closeCircle.fillCircle(0, 0, 16);
    closeCircle.lineStyle(1, 0x666666, 1);
    closeCircle.strokeCircle(0, 0, 16);

    const closeX = this._scene.add.text(0, 0, '×', {
      fontSize: '20px',
      color: '#999999',
    }).setOrigin(0.5);

    this._closeButton.add([closeCircle, closeX]);
    this._closeButton.setSize(32, 32);
    this._closeButton.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        closeCircle.clear();
        closeCircle.fillStyle(0x444444, 1);
        closeCircle.fillCircle(0, 0, 16);
        closeCircle.lineStyle(1, 0x00FFAA, 1);
        closeCircle.strokeCircle(0, 0, 16);
        closeX.setColor('#FFFFFF');
      })
      .on('pointerout', () => {
        closeCircle.clear();
        closeCircle.fillStyle(0x333333, 0.8);
        closeCircle.fillCircle(0, 0, 16);
        closeCircle.lineStyle(1, 0x666666, 1);
        closeCircle.strokeCircle(0, 0, 16);
        closeX.setColor('#999999');
      })
      .on('pointerdown', () => {
        this.closeCard();
      });

    this._cardContainer.add(this._closeButton);
  }

  // ==================== 私有方法 - 卡片显示 ====================

  private _updateCardDisplay(): void {
    if (!this._currentCard) return;

    // 更新背景颜色（根据卡片类型）
    this._drawCardBackground();

    // 更新类型图标
    this._cardTypeIcon.setText(this._getTypeIcon());

    if (this._isShowingFront) {
      // 正面：标题和简介
      this._cardTitle.setText(this._currentCard.name);
      this._cardContent.setText(this._currentCard.front.join('\n'));
      this._flipHint.setText('点击翻转查看详情');
    } else {
      // 背面：详细内容
      this._cardTitle.setText(this._currentCard.name);
      this._cardContent.setText(this._currentCard.detail.join('\n'));
      this._flipHint.setText('点击翻转返回');
    }
  }

  private _drawCardBackground(): void {
    this._cardBackground.clear();

    // 根据卡片类型选择颜色
    const typeColors = {
      'archive': 0x1a3a4a,
      'item': 0x3a1a4a,
      'prayer': 0x4a3a1a,
      'verdict': 0x4a1a1a,
    };

    const bgColor = typeColors[this._currentCard?.type as keyof typeof typeColors] || COLORS.BG_SECONDARY;

    // 卡片背景
    this._cardBackground.fillStyle(bgColor, 0.95);
    this._cardBackground.fillRoundedRect(
      -CONFIG.CARD_WIDTH / 2,
      -CONFIG.CARD_HEIGHT / 2,
      CONFIG.CARD_WIDTH,
      CONFIG.CARD_HEIGHT,
      CONFIG.CARD_RADIUS
    );

    // 卡片边框
    this._cardBackground.lineStyle(2, COLORS.ACCENT, 0.8);
    this._cardBackground.strokeRoundedRect(
      -CONFIG.CARD_WIDTH / 2,
      -CONFIG.CARD_HEIGHT / 2,
      CONFIG.CARD_WIDTH,
      CONFIG.CARD_HEIGHT,
      CONFIG.CARD_RADIUS
    );

    // 内边框装饰
    this._cardBackground.lineStyle(1, COLORS.BORDER, 0.3);
    this._cardBackground.strokeRoundedRect(
      -CONFIG.CARD_WIDTH / 2 + 10,
      -CONFIG.CARD_HEIGHT / 2 + 10,
      CONFIG.CARD_WIDTH - 20,
      CONFIG.CARD_HEIGHT - 20,
      CONFIG.CARD_RADIUS - 4
    );
  }

  private _getTypeIcon(): string {
    const icons = {
      'archive': '📋',
      'item': '🔧',
      'prayer': '🙏',
      'verdict': '⚖️',
    };
    return icons[this._currentCard?.type as keyof typeof icons] || '📄';
  }

  private _playGlowEffect(): void {
    // 发光粒子效果
    const particles = this._scene.add.particles(
      this._cardContainer.x,
      this._cardContainer.y,
      'px_icon_star',
      {
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 800,
        quantity: 20,
        blendMode: 'ADD',
      }
    );

    // 自动销毁
    this._scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }

  // ==================== 私有方法 - 输入 ====================

  private _setupInput(): void {
    // 点击卡片翻转
    this._cardContainer.setInteractive(
      new Phaser.Geom.Rectangle(
        -CONFIG.CARD_WIDTH / 2,
        -CONFIG.CARD_HEIGHT / 2,
        CONFIG.CARD_WIDTH,
        CONFIG.CARD_HEIGHT
      ),
      Phaser.Geom.Rectangle.Contains
    );

    this._cardContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 如果点击的是关闭按钮区域，不翻转
      const localX = pointer.x - this._cardContainer.x;
      const localY = pointer.y - this._cardContainer.y;
      
      if (
        localX > CONFIG.CARD_WIDTH / 2 - 30 &&
        localY < -CONFIG.CARD_HEIGHT / 2 + 30
      ) {
        return;
      }

      this.flipCard();
    });

    // 点击遮罩关闭
    this._overlay.setInteractive({ useHandCursor: false });
    this._overlay.on('pointerdown', () => {
      this.closeCard();
    });

    // ESC键关闭
    this._scene.input.keyboard?.on('keydown-ESC', () => {
      if (this.isVisible()) {
        this.closeCard();
      }
    });
  }
}

