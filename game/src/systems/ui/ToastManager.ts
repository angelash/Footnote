/**
 * Toast提示管理器
 * 处理临时通知、提示、成就解锁等消息
 * @module systems/ui/ToastManager
 */

import Phaser from 'phaser';
import { BaseUIComponent, type IBaseUIConfig } from './BaseUIComponent';
import { TEXT_STYLES, COLORS } from '@/config/game.config';
import { UI, UI_FONT_SIZE } from '@/config/ui.config';

// ==================== 配置常量 ====================

const CONFIG = {
  /** Toast宽度 */
  WIDTH: UI.TOAST.WIDTH,
  /** Toast高度 */
  HEIGHT: UI.TOAST.HEIGHT,
  /** 显示时长(ms) */
  DURATION: UI.TOAST.DURATION,
  /** 动画时长(ms) */
  ANIMATION_DURATION: UI.ANIMATION.NORMAL,
  /** 最大同时显示数量 */
  MAX_VISIBLE: 3,
  /** Toast间距 */
  SPACING: UI.SPACING.SM,
  /** 顶部边距 */
  MARGIN_TOP: 80,
  /** 默认深度 */
  DEFAULT_DEPTH: 1200,
};

// ==================== 类型定义 ====================

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'achievement';

interface IToast {
  id: number;
  container: Phaser.GameObjects.Container;
  type: ToastType;
  timer?: Phaser.Time.TimerEvent;
}

interface IToastConfig extends Omit<IBaseUIConfig, 'depth'> {
  /** 深度层级，默认1200 */
  depth?: number;
}

// ==================== ToastManager类 ====================

/**
 * Toast提示管理器
 * 继承自 BaseUIComponent，提供统一的生命周期管理
 */
export class ToastManager extends BaseUIComponent {
  private _toasts: IToast[] = [];
  private _toastIdCounter: number = 0;

  constructor(config: IToastConfig) {
    super({
      ...config,
      depth: config.depth ?? CONFIG.DEFAULT_DEPTH,
    });

    // ToastManager 容器始终可见，由内部 toast 控制显示
    this._container.setVisible(true);
  }

  // ==================== 基类方法实现 ====================

  /**
   * 创建UI - 设置容器位置
   */
  protected _createUI(): void {
    const { width } = this._scene.scale;
    // 将容器定位到屏幕顶部中央
    this._container.setPosition(width / 2, CONFIG.MARGIN_TOP);
  }

  /**
   * 销毁前钩子 - 清理所有 Toast
   */
  protected _onBeforeDestroy(): void {
    this.dismissAll();
  }

  // ==================== 公共方法 ====================

  /**
   * 显示普通信息提示
   */
  showInfo(message: string, duration?: number): number {
    return this._showToast(message, 'info', duration);
  }

  /**
   * 显示成功提示
   */
  showSuccess(message: string, duration?: number): number {
    return this._showToast(message, 'success', duration);
  }

  /**
   * 显示警告提示
   */
  showWarning(message: string, duration?: number): number {
    return this._showToast(message, 'warning', duration);
  }

  /**
   * 显示错误提示
   */
  showError(message: string, duration?: number): number {
    return this._showToast(message, 'error', duration);
  }

  /**
   * 显示成就解锁提示
   */
  showAchievement(title: string, description: string): number {
    return this._showAchievementToast(title, description);
  }

  /**
   * 手动关闭指定Toast
   */
  dismiss(toastId: number): void {
    const toast = this._toasts.find((t) => t.id === toastId);
    if (toast) {
      this._dismissToast(toast);
    }
  }

  /**
   * 关闭所有Toast
   */
  dismissAll(): void {
    [...this._toasts].forEach((toast) => this._dismissToast(toast));
  }

  /**
   * 获取当前显示的Toast数量
   */
  getToastCount(): number {
    return this._toasts.length;
  }

  // ==================== 私有方法 - 创建 ====================

