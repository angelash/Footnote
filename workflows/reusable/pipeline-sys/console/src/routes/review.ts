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

  // GET /api/audits - 获取审核报告列表（支持新旧目录结构）
  app.get('/api/audits', async (request, reply) => {
    const { limit } = request.query as { limit?: string };
    const lim = Math.min(Math.max(parseInt(limit || '20', 10), 1), 200);
    const relDir = path.posix.join('workflows/project/logs/audits');

    try {
      const absDir = safeResolveUnderProject(config.projectRoot, relDir);
      await fs.mkdir(absDir, { recursive: true });

      const entries = await fs.readdir(absDir, { withFileTypes: true }).catch(() => []);
      
      // 收集审核：目录（新结构）和 .json 文件（旧结构）
      const auditEntries: Array<{ id: string; abs: string; isDir: boolean; mtime: number }> = [];
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('AUDIT-')) {
          // 新结构：目录
          const summaryPath = path.join(absDir, entry.name, 'summary.json');
          const st = await fs.stat(summaryPath).catch(() => null);
          if (st) {
            auditEntries.push({ id: entry.name, abs: summaryPath, isDir: true, mtime: st.mtimeMs });
          }
        } else if (entry.isFile() && entry.name.endsWith('.json') && entry.name.startsWith('AUDIT-')) {
          // 旧结构：直接 JSON 文件
          const abs = path.join(absDir, entry.name);
          const st = await fs.stat(abs).catch(() => null);
          if (st) {
            auditEntries.push({ id: entry.name.replace('.json', ''), abs, isDir: false, mtime: st.mtimeMs });
          }
        }
      }

      // 按时间倒序
      auditEntries.sort((a, b) => b.mtime - a.mtime);

      const audits: unknown[] = [];
      for (const it of auditEntries.slice(0, lim)) {
        try {
          const raw = await fs.readFile(it.abs, 'utf8');
          const audit = JSON.parse(raw) as any;
          // 标记结构类型便于 UI 判断
          audit._structure = it.isDir ? 'directory' : 'legacy';
          audits.push(audit);
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

  // GET /api/audits/:auditId - 读取单条审核报告（支持新旧结构）
  app.get('/api/audits/:auditId', async (request, reply) => {
    const { auditId } = request.params as { auditId: string };

    if (!auditId || !isSafeId(auditId)) {
      return reply.status(400).send({ ok: false, error: 'Invalid audit id' });
    }

    const baseDir = path.posix.join('workflows/project/logs/audits');

    try {
      const absBaseDir = safeResolveUnderProject(config.projectRoot, baseDir);

      // 尝试新结构：目录/summary.json
      const newPath = path.join(absBaseDir, auditId, 'summary.json');
      let raw: string | null = null;
      let relPath: string;
      let isDir = false;

      try {
        raw = await fs.readFile(newPath, 'utf8');
        relPath = path.posix.join(baseDir, auditId, 'summary.json');
        isDir = true;
      } catch {
        // 尝试旧结构：直接 .json 文件
        const legacyPath = path.join(absBaseDir, `${auditId}.json`);
        raw = await fs.readFile(legacyPath, 'utf8');
        relPath = path.posix.join(baseDir, `${auditId}.json`);
      }

      const audit = JSON.parse(raw) as any;
      audit._structure = isDir ? 'directory' : 'legacy';
      
      // 如果是新结构，检查包含的审查文件
      if (isDir) {
        const auditDirPath = path.join(absBaseDir, auditId);
        const files = await fs.readdir(auditDirPath).catch((): string[] => []);
        audit._files = files;
        audit._has_code_review = files.includes('code-review.json');
        audit._has_design_review = files.includes('design-review.json');
      }

      return reply.send({ ok: true, audit_id: auditId, path: relPath, audit, raw });
    } catch (error) {
      app.log.error(error, 'Failed to read audit report');
      return reply.status(404).send({ ok: false, error: 'Audit report not found' });
    }
  });

  // GET /api/audits/:auditId/reviews - 获取审核目录下的所有审查记录（新结构）
  app.get('/api/audits/:auditId/reviews', async (request, reply) => {
    const { auditId } = request.params as { auditId: string };

    if (!auditId || !isSafeId(auditId)) {
      return reply.status(400).send({ ok: false, error: 'Invalid audit id' });
    }

    const auditDir = path.posix.join('workflows/project/logs/audits', auditId);

    try {
      const absDir = safeResolveUnderProject(config.projectRoot, auditDir);
      const files = await fs.readdir(absDir).catch(() => []);
      
      const reviews: Record<string, unknown> = {};
      
      // 读取各类审查文件
      for (const file of files) {
        if (file === 'code-review.json') {
          try {
            const raw = await fs.readFile(path.join(absDir, file), 'utf8');
            reviews.code_review = JSON.parse(raw);
          } catch { /* ignore */ }
        } else if (file === 'design-review.json') {
          try {
            const raw = await fs.readFile(path.join(absDir, file), 'utf8');
            reviews.design_review = JSON.parse(raw);
          } catch { /* ignore */ }
        } else if (file === 'qa-signoff.json') {
          try {
            const raw = await fs.readFile(path.join(absDir, file), 'utf8');
            reviews.qa_signoff = JSON.parse(raw);
          } catch { /* ignore */ }
        }
      }

      return reply.send({
        ok: true,
        audit_id: auditId,
        reviews,
        has_code_review: !!reviews.code_review,
        has_design_review: !!reviews.design_review,
        has_qa_signoff: !!reviews.qa_signoff,
      });
    } catch (error) {
      app.log.error(error, 'Failed to read audit reviews');
      return reply.status(404).send({ ok: false, error: 'Audit directory not found' });
    }
  });

  // GET /api/audits/:auditId/markdown?kind=progress|issues - 读取审核报告 Markdown（支持新旧结构）
  app.get('/api/audits/:auditId/markdown', async (request, reply) => {
    const { auditId } = request.params as { auditId: string };
    const { kind } = request.query as { kind?: string };

    if (!auditId || !isSafeId(auditId)) {
      return reply.status(400).send({ ok: false, error: 'Invalid audit id' });
    }

    const k = (kind || 'progress').toLowerCase();
    const filename = k === 'issues' ? 'issues.md' : 'progress.md';
    const baseDir = path.posix.join('workflows/project/logs/audits');

    try {
      const absBaseDir = safeResolveUnderProject(config.projectRoot, baseDir);
      let content: string | null = null;
      let relPath: string;

      // 尝试新结构：目录/progress.md 或 目录/issues.md
      const newPath = path.join(absBaseDir, auditId, filename);
      try {
        content = await fs.readFile(newPath, 'utf8');
        relPath = path.posix.join(baseDir, auditId, filename);
      } catch {
        // 尝试旧结构
        const legacySuffix = k === 'issues' ? '-issues.md' : '-progress.md';
        const legacyPath = path.join(absBaseDir, `${auditId}${legacySuffix}`);
        content = await fs.readFile(legacyPath, 'utf8');
        relPath = path.posix.join(baseDir, `${auditId}${legacySuffix}`);
      }

      return reply.send({ ok: true, audit_id: auditId, kind: k, path: relPath, content });
    } catch (error) {
      app.log.error(error, 'Failed to read audit markdown');
      return reply.status(404).send({ ok: false, error: 'Audit markdown not found' });
    }
  });

  // ============================================
  // 标注管理 API
  // ============================================

  // GET /api/audits/:auditId/annotations - 获取标注
  app.get('/api/audits/:auditId/annotations', async (request, reply) => {
    const { auditId } = request.params as { auditId: string };

    if (!auditId || !isSafeId(auditId)) {
      return reply.status(400).send({ ok: false, error: 'Invalid audit id' });
    }

    const annotationsPath = path.posix.join('workflows/project/logs/audits', auditId, 'annotations.json');

    try {
      const absPath = safeResolveUnderProject(config.projectRoot, annotationsPath);
      const content = await fs.readFile(absPath, 'utf8');
      const annotations = JSON.parse(content);
      return reply.send({ ok: true, audit_id: auditId, ...annotations });
    } catch {
      // 没有标注文件，返回空数据
      return reply.send({
        ok: true,
        audit_id: auditId,
        annotations: [],
        skip_rules: [],
        created_at: null,
        updated_at: null,
      });
    }
  });

  // POST /api/audits/:auditId/annotations - 添加标注
  app.post('/api/audits/:auditId/annotations', async (request, reply) => {
    const { auditId } = request.params as { auditId: string };
    const body = request.body as {
      target: { review_type: string; issue_index?: number; file?: string; line?: number; section?: string };
      status: string;
      reason?: string;
      comment?: string;
      action_ticket?: string;
    };

    if (!auditId || !isSafeId(auditId)) {
      return reply.status(400).send({ ok: false, error: 'Invalid audit id' });
    }

    if (!body.target || !body.status) {
      return reply.status(400).send({ ok: false, error: 'Missing required fields: target, status' });
    }

    const annotationsPath = path.posix.join('workflows/project/logs/audits', auditId, 'annotations.json');
    const absPath = safeResolveUnderProject(config.projectRoot, annotationsPath);

    try {
      // 读取或创建标注文件
      let data: { audit_id: string; annotations: any[]; skip_rules: any[]; created_at: string; updated_at: string };
      try {
        const content = await fs.readFile(absPath, 'utf8');
        data = JSON.parse(content);
      } catch {
        data = {
          audit_id: auditId,
          annotations: [],
          skip_rules: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // 生成新标注
      const newAnnotation = {
        id: `ann-${Date.now().toString(36)}`,
        target: body.target,
        status: body.status,
        reason: body.reason || '',
        comment: body.comment || '',
        action_ticket: body.action_ticket,
        annotator: 'user',
        created_at: new Date().toISOString(),
      };

      data.annotations.push(newAnnotation);
      data.updated_at = new Date().toISOString();

      // 保存
      await fs.writeFile(absPath, JSON.stringify(data, null, 2), 'utf8');

      return reply.send({ ok: true, annotation: newAnnotation });
    } catch (error) {
      app.log.error(error, 'Failed to add annotation');
      return reply.status(500).send({ ok: false, error: 'Failed to add annotation' });
    }
  });

  // PUT /api/audits/:auditId/annotations/:annId - 更新标注
  app.put('/api/audits/:auditId/annotations/:annId', async (request, reply) => {
    const { auditId, annId } = request.params as { auditId: string; annId: string };
    const body = request.body as {
      status?: string;
      reason?: string;
      comment?: string;
      action_ticket?: string;
    };

    if (!auditId || !isSafeId(auditId) || !annId) {
      return reply.status(400).send({ ok: false, error: 'Invalid audit id or annotation id' });
    }

    const annotationsPath = path.posix.join('workflows/project/logs/audits', auditId, 'annotations.json');
    const absPath = safeResolveUnderProject(config.projectRoot, annotationsPath);

    try {
      const content = await fs.readFile(absPath, 'utf8');
      const data = JSON.parse(content);

      const idx = data.annotations.findIndex((a: any) => a.id === annId);
      if (idx === -1) {
        return reply.status(404).send({ ok: false, error: 'Annotation not found' });
      }

      // 更新字段
      if (body.status) data.annotations[idx].status = body.status;
      if (body.reason !== undefined) data.annotations[idx].reason = body.reason;
      if (body.comment !== undefined) data.annotations[idx].comment = body.comment;
      if (body.action_ticket !== undefined) data.annotations[idx].action_ticket = body.action_ticket;
      data.annotations[idx].updated_at = new Date().toISOString();
      data.updated_at = new Date().toISOString();

      await fs.writeFile(absPath, JSON.stringify(data, null, 2), 'utf8');

      return reply.send({ ok: true, annotation: data.annotations[idx] });
    } catch (error) {
      app.log.error(error, 'Failed to update annotation');
      return reply.status(500).send({ ok: false, error: 'Failed to update annotation' });
    }
  });

  // DELETE /api/audits/:auditId/annotations/:annId - 删除标注
  app.delete('/api/audits/:auditId/annotations/:annId', async (request, reply) => {
    const { auditId, annId } = request.params as { auditId: string; annId: string };

    if (!auditId || !isSafeId(auditId) || !annId) {
      return reply.status(400).send({ ok: false, error: 'Invalid audit id or annotation id' });
    }

    const annotationsPath = path.posix.join('workflows/project/logs/audits', auditId, 'annotations.json');
    const absPath = safeResolveUnderProject(config.projectRoot, annotationsPath);

    try {
      const content = await fs.readFile(absPath, 'utf8');
      const data = JSON.parse(content);

      const idx = data.annotations.findIndex((a: any) => a.id === annId);
      if (idx === -1) {
        return reply.status(404).send({ ok: false, error: 'Annotation not found' });
      }

      data.annotations.splice(idx, 1);
      data.updated_at = new Date().toISOString();

      await fs.writeFile(absPath, JSON.stringify(data, null, 2), 'utf8');

      return reply.send({ ok: true, deleted: annId });
    } catch (error) {
      app.log.error(error, 'Failed to delete annotation');
      return reply.status(500).send({ ok: false, error: 'Failed to delete annotation' });
    }
  });

  // POST /api/audits/:auditId/skip-rules - 添加跳过规则
  app.post('/api/audits/:auditId/skip-rules', async (request, reply) => {
    const { auditId } = request.params as { auditId: string };
    const body = request.body as {
      pattern: { file?: string; description_contains?: string };
      reason?: string;
      expires_at?: string;
    };

    if (!auditId || !isSafeId(auditId)) {
      return reply.status(400).send({ ok: false, error: 'Invalid audit id' });
    }

    if (!body.pattern) {
      return reply.status(400).send({ ok: false, error: 'Missing required field: pattern' });
    }

    const annotationsPath = path.posix.join('workflows/project/logs/audits', auditId, 'annotations.json');
    const absPath = safeResolveUnderProject(config.projectRoot, annotationsPath);

    try {
      let data: { audit_id: string; annotations: any[]; skip_rules: any[]; created_at: string; updated_at: string };
      try {
        const content = await fs.readFile(absPath, 'utf8');
        data = JSON.parse(content);
      } catch {
        data = {
          audit_id: auditId,
          annotations: [],
          skip_rules: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const newRule = {
        id: `skip-${Date.now().toString(36)}`,
        pattern: body.pattern,
        reason: body.reason || '',
        created_at: new Date().toISOString(),
        expires_at: body.expires_at,
      };

      data.skip_rules.push(newRule);
      data.updated_at = new Date().toISOString();

      await fs.writeFile(absPath, JSON.stringify(data, null, 2), 'utf8');

      return reply.send({ ok: true, skip_rule: newRule });
    } catch (error) {
      app.log.error(error, 'Failed to add skip rule');
      return reply.status(500).send({ ok: false, error: 'Failed to add skip rule' });
    }
  });

  // GET /api/config/audit-profiles - 获取审查配置列表
  app.get('/api/config/audit-profiles', async (_request, reply) => {
    const configPath = path.posix.join('workflows/project/config/audit-profiles.yaml');

    try {
      const absPath = safeResolveUnderProject(config.projectRoot, configPath);
      const content = await fs.readFile(absPath, 'utf8');
      // 简单解析 YAML（只提取 profiles 名称）
      const profileNames: string[] = [];
      const lines = content.split('\n');
      let inProfiles = false;
      for (const line of lines) {
        if (line.startsWith('profiles:')) {
          inProfiles = true;
          continue;
        }
        if (inProfiles && /^  [a-z-]+:/.test(line)) {
          const name = line.trim().replace(':', '');
          profileNames.push(name);
        }
        if (inProfiles && /^[a-z]/.test(line) && !line.startsWith('profiles:')) {
          break;
        }
      }
      return reply.send({ ok: true, profiles: profileNames });
    } catch (error) {
      app.log.error(error, 'Failed to read audit profiles');
      return reply.send({ ok: true, profiles: ['all'] });
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
