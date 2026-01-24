/**
 * Zone管理系统
 * 实现完整的Zone交互、出口、R值机会等管理
 * @module systems/zone/ZoneManager
 */

import Phaser from 'phaser';
import { createLogger } from '@/utils/Logger';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { worldState } from '@/systems/world';
import { narrativeEngine } from '@/systems/narrative';
import type {
  IZone,
  IZoneInteraction,
  IZoneExit,
  IROpportunity,
  IDialogueCondition,
  ForeshadowStage,
} from '@/types';
import type { ChapterID, ZoneType } from '@/config/game.config';

const logger = createLogger('ZoneManager');

// ==================== 类型定义 ====================

/**
 * Zone运行时状态
 */
export interface IZoneRuntimeState {
  /** Zone ID */
  zoneId: string;
  /** 已完成的交互ID列表 */
  completedInteractions: Set<string>;
  /** 已完成的R值机会ID列表 */
  completedROpportunities: Set<string>;
  /** 可用的出口ID列表（满足条件） */
  availableExits: string[];
  /** 入口对话是否已播放 */
  entryDialoguePlayed: boolean;
  /** 访问次数 */
  visitCount: number;
}

/**
 * Zone管理器配置
 */
export interface IZoneManagerConfig {
  scene: Phaser.Scene;
}

/**
 * 交互检查结果
 */
export interface IInteractionCheckResult {
  /** 是否可用 */
  available: boolean;
  /** 不可用原因 */
  reason?: string;
}

// ==================== ZoneManager 类 ====================

/**
 * Zone管理器
 * 管理Zone的加载、交互、出口等完整功能
 */
export class ZoneManager {
  private _scene: Phaser.Scene;
  private _zones: Map<string, IZone> = new Map();
  private _runtimeStates: Map<string, IZoneRuntimeState> = new Map();
  private _currentZoneId: string | null = null;

  constructor(config: IZoneManagerConfig) {
    this._scene = config.scene;
    this._setupEventListeners();
    logger.info('ZoneManager 初始化');
  }

  // ==================== 初始化 ====================

  /**
   * 设置事件监听
   */
  private _setupEventListeners(): void {
    eventBus.on(GameEvent.ZONE_ENTER, this._onZoneEnter, this);
    eventBus.on(GameEvent.ZONE_EXIT, this._onZoneExit, this);
  }

  /**
   * 注册Zone数据
   * @param zone Zone完整配置
   */
  public registerZone(zone: IZone): void {
    this._zones.set(zone.id, zone);
    
    // 初始化运行时状态
    if (!this._runtimeStates.has(zone.id)) {
      this._runtimeStates.set(zone.id, {
        zoneId: zone.id,
        completedInteractions: new Set(),
        completedROpportunities: new Set(),
        availableExits: [],
        entryDialoguePlayed: false,
        visitCount: 0,
      });
    }
    
    logger.debug(`注册Zone: ${zone.id} - ${zone.name}`);
  }

  /**
   * 批量注册Zone数据
   */
  public registerZones(zones: IZone[]): void {
    for (const zone of zones) {
      this.registerZone(zone);
    }
    logger.info(`批量注册 ${zones.length} 个Zone`);
  }

  // ==================== Zone 访问 ====================

  /**
   * 获取Zone配置
   */
  public getZone(zoneId: string): IZone | undefined {
    return this._zones.get(zoneId);
  }

  /**
   * 获取当前Zone
   */
  public getCurrentZone(): IZone | undefined {
    return this._currentZoneId ? this._zones.get(this._currentZoneId) : undefined;
  }

  /**
   * 获取当前Zone ID
   */
  public getCurrentZoneId(): string | null {
    return this._currentZoneId;
  }

  /**
   * 获取Zone运行时状态
   */
  public getRuntimeState(zoneId: string): IZoneRuntimeState | undefined {
    return this._runtimeStates.get(zoneId);
  }

  /**
   * 获取章节的所有Zone
   */
  public getZonesByChapter(chapter: ChapterID): IZone[] {
    return Array.from(this._zones.values()).filter(z => z.chapter === chapter);
  }

  /**
   * 获取所有Zone
   */
  public getAllZones(): IZone[] {
    return Array.from(this._zones.values());
  }

  // ==================== Zone 进入/离开 ====================

