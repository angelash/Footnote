/**
 * 操作指引 UI 组件
 * 常驻显示控制提示，根据设备类型显示不同内容
 * @module systems/ui/ControlHints
 */

import Phaser from 'phaser';
import {
  UI_FONT_SIZE,
  UI_SPACING,
  UI_ALPHA,
  UI_DEPTH,
  UI_ANIMATION,
  UI_RADIUS,
  UI_FONT_FAMILY,
} from '@/config/ui.config';

export interface IControlHintsConfig {
  scene: Phaser.Scene;
  /** 是否移动设备 */
  isMobile?: boolean;
  /** 初始显示状态 */
  visible?: boolean;
  /** 位置：'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface IHintItem {
  key: string;
  action: string;
  icon?: string;
}

/**
 * 操作指引 UI 组件
 * 在游戏界面常驻显示操作提示
 */
export class ControlHints {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  private _background!: Phaser.GameObjects.Graphics;
  private _isMobile: boolean;
  private _isVisible: boolean = true;
  private _position: string;

  // 切换按钮
  private _toggleButton!: Phaser.GameObjects.Container;
  private _isExpanded: boolean = true;

  constructor(config: IControlHintsConfig) {
    this._scene = config.scene;
    this._isMobile = config.isMobile ?? this._detectMobile();
    this._isVisible = config.visible ?? true;
    this._position = config.position ?? 'top-left';

    this._create();
  }

  /**
   * 检测是否为移动设备
   */
  private _detectMobile(): boolean {
    const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const hasFinePointer = window.matchMedia?.('(pointer: fine)').matches ?? false;
    const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    return (hasCoarsePointer && !hasFinePointer) || mobileUserAgent;
  }

  /**
   * 创建UI
   */
  private _create(): void {
    const { width, height } = this._scene.scale;

    // 根据位置计算坐标
    let x = UI_SPACING.MD;
    let y = 120; // 留出顶部HUD空间

    if (this._position.includes('right')) {
      x = width - UI_SPACING.MD;
    }
    if (this._position.includes('bottom')) {
      y = height - 200;
    }

    this._container = this._scene.add.container(x, y);
    this._container.setDepth(UI_DEPTH.UI_BASE);

    // 创建背景
    this._createBackground();

    // 创建提示内容
    this._createHints();

    // 创建展开/折叠按钮
    this._createToggleButton();

    // 初始状态
    if (!this._isVisible) {
      this._container.setVisible(false);
    }
  }

  /**
   * 创建背景
   */
  private _createBackground(): void {
    this._background = this._scene.add.graphics();
    this._updateBackground();
    this._container.add(this._background);
  }

  /**
   * 更新背景大小
   */
  private _updateBackground(): void {
    const hints = this._getHints();
    const LINE_HEIGHT = 28;
    const PADDING_Y = UI_SPACING.SM;
    const TITLE_HEIGHT = 32;

    const contentHeight = this._isExpanded
      ? TITLE_HEIGHT + hints.length * LINE_HEIGHT + PADDING_Y * 2
      : TITLE_HEIGHT + PADDING_Y;

    const contentWidth = 200;

    this._background.clear();
    this._background.fillStyle(0x0a0a0f, UI_ALPHA.HEAVY);
    this._background.fillRoundedRect(0, 0, contentWidth, contentHeight, UI_RADIUS.MD);
    this._background.lineStyle(1, 0x3a3a40, UI_ALPHA.MEDIUM);
    this._background.strokeRoundedRect(0, 0, contentWidth, contentHeight, UI_RADIUS.MD);
  }

  /**
   * 获取提示内容
   */
  private _getHints(): IHintItem[] {
    if (this._isMobile) {
      return [
        { key: '🎮', action: '摇杆移动', icon: '左下角' },
        { key: '👆', action: '点击交互', icon: '右下角' },
        { key: '👁️', action: '深度感知', icon: '能力1' },
        { key: '✋', action: '深度介入', icon: '能力2' },
        { key: '⏪', action: '时间干预', icon: '能力3' },
      ];
    } else {
      return [
        { key: 'WASD/方向键', action: '移动' },
        { key: '点击物体', action: '交互' },
        { key: 'ESC', action: '暂停菜单' },
        { key: 'I', action: '物品栏' },
        { key: '1/2/3', action: '能力' },
      ];
    }
  }

  /**
   * 创建提示内容
   */
  private _createHints(): void {
    const hints = this._getHints();
    const paddingX = UI_SPACING.MD;
    const paddingY = UI_SPACING.SM;
    const lineHeight = 28;
    const titleHeight = 32;

    // 标题
    const title = this._scene.add
      .text(paddingX, paddingY, '📖 操作指引', {
        fontFamily: UI_FONT_FAMILY.DEFAULT,
        fontSize: UI_FONT_SIZE.SMALL,
        color: '#00FFAA',
      })
      .setName('hints_title');
    this._container.add(title);

    // 提示条目
    hints.forEach((hint, index) => {
      const y = titleHeight + paddingY + index * lineHeight;

      // 按键/图标
      const keyText = this._scene.add
        .text(paddingX, y, hint.key, {
          fontFamily: UI_FONT_FAMILY.DEFAULT,
          fontSize: UI_FONT_SIZE.TINY,
          color: '#4A9EFF',
        })
        .setName(`hint_key_${index}`);

      // 动作说明
      const actionText = this._scene.add
        .text(paddingX + 90, y, hint.action, {
          fontFamily: UI_FONT_FAMILY.DEFAULT,
          fontSize: UI_FONT_SIZE.TINY,
          color: '#A8A6A3',
        })
        .setName(`hint_action_${index}`);

      this._container.add([keyText, actionText]);
    });
  }

