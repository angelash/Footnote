/**
 * 世界状态管理系统
 * 管理R/P/W计数器、能力、标记、伤痕、污染等核心状态
 * @module systems/world/WorldState
 */

import { createLogger } from '@/utils/Logger';
import { eventBus, GameEvent } from '@/systems/EventBus';

const logger = createLogger('WorldState');
import { CONSTANTS } from '@/config/game.config';
import type { AbilityType, ChapterID } from '@/config/game.config';

// ==================== 类型定义 ====================

/**
 * 计数器状态
 */
export interface ICounters {
  /** R - 无收益残差 (0-100) */
  R: number;
  /** P - 观察者压力 (0-100) */
  P: number;
  /** W - 世界可读性 (计算值, 0-100) */
  W: number;
}

/**
 * Zone状态
 */
export interface IZoneState {
  unlocked: boolean;
  completed: boolean;
  visitCount: number;
  firstVisitTime?: number;
  completedTime?: number;
  collectedItems: Set<string>;
  triggeredEvents: Set<string>;
}

/**
 * 伤痕数据
 */
export interface IScar {
  id: string;
  zoneId: string;
  objectId: string;
  type: 'visual_glitch' | 'structural_crack' | 'data_corruption' | 'minor';
  timestamp: number;
  description?: string;
}

/**
 * 污染数据
 */
export interface IContamination {
  id: string;
  sourceZoneId: string;
  affectedZoneIds: string[];
  type: 'timeline_fracture' | 'causality_leak' | 'version_conflict';
  severity: number;
  timestamp: number;
}

/**
 * 动作记录
 */
export interface IActionRecord {
  type: string;
  reward: number;
  timestamp?: number;
  zoneId?: string;
}

/**
 * 条件配置
 */
export interface IConditionConfig {
  hasCard?: string;
  hasAbility?: AbilityType;
  flagTrue?: string;
  flagFalse?: string;
  rMin?: number;
  rMax?: number;
  pMin?: number;
  pMax?: number;
  wMin?: number;
  wMax?: number;
  zoneVisited?: string;
  zoneCompleted?: string;
}

/**
 * 交互完成记录
 */
export interface IInteractionRecord {
  /** 交互ID */
  id: string;
  /** 完成时间 */
  timestamp: number;
  /** 所在Zone */
  zoneId?: string;
  /** 额外元数据 */
  meta?: Record<string, unknown>;
}

/**
 * 世界状态序列化数据
 */
export interface IWorldStateData {
  counters: { R: number; P: number; baseW: number };
  abilities: AbilityType[];
  flags: Record<string, boolean>;
  zoneStates: Record<string, IZoneStateData>;
  scars: IScar[];
  contaminations: IContamination[];
  currentZoneId: string;
  currentChapter: ChapterID;
  /** 已完成的交互记录 */
  completedInteractions?: IInteractionRecord[];
}

interface IZoneStateData {
  unlocked: boolean;
  completed: boolean;
  visitCount: number;
  firstVisitTime?: number;
  completedTime?: number;
  collectedItems: string[];
  triggeredEvents: string[];
}

// ==================== 配置常量 ====================

const CONFIG = {
  /** P值上限 - 根据设计文档要求 */
  P_MAX: 20,
  /** R值上限 - 根据设计文档要求 */
  R_MAX: 15,
  /** W基础值 */
  W_BASE: 100,
  /** R值对W的影响系数 */
  W_R_COEFFICIENT: 3,
  /** P值对W的影响系数 */
  W_P_COEFFICIENT: 2,
  /** 每个伤痕对W的影响 (anomalyModifier) */
  W_SCAR_PENALTY: 2,
  /** 每个污染对W的影响 (anomalyModifier) */
  W_CONTAMINATION_PENALTY: 5,
  /** 能力P值消耗 */
  ABILITY_P_COST: {
    DEPTH_PERCEPTION: 1,
    DEPTH_INTERVENTION: 3,
    TIME_INTERVENTION: 5,
  } as Record<AbilityType, number>,
};

