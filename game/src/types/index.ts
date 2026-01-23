/**
 * 游戏类型定义
 */

import { ChapterID, AbilityType, ZoneType, CardType } from '@/config/game.config';

// ==================== 世界状态 ====================

export interface IWorldState {
  /** 隐藏计数器 */
  counters: ICounters;

  /** 当前章节 */
  chapter: ChapterID;

  /** 能力解锁状态 */
  abilities: IAbilityState;

  /** Zone状态 */
  zones: Record<string, ZoneState>;

  /** 已完成的对话 */
  dialoguesCompleted: Set<string>;

  /** 选择记录 */
  choices: IChoiceRecord[];

  /** 收集的卡片 */
  collectedCards: Set<string>;

  /** 深度伤痕 */
  depthScars: IDepthScar[];

  /** 时间节点 */
  timeNodes: ITimeNode[];

  /** 时间污染度 */
  timeContamination: number;

  /** 游戏时间（秒） */
  playTime: number;
}

export interface ICounters {
  /** R - 无收益残差 */
  r: number;
  /** P - 观察者压力 */
  p: number;
  /** W - 世界可读性 */
  w: number;
}

export interface IAbilityState {
  /** 深度感知 */
  depthPerception: boolean;
  /** 深度介入 */
  depthIntervention: boolean;
  /** 时间干预 */
  timeIntervention: boolean;
}

export type ZoneState = 'locked' | 'unlocked' | 'visited' | 'completed';

export interface IChoiceRecord {
  id: string;
  dialogueId: string;
  choiceIndex: number;
  timestamp: number;
  rValue?: number;
  pValue?: number;
  completed: boolean;
}

export interface IDepthScar {
  zoneId: string;
  position: { x: number; y: number };
  severity: 'light' | 'medium' | 'severe';
  timestamp: number;
}

export interface ITimeNode {
  id: string;
  zoneId: string;
  timestamp: number;
  label: string;
  canRewind: boolean;
}

// ==================== 对话系统 ====================

export interface IDialogue {
  id: string;
  speaker: string;
  text: string;
  /** 角色表情，影响立绘显示 */
  expression?:
    | 'neutral'
    | 'smiling'
    | 'sad'
    | 'angry'
    | 'surprised'
    | 'thinking'
    | 'stressed'
    | 'confused'
    | 'curious'
    | 'dreamy'
    | 'excited'
    | 'scared'
    | 'focused'
    | 'hopeful'
    | 'kind'
    | 'tired'
    | 'displeased'
    | 'stern'
    | 'worried'
    | 'mysterious'
    | 'serene'
    | 'wise'
    | 'comforting'
    | 'concerned'
    | 'determined'
    | 'professional'
    | 'understanding'
    | 'melancholy'
    | 'resigned'
    | 'serious'
    | 'warm';
  next?: string | null;
  choices?: IDialogueChoice[];
  trigger?: IDialogueTrigger;
  condition?: IDialogueCondition;
}

export interface IDialogueChoice {
  label: string;
  next: string;
  effect?: {
    r?: number;
    p?: number;
    setFlag?: { name: string; value: boolean };
    giveCard?: string;
    triggerForeshadow?: { id: string; stage: string };
  };
  condition?: IDialogueCondition;
}

export interface IDialogueTrigger {
  card?: string;
  /** 多张卡片（支持 onComplete 中多张卡片） */
  cards?: string[];
  foreshadow?: [string, ForeshadowStage];
  ability?: AbilityType;
  event?: string;
  /** FLAG 设置动作 */
  flags?: Array<{ name: string; value: boolean }>;
}

export interface IDialogueCondition {
  hasCard?: string;
  rMin?: number;
  rMax?: number;
  pMin?: number;
  pMax?: number;
  abilityUnlocked?: AbilityType;
  zoneVisited?: string;
  dialogueCompleted?: string;
  /** FLAG 为 true 时条件满足 */
  flagTrue?: string;
}

// ==================== 卡片系统 ====================

/**
 * 卡片 Gameplay 效果（游戏机制层面）
 */
export interface ICardGameplayFx {
  /** 触发时机 */
  trigger: 'obtain' | 'use' | 'view';
  /** 效果列表 */
  effects: ICardGameplayEffect[];
}

