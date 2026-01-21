/**
 * 交互提示 UI 组件
 * 当玩家靠近可交互物品时显示交互按钮
 * @module systems/ui/InteractionPrompt
 */

import Phaser from 'phaser';
import { UI_FONT_SIZE, UI_ALPHA, UI_DEPTH, UI_ANIMATION, UI_FONT_FAMILY } from '@/config/ui.config';

export interface IInteractionPromptConfig {
  scene: Phaser.Scene;
  /** 交互回调 */
  onInteract?: () => void;
}

interface ITargetInfo {
  object: Phaser.GameObjects.Container | Phaser.GameObjects.GameObject;
  label: string;
  x: number;
  y: number;
}

/**
 * 交互提示 UI 组件
 * 显示在可交互物品上方，提示玩家可以交互
 */
export class InteractionPrompt {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  private _background!: Phaser.GameObjects.Graphics;
  private _icon!: Phaser.GameObjects.Text;
  private _label!: Phaser.GameObjects.Text;
  private _keyHint!: Phaser.GameObjects.Text;

  // 状态
  private _isVisible: boolean = false;
  private _currentTarget: ITargetInfo | null = null;
  private _onInteract?: () => void;

  // 动画
  private _floatTween?: Phaser.Tweens.Tween;
  private _pulseTween?: Phaser.Tweens.Tween;

  // 常量
  private readonly PROMPT_WIDTH = 140;
  private readonly PROMPT_HEIGHT = 60;
  private readonly OFFSET_Y = -80; // 物品上方偏移

  constructor(config: IInteractionPromptConfig) {
    this._scene = config.scene;
    this._onInteract = config.onInteract;

    this._create();
  }

  /**
   * 创建UI
   */
  private _create(): void {
    this._container = this._scene.add.container(0, 0);
    this._container.setDepth(UI_DEPTH.POPUP);
    this._container.setVisible(false);
    this._container.setAlpha(0);

    // 背景
    this._background = this._scene.add.graphics();
    this._drawBackground();
    this._container.add(this._background);

    // 交互图标
    this._icon = this._scene.add
      .text(0, -8, '👆', {
        fontSize: UI_FONT_SIZE.ICON_LARGE,
      })
      .setOrigin(0.5);
    this._container.add(this._icon);

    // 标签文字
    this._label = this._scene.add
      .text(0, 18, '交互', {
        fontFamily: UI_FONT_FAMILY.DEFAULT,
        fontSize: UI_FONT_SIZE.SMALL,
        color: '#E8E6E3',
      })
      .setOrigin(0.5);
    this._container.add(this._label);

    // 按键提示（PC端显示）
    this._keyHint = this._scene.add
      .text(0, 38, '[E] 或 点击', {
        fontFamily: UI_FONT_FAMILY.DEFAULT,
        fontSize: UI_FONT_SIZE.TINY,
        color: '#888888',
      })
      .setOrigin(0.5);
    this._container.add(this._keyHint);

    // 设置交互区域
    this._background.setInteractive(
      new Phaser.Geom.Rectangle(
        -this.PROMPT_WIDTH / 2,
        -this.PROMPT_HEIGHT / 2,
        this.PROMPT_WIDTH,
        this.PROMPT_HEIGHT + 20
      ),
      Phaser.Geom.Rectangle.Contains
    );

    // 点击事件
    this._background.on('pointerdown', () => {
      this._triggerInteraction();
    });

    // hover 效果
    this._background.on('pointerover', () => {
      this._scene.tweens.add({
        targets: this._container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: UI_ANIMATION.FAST,
        ease: 'Back.easeOut',
      });
    });

    this._background.on('pointerout', () => {
      this._scene.tweens.add({
        targets: this._container,
        scaleX: 1,
        scaleY: 1,
        duration: UI_ANIMATION.FAST,
      });
    });

    // 监听键盘 E 键
    this._scene.input.keyboard?.on('keydown-E', () => {
      if (this._isVisible && this._currentTarget) {
        this._triggerInteraction();
      }
    });

    // 监听空格键
    this._scene.input.keyboard?.on('keydown-SPACE', () => {
      if (this._isVisible && this._currentTarget) {
        this._triggerInteraction();
      }
    });
  }

