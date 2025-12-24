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
  };
  condition?: IDialogueCondition;
}

export interface IDialogueTrigger {
  card?: string;
  foreshadow?: [string, ForeshadowStage];
  ability?: AbilityType;
  event?: string;
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
}

// ==================== 卡片系统 ====================

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

export type ForeshadowStage = 'plant' | 'deepen' | 'resolve';

export interface IForeshadow {
  id: string;
  name: string;
  stages: {
    plant: IForeshadowStageConfig;
    deepen: IForeshadowStageConfig;
    misread: {
      expected: string;
      truth: string;
    };
    resolve: IForeshadowStageConfig;
  };
  assets?: string[];
}

export interface IForeshadowStageConfig {
  zone: string;
  trigger: string;
  description: string;
  requires?: ForeshadowStage[];
}

export interface IForeshadowState {
  planted: boolean;
  deepened: boolean;
  resolved: boolean;
  plantedAt?: string;
  deepenedAt?: string;
  resolvedAt?: string;
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
  | 'A_STABLE_PLANE'    // 平面稳定
  | 'B_RELEASE_TRUTH'   // 真实释放
  | 'C_BECOME_SYSTEM';  // 成为系统

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