/**
 * 单个 Gameplay 效果
 */
export interface ICardGameplayEffect {
  /** 效果类型 */
  type: 'counterDelta' | 'setFlag' | 'giveCard' | 'unlockAbility';
  /** 计数器名称（counterDelta 使用） */
  counter?: 'R' | 'P';
  /** 变化量（counterDelta 使用） */
  delta?: number;
  /** Flag 名称（setFlag 使用） */
  flagName?: string;
  /** Flag 值（setFlag 使用） */
  flagValue?: boolean;
  /** 卡片 ID（giveCard 使用） */
  cardId?: string;
  /** 能力类型（unlockAbility 使用） */
  abilityType?: string;
}

export interface ICard {
  id: string;
  name: string;
  type: CardType;
  chapter: ChapterID;
  zone: string;
  front: string[];
  detail: string[];
  fx?: ICardFX[];
  states?: Record<string, ICardStateOverride>;
  currentState?: string;
  /** Gameplay 效果（游戏机制层面） */
  gameplayFx?: ICardGameplayFx[];
  /** 是否可消耗（使用后从背包移除） */
  consumable?: boolean;
}

export interface ICardFX {
  type: 'taint' | 'flash' | 'shake' | 'fade';
  target: string;
  effect?: string;
  duration?: number;
}

export interface ICardStateOverride {
  trigger: string;
  override?: Partial<Pick<ICard, 'front' | 'detail'>>;
  append?: Partial<Pick<ICard, 'front' | 'detail'>>;
}

// ==================== 伏笔系统 ====================

/**
 * 伏笔阶段（统一命名）
 * - plant: 首次投放
 * - deepen: 加深
 * - mislead: 误读（可选）
 * - reveal: 回收/揭示
 *
 * 兼容旧版命名：misread -> mislead, resolve/collect -> reveal
 */
export type ForeshadowStage = 'plant' | 'deepen' | 'mislead' | 'reveal';

/**
 * 兼容旧版阶段命名（用于类型转换）
 */
export type ForeshadowStageLegacy =
  | ForeshadowStage
  | 'misread' // -> mislead
  | 'resolve' // -> reveal
  | 'collect'; // -> reveal

/**
 * 伏笔阶段配置
 */
export interface IForeshadowStageConfig {
  /** 关联的Zone */
  zone?: string;
  /** 触发条件/对话ID */
  dialogueId?: string;
  /** 触发器（兼容旧字段） */
  trigger?: string;
  /** 阶段描述 */
  description?: string;
  /** 条件 */
  condition?: string;
}

/**
 * 伏笔误读阶段配置（可选）
 */
export interface IForeshadowMisleadConfig {
  /** 玩家预期的理解 */
  expected?: string;
  /** 真实情况 */
  truth?: string;
  /** 关联Zone（新格式） */
  zone?: string;
  /** 描述（新格式） */
  description?: string;
}

/**
 * 伏笔数据（统一Schema）
 * 支持YAML、Loader、Engine、UI统一使用
 */
export interface IForeshadow {
  /** 伏笔ID (F01-F26) */
  id: string;
  /** 伏笔名称 */
  name: string;
  /** 伏笔描述 */
  description?: string;
  /** 阶段配置 */
  stages: {
    /** 首次投放 */
    plant: IForeshadowStageConfig;
    /** 加深 */
    deepen: IForeshadowStageConfig;
    /** 误读（可选，支持两种格式） */
    mislead?: IForeshadowStageConfig | IForeshadowMisleadConfig;
    /** 回收/揭示 */
    reveal: IForeshadowStageConfig;
    /** @deprecated 兼容旧版 misread，使用 mislead 代替 */
    misread?: IForeshadowMisleadConfig;
    /** @deprecated 兼容旧版 resolve，使用 reveal 代替 */
    resolve?: IForeshadowStageConfig;
    /** @deprecated 兼容旧版 collect，使用 reveal 代替 */
    collect?: IForeshadowStageConfig;
  };
  /** 关联资源 */
  assets?: string[];
}

/**
 * 伏笔运行时状态
 */