  /**
   * 绘制背景
   */
  private _drawBackground(): void {
    this._background.clear();

    // 主背景
    this._background.fillStyle(0x1a1a2e, UI_ALPHA.DENSE);
    this._background.fillRoundedRect(
      -this.PROMPT_WIDTH / 2,
      -this.PROMPT_HEIGHT / 2,
      this.PROMPT_WIDTH,
      this.PROMPT_HEIGHT,
      12
    );

    // 边框
    this._background.lineStyle(2, 0x00ffaa, UI_ALPHA.HEAVY);
    this._background.strokeRoundedRect(
      -this.PROMPT_WIDTH / 2,
      -this.PROMPT_HEIGHT / 2,
      this.PROMPT_WIDTH,
      this.PROMPT_HEIGHT,
      12
    );

    // 小箭头指向下方
    this._background.fillStyle(0x1a1a2e, UI_ALPHA.DENSE);
    this._background.fillTriangle(
      -10,
      this.PROMPT_HEIGHT / 2,
      10,
      this.PROMPT_HEIGHT / 2,
      0,
      this.PROMPT_HEIGHT / 2 + 10
    );
    this._background.lineStyle(2, 0x00ffaa, UI_ALPHA.HEAVY);
    this._background.lineBetween(-10, this.PROMPT_HEIGHT / 2, 0, this.PROMPT_HEIGHT / 2 + 10);
    this._background.lineBetween(10, this.PROMPT_HEIGHT / 2, 0, this.PROMPT_HEIGHT / 2 + 10);
  }

  /**
   * 显示提示
   */
  public show(target: ITargetInfo): void {
    if (this._currentTarget?.object === target.object && this._isVisible) {
      // 更新位置但不重新播放动画
      this._updatePosition(target.x, target.y);
      return;
    }

    this._currentTarget = target;
    this._isVisible = true;

    // 更新标签
    this._label.setText(target.label || '交互');

    // 更新位置
    this._updatePosition(target.x, target.y);

    // 显示容器
    this._container.setVisible(true);
    this._container.setScale(0.8);

    // 淡入动画
    this._scene.tweens.add({
      targets: this._container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: UI_ANIMATION.NORMAL,
      ease: 'Back.easeOut',
    });

    // 开始浮动动画
    this._startFloatAnimation();

    // 开始脉冲动画（图标）
    this._startPulseAnimation();
  }

  /**
   * 隐藏提示
   */
  public hide(): void {
    if (!this._isVisible) return;

    this._isVisible = false;
    this._currentTarget = null;

    // 停止动画
    this._stopAnimations();

    // 淡出动画
    this._scene.tweens.add({
      targets: this._container,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: UI_ANIMATION.FAST,
      onComplete: () => {
        this._container.setVisible(false);
      },
    });
  }

  /**
   * 更新位置
   */
  private _updatePosition(x: number, y: number): void {
    this._container.setPosition(x, y + this.OFFSET_Y);
  }

  /**
   * 触发交互
   */
  private _triggerInteraction(): void {
    if (!this._currentTarget) return;

    // 播放点击反馈
    this._scene.tweens.add({
      targets: this._container,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
    });

    // 调用回调
    this._onInteract?.();
  }

  /**
   * 开始浮动动画
   */
  private _startFloatAnimation(): void {
    this._stopAnimations();

    const baseY = this._container.y;
    this._floatTween = this._scene.tweens.add({
      targets: this._container,
      y: baseY - 8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * 开始脉冲动画
   */
  private _startPulseAnimation(): void {
    this._pulseTween = this._scene.tweens.add({
      targets: this._icon,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * 停止动画
   */
  private _stopAnimations(): void {
    this._floatTween?.stop();
    this._floatTween = undefined;
    this._pulseTween?.stop();
    this._pulseTween = undefined;
    this._icon.setScale(1);
  }

  /**
   * 检测是否有目标
   */
  public hasTarget(): boolean {
    return this._currentTarget !== null;
  }

  /**
   * 获取当前目标
   */
  public getCurrentTarget(): ITargetInfo | null {
    return this._currentTarget;
  }

  /**
   * 是否可见
   */
  public isVisible(): boolean {
    return this._isVisible;
  }

  /**
   * 设置移动端模式（隐藏键盘提示）
   */
  public setMobileMode(isMobile: boolean): void {
    this._keyHint.setVisible(!isMobile);
    if (isMobile) {
      this._label.setY(12);
    } else {
      this._label.setY(18);
    }
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this._stopAnimations();
    this._scene.input.keyboard?.off('keydown-E');
    this._scene.input.keyboard?.off('keydown-SPACE');
    this._container?.destroy();
  }
}