// ==================== WorldState类 ====================

/**
 * 世界状态管理器
 */
class WorldState {
  private static _instance: WorldState | null = null;

  // 核心状态
  private _R: number = 0;
  private _P: number = 0;
  private _baseW: number = CONFIG.W_BASE;
  private _abilities: Set<AbilityType> = new Set();
  private _flags: Map<string, boolean> = new Map();
  private _zoneStates: Map<string, IZoneState> = new Map();
  private _scars: IScar[] = [];
  private _contaminations: IContamination[] = [];
  private _currentZoneId: string = '';
  private _currentChapter: ChapterID = 'C0';
  private _playTime: number = 0;

  /** 已完成的交互记录（用于一次性交互追踪） */
  private _completedInteractions: Map<string, IInteractionRecord> = new Map();

  // 计数器
  private _scarIdCounter: number = 0;
  private _contaminationIdCounter: number = 0;
  private _cardChecker?: (cardId: string) => boolean;

  // R值阈值触发标记（确保每个阈值只触发一次）
  private _rThreshold3Triggered: boolean = false;
  private _rThreshold6Triggered: boolean = false;
  private _rThreshold10Triggered: boolean = false;

  private constructor() {
    this._initializeDefaultZones();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): WorldState {
    if (!WorldState._instance) {
      WorldState._instance = new WorldState();
    }
    return WorldState._instance;
  }

  /**
   * 注册卡片检查器
   */
  registerCardChecker(checker: (cardId: string) => boolean): void {
    this._cardChecker = checker;
  }

  // ==================== 计数器操作 ====================

  /**
   * 获取当前计数器值
   */
  getCounters(): ICounters {
    return {
      R: this._R,
      P: this._P,
      W: this._calculateW(),
    };
  }

  /**
   * 增加R值（无收益行为）
   */
  addR(delta: number): void {
    const oldValue = this._R;
    this._R = Math.min(CONFIG.R_MAX, Math.max(0, this._R + delta));

    if (this._R !== oldValue) {
      eventBus.emit(GameEvent.COUNTER_R_CHANGE, {
        oldValue,
        newValue: this._R,
        delta: this._R - oldValue,
      });

      // 检查R值阈值
      this._checkRThresholds();
    }
  }

  /**
   * 增加P值（观察者压力）
   */
  addP(delta: number): void {
    const oldValue = this._P;
    this._P = Math.min(CONFIG.P_MAX, Math.max(0, this._P + delta));

    if (this._P !== oldValue) {
      eventBus.emit(GameEvent.COUNTER_P_CHANGE, {
        oldValue,
        newValue: this._P,
        delta: this._P - oldValue,
      });
    }
  }

  /**
   * P值衰减（已废弃 - 设计文档要求P不应衰减）
   * @deprecated P值不再自动衰减，此方法保留以兼容旧调用但不执行任何操作
   */
  decayP(_deltaMs: number): void {
    // 根据设计文档要求，P值不应自动衰减
    // 此方法保留以兼容可能的旧代码调用，但不执行任何操作
  }

  /**
   * 记录动作（用于R值计算）
   */
  recordAction(action: IActionRecord): void {
    if (action.reward === 0) {
      this.addR(1);
    }
  }

  /**
   * 计算W值
   * 公式: W = max(0, 100 - (R × 3) - (P × 2) - anomalyModifier)
   * anomalyModifier = scars.length × 2 + contaminations.length × 5
   */
  private _calculateW(): number {
    const rPenalty = this._R * CONFIG.W_R_COEFFICIENT;
    const pPenalty = this._P * CONFIG.W_P_COEFFICIENT;
    const anomalyModifier =
      this._scars.length * CONFIG.W_SCAR_PENALTY +
      this._contaminations.length * CONFIG.W_CONTAMINATION_PENALTY;
    return Math.max(0, CONFIG.W_BASE - rPenalty - pPenalty - anomalyModifier);
  }

