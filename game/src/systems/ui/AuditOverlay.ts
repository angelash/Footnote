/**
 * 审计覆盖区效果
 * 高维审计时的视觉覆盖效果
 * @module systems/ui/AuditOverlay
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { UI_FONT_SIZE } from '@/config/ui.config';

export enum AuditIntensity {
  /** 轻度 - 边缘提示 */
  LIGHT = 'light',
  /** 中度 - 部分覆盖 */
  MEDIUM = 'medium',
  /** 重度 - 大面积覆盖 */
  HEAVY = 'heavy',
  /** 极限 - 几乎全屏 */
  CRITICAL = 'critical',
}

interface IAuditOverlayConfig {
  scene: Phaser.Scene;
}

/**
 * 审计覆盖区
 * 表现高维观测压力
 */
export class AuditOverlay {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  private _overlayGraphics!: Phaser.GameObjects.Graphics;
  private _warningText!: Phaser.GameObjects.Text;
  private _scanLine!: Phaser.GameObjects.Rectangle;

  private _isActive: boolean = false;
  private _intensity: AuditIntensity = AuditIntensity.LIGHT;
  private _coveragePercent: number = 0;

  constructor(config: IAuditOverlayConfig) {
    this._scene = config.scene;
    this._createComponents();
    this._setupEventListeners();
  }

  /**
   * 创建组件
   */
  private _createComponents(): void {
    const { width } = this._scene.scale;

    this._container = this._scene.add.container(0, 0);
    this._container.setDepth(800);
    this._container.setAlpha(0);

    // 覆盖图形
    this._overlayGraphics = this._scene.add.graphics();
    this._container.add(this._overlayGraphics);

    // 警告文字
    this._warningText = this._scene.add.text(width / 2, 200, '', {
      fontFamily: 'monospace',
      fontSize: UI_FONT_SIZE.SMALL,
      color: '#ff4444',
      align: 'center',
    });
    this._warningText.setOrigin(0.5);
    this._warningText.setAlpha(0);
    this._container.add(this._warningText);

    // 扫描线
    this._scanLine = this._scene.add.rectangle(width / 2, 0, width, 3, 0xff4444, 0.5);
    this._scanLine.setAlpha(0);
    this._container.add(this._scanLine);
  }

  /**
   * 设置事件监听
   */
  private _setupEventListeners(): void {
    eventBus.onTyped(GameEvent.COUNTER_P_CHANGE, this._onPressureChanged.bind(this));
    eventBus.onTyped(GameEvent.COUNTER_R_CHANGE, this._onResidueChanged.bind(this));
  }

  /**
   * P值变化处理
   */
  private _onPressureChanged(payload: { newValue: number }): void {
    // P值越高，审计越强
    if (payload.newValue >= 8) {
      this.activate(AuditIntensity.CRITICAL);
    } else if (payload.newValue >= 6) {
      this.activate(AuditIntensity.HEAVY);
    } else if (payload.newValue >= 4) {
      this.activate(AuditIntensity.MEDIUM);
    } else if (payload.newValue >= 2) {
      this.activate(AuditIntensity.LIGHT);
    } else {
      this.deactivate();
    }
  }

  /**
   * R值变化处理（系统反应）
   */
  private _onResidueChanged(payload: { newValue: number }): void {
    // R >= 6 时显示判定提示
    if (payload.newValue >= 6) {
      this._showSystemReaction(payload.newValue);
    }
  }

  /**
   * 显示系统反应
   */
  private _showSystemReaction(rValue: number): void {
    let message = '';

    if (rValue >= 10) {
      message = '[ 模型改写路径开启 ]';
    } else if (rValue >= 6) {
      message = '[ 此行为在当前模型中无意义 ]';
    }

    if (message) {
      this._warningText.setText(message);
      this._warningText.setAlpha(0);

      this._scene.tweens.add({
        targets: this._warningText,
        alpha: { from: 0, to: 1 },
        duration: 500,
        hold: 2000,
        yoyo: true,
      });

      // 播放音效
      eventBus.emit(GameEvent.PLAY_SFX, { key: 'sfx_system_correct' });
    }
  }

