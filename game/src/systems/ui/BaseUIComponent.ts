/**
 * UI组件基类
 * 提供通用的显示/隐藏、深度管理、销毁、键盘导航等功能
 * @module systems/ui/BaseUIComponent
 */

import Phaser from 'phaser';
import { createLogger } from '@/utils/Logger';
import {
  a11yManager,
  type IFocusableElement,
  type IFocusManagerConfig,
} from '@/systems/accessibility/A11yManager';

const logger = createLogger('BaseUIComponent');
import { UI } from '@/config/ui.config';

// ==================== 配置类型 ====================

/**
 * 动画配置
 */
export interface IAnimationConfig {
  /** 淡入时长(ms) */
  fadeInDuration: number;
  /** 淡出时长(ms) */
  fadeOutDuration: number;
  /** 淡入缓动函数 */
  fadeInEase: string;
  /** 淡出缓动函数 */
  fadeOutEase: string;
}

/**
 * 基础UI配置
 */
export interface IBaseUIConfig {
  scene: Phaser.Scene;
  /** 深度层级 */
  depth?: number;
  /** 动画配置 */
  animation?: Partial<IAnimationConfig>;
  /** 是否启用键盘导航 */
  enableKeyboardNav?: boolean;
  /** 组件名称（用于无障碍播报） */
  componentName?: string;
}

// Re-export for convenience
export type { IFocusableElement, IFocusManagerConfig };

// ==================== 默认配置 ====================

const DEFAULT_ANIMATION: IAnimationConfig = {
  fadeInDuration: UI.ANIMATION.NORMAL,
  fadeOutDuration: UI.ANIMATION.FAST,
  fadeInEase: 'Power2',
  fadeOutEase: 'Power2',
};

// ==================== 基类 ====================

/**
 * UI组件抽象基类
 * 所有UI组件都应该继承此类
 */
export abstract class BaseUIComponent {
  /** 场景引用 */
  protected _scene: Phaser.Scene;

  /** 主容器 */
  protected _container!: Phaser.GameObjects.Container;

  /** 深度层级 */
  protected _depth: number;

  /** 动画配置 */
  protected _animation: IAnimationConfig;

  /** 是否已销毁 */
  protected _isDestroyed: boolean = false;

  /** 当前运行的动画 */
  private _currentTween: Phaser.Tweens.Tween | null = null;

  /** 是否启用键盘导航 */
  protected _enableKeyboardNav: boolean;

  /** 组件名称 */
  protected _componentName: string;

  /** 焦点组 ID */
  protected _focusGroupId: string | null = null;

  /** 键盘事件处理函数引用 */
  private _keyDownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(config: IBaseUIConfig) {
    this._scene = config.scene;
    this._depth = config.depth ?? 1000;
    this._animation = { ...DEFAULT_ANIMATION, ...config.animation };
    this._enableKeyboardNav = config.enableKeyboardNav ?? false;
    this._componentName = config.componentName ?? '界面';

    // 初始化容器
    this._initContainer();

    // 调用子类的UI创建方法
    this._createUI();
  }

  // ==================== 抽象方法（子类必须实现） ====================

  /**
   * 创建UI元素
   * 子类必须实现此方法来创建具体的UI内容
   */
  protected abstract _createUI(): void;

  // ==================== 可选钩子（子类可覆盖） ====================

  /**
   * 显示前钩子
   * 子类可以覆盖此方法执行显示前的准备工作
   */
  protected _onBeforeShow(): void {
    // 默认空实现
  }

  /**
   * 显示后钩子
   * 子类可以覆盖此方法执行显示后的操作
   */
  protected _onAfterShow(): void {
    // 默认空实现
  }

  /**
   * 隐藏前钩子
   * 子类可以覆盖此方法执行隐藏前的清理工作
   */
  protected _onBeforeHide(): void {
    // 默认空实现
  }

  /**
   * 隐藏后钩子
   * 子类可以覆盖此方法执行隐藏后的操作
   */
  protected _onAfterHide(): void {
    // 默认空实现
  }

  /**
   * 销毁前钩子
   * 子类可以覆盖此方法执行销毁前的清理工作
   */
  protected _onBeforeDestroy(): void {
    // 默认空实现
  }