  /**
   * Zone进入事件处理
   */
  private _onZoneEnter(data: { zoneId: string }): void {
    const { zoneId } = data;
    this._currentZoneId = zoneId;
    
    const state = this._runtimeStates.get(zoneId);
    if (state) {
      state.visitCount++;
    }
    
    // 更新可用出口
    this._updateAvailableExits(zoneId);
    
    // 检查入口对话
    this._checkEntryDialogue(zoneId);
    
    logger.info(`进入Zone: ${zoneId}`);
  }

  /**
   * Zone离开事件处理
   */
  private _onZoneExit(data: { zoneId: string }): void {
    logger.debug(`离开Zone: ${data.zoneId}`);
  }

  /**
   * 进入Zone（主动调用）
   */
  public enterZone(zoneId: string): boolean {
    const zone = this._zones.get(zoneId);
    if (!zone) {
      logger.warn(`Zone不存在: ${zoneId}`);
      return false;
    }

    // 检查是否解锁
    const zoneState = worldState.getZoneState(zoneId);
    if (!zoneState?.unlocked) {
      logger.warn(`Zone未解锁: ${zoneId}`);
      return false;
    }

    // 发送Zone转换事件
    eventBus.emit(GameEvent.ZONE_TRANSITION, { targetZone: zoneId });
    return true;
  }

  // ==================== 交互系统 ====================

  /**
   * 获取Zone的所有交互
   */
  public getInteractions(zoneId: string): IZoneInteraction[] {
    const zone = this._zones.get(zoneId);
    return zone?.interactions || [];
  }

  /**
   * 获取可用的交互（满足条件）
   */
  public getAvailableInteractions(zoneId: string): IZoneInteraction[] {
    const zone = this._zones.get(zoneId);
    if (!zone) return [];

    return zone.interactions.filter(interaction => 
      this.checkInteractionCondition(interaction).available
    );
  }

  /**
   * 检查交互条件
   */
  public checkInteractionCondition(interaction: IZoneInteraction): IInteractionCheckResult {
    // 检查是否已完成（一次性交互）
    const state = this._runtimeStates.get(interaction.id.split('_')[0]);
    if (state?.completedInteractions.has(interaction.id)) {
      return { available: false, reason: '已完成' };
    }

    // 检查对话条件
    if (interaction.condition) {
      const conditionMet = this._checkCondition(interaction.condition);
      if (!conditionMet) {
        return { available: false, reason: '条件不满足' };
      }
    }

    return { available: true };
  }

  /**
   * 执行交互
   */
  public executeInteraction(zoneId: string, interactionId: string): boolean {
    const zone = this._zones.get(zoneId);
    if (!zone) return false;

    const interaction = zone.interactions.find(i => i.id === interactionId);
    if (!interaction) return false;

    // 检查条件
    const check = this.checkInteractionCondition(interaction);
    if (!check.available) {
      logger.warn(`交互不可用: ${interactionId}, 原因: ${check.reason}`);
      return false;
    }

    // 执行触发器
    this._executeTrigger(interaction.trigger);

    // 标记完成
    const state = this._runtimeStates.get(zoneId);
    if (state) {
      state.completedInteractions.add(interactionId);
    }

    // 发送事件
    eventBus.emit(GameEvent.INTERACTION_COMMIT, {
      interactionId,
      zoneId,
      objectId: interaction.id,
      actionType: interaction.type,
      changed: true,
    });

    logger.info(`执行交互: ${interactionId}`);
    return true;
  }

  /**
   * 执行触发器
   */
  private _executeTrigger(trigger: IZoneInteraction['trigger']): void {
    // 触发对话
    if (trigger.dialogue) {
      eventBus.emit(GameEvent.DIALOGUE_START, { dialogueId: trigger.dialogue });
    }

    // 发放卡片
    if (trigger.card) {
      narrativeEngine.obtainCard(trigger.card);
      eventBus.emit(GameEvent.ITEM_COLLECT, { cardId: trigger.card });
    }

    // 触发伏笔
    if (trigger.foreshadow) {
      const [foreshadowId, stage] = trigger.foreshadow;
      narrativeEngine.triggerForeshadow(foreshadowId, stage);
    }

    // 触发自定义事件
    if (trigger.event) {
      eventBus.emit(trigger.event as GameEvent, {});
    }
  }

  // ==================== 出口系统 ====================

  /**
   * 获取Zone的所有出口
   */
  public getExits(zoneId: string): IZoneExit[] {
    const zone = this._zones.get(zoneId);
    return zone?.exits || [];
  }

