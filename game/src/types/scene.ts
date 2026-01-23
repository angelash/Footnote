import type Phaser from 'phaser';

export type SceneObjectType = 'image' | 'sprite' | 'zone';

export type SceneActionType = 'dialogue' | 'card' | 'gotoZone' | 'none';

// ==================== 统一效果系统 ====================

/**
 * 游戏效果类型枚举
 * 统一定义所有系统（交互、对话、卡片）可使用的效果类型
 */
export type GameplayEffectType = 
  | 'flag'       // 设置 flag
  | 'counter'    // 修改计数器 (R/P)
  | 'card'       // 获得卡片
  | 'ability'    // 解锁能力
  | 'foreshadow' // 触发伏笔
  | 'sound'      // 播放音效
  | 'bgm'        // 切换背景音乐
  | 'goto';      // 跳转场景（仅限交互系统）

/**
 * 统一游戏效果接口
 * 
 * 所有系统（InteractionSystem、NarrativeEngine、CardSystem）都应使用此接口
 * 确保效果处理的一致性
 * 
 * @example
 * // 设置 flag
 * { type: 'flag', flagName: 'FLAG_C0Z1_GOT_IDENTITY', flagValue: true }
 * 
 * // 修改计数器
 * { type: 'counter', counter: 'R', delta: 1 }
 * 
 * // 获得卡片
 * { type: 'card', cardId: 'CARD_C0_IDENTITY' }
 * 
 * // 解锁能力
 * { type: 'ability', abilityType: 'DEPTH_PERCEPTION' }
 * 
 * // 触发伏笔
 * { type: 'foreshadow', foreshadowId: 'F01', foreshadowStage: 'plant' }
 */
export interface IGameplayEffect {
  type: GameplayEffectType;
  
  // flag 类型
  flagName?: string;
  flagValue?: boolean;
  
  // counter 类型
  counter?: 'R' | 'P';
  delta?: number;
  
  // card 类型
  cardId?: string;
  
  // ability 类型
  abilityType?: string;
  
  // foreshadow 类型
  foreshadowId?: string;
  foreshadowStage?: 'plant' | 'deepen' | 'misread' | 'collect';
  
  // sound/bgm 类型
  audioKey?: string;
  /** @deprecated 使用 audioKey */
  sfxKey?: string;
  
  // goto 类型
  targetZoneId?: string;
}

/**
 * 交互效果类型（向后兼容别名）
 * @deprecated 推荐直接使用 IGameplayEffect
 */
export type IInteractionEffect = IGameplayEffect;

export interface ISceneAction {
  type: SceneActionType;
  /** 交互唯一标识（用于追踪一次性交互） */
  id?: string;
  /** 是否一次性交互（card类型默认为true） */
  once?: boolean;
  /** 交互效果列表 */
  effects?: IInteractionEffect[];
  // dialogue
  speaker?: string;
  text?: string;
  dialogueId?: string;
  // card
  cardId?: string;
  // gotoZone
  zoneId?: string;
}

export interface ISceneObjectInteractive {
  cursor?: boolean;
  action?: ISceneAction;
  testid?: string;
}

export interface ISceneObjectAnimation {
  key: string;
  frameRate?: number;
  repeat?: number;
  frames?: { start: number; end: number };
  frameNumbers?: number[];
}

/** 场景对象显示条件 */
export interface ISceneObjectCondition {
  /**
   * 需要的 flag 为 true 才显示/可交互（兼容旧字段）
   * @deprecated 请使用 flagTrue
   */
  flag?: string;
  /** 需要的 flag 为 true 才显示/可交互（推荐） */
  flagTrue?: string;
  /** 需要的 flag 为 false 才显示/可交互 */
  flagFalse?: string;
  /**
   * 临时兼容：能力激活条件（将通过 flag 系统实现）
   * 当前仅保证 depthPerception 可用。
   */
  abilityActive?: string;
}

export interface ISceneObjectConfig {
  id: string;
  type: SceneObjectType;
  /** texture 对于 'zone' 类型是可选的 */
  texture?: string;
  x: number;
  y: number;
  /** zone 类型专用：区域宽度 */
  width?: number;
  /** zone 类型专用：区域高度 */
  height?: number;
  scale?: number;
  depth?: number;
  alpha?: number;
  rotation?: number;
  origin?: [number, number];
  frame?: number;
  label?: string;
  labelOffset?: [number, number];
  interactive?: ISceneObjectInteractive;
  animation?: ISceneObjectAnimation;
  /** 显示/交互条件 */
  condition?: ISceneObjectCondition;
  /** 可见性（仅用于运行时检查） */
  tint?: number;
}

export interface ISceneBackgroundConfig {
  texture: string;
  x?: number;
  y?: number;
  origin?: [number, number];
  displaySize?: [number, number];
  alpha?: number;
}

/**
 * 场景进入时的动作配置
 */
export interface ISceneOnEnterConfig {
  /** 自动触发的对话ID */
  dialogue?: string;
  /** 是否只触发一次（默认 true） */
  once?: boolean;
}

export interface ISceneConfig {
  id: string;
  title?: string;
  background?: ISceneBackgroundConfig;
  objects: ISceneObjectConfig[];
  /** 进入场景时自动触发的动作 */
  onEnter?: ISceneOnEnterConfig;
}

export interface ISceneAssemblerCallbacks {
  onAction: (action: ISceneAction, objectId: string) => void;
}

export interface IAssembledScene {
  /** 由组装器创建的所有对象，用于切换Zone时统一销毁 */
  objects: Phaser.GameObjects.GameObject[];
}
