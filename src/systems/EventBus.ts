/**
 * 事件总线 - 游戏内解耦通信核心
 * @module systems/EventBus
 */
import Phaser from 'phaser';

/**
 * 游戏事件类型枚举
 */
export enum GameEvent {
  // ==================== Zone事件 ====================
  ZONE_ENTER = 'zone:enter',
  ZONE_EXIT = 'zone:exit',
  ZONE_COMPLETE = 'zone:complete',
  ZONE_UNLOCK = 'zone:unlock',

  // ==================== 对话事件 ====================
  DIALOGUE_START = 'dialogue:start',
  DIALOGUE_ADVANCE = 'dialogue:advance',
  DIALOGUE_CHOICE = 'dialogue:choice',
  DIALOGUE_END = 'dialogue:end',

  // ==================== 卡片事件 ====================
  CARD_OBTAIN = 'card:obtain',
  CARD_VIEW = 'card:view',
  CARD_CLOSE = 'card:close',

  // ==================== 能力事件 ====================
  ABILITY_UNLOCK = 'ability:unlock',
  ABILITY_ACTIVATE = 'ability:activate',
  ABILITY_DEACTIVATE = 'ability:deactivate',
  ABILITY_USE = 'ability:use',

  // ==================== 伏笔事件 ====================
  FORESHADOW_PLANT = 'foreshadow:plant',
  FORESHADOW_DEEPEN = 'foreshadow:deepen',
  FORESHADOW_COLLECT = 'foreshadow:collect',

  // ==================== 世界状态事件 ====================
  COUNTER_R_CHANGE = 'counter:r:change',
  COUNTER_P_CHANGE = 'counter:p:change',
  COUNTER_W_CHANGE = 'counter:w:change',
  SCAR_CREATE = 'scar:create',
  CONTAMINATION_CREATE = 'contamination:create',
  FLAG_SET = 'flag:set',

  // ==================== 存档事件 ====================
  SAVE_START = 'save:start',
  SAVE_COMPLETE = 'save:complete',
  SAVE_ERROR = 'save:error',
  LOAD_START = 'load:start',
  LOAD_COMPLETE = 'load:complete',
  LOAD_ERROR = 'load:error',
  SAVE_DELETE = 'save:delete',
  AUTOSAVE_TRIGGER = 'autosave:trigger',
  
  // ==================== 云存档事件 ====================
  CLOUD_SAVE_UPLOAD = 'cloud:save:upload',
  CLOUD_SAVE_DOWNLOAD = 'cloud:save:download',
  CLOUD_SAVE_CONFLICT = 'cloud:save:conflict',
  CLOUD_SYNC_START = 'cloud:sync:start',
  CLOUD_SYNC_COMPLETE = 'cloud:sync:complete',

  // ==================== UI事件 ====================
  UI_TOAST = 'ui:toast',
  UI_PANEL_OPEN = 'ui:panel:open',
  UI_PANEL_CLOSE = 'ui:panel:close',
  UI_MODAL_OPEN = 'ui:modal:open',
  UI_MODAL_CLOSE = 'ui:modal:close',

  // ==================== 输入事件 ====================
  INPUT_LOCK = 'input:lock',
  INPUT_UNLOCK = 'input:unlock',
  INTERACT_START = 'interact:start',
  INTERACT_END = 'interact:end',

  // ==================== 音频事件 ====================
  BGM_PLAY = 'bgm:play',
  BGM_STOP = 'bgm:stop',
  BGM_CROSSFADE = 'bgm:crossfade',
  SFX_PLAY = 'sfx:play',
  AMBIENCE_PLAY = 'ambience:play',
  AMBIENCE_STOP = 'ambience:stop',

  // ==================== 游戏流程事件 ====================
  GAME_START = 'game:start',
  GAME_PAUSE = 'game:pause',
  GAME_RESUME = 'game:resume',
  CHAPTER_START = 'chapter:start',
  CHAPTER_COMPLETE = 'chapter:complete',
  ENDING_REACH = 'ending:reach',

  // ==================== 系统事件 ====================
  SYSTEM_CORRECT = 'system:correct',
  SYSTEM_PAUSE = 'system:pause',
  MODEL_REWRITE = 'model:rewrite',
  SETTINGS_UPDATE = 'settings:update',

  // ==================== 新增事件 ====================
  /** Zone过渡 */
  ZONE_TRANSITION = 'zone:transition',
  /** FLAG变化 */
  FLAG_CHANGED = 'flag:changed',
  /** 能力激活 */
  ABILITY_ACTIVATED = 'ability:activated',
  /** 能力停用 */
  ABILITY_DEACTIVATED = 'ability:deactivated',
  /** 播放音效 */
  PLAY_SFX = 'play:sfx',
  /** 伏笔触发 */
  FORESHADOW_TRIGGERED = 'foreshadow:triggered',
  /** 结局触发 */
  ENDING_TRIGGERED = 'ending:triggered',
}

