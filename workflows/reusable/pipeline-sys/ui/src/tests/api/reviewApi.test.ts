/**
 * Review API 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  getReviews,
  getAudits,
  getReviewDetail,
  getAuditDetail,
  getAuditMarkdown,
  startCodeReview,
  startDesignReview,
  startQaSignoff,
  startAuditIntake,
  getReviewId,
  getReviewType,
  getResultColor,
  getStatusColor,
  getDecisionColor,
} from '../../api/reviewApi';

describe('Review API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getReviews', () => {
    it('should fetch reviews list', async () => {
      const mockResponse = {
        ok: true,
        reviews: [{ review_id: 'CR-001', result: 'APPROVED' }],
        total: 1,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getReviews();

      expect(mockFetch).toHaveBeenCalled();
      expect(result.reviews).toHaveLength(1);
    });

    it('should pass type parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, reviews: [], total: 0 }),
      });

      await getReviews('code');

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('type=code');
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(getReviews()).rejects.toThrow();
    });
  });

  describe('getAudits', () => {
    it('should fetch audits list', async () => {
      const mockResponse = {
        ok: true,
        audits: [{ audit_id: 'AUDIT-001' }],
        total: 1,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getAudits();

      expect(mockFetch).toHaveBeenCalled();
      expect(result.audits).toHaveLength(1);
    });

    it('should pass limit parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, audits: [], total: 0 }),
      });

      await getAudits(5);

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('limit=5');
    });
  });

  describe('getReviewDetail', () => {
    it('should fetch review detail', async () => {
      const mockResponse = {
        ok: true,
        id: 'CR-001',
        path: 'reviews/CR-001.json',
        record: { review_id: 'CR-001', result: 'APPROVED', score: 85 },
        raw: '{"review_id":"CR-001"}',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getReviewDetail('CR-001');

      expect(mockFetch).toHaveBeenCalled();
      expect(result.record.review_id).toBe('CR-001');
      expect(result.raw).toBeDefined();
    });

    it('should throw error for non-existent review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(getReviewDetail('CR-NONEXISTENT')).rejects.toThrow();
    });
  });

  describe('getAuditDetail', () => {
    it('should fetch audit detail', async () => {
      const mockResponse = {
        ok: true,
        audit_id: 'AUDIT-001',
        path: 'audits/AUDIT-001.json',
        audit: { audit_id: 'AUDIT-001', progress_report: { status: 'HEALTHY' } },
        raw: '{}',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getAuditDetail('AUDIT-001');

      expect(mockFetch).toHaveBeenCalled();
      expect(result.audit.audit_id).toBe('AUDIT-001');
    });
  });

  describe('getAuditMarkdown', () => {
    it('should fetch progress markdown', async () => {
      const mockResponse = {
        ok: true,
        content: '# Progress Report',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getAuditMarkdown('AUDIT-001', 'progress');

      expect(mockFetch).toHaveBeenCalled();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('kind=progress');
      expect(result.content).toContain('Progress');
    });

    it('should fetch issues markdown', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, content: '# Issues' }),
      });

      await getAuditMarkdown('AUDIT-001', 'issues');

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('kind=issues');
    });
  });

  describe('startCodeReview', () => {
    it('should start code review', async () => {
      const mockResponse = { ok: true, run_id: 'RUN-001', status: 'started' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await startCodeReview({ task_id: 'TASK-001', reviewer: 'AI' });

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[1].method).toBe('POST');
      expect(result.ok).toBe(true);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(startCodeReview({ task_id: 'TASK-001' })).rejects.toThrow();
    });
  });

  describe('startDesignReview', () => {
    it('should start design review', async () => {
      const mockResponse = { ok: true, run_id: 'RUN-001' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await startDesignReview({ doc_path: 'design/spec.md', reviewer: 'AI' });

      expect(mockFetch).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });
  });

  describe('startQaSignoff', () => {
    it('should start QA signoff', async () => {
      const mockResponse = { ok: true, run_id: 'RUN-001' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await startQaSignoff({ 
        task_id: 'TASK-001',
        task_pack_path: 'taskpacks/T-001.md',
        signer: 'L3_tester' 
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });
  });

  describe('startAuditIntake', () => {
    it('should start audit intake', async () => {
      const mockResponse = { ok: true, run_id: 'RUN-001' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await startAuditIntake({
        period_days: 7,
        include_code_review: true,
        include_design_review: true,
        include_qa_signoff: true,
        auto_trigger_missing: false,
        requester: 'L0_producer',
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });

    it('should send correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      await startAuditIntake({
        period_days: 14,
        include_code_review: false,
        auto_trigger_missing: true,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.period_days).toBe(14);
      expect(body.include_code_review).toBe(false);
      expect(body.auto_trigger_missing).toBe(true);
    });
  });

  describe('Helper functions', () => {
    describe('getReviewId', () => {
      it('should return review_id', () => {
        expect(getReviewId({ review_id: 'CR-001', result: 'APPROVED' })).toBe('CR-001');
      });

      it('should return signoff_id', () => {
        expect(getReviewId({ signoff_id: 'QA-001', result: 'PASSED' })).toBe('QA-001');
      });

      it('should return unknown for no id', () => {
        expect(getReviewId({ result: 'PENDING' })).toBe('unknown');
      });
    });

    describe('getReviewType', () => {
      it('should return code for CR-* review_id', () => {
        expect(getReviewType({ review_id: 'CR-001', result: 'APPROVED' })).toBe('code');
      });

      it('should return design for DR-* review_id', () => {
        expect(getReviewType({ review_id: 'DR-001', result: 'APPROVED' })).toBe('design');
      });

      it('should return qa for QA-* signoff_id', () => {
        expect(getReviewType({ signoff_id: 'QA-001', result: 'PASSED' })).toBe('qa');
      });

      it('should return unknown for no id', () => {
        expect(getReviewType({ result: 'PENDING' })).toBe('unknown');
      });
    });

    describe('getResultColor', () => {
      it('should return green for APPROVED', () => {
        expect(getResultColor('APPROVED')).toBe('#22c55e');
      });

      it('should return green for PASSED', () => {
        expect(getResultColor('PASSED')).toBe('#22c55e');
      });

      it('should return yellow for PARTIAL', () => {
        expect(getResultColor('PARTIAL')).toBe('#f59e0b');
      });

      it('should return red for FAILED', () => {
        expect(getResultColor('FAILED')).toBe('#ef4444');
      });

      it('should return gray for unknown', () => {
        expect(getResultColor('UNKNOWN')).toBe('#6b7280');
      });
    });

    describe('getStatusColor', () => {
      it('should return green for HEALTHY', () => {
        expect(getStatusColor('HEALTHY')).toBe('#22c55e');
      });

      it('should return yellow for WARNING', () => {
        expect(getStatusColor('WARNING')).toBe('#f59e0b');
      });

      it('should return red for CRITICAL', () => {
        expect(getStatusColor('CRITICAL')).toBe('#ef4444');
      });
    });

    describe('getDecisionColor', () => {
      it('should return green for PROCEED', () => {
        expect(getDecisionColor('PROCEED')).toBe('#22c55e');
      });

      it('should return yellow for PROCEED_WITH_CAUTION', () => {
        expect(getDecisionColor('PROCEED_WITH_CAUTION')).toBe('#f59e0b');
      });

      it('should return red for HOLD', () => {
        expect(getDecisionColor('HOLD')).toBe('#ef4444');
      });
    });
  });
});