  /**
   * 获取可用出口（满足条件）
   */
  public getAvailableExits(zoneId: string): IZoneExit[] {
    const zone = this._zones.get(zoneId);
    if (!zone) return [];

    return zone.exits.filter(exit => this._checkExitCondition(exit));
  }

  /**
   * 更新可用出口列表
   */
  private _updateAvailableExits(zoneId: string): void {
    const state = this._runtimeStates.get(zoneId);
    if (!state) return;

    const availableExits = this.getAvailableExits(zoneId);
    state.availableExits = availableExits.map(e => e.to);
  }

  /**
   * 检查出口条件
   */
  private _checkExitCondition(exit: IZoneExit): boolean {
    if (!exit.condition) return true;

    // 特殊条件：dialogue_complete
    if (exit.condition === 'dialogue_complete') {
      const state = this._runtimeStates.get(this._currentZoneId || '');
      return state?.entryDialoguePlayed || false;
    }

    // 标准对话条件
    return this._checkCondition(exit.condition as IDialogueCondition);
  }

  /**
   * 使用出口（前往另一个Zone）
   */
  public useExit(zoneId: string, targetZoneId: string): boolean {
    const zone = this._zones.get(zoneId);
    if (!zone) return false;

    const exit = zone.exits.find(e => e.to === targetZoneId);
    if (!exit) {
      logger.warn(`出口不存在: ${zoneId} -> ${targetZoneId}`);
      return false;
    }

    // 检查条件
    if (!this._checkExitCondition(exit)) {
      logger.warn(`出口条件不满足: ${zoneId} -> ${targetZoneId}`);
      return false;
    }

    // 消耗P值
    const currentZone = this._zones.get(zoneId);
    if (currentZone?.pCost && currentZone.pCost > 0) {
      worldState.addP(currentZone.pCost);
    }

    // 发送Zone转换事件
    eventBus.emit(GameEvent.ZONE_TRANSITION, { targetZone: targetZoneId });
    return true;
  }

  // ==================== R值机会系统 ====================

  /**
   * 获取Zone的R值机会
   */
  public getROpportunities(zoneId: string): IROpportunity[] {
    const zone = this._zones.get(zoneId);
    return zone?.rOpportunities || [];
  }

  /**
   * 获取未完成的R值机会
   */
  public getAvailableROpportunities(zoneId: string): IROpportunity[] {
    const zone = this._zones.get(zoneId);
    if (!zone) return [];

    const state = this._runtimeStates.get(zoneId);
    if (!state) return zone.rOpportunities || [];

    return (zone.rOpportunities || []).filter(
      opp => !state.completedROpportunities.has(opp.id)
    );
  }

  /**
   * 完成R值机会
   */
  public completeROpportunity(zoneId: string, opportunityId: string): boolean {
    const zone = this._zones.get(zoneId);
    if (!zone) return false;

    const opportunity = zone.rOpportunities?.find(o => o.id === opportunityId);
    if (!opportunity) return false;

    const state = this._runtimeStates.get(zoneId);
    if (state?.completedROpportunities.has(opportunityId)) {
      logger.warn(`R值机会已完成: ${opportunityId}`);
      return false;
    }

    // 增加R值
    worldState.addR(opportunity.rValue);

    // 标记完成
    if (state) {
      state.completedROpportunities.add(opportunityId);
    }

    // 发送事件
    eventBus.emit(GameEvent.COUNTER_R_CHANGE, {
      oldValue: worldState.getCounters().R - opportunity.rValue,
      newValue: worldState.getCounters().R,
      delta: opportunity.rValue,
    });

    logger.info(`完成R值机会: ${opportunityId}, R+${opportunity.rValue}`);
    return true;
  }

  /**
   * 获取Zone的总R值潜力
   */
  public getZoneRPotential(zoneId: string): { total: number; remaining: number } {
    const opportunities = this.getROpportunities(zoneId);
    const available = this.getAvailableROpportunities(zoneId);

    const total = opportunities.reduce((sum, o) => sum + o.rValue, 0);
    const remaining = available.reduce((sum, o) => sum + o.rValue, 0);

    return { total, remaining };
  }

  // ==================== 入口对话 ====================

  /**
   * 检查并播放入口对话
   */
  private _checkEntryDialogue(zoneId: string): void {
    const zone = this._zones.get(zoneId);
    const state = this._runtimeStates.get(zoneId);

    if (!zone?.entry?.dialogue || !state) return;

    // 检查是否已播放
    if (state.entryDialoguePlayed) return;

    // 检查入口条件
    if (zone.entry.condition && !this._checkCondition(zone.entry.condition)) {
      return;
    }

    // 播放入口对话
    this._scene.time.delayedCall(500, () => {
      eventBus.emit(GameEvent.DIALOGUE_START, { dialogueId: zone.entry!.dialogue! });
      state.entryDialoguePlayed = true;
    });
  }