/**
 * 事件数据类型定义
 */
export interface IEventPayloads {
  [GameEvent.ZONE_ENTER]: { zoneId: string; isFirstVisit: boolean; isRevisit: boolean };
  [GameEvent.ZONE_EXIT]: { zoneId: string; nextZoneId: string };
  [GameEvent.ZONE_COMPLETE]: { zoneId: string };
  [GameEvent.ZONE_UNLOCK]: { zoneId: string };

  [GameEvent.DIALOGUE_START]: { dialogueId: string };
  [GameEvent.DIALOGUE_ADVANCE]: { lineIndex: number };
  [GameEvent.DIALOGUE_CHOICE]: { choiceId: string; choiceIndex: number };
  [GameEvent.DIALOGUE_END]: { dialogueId: string };

  [GameEvent.CARD_OBTAIN]: { cardId: string; card: ICardBasic };
  [GameEvent.CARD_VIEW]: { cardId: string };
  [GameEvent.CARD_CLOSE]: { cardId: string };

  [GameEvent.ABILITY_UNLOCK]: { abilityType: string };
  [GameEvent.ABILITY_ACTIVATE]: { abilityType: string };
  [GameEvent.ABILITY_DEACTIVATE]: { abilityType: string };
  [GameEvent.ABILITY_USE]: { abilityType: string; targetId?: string };

  [GameEvent.FORESHADOW_PLANT]: { foreshadowId: string; zoneId: string };
  [GameEvent.FORESHADOW_DEEPEN]: { foreshadowId: string; zoneId: string };
  [GameEvent.FORESHADOW_COLLECT]: { foreshadowId: string; zoneId: string };

  [GameEvent.COUNTER_R_CHANGE]: { oldValue: number; newValue: number; delta: number };
  [GameEvent.COUNTER_P_CHANGE]: { oldValue: number; newValue: number; delta: number };
  [GameEvent.COUNTER_W_CHANGE]: { oldValue: number; newValue: number };
  [GameEvent.SCAR_CREATE]: { scarId: string; zoneId: string; objectId: string };
  [GameEvent.CONTAMINATION_CREATE]: { contaminationId: string; sourceZoneId: string; affectedZones: string[] };
  [GameEvent.FLAG_SET]: { flagName: string; value: boolean };

  [GameEvent.SAVE_START]: { slot: number };
  [GameEvent.SAVE_COMPLETE]: { slot: number; saveData: unknown };
  [GameEvent.SAVE_ERROR]: { slot: number; error: unknown };
  [GameEvent.LOAD_START]: { slot: number };
  [GameEvent.LOAD_COMPLETE]: { slot: number };
  [GameEvent.LOAD_ERROR]: { slot: number; error: unknown };
  [GameEvent.SAVE_DELETE]: { slot: number };
  [GameEvent.AUTOSAVE_TRIGGER]: { reason: string };

  // 云存档事件
  [GameEvent.CLOUD_SAVE_UPLOAD]: { slot: number; success: boolean };
  [GameEvent.CLOUD_SAVE_DOWNLOAD]: { slot: number; success: boolean };
  [GameEvent.CLOUD_SAVE_CONFLICT]: { slot: number; localData: unknown; cloudData: unknown };
  [GameEvent.CLOUD_SYNC_START]: Record<string, never>;
  [GameEvent.CLOUD_SYNC_COMPLETE]: { uploaded: number; downloaded: number; conflicts: number };

  [GameEvent.UI_TOAST]: { message: string; type?: 'info' | 'success' | 'warning' | 'error'; duration?: number };
  [GameEvent.UI_PANEL_OPEN]: { panelType: string };
  [GameEvent.UI_PANEL_CLOSE]: { panelType: string };
  [GameEvent.UI_MODAL_OPEN]: { modalId: string; data?: unknown };
  [GameEvent.UI_MODAL_CLOSE]: { modalId: string };

  [GameEvent.INPUT_LOCK]: Record<string, never>;
  [GameEvent.INPUT_UNLOCK]: Record<string, never>;
  [GameEvent.INTERACT_START]: { objectId: string; actionType: string };
  [GameEvent.INTERACT_END]: { objectId: string };

  [GameEvent.BGM_PLAY]: { key: string; crossfade?: boolean; fadeDuration?: number };
  [GameEvent.BGM_STOP]: { fadeDuration?: number };
  [GameEvent.BGM_CROSSFADE]: { fromKey: string; toKey: string; duration: number };
  [GameEvent.SFX_PLAY]: { key: string; volume?: number };
  [GameEvent.AMBIENCE_PLAY]: { key: string };
  [GameEvent.AMBIENCE_STOP]: { fadeDuration?: number };