  /**
   * 激活审计覆盖
   */
  public activate(intensity: AuditIntensity): void {
    this._intensity = intensity;
    this._isActive = true;

    // 计算覆盖率
    switch (intensity) {
      case AuditIntensity.LIGHT:
        this._coveragePercent = 0.1;
        break;
      case AuditIntensity.MEDIUM:
        this._coveragePercent = 0.3;
        break;
      case AuditIntensity.HEAVY:
        this._coveragePercent = 0.5;
        break;
      case AuditIntensity.CRITICAL:
        this._coveragePercent = 0.7;
        break;
    }

    this._drawOverlay();
    this._startScanAnimation();

    // 淡入
    this._scene.tweens.add({
      targets: this._container,
      alpha: 1,
      duration: 500,
    });
  }

  /**
   * 停用审计覆盖
   */
  public deactivate(): void {
    if (!this._isActive) return;
    this._isActive = false;

    this._scene.tweens.add({
      targets: this._container,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this._stopScanAnimation();
      },
    });
  }

  /**
   * 绘制覆盖区域
   */
  private _drawOverlay(): void {
    const { width, height } = this._scene.scale;

    this._overlayGraphics.clear();

    // 边缘渐变覆盖
    const edgeWidth = width * this._coveragePercent * 0.5;

    // 左边缘
    for (let i = 0; i < edgeWidth; i += 5) {
      const alpha = (1 - i / edgeWidth) * 0.3;
      this._overlayGraphics.fillStyle(0xff0000, alpha);
      this._overlayGraphics.fillRect(i, 0, 5, height);
    }

    // 右边缘
    for (let i = 0; i < edgeWidth; i += 5) {
      const alpha = (1 - i / edgeWidth) * 0.3;
      this._overlayGraphics.fillStyle(0xff0000, alpha);
      this._overlayGraphics.fillRect(width - edgeWidth + i, 0, 5, height);
    }

    // 顶部边缘
    for (let i = 0; i < edgeWidth * 0.5; i += 5) {
      const alpha = (1 - i / (edgeWidth * 0.5)) * 0.2;
      this._overlayGraphics.fillStyle(0xff0000, alpha);
      this._overlayGraphics.fillRect(0, i, width, 5);
    }

    // 角落强调
    this._overlayGraphics.fillStyle(0xff0000, 0.4);
    this._overlayGraphics.fillTriangle(0, 0, edgeWidth * 2, 0, 0, edgeWidth * 2);
    this._overlayGraphics.fillTriangle(width, 0, width - edgeWidth * 2, 0, width, edgeWidth * 2);

    // 随机干扰块（高强度时）
    if (this._intensity === AuditIntensity.HEAVY || this._intensity === AuditIntensity.CRITICAL) {
      for (let i = 0; i < 5; i++) {
        const blockX = Phaser.Math.Between(0, width);
        const blockY = Phaser.Math.Between(0, height);
        const blockW = Phaser.Math.Between(20, 100);
        const blockH = Phaser.Math.Between(10, 50);
        this._overlayGraphics.fillStyle(0xff0000, Phaser.Math.FloatBetween(0.1, 0.3));
        this._overlayGraphics.fillRect(blockX, blockY, blockW, blockH);
      }
    }
  }

  /**
   * 开始扫描动画
   */
  private _startScanAnimation(): void {
    const { height } = this._scene.scale;

    this._scanLine.setAlpha(0.5);
    this._scanLine.y = 0;

    this._scene.tweens.add({
      targets: this._scanLine,
      y: height,
      duration: 2000,
      repeat: -1,
      ease: 'Linear',
    });
  }

  /**
   * 停止扫描动画
   */
  private _stopScanAnimation(): void {
    this._scene.tweens.killTweensOf(this._scanLine);
    this._scanLine.setAlpha(0);
  }

  /**
   * 显示瞬时警告
   */
  public flashWarning(message: string): void {
    this._warningText.setText(message);

    this._scene.tweens.add({
      targets: this._warningText,
      alpha: { from: 0, to: 1 },
      duration: 100,
      yoyo: true,
      repeat: 3,
    });

    // 屏幕震动
    this._scene.cameras.main.shake(200, 0.01);
  }

  /**
   * 获取当前强度
   */
  public getIntensity(): AuditIntensity {
    return this._intensity;
  }

  /**
   * 是否激活
   */
  public isActive(): boolean {
    return this._isActive;
  }

  /**
   * 销毁
   */
  public destroy(): void {
    eventBus.off(GameEvent.COUNTER_P_CHANGE);
    eventBus.off(GameEvent.COUNTER_R_CHANGE);
    this._container?.destroy();
  }
}
