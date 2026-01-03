/**
 * 预览场景导出
 */

export { DevPreviewScene } from './DevPreviewScene';
export { BasePreviewScene } from './BasePreviewScene';
export { ScenePreviewScene } from './ScenePreviewScene';
export { ObjectPreviewScene } from './ObjectPreviewScene';
export { CharacterPreviewScene } from './CharacterPreviewScene';
export { AnimationPreviewScene } from './AnimationPreviewScene';
export { UIPreviewScene } from './UIPreviewScene';
export { EffectPreviewScene } from './EffectPreviewScene';
export { AudioPreviewScene } from './AudioPreviewScene';
export { CardPreviewScene } from './CardPreviewScene';
export { DialoguePreviewScene } from './DialoguePreviewScene';

// 所有预览场景
export const PREVIEW_SCENES = [
  'DevPreviewScene',
  'ScenePreviewScene',
  'ObjectPreviewScene',
  'CharacterPreviewScene',
  'AnimationPreviewScene',
  'UIPreviewScene',
  'EffectPreviewScene',
  'AudioPreviewScene',
  'CardPreviewScene',
  'DialoguePreviewScene',
] as const;

export type PreviewSceneKey = (typeof PREVIEW_SCENES)[number];
