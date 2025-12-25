/**
 * 深度能力视觉效果系统
 * 实现深度感知/深度介入/时间干预的视觉表现
 * @module systems/ui/DepthEffects
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';

/** 能力类型（本地定义以避免循环依赖） */
export enum AbilityType {
  DEPTH_PERCEPTION = 'DEPTH_PERCEPTION',
  DEPTH_INTERVENTION = 'DEPTH_INTERVENTION',
  TIME_INTERVENTION = 'TIME_INTERVENTION',
}

interface IDepthEffectsConfig {
  scene: Phaser.Scene;
}

/**
 * 深度效果管理器
 * 管理三种能力激活时的视觉效果
 */
export class DepthEffects {
  private _scene: Phaser.Scene;
  
  // 效果层
  private _perceptionOverlay!: Phaser.GameObjects.Rectangle;
  private _interventionGrid!: Phaser.GameObjects.Graphics;
  private _timelineOverlay!: Phaser.GameObjects.Container;
  
  // 粒子效果 (预留)
  
  // 状态
  private _activeAbility: AbilityType | null = null;

  constructor(config: IDepthEffectsConfig) {
    this._scene = config.scene;
    this._createEffectLayers();
    this._setupEventListeners();
  }

  /**
   * 创建效果层
   */
  private _createEffectLayers(): void {
    const { width, height } = this._scene.scale;

    // 深度感知叠加层 - 蓝紫色调
    this._perceptionOverlay = this._scene.add.rectangle(
      width / 2, height / 2,
      width, height,
      0x6644aa, 0
    );
    this._perceptionOverlay.setDepth(500);
    this._perceptionOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // 深度介入网格
    this._interventionGrid = this._scene.add.graphics();
    this._interventionGrid.setDepth(501);
    this._interventionGrid.setAlpha(0);

    // 时间干预叠加层
    this._timelineOverlay = this._scene.add.container(width / 2, 100);
    this._timelineOverlay.setDepth(502);
    this._timelineOverlay.setAlpha(0);
    this._createTimelineUI();
  }

  /**
   * 创建时间线UI
   */
  private _createTimelineUI(): void {
    const { width } = this._scene.scale;
    
    // 时间线背景
    const bg = this._scene.add.rectangle(0, 0, width - 100, 60, 0x1a1a2e, 0.9);
    bg.setStrokeStyle(2, 0x4a6a8a);
    this._timelineOverlay.add(bg);

    // 时间线
    const line = this._scene.add.graphics();
    line.lineStyle(3, 0x6688aa);
    line.beginPath();
    line.moveTo(-250, 0);
    line.lineTo(250, 0);
    line.strokePath();
    this._timelineOverlay.add(line);

    // 时间节点
    const nodePositions = [-200, -50, 100, 250];
    const nodeLabels = ['T-2', 'T-1', 'NOW', ''];
    
    nodePositions.forEach((x, i) => {
      if (i < 3) {
        const node = this._scene.add.circle(x, 0, 10, 0x88aacc);
        node.setStrokeStyle(2, 0xaaccff);
        this._timelineOverlay.add(node);

        const label = this._scene.add.text(x, 20, nodeLabels[i], {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#aaccff',
        });
        label.setOrigin(0.5, 0);
        this._timelineOverlay.add(label);
      }
    });
  }

  /**
   * 设置事件监听
   */
  private _setupEventListeners(): void {
    eventBus.on(GameEvent.ABILITY_ACTIVATED, this._onAbilityActivated, this);
    eventBus.on(GameEvent.ABILITY_DEACTIVATED, this._onAbilityDeactivated, this);
  }

  /**
   * 能力激活处理
   */
  private _onAbilityActivated(data: { ability: AbilityType }): void {
    this._activeAbility = data.ability;
    
    switch (data.ability) {
      case AbilityType.DEPTH_PERCEPTION:
        this._activatePerception();
        break;
      case AbilityType.DEPTH_INTERVENTION:
        this._activateIntervention();
        break;
      case AbilityType.TIME_INTERVENTION:
        this._activateTimeIntervention();
        break;
    }
  }

  /**
   * 能力停用处理
   */
  private _onAbilityDeactivated(_data: { ability: AbilityType }): void {
    this._deactivateAll();
    this._activeAbility = null;
  }

  /**
   * 激活深度感知效果
   */
  private _activatePerception(): void {
    // 蓝紫色叠加
    this._scene.tweens.add({
      targets: this._perceptionOverlay,
      fillAlpha: 0.15,
      duration: 500,
      ease: 'Sine.easeOut',
    });

    // 边缘发光效果
    this._addEdgeGlow(0x6644aa);
  }

  /**
   * 激活深度介入效果
   */
  private _activateIntervention(): void {
    // 绘制结构网格
    this._drawInterventionGrid();
    
    this._scene.tweens.add({
      targets: this._interventionGrid,
      alpha: 0.4,
      duration: 500,
      ease: 'Sine.easeOut',
    });

    // 橙色边缘发光
    this._addEdgeGlow(0xaa6644);
  }

  /**
   * 激活时间干预效果
   */
  private _activateTimeIntervention(): void {
    // 显示时间线
    this._scene.tweens.add({
      targets: this._timelineOverlay,
      alpha: 1,
      duration: 500,
      ease: 'Sine.easeOut',
    });

    // 时间扭曲效果 - 轻微色调偏移
    this._perceptionOverlay.setFillStyle(0x446688, 0.1);
    this._scene.tweens.add({
      targets: this._perceptionOverlay,
      fillAlpha: 0.1,
      duration: 500,
    });

    // 青色边缘发光
    this._addEdgeGlow(0x44aa88);
  }

