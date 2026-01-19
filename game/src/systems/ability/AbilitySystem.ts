/**
 * 能力系统
 * 管理深度感知、深度介入、时间干预三种核心能力
 * @module systems/ability/AbilitySystem
 */

import Phaser from 'phaser';
import { createLogger } from '@/utils/Logger';
import { eventBus, GameEvent } from '@/systems/EventBus';

const logger = createLogger('AbilitySystem');
import { worldState } from '@/systems/world';
import { saveManager } from '@/systems/save';
import { SCENES } from '@/config/game.config';
import type { AbilityType } from '@/config/game.config';
import { UI_FONT_SIZE } from '@/config/ui.config';

// ==================== 配置常量 ====================

const CONFIG = {
  /** 深度感知持续时间(ms) */
  DEPTH_PERCEPTION_DURATION: 5000,
  /** 深度介入冷却时间(ms) */
  DEPTH_INTERVENTION_COOLDOWN: 10000,
  /** 时间干预冷却时间(ms) */
  TIME_INTERVENTION_COOLDOWN: 30000,
  /** 能力P值消耗 */
  P_COST: {
    DEPTH_PERCEPTION: 1,
    DEPTH_INTERVENTION: 3,
    TIME_INTERVENTION: 5,
  } as Record<AbilityType, number>,
};

// ==================== 类型定义 ====================

interface IAbilityState {
  isActive: boolean;
  cooldownRemaining: number;
  lastUsedTime: number;
}

interface IAbilitySystemConfig {
  scene: Phaser.Scene;
  onAbilityActivate?: (type: AbilityType) => void;
  onAbilityDeactivate?: (type: AbilityType) => void;
}

// ==================== AbilitySystem类 ====================

/**
 * 能力系统管理器
 */
export class AbilitySystem {
  private _scene: Phaser.Scene;
  private _states: Map<AbilityType, IAbilityState> = new Map();
  private _activeTimers: Map<AbilityType, Phaser.Time.TimerEvent> = new Map();
  private _cooldownTimers: Map<AbilityType, Phaser.Time.TimerEvent> = new Map();
  private _callbacks: IAbilitySystemConfig;

  // 视觉效果
  private _depthPerceptionOverlay: Phaser.GameObjects.Graphics | null = null;
  private _depthInterventionHighlights: Phaser.GameObjects.Container | null = null;
  private _timeInterventionUI: Phaser.GameObjects.Container | null = null;

  constructor(config: IAbilitySystemConfig) {
    this._scene = config.scene;
    this._callbacks = config;
    this._initializeStates();
    this._setupEventListeners();
  }

  // ==================== 公共方法 ====================

  /**
   * 尝试激活能力
   */
  activateAbility(type: AbilityType): boolean {
    // 检查是否解锁
    if (!worldState.hasAbility(type)) {
      logger.debug(`能力未解锁: ${type}`);
      return false;
    }

    // 检查冷却
    const state = this._states.get(type);
    if (!state || state.cooldownRemaining > 0) {
      logger.debug(`能力冷却中: ${type}`);
      return false;
    }

    // 检查是否已激活
    if (state.isActive) {
      return false;
    }

    // 使用能力（消耗P值）
    if (!worldState.useAbility(type)) {
      logger.debug(`P值过高，无法使用能力: ${type}`);
      return false;
    }

    // 激活
    state.isActive = true;
    state.lastUsedTime = Date.now();

    this._onAbilityActivate(type);
    eventBus.emit(GameEvent.ABILITY_ACTIVATE, { abilityType: type });
    this._callbacks.onAbilityActivate?.(type);

    return true;
  }

  /**
   * 手动停用能力
   */
  deactivateAbility(type: AbilityType): void {
    const state = this._states.get(type);
    if (!state || !state.isActive) return;

    state.isActive = false;
    this._onAbilityDeactivate(type);
    eventBus.emit(GameEvent.ABILITY_DEACTIVATE, { abilityType: type });
    this._callbacks.onAbilityDeactivate?.(type);
  }

  /**
   * 检查能力是否激活
   */
  isAbilityActive(type: AbilityType): boolean {
    return this._states.get(type)?.isActive ?? false;
  }