  // ==================== 公共方法 ====================

  /**
   * 显示组件
   * @param animate 是否使用动画，默认true
   */
  show(animate: boolean = true): void {
    if (this._isDestroyed) {
      logger.warn('尝试显示已销毁的组件');
      return;
    }

    // 调用显示前钩子
    this._onBeforeShow();

    // 停止当前动画
    this._stopCurrentTween();

    // 设置键盘导航
    if (this._enableKeyboardNav) {
      this._setupKeyboardNavigation();
    }

    // 播报 UI 打开
    a11yManager.announceUIState(this._componentName, 'opened');

    if (animate) {
      this._container.setVisible(true);
      this._container.setAlpha(0);

      this._currentTween = this._scene.tweens.add({
        targets: this._container,
        alpha: 1,
        duration: this._animation.fadeInDuration,
        ease: this._animation.fadeInEase,
        onComplete: () => {
          this._currentTween = null;
          this._onAfterShow();
        },
      });
    } else {
      this._container.setVisible(true);
      this._container.setAlpha(1);
      this._onAfterShow();
    }
  }

  /**
   * 隐藏组件
   * @param animate 是否使用动画，默认true
   */
  hide(animate: boolean = true): void {
    if (this._isDestroyed) {
      return;
    }

    // 调用隐藏前钩子
    this._onBeforeHide();

    // 停止当前动画
    this._stopCurrentTween();

    // 移除键盘导航
    if (this._enableKeyboardNav) {
      this._removeKeyboardNavigation();
    }

    // 播报 UI 关闭
    a11yManager.announceUIState(this._componentName, 'closed');

    if (animate) {
      this._currentTween = this._scene.tweens.add({
        targets: this._container,
        alpha: 0,
        duration: this._animation.fadeOutDuration,
        ease: this._animation.fadeOutEase,
        onComplete: () => {
          this._currentTween = null;
          this._container.setVisible(false);
          this._onAfterHide();
        },
      });
    } else {
      this._container.setAlpha(0);
      this._container.setVisible(false);
      this._onAfterHide();
    }
  }

  /**
   * 切换显示/隐藏状态
   * @param animate 是否使用动画
   */
  toggle(animate: boolean = true): void {
    if (this.isVisible()) {
      this.hide(animate);
    } else {
      this.show(animate);
    }
  }

  /**
   * 是否可见
   */
  isVisible(): boolean {
    return this._container?.visible ?? false;
  }

  /**
   * 设置深度层级
   */
  setDepth(depth: number): this {
    this._depth = depth;
    if (this._container) {
      this._container.setDepth(depth);
    }
    return this;
  }

  /**
   * 获取深度层级
   */
  getDepth(): number {
    return this._depth;
  }

  /**
   * 获取主容器
   * 用于高级自定义操作
   */
  getContainer(): Phaser.GameObjects.Container {
    return this._container;
  }

  /**
   * 获取场景引用
   */
  getScene(): Phaser.Scene {
    return this._scene;
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }

    // 调用销毁前钩子
    this._onBeforeDestroy();

    // 停止当前动画
    this._stopCurrentTween();

    // 移除键盘导航
    if (this._enableKeyboardNav) {
      this._removeKeyboardNavigation();
    }

    // 销毁焦点组
    if (this._focusGroupId) {
      a11yManager.destroyFocusGroup(this._focusGroupId);
    }

    // 销毁容器（会自动销毁所有子对象）
    if (this._container) {
      this._container.destroy();
    }

