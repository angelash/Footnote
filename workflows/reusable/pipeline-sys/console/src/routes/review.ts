/**
 * Review Routes - 审查系统路由
 * 代理到 WSL Runner 的审查相关端点
 */

import { FastifyInstance } from 'fastify';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { safeResolveUnderProject } from '../services/pathGuards.js';

const RUNNER_BASE = config.runnerBaseUrl;

function isSafeId(id: string): boolean {
  // 仅允许字母数字与连字符，避免奇怪路径/注入
  return /^[A-Za-z0-9-]+$/.test(id);
}

/**
 * 注册审查相关路由
 */
export async function registerReviewRoutes(app: FastifyInstance): Promise<void> {
  // ============================================
  // 审查记录相关
  // ============================================

  // GET /api/reviews - 获取审查记录列表
  app.get('/api/reviews', async (request, reply) => {
    const { type, limit } = request.query as { type?: string; limit?: string };
    const reviewType = (type || '').toLowerCase();
    const lim = Math.min(Math.max(parseInt(limit || '50', 10), 1), 200);
    const relDir = path.posix.join('workflows/project/logs/reviews');

    try {
      const absDir = safeResolveUnderProject(config.projectRoot, relDir);
      await fs.mkdir(absDir, { recursive: true });

      const files = await fs.readdir(absDir).catch(() => []);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      // 按 mtime 倒序（最新在前）
      const withStat = await Promise.all(
        jsonFiles.map(async (f) => {
          const abs = path.join(absDir, f);
          const st = await fs.stat(abs).catch(() => null);
          return { f, abs, mtime: st?.mtimeMs || 0 };
        })
      );
      withStat.sort((a, b) => b.mtime - a.mtime);

      const reviews: unknown[] = [];
      for (const it of withStat.slice(0, lim)) {
        try {
          const raw = await fs.readFile(it.abs, 'utf8');
          const obj = JSON.parse(raw) as any;

          const isCode = obj?.review_id?.startsWith('CR-');
          const isDesign = obj?.review_id?.startsWith('DR-');
          const isQa = obj?.signoff_id?.startsWith('QA-');
          const isAcc = obj?.acceptance_id?.startsWith('ACC-');

          if (
            !reviewType ||
            reviewType === 'all' ||
            (reviewType === 'code' && isCode) ||
            (reviewType === 'design' && isDesign) ||
            (reviewType === 'qa' && isQa) ||
            (reviewType === 'acceptance' && isAcc)
          ) {
            reviews.push(obj);
          }
        } catch {
          // ignore invalid json
        }
      }

      return reply.send({
        ok: true,
        reviews,
        total: reviews.length,
        filter: reviewType || 'all',
      });
    } catch (error) {
      app.log.error(error, 'Failed to list reviews');
      return reply.status(500).send({ ok: false, error: 'Failed to list reviews' });
    }
  });

  // GET /api/audits - 获取审核报告列表
  app.get('/api/audits', async (request, reply) => {
    const { limit } = request.query as { limit?: string };
    const lim = Math.min(Math.max(parseInt(limit || '20', 10), 1), 200);
    const relDir = path.posix.join('workflows/project/logs/audits');

    try {
      const absDir = safeResolveUnderProject(config.projectRoot, relDir);
      await fs.mkdir(absDir, { recursive: true });

      const files = await fs.readdir(absDir).catch(() => []);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      const withStat = await Promise.all(
        jsonFiles.map(async (f) => {
          const abs = path.join(absDir, f);
          const st = await fs.stat(abs).catch(() => null);
          return { f, abs, mtime: st?.mtimeMs || 0 };
        })
      );
      withStat.sort((a, b) => b.mtime - a.mtime);

      const audits: unknown[] = [];
      for (const it of withStat.slice(0, lim)) {
        try {
          const raw = await fs.readFile(it.abs, 'utf8');
          audits.push(JSON.parse(raw));
        } catch {
          // ignore invalid
        }
      }

      return reply.send({ ok: true, audits, total: audits.length });
    } catch (error) {
      app.log.error(error, 'Failed to list audits');
      return reply.status(500).send({ ok: false, error: 'Failed to list audits' });
    }
  });

  // ============================================
  // 读取单条记录（用于 UI 展示“全部细节”）
  // ============================================

  // GET /api/reviews/:id - 读取单条审查记录 JSON（CR/DR/QA/ACC）
  app.get('/api/reviews/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!id || !isSafeId(id)) {
      return reply.status(400).send({ ok: false, error: 'Invalid review id' });
    }

    const relPath = path.posix.join('workflows/project/logs/reviews', `${id}.json`);

    try {
      const absPath = safeResolveUnderProject(config.projectRoot, relPath);
      const raw = await fs.readFile(absPath, 'utf8');
      const record = JSON.parse(raw) as unknown;
      return reply.send({ ok: true, id, path: relPath, record, raw });
    } catch (error) {
      app.log.error(error, 'Failed to read review record');
      return reply.status(404).send({ ok: false, error: 'Review record not found' });
    }
  });

  // GET /api/audits/:auditId - 读取单条审核报告 JSON（AUDIT）
  app.get('/api/audits/:auditId', async (request, reply) => {
    const { auditId } = request.params as { auditId: string };

    if (!auditId || !isSafeId(auditId)) {
      return reply.status(400).send({ ok: false, error: 'Invalid audit id' });
    }

    const relPath = path.posix.join('workflows/project/logs/audits', `${auditId}.json`);

    try {
      const absPath = safeResolveUnderProject(config.projectRoot, relPath);
      const raw = await fs.readFile(absPath, 'utf8');
      const audit = JSON.parse(raw) as unknown;
      return reply.send({ ok: true, audit_id: auditId, path: relPath, audit, raw });
    } catch (error) {
      app.log.error(error, 'Failed to read audit report');
      return reply.status(404).send({ ok: false, error: 'Audit report not found' });
    }
  });

  // GET /api/audits/:auditId/markdown?kind=progress|issues - 读取审核报告 Markdown
  app.get('/api/audits/:auditId/markdown', async (request, reply) => {
    const { auditId } = request.params as { auditId: string };
    const { kind } = request.query as { kind?: string };

    if (!auditId || !isSafeId(auditId)) {
      return reply.status(400).send({ ok: false, error: 'Invalid audit id' });
    }

    const k = (kind || 'progress').toLowerCase();
    const suffix = k === 'issues' ? '-issues.md' : '-progress.md';
    const relPath = path.posix.join('workflows/project/logs/audits', `${auditId}${suffix}`);

    try {
      const absPath = safeResolveUnderProject(config.projectRoot, relPath);
      const content = await fs.readFile(absPath, 'utf8');
      // 这里返回 JSON（前端用 response.json() 解析），content 字段里是 Markdown 文本
      return reply.send({ ok: true, audit_id: auditId, kind: k, path: relPath, content });
    } catch (error) {
      app.log.error(error, 'Failed to read audit markdown');
      return reply.status(404).send({ ok: false, error: 'Audit markdown not found' });
    }
  });

  // ============================================
  // 发起审查
  // ============================================

  // POST /api/review/code - 发起代码审查
  app.post('/api/review/code', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/review/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to start code review');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to start code review',
      });
    }
  });

  // POST /api/review/design - 发起设计审查
  app.post('/api/review/design', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/review/design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to start design review');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to start design review',
      });
    }
  });

  // POST /api/review/qa-signoff - 发起QA签字
  app.post('/api/review/qa-signoff', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/review/qa-signoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to start QA signoff');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to start QA signoff',
      });
    }
  });

  // POST /api/review/acceptance - 发起里程碑验收
  app.post('/api/review/acceptance', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/review/acceptance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to start acceptance review');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to start acceptance review',
      });
    }
  });

  // POST /api/audit/intake - 发起总体审核（制作人入口）
  app.post('/api/audit/intake', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/audit/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to start audit intake');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to start audit intake',
      });
    }
  });

  app.log.info('Review routes registered');
}
