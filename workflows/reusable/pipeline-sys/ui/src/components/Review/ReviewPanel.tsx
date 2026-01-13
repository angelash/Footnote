/**
 * ReviewPanel - 审查面板组件
 * 显示审查统计和操作按钮
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  getReviews,
  getAudits,
  getReviewDetail,
  getAuditDetail,
  getAuditMarkdown,
  getAuditReviews,
  addAnnotation,
  getAuditProfiles,
  startCodeReview,
  startDesignReview,
  startQaSignoff,
  startAcceptanceReview,
  startAuditIntake,
  getReviewId,
  getReviewType,
  getResultColor,
  getStatusColor,
  getDecisionColor,
  getGradeColor,
  MODULE_NAMES,
  CHAPTER_NAMES,
  ANNOTATION_STATUSES,
  ANNOTATION_REASONS,
  ReviewRecord,
  AuditReport,
  AuditReviewsResponse,
  Annotation,
  CodeReviewInput,
  DesignReviewInput,
  QaSignoffInput,
  AcceptanceReviewInput,
  AuditIntakeInput,
} from '../../api/reviewApi';
import './ReviewPanel.css';

// ============================================
// 子组件：发起审查表单
// ============================================

interface StartReviewFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const StartReviewForm: React.FC<StartReviewFormProps> = ({ onClose, onSuccess }) => {
  const [reviewType, setReviewType] = useState<'code' | 'design' | 'qa' | 'acceptance' | 'audit'>('audit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<string[]>(['all']);

  // 表单字段
  const [taskId, setTaskId] = useState('');
  const [commitRange, setCommitRange] = useState('HEAD~5..HEAD');
  const [docPath, setDocPath] = useState('');
  const [docType, setDocType] = useState<'spec' | 'taskpack' | 'bible'>('spec');
  const [taskPackPath, setTaskPackPath] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [periodDays, setPeriodDays] = useState(7);
  const [autoTriggerMissing, setAutoTriggerMissing] = useState(true);
  const [includeCodeReview, setIncludeCodeReview] = useState(true);
  const [includeDesignReview, setIncludeDesignReview] = useState(true);
  const [includeQaSignoff, setIncludeQaSignoff] = useState(true);
  const [auditProfile, setAuditProfile] = useState('all');

  // 加载审查配置列表
  useEffect(() => {
    getAuditProfiles().then(res => {
      if (res.ok && res.profiles.length > 0) {
        setProfiles(res.profiles);
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      switch (reviewType) {
        case 'code': {
          const input: CodeReviewInput = {
            task_id: taskId || `TASK-${Date.now()}`,
            commit_range: commitRange,
          };
          await startCodeReview(input);
          break;
        }
        case 'design': {
          const input: DesignReviewInput = {
            doc_path: docPath,
            doc_type: docType,
          };
          await startDesignReview(input);
          break;
        }
        case 'qa': {
          const input: QaSignoffInput = {
            task_id: taskId || `TASK-${Date.now()}`,
            task_pack_path: taskPackPath,
          };
          await startQaSignoff(input);
          break;
        }
        case 'acceptance': {
          const input: AcceptanceReviewInput = {
            milestone_id: milestoneId || `M-${Date.now()}`,
          };
          await startAcceptanceReview(input);
          break;
        }
        case 'audit': {
          const input: AuditIntakeInput = {
            period_days: periodDays,
            audit_scope: 'all',
            auto_trigger_missing: autoTriggerMissing,
            include_code_review: includeCodeReview,
            include_design_review: includeDesignReview,
            include_qa_signoff: includeQaSignoff,
            audit_profile: auditProfile,
          };
          await startAuditIntake(input);
          break;
        }
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form-overlay" onClick={onClose}>
      <div className="review-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-form-header">
          <h3>发起审查</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          <div className="form-group">
            <label>审查类型</label>
            <select value={reviewType} onChange={(e) => setReviewType(e.target.value as typeof reviewType)}>
              <option value="audit">🔍 总体审核（制作人入口）</option>
              <option value="code">📝 代码审查</option>
              <option value="design">📐 设计审查</option>
              <option value="qa">✅ QA签字</option>
              <option value="acceptance">🏆 里程碑验收</option>
            </select>
          </div>

          {reviewType === 'audit' && (
            <>
              <div className="form-group">
                <label>审查范围</label>
                <select value={auditProfile} onChange={(e) => setAuditProfile(e.target.value)}>
                  {profiles.map((p) => (
                    <option key={p} value={p}>
                      {p === 'all' && '全量审查'}
                      {p === 'game-product' && '游戏产品'}
                      {p === 'pipeline-tools' && '流程工具'}
                      {p === 'design-docs' && '设计文档'}
                      {!['all', 'game-product', 'pipeline-tools', 'design-docs'].includes(p) && p}
                    </option>
                  ))}
                </select>
                <span className="hint">选择审查范围配置</span>
              </div>

              <div className="form-group">
                <label>统计周期（天）</label>
                <input
                  type="number"
                  value={periodDays}
                  onChange={(e) => setPeriodDays(Number(e.target.value))}
                  min={1}
                  max={90}
                />
                <span className="hint">统计最近N天内的任务/提交/审查记录</span>
              </div>

              <div className="form-group">
                <label>审核内容</label>
                <div className="checkbox-group">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={includeCodeReview}
                      onChange={(e) => setIncludeCodeReview(e.target.checked)}
                    />
                    <span>📝 Code Review（代码审查）</span>
                  </label>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={includeDesignReview}
                      onChange={(e) => setIncludeDesignReview(e.target.checked)}
                    />
                    <span>📐 Design Review（设计审查）</span>
                  </label>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={includeQaSignoff}
                      onChange={(e) => setIncludeQaSignoff(e.target.checked)}
                    />
                    <span>✅ QA Signoff（会跑 lint/typecheck/test/build，耗时更久）</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>执行模式</label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={autoTriggerMissing}
                    onChange={(e) => setAutoTriggerMissing(e.target.checked)}
                  />
                  <span>自动补齐缺失审查（完整审核，可能耗时较久）</span>
                </label>
              </div>
            </>
          )}

          {reviewType === 'code' && (
            <>
              <div className="form-group">
                <label>任务ID（可选）</label>
                <input
                  type="text"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  placeholder="TASK-001"
                />
              </div>
              <div className="form-group">
                <label>Commit 范围</label>
                <input
                  type="text"
                  value={commitRange}
                  onChange={(e) => setCommitRange(e.target.value)}
                  placeholder="HEAD~5..HEAD"
                />
              </div>
            </>
          )}

          {reviewType === 'design' && (
            <>
              <div className="form-group">
                <label>文档路径</label>
                <input
                  type="text"
                  value={docPath}
                  onChange={(e) => setDocPath(e.target.value)}
                  placeholder="design/ai-native/02_specs/xxx.md"
                  required
                />
              </div>
              <div className="form-group">
                <label>文档类型</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value as typeof docType)}>
                  <option value="spec">Spec 规格</option>
                  <option value="taskpack">TaskPack 任务包</option>
                  <option value="bible">Bible 总纲</option>
                </select>
              </div>
            </>
          )}

          {reviewType === 'qa' && (
            <>
              <div className="form-group">
                <label>任务ID</label>
                <input
                  type="text"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  placeholder="TASK-001"
                  required
                />
              </div>
              <div className="form-group">
                <label>TaskPack 路径</label>
                <input
                  type="text"
                  value={taskPackPath}
                  onChange={(e) => setTaskPackPath(e.target.value)}
                  placeholder="design/ai-native/03_taskpacks/TASK-001_task.md"
                  required
                />
              </div>
            </>
          )}

          {reviewType === 'acceptance' && (
            <div className="form-group">
              <label>里程碑ID</label>
              <input
                type="text"
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                placeholder="M1-Alpha"
                required
              />
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '提交中...' : '发起审查'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// 子组件：审查记录卡片
// ============================================

interface ReviewCardProps {
  record: ReviewRecord;
  onOpenDetail: (record: ReviewRecord) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ record, onOpenDetail }) => {
  const id = getReviewId(record);
  const type = getReviewType(record);
  const resultColor = getResultColor(record.result);

  const typeLabels: Record<string, string> = {
    code: '代码审查',
    design: '设计审查',
    qa: 'QA签字',
    acceptance: '里程碑验收',
    audit: '总体审核',
    unknown: '未知',
  };

  const typeIcons: Record<string, string> = {
    code: '📝',
    design: '📐',
    qa: '✅',
    acceptance: '🏆',
    audit: '🔍',
    unknown: '❓',
  };

  return (
    <div
      className="review-card clickable"
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(record)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpenDetail(record);
      }}
    >
      <div className="review-card-header">
        <span className="review-type">
          {typeIcons[type]} {typeLabels[type]}
        </span>
        <span className="review-result" style={{ backgroundColor: resultColor }}>
          {record.result}
        </span>
      </div>
      <div className="review-card-body">
        <div className="review-id">{id}</div>
        {record.task_id && <div className="review-meta">任务: {record.task_id}</div>}
        {record.doc_path && <div className="review-meta">文档: {record.doc_path}</div>}
        {record.milestone_id && <div className="review-meta">里程碑: {record.milestone_id}</div>}
        {record.score !== undefined && (
          <div className="review-score">
            评分: <strong>{record.score}</strong>/100
          </div>
        )}
        {record.completed_at && (
          <div className="review-time">{new Date(record.completed_at).toLocaleString()}</div>
        )}
      </div>
      {record.summary && <div className="review-summary">{record.summary}</div>}
    </div>
  );
};

// ============================================
// 子组件：审核报告卡片
// ============================================

interface AuditCardProps {
  audit: AuditReport;
  onOpenDetail: (audit: AuditReport) => void;
}

const AuditCard: React.FC<AuditCardProps> = ({ audit, onOpenDetail }) => {
  const statusColor = getStatusColor(audit.progress_report.status);
  const decisionColor = getDecisionColor(audit.recommendations.decision);
  const isV2 = audit.report_version === '2.0.0' || audit.progress || audit.score_grade;
  const gradeColor = audit.score_grade ? getGradeColor(audit.score_grade) : '#6b7280';

  return (
    <div
      className="audit-card clickable"
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(audit)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpenDetail(audit);
      }}
    >
      <div className="audit-card-header">
        <span className="audit-id">{audit.audit_id}</span>
        <span className="audit-status" style={{ backgroundColor: statusColor }}>
          {audit.progress_report.status}
        </span>
        {isV2 && audit.score_grade && (
          <span className="audit-grade" style={{ backgroundColor: gradeColor }}>
            {audit.score_grade}
          </span>
        )}
      </div>

      <div className="audit-metrics">
        {/* v2 细化指标 */}
        {isV2 && audit.total_score !== undefined && (
          <div className="metric metric-highlight">
            <span className="metric-value" style={{ color: gradeColor }}>{audit.total_score}</span>
            <span className="metric-label">总分</span>
          </div>
        )}
        {isV2 && audit.progress?.overall && (
          <div className="metric">
            <span className="metric-value">{audit.progress.overall.pct}</span>
            <span className="metric-label">完成度</span>
          </div>
        )}
        {/* v1 兼容指标 */}
        <div className="metric">
          <span className="metric-value">{audit.progress_report.metrics.overall_pass_rate}</span>
          <span className="metric-label">通过率</span>
        </div>
        <div className="metric">
          <span className="metric-value">{audit.issue_report.summary.blocker_count}</span>
          <span className="metric-label">阻塞</span>
        </div>
        {isV2 && audit.work_items_summary && (
          <div className="metric">
            <span className="metric-value">{audit.work_items_summary.total}</span>
            <span className="metric-label">工作项</span>
          </div>
        )}
      </div>

      <div className="audit-decision" style={{ borderColor: decisionColor }}>
        <span className="decision-label">决策建议:</span>
        <span className="decision-value" style={{ color: decisionColor }}>
          {audit.recommendations.decision}
        </span>
      </div>

      <div className="audit-period">
        周期: {audit.period.start} ~ {audit.period.end}
        {isV2 && <span className="audit-version">v2.0</span>}
      </div>
    </div>
  );
};

