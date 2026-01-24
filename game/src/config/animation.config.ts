/**
 * 动画帧率配置
 * 统一管理所有精灵动画的帧率
 * @module config/animation.config
 */

// ==================== 角色动画帧率 ====================

export const CHAR_ANIM_FRAMERATE = {
  /** 待机动画 */
  IDLE: 4,
  /** 行走动画 */
  WALK: 10,
  /** 跑步动画 */
  RUN: 12,
  /** 交互动画 */
  INTERACT: 8,
} as const;

// ==================== 特效动画帧率 ====================

export const EFFECT_ANIM_FRAMERATE = {
  /** 深度感知效果 */
  DEPTH_PERCEPTION: 12,
  /** 深度介入效果 */
  DEPTH_INTERVENTION: 16,
  /** 时间干预效果 */
  TIME_INTERVENTION: 10,
  /** 故障效果 */
  GLITCH: 8,
  /** 光晕效果 */
  GLOW: 6,
  /** 粒子效果 */
  PARTICLE: 15,
} as const;

// ==================== 环境动画帧率 ====================

export const ENV_ANIM_FRAMERATE = {
  /** 幽灵/漂移者 */
  GHOST: 6,
  /** 监视器闪烁 */
  MONITOR_FLICKER: 3,
  /** 裂缝颤动 */
  CRACK_TREMBLE: 2,
  /** 光源闪烁 */
  LIGHT_FLICKER: 4,
  /** 水面波纹 */
  WATER_RIPPLE: 8,
  /** 烟雾效果 */
  SMOKE: 6,
} as const;

// ==================== UI 动画帧率 ====================

export const UI_ANIM_FRAMERATE = {
  /** 加载指示器 */
  LOADING: 10,
  /** 按钮悬停 */
  BUTTON_HOVER: 8,
  /** 图标闪烁 */
  ICON_BLINK: 4,
  /** 进度条动画 */
  PROGRESS: 12,
} as const;

// ==================== 完整动画配置对象 ====================

/**
 * 完整动画帧率配置
 */
export const ANIMATION_FRAMERATE = {
  CHAR: CHAR_ANIM_FRAMERATE,
  EFFECT: EFFECT_ANIM_FRAMERATE,
  ENV: ENV_ANIM_FRAMERATE,
  UI: UI_ANIM_FRAMERATE,
} as const;

// ==================== 动画通用配置 ====================

export const ANIMATION_CONFIG = {
  /** 默认帧率 */
  DEFAULT_FRAMERATE: 10,
  /** 是否循环播放 */
  DEFAULT_REPEAT: -1,
  /** 是否 yoyo（往返播放） */
  DEFAULT_YOYO: false,
} as const;
