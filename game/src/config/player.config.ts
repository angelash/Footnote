/**
 * 玩家配置
 * 统一管理玩家移动、交互、物理等参数
 * @module config/player.config
 */

// ==================== 移动配置 ====================

export const PLAYER_MOVEMENT = {
  /** 移动速度 (像素/秒) */
  SPEED: 200,
  /** 跑步速度倍率 */
  RUN_MULTIPLIER: 1.5,
} as const;

// ==================== 交互配置 ====================

export const PLAYER_INTERACTION = {
  /** 交互检测范围 (像素) */
  RANGE: 100,
  /** 交互按键提示延迟 (ms) */
  PROMPT_DELAY: 500,
} as const;

// ==================== 物理/碰撞配置 ====================

export const PLAYER_PHYSICS = {
  /** 有精灵时的缩放 */
  SCALE_WITH_SPRITE: 0.8,
  /** 占位符时的缩放 */
  SCALE_PLACEHOLDER: 1.5,
  /** 有精灵时的碰撞盒大小 */
  COLLISION_SIZE_WITH_SPRITE: 40,
  /** 占位符时的碰撞盒大小 */
  COLLISION_SIZE_PLACEHOLDER: 32,
} as const;

// ==================== 视觉配置 ====================

export const PLAYER_VISUAL = {
  /** 玩家深度层级 */
  DEPTH: 100,
  /** 阴影偏移 */
  SHADOW_OFFSET: { x: 0, y: 4 },
  /** 阴影透明度 */
  SHADOW_ALPHA: 0.3,
} as const;

// ==================== 完整玩家配置对象 ====================

/**
 * 完整玩家配置
 */
export const PLAYER_CONFIG = {
  MOVEMENT: PLAYER_MOVEMENT,
  INTERACTION: PLAYER_INTERACTION,
  PHYSICS: PLAYER_PHYSICS,
  VISUAL: PLAYER_VISUAL,

  // 便捷访问（兼容旧代码）
  MOVE_SPEED: PLAYER_MOVEMENT.SPEED,
  INTERACTION_RANGE: PLAYER_INTERACTION.RANGE,
} as const;
