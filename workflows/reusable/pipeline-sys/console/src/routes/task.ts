/**
 * Task Routes - 任务提交路由
 * 代理到 WSL Runner 的任务相关端点
 */

import { FastifyInstance } from 'fastify';
import { config } from '../config.js';

const RUNNER_BASE = config.runnerBaseUrl;

/**
 * 注册任务相关路由
 */
export async function registerTaskRoutes(app: FastifyInstance): Promise<void> {
  // ============================================
  // 制作人入口
  // ============================================

  // POST /api/task/intake - 制作人统一入口（智能派单）
  app.post('/api/task/intake', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit intake task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/role - 通用角色路由
  app.post('/api/task/role', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/run-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit role task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // ============================================
  // L3 执行层
  // ============================================

  // POST /api/task/l3/execute - 通用执行
  app.post('/api/task/l3/execute', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/l3/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit execute task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/l3/writer - 编剧
  app.post('/api/task/l3/writer', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/l3/writer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit writer task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/l3/tester - 测试员
  app.post('/api/task/l3/tester', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/l3/tester`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit tester task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/l3/scripter - 脚本程序员
  app.post('/api/task/l3/scripter', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/l3/scripter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit scripter task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/l3/ui-engineer - UI工程师
  app.post('/api/task/l3/ui-engineer', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/l3/ui-engineer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit ui-engineer task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/l3/level-designer - 关卡策划
  app.post('/api/task/l3/level-designer', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/l3/level-designer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit level-designer task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // ============================================
  // L3 美术层
  // ============================================

  // POST /api/task/l3/environment-artist - 场景美术
  app.post('/api/task/l3/environment-artist', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/l3/environment-artist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit environment-artist task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/l3/character-artist - 角色美术
  app.post('/api/task/l3/character-artist', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/l3/character-artist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit character-artist task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/l3/animator - 动画师
  app.post('/api/task/l3/animator', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/l3/animator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit animator task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/l3/vfx-artist - 特效师
  app.post('/api/task/l3/vfx-artist', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/l3/vfx-artist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit vfx-artist task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // ============================================
  // L2 组长层
  // ============================================

  // POST /api/task/l2/level-lead - 关卡组长
  app.post('/api/task/l2/level-lead', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/l2/level-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit level-lead task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/l2/art-lead - 美术组长
  app.post('/api/task/l2/art-lead', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/l2/art-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit art-lead task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/lead/decompose - 任务分解
  app.post('/api/task/lead/decompose', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/lead/decompose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit decompose task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // ============================================
  // 白盒快速通道
  // ============================================

  // POST /api/task/whitebox/scene - 场景白盒
  app.post('/api/task/whitebox/scene', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/whitebox/scene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit whitebox scene task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/whitebox/character - 角色白盒
  app.post('/api/task/whitebox/character', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/whitebox/character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit whitebox character task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  // POST /api/task/whitebox/object - 物件白盒
  app.post('/api/task/whitebox/object', async (request, reply) => {
    try {
      const response = await fetch(`${RUNNER_BASE}/whitebox/object`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      app.log.error(error, 'Failed to submit whitebox object task');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to submit task',
      });
    }
  });

  app.log.info('Task routes registered');
}