  /**
   * 绘制介入网格
   */
  private _drawInterventionGrid(): void {
    const { width, height } = this._scene.scale;
    
    this._interventionGrid.clear();
    this._interventionGrid.lineStyle(1, 0xaa6644, 0.3);

    // 垂直线
    for (let x = 0; x <= width; x += 50) {
      this._interventionGrid.beginPath();
      this._interventionGrid.moveTo(x, 0);
      this._interventionGrid.lineTo(x, height);
      this._interventionGrid.strokePath();
    }

    // 水平线
    for (let y = 0; y <= height; y += 50) {
      this._interventionGrid.beginPath();
      this._interventionGrid.moveTo(0, y);
      this._interventionGrid.lineTo(width, y);
      this._interventionGrid.strokePath();
    }

    // 交叉点标记
    this._interventionGrid.fillStyle(0xaa6644, 0.5);
    for (let x = 50; x < width; x += 100) {
      for (let y = 50; y < height; y += 100) {
        this._interventionGrid.fillCircle(x, y, 3);
      }
    }
  }

  /**
   * 添加边缘发光效果
   */
  private _addEdgeGlow(color: number): void {
    const { width } = this._scene.scale;
    
    // 创建渐变边缘
    const edgeGraphics = this._scene.add.graphics();
    edgeGraphics.setDepth(499);
    
    // 上边缘
    edgeGraphics.fillGradientStyle(color, color, 0x000000, 0x000000, 0.3, 0.3, 0, 0);
    edgeGraphics.fillRect(0, 0, width, 100);
    
    // 动画
    this._scene.tweens.add({
      targets: edgeGraphics,
      alpha: { from: 0, to: 0.5 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 存储以便清理
    (this as unknown as { _edgeGlow: Phaser.GameObjects.Graphics })._edgeGlow = edgeGraphics;
  }

  /**
   * 停用所有效果
   */
  private _deactivateAll(): void {
    // 隐藏感知叠加
    this._scene.tweens.add({
      targets: this._perceptionOverlay,
      fillAlpha: 0,
      duration: 300,
    });

    // 隐藏介入网格
    this._scene.tweens.add({
      targets: this._interventionGrid,
      alpha: 0,
      duration: 300,
    });

    // 隐藏时间线
    this._scene.tweens.add({
      targets: this._timelineOverlay,
      alpha: 0,
      duration: 300,
    });

    // 清理边缘发光
    if ((this as any)._edgeGlow) {
      this._scene.tweens.killTweensOf((this as any)._edgeGlow);
      (this as any)._edgeGlow.destroy();
      (this as any)._edgeGlow = null;
    }
  }

  /**
   * 显示隐藏元素效果
   * 用于深度感知发现隐藏内容
   */
  public revealHiddenElement(target: Phaser.GameObjects.GameObject): void {
    if (!('setAlpha' in target)) return;
    
    // 渐显 + 发光
    this._scene.tweens.add({
      targets: target,
      alpha: 1,
      duration: 500,
      ease: 'Sine.easeOut',
    });

    // 如果有tint属性，添加蓝紫色调
    if ('setTint' in target) {
      const tintable = target as unknown as Phaser.GameObjects.Sprite;
      tintable.setTint(0xccbbff);
      this._scene.time.delayedCall(1000, () => {
        tintable.clearTint();
      });
    }
  }

  /**
   * 显示伤痕效果
   * 用于深度介入后的痕迹
   */
  public showScarEffect(x: number, y: number): void {
    const scar = this._scene.add.graphics();
    scar.setDepth(100);
    
    // 绘制裂痕
    scar.lineStyle(2, 0xaa4444, 0.8);
    scar.beginPath();
    scar.moveTo(x - 20, y - 20);
    scar.lineTo(x + 5, y);
    scar.lineTo(x - 5, y + 10);
    scar.lineTo(x + 20, y + 20);
    scar.strokePath();

    // 淡入
    scar.setAlpha(0);
    this._scene.tweens.add({
      targets: scar,
      alpha: 0.8,
      duration: 300,
    });
  }

  /**
   * 显示时间回溯效果
   */
  public showRewindEffect(callback?: () => void): void {
    const { width, height } = this._scene.scale;
    
    // 全屏闪白
    const flash = this._scene.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0);
    flash.setDepth(1000);

    this._scene.tweens.add({
      targets: flash,
      alpha: { from: 0, to: 0.8 },
      duration: 200,
      yoyo: true,
      onComplete: () => {
        flash.destroy();
        callback?.();
      },
    });

    // 时间扭曲音效应该在这里播放
    eventBus.emit(GameEvent.PLAY_SFX, { key: 'sfx_time_rewind' });
  }

  /**
   * 显示污染标记
   */
  public showPollutionMark(x: number, y: number): void {
    const mark = this._scene.add.text(x, y, '◦', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#aa4444',
    });
    mark.setOrigin(0.5);
    mark.setDepth(101);
    mark.setAlpha(0);

    this._scene.tweens.add({
      targets: mark,
      alpha: 0.6,
      scale: { from: 0.5, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  /**
   * 获取当前激活的能力
   */
  public getActiveAbility(): AbilityType | null {
    return this._activeAbility;
  }

  /**
   * 销毁
   */
  public destroy(): void {
    eventBus.off(GameEvent.ABILITY_ACTIVATED, this._onAbilityActivated, this);
    eventBus.off(GameEvent.ABILITY_DEACTIVATED, this._onAbilityDeactivated, this);
    
    this._perceptionOverlay?.destroy();
    this._interventionGrid?.destroy();
    this._timelineOverlay?.destroy();
    
    if ((this as any)._edgeGlow) {
      (this as any)._edgeGlow.destroy();
    }
  }
}

