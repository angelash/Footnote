/**
 * Review API Client
 * 审查系统 API 客户端
 */

import { API_BASE } from './consoleApi';

// ============================================
// 类型定义
// ============================================

// 审查记录
export interface ReviewRecord {
  review_id?: string;
  signoff_id?: string;
  acceptance_id?: string;
  audit_id?: string;
  task_id?: string;
  doc_path?: string;
  milestone_id?: string;
  result: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED' | 'REVISION_REQUIRED' | 'PASSED' | 'PARTIAL' | 'FAILED' | 'PENDING';
  score?: number;
  // 兼容两种格式：
  // - 新：{ logic: 85, style: 80 }
  // - 旧：{ logic: { score: 85, comments: '...' } }
  dimensions?: Record<string, number | { score: number; comments?: string }>;
  issues?: Array<{
    severity?: string;
    type?: string;
    message: string;
    file?: string;
    line?: number;
  }>;
  checklist?: Array<{
    item?: string;
    text?: string;
    status: string;
    auto: boolean;
    checked?: boolean;
  }>;
  suggestions?: string[];
  blocking_issues?: string[];
  reviewer?: string;
  signer?: string;
  completed_at?: string;
  summary?: string;
}

// 进度统计项
export interface ProgressItem {
  total: number;
  done: number;
  in_progress?: number;
  blocked?: number;
  pct: string;
  bar?: string;
}

// 多维度进度统计
export interface ProgressBreakdown {
  overall: ProgressItem;
  by_module?: Record<string, ProgressItem>;
  by_chapter?: Record<string, ProgressItem>;
  by_system?: Record<string, ProgressItem>;
  by_role?: Record<string, ProgressItem>;
  by_priority?: Record<string, ProgressItem>;
}

// 扣分项
export interface ScoreDeduction {
  dimension?: string;
  reason: string;
  points: number;
  severity?: 'blocker' | 'major' | 'minor' | 'info';
  file?: string;
  line?: number;
}

// 评分详情
export interface ScoreDetail {
  dimension: string;
  dimension_name: string;
  weight: number;
  score: number;
  max_score: number;
  weighted_score: number;
  deductions: ScoreDeduction[];
}

// 工作项
export interface WorkItem {
  id: string;
  title: string;
  source: 'bible' | 'spec' | 'taskpack' | 'dev_plan' | 'manual';
  source_path: string;
  source_line?: number;
  module?: string;
  chapter?: string;
  system?: string;
  priority?: 'P0' | 'P1' | 'P2';
  status: 'pending' | 'in_progress' | 'done' | 'blocked' | 'cancelled';
  completion_pct: number;
  evidence?: string[];
  notes?: string;
}

// 审核报告（支持 v1 和 v2 格式）
export interface AuditReport {
  audit_id: string;
  scope: string;
  requester: string;
  period: { start: string; end: string };
  report_version?: string;  // v2 新增
  scan_summary?: unknown;

  // ===== v2 细化数据 =====
  progress?: ProgressBreakdown;  // v2 多维度进度
  work_items?: WorkItem[];  // v2 工作项清单
  work_items_summary?: {
    total: number;
    by_status?: Record<string, number>;
    by_source?: Record<string, number>;
  };
  total_score?: number;  // v2 总分
  score_grade?: 'A' | 'B' | 'C' | 'D' | 'F';  // v2 评分等级
  score_details?: ScoreDetail[];  // v2 评分详情

  // ===== v1 兼容数据 =====
  progress_report: {
    type: string;
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    metrics: {
      tasks_in_period: number;
      specs_in_period: number;
      commits_in_period: number;
      reviews_completed: number;
      reviews_passed: number;
      overall_pass_rate: string;
      code_review_avg_score: number;
      design_review_avg_score: number;
    };
    breakdown: {
      code_review: { count: number; passed: number; avg_score: number };
      design_review: { count: number; passed: number; avg_score: number };
      qa_signoff: { count: number; passed: number };
    };
  };
  issue_report: {
    type: string;
    summary: {
      blocker_count: number;
      warning_count: number;
      improvement_count: number;
    };
    blockers: Array<{ source: string; target: string; issues: unknown[] }>;
    warnings: Array<{ source: string; target: string; issues: unknown[] }>;
    improvements: string[];
    priority_actions: string[];
  };
  recommendations: {
    decision: 'PROCEED' | 'PROCEED_WITH_CAUTION' | 'HOLD';
    recommendations: string[];
    next_steps: string[];
  };
  completed_at: string;
}

