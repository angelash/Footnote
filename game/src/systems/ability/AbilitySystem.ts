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
import type { ITimeNode } from '@/types';

// ==================== 配置常量 ====================

const CONFIG = {
  /** 深度感知蓄力时间(ms) - 长按超过此时间才激活 */
  DEPTH_PERCEPTION_CHARGE_TIME: 500,
  /** 深度感知每秒P值消耗 */
  DEPTH_PERCEPTION_P_PER_SECOND: 1,
  /** 深度介入冷却时间(ms) */
  DEPTH_INTERVENTION_COOLDOWN: 10000,
  /** 深度介入P值消耗 */
  DEPTH_INTERVENTION_P_COST: 3,
  /** 时间干预冷却时间(ms) */
  TIME_INTERVENTION_COOLDOWN: 30000,
  /** 时间干预每节点P值消耗 */
  TIME_INTERVENTION_P_PER_NODE: 2,
  /** 能力P值消耗（初始激活） */
  P_COST: {
    DEPTH_PERCEPTION: 0, // 深度感知按时长计P，初始不消耗
    DEPTH_INTERVENTION: 3,
    TIME_INTERVENTION: 0, // 时间干预按节点距离计P
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

/**
 * 可介入目标的回调函数类型
 */
type IntervenableCallback = (objectId: string) => void;

/**
 * 可介入目标信息
 */
interface IIntervenableTarget {
  id: string;
  gameObject: Phaser.GameObjects.GameObject;
  callback: IntervenableCallback;
  originalPosition?: { x: number; y: number };
}

// ITimeNode 已移至 @/types 统一定义

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

  // 深度感知长按状态
  private _depthPerceptionCharging = false;
  private _depthPerceptionChargeStartTime = 0;
  private _depthPerceptionPTimer: Phaser.Time.TimerEvent | null = null;
  private _depthPerceptionAccumulatedP = 0;

  // 深度介入拖拽状态
  private _intervenableTargets: Map<string, IIntervenableTarget> = new Map();
  private _dragTarget: IIntervenableTarget | null = null;
  private _isDragging = false;
  private _dragStartPosition: { x: number; y: number } | null = null;

  // 时间干预节点管理
  private _timeNodes: ITimeNode[] = [];
  private _currentNodeIndex = 0;

  constructor(config: IAbilitySystemConfig) {
    this._scene = config.scene;
    this._callbacks = config;
    this._initializeStates();
    this._setupEventListeners();
    this._setupInputHandlers();
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

    // 同步能力激活状态到 FLAG（供 SceneAssembler condition 使用）
    this._syncAbilityActiveFlag(type, true);

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
    // 同步能力激活状态到 FLAG（供 SceneAssembler condition 使用）
    this._syncAbilityActiveFlag(type, false);
    this._onAbilityDeactivate(type);
    eventBus.emit(GameEvent.ABILITY_DEACTIVATE, { abilityType: type });
    this._callbacks.onAbilityDeactivate?.(type);
  }

  private _syncAbilityActiveFlag(type: AbilityType, isActive: boolean): void {
    // 注意：这里不做“解锁判定”，因为 activateAbility 本身已保证 hasAbility。
    switch (type) {
      case 'DEPTH_PERCEPTION':
        worldState.setFlag('FLAG_DEPTH_SENSE_ACTIVE', isActive);
        break;
      case 'DEPTH_INTERVENTION':
        worldState.setFlag('FLAG_DEPTH_INTERVENTION_ACTIVE', isActive);
        break;
      case 'TIME_INTERVENTION':
        worldState.setFlag('FLAG_TIME_INTERVENTION_ACTIVE', isActive);
        break;
    }
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

    // 更新深度感知蓄力状态
    this._updateDepthPerceptionCharge();
  }

  /**
   * 销毁
   */
  destroy(): void {
    this._activeTimers.forEach((timer) => timer.destroy());
    this._cooldownTimers.forEach((timer) => timer.destroy());
    this._depthPerceptionPTimer?.destroy();
    this._cleanupVisualEffects();
    this._intervenableTargets.clear();
    this._timeNodes = [];
  }

  // ==================== 深度感知 ====================

  /**
   * 开始深度感知蓄力（长按检测）
   */
  startDepthPerceptionCharge(): void {
    // 检查是否解锁
    if (!worldState.hasAbility('DEPTH_PERCEPTION' as AbilityType)) {
      logger.debug('深度感知未解锁');
      return;
    }

    // 检查冷却
    const state = this._states.get('DEPTH_PERCEPTION' as AbilityType);
    if (!state || state.cooldownRemaining > 0 || state.isActive) {
      return;
    }

    this._depthPerceptionCharging = true;
    this._depthPerceptionChargeStartTime = Date.now();
    logger.debug('深度感知蓄力开始');
  }

  /**
   * 更新深度感知蓄力状态
   */
  private _updateDepthPerceptionCharge(): void {
    if (!this._depthPerceptionCharging) return;

    const elapsed = Date.now() - this._depthPerceptionChargeStartTime;

    // 检查是否达到蓄力时间
    if (elapsed >= CONFIG.DEPTH_PERCEPTION_CHARGE_TIME) {
      const state = this._states.get('DEPTH_PERCEPTION' as AbilityType);
      if (state && !state.isActive) {
        // 蓄力完成，激活能力
        this._depthPerceptionCharging = false;
        this._activateDepthPerceptionInternal();
      }
    }
  }

  /**
   * 取消深度感知蓄力或停用能力（松开时调用）
   */
  stopDepthPerceptionCharge(): void {
    if (this._depthPerceptionCharging) {
      // 未完成蓄力，取消
      this._depthPerceptionCharging = false;
      logger.debug('深度感知蓄力取消');
      return;
    }

    // 已激活，停用
    if (this.isAbilityActive('DEPTH_PERCEPTION' as AbilityType)) {
      this.deactivateAbility('DEPTH_PERCEPTION' as AbilityType);
    }
  }

  /**
   * 深度感知：揭示隐藏信息，标记可交互对象
   * 内部激活方法，由蓄力完成后调用
   */
  private _activateDepthPerceptionInternal(): void {
    const state = this._states.get('DEPTH_PERCEPTION' as AbilityType);
    if (!state) return;

    state.isActive = true;
    state.lastUsedTime = Date.now();
    this._depthPerceptionAccumulatedP = 0;

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

    // 扫描线动画（单次）
    const scanLine = this._scene.add.rectangle(width / 2, 0, width, 3, 0x00ffff, 0.5);
    scanLine.setDepth(901);

    this._scene.tweens.add({
      targets: scanLine,
      y: height,
      duration: 2000,
      onComplete: () => {
        scanLine.destroy();
      },
    });

    // 高亮隐藏物体（通过事件通知场景）
    eventBus.emit(GameEvent.ABILITY_USE, { abilityType: 'DEPTH_PERCEPTION' as AbilityType });
    eventBus.emit(GameEvent.ABILITY_ACTIVATE, { abilityType: 'DEPTH_PERCEPTION' as AbilityType });
    this._callbacks.onAbilityActivate?.('DEPTH_PERCEPTION' as AbilityType);

    // 设置P值消耗计时器（每秒消耗1点P）
    this._depthPerceptionPTimer = this._scene.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.isAbilityActive('DEPTH_PERCEPTION' as AbilityType)) {
          this._depthPerceptionAccumulatedP += CONFIG.DEPTH_PERCEPTION_P_PER_SECOND;
          worldState.addP(CONFIG.DEPTH_PERCEPTION_P_PER_SECOND);
          logger.debug(`深度感知P值消耗: ${this._depthPerceptionAccumulatedP}`);
        }
      },
      loop: true,
    });

    logger.info('深度感知激活');
  }

  /**
   * 深度感知：揭示隐藏信息（兼容旧接口）
   */
  private _activateDepthPerception(): void {
    // 直接激活（用于调试或直接调用）
    this._activateDepthPerceptionInternal();
  }

  private _deactivateDepthPerception(): void {
    // 停止P值消耗计时器
    if (this._depthPerceptionPTimer) {
      this._depthPerceptionPTimer.destroy();
      this._depthPerceptionPTimer = null;
    }

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

    logger.info(`深度感知停用，累计消耗P值: ${this._depthPerceptionAccumulatedP}`);
    this._depthPerceptionAccumulatedP = 0;
  }

  // ==================== 深度介入 ====================

  /**
   * 注册可介入目标
   * @param id 目标唯一ID
   * @param gameObject Phaser游戏对象
   * @param callback 介入完成后的回调函数
   */
  registerIntervenableTarget(
    id: string,
    gameObject: Phaser.GameObjects.GameObject,
    callback: IntervenableCallback
  ): void {
    // 保存原始位置（如果是有位置的对象）
    let originalPosition: { x: number; y: number } | undefined;
    if ('x' in gameObject && 'y' in gameObject) {
      originalPosition = {
        x: gameObject.x as number,
        y: gameObject.y as number,
      };
    }

    this._intervenableTargets.set(id, {
      id,
      gameObject,
      callback,
      originalPosition,
    });

    logger.debug(`注册可介入目标: ${id}`);
  }

  /**
   * 注销可介入目标
   */
  unregisterIntervenableTarget(id: string): void {
    this._intervenableTargets.delete(id);
    logger.debug(`注销可介入目标: ${id}`);
  }

  /**
   * 获取所有可介入目标
   */
  getIntervenableTargets(): Map<string, IIntervenableTarget> {
    return new Map(this._intervenableTargets);
  }

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
      .text(width / 2, 100, '深度介入模式\n拖拽可修改的对象', {
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

    // 高亮所有可介入目标
    this._highlightIntervenableTargets();

    // 通知场景高亮可介入对象
    eventBus.emit(GameEvent.ABILITY_USE, { abilityType: 'DEPTH_INTERVENTION' as AbilityType });
  }

  /**
   * 高亮可介入目标
   */
  private _highlightIntervenableTargets(): void {
    if (!this._depthInterventionHighlights) return;

    this._intervenableTargets.forEach((target) => {
      const obj = target.gameObject;
      if ('x' in obj && 'y' in obj) {
        const x = obj.x as number;
        const y = obj.y as number;

        // 创建高亮边框
        const highlight = this._scene.add.graphics();
        highlight.lineStyle(3, 0xff00ff, 1);
        highlight.strokeCircle(x, y, 40);

        // 添加脉冲动画
        this._scene.tweens.add({
          targets: highlight,
          alpha: 0.3,
          duration: 600,
          yoyo: true,
          repeat: -1,
        });

        this._depthInterventionHighlights?.add(highlight);
      }
    });
  }

  private _deactivateDepthIntervention(): void {
    // 重置拖拽状态
    this._isDragging = false;
    this._dragTarget = null;
    this._dragStartPosition = null;

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
   * 处理拖拽开始
   */
  private _handleDragStart(pointer: Phaser.Input.Pointer): void {
    if (!this.isAbilityActive('DEPTH_INTERVENTION' as AbilityType)) return;

    // 查找点击的可介入目标
    for (const [, target] of this._intervenableTargets) {
      const obj = target.gameObject;
      if ('x' in obj && 'y' in obj) {
        const x = obj.x as number;
        const y = obj.y as number;
        const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, x, y);

        if (distance < 50) {
          this._isDragging = true;
          this._dragTarget = target;
          this._dragStartPosition = { x: pointer.x, y: pointer.y };
          logger.debug(`开始拖拽目标: ${target.id}`);
          return;
        }
      }
    }
  }

  /**
   * 处理拖拽移动
   */
  private _handleDragMove(pointer: Phaser.Input.Pointer): void {
    if (!this._isDragging || !this._dragTarget) return;

    const obj = this._dragTarget.gameObject;
    if ('x' in obj && 'y' in obj && 'setPosition' in obj) {
      (obj as Phaser.GameObjects.Sprite).setPosition(pointer.x, pointer.y);
    }
  }

  /**
   * 处理拖拽结束
   */
  private _handleDragEnd(pointer: Phaser.Input.Pointer): void {
    if (!this._isDragging || !this._dragTarget || !this._dragStartPosition) return;

    const dragDistance = Phaser.Math.Distance.Between(
      this._dragStartPosition.x,
      this._dragStartPosition.y,
      pointer.x,
      pointer.y
    );

    // 如果拖拽距离超过阈值，执行介入
    if (dragDistance > 30) {
      const zoneId = worldState.getCurrentZone();
      const modification = `位置变更: (${Math.round(pointer.x)}, ${Math.round(pointer.y)})`;

      // 调用回调
      this._dragTarget.callback(this._dragTarget.id);

      // 执行介入操作
      this.performIntervention(this._dragTarget.id, zoneId, modification);
    } else {
      // 距离不足，恢复原位
      if (this._dragTarget.originalPosition) {
        const obj = this._dragTarget.gameObject;
        if ('setPosition' in obj) {
          (obj as Phaser.GameObjects.Sprite).setPosition(
            this._dragTarget.originalPosition.x,
            this._dragTarget.originalPosition.y
          );
        }
      }
    }

    this._isDragging = false;
    this._dragTarget = null;
    this._dragStartPosition = null;
  }

  /**
   * 执行深度介入操作
   */
  performIntervention(objectId: string, zoneId: string, modification: string): void {
    if (!this.isAbilityActive('DEPTH_INTERVENTION' as AbilityType)) {
      logger.warn('深度介入未激活');
      return;
    }

    // 消耗P值
    worldState.addP(CONFIG.DEPTH_INTERVENTION_P_COST);

    // 创建伤痕记录
    worldState.addScar({
      zoneId,
      objectId,
      type: 'structural_crack',
      description: modification,
    });

    // 发出伤痕创建事件
    eventBus.emit(GameEvent.SCAR_CREATE, {
      scarId: `scar_${Date.now()}`,
      zoneId,
      objectId,
    });

    // 停用能力
    this.deactivateAbility('DEPTH_INTERVENTION' as AbilityType);

    logger.info(
      `深度介入完成: ${objectId} @ ${zoneId}, P值消耗: ${CONFIG.DEPTH_INTERVENTION_P_COST}`
    );
  }

  // ==================== 时间干预 ====================

  /**
   * 创建时间节点（每进入新Zone时自动调用）
   */
  async createTimeNode(zoneId: string): Promise<void> {
    // 自动保存当前状态
    const slot = this._timeNodes.length % 10; // 循环使用10个槽位
    const success = await saveManager.save(slot);

    if (success) {
      const node: ITimeNode = {
        id: `node_${Date.now()}`,
        zoneId,
        timestamp: Date.now(),
        saveSlot: slot,
        index: this._timeNodes.length,
      };

      this._timeNodes.push(node);
      this._currentNodeIndex = this._timeNodes.length - 1;

      logger.info(`创建时间节点: ${zoneId}, 索引: ${node.index}, 槽位: ${slot}`);
      eventBus.emit(GameEvent.TIME_NODE_CREATED, { node });
    }
  }

  /**
   * 获取所有时间节点
   */
  getTimeNodes(): ITimeNode[] {
    return [...this._timeNodes];
  }

  /**
   * 获取当前节点索引
   */
  getCurrentNodeIndex(): number {
    return this._currentNodeIndex;
  }

  /**
   * 计算回溯到目标节点的P值消耗
   */
  calculateRewindCost(targetNodeIndex: number): number {
    const distance = Math.abs(this._currentNodeIndex - targetNodeIndex);
    return distance * CONFIG.TIME_INTERVENTION_P_PER_NODE;
  }

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
      .text(width / 2, 90, '回溯会产生时间污染（每节点消耗2P）', {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#FF4444',
      })
      .setOrigin(0.5);
    this._timeInterventionUI.add(warning);

    // 优先显示时间节点，如果没有则使用存档列表
    if (this._timeNodes.length > 0) {
      this._renderTimeNodes(width, height);
    } else {
      // 回退到存档列表
      await this._renderSaveList(width, height);
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

  /**
   * 渲染时间节点列表
   */
  private _renderTimeNodes(width: number, height: number): void {
    if (!this._timeInterventionUI) return;

    // 只显示当前节点之前的节点
    const availableNodes = this._timeNodes.filter((_, i) => i < this._currentNodeIndex);

    if (availableNodes.length === 0) {
      const noNodeText = this._scene.add
        .text(width / 2, height / 2, '暂无可回溯节点', {
          fontSize: UI_FONT_SIZE.NORMAL,
          color: '#888888',
        })
        .setOrigin(0.5);
      this._timeInterventionUI.add(noNodeText);
      return;
    }

    // 逆序显示（最近的在上面）
    const reversedNodes = [...availableNodes].reverse();
    reversedNodes.slice(0, 8).forEach((node, displayIndex) => {
      const y = 150 + displayIndex * 60;
      const cost = this.calculateRewindCost(node.index ?? 0);

      const container = this._scene.add.container(width / 2, y);

      const bg = this._scene.add.graphics();
      bg.fillStyle(0x333333, 1);
      bg.fillRoundedRect(-200, -25, 400, 50, 8);
      bg.lineStyle(1, 0x666666, 1);
      bg.strokeRoundedRect(-200, -25, 400, 50, 8);

      const text = this._scene.add
        .text(0, 0, `${node.zoneId} (消耗${cost}P)`, {
          fontSize: UI_FONT_SIZE.SMALL,
          color: '#FFFFFF',
        })
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
          void this.performTimeRewindToNode(node);
        });

      this._timeInterventionUI?.add(container);
    });
  }

  /**
   * 渲染存档列表（后备方案）
   */
  private async _renderSaveList(width: number, height: number): Promise<void> {
    if (!this._timeInterventionUI) return;

    const saves = await saveManager.getSaveList();

    if (saves.length === 0) {
      const noNodeText = this._scene.add
        .text(width / 2, height / 2, '暂无可回溯节点', {
          fontSize: UI_FONT_SIZE.NORMAL,
          color: '#888888',
        })
        .setOrigin(0.5);
      this._timeInterventionUI.add(noNodeText);
      return;
    }

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
          void this.performTimeRewind(save.slot.toString());
        });

      this._timeInterventionUI?.add(container);
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
   * 执行时间回溯到指定节点
   */
  async performTimeRewindToNode(node: ITimeNode): Promise<void> {
    if (!this.isAbilityActive('TIME_INTERVENTION' as AbilityType)) {
      logger.warn('时间干预未激活');
      return;
    }

    // 计算并消耗P值
    const nodeIndex = node.index ?? 0;
    const cost = this.calculateRewindCost(nodeIndex);
    worldState.addP(cost);

    // 加载存档
    const saveSlot = node.saveSlot ?? 0;
    const success = await saveManager.load(saveSlot);
    if (!success) {
      logger.error(`回溯失败: 无法加载节点 ${node.id}`);
      return;
    }

    // 创建时间污染
    worldState.addContamination({
      sourceZoneId: node.zoneId,
      affectedZoneIds: [node.zoneId],
      type: 'timeline_fracture',
    });

    // 更新当前节点索引
    this._currentNodeIndex = nodeIndex;

    logger.info(`时间回溯完成: ${node.zoneId}, P值消耗: ${cost}`);

    // 重启场景
    this._scene.scene.start(SCENES.GAME, { zoneId: node.zoneId, isNewGame: false });
  }

  /**
   * 执行时间回溯（兼容旧接口，使用存档槽位）
   */
  async performTimeRewind(nodeId: string): Promise<void> {
    if (!this.isAbilityActive('TIME_INTERVENTION' as AbilityType)) {
      logger.warn('时间干预未激活');
      return;
    }

    const slot = parseInt(nodeId);
    if (isNaN(slot)) return;

    // 使用固定P值消耗（兼容模式）
    const cost = CONFIG.TIME_INTERVENTION_P_PER_NODE * 2;
    worldState.addP(cost);

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

    logger.info(`时间回溯完成: slot=${nodeId}, P值消耗: ${cost}`);

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

    // 监听Zone进入事件，自动创建时间节点
    eventBus.onTyped(GameEvent.ZONE_ENTER, (payload: { zoneId: string }) => {
      if (worldState.hasAbility('TIME_INTERVENTION' as AbilityType)) {
        void this.createTimeNode(payload.zoneId);
      }
    });
  }

  /**
   * 设置输入处理器
   */
  private _setupInputHandlers(): void {
    // 深度介入拖拽处理
    this._scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this._handleDragStart(pointer);
    });

    this._scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this._handleDragMove(pointer);
    });

    this._scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this._handleDragEnd(pointer);
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
