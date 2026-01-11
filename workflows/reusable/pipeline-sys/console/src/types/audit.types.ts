/**
 * Audit Types - 细化审核报告类型定义
 *
 * 支持多维度进度统计、细化评分标准、工作项追踪
 */

// ============================================
// 基础枚举
// ============================================

/** 模块类型 */
export type ModuleType = 'narrative' | 'system' | 'ui' | 'level' | 'art' | 'qa' | 'infra' | 'other';

/** 章节 ID */
export type ChapterId = 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'common';

/** 游戏系统 */
export type GameSystem =
  | 'card'
  | 'dialogue'
  | 'save'
  | 'ability'
  | 'world_state'
  | 'event'
  | 'foreshadow'
  | 'audio'
  | 'input'
  | 'scene'
  | 'asset'
  | 'debug'
  | 'other';

/** 角色层级 */
export type RoleLevel = 'L0' | 'L1' | 'L2' | 'L3';

/** 优先级 */
export type Priority = 'P0' | 'P1' | 'P2';

/** 工作项状态 */
export type WorkItemStatus = 'pending' | 'in_progress' | 'done' | 'blocked' | 'cancelled';

/** 工作项来源 */
export type WorkItemSource = 'bible' | 'spec' | 'taskpack' | 'dev_plan' | 'manual';

// ============================================
// 工作项定义
// ============================================

/** 工作项 - 可追踪的最小工作单元 */
export interface IWorkItem {
  /** 唯一标识符 */
  id: string;
  /** 标题 */
  title: string;
  /** 来源类型 */
  source: WorkItemSource;
  /** 来源文件路径 */
  source_path: string;
  /** 来源文件行号 */
  source_line?: number;
  /** 所属模块 */
  module: ModuleType;
  /** 所属章节 */
  chapter?: ChapterId;
  /** 所属系统 */
  system?: GameSystem;
  /** 关联角色层级 */
  role?: RoleLevel;
  /** 优先级 */
  priority: Priority;
  /** 状态 */
  status: WorkItemStatus;
  /** 完成百分比 (0-100) */
  completion_pct: number;
  /** 完成证据（文件路径、commit hash、测试用例等） */
  evidence?: string[];
  /** 备注 */
  notes?: string;
  /** 关联的子工作项 ID */
  sub_items?: string[];
  /** 阻塞原因 */
  blocked_reason?: string;
  /** 最后更新时间 */
  updated_at?: string;
}

// ============================================
// 评分系统
// ============================================

/** 评分维度 */
export type ScoreDimension =
  | 'completeness' // 完整性
  | 'code_quality' // 代码规范性
  | 'test_coverage' // 测试覆盖
  | 'doc_sync' // 文档同步
  | 'security' // 安全性
  | 'performance'; // 性能

/** 扣分项 */
export interface IDeduction {
  /** 扣分原因 */
  reason: string;
  /** 扣除分数（正数） */
  points: number;
  /** 相关文件 */
  file?: string;
  /** 相关行号 */
  line?: number;
  /** 严重程度 */
  severity?: 'blocker' | 'major' | 'minor' | 'info';
  /** 建议修复方案 */
  suggestion?: string;
}

/** 评分详情 */
export interface IScoreDetail {
  /** 评分维度 */
  dimension: ScoreDimension;
  /** 维度中文名 */
  dimension_name: string;
  /** 权重 (0-1) */
  weight: number;
  /** 得分 (0-100) */
  score: number;
  /** 满分 */
  max_score: number;
  /** 加权得分 */
  weighted_score: number;
  /** 扣分项列表 */
  deductions: IDeduction[];
  /** 评分说明 */
  comments?: string;
}

/** 评分配置 */
export interface IScoreConfig {
  /** 维度权重配置 */
  weights: Record<ScoreDimension, number>;
  /** 各维度的评分标准 */
  criteria: Record<ScoreDimension, IScoreCriteria>;
}