// 模块中文名
export const MODULE_NAMES: Record<string, string> = {
  narrative: '叙事',
  system: '系统',
  ui: 'UI',
  level: '关卡',
  art: '美术',
  qa: 'QA',
  infra: '基础设施',
  other: '其他',
};

// 章节中文名
export const CHAPTER_NAMES: Record<string, string> = {
  C0: '序章',
  C1: '第一章',
  C2: '第二章',
  C3: '第三章',
  C4: '第四章',
  C5: '终章',
  common: '通用',
};

// 评分等级颜色
export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return '#22c55e';
    case 'B':
      return '#84cc16';
    case 'C':
      return '#f59e0b';
    case 'D':
      return '#f97316';
    case 'F':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

// 审查列表响应
export interface ReviewsResponse {
  ok: boolean;
  reviews: ReviewRecord[];
  total: number;
  filter: string;
}

// 审核列表响应
export interface AuditsResponse {
  ok: boolean;
  audits: AuditReport[];
  total: number;
}

export interface ReviewDetailResponse {
  ok: boolean;
  id: string;
  path: string;
  record: ReviewRecord;
  raw: string;
}

export interface AuditDetailResponse {
  ok: boolean;
  audit_id: string;
  path: string;
  audit: AuditReport & {
    _structure?: 'directory' | 'legacy';
    _files?: string[];
    _has_code_review?: boolean;
    _has_design_review?: boolean;
  };
  raw: string;
}

// 审核内审查记录响应（新目录结构）
export interface AuditReviewsResponse {
  ok: boolean;
  audit_id: string;
  reviews: {
    code_review?: ReviewRecord;
    design_review?: ReviewRecord;
    qa_signoff?: ReviewRecord;
  };
  has_code_review: boolean;
  has_design_review: boolean;
  has_qa_signoff: boolean;
}

export interface AuditMarkdownResponse {
  ok: boolean;
  audit_id: string;
  kind: string;
  path: string;
  content: string;
}

// 标注类型
export interface Annotation {
  id: string;
  target: {
    review_type: 'code' | 'design';
    issue_index?: number;
    file?: string;
    line?: number;
    section?: string;
    description_contains?: string;
  };
  status: 'dismissed' | 'acknowledged' | 'fixed' | 'wontfix' | 'deferred';
  reason?: string;
  comment?: string;
  action_ticket?: string;
  annotator: string;
  created_at: string;
  updated_at?: string;
}

export interface SkipRule {
  id: string;
  pattern: {
    file?: string;
    description_contains?: string;
  };
  reason?: string;
  created_at: string;
  expires_at?: string;
}

export interface AnnotationsResponse {
  ok: boolean;
  audit_id: string;
  annotations: Annotation[];
  skip_rules: SkipRule[];
  created_at: string | null;
  updated_at: string | null;
}

export interface AddAnnotationInput {
  target: Annotation['target'];
  status: Annotation['status'];
  reason?: string;
  comment?: string;
  action_ticket?: string;
}

export interface AddSkipRuleInput {
  pattern: SkipRule['pattern'];
  reason?: string;
  expires_at?: string;
}

// 标注状态选项
export const ANNOTATION_STATUSES: Array<{ id: Annotation['status']; label: string; color: string }> = [
  { id: 'dismissed', label: '误报/不适用', color: '#6b7280' },
  { id: 'acknowledged', label: '已知问题', color: '#f59e0b' },
  { id: 'fixed', label: '已修复', color: '#22c55e' },
  { id: 'wontfix', label: '不修复', color: '#ef4444' },
  { id: 'deferred', label: '延期处理', color: '#3b82f6' },
];

// 标注原因选项
export const ANNOTATION_REASONS = [
  { id: 'false_positive', label: '误报' },
  { id: 'known_issue', label: '已知问题' },
  { id: 'by_design', label: '设计如此' },
  { id: 'low_priority', label: '优先级低' },
  { id: 'external_dependency', label: '外部依赖' },
  { id: 'temporary', label: '临时方案' },
  { id: 'other', label: '其他' },
];

