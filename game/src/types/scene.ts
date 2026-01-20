import type Phaser from 'phaser';

export type SceneObjectType = 'image' | 'sprite' | 'zone';

export type SceneActionType = 'dialogue' | 'card' | 'gotoZone' | 'none';

export interface ISceneAction {
  type: SceneActionType;
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
}

export interface ISceneBackgroundConfig {
  texture: string;
  x?: number;
  y?: number;
  origin?: [number, number];
  displaySize?: [number, number];
  alpha?: number;
}

export interface ISceneConfig {
  id: string;
  title?: string;
  background?: ISceneBackgroundConfig;
  objects: ISceneObjectConfig[];
}

export interface ISceneAssemblerCallbacks {
  onAction: (action: ISceneAction, objectId: string) => void;
}

export interface IAssembledScene {
  /** 由组装器创建的所有对象，用于切换Zone时统一销毁 */
  objects: Phaser.GameObjects.GameObject[];
}