  /**
   * 检查R值阈值并发出事件
   * 每个阈值只触发一次
   * - R ≥ 3: r_threshold_3（语气停顿效果）
   * - R ≥ 6: r_threshold_6（首次判定句）
   * - R ≥ 10: r_threshold_10（结局C路径开启）
   */
  private _checkRThresholds(): void {
    const { SYSTEM_PAUSE, F21_WEAK, MODEL_REWRITE } = CONSTANTS.R_THRESHOLD;

    // R ≥ 10: 结局C路径开启
    if (this._R >= MODEL_REWRITE && !this._rThreshold10Triggered) {
      this._rThreshold10Triggered = true;
      eventBus.emit(GameEvent.R_THRESHOLD_10, { rValue: this._R });
      eventBus.emit(GameEvent.MODEL_REWRITE, { rValue: this._R });
      logger.info(`R值阈值10触发: R=${this._R}, 结局C路径开启`);
    }

    // R ≥ 6: 首次判定句
    if (this._R >= F21_WEAK && !this._rThreshold6Triggered) {
      this._rThreshold6Triggered = true;
      eventBus.emit(GameEvent.R_THRESHOLD_6, { rValue: this._R });
      eventBus.emit(GameEvent.SYSTEM_PAUSE, { rValue: this._R });
      logger.info(`R值阈值6触发: R=${this._R}, 首次判定句`);
    }

    // R ≥ 3: 系统语气停顿
    if (this._R >= SYSTEM_PAUSE && !this._rThreshold3Triggered) {
      this._rThreshold3Triggered = true;
      eventBus.emit(GameEvent.R_THRESHOLD_3, { rValue: this._R });
      logger.info(`R值阈值3触发: R=${this._R}, 系统语气停顿`);
    }
  }

  // ==================== 能力操作 ====================

  /**
   * 解锁能力
   */
  unlockAbility(ability: AbilityType): void {
    if (!this._abilities.has(ability)) {
      this._abilities.add(ability);
      eventBus.emit(GameEvent.ABILITY_UNLOCK, { abilityType: ability });
    }
  }

  /**
   * 检查是否有能力
   */
  hasAbility(ability: AbilityType): boolean {
    return this._abilities.has(ability);
  }

  /**
   * 使用能力（消耗P值）
   */
  useAbility(ability: AbilityType): boolean {
    if (!this.hasAbility(ability)) {
      return false;
    }

    const cost = CONFIG.ABILITY_P_COST[ability] || 0;
    if (this._P + cost > CONFIG.P_MAX * 0.9) {
      // P值过高，无法使用
      return false;
    }

    this.addP(cost);
    eventBus.emit(GameEvent.ABILITY_USE, { abilityType: ability });
    return true;
  }

  /**
   * 获取已解锁能力列表
   */
  getAbilities(): AbilityType[] {
    return Array.from(this._abilities);
  }

  // ==================== 标记操作 ====================

  /**
   * 设置标记
   */
  setFlag(name: string, value: boolean): void {
    this._flags.set(name, value);
    eventBus.emit(GameEvent.FLAG_SET, { flagName: name, value });
  }

  /**
   * 获取标记
   */
  getFlag(name: string): boolean {
    return this._flags.get(name) ?? false;
  }

  /**
   * 获取所有标记
   */
  getFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    this._flags.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // ==================== 交互记录操作 ====================

  /**
   * 检查交互是否已完成
   * @param interactionId 交互唯一标识
   */
  hasInteraction(interactionId: string): boolean {
    return this._completedInteractions.has(interactionId);
  }

