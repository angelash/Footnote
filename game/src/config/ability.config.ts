/**
 * 能力系统配置
 * 统一管理深度感知、深度介入、时间干预三种能力的参数
 * @module config/ability.config
 */

import type { AbilityType } from '@/config/game.config';

// ==================== 深度感知配置 ====================

export const DEPTH_PERCEPTION_CONFIG = {
  /** 蓄力时间(ms) - 长按超过此时间才激活 */
  CHARGE_TIME: 500,
  /** 每秒P值消耗 */
  P_PER_SECOND: 1,
  /** 初始激活P值消耗 */
  INITIAL_P_COST: 0,
} as const;

// ==================== 深度介入配置 ====================

export const DEPTH_INTERVENTION_CONFIG = {
  /** 冷却时间(ms) */
  COOLDOWN: 10000,
  /** P值消耗 */
  P_COST: 3,
} as const;

// ==================== 时间干预配置 ====================

export const TIME_INTERVENTION_CONFIG = {
  /** 冷却时间(ms) */
  COOLDOWN: 30000,
  /** 每节点P值消耗 */
  P_PER_NODE: 2,
  /** 初始激活P值消耗 */
  INITIAL_P_COST: 0,
} as const;

// ==================== 统一能力配置 ====================

/**
 * 能力初始激活P值消耗（用于 AbilitySystem）
 */
export const ABILITY_INITIAL_P_COST: Record<AbilityType, number> = {
  DEPTH_PERCEPTION: DEPTH_PERCEPTION_CONFIG.INITIAL_P_COST,
  DEPTH_INTERVENTION: DEPTH_INTERVENTION_CONFIG.P_COST,
  TIME_INTERVENTION: TIME_INTERVENTION_CONFIG.INITIAL_P_COST,
};

/**
 * 能力持续P值消耗（用于 WorldState）
 */
export const ABILITY_SUSTAINED_P_COST: Record<AbilityType, number> = {
  DEPTH_PERCEPTION: DEPTH_PERCEPTION_CONFIG.P_PER_SECOND,
  DEPTH_INTERVENTION: DEPTH_INTERVENTION_CONFIG.P_COST,
  TIME_INTERVENTION: TIME_INTERVENTION_CONFIG.P_PER_NODE * 2, // 平均2节点
};

/**
 * 能力冷却时间映射
 */
export const ABILITY_COOLDOWNS: Partial<Record<AbilityType, number>> = {
  DEPTH_INTERVENTION: DEPTH_INTERVENTION_CONFIG.COOLDOWN,
  TIME_INTERVENTION: TIME_INTERVENTION_CONFIG.COOLDOWN,
};

// ==================== 完整能力配置对象 ====================

/**
 * 完整能力系统配置（兼容旧代码）
 */
export const ABILITY_CONFIG = {
  DEPTH_PERCEPTION: DEPTH_PERCEPTION_CONFIG,
  DEPTH_INTERVENTION: DEPTH_INTERVENTION_CONFIG,
  TIME_INTERVENTION: TIME_INTERVENTION_CONFIG,

  /** 能力初始P值消耗 */
  P_COST: ABILITY_INITIAL_P_COST,

  /** 能力持续P值消耗 */
  SUSTAINED_P_COST: ABILITY_SUSTAINED_P_COST,

  /** 冷却时间 */
  COOLDOWNS: ABILITY_COOLDOWNS,
} as const;
