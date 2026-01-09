/**
 * ReviewPanel - 审查面板组件
 * 显示审查统计和操作按钮
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  getReviews,
  getAudits,
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
  ReviewRecord,
  AuditReport,
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
}

const ReviewCard: React.FC<ReviewCardProps> = ({ record }) => {
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
    <div className="review-card">
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
}

const AuditCard: React.FC<AuditCardProps> = ({ audit }) => {
  const statusColor = getStatusColor(audit.progress_report.status);
  const decisionColor = getDecisionColor(audit.recommendations.decision);

  return (
    <div className="audit-card">
      <div className="audit-card-header">
        <span className="audit-id">{audit.audit_id}</span>
        <span className="audit-status" style={{ backgroundColor: statusColor }}>
          {audit.progress_report.status}
        </span>
      </div>

      <div className="audit-metrics">
        <div className="metric">
          <span className="metric-value">{audit.progress_report.metrics.overall_pass_rate}</span>
          <span className="metric-label">通过率</span>
        </div>
        <div className="metric">
          <span className="metric-value">{audit.progress_report.metrics.reviews_completed}</span>
          <span className="metric-label">审查数</span>
        </div>
        <div className="metric">
          <span className="metric-value">{audit.issue_report.summary.blocker_count}</span>
          <span className="metric-label">阻塞</span>
        </div>
        <div className="metric">
          <span className="metric-value">{audit.issue_report.summary.warning_count}</span>
          <span className="metric-label">警告</span>
        </div>
      </div>

      <div className="audit-decision" style={{ borderColor: decisionColor }}>
        <span className="decision-label">决策建议:</span>
        <span className="decision-value" style={{ color: decisionColor }}>
          {audit.recommendations.decision}
        </span>
      </div>

      <div className="audit-period">
        周期: {audit.period.start} ~ {audit.period.end}
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
                audits.map((audit) => <AuditCard key={audit.audit_id} audit={audit} />)
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
                reviews.map((review) => <ReviewCard key={getReviewId(review)} record={review} />)
              )}
            </div>
          )}
        </div>
      )}

      {/* 发起审查表单 */}
      {showForm && <StartReviewForm onClose={() => setShowForm(false)} onSuccess={fetchData} />}
    </div>
  );
};

export default ReviewPanel;