// 发起审查的输入参数
export interface CodeReviewInput {
  task_id: string;
  title?: string;
  commit_range?: string;
  changed_files?: string;
  review_dimensions?: string;
  pass_threshold?: number;
  reviewer?: string;
}

export interface DesignReviewInput {
  doc_path: string;
  doc_type?: 'spec' | 'taskpack' | 'bible';
  review_focus?: string;
  parent_doc_path?: string;
  pass_threshold?: number;
  reviewer?: string;
}

export interface QaSignoffInput {
  task_id: string;
  task_pack_path: string;
  signoff_type?: 'feature' | 'integration' | 'release';
  auto_checks?: string;
  signer?: string;
}

export interface AcceptanceReviewInput {
  milestone_id: string;
  scope_chapters?: string;
  scope_systems?: string;
  period_start?: string;
  period_end?: string;
  reviewer?: string;
}

export interface AuditIntakeInput {
  audit_scope?: 'all' | 'milestone' | 'chapter' | 'custom';
  milestone_id?: string;
  chapter_ids?: string;
  period_days?: number;
  include_code_review?: boolean;
  include_design_review?: boolean;
  include_qa_signoff?: boolean;
  auto_trigger_missing?: boolean;
  report_format?: 'markdown' | 'json' | 'html';
  requester?: string;
  audit_profile?: string;
}

// 审查发起响应
export interface ReviewResponse {
  ok: boolean;
  run_id: string;
  status: string;
  async: boolean;
  result?: ReviewRecord;
  error?: string;
}

// ============================================
// API 函数
// ============================================

/**
 * 获取审查记录列表
 */
