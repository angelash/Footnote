/**
 * Review Routes - 审查系统路由
 * 代理到 WSL Runner 的审查相关端点
 */

import { FastifyInstance } from 'fastify';
import { config } from '../config.js';

const RUNNER_BASE = config.runnerBaseUrl;

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
    let url = `${RUNNER_BASE}/reviews`;
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (limit) params.append('limit', limit);
    if (params.toString()) url += `?${params.toString()}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to fetch reviews');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch reviews from runner',
      });
    }
  });

  // GET /api/audits - 获取审核报告列表
  app.get('/api/audits', async (request, reply) => {
    const { limit } = request.query as { limit?: string };
    let url = `${RUNNER_BASE}/audits`;
    if (limit) url += `?limit=${limit}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to fetch audits');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch audits from runner',
      });
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