  /**
   * 获取能力冷却剩余时间
   */
  getCooldownRemaining(type: AbilityType): number {
    return this._states.get(type)?.cooldownRemaining ?? 0;
  }

  /**
   * 获取所有能力状态
   */
  getAbilityStates(): Map<AbilityType, IAbilityState> {
    return new Map(this._states);
  }

  /**
   * 更新（每帧调用）
   */
  update(_delta: number): void {
    // 更新冷却时间
    this._states.forEach((state) => {
      if (state.cooldownRemaining > 0) {
        state.cooldownRemaining = Math.max(0, state.cooldownRemaining - _delta);
      }
    });
  }

  /**
   * 销毁
   */
  destroy(): void {
    this._activeTimers.forEach((timer) => timer.destroy());
    this._cooldownTimers.forEach((timer) => timer.destroy());
    this._cleanupVisualEffects();
  }

  // ==================== 深度感知 ====================

  /**
   * 深度感知：揭示隐藏信息，标记可交互对象
   */
  private _activateDepthPerception(): void {
    const { width, height } = this._scene.scale;

    // 创建视觉滤镜效果
    this._depthPerceptionOverlay = this._scene.add.graphics();
    this._depthPerceptionOverlay.setDepth(900);

    // 蓝色调滤镜
    this._depthPerceptionOverlay.fillStyle(0x0066aa, 0.15);
    this._depthPerceptionOverlay.fillRect(0, 0, width, height);

    // 边缘发光效果
    this._depthPerceptionOverlay.lineStyle(4, 0x00ffff, 0.8);
    this._depthPerceptionOverlay.strokeRect(10, 10, width - 20, height - 20);

    // 扫描线动画
    const scanLine = this._scene.add.rectangle(width / 2, 0, width, 3, 0x00ffff, 0.5);
    scanLine.setDepth(901);

    this._scene.tweens.add({
      targets: scanLine,
      y: height,
      duration: 2000,
      repeat: 2,
      onComplete: () => {
        scanLine.destroy();
      },
    });

    // 高亮隐藏物体（通过事件通知场景）
    eventBus.emit(GameEvent.ABILITY_USE, { abilityType: 'DEPTH_PERCEPTION' as AbilityType });

    // 设置自动关闭
    const timer = this._scene.time.delayedCall(CONFIG.DEPTH_PERCEPTION_DURATION, () => {
      this.deactivateAbility('DEPTH_PERCEPTION' as AbilityType);
    });
    this._activeTimers.set('DEPTH_PERCEPTION' as AbilityType, timer);
  }

  private _deactivateDepthPerception(): void {
    // 移除视觉效果
    if (this._depthPerceptionOverlay) {
      this._scene.tweens.add({
        targets: this._depthPerceptionOverlay,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this._depthPerceptionOverlay?.destroy();
          this._depthPerceptionOverlay = null;
        },
      });
    }

