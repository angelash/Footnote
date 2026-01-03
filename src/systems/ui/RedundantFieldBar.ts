/**
 * 冗余字段条UI组件
 * F22核心载体 - 不可关闭的底部字段条
 * @module systems/ui/RedundantFieldBar
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';

export enum FieldState {
  /** 初始状态：字段：＿ */
  INITIAL = 'initial',
  /** 待定义：字段：＿（待定义） */
  PENDING = 'pending',
  /** 已接受：字段：◦◦◦ */
  ACCEPTED = 'accepted',
}

interface IRedundantFieldBarConfig {
  scene: Phaser.Scene;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * 冗余字段条
 * - 从CF-Z1开始出现
 * - 不可关闭（F22体现）
 * - 状态随剧情变化
 */
export class RedundantFieldBar extends Phaser.GameObjects.Container {
  private _background!: Phaser.GameObjects.Rectangle;
  private _fieldText!: Phaser.GameObjects.Text;
  private _glowEffect!: Phaser.GameObjects.Rectangle;
  private _state: FieldState = FieldState.INITIAL;
  private _isVisible: boolean = false;
  private _canInteract: boolean = false;
  private _clickCount: number = 0;

  // 尺寸配置
  private _barWidth: number;
  private _barHeight: number;

  constructor(config: IRedundantFieldBarConfig) {
    const { scene, x = 375, y = 1280, width = 700, height = 50 } = config;
    super(scene, x, y);

    this._barWidth = width;
    this._barHeight = height;

    this._createComponents();
    this._setupInteraction();
    this._setupEventListeners();

    // 初始隐藏
    this.setAlpha(0);
    this.setVisible(false);

    scene.add.existing(this);
    this.setDepth(1000); // 确保在最上层
  }

  /**
   * 创建UI组件
   */
  private _createComponents(): void {
    // 发光效果层（底层）
    this._glowEffect = this.scene.add.rectangle(
      0,
      0,
      this._barWidth + 10,
      this._barHeight + 10,
      0x6666ff,
      0.3
    );
    this._glowEffect.setVisible(false);
    this.add(this._glowEffect as Phaser.GameObjects.GameObject);

    // 背景
    this._background = this.scene.add.rectangle(
      0,
      0,
      this._barWidth,
      this._barHeight,
      0x1a1a2e,
      0.95
    );
    this._background.setStrokeStyle(2, 0x4a4a6a);
    this.add(this._background);

    // 字段文本
    this._fieldText = this.scene.add.text(0, 0, '字段：＿', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#aaaacc',
      align: 'center',
    });
    this._fieldText.setOrigin(0.5);
    this.add(this._fieldText);
  }

  /**
   * 设置交互
   */
  private _setupInteraction(): void {
    this._background.setInteractive({ useHandCursor: true });

    this._background.on('pointerover', () => {
      if (this._canInteract) {
        this._background.setStrokeStyle(2, 0x8888ff);
        this._glowEffect.setVisible(true);
      }
    });

    this._background.on('pointerout', () => {
      this._background.setStrokeStyle(2, 0x4a4a6a);
      this._glowEffect.setVisible(false);
    });

    this._background.on('pointerdown', () => {
      if (this._canInteract) {
        this._onFieldClick();
      } else {
        // 不可交互时的反馈 - 轻微抖动
        this._shakeBar();
      }
    });
  }

  /**
   * 设置事件监听
   */
  private _setupEventListeners(): void {
    // 监听字段状态变化
    eventBus.on(GameEvent.FLAG_CHANGED, this._onFlagChanged, this);
  }

  /**
   * FLAG变化处理
   */
  private _onFlagChanged(data: { flag: string; value: boolean }): void {
    if (data.flag === 'FLAG_F22_ACTIVE' && data.value) {
      this.show();
    }
    if (data.flag === 'FLAG_CFZ3_ALL_FORMAT_DONE' && data.value) {
      this.setFieldState(FieldState.PENDING);
      this._canInteract = true;
    }
    if (data.flag === 'FLAG_FIELD_ACCEPTED' && data.value) {
      this.setFieldState(FieldState.ACCEPTED);
      this._canInteract = false;
    }
  }

  /**
   * 字段点击处理
   */
  private _onFieldClick(): void {
    if (this._state !== FieldState.PENDING) return;

    this._clickCount++;

    // 触发对话
    eventBus.emit(GameEvent.DIALOGUE_START, { dialogueId: `CFZ3_ADD_POINT_${this._clickCount}` });
  }

  /**
   * 抖动效果（尝试关闭时）
   */
  private _shakeBar(): void {
    this.scene.tweens.add({
      targets: this,
      x: this.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * 显示字段条
   */
  public show(): void {
    if (this._isVisible) return;
    this._isVisible = true;
    this.setVisible(true);

    // 从下方滑入
    this.y = this.scene.scale.height + 50;
    this.scene.tweens.add({
      targets: this,
      y: this.scene.scale.height - 40,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });
  }

  /**
   * 设置字段状态
   */
  public setFieldState(state: FieldState): void {
    this._state = state;

    switch (state) {
      case FieldState.INITIAL:
        this._fieldText.setText('字段：＿');
        this._fieldText.setColor('#aaaacc');
        break;
      case FieldState.PENDING:
        this._fieldText.setText('字段：＿（待定义）');
        this._fieldText.setColor('#ccccff');
        this._pulseAnimation();
        break;
      case FieldState.ACCEPTED:
        this._fieldText.setText('字段：◦◦◦');
        this._fieldText.setColor('#88ff88');
        this._acceptAnimation();
        break;
    }
  }

  /**
   * 脉冲动画（待定义状态）
   */
  private _pulseAnimation(): void {
    this.scene.tweens.add({
      targets: this._glowEffect,
      alpha: { from: 0.2, to: 0.5 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this._glowEffect.setVisible(true);
  }

  /**
   * 接受动画
   */
  private _acceptAnimation(): void {
    // 停止脉冲
    this.scene.tweens.killTweensOf(this._glowEffect);

    // 闪烁确认
    this.scene.tweens.add({
      targets: this._background,
      fillColor: { from: 0x1a1a2e, to: 0x2a4a2e },
      duration: 300,
      yoyo: true,
      repeat: 2,
    });

    // 文字放大缩小
    this.scene.tweens.add({
      targets: this._fieldText,
      scale: { from: 1, to: 1.2 },
      duration: 200,
      yoyo: true,
    });

    // 永久发光
    this._glowEffect.setFillStyle(0x66ff66, 0.2);
    this._glowEffect.setVisible(true);
  }

  /**
   * 获取当前状态
   */
  public getState(): FieldState {
    return this._state;
  }

  /**
   * 是否可见
   */
  public isBarVisible(): boolean {
    return this._isVisible;
  }

  /**
   * 销毁
   */
  public destroy(): void {
    eventBus.off(GameEvent.FLAG_CHANGED, this._onFlagChanged, this);
    super.destroy();
  }
}
