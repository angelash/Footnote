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
  dimensions?: Record<string, { score: number; comments?: string }>;
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
  }>;
  reviewer?: string;
  signer?: string;
  completed_at?: string;
  summary?: string;
}

// 审核报告
export interface AuditReport {
  audit_id: string;
  scope: string;
  requester: string;
  period: { start: string; end: string };
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