    // 清除计时器
    const timer = this._activeTimers.get('DEPTH_PERCEPTION' as AbilityType);
    if (timer) {
      timer.destroy();
      this._activeTimers.delete('DEPTH_PERCEPTION' as AbilityType);
    }
  }

  // ==================== 深度介入 ====================

  /**
   * 深度介入：修改对象属性，会留下伤痕
   */
  private _activateDepthIntervention(): void {
    const { width, height } = this._scene.scale;

    // 创建介入模式UI
    this._depthInterventionHighlights = this._scene.add.container(0, 0);
    this._depthInterventionHighlights.setDepth(905);

    // 紫色调滤镜
    const overlay = this._scene.add.graphics();
    overlay.fillStyle(0x6600aa, 0.2);
    overlay.fillRect(0, 0, width, height);
    this._depthInterventionHighlights.add(overlay);

    // 提示文字
    const hint = this._scene.add
      .text(width / 2, 100, '深度介入模式\n点击可修改的对象', {
        fontSize: UI_FONT_SIZE.NORMAL,
        color: '#FF00FF',
        align: 'center',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);
    this._depthInterventionHighlights.add(hint);

    // 闪烁动画
    this._scene.tweens.add({
      targets: hint,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // 通知场景高亮可介入对象
    eventBus.emit(GameEvent.ABILITY_USE, { abilityType: 'DEPTH_INTERVENTION' as AbilityType });
  }

  private _deactivateDepthIntervention(): void {
    if (this._depthInterventionHighlights) {
      this._scene.tweens.add({
        targets: this._depthInterventionHighlights,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this._depthInterventionHighlights?.destroy();
          this._depthInterventionHighlights = null;
        },
      });
    }

    // 开始冷却
    this._startCooldown('DEPTH_INTERVENTION' as AbilityType, CONFIG.DEPTH_INTERVENTION_COOLDOWN);
  }

  /**
   * 执行深度介入操作
   */
  performIntervention(objectId: string, zoneId: string, modification: string): void {
    if (!this.isAbilityActive('DEPTH_INTERVENTION' as AbilityType)) {
      logger.warn('深度介入未激活');
      return;
    }

    // 创建伤痕记录
    worldState.addScar({
      zoneId,
      objectId,
      type: 'structural_crack',
      description: modification,
    });

    // 停用能力
    this.deactivateAbility('DEPTH_INTERVENTION' as AbilityType);

    logger.info(`深度介入完成: ${objectId} @ ${zoneId}`);
  }

  // ==================== 时间干预 ====================

  /**
   * 时间干预：回溯到之前的状态节点
   */
  private async _activateTimeIntervention(): Promise<void> {
    const { width, height } = this._scene.scale;

    // 创建时间干预UI
    this._timeInterventionUI = this._scene.add.container(0, 0);
    this._timeInterventionUI.setDepth(1000);

    // 全屏遮罩
    const overlay = this._scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    this._timeInterventionUI.add(overlay);

    // 标题
    const title = this._scene.add
      .text(width / 2, 50, '时间干预', {
        fontSize: UI_FONT_SIZE.ICON_LARGE,
        color: '#FFD700',
      })
      .setOrigin(0.5);
    this._timeInterventionUI.add(title);

    // 警告文字
    const warning = this._scene.add
      .text(width / 2, 90, '回溯会产生时间污染', {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#FF4444',
      })
      .setOrigin(0.5);
    this._timeInterventionUI.add(warning);

    // 获取存档列表
    const saves = await saveManager.getSaveList();

    if (saves.length === 0) {
      const noNodeText = this._scene.add
        .text(width / 2, height / 2, '暂无可回溯节点', {
          fontSize: UI_FONT_SIZE.MEDIUM,
          color: '#888888',
        })
        .setOrigin(0.5);
      this._timeInterventionUI.add(noNodeText);
    } else {
      // 显示存档列表
      saves.forEach((save, index) => {
        const y = 150 + index * 60;
        const container = this._scene.add.container(width / 2, y);

        const bg = this._scene.add.graphics();
        bg.fillStyle(0x333333, 1);
        bg.fillRoundedRect(-200, -25, 400, 50, 8);
        bg.lineStyle(1, 0x666666, 1);
        bg.strokeRoundedRect(-200, -25, 400, 50, 8);

        const text = this._scene.add
          .text(
            0,
            0,
            `${save.chapter} - ${save.currentZone} (${new Date(save.timestamp).toLocaleTimeString()})`,
            {
              fontSize: UI_FONT_SIZE.SMALL,
              color: '#FFFFFF',
            }
          )
          .setOrigin(0.5);

        container.add([bg, text]);
        container.setSize(400, 50);
        container
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x444444, 1);
            bg.fillRoundedRect(-200, -25, 400, 50, 8);
            bg.lineStyle(1, 0xffd700, 1);
            bg.strokeRoundedRect(-200, -25, 400, 50, 8);
            text.setColor('#FFD700');
          })
          .on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x333333, 1);
            bg.fillRoundedRect(-200, -25, 400, 50, 8);
            bg.lineStyle(1, 0x666666, 1);
            bg.strokeRoundedRect(-200, -25, 400, 50, 8);
            text.setColor('#FFFFFF');
          })
          .on('pointerdown', () => {
            this.performTimeRewind(save.slot.toString());
          });

        this._timeInterventionUI?.add(container);
      });
    }

    // 取消按钮
    const cancelBtn = this._scene.add
      .text(width / 2, height - 50, '取消', {
        fontSize: UI_FONT_SIZE.NORMAL,
        color: '#888888',
        backgroundColor: '#333333',
        padding: { x: 40, y: 15 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => cancelBtn.setColor('#FFFFFF'))
      .on('pointerout', () => cancelBtn.setColor('#888888'))
      .on('pointerdown', () => this.deactivateAbility('TIME_INTERVENTION' as AbilityType));

    this._timeInterventionUI.add(cancelBtn);

    // 进入动画
    this._timeInterventionUI.setAlpha(0);
    this._scene.tweens.add({
      targets: this._timeInterventionUI,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
  }

  private _deactivateTimeIntervention(): void {
    if (this._timeInterventionUI) {
      this._scene.tweens.add({
        targets: this._timeInterventionUI,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this._timeInterventionUI?.destroy();
          this._timeInterventionUI = null;
        },
      });
    }

    // 开始冷却
    this._startCooldown('TIME_INTERVENTION' as AbilityType, CONFIG.TIME_INTERVENTION_COOLDOWN);
  }

  /**
   * 执行时间回溯
   */
  async performTimeRewind(nodeId: string): Promise<void> {
    if (!this.isAbilityActive('TIME_INTERVENTION' as AbilityType)) {
      logger.warn('时间干预未激活');
      return;
    }

    const slot = parseInt(nodeId);
    if (isNaN(slot)) return;

    // 1. 加载旧状态
    const success = await saveManager.load(slot);
    if (!success) {
      logger.error('回溯失败: 无法加载存档');
      return;
    }

    // 2. 创建时间污染 (在加载后的状态上添加)
    const currentZone = worldState.getCurrentZone();
    worldState.addContamination({
      sourceZoneId: currentZone,
      affectedZoneIds: [currentZone],
      type: 'timeline_fracture',
    });

    logger.info(`时间回溯完成: ${nodeId}`);

    // 3. 重启场景
    this._scene.scene.start(SCENES.GAME, { zoneId: currentZone, isNewGame: false });

    // UI会自动销毁，不需要手动deactivate
  }

  // ==================== 私有方法 ====================

  private _initializeStates(): void {
    const abilityTypes: AbilityType[] = [
      'DEPTH_PERCEPTION',
      'DEPTH_INTERVENTION',
      'TIME_INTERVENTION',
    ];

    abilityTypes.forEach((type) => {
      this._states.set(type, {
        isActive: false,
        cooldownRemaining: 0,
        lastUsedTime: 0,
      });
    });
  }

  private _setupEventListeners(): void {
    // 监听能力解锁
    eventBus.onTyped(GameEvent.ABILITY_UNLOCK, (payload: { abilityType: string }) => {
      logger.info(`能力解锁: ${payload.abilityType}`);
    });
  }

  private _onAbilityActivate(type: AbilityType): void {
    switch (type) {
      case 'DEPTH_PERCEPTION':
        this._activateDepthPerception();
        break;
      case 'DEPTH_INTERVENTION':
        this._activateDepthIntervention();
        break;
      case 'TIME_INTERVENTION':
        void this._activateTimeIntervention();
        break;
    }
  }

  private _onAbilityDeactivate(type: AbilityType): void {
    switch (type) {
      case 'DEPTH_PERCEPTION':
        this._deactivateDepthPerception();
        break;
      case 'DEPTH_INTERVENTION':
        this._deactivateDepthIntervention();
        break;
      case 'TIME_INTERVENTION':
        this._deactivateTimeIntervention();
        break;
    }
  }

  private _startCooldown(type: AbilityType, duration: number): void {
    const state = this._states.get(type);
    if (!state) return;

    state.cooldownRemaining = duration;

    // 可选：使用TimerEvent精确追踪
    const timer = this._scene.time.addEvent({
      delay: 100,
      callback: () => {
        state.cooldownRemaining = Math.max(0, state.cooldownRemaining - 100);
        if (state.cooldownRemaining <= 0) {
          timer.destroy();
          this._cooldownTimers.delete(type);
        }
      },
      repeat: Math.ceil(duration / 100),
    });

    this._cooldownTimers.set(type, timer);
  }

  private _cleanupVisualEffects(): void {
    this._depthPerceptionOverlay?.destroy();
    this._depthInterventionHighlights?.destroy();
    this._timeInterventionUI?.destroy();
  }
}