/** 评分标准 */
export interface IScoreCriteria {
  /** 维度名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 满分条件 */
  full_score_condition: string;
  /** 扣分规则 */
  deduction_rules: Array<{
    condition: string;
    points: number;
    severity: 'blocker' | 'major' | 'minor' | 'info';
  }>;
}

// ============================================
// 进度统计
// ============================================

/** 进度统计项 */
export interface IProgressItem {
  /** 总数 */
  total: number;
  /** 已完成数 */
  done: number;
  /** 进行中数 */
  in_progress: number;
  /** 阻塞数 */
  blocked: number;
  /** 完成百分比 */
  pct: string;
  /** 进度条（文本形式） */
  bar?: string;
}

/** 多维度进度统计 */
export interface IProgressBreakdown {
  /** 总体完成度 */
  overall: IProgressItem;
  /** 按模块统计 */
  by_module: Record<ModuleType, IProgressItem>;
  /** 按章节统计 */
  by_chapter: Record<ChapterId, IProgressItem>;
  /** 按系统统计 */
  by_system: Record<GameSystem, IProgressItem>;
  /** 按角色统计 */
  by_role: Record<RoleLevel, IProgressItem>;
  /** 按优先级统计 */
  by_priority: Record<Priority, IProgressItem>;
}

// ============================================
// 细化审核报告
// ============================================

/** 细化审核报告 */
export interface IDetailedAuditReport {
  /** 审核 ID */
  audit_id: string;
  /** 审核范围 */
  scope: string;
  /** 发起人 */
  requester: string;
  /** 统计周期 */
  period: {
    start: string;
    end: string;
  };

  // ===== 进度统计 =====
  /** 多维度进度统计 */
  progress: IProgressBreakdown;

  // ===== 工作项清单 =====
  /** 所有工作项 */
  work_items: IWorkItem[];
  /** 工作项统计 */
  work_items_summary: {
    total: number;
    by_status: Record<WorkItemStatus, number>;
    by_source: Record<WorkItemSource, number>;
  };

  // ===== 细化评分 =====
  /** 总分 */
  total_score: number;
  /** 各维度评分详情 */
  score_details: IScoreDetail[];
  /** 评分等级 */
  score_grade: 'A' | 'B' | 'C' | 'D' | 'F';

  // ===== 问题清单 =====
  /** 阻塞问题 */
  blockers: Array<{
    source: string;
    target: string;
    issues: string[];
    severity: 'blocker' | 'major';
  }>;
  /** 警告问题 */
  warnings: Array<{
    source: string;
    target: string;
    issues: string[];
  }>;
  /** 改进建议 */
  improvements: string[];

  // ===== 决策建议 =====
  /** 决策 */
  decision: 'PROCEED' | 'PROCEED_WITH_CAUTION' | 'HOLD';
  /** 建议列表 */
  recommendations: string[];
  /** 下一步行动 */
  next_steps: string[];

  // ===== 元数据 =====
  /** 完成时间 */
  completed_at: string;
  /** 报告版本 */
  report_version: string;
}

// ============================================
// 辅助函数类型
// ============================================

/** 解析结果 */
export interface IParseResult {
  /** 是否成功 */
  ok: boolean;
  /** 解析出的工作项 */
  items: IWorkItem[];
  /** 解析警告 */
  warnings: string[];
  /** 解析错误 */
  errors: string[];
  /** 来源文件 */
  source_file: string;
}

/** 验证结果 */
export interface IVerifyResult {
  /** 工作项 ID */
  item_id: string;
  /** 验证是否通过 */
  verified: boolean;
  /** 完成度 */
  completion_pct: number;
  /** 找到的证据 */
  evidence: string[];
  /** 缺失项 */
  missing: string[];
  /** 验证说明 */
  notes?: string;
}

// ============================================
// 默认配置
// ============================================