  /**
   * 标记交互已完成
   * @param interactionId 交互唯一标识
   * @param meta 可选的额外元数据
   */
  markInteractionDone(interactionId: string, meta?: Record<string, unknown>): void {
    if (this._completedInteractions.has(interactionId)) {
      logger.debug(`交互已存在: ${interactionId}`);
      return;
    }

    const record: IInteractionRecord = {
      id: interactionId,
      timestamp: Date.now(),
      zoneId: this._currentZoneId,
      meta,
    };

    this._completedInteractions.set(interactionId, record);
    logger.info(`交互完成: ${interactionId}`);
  }

  /**
   * 获取所有已完成的交互记录
   */
  getCompletedInteractions(): IInteractionRecord[] {
    return Array.from(this._completedInteractions.values());
  }

  // ==================== Zone状态操作 ====================

  /**
   * 获取Zone状态
   */
  getZoneState(zoneId: string): IZoneState | undefined {
    return this._zoneStates.get(zoneId);
  }

  /**
   * 解锁Zone
   */
  unlockZone(zoneId: string): void {
    let state = this._zoneStates.get(zoneId);
    if (!state) {
      state = this._createDefaultZoneState();
      this._zoneStates.set(zoneId, state);
    }
    if (!state.unlocked) {
      state.unlocked = true;
      eventBus.emit(GameEvent.ZONE_UNLOCK, { zoneId });
    }
  }

  /**
   * 检查Zone是否解锁
   */
  isZoneUnlocked(zoneId: string): boolean {
    const state = this._zoneStates.get(zoneId);
    return state?.unlocked ?? false;
  }

  /**
   * 检查Zone是否已访问
   */
  isZoneVisited(zoneId: string): boolean {
    const state = this._zoneStates.get(zoneId);
    return (state?.visitCount ?? 0) > 0;
  }

  /**
   * 访问Zone
   */
  visitZone(zoneId: string): void {
    let state = this._zoneStates.get(zoneId);
    if (!state) {
      state = this._createDefaultZoneState();
      state.unlocked = true;
      this._zoneStates.set(zoneId, state);
    }

    const isFirstVisit = state.visitCount === 0;
    state.visitCount++;

    if (isFirstVisit) {
      state.firstVisitTime = Date.now();
    }

    this._currentZoneId = zoneId;

    eventBus.emit(GameEvent.ZONE_ENTER, {
      zoneId,
      isFirstVisit,
      isRevisit: state.visitCount > 1,
    });
  }

  /**
   * 完成Zone
   */
  completeZone(zoneId: string): void {
    const state = this._zoneStates.get(zoneId);
    if (state && !state.completed) {
      state.completed = true;
      state.completedTime = Date.now();
      eventBus.emit(GameEvent.ZONE_COMPLETE, { zoneId });
    }
  }

  /**
   * 获取当前Zone
   */
  getCurrentZone(): string {
    return this._currentZoneId;
  }

  /**
   * 设置当前Zone
   */
  setCurrentZone(zoneId: string): void {
    this._currentZoneId = zoneId;
  }

  // ==================== 游戏时间 ====================

  /**
   * 获取游戏总时长（秒）
   */
  getPlayTime(): number {
    return this._playTime;
  }

  /**
   * 更新游戏时长
   */
  updatePlayTime(deltaSeconds: number): void {
    this._playTime += deltaSeconds;
  }

  // ==================== 伤痕操作 ====================

  /**
   * 添加伤痕
   */
  addScar(data: Omit<IScar, 'id' | 'timestamp'>): IScar {
    const scar: IScar = {
      ...data,
      id: `scar_${++this._scarIdCounter}`,
      timestamp: Date.now(),
    };

    this._scars.push(scar);

    eventBus.emit(GameEvent.SCAR_CREATE, {
      scarId: scar.id,
      zoneId: scar.zoneId,
      objectId: scar.objectId,
    });

    // W值变化
    const oldW = this._calculateW() + CONFIG.W_SCAR_PENALTY;
    const newW = this._calculateW();
    eventBus.emit(GameEvent.COUNTER_W_CHANGE, { oldValue: oldW, newValue: newW });

    return scar;
  }