    this._isDestroyed = true;
  }

  /**
   * 是否已销毁
   */
  isDestroyed(): boolean {
    return this._isDestroyed;
  }

  // ==================== 保护方法（子类可使用） ====================

  /**
   * 创建半透明遮罩背景
   * @param interactive 是否可交互（点击关闭）
   * @param alpha 透明度
   * @param onClick 点击回调
   */
  protected _createOverlay(
    interactive: boolean = true,
    alpha: number = 0.7,
    onClick?: () => void
  ): Phaser.GameObjects.Rectangle {
    const { width, height } = this._scene.scale;

    const overlay = this._scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      alpha
    );

    if (interactive) {
      overlay.setInteractive({ useHandCursor: false });
      if (onClick) {
        overlay.on('pointerdown', onClick);
      }
    }

    this._container.add(overlay);
    return overlay;
  }

  /**
   * 创建面板背景
   * @param x 中心X坐标
   * @param y 中心Y坐标
   * @param width 宽度
   * @param height 高度
   * @param bgColor 背景颜色
   * @param borderColor 边框颜色
   * @param radius 圆角半径
   */
  protected _createPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    bgColor: number = 0x1a1a1a,
    borderColor: number = 0x333333,
    radius: number = 12
  ): Phaser.GameObjects.Graphics {
    const graphics = this._scene.add.graphics();

    graphics.fillStyle(bgColor, 0.95);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);

    graphics.lineStyle(2, borderColor, 1);
    graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);

    this._container.add(graphics);
    return graphics;
  }

  /**
   * 设置ESC键关闭
   * @param callback 关闭回调
   */
  protected _setupEscClose(callback?: () => void): void {
    const onEsc = (): void => {
      if (this.isVisible()) {
        if (callback) {
          callback();
        } else {
          this.hide();
        }
      }
    };

    this._scene.input.keyboard?.on('keydown-ESC', onEsc);

    // 保存引用以便销毁时移除
    const originalOnBeforeDestroy = this._onBeforeDestroy.bind(this);
    this._onBeforeDestroy = (): void => {
      this._scene.input.keyboard?.off('keydown-ESC', onEsc);
      originalOnBeforeDestroy();
    };
  }

  /**
   * 设置键盘导航
   * 子类可以覆盖此方法来自定义键盘导航行为
   */
  protected _setupKeyboardNavigation(): void {
    if (this._keyDownHandler) return; // 已经设置过

    this._keyDownHandler = (event: KeyboardEvent): void => {
      if (!this.isVisible()) return;

      // 构建按键标识
      let keyCode = event.code;
      if (event.shiftKey && keyCode === 'Tab') {
        keyCode = 'ShiftTab';
      }

      // 先尝试让 A11yManager 处理
      if (a11yManager.handleKeyboardNavigation(keyCode)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 子类可以通过覆盖 _handleKeyDown 来处理其他按键
      if (this._handleKeyDown(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', this._keyDownHandler);
  }

  /**
   * 移除键盘导航
   */
  protected _removeKeyboardNavigation(): void {
    if (this._keyDownHandler) {
      window.removeEventListener('keydown', this._keyDownHandler);
      this._keyDownHandler = null;
    }

    // 清除活动焦点组
    if (this._focusGroupId) {
      a11yManager.clearActiveFocusGroup();
    }
  }

  /**
   * 处理键盘按下事件
   * 子类可以覆盖此方法来处理特定的按键
   * @returns 是否已处理该事件
   */
  protected _handleKeyDown(_event: KeyboardEvent): boolean {
    // 默认不处理任何按键，由子类覆盖
    return false;
  }

  /**
   * 创建焦点组
   * 子类调用此方法来创建焦点组
   */
  protected _createFocusGroup(
    groupId: string,
    config?: IFocusManagerConfig
  ): ReturnType<typeof a11yManager.createFocusGroup> {
    this._focusGroupId = groupId;
    return a11yManager.createFocusGroup(groupId, config);
  }

  /**
   * 激活焦点组
   */
  protected _activateFocusGroup(): void {
    if (this._focusGroupId) {
      a11yManager.setActiveFocusGroup(this._focusGroupId);
    }
  }

  /**
   * 获取焦点组
   */
  protected _getFocusGroup(): ReturnType<typeof a11yManager.getFocusGroup> {
    if (this._focusGroupId) {
      return a11yManager.getFocusGroup(this._focusGroupId);
    }
    return undefined;
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化容器
   */
  private _initContainer(): void {
    this._container = this._scene.add.container(0, 0);
    this._container.setDepth(this._depth);
    this._container.setVisible(false);
  }

  /**
   * 停止当前动画
   */
  private _stopCurrentTween(): void {
    if (this._currentTween) {
      this._currentTween.stop();
      this._currentTween = null;
    }
  }
}
