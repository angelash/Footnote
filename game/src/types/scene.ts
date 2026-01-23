import type Phaser from 'phaser';

export type SceneObjectType = 'image' | 'sprite' | 'zone';

export type SceneActionType = 'dialogue' | 'card' | 'gotoZone' | 'none';

/**
 * 交互效果类型
 * 用于定义交互产生的副作用（设置flag、修改计数器、获得卡片、播放音效）
 */
export interface IInteractionEffect {
  type: 'flag' | 'counter' | 'card' | 'sound';
  /** flag 类型使用：flag名称 */
  flagName?: string;
  /** flag 类型使用：flag值 */
  flagValue?: boolean;
  /** counter 类型使用：计数器类型 */
  counter?: 'R' | 'P';
  /** counter 类型使用：变化量 */
  delta?: number;
  /** card 类型使用：卡片ID */
  cardId?: string;
  /** sound 类型使用：音效key */
  sfxKey?: string;
}

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