// ============================================
// 主组件：ReviewPanel
// ============================================

export const ReviewPanel: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [audits, setAudits] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'code' | 'design' | 'qa' | 'acceptance'>('all');
  const [activeTab, setActiveTab] = useState<'reviews' | 'audits'>('audits');
  const [startingFullAudit, setStartingFullAudit] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewRecord | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<AuditReport | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewsRes, auditsRes] = await Promise.all([
        getReviews(filterType === 'all' ? undefined : filterType),
        getAudits(10),
      ]);
      setReviews(reviewsRes.reviews);
      setAudits(auditsRes.audits);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30秒刷新
    return () => clearInterval(interval);
  }, [fetchData]);

  // 统计
  const stats = {
    total: reviews.length,
    passed: reviews.filter((r) => r.result === 'APPROVED' || r.result === 'PASSED').length,
    pending: reviews.filter((r) => r.result === 'PENDING' || r.result === 'PARTIAL').length,
    failed: reviews.filter(
      (r) =>
        r.result === 'REJECTED' ||
        r.result === 'FAILED' ||
        r.result === 'CHANGES_REQUESTED' ||
        r.result === 'REVISION_REQUIRED'
    ).length,
  };

  const handleStartFullAudit = async (): Promise<void> => {
    setStartingFullAudit(true);
    setError(null);
    setNotice(null);
    try {
      await startAuditIntake({
        audit_scope: 'all',
        period_days: 7,
        auto_trigger_missing: true,
        include_code_review: true,
        include_design_review: true,
        include_qa_signoff: true,
      });
      setActiveTab('audits');
      setNotice('已发起“一键完整审核”（后台执行中）。完成后会在“审核报告”列表出现新的 AUDIT 记录。');
      // 主动刷新一次（后续还有 30s 定时刷新）
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStartingFullAudit(false);
    }
  };

  const handleOpenReviewDetail = (record: ReviewRecord): void => {
    setSelectedAudit(null);
    setSelectedReview(record);
  };

  const handleOpenAuditDetail = (audit: AuditReport): void => {
    setSelectedReview(null);
    setSelectedAudit(audit);
  };

  return (
    <div className="review-panel">
      {/* 头部 */}
      <div className="review-panel-header">
        <h2>🔍 审查中心</h2>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchData} disabled={loading}>
            🔄 刷新
          </button>
          <button className="btn-primary btn-accent" onClick={handleStartFullAudit} disabled={startingFullAudit}>
            {startingFullAudit ? '⏳ 审核启动中...' : '⚡ 一键完整审核'}
          </button>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            ➕ 发起审查
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="review-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">总审查数</span>
        </div>
        <div className="stat-card stat-passed">
          <span className="stat-value">{stats.passed}</span>
          <span className="stat-label">已通过</span>
        </div>
        <div className="stat-card stat-pending">
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">待处理</span>
        </div>
        <div className="stat-card stat-failed">
          <span className="stat-value">{stats.failed}</span>
          <span className="stat-label">未通过</span>
        </div>
      </div>

      {/* 标签页 */}
      <div className="review-tabs">
        <button
          className={`tab ${activeTab === 'audits' ? 'active' : ''}`}
          onClick={() => setActiveTab('audits')}
        >
          📊 审核报告 ({audits.length})
        </button>
        <button
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          📋 审查记录 ({reviews.length})
        </button>
      </div>

      {/* 筛选器（仅审查记录标签页） */}
      {activeTab === 'reviews' && (
        <div className="review-filters">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)}>
            <option value="all">全部类型</option>
            <option value="code">代码审查</option>
            <option value="design">设计审查</option>
            <option value="qa">QA签字</option>
            <option value="acceptance">里程碑验收</option>
          </select>
        </div>
      )}

      {/* 错误提示 */}
      {error && <div className="review-error">❌ {error}</div>}
      {notice && <div className="review-notice">✅ {notice}</div>}

      {/* 加载中 */}
      {loading && <div className="review-loading">加载中...</div>}

      {/* 内容区域 */}
      {!loading && (
        <div className="review-content">
          {activeTab === 'audits' && (
            <div className="audits-list">
              {audits.length === 0 ? (
                <div className="empty-state">
                  <p>暂无审核报告</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    发起总体审核
                  </button>
                </div>
              ) : (
                audits.map((audit) => (
                  <AuditCard key={audit.audit_id} audit={audit} onOpenDetail={handleOpenAuditDetail} />
                ))
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <div className="empty-state">
                  <p>暂无审查记录</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <ReviewCard key={getReviewId(review)} record={review} onOpenDetail={handleOpenReviewDetail} />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 发起审查表单 */}
      {showForm && <StartReviewForm onClose={() => setShowForm(false)} onSuccess={fetchData} />}

      {/* 详情弹窗：审查记录 */}
      {selectedReview && (
        <ReviewDetailModal
          record={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}

      {/* 详情弹窗：审核报告 */}
      {selectedAudit && (
        <AuditDetailModal
          audit={selectedAudit}
          onClose={() => setSelectedAudit(null)}
        />
      )}
    </div>
  );
};

export default ReviewPanel;

// ============================================
// 详情弹窗：审查记录
// ============================================

interface ReviewDetailModalProps {
  record: ReviewRecord;
  onClose: () => void;
}

const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({ record, onClose }) => {
  const [tab, setTab] = useState<'overview' | 'json'>('overview');
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ReviewRecord>(record);
  const [raw, setRaw] = useState<string>(JSON.stringify(record, null, 2));
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async (): Promise<void> => {
      setLoading(true);
      setLoadError(null);
      try {
        const id = getReviewId(record);
        const res = await getReviewDetail(id);
        if (!mounted) return;
        setDetail(res.record);
        setRaw(res.raw || JSON.stringify(res.record, null, 2));
      } catch (e) {
        if (!mounted) return;
        setLoadError(e instanceof Error ? e.message : String(e));
        setDetail(record);
        setRaw(JSON.stringify(record, null, 2));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [record]);

  const id = getReviewId(detail);
  const type = getReviewType(detail);
  const resultColor = getResultColor(detail.result);

  const renderDimensions = (): React.ReactNode => {
    if (!detail.dimensions) return <div className="detail-empty">（无）</div>;
    const entries = Object.entries(detail.dimensions);
    if (!entries.length) return <div className="detail-empty">（无）</div>;
    return (
      <div className="detail-kv-grid">
        {entries.map(([k, v]) => {
          const score = typeof v === 'number' ? v : v?.score;
          const comments = typeof v === 'object' && v && 'comments' in v ? (v as { comments?: string }).comments : undefined;
          return (
            <div key={k} className="detail-kv">
              <div className="detail-k">{k}</div>
              <div className="detail-v">
                <strong>{score ?? '-'}</strong>
                {comments ? <div className="detail-sub">{comments}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-title">
            <span className="detail-id">{id}</span>
            <span className="detail-pill" style={{ backgroundColor: resultColor }}>
              {detail.result}
            </span>
            <span className="detail-meta">类型: {type}</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="detail-tabs">
          <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
            概览
          </button>
          <button className={`tab ${tab === 'json' ? 'active' : ''}`} onClick={() => setTab('json')}>
            原始 JSON
          </button>
        </div>

        {loadError && <div className="detail-error">❌ {loadError}</div>}
        {loading && <div className="detail-loading">加载中...</div>}

        {!loading && tab === 'overview' && (
          <div className="detail-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-kv-grid">
                {detail.task_id ? (
                  <div className="detail-kv">
                    <div className="detail-k">task_id</div>
                    <div className="detail-v">{detail.task_id}</div>
                  </div>
                ) : null}
                {detail.doc_path ? (
                  <div className="detail-kv">
                    <div className="detail-k">doc_path</div>
                    <div className="detail-v">{detail.doc_path}</div>
                  </div>
                ) : null}
                {detail.milestone_id ? (
                  <div className="detail-kv">
                    <div className="detail-k">milestone_id</div>
                    <div className="detail-v">{detail.milestone_id}</div>
                  </div>
                ) : null}
                {detail.score !== undefined ? (
                  <div className="detail-kv">
                    <div className="detail-k">score</div>
                    <div className="detail-v"><strong>{detail.score}</strong>/100</div>
                  </div>
                ) : null}
                {detail.reviewer ? (
                  <div className="detail-kv">
                    <div className="detail-k">reviewer</div>
                    <div className="detail-v">{detail.reviewer}</div>
                  </div>
                ) : null}
                {detail.signer ? (
                  <div className="detail-kv">
                    <div className="detail-k">signer</div>
                    <div className="detail-v">{detail.signer}</div>
                  </div>
                ) : null}
                {detail.completed_at ? (
                  <div className="detail-kv">
                    <div className="detail-k">completed_at</div>
                    <div className="detail-v">{new Date(detail.completed_at).toLocaleString()}</div>
                  </div>
                ) : null}
              </div>
              {detail.summary ? <div className="detail-summary">{detail.summary}</div> : null}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">维度评分 / 备注</div>
              {renderDimensions()}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">问题（issues）</div>
              {detail.issues && detail.issues.length > 0 ? (
                <ul className="detail-list">
                  {detail.issues.map((it, idx) => (
                    <li key={idx}>
                      <div className="detail-list-title">{it.message}</div>
                      <div className="detail-sub">
                        {it.severity ? `severity=${it.severity} ` : ''}
                        {it.type ? `type=${it.type} ` : ''}
                        {it.file ? `file=${it.file} ` : ''}
                        {typeof it.line === 'number' ? `line=${it.line}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="detail-empty">（无）</div>
              )}
            </div>

            {detail.suggestions && detail.suggestions.length > 0 ? (
              <div className="detail-section">
                <div className="detail-section-title">建议（suggestions）</div>
                <ul className="detail-list">
                  {detail.suggestions.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {detail.checklist && detail.checklist.length > 0 ? (
              <div className="detail-section">
                <div className="detail-section-title">清单（checklist）</div>
                <ul className="detail-list">
                  {detail.checklist.map((c, idx) => (
                    <li key={idx}>
                      <div className="detail-list-title">{c.text || c.item || '（未命名项）'}</div>
                      <div className="detail-sub">
                        status={c.status} auto={String(c.auto)}{typeof c.checked === 'boolean' ? ` checked=${String(c.checked)}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {!loading && tab === 'json' && (
          <div className="detail-body">
            <pre className="detail-pre">{raw}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// 详情弹窗：审核报告
// ============================================

interface AuditDetailModalProps {
  audit: AuditReport;
  onClose: () => void;
}

const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ audit, onClose }) => {
  const [tab, setTab] = useState<'overview' | 'scores' | 'breakdown' | 'ai_reviews' | 'progress' | 'issues' | 'json'>('overview');
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<AuditReport>(audit);
  const [raw, setRaw] = useState<string>(JSON.stringify(audit, null, 2));
  const [progressMd, setProgressMd] = useState<string>('');
  const [issuesMd, setIssuesMd] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiReviews, setAiReviews] = useState<AuditReviewsResponse | null>(null);

  const isV2 = detail.report_version === '2.0.0' || detail.progress || detail.score_grade;
  const isNewStructure = (detail as any)._structure === 'directory';

  useEffect(() => {
    let mounted = true;
    const run = async (): Promise<void> => {
      setLoading(true);
      setLoadError(null);
      try {
        const [auditRes, p, i] = await Promise.all([
          getAuditDetail(audit.audit_id),
          getAuditMarkdown(audit.audit_id, 'progress'),
          getAuditMarkdown(audit.audit_id, 'issues'),
        ]);
        if (!mounted) return;
        setDetail(auditRes.audit);
        setRaw(auditRes.raw || JSON.stringify(auditRes.audit, null, 2));
        setProgressMd(p.content || '');
        setIssuesMd(i.content || '');

        // 如果是新目录结构，获取 AI 审查记录
        if (auditRes.audit._structure === 'directory') {
          try {
            const reviewsRes = await getAuditReviews(audit.audit_id);
            if (mounted) setAiReviews(reviewsRes);
          } catch {
            // 忽略获取审查记录失败
          }
        }
      } catch (e) {
        if (!mounted) return;
        setLoadError(e instanceof Error ? e.message : String(e));
        setDetail(audit);
        setRaw(JSON.stringify(audit, null, 2));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [audit]);

  const statusColor = getStatusColor(detail.progress_report.status);
  const decisionColor = getDecisionColor(detail.recommendations.decision);
  const gradeColor = detail.score_grade ? getGradeColor(detail.score_grade) : '#6b7280';

  // 渲染模块进度表格
  const renderModuleProgress = () => {
    if (!detail.progress?.by_module) return <div className="detail-empty">（无数据）</div>;
    const entries = Object.entries(detail.progress.by_module).filter(([_, v]) => v.total > 0);
    if (entries.length === 0) return <div className="detail-empty">（无数据）</div>;

    return (
      <table className="detail-table">
        <thead>
          <tr>
            <th>模块</th>
            <th>完成/总数</th>
            <th>进度</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, stat]) => (
            <tr key={key}>
              <td>{MODULE_NAMES[key] || key}</td>
              <td>{stat.done}/{stat.total}</td>
              <td>
                <span className="progress-bar-text">{stat.bar || ''}</span>
                <span className="progress-pct">{stat.pct}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // 渲染章节进度表格
  const renderChapterProgress = () => {
    if (!detail.progress?.by_chapter) return <div className="detail-empty">（无数据）</div>;
    const entries = Object.entries(detail.progress.by_chapter).filter(([_, v]) => v.total > 0);
    if (entries.length === 0) return <div className="detail-empty">（无数据）</div>;

    return (
      <table className="detail-table">
        <thead>
          <tr>
            <th>章节</th>
            <th>状态</th>
            <th>完成度</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, stat]) => {
            const status = stat.done === stat.total ? '已完成' : (stat.in_progress && stat.in_progress > 0 ? '进行中' : '未开始');
            return (
              <tr key={key}>
                <td>{CHAPTER_NAMES[key] || key}</td>
                <td>{status}</td>
                <td>{stat.pct}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // 标注弹窗状态
  const [annotationTarget, setAnnotationTarget] = useState<{
    review_type: 'code' | 'design';
    issue_index: number;
    file?: string;
    line?: number;
    section?: string;
    description?: string;
    suggestion?: string;
    severity?: string;
  } | null>(null);
  const [annotationStatus, setAnnotationStatus] = useState<Annotation['status']>('dismissed');
  const [annotationReason, setAnnotationReason] = useState('');
  const [annotationComment, setAnnotationComment] = useState('');
  const [savingAnnotation, setSavingAnnotation] = useState(false);

  // 保存标注
  const handleSaveAnnotation = async () => {
    if (!annotationTarget) return;
    setSavingAnnotation(true);
    try {
      await addAnnotation(detail.audit_id, {
        target: annotationTarget,
        status: annotationStatus,
        reason: annotationReason,
        comment: annotationComment,
      });
      setAnnotationTarget(null);
      // 重新加载数据
      // (简化：暂不刷新，用户可手动刷新)
    } catch (e) {
      console.error('保存标注失败:', e);
    } finally {
      setSavingAnnotation(false);
    }
  };

  // 渲染 AI 审查详情（支持代码审查和设计审查的完整字段）
  const renderAiReview = (review: ReviewRecord | undefined, reviewType: 'code' | 'design') => {
    if (!review) return <div className="detail-empty">（未执行）</div>;
    
    const resultColor = getResultColor(review.result);
    // 扩展类型以支持设计审查特有字段
    const extReview = review as ReviewRecord & {
      recommendations?: string[];
      missing_elements?: string[];
      inconsistencies?: string[];
    };
    
    return (
      <div className="ai-review-section">
        <div className="ai-review-header">
          <span className="ai-review-result" style={{ backgroundColor: resultColor }}>
            {review.result}
          </span>
          {review.score !== undefined && (
            <span className="ai-review-score">评分: {review.score}/100</span>
          )}
        </div>
        
        {review.summary && (
          <div className="ai-review-summary">{review.summary}</div>
        )}

        {review.dimensions && Object.keys(review.dimensions).length > 0 && (
          <div className="ai-review-dimensions">
            <div className="detail-sub">维度评分：</div>
            <div className="detail-kv-grid">
              {Object.entries(review.dimensions).map(([k, v]) => {
                const score = typeof v === 'number' ? v : v?.score;
                return (
                  <div key={k} className="detail-kv">
                    <div className="detail-k">{k}</div>
                    <div className="detail-v"><strong>{score ?? '-'}</strong></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 发现问题 - 详细展示每个问题的描述和建议 */}
        {review.issues && review.issues.length > 0 && (
          <div className="ai-review-issues">
            <div className="detail-section-title">🔍 发现问题 ({review.issues.length})</div>
            <div className="issues-list">
              {review.issues.map((issue, idx) => {
                // 支持两种字段名: message 或 description
                const issueAny = issue as typeof issue & { description?: string; section?: string; suggestion?: string };
                const desc = issue.message || issueAny.description || '（无描述）';
                const suggestion = issueAny.suggestion;
                const section = issueAny.section;
                
                return (
                  <div key={idx} className="issue-card">
                    <div className="issue-header">
                      {issue.severity && (
                        <span className={`severity-badge severity-${issue.severity}`}>{issue.severity}</span>
                      )}
                      {issue.file && <span className="issue-file">{issue.file}{issue.line ? `:${issue.line}` : ''}</span>}
                      {section && <span className="issue-section">{section}</span>}
                      <button
                        className="annotate-btn"
                        onClick={() => setAnnotationTarget({
                          review_type: reviewType,
                          issue_index: idx,
                          file: issue.file,
                          line: issue.line,
                          section: section,
                          description: desc,
                          suggestion: suggestion,
                          severity: issue.severity,
                        })}
                        title="添加标注"
                      >
                        🏷️
                      </button>
                    </div>
                    <div className="issue-description">{desc}</div>
                    {suggestion && (
                      <div className="issue-suggestion">
                        <span className="suggestion-label">💡 建议：</span>
                        {suggestion}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 改进建议（代码审查的 recommendations） */}
        {extReview.recommendations && extReview.recommendations.length > 0 && (
          <div className="ai-review-recommendations">
            <div className="detail-section-title">📋 改进建议</div>
            <ul className="detail-list">
              {extReview.recommendations.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 通用建议（设计审查的 suggestions） */}
        {review.suggestions && review.suggestions.length > 0 && (
          <div className="ai-review-suggestions">
            <div className="detail-section-title">📋 总体建议</div>
            <ul className="detail-list">
              {review.suggestions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 缺失元素（设计审查特有） */}
        {extReview.missing_elements && extReview.missing_elements.length > 0 && (
          <div className="ai-review-missing">
            <div className="detail-section-title">⚠️ 缺失元素</div>
            <ul className="detail-list warning-list">
              {extReview.missing_elements.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 不一致项（设计审查特有） */}
        {extReview.inconsistencies && extReview.inconsistencies.length > 0 && (
          <div className="ai-review-inconsistencies">
            <div className="detail-section-title">❌ 不一致项</div>
            <ul className="detail-list error-list">
              {extReview.inconsistencies.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // 渲染评分详情
  const renderScoreDetails = () => {
    if (!detail.score_details || detail.score_details.length === 0) {
      return <div className="detail-empty">（无评分数据）</div>;
    }

    return (
      <div className="score-details">
        <div className="score-summary">
          <div className="score-total">
            <span className="score-value" style={{ color: gradeColor }}>{detail.total_score || 0}</span>
            <span className="score-label">/ 100</span>
          </div>
          <div className="score-grade-badge" style={{ backgroundColor: gradeColor }}>
            {detail.score_grade || '-'}
          </div>
        </div>

        <table className="detail-table">
          <thead>
            <tr>
              <th>维度</th>
              <th>权重</th>
              <th>得分</th>
              <th>扣分原因</th>
            </tr>
          </thead>
          <tbody>
            {detail.score_details.map((sd, idx) => (
              <tr key={idx}>
                <td>{sd.dimension_name}</td>
                <td>{Math.round(sd.weight * 100)}%</td>
                <td>
                  <strong>{sd.score}</strong>/{sd.max_score}
                </td>
                <td>
                  {sd.deductions && sd.deductions.length > 0
                    ? sd.deductions.map((d, i) => (
                        <div key={i} className="deduction-item">
                          <span className={`deduction-severity severity-${d.severity || 'info'}`}>
                            {d.severity || 'info'}
                          </span>
                          {d.reason} (-{d.points})
                        </div>
                      ))
                    : '无扣分'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-modal detail-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-title">
            <span className="detail-id">{detail.audit_id}</span>
            <span className="detail-pill" style={{ backgroundColor: statusColor }}>
              {detail.progress_report.status}
            </span>
            <span className="detail-pill outline" style={{ borderColor: decisionColor, color: decisionColor }}>
              {detail.recommendations.decision}
            </span>
            {isV2 && detail.score_grade && (
              <span className="detail-pill" style={{ backgroundColor: gradeColor }}>
                {detail.score_grade} ({detail.total_score || 0}分)
              </span>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="detail-tabs">
          <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
            概览
          </button>
          {isV2 && (
            <>
              <button className={`tab ${tab === 'scores' ? 'active' : ''}`} onClick={() => setTab('scores')}>
                📊 评分详情
              </button>
              <button className={`tab ${tab === 'breakdown' ? 'active' : ''}`} onClick={() => setTab('breakdown')}>
                📈 进度统计
              </button>
            </>
          )}
          {(isNewStructure || aiReviews) && (
            <button className={`tab ${tab === 'ai_reviews' ? 'active' : ''}`} onClick={() => setTab('ai_reviews')}>
              🤖 AI 审查
              {aiReviews && (aiReviews.has_code_review || aiReviews.has_design_review) && (
                <span className="tab-badge">✓</span>
              )}
            </button>
          )}
          <button className={`tab ${tab === 'progress' ? 'active' : ''}`} onClick={() => setTab('progress')}>
            progress.md
          </button>
          <button className={`tab ${tab === 'issues' ? 'active' : ''}`} onClick={() => setTab('issues')}>
            issues.md
          </button>
          <button className={`tab ${tab === 'json' ? 'active' : ''}`} onClick={() => setTab('json')}>
            原始 JSON
          </button>
        </div>

        {loadError && <div className="detail-error">❌ {loadError}</div>}
        {loading && <div className="detail-loading">加载中...</div>}

        {!loading && tab === 'overview' && (
          <div className="detail-body">
            <div className="detail-section">
              <div className="detail-section-title">周期</div>
              <div className="detail-sub">
                {detail.period.start} ~ {detail.period.end}（requester={detail.requester} scope={detail.scope}）
                {isV2 && <span className="version-badge">v2.0</span>}
              </div>
            </div>

            {/* v2 细化指标 */}
            {isV2 && detail.progress?.overall && (
              <div className="detail-section">
                <div className="detail-section-title">总体完成度</div>
                <div className="overall-progress">
                  <span className="progress-value">{detail.progress.overall.pct}</span>
                  <span className="progress-bar-text">{detail.progress.overall.bar || ''}</span>
                  <span className="progress-stats">
                    ({detail.progress.overall.done}/{detail.progress.overall.total})
                  </span>
                </div>
              </div>
            )}

            <div className="detail-section">
              <div className="detail-section-title">关键指标</div>
              <div className="detail-kv-grid">
                {isV2 && detail.total_score !== undefined && (
                  <div className="detail-kv">
                    <div className="detail-k">总分/等级</div>
                    <div className="detail-v">
                      <strong style={{ color: gradeColor }}>{detail.total_score}</strong>
                      <span className="grade-badge" style={{ backgroundColor: gradeColor }}>
                        {detail.score_grade}
                      </span>
                    </div>
                  </div>
                )}
                <div className="detail-kv">
                  <div className="detail-k">overall_pass_rate</div>
                  <div className="detail-v"><strong>{detail.progress_report.metrics.overall_pass_rate}</strong></div>
                </div>
                <div className="detail-kv">
                  <div className="detail-k">reviews_completed</div>
                  <div className="detail-v">{detail.progress_report.metrics.reviews_completed}</div>
                </div>
                <div className="detail-kv">
                  <div className="detail-k">blockers</div>
                  <div className="detail-v">{detail.issue_report.summary.blocker_count}</div>
                </div>
                <div className="detail-kv">
                  <div className="detail-k">warnings</div>
                  <div className="detail-v">{detail.issue_report.summary.warning_count}</div>
                </div>
                {isV2 && detail.work_items_summary && (
                  <div className="detail-kv">
                    <div className="detail-k">work_items</div>
                    <div className="detail-v">{detail.work_items_summary.total}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">建议 / 下一步</div>
              <ul className="detail-list">
                {(detail.recommendations.recommendations || []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
              <div className="detail-sub">下一步：</div>
              <ul className="detail-list">
                {(detail.recommendations.next_steps || []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">问题清单（Blockers / Warnings）</div>
              <div className="detail-sub">Blockers（{detail.issue_report.summary.blocker_count}）</div>
              {detail.issue_report.blockers.length ? (
                <ul className="detail-list">
                  {detail.issue_report.blockers.slice(0, 50).map((b, idx) => (
                    <li key={idx}>
                      <div className="detail-list-title">{b.source} → {b.target}</div>
                      <div className="detail-sub">issues={Array.isArray(b.issues) ? b.issues.length : 0}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="detail-empty">（无）</div>
              )}

              <div className="detail-sub">Warnings（{detail.issue_report.summary.warning_count}）</div>
              {detail.issue_report.warnings.length ? (
                <ul className="detail-list">
                  {detail.issue_report.warnings.slice(0, 50).map((w, idx) => (
                    <li key={idx}>
                      <div className="detail-list-title">{w.source} → {w.target}</div>
                      <div className="detail-sub">issues={Array.isArray(w.issues) ? w.issues.length : 0}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="detail-empty">（无）</div>
              )}
            </div>
          </div>
        )}

        {!loading && tab === 'scores' && isV2 && (
          <div className="detail-body">
            <div className="detail-section">
              <div className="detail-section-title">细化评分</div>
              {renderScoreDetails()}
            </div>
          </div>
        )}

        {!loading && tab === 'breakdown' && isV2 && (
          <div className="detail-body">
            <div className="detail-section">
              <div className="detail-section-title">按模块进度</div>
              {renderModuleProgress()}
            </div>

            <div className="detail-section">
              <div className="detail-section-title">按章节进度</div>
              {renderChapterProgress()}
            </div>

            {detail.progress?.by_priority && (
              <div className="detail-section">
                <div className="detail-section-title">按优先级</div>
                <div className="priority-stats">
                  {Object.entries(detail.progress.by_priority).map(([pri, stat]) => (
                    stat.total > 0 && (
                      <div key={pri} className="priority-item">
                        <span className={`priority-badge priority-${pri.toLowerCase()}`}>{pri}</span>
                        <span>{stat.done}/{stat.total}</span>
                        <span>{stat.pct}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && tab === 'ai_reviews' && (
          <div className="detail-body">
            {!aiReviews ? (
              <div className="detail-empty">（无 AI 审查数据，可能是旧版审核）</div>
            ) : (
              <>
                <div className="detail-section">
                  <div className="detail-section-title">
                    📝 代码审查 (AI Code Review)
                    {aiReviews.has_code_review && <span className="section-badge success">已完成</span>}
                  </div>
                  {renderAiReview(aiReviews.reviews.code_review, 'code')}
                </div>

                <div className="detail-section">
                  <div className="detail-section-title">
                    📐 设计审查 (AI Design Review)
                    {aiReviews.has_design_review && <span className="section-badge success">已完成</span>}
                  </div>
                  {renderAiReview(aiReviews.reviews.design_review, 'design')}
                </div>

                {aiReviews.has_qa_signoff && (
                  <div className="detail-section">
                    <div className="detail-section-title">
                      ✅ QA 签字 (QA Signoff)
                      <span className="section-badge success">已完成</span>
                    </div>
                    {renderAiReview(aiReviews.reviews.qa_signoff, 'code')}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!loading && tab === 'progress' && (
          <div className="detail-body">
            <pre className="detail-pre">{progressMd || '（未找到 progress.md）'}</pre>
          </div>
        )}

        {!loading && tab === 'issues' && (
          <div className="detail-body">
            <pre className="detail-pre">{issuesMd || '（未找到 issues.md）'}</pre>
          </div>
        )}

        {!loading && tab === 'json' && (
          <div className="detail-body">
            <pre className="detail-pre">{raw}</pre>
          </div>
        )}

        {/* 标注弹窗 */}
        {annotationTarget && (
          <div className="annotation-overlay" onClick={() => setAnnotationTarget(null)}>
            <div className="annotation-modal" onClick={(e) => e.stopPropagation()}>
              <div className="annotation-header">
                <h4>添加标注</h4>
                <button className="close-btn" onClick={() => setAnnotationTarget(null)}>×</button>
              </div>
              <div className="annotation-body">
                <div className="form-group">
                  <label>目标问题</label>
                  <div className="annotation-target-info">
                    <div className="annotation-location">
                      {annotationTarget.severity && (
                        <span className={`severity-badge severity-${annotationTarget.severity}`}>
                          {annotationTarget.severity}
                        </span>
                      )}
                      {annotationTarget.file && <span className="location-file">{annotationTarget.file}</span>}
                      {annotationTarget.line && <span className="location-line">:{annotationTarget.line}</span>}
                      {annotationTarget.section && <span className="location-section">{annotationTarget.section}</span>}
                    </div>
                    {annotationTarget.description && (
                      <div className="annotation-description">
                        <strong>问题描述：</strong>
                        <p>{annotationTarget.description}</p>
                      </div>
                    )}
                    {annotationTarget.suggestion && (
                      <div className="annotation-suggestion">
                        <strong>💡 建议：</strong>
                        <p>{annotationTarget.suggestion}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <select value={annotationStatus} onChange={(e) => setAnnotationStatus(e.target.value as Annotation['status'])}>
                    {ANNOTATION_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>原因</label>
                  <select value={annotationReason} onChange={(e) => setAnnotationReason(e.target.value)}>
                    <option value="">请选择...</option>
                    {ANNOTATION_REASONS.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>备注</label>
                  <textarea
                    value={annotationComment}
                    onChange={(e) => setAnnotationComment(e.target.value)}
                    rows={3}
                    placeholder="可选：添加详细说明..."
                  />
                </div>
              </div>
              <div className="annotation-footer">
                <button className="cancel-btn" onClick={() => setAnnotationTarget(null)}>取消</button>
                <button
                  className="save-btn"
                  onClick={handleSaveAnnotation}
                  disabled={savingAnnotation}
                >
                  {savingAnnotation ? '保存中...' : '保存标注'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
