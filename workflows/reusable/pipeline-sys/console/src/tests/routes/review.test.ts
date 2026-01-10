/**
 * Review Routes 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Mock config
let mockProjectRoot = '';
vi.mock('../../config.js', () => ({
  config: {
    get projectRoot() { return mockProjectRoot; },
    runnerBaseUrl: 'http://mock-runner:3210',
  },
}));

// Mock pathGuards
vi.mock('../../services/pathGuards.js', () => ({
  safeResolveUnderProject: (root: string, relPath: string) => path.join(root, relPath),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import { registerReviewRoutes } from '../../routes/review.js';

describe('Review Routes', () => {
  let app: FastifyInstance;
  let tempDir: string;
  let reviewsDir: string;
  let auditsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'review-routes-test-'));
    mockProjectRoot = tempDir;
    reviewsDir = path.join(tempDir, 'workflows', 'project', 'logs', 'reviews');
    auditsDir = path.join(tempDir, 'workflows', 'project', 'logs', 'audits');
    await fs.mkdir(reviewsDir, { recursive: true });
    await fs.mkdir(auditsDir, { recursive: true });

    app = Fastify();
    await registerReviewRoutes(app);
    await app.ready();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('GET /api/reviews', () => {
    it('should return empty list when no reviews', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/reviews',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.reviews).toEqual([]);
    });

    it('should return list of reviews', async () => {
      const review1 = { review_id: 'CR-001', result: 'pass', score: 85 };
      const review2 = { review_id: 'CR-002', result: 'fail', score: 45 };
      await fs.writeFile(path.join(reviewsDir, 'CR-001.json'), JSON.stringify(review1));
      await fs.writeFile(path.join(reviewsDir, 'CR-002.json'), JSON.stringify(review2));

      const response = await app.inject({
        method: 'GET',
        url: '/api/reviews',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.reviews).toHaveLength(2);
    });

    it('should filter by type', async () => {
      const cr = { review_id: 'CR-001', result: 'pass' };
      const dr = { review_id: 'DR-001', result: 'pass' };
      await fs.writeFile(path.join(reviewsDir, 'CR-001.json'), JSON.stringify(cr));
      await fs.writeFile(path.join(reviewsDir, 'DR-001.json'), JSON.stringify(dr));

      const response = await app.inject({
        method: 'GET',
        url: '/api/reviews?type=code',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.reviews).toHaveLength(1);
      expect(body.reviews[0].review_id).toBe('CR-001');
    });

    it('should respect limit parameter', async () => {
      for (let i = 1; i <= 10; i++) {
        const review = { review_id: `CR-00${i}`, result: 'pass' };
        await fs.writeFile(path.join(reviewsDir, `CR-00${i}.json`), JSON.stringify(review));
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/reviews?limit=5',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.reviews.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/reviews/:id', () => {
    it('should return review detail', async () => {
      const review = { review_id: 'CR-001', result: 'pass', score: 85, summary: 'Good code' };
      await fs.writeFile(path.join(reviewsDir, 'CR-001.json'), JSON.stringify(review));

      const response = await app.inject({
        method: 'GET',
        url: '/api/reviews/CR-001',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.record.review_id).toBe('CR-001');
      expect(body.raw).toBeDefined();
    });

    it('should return 404 for non-existent review', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/reviews/CR-NONEXISTENT',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(false);
    });

    it('should reject invalid review id', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/reviews/../../etc/passwd',
      });

      // 可能返回 400 或 404，取决于实现
      expect([400, 404]).toContain(response.statusCode);
      // 响应体可能没有 ok 字段
      try {
        const body = JSON.parse(response.body);
        if ('ok' in body) {
          expect(body.ok).toBe(false);
        }
      } catch {
        // 解析失败也是可以接受的（非 JSON 响应）
      }
    });
  });

  describe('GET /api/audits', () => {
    it('should return empty list when no audits', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/audits',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.audits).toEqual([]);
    });

    it('should return list of audits', async () => {
      const audit = {
        audit_id: 'AUDIT-001',
        period: { start: '2026-01-01', end: '2026-01-05' },
        progress_report: { status: 'on_track', metrics: { overall_pass_rate: 0.9, reviews_completed: 10 } },
        issue_report: { summary: { blocker_count: 0, warning_count: 2 }, blockers: [], warnings: [] },
        recommendations: { decision: 'proceed', recommendations: [], next_steps: [] },
        requester: 'L0_producer',
        scope: 'full',
      };
      await fs.writeFile(path.join(auditsDir, 'AUDIT-001.json'), JSON.stringify(audit));

      const response = await app.inject({
        method: 'GET',
        url: '/api/audits',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.audits).toHaveLength(1);
    });
  });

  describe('GET /api/audits/:auditId', () => {
    it('should return audit detail', async () => {
      const audit = {
        audit_id: 'AUDIT-001',
        period: { start: '2026-01-01', end: '2026-01-05' },
        progress_report: { status: 'on_track', metrics: { overall_pass_rate: 0.9, reviews_completed: 10 } },
        issue_report: { summary: { blocker_count: 0, warning_count: 2 }, blockers: [], warnings: [] },
        recommendations: { decision: 'proceed', recommendations: [], next_steps: [] },
      };
      await fs.writeFile(path.join(auditsDir, 'AUDIT-001.json'), JSON.stringify(audit));

      const response = await app.inject({
        method: 'GET',
        url: '/api/audits/AUDIT-001',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.audit.audit_id).toBe('AUDIT-001');
    });

    it('should return 404 for non-existent audit', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/audits/AUDIT-NONEXISTENT',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/audits/:auditId/markdown', () => {
    it('should return progress markdown', async () => {
      await fs.writeFile(path.join(auditsDir, 'AUDIT-001-progress.md'), '# Progress Report\n\nAll good!');

      const response = await app.inject({
        method: 'GET',
        url: '/api/audits/AUDIT-001/markdown?kind=progress',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.content).toContain('Progress Report');
    });

    it('should return issues markdown', async () => {
      await fs.writeFile(path.join(auditsDir, 'AUDIT-001-issues.md'), '# Issues Report\n\nNo blockers!');

      const response = await app.inject({
        method: 'GET',
        url: '/api/audits/AUDIT-001/markdown?kind=issues',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.content).toContain('Issues Report');
    });

    it('should return 404 for missing markdown', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/audits/AUDIT-NONEXISTENT/markdown?kind=progress',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/review/code', () => {
    it('should forward code review request to runner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, review_id: 'CR-001' }),
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/review/code',
        payload: {
          task_id: 'TASK-001',
          reviewer: 'AI',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle runner error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/review/code',
        payload: {
          task_id: 'TASK-001',
        },
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('POST /api/review/design', () => {
    it('should forward design review request to runner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, review_id: 'DR-001' }),
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/review/design',
        payload: {
          doc_path: 'design/spec.md',
          reviewer: 'AI',
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /api/review/qa-signoff', () => {
    it('should forward QA signoff request to runner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, signoff_id: 'QA-001' }),
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/review/qa-signoff',
        payload: {
          milestone_id: 'MS-001',
          signer: 'L3_tester',
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /api/audit/intake', () => {
    it('should forward audit intake request to runner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, audit_id: 'AUDIT-001' }),
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/audit/intake',
        payload: {
          period_days: 7,
          include_code_review: true,
          include_design_review: true,
          include_qa_signoff: true,
          requester: 'L0_producer',
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
