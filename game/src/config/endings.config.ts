/**
 * 结局数据配置
 * 定义三个结局的完整数据，基于 IEndingResult 接口
 * @module config/endings.config
 */

import type { EndingType, IEndingResult } from '@/types';

// ==================== 结局条件配置 ====================

/**
 * 结局条件定义
 */
export interface IEndingCondition {
  /** R值条件 */
  r?: {
    min?: number;
    max?: number;
  };
  /** P值条件 */
  p?: {
    min?: number;
    max?: number;
  };
  /** W值条件 */
  w?: {
    min?: number;
    max?: number;
  };
  /** 必须完成的伏笔 */
  requiredForeshadows?: string[];
  /** 必须拥有的卡片 */
  requiredCards?: string[];
  /** 必须设置的Flag */
  requiredFlags?: string[];
}

/**
 * 结局演出配置
 */
export interface IEndingPresentation {
  /** 主标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 描述文本（多行） */
  description: string[];
  /** 字段符号 */
  fieldSymbol: string;
  /** 主题色（十六进制） */
  themeColor: number;
  /** 辅助色 */
  accentColor: number;
  /** 背景音乐键名 */
  bgmKey?: string;
  /** 演出时长（毫秒） */
  duration: number;
}

/**
 * 完整结局配置
 */
export interface IEndingConfig {
  /** 结局类型 */
  type: EndingType;
  /** 结局代号 */
  code: 'A' | 'B' | 'C';
  /** 结局条件 */
  condition: IEndingCondition;
  /** 演出配置 */
  presentation: IEndingPresentation;
  /** 结局描述（用于生成 IEndingResult） */
  resultDescription: string;
  /** 是否是默认结局（无其他结局满足时） */
  isDefault?: boolean;
}

// ==================== 三结局配置 ====================

/**
 * 结局A：平面稳定 / 继续收敛
 * 条件：R < 6 且 W > 60
 */
export const ENDING_A_STABLE: IEndingConfig = {
  type: 'A_STABLE_PLANE',
  code: 'A',
  condition: {
    r: { max: 5 },
    w: { min: 61 },
  },
  presentation: {
    title: '收敛继续',
    subtitle: '城还能继续被读。',
    description: [
      '你选择了稳定。',
      '格式得以保持，可读性得以延续。',
      '代价是——有些东西永远被压缩在字段之下。',
      '但至少，这座城还在运转。',
    ],
    fieldSymbol: '◦◦◦',
    themeColor: 0x4444ff,
    accentColor: 0xaaaacc,
    bgmKey: 'bgm_ending_a',
    duration: 7000,
  },
  resultDescription: '选择继续收敛，保住可读性。世界格式稳定，但牺牲了涌现的可能。',
  isDefault: true,
};

/**
 * 结局B：真实释放 / 表示松动
 * 条件：R >= 6 且 40 < W <= 60
 */
export const ENDING_B_RELEASE: IEndingConfig = {
  type: 'B_RELEASE_TRUTH',
  code: 'B',
  condition: {
    r: { min: 6 },
    w: { min: 41, max: 60 },
  },
  presentation: {
    title: '表示松开',
    subtitle: '版本不再排队。它们同时存在。',
    description: [
      '你选择了释放。',
      '格式的边界开始模糊，版本差异不再被强制对齐。',
      '混乱？也许。但也是一种自由。',
      '宋岚的地图终于可以有多个真相同时存在。',
    ],
    fieldSymbol: '◇◆◇',
    themeColor: 0xffaa44,
    accentColor: 0xccaa88,
    bgmKey: 'bgm_ending_b',
    duration: 7000,
  },
  resultDescription: '选择松动表示，让涌现回归。版本差异共存，世界变得多义。',
};

/**
 * 结局C：成为系统 / 承载字段
 * 条件：R >= 10 且 W <= 40
 */
