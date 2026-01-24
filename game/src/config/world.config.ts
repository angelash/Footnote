/**
 * 世界状态配置
 * 统一管理 R/P/W 计数器和相关系数
 * @module config/world.config
 */

import type { AbilityType } from '@/config/game.config';
import { ABILITY_SUSTAINED_P_COST } from '@/config/ability.config';

// ==================== 计数器上限 ====================

export const COUNTER_LIMITS = {
  /** P值上限 - 观察者压力 */
  P_MAX: 20,
  /** R值上限 - 无收益残差 */
  R_MAX: 15,
  /** W基础值 - 世界可读性 */
  W_BASE: 100,
} as const;

// ==================== W值计算系数 ====================

export const W_COEFFICIENTS = {
  /** R值对W的影响系数 */
  R_COEFFICIENT: 3,
  /** P值对W的影响系数 */
  P_COEFFICIENT: 2,
  /** 每个伤痕对W的惩罚 (anomalyModifier) */
  SCAR_PENALTY: 2,
  /** 每个污染对W的惩罚 (anomalyModifier) */
  CONTAMINATION_PENALTY: 5,
} as const;

// ==================== 能力P值消耗（用于 WorldState 计算） ====================

/**
 * 能力P值消耗（用于 WorldState 的 consumeP 方法）
 * 注意：此配置与 ability.config.ts 中的配置保持一致
 */
export const ABILITY_P_COST: Record<AbilityType, number> = {
  ...ABILITY_SUSTAINED_P_COST,
};

// ==================== 完整世界配置对象 ====================

/**
 * 完整世界状态配置
 */
export const WORLD_CONFIG = {
  /** 计数器上限 */
  LIMITS: COUNTER_LIMITS,

  /** W值计算系数 */
  W_COEFFICIENTS,

  /** 能力P值消耗 */
  ABILITY_P_COST,

  // 便捷访问（兼容旧代码）
  P_MAX: COUNTER_LIMITS.P_MAX,
  R_MAX: COUNTER_LIMITS.R_MAX,
  W_BASE: COUNTER_LIMITS.W_BASE,
  W_R_COEFFICIENT: W_COEFFICIENTS.R_COEFFICIENT,
  W_P_COEFFICIENT: W_COEFFICIENTS.P_COEFFICIENT,
  W_SCAR_PENALTY: W_COEFFICIENTS.SCAR_PENALTY,
  W_CONTAMINATION_PENALTY: W_COEFFICIENTS.CONTAMINATION_PENALTY,
} as const;