  /**
   * 创建展开/折叠按钮
   */
  private _createToggleButton(): void {
    const PADDING_Y = UI_SPACING.SM;

    const buttonX = 180;
    const buttonY = PADDING_Y + 8;

    this._toggleButton = this._scene.add.container(buttonX, buttonY);

    // 按钮背景
    const btnBg = this._scene.add.graphics();
    btnBg.fillStyle(0x2a2a3e, UI_ALPHA.HEAVY);
    btnBg.fillCircle(0, 0, 12);
    btnBg.setInteractive(new Phaser.Geom.Circle(0, 0, 12), Phaser.Geom.Circle.Contains);

    // 按钮图标
    const btnIcon = this._scene.add
      .text(0, 0, '▼', {
        fontFamily: UI_FONT_FAMILY.DEFAULT,
        fontSize: UI_FONT_SIZE.TINY,
        color: '#888888',
      })
      .setOrigin(0.5)
      .setName('toggle_icon');

    this._toggleButton.add([btnBg, btnIcon]);
    this._container.add(this._toggleButton);

    // 交互事件
    btnBg.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0x4a4a5e, UI_ALPHA.HEAVY);
      btnBg.fillCircle(0, 0, 12);
    });

    btnBg.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x2a2a3e, UI_ALPHA.HEAVY);
      btnBg.fillCircle(0, 0, 12);
    });

    btnBg.on('pointerdown', () => {
      this._toggleExpand();
    });
  }

  /**
   * 切换展开/折叠状态
   */
  private _toggleExpand(): void {
    this._isExpanded = !this._isExpanded;

    const hints = this._getHints();

    // 更新图标
    const toggleIcon = this._toggleButton.getByName('toggle_icon') as Phaser.GameObjects.Text;
    if (toggleIcon) {
      toggleIcon.setText(this._isExpanded ? '▼' : '▶');
    }

    // 显示/隐藏提示条目
    hints.forEach((_, index) => {
      const keyText = this._container.getByName(`hint_key_${index}`);
      const actionText = this._container.getByName(`hint_action_${index}`);

      if (keyText && actionText) {
        const targetAlpha = this._isExpanded ? 1 : 0;
        this._scene.tweens.add({
          targets: [keyText, actionText],
          alpha: targetAlpha,
          duration: UI_ANIMATION.FAST,
        });
      }
    });

    // 更新背景
    this._scene.time.delayedCall(UI_ANIMATION.FAST, () => {
      this._updateBackground();
    });
  }

  /**
   * 显示指引
   */
  public show(): void {
    this._isVisible = true;
    this._container.setVisible(true);
    this._container.setAlpha(0);

    this._scene.tweens.add({
      targets: this._container,
      alpha: 1,
      duration: UI_ANIMATION.NORMAL,
    });
  }

  /**
   * 隐藏指引
   */
  public hide(): void {
    this._scene.tweens.add({
      targets: this._container,
      alpha: 0,
      duration: UI_ANIMATION.NORMAL,
      onComplete: () => {
        this._isVisible = false;
        this._container.setVisible(false);
      },
    });
  }

  /**
   * 切换显示状态
   */
  public toggle(): void {
    if (this._isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 是否可见
   */
  public isVisible(): boolean {
    return this._isVisible;
  }

  /**
   * 设置透明度（用于避免遮挡）
   */
  public setAlpha(alpha: number): void {
    this._container.setAlpha(alpha);
  }

  /**
   * 更新设备类型并刷新显示
   */
  public setMobile(isMobile: boolean): void {
    if (this._isMobile !== isMobile) {
      this._isMobile = isMobile;
      this._refresh();
    }
  }

  /**
   * 刷新显示内容
   */
  private _refresh(): void {
    // 清除旧内容（保留背景和切换按钮）
    const oldHints = this._getHints();
    oldHints.forEach((_, index) => {
      const keyText = this._container.getByName(`hint_key_${index}`);
      const actionText = this._container.getByName(`hint_action_${index}`);
      keyText?.destroy();
      actionText?.destroy();
    });

    // 重新创建提示内容
    const PADDING_X = UI_SPACING.MD;
    const PADDING_Y = UI_SPACING.SM;
    const LINE_HEIGHT = 28;
    const TITLE_HEIGHT = 32;

    const newHints = this._getHints();
    newHints.forEach((hint, index) => {
      const y = TITLE_HEIGHT + PADDING_Y + index * LINE_HEIGHT;

      const keyText = this._scene.add
        .text(PADDING_X, y, hint.key, {
          fontFamily: UI_FONT_FAMILY.DEFAULT,
          fontSize: UI_FONT_SIZE.TINY,
          color: '#4A9EFF',
        })
        .setName(`hint_key_${index}`);

      const actionText = this._scene.add
        .text(PADDING_X + 90, y, hint.action, {
          fontFamily: UI_FONT_FAMILY.DEFAULT,
          fontSize: UI_FONT_SIZE.TINY,
          color: '#A8A6A3',
        })
        .setName(`hint_action_${index}`);

      this._container.add([keyText, actionText]);
    });

    // 更新背景
    this._updateBackground();
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this._container?.destroy();
  }
}