  [GameEvent.GAME_START]: { isNewGame: boolean };
  [GameEvent.GAME_PAUSE]: Record<string, never>;
  [GameEvent.GAME_RESUME]: Record<string, never>;
  [GameEvent.CHAPTER_START]: { chapterId: string };
  [GameEvent.CHAPTER_COMPLETE]: { chapterId: string };
  [GameEvent.ENDING_REACH]: { endingType: string };

  [GameEvent.SYSTEM_CORRECT]: { targetId: string; originalValue: string; correctedValue: string };
  [GameEvent.SYSTEM_PAUSE]: { rValue: number };
  [GameEvent.MODEL_REWRITE]: { rValue: number };
  [GameEvent.SETTINGS_UPDATE]: { settings: Record<string, unknown> };

  // 新增事件payload
  [GameEvent.ZONE_TRANSITION]: { targetZone: string };
  [GameEvent.FLAG_CHANGED]: { flag: string; value: boolean };
  [GameEvent.ABILITY_ACTIVATED]: { ability: string };
  [GameEvent.ABILITY_DEACTIVATED]: { ability: string };
  [GameEvent.PLAY_SFX]: { key: string };
  [GameEvent.FORESHADOW_TRIGGERED]: { foreshadowId: string; stage: string };
  [GameEvent.ENDING_TRIGGERED]: { ending: string };
}

// 简化的卡片类型（避免循环依赖）
interface ICardBasic {
  id: string;
  title: string;
  category: string;
}

/**
 * 类型安全的事件发射器
 */
class TypedEventEmitter extends Phaser.Events.EventEmitter {
  /**
   * 类型安全的emit
   */
  emitTyped<K extends GameEvent>(event: K, payload: IEventPayloads[K]): boolean {
    return this.emit(event, payload);
  }

  /**
   * 类型安全的on
   */
  onTyped<K extends GameEvent>(
    event: K,
    fn: (payload: IEventPayloads[K]) => void,
    context?: unknown
  ): this {
    return this.on(event, fn, context);
  }

  /**
   * 类型安全的once
   */
  onceTyped<K extends GameEvent>(
    event: K,
    fn: (payload: IEventPayloads[K]) => void,
    context?: unknown
  ): this {
    return this.once(event, fn, context);
  }

  /**
   * 类型安全的off
   */
  offTyped<K extends GameEvent>(
    event: K,
    fn?: (payload: IEventPayloads[K]) => void,
    context?: unknown
  ): this {
    return this.off(event, fn, context);
  }
}

/**
 * 全局事件总线单例
 */
class EventBus extends TypedEventEmitter {
  private static _instance: EventBus | null = null;
  private _debugMode: boolean = false;
  private _eventHistory: Array<{ event: string; payload: unknown; timestamp: number }> = [];
  private _maxHistorySize: number = 100;

  private constructor() {
    super();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): EventBus {
    if (!EventBus._instance) {
      EventBus._instance = new EventBus();
    }
    return EventBus._instance;
  }

  /**
   * 启用调试模式
   */
  enableDebug(): void {
    this._debugMode = true;
    console.log('[EventBus] Debug mode enabled');
  }

  /**
   * 禁用调试模式
   */
  disableDebug(): void {
    this._debugMode = false;
    console.log('[EventBus] Debug mode disabled');
  }

  /**
   * 重写emit以支持调试和历史记录
   */
  override emit(event: string | symbol, ...args: unknown[]): boolean {
    const eventName = String(event);
    const payload = args[0];

    // 记录历史
    this._eventHistory.push({
      event: eventName,
      payload,
      timestamp: Date.now(),
    });

    // 限制历史大小
    if (this._eventHistory.length > this._maxHistorySize) {
      this._eventHistory.shift();
    }

    // 调试输出
    if (this._debugMode) {
      console.log(`[EventBus] ${eventName}`, payload);
    }

    return super.emit(event, ...args);
  }

  /**
   * 获取事件历史
   */
  getEventHistory(): ReadonlyArray<{ event: string; payload: unknown; timestamp: number }> {
    return [...this._eventHistory];
  }

  /**
   * 清空事件历史
   */
  clearEventHistory(): void {
    this._eventHistory = [];
  }

  /**
   * 重置事件总线
   */
  reset(): void {
    this.removeAllListeners();
    this._eventHistory = [];
    this._debugMode = false;
  }
}

// 导出单例
export const eventBus = EventBus.getInstance();