export interface IForeshadowState {
  /** 是否已投放 */
  planted: boolean;
  /** 是否已加深 */
  deepened: boolean;
  /** 是否已误读 */
  misled?: boolean;
  /** 是否已回收 */
  revealed: boolean;
  /** 投放位置 */
  plantedAt?: string;
  /** 加深位置 */
  deepenedAt?: string;
  /** 误读位置 */
  misledAt?: string;
  /** 回收位置 */
  revealedAt?: string;
  /** @deprecated 兼容旧版 resolved，使用 revealed 代替 */
  resolved?: boolean;
  /** @deprecated 兼容旧版 resolvedAt，使用 revealedAt 代替 */
  resolvedAt?: string;
  /** @deprecated 兼容旧版 collected，使用 revealed 代替 */
  collected?: boolean;
  /** @deprecated 兼容旧版 collectedAt，使用 revealedAt 代替 */
  collectedAt?: string;
}

/**
 * 标准化伏笔阶段名称
 * 将旧版命名转换为统一命名
 */
export function normalizeForeshadowStage(stage: ForeshadowStageLegacy): ForeshadowStage {
  switch (stage) {
    case 'plant':
      return 'plant';
    case 'deepen':
      return 'deepen';
    case 'misread':
    case 'mislead':
      return 'mislead';
    case 'resolve':
    case 'collect':
    case 'reveal':
      return 'reveal';
    default:
      return 'plant';
  }
}

// ==================== Zone系统 ====================

export interface IZone {
  id: string;
  name: string;
  chapter: ChapterID;
  type: ZoneType;
  focus: string;
  characters: string[];
  entry?: {
    dialogue?: string;
    condition?: IDialogueCondition;
  };
  interactions: IZoneInteraction[];
  exits: IZoneExit[];
  rOpportunities?: IROpportunity[];
  pCost: number;
  background?: string;
}

export interface IZoneInteraction {
  id: string;
  type: 'examine' | 'talk' | 'use' | 'special';
  position: [number, number];
  label?: string;
  trigger: {
    dialogue?: string;
    card?: string;
    foreshadow?: [string, ForeshadowStage];
    event?: string;
  };
  condition?: IDialogueCondition;
}

export interface IZoneExit {
  to: string;
  position: [number, number];
  condition?: IDialogueCondition | 'dialogue_complete';
  label?: string;
}

export interface IROpportunity {
  id: string;
  description: string;
  rValue: number;
  completed?: boolean;
}

// ==================== 角色系统 ====================

export interface ICharacter {
  id: string;
  name: string;
  title: string;
  description: string;
  portrait?: string;
  sprite?: string;
  dialoguePrefix: string;
}

// ==================== 存档系统 ====================

export interface ISaveData {
  version: string;
  slot: number;
  timestamp: number;
  worldState: IWorldState;
  foreshadowStates: Record<string, IForeshadowState>;
  currentZone: string;
  settings: IGameSettings;
}

export interface IGameSettings {
  bgmVolume: number;
  sfxVolume: number;
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  language: 'zh-CN';
  autoSave: boolean;
}

// ==================== 结局系统 ====================

export type EndingType =
  | 'A_STABLE_PLANE' // 平面稳定
  | 'B_RELEASE_TRUTH' // 真实释放
  | 'C_BECOME_SYSTEM'; // 成为系统

export interface IEndingResult {
  type: EndingType;
  title: string;
  description: string;
  foreshadowsResolved: string[];
  totalPlayTime: number;
  finalCounters: ICounters;
}

// ==================== 事件系统 ====================

export interface IGameEvent {
  type: string;
  payload?: unknown;
  timestamp: number;
}

export type GameEventType =
  | 'zone:enter'
  | 'zone:exit'
  | 'zone:complete'
  | 'dialogue:start'
  | 'dialogue:text'
  | 'dialogue:choice'
  | 'dialogue:end'
  | 'card:collect'
  | 'card:view'
  | 'ability:unlock'
  | 'ability:use'
  | 'foreshadow:trigger'
  | 'time:rewind'
  | 'depth:perceive'
  | 'depth:intervene'
  | 'ending:reach';