  /**
   * 获取所有伤痕
   */
  getScars(): IScar[] {
    return [...this._scars];
  }

  /**
   * 获取Zone的伤痕
   */
  getScarsByZone(zoneId: string): IScar[] {
    return this._scars.filter((s) => s.zoneId === zoneId);
  }

  // ==================== 污染操作 ====================

  /**
   * 添加污染
   */
  addContamination(data: Omit<IContamination, 'id' | 'timestamp' | 'severity'>): IContamination {
    const contamination: IContamination = {
      ...data,
      id: `contamination_${++this._contaminationIdCounter}`,
      severity: 1,
      timestamp: Date.now(),
    };

    this._contaminations.push(contamination);

    eventBus.emit(GameEvent.CONTAMINATION_CREATE, {
      contaminationId: contamination.id,
      sourceZoneId: contamination.sourceZoneId,
      affectedZones: contamination.affectedZoneIds,
    });

    // W值变化
    const oldW = this._calculateW() + CONFIG.W_CONTAMINATION_PENALTY;
    const newW = this._calculateW();
    eventBus.emit(GameEvent.COUNTER_W_CHANGE, { oldValue: oldW, newValue: newW });

    return contamination;
  }

  /**
   * 获取所有污染
   */
  getContaminations(): IContamination[] {
    return [...this._contaminations];
  }

  /**
   * 检查Zone是否被污染
   */
  isZoneContaminated(zoneId: string): boolean {
    return this._contaminations.some(
      (c) => c.sourceZoneId === zoneId || c.affectedZoneIds.includes(zoneId)
    );
  }

  // ==================== 条件检查 ====================

  /**
   * 检查条件
   */
  checkCondition(condition: IConditionConfig): boolean {
    const counters = this.getCounters();

    // 卡片检查
    if (condition.hasCard) {
      if (this._cardChecker) {
        if (!this._cardChecker(condition.hasCard)) return false;
      } else {
        logger.warn('Card checker not registered');
        // 如果没有检查器，默认返回false以策安全
        return false;
      }
    }

    // 能力检查
    if (condition.hasAbility && !this.hasAbility(condition.hasAbility)) {
      return false;
    }

    // 标记检查
    if (condition.flagTrue && !this.getFlag(condition.flagTrue)) {
      return false;
    }
    if (condition.flagFalse && this.getFlag(condition.flagFalse)) {
      return false;
    }

    // 计数器检查
    if (condition.rMin !== undefined && counters.R < condition.rMin) return false;
    if (condition.rMax !== undefined && counters.R > condition.rMax) return false;
    if (condition.pMin !== undefined && counters.P < condition.pMin) return false;
    if (condition.pMax !== undefined && counters.P > condition.pMax) return false;
    if (condition.wMin !== undefined && counters.W < condition.wMin) return false;
    if (condition.wMax !== undefined && counters.W > condition.wMax) return false;

    // Zone检查
    if (condition.zoneVisited && !this.isZoneVisited(condition.zoneVisited)) {
      return false;
    }
    if (condition.zoneCompleted) {
      const state = this.getZoneState(condition.zoneCompleted);
      if (!state?.completed) return false;
    }

    return true;
  }

  // ==================== 序列化 ====================

  /**
   * 序列化状态
   */
  serialize(): IWorldStateData {
    const zoneStates: Record<string, IZoneStateData> = {};
    this._zoneStates.forEach((state, id) => {
      zoneStates[id] = {
        unlocked: state.unlocked,
        completed: state.completed,
        visitCount: state.visitCount,
        firstVisitTime: state.firstVisitTime,
        completedTime: state.completedTime,
        collectedItems: Array.from(state.collectedItems),
        triggeredEvents: Array.from(state.triggeredEvents),
      };
    });

    return {
      counters: { R: this._R, P: this._P, baseW: this._baseW },
      abilities: Array.from(this._abilities),
      flags: this.getFlags(),
      zoneStates,
      scars: [...this._scars],
      contaminations: [...this._contaminations],
      currentZoneId: this._currentZoneId,
      currentChapter: this._currentChapter,
      completedInteractions: this.getCompletedInteractions(),
    };
  }