export const ENDING_C_CARRIER: IEndingConfig = {
  type: 'C_BECOME_SYSTEM',
  code: 'C',
  condition: {
    r: { min: 10 },
    w: { max: 40 },
  },
  presentation: {
    title: '字段交接',
    subtitle: '你把代价背走了。',
    description: [
      '你选择了承载。',
      '不是升维成神，而是背债。',
      '那些无法被格式化的残差，那些无收益的行为——',
      '现在都由你来承担。',
      '但你让某些人多活了一点。',
    ],
    fieldSymbol: '◦◦◦',
    themeColor: 0x88ff88,
    accentColor: 0xaaffaa,
    bgmKey: 'bgm_ending_c',
    duration: 8000,
  },
  resultDescription: '选择成为新的字段承载者。牺牲自我，让无法被格式化的存在得以延续。',
};

// ==================== 结局配置汇总 ====================

/**
 * 所有结局配置
 */
export const ENDINGS: Record<EndingType, IEndingConfig> = {
  'A_STABLE_PLANE': ENDING_A_STABLE,
  'B_RELEASE_TRUTH': ENDING_B_RELEASE,
  'C_BECOME_SYSTEM': ENDING_C_CARRIER,
};

/**
 * 结局代号映射
 */
export const ENDING_BY_CODE: Record<'A' | 'B' | 'C', IEndingConfig> = {
  'A': ENDING_A_STABLE,
  'B': ENDING_B_RELEASE,
  'C': ENDING_C_CARRIER,
};

// ==================== 结局判定函数 ====================

/**
 * 判定可用结局
 * @param R 无收益残差值
 * @param P 观察者压力值
 * @param W 世界可读性值
 * @returns 可选结局代号列表
 */
export function determineAvailableEndings(R: number, _P: number, W: number): ('A' | 'B' | 'C')[] {
  const available: ('A' | 'B' | 'C')[] = [];

  // 检查每个结局的条件
  for (const [, config] of Object.entries(ENDINGS)) {
    if (checkEndingCondition(config.condition, R, W)) {
      available.push(config.code);
    }
  }

  // 如果没有满足条件的结局，返回默认结局A
  if (available.length === 0) {
    available.push('A');
  }

  return available;
}

/**
 * 检查结局条件是否满足
 */
export function checkEndingCondition(condition: IEndingCondition, R: number, W: number): boolean {
  // 检查R值
  if (condition.r) {
    if (condition.r.min !== undefined && R < condition.r.min) return false;
    if (condition.r.max !== undefined && R > condition.r.max) return false;
  }

  // 检查W值
  if (condition.w) {
    if (condition.w.min !== undefined && W < condition.w.min) return false;
    if (condition.w.max !== undefined && W > condition.w.max) return false;
  }

  return true;
}

/**
 * 获取结局不可选的原因描述
 */
export function getEndingRequirementText(ending: 'A' | 'B' | 'C'): string {
  switch (ending) {
    case 'A':
      return 'R < 6 且 W > 60';
    case 'B':
      return 'R ≥ 6 且 40 < W ≤ 60';
    case 'C':
      return 'R ≥ 10 且 W ≤ 40';
  }
}

/**
 * 生成结局结果数据
 * @param endingType 结局类型
 * @param foreshadowsResolved 已回收的伏笔ID列表
 * @param totalPlayTime 总游戏时长（毫秒）
 * @param finalCounters 最终计数器值
 * @returns 结局结果数据
 */
export function createEndingResult(
  endingType: EndingType,
  foreshadowsResolved: string[],
  totalPlayTime: number,
  finalCounters: { R: number; P: number; W: number }
): IEndingResult {
  const config = ENDINGS[endingType];
  
  return {
    type: endingType,
    title: config.presentation.title,
    description: config.resultDescription,
    foreshadowsResolved,
    totalPlayTime,
    finalCounters,
  };
}

/**
 * 格式化游戏时长
 * @param ms 毫秒
 * @returns 格式化字符串 (HH:MM:SS)
 */
export function formatPlayTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 获取结局统计描述
 */
export function getEndingStatsDescription(result: IEndingResult): string[] {
  const stats: string[] = [];
  
  stats.push(`游戏时长: ${formatPlayTime(result.totalPlayTime)}`);
  stats.push(`伏笔回收: ${result.foreshadowsResolved.length} / 26`);
  stats.push(`最终R值: ${result.finalCounters.R}`);
  stats.push(`最终P值: ${result.finalCounters.P}`);
  stats.push(`最终W值: ${result.finalCounters.W}`);
  
  return stats;
}