  private _showToast(message: string, type: ToastType, duration: number = CONFIG.DURATION): number {
    // 如果超过最大数量，移除最旧的
    while (this._toasts.length >= CONFIG.MAX_VISIBLE) {
      this._dismissToast(this._toasts[0]);
    }

    const id = ++this._toastIdCounter;
    const container = this._createToastContainer(message, type);

    // 计算位置
    const yOffset = this._toasts.length * (CONFIG.HEIGHT + CONFIG.SPACING);
    container.y = yOffset;

    this._container.add(container);

    // 进入动画
    container.setAlpha(0);
    container.setScale(0.8);

    this._scene.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: CONFIG.ANIMATION_DURATION,
      ease: 'Back.easeOut',
    });

    // 自动消失定时器
    const timer = this._scene.time.delayedCall(duration, () => {
      const toast = this._toasts.find((t) => t.id === id);
      if (toast) {
        this._dismissToast(toast);
      }
    });

    const toast: IToast = { id, container, type, timer };
    this._toasts.push(toast);

    return id;
  }

  private _showAchievementToast(title: string, description: string): number {
    // 移除旧的Toast
    while (this._toasts.length >= CONFIG.MAX_VISIBLE) {
      this._dismissToast(this._toasts[0]);
    }

    const id = ++this._toastIdCounter;
    const container = this._createAchievementContainer(title, description);

    const yOffset = this._toasts.length * (CONFIG.HEIGHT + 20 + CONFIG.SPACING);
    container.y = yOffset;

    this._container.add(container);

    // 特殊的进入动画
    container.setAlpha(0);
    container.setScale(0.5);
    container.setAngle(-5);

    this._scene.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      angle: 0,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // 延长显示时间
    const timer = this._scene.time.delayedCall(5000, () => {
      const toast = this._toasts.find((t) => t.id === id);
      if (toast) {
        this._dismissToast(toast);
      }
    });

    const toast: IToast = { id, container, type: 'achievement', timer };
    this._toasts.push(toast);

    return id;
  }

  private _createToastContainer(message: string, type: ToastType): Phaser.GameObjects.Container {
    const container = this._scene.add.container(0, 0);

    // 背景
    const bg = this._scene.add.graphics();
    const colors = this._getTypeColors(type);

    bg.fillStyle(colors.bg, 0.95);
    bg.fillRoundedRect(-CONFIG.WIDTH / 2, -CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 8);
    bg.lineStyle(2, colors.border, 1);
    bg.strokeRoundedRect(-CONFIG.WIDTH / 2, -CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 8);

    // 图标
    const icon = this._scene.add
      .text(-CONFIG.WIDTH / 2 + 20, 0, this._getTypeIcon(type), { fontSize: UI_FONT_SIZE.ICON })
      .setOrigin(0, 0.5);

    // 消息文字
    const text = this._scene.add
      .text(-CONFIG.WIDTH / 2 + 55, 0, message, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.SMALL,
        wordWrap: { width: CONFIG.WIDTH - 80 },
      })
      .setOrigin(0, 0.5);

    container.add([bg, icon, text]);

    return container;
  }

  private _createAchievementContainer(
    title: string,
    description: string
  ): Phaser.GameObjects.Container {
    const container = this._scene.add.container(0, 0);
    const achHeight = CONFIG.HEIGHT + 20;

    // 背景 - 金色调
    const bg = this._scene.add.graphics();
    bg.fillStyle(0x2a2a1a, 0.95);
    bg.fillRoundedRect(-CONFIG.WIDTH / 2, -achHeight / 2, CONFIG.WIDTH, achHeight, 10);
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(-CONFIG.WIDTH / 2, -achHeight / 2, CONFIG.WIDTH, achHeight, 10);

    // 奖杯图标
    const icon = this._scene.add
      .text(-CONFIG.WIDTH / 2 + 20, 0, '🏆', { fontSize: UI_FONT_SIZE.ICON_LARGE })
      .setOrigin(0, 0.5);

    // 标题
    const titleText = this._scene.add
      .text(-CONFIG.WIDTH / 2 + 65, -10, title, {
        ...TEXT_STYLES.TITLE,
        fontSize: UI_FONT_SIZE.SMALL,
        color: '#FFD700',
      })
      .setOrigin(0, 0.5);

    // 描述
    const descText = this._scene.add
      .text(-CONFIG.WIDTH / 2 + 65, 14, description, {
        ...TEXT_STYLES.MUTED,
        fontSize: UI_FONT_SIZE.TINY,
      })
      .setOrigin(0, 0.5);

    container.add([bg, icon, titleText, descText]);

    return container;
  }

  // ==================== 私有方法 - 辅助 ====================

  private _getTypeColors(type: ToastType): { bg: number; border: number } {
    const colorMap = {
      info: { bg: COLORS.BG_SECONDARY, border: COLORS.BORDER },
      success: { bg: 0x1a3a2a, border: 0x00ff88 },
      warning: { bg: 0x3a3a1a, border: 0xffaa00 },
      error: { bg: 0x3a1a1a, border: 0xff4444 },
      achievement: { bg: 0x2a2a1a, border: 0xffd700 },
    };
    return colorMap[type];
  }

  private _getTypeIcon(type: ToastType): string {
    const iconMap = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      achievement: '🏆',
    };
    return iconMap[type];
  }

  private _dismissToast(toast: IToast): void {
    // 取消定时器
    if (toast.timer) {
      toast.timer.destroy();
    }

    // 退出动画
    this._scene.tweens.add({
      targets: toast.container,
      alpha: 0,
      x: 50,
      duration: CONFIG.ANIMATION_DURATION,
      ease: 'Power2.easeIn',
      onComplete: () => {
        toast.container.destroy();

        // 从列表中移除
        const index = this._toasts.indexOf(toast);
        if (index > -1) {
          this._toasts.splice(index, 1);
        }

        // 重新排列剩余Toast
        this._repositionToasts();
      },
    });
  }

  private _repositionToasts(): void {
    this._toasts.forEach((toast, index) => {
      const targetY = index * (CONFIG.HEIGHT + CONFIG.SPACING);

      this._scene.tweens.add({
        targets: toast.container,
        y: targetY,
        duration: 200,
        ease: 'Power2',
      });
    });
  }
}