  // ==================== 条件检查 ====================

  /**
   * 检查对话条件
   */
  private _checkCondition(condition: IDialogueCondition): boolean {
    const counters = worldState.getCounters();

    // 检查卡片
    if (condition.hasCard && !narrativeEngine.hasCard(condition.hasCard)) {
      return false;
    }

    // 检查R值范围
    if (condition.rMin !== undefined && counters.R < condition.rMin) {
      return false;
    }
    if (condition.rMax !== undefined && counters.R > condition.rMax) {
      return false;
    }

    // 检查P值范围
    if (condition.pMin !== undefined && counters.P < condition.pMin) {
      return false;
    }
    if (condition.pMax !== undefined && counters.P > condition.pMax) {
      return false;
    }

    // 检查能力
    if (condition.abilityUnlocked && !worldState.hasAbility(condition.abilityUnlocked)) {
      return false;
    }

    // 检查Zone访问
    if (condition.zoneVisited) {
      const zoneState = worldState.getZoneState(condition.zoneVisited);
      if (!zoneState || zoneState.visitCount === 0) {
        return false;
      }
    }

    // 检查对话完成
    if (condition.dialogueCompleted) {
      if (!worldState.getFlag(`DIALOGUE_${condition.dialogueCompleted}_COMPLETED`)) {
        return false;
      }
    }

    // 检查Flag
    if (condition.flagTrue && !worldState.getFlag(condition.flagTrue)) {
      return false;
    }

    return true;
  }

  // ==================== 序列化 ====================

  /**
   * 导出运行时状态（用于存档）
   */
  public exportState(): Record<string, IZoneRuntimeState> {
    const result: Record<string, IZoneRuntimeState> = {};
    for (const [zoneId, state] of this._runtimeStates) {
      result[zoneId] = {
        ...state,
        completedInteractions: new Set(state.completedInteractions),
        completedROpportunities: new Set(state.completedROpportunities),
      };
    }
    return result;
  }

  /**
   * 导入运行时状态（从存档恢复）
   */
  public importState(data: Record<string, Partial<IZoneRuntimeState>>): void {
    for (const [zoneId, stateData] of Object.entries(data)) {
      const existingState = this._runtimeStates.get(zoneId);
      if (existingState) {
        if (stateData.completedInteractions) {
          existingState.completedInteractions = new Set(
            Array.isArray(stateData.completedInteractions)
              ? stateData.completedInteractions
              : stateData.completedInteractions
          );
        }
        if (stateData.completedROpportunities) {
          existingState.completedROpportunities = new Set(
            Array.isArray(stateData.completedROpportunities)
              ? stateData.completedROpportunities
              : stateData.completedROpportunities
          );
        }
        if (stateData.entryDialoguePlayed !== undefined) {
          existingState.entryDialoguePlayed = stateData.entryDialoguePlayed;
        }
        if (stateData.visitCount !== undefined) {
          existingState.visitCount = stateData.visitCount;
        }
      }
    }
    logger.info('导入Zone运行时状态');
  }

  // ==================== 销毁 ====================

  /**
   * 销毁Zone管理器
   */
  public destroy(): void {
    eventBus.off(GameEvent.ZONE_ENTER, this._onZoneEnter, this);
    eventBus.off(GameEvent.ZONE_EXIT, this._onZoneExit, this);
    this._zones.clear();
    this._runtimeStates.clear();
    logger.info('ZoneManager 销毁');
  }
}

// 单例导出
let zoneManagerInstance: ZoneManager | null = null;

/**
 * 获取或创建ZoneManager单例
 */
export function getZoneManager(scene?: Phaser.Scene): ZoneManager {
  if (!zoneManagerInstance && scene) {
    zoneManagerInstance = new ZoneManager({ scene });
  }
  if (!zoneManagerInstance) {
    throw new Error('ZoneManager未初始化，需要先提供scene参数');
  }
  return zoneManagerInstance;
}

/**
 * 销毁ZoneManager单例
 */
export function destroyZoneManager(): void {
  if (zoneManagerInstance) {
    zoneManagerInstance.destroy();
    zoneManagerInstance = null;
  }
}