  /**
   * 从序列化数据恢复
   */
  restore(data: Partial<IWorldStateData>): void {
    if (data.counters) {
      this._R = data.counters.R ?? 0;
      this._P = data.counters.P ?? 0;
      this._baseW = data.counters.baseW ?? CONFIG.W_BASE;

      // 根据恢复的R值设置阈值触发状态
      const { SYSTEM_PAUSE, F21_WEAK, MODEL_REWRITE } = CONSTANTS.R_THRESHOLD;
      this._rThreshold3Triggered = this._R >= SYSTEM_PAUSE;
      this._rThreshold6Triggered = this._R >= F21_WEAK;
      this._rThreshold10Triggered = this._R >= MODEL_REWRITE;
    }

    if (data.abilities) {
      this._abilities = new Set(data.abilities);
    }

    if (data.flags) {
      this._flags = new Map(Object.entries(data.flags));
    }

    if (data.zoneStates) {
      this._zoneStates.clear();
      Object.entries(data.zoneStates).forEach(([id, state]) => {
        this._zoneStates.set(id, {
          unlocked: state.unlocked,
          completed: state.completed,
          visitCount: state.visitCount,
          firstVisitTime: state.firstVisitTime,
          completedTime: state.completedTime,
          collectedItems: new Set(state.collectedItems),
          triggeredEvents: new Set(state.triggeredEvents),
        });
      });
    }

    if (data.scars) {
      this._scars = [...data.scars];
    }

    if (data.contaminations) {
      this._contaminations = [...data.contaminations];
    }

    if (data.currentZoneId) {
      this._currentZoneId = data.currentZoneId;
    }

    if (data.currentChapter) {
      this._currentChapter = data.currentChapter;
    }

    // 恢复交互记录
    if (data.completedInteractions) {
      this._completedInteractions.clear();
      for (const record of data.completedInteractions) {
        this._completedInteractions.set(record.id, record);
      }
    }
  }

  /**
   * 重置状态
   */
  reset(): void {
    this._R = 0;
    this._P = 0;
    this._baseW = CONFIG.W_BASE;
    this._abilities.clear();
    this._flags.clear();
    this._zoneStates.clear();
    this._scars = [];
    this._contaminations = [];
    this._currentZoneId = '';
    this._currentChapter = 'C0';
    this._scarIdCounter = 0;
    this._contaminationIdCounter = 0;

    // 重置R值阈值触发标记
    this._rThreshold3Triggered = false;
    this._rThreshold6Triggered = false;
    this._rThreshold10Triggered = false;

    // 重置交互记录
    this._completedInteractions.clear();

    this._initializeDefaultZones();
  }

  /**
   * 获取完整状态
   */
  getState(): IWorldStateData {
    return this.serialize();
  }

  // ==================== 私有方法 ====================

  private _initializeDefaultZones(): void {
    // 序章Zone默认解锁
    const defaultUnlockedZones = ['C0-Z1', 'C0-Z2', 'C0-Z3', 'C0-Z4'];
    defaultUnlockedZones.forEach((zoneId) => {
      this._zoneStates.set(zoneId, {
        ...this._createDefaultZoneState(),
        unlocked: true,
      });
    });
  }

  private _createDefaultZoneState(): IZoneState {
    return {
      unlocked: false,
      completed: false,
      visitCount: 0,
      collectedItems: new Set(),
      triggeredEvents: new Set(),
    };
  }
}

// 导出单例
export const worldState = WorldState.getInstance();