/** 默认评分配置 */
export const DEFAULT_SCORE_CONFIG: IScoreConfig = {
  weights: {
    completeness: 0.3,
    code_quality: 0.25,
    test_coverage: 0.2,
    doc_sync: 0.15,
    security: 0.1,
    performance: 0,
  },
  criteria: {
    completeness: {
      name: '完整性',
      description: '功能是否完整实现',
      full_score_condition: '所有 P0 任务完成，P1 任务完成 80% 以上',
      deduction_rules: [
        { condition: 'P0 任务未完成', points: 20, severity: 'blocker' },
        { condition: 'P1 任务未完成', points: 5, severity: 'major' },
        { condition: '功能缺失', points: 10, severity: 'major' },
      ],
    },
    code_quality: {
      name: '代码规范性',
      description: '是否符合代码规范',
      full_score_condition: 'lint 0 errors, warnings < 30',
      deduction_rules: [
        { condition: 'lint error', points: 10, severity: 'blocker' },
        { condition: 'lint warning > 100', points: 15, severity: 'major' },
        { condition: 'lint warning > 50', points: 10, severity: 'major' },
        { condition: '硬编码常量', points: 5, severity: 'minor' },
      ],
    },
    test_coverage: {
      name: '测试覆盖',
      description: '单测/E2E 是否覆盖',
      full_score_condition: '核心系统覆盖率 >= 60%, E2E 关键路径覆盖',
      deduction_rules: [
        { condition: '覆盖率 < 30%', points: 20, severity: 'blocker' },
        { condition: '覆盖率 < 60%', points: 10, severity: 'major' },
        { condition: 'E2E 缺失', points: 15, severity: 'major' },
        { condition: '测试 flaky', points: 5, severity: 'minor' },
      ],
    },
    doc_sync: {
      name: '文档同步',
      description: '实现是否与文档一致',
      full_score_condition: '代码实现与 Bible/Spec 一致',
      deduction_rules: [
        { condition: '实现与文档不一致', points: 10, severity: 'major' },
        { condition: '文档未更新', points: 5, severity: 'minor' },
        { condition: 'API 变更未同步', points: 10, severity: 'major' },
      ],
    },
    security: {
      name: '安全性',
      description: '是否存在安全隐患',
      full_score_condition: '无已知安全漏洞',
      deduction_rules: [
        { condition: '高危漏洞', points: 30, severity: 'blocker' },
        { condition: '中危漏洞', points: 15, severity: 'major' },
        { condition: '低危漏洞', points: 5, severity: 'minor' },
      ],
    },
    performance: {
      name: '性能',
      description: '性能是否达标',
      full_score_condition: '无明显性能问题',
      deduction_rules: [
        { condition: '严重性能问题', points: 20, severity: 'blocker' },
        { condition: '一般性能问题', points: 10, severity: 'major' },
      ],
    },
  },
};

/** 模块中文名映射 */
export const MODULE_NAMES: Record<ModuleType, string> = {
  narrative: '叙事',
  system: '系统',
  ui: 'UI',
  level: '关卡',
  art: '美术',
  qa: 'QA',
  infra: '基础设施',
  other: '其他',
};

/** 章节中文名映射 */
export const CHAPTER_NAMES: Record<ChapterId, string> = {
  C0: '序章',
  C1: '第一章',
  C2: '第二章',
  C3: '第三章',
  C4: '第四章',
  C5: '终章',
  common: '通用',
};

/** 系统中文名映射 */
export const SYSTEM_NAMES: Record<GameSystem, string> = {
  card: '卡片系统',
  dialogue: '对话系统',
  save: '存档系统',
  ability: '能力系统',
  world_state: '世界状态',
  event: '事件系统',
  foreshadow: '伏笔系统',
  audio: '音频系统',
  input: '输入系统',
  scene: '场景系统',
  asset: '资源系统',
  debug: '调试系统',
  other: '其他',
};

/** 角色层级中文名映射 */
export const ROLE_NAMES: Record<RoleLevel, string> = {
  L0: '制作人',
  L1: '总监',
  L2: '组长',
  L3: '执行',
};

/** 生成进度条 */
export function generateProgressBar(pct: number, length = 10): string {
  const filled = Math.round((pct / 100) * length);
  const empty = length - filled;
  return '[' + '='.repeat(filled) + '-'.repeat(empty) + ']';
}

/** 计算评分等级 */
export function getScoreGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