export async function getReviews(type?: 'code' | 'design' | 'qa' | 'acceptance'): Promise<ReviewsResponse> {
  const url = type ? `${API_BASE}/reviews?type=${type}` : `${API_BASE}/reviews`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch reviews: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取审核报告列表
 */
export async function getAudits(limit = 20): Promise<AuditsResponse> {
  const response = await fetch(`${API_BASE}/audits?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch audits: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取单条审查记录详情（含 raw JSON）
 */
export async function getReviewDetail(id: string): Promise<ReviewDetailResponse> {
  const response = await fetch(`${API_BASE}/reviews/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch review detail: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    ok: Boolean(data?.ok),
    id: String(data?.id || id),
    path: String(data?.path || ''),
    record: (data?.record || {}) as ReviewRecord,
    raw: String(data?.raw || ''),
  };
}

/**
 * 获取单条审核报告详情（含 raw JSON）
 */
export async function getAuditDetail(auditId: string): Promise<AuditDetailResponse> {
  const response = await fetch(`${API_BASE}/audits/${encodeURIComponent(auditId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch audit detail: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    ok: Boolean(data?.ok),
    audit_id: String(data?.audit_id || auditId),
    path: String(data?.path || ''),
    audit: (data?.audit || {}) as AuditReport,
    raw: String(data?.raw || ''),
  };
}

/**
 * 获取审核内的审查记录（新目录结构）
 */
export async function getAuditReviews(auditId: string): Promise<AuditReviewsResponse> {
  const response = await fetch(`${API_BASE}/audits/${encodeURIComponent(auditId)}/reviews`);
  if (!response.ok) {
    throw new Error(`Failed to fetch audit reviews: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取审核报告 Markdown（progress / issues）
 */
export async function getAuditMarkdown(auditId: string, kind: 'progress' | 'issues'): Promise<AuditMarkdownResponse> {
  const response = await fetch(`${API_BASE}/audits/${encodeURIComponent(auditId)}/markdown?kind=${kind}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch audit markdown: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    ok: Boolean(data?.ok),
    audit_id: String(data?.audit_id || auditId),
    kind: String(data?.kind || kind),
    path: String(data?.path || ''),
    content: String(data?.content || ''),
  };
}

// ============================================
// 标注 API
// ============================================

/**
 * 获取审核的标注
 */
export async function getAnnotations(auditId: string): Promise<AnnotationsResponse> {
  const response = await fetch(`${API_BASE}/audits/${encodeURIComponent(auditId)}/annotations`);
  if (!response.ok) {
    throw new Error(`Failed to fetch annotations: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 添加标注
 */
export async function addAnnotation(auditId: string, input: AddAnnotationInput): Promise<{ ok: boolean; annotation: Annotation }> {
  const response = await fetch(`${API_BASE}/audits/${encodeURIComponent(auditId)}/annotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to add annotation: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 更新标注
 */
export async function updateAnnotation(
  auditId: string,
  annId: string,
  updates: Partial<Pick<Annotation, 'status' | 'reason' | 'comment' | 'action_ticket'>>
): Promise<{ ok: boolean; annotation: Annotation }> {
  const response = await fetch(`${API_BASE}/audits/${encodeURIComponent(auditId)}/annotations/${encodeURIComponent(annId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error(`Failed to update annotation: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 删除标注
 */
export async function deleteAnnotation(auditId: string, annId: string): Promise<{ ok: boolean; deleted: string }> {
  const response = await fetch(`${API_BASE}/audits/${encodeURIComponent(auditId)}/annotations/${encodeURIComponent(annId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete annotation: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 添加跳过规则
 */
export async function addSkipRule(auditId: string, input: AddSkipRuleInput): Promise<{ ok: boolean; skip_rule: SkipRule }> {
  const response = await fetch(`${API_BASE}/audits/${encodeURIComponent(auditId)}/skip-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to add skip rule: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取审查配置列表
 */
export async function getAuditProfiles(): Promise<{ ok: boolean; profiles: string[] }> {
  const response = await fetch(`${API_BASE}/config/audit-profiles`);
  if (!response.ok) {
    throw new Error(`Failed to fetch audit profiles: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 发起代码审查
 */
export async function startCodeReview(input: CodeReviewInput): Promise<ReviewResponse> {
  const response = await fetch(`${API_BASE}/review/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to start code review: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 发起设计审查
 */
export async function startDesignReview(input: DesignReviewInput): Promise<ReviewResponse> {
  const response = await fetch(`${API_BASE}/review/design`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to start design review: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 发起QA签字
 */
export async function startQaSignoff(input: QaSignoffInput): Promise<ReviewResponse> {
  const response = await fetch(`${API_BASE}/review/qa-signoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to start QA signoff: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 发起里程碑验收
 */
export async function startAcceptanceReview(input: AcceptanceReviewInput): Promise<ReviewResponse> {
  const response = await fetch(`${API_BASE}/review/acceptance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to start acceptance review: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 发起总体审核（制作人入口）
 */
export async function startAuditIntake(input: AuditIntakeInput): Promise<ReviewResponse> {
  const response = await fetch(`${API_BASE}/audit/intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to start audit: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取审查结果的辅助函数
 */
export function getReviewId(record: ReviewRecord): string {
  return record.review_id || record.signoff_id || record.acceptance_id || record.audit_id || 'unknown';
}

export function getReviewType(record: ReviewRecord): string {
  if (record.review_id?.startsWith('CR-')) return 'code';
  if (record.review_id?.startsWith('DR-')) return 'design';
  if (record.signoff_id?.startsWith('QA-')) return 'qa';
  if (record.acceptance_id?.startsWith('ACC-')) return 'acceptance';
  if (record.audit_id?.startsWith('AUDIT-')) return 'audit';
  return 'unknown';
}

export function getResultColor(result: string): string {
  switch (result) {
    case 'APPROVED':
    case 'PASSED':
      return '#22c55e';
    case 'PARTIAL':
    case 'CHANGES_REQUESTED':
    case 'REVISION_REQUIRED':
      return '#f59e0b';
    case 'REJECTED':
    case 'FAILED':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'HEALTHY':
      return '#22c55e';
    case 'WARNING':
      return '#f59e0b';
    case 'CRITICAL':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

export function getDecisionColor(decision: string): string {
  switch (decision) {
    case 'PROCEED':
      return '#22c55e';
    case 'PROCEED_WITH_CAUTION':
      return '#f59e0b';
    case 'HOLD':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}
