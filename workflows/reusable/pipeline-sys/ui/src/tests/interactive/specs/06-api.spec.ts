/**
 * 06-api.spec.ts
 * API 测试
 */

import { TestConfig } from '../config';

export const ApiTests = {
  name: 'API 测试',

  tests: [
    {
      id: 'api-001',
      name: 'runs API 应工作',
      description: '/api/runs 应返回运行列表',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: TestConfig.baseUrl },
          description: '导航到应用',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: 'async () => { const res = await fetch("/api/runs"); const data = await res.json(); return { ok: data.ok, hasRuns: Array.isArray(data.runs) }; }' },
          expected: { ok: true, hasRuns: true },
          description: '验证 runs API',
        },
      ],
    },
    {
      id: 'api-002',
      name: 'queue API 状态',
      description: '/api/queue 应返回响应',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: 'async () => { const res = await fetch("/api/queue"); return { status: res.status }; }' },
          description: '检查队列 API 状态码',
        },
      ],
    },
    {
      id: 'api-003',
      name: 'review API 应工作',
      description: '/api/review/audits 应返回审核列表',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: 'async () => { const res = await fetch("/api/review/audits"); const data = await res.json(); return { ok: data.ok, hasAudits: Array.isArray(data.audits) }; }' },
          expected: { ok: true, hasAudits: true },
          description: '验证 review API',
        },
      ],
    },
    {
      id: 'api-004',
      name: 'run 详情 API 应工作',
      description: '/api/runs/:id 应返回运行详情',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: 'async () => { const runsRes = await fetch("/api/runs"); const runsData = await runsRes.json(); if (!runsData.runs || runsData.runs.length === 0) return { skip: true }; const runId = runsData.runs[0].run_id; const detailRes = await fetch(`/api/runs/${runId}`); const detailData = await detailRes.json(); return { ok: detailData.ok, hasGraph: !!detailData.graph }; }' },
          description: '验证 run 详情 API',
        },
      ],
    },
    {
      id: 'api-005',
      name: 'review 记录 API 应工作',
      description: '/api/review/records 应返回审查记录',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: 'async () => { const res = await fetch("/api/review/records"); const data = await res.json(); return { ok: data.ok, hasRecords: Array.isArray(data.records) }; }' },
          description: '验证 review records API',
        },
      ],
    },
    {
      id: 'api-006',
      name: 'task flowspecs API',
      description: '/api/task/flowspecs 应返回可用流程',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: 'async () => { const res = await fetch("/api/task/flowspecs"); return { status: res.status }; }' },
          description: '检查 flowspecs API',
        },
      ],
    },
  ],
};

export default ApiTests;
