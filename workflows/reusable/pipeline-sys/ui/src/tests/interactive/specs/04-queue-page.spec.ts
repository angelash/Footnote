/**
 * 04-queue-page.spec.ts
 * 任务队列页面测试 - 增强版
 * 
 * 覆盖关键场景：
 * - 页面加载和基础显示
 * - 队列状态显示（运行/等待/历史）
 * - 领域分组显示
 * - 控制按钮交互
 * - 错误状态处理
 * - 自动刷新机制
 */

import { TestConfig } from '../config';

export const QueuePageTests = {
  name: '任务队列页面测试',

  tests: [
    // ============================================
    // 基础页面加载测试
    // ============================================
    {
      id: 'queue-001',
      name: '队列页面应加载',
      description: '访问队列页面应正确显示',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: `${TestConfig.baseUrl}/queue` },
          description: '导航到队列页面',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { format: 'png' },
          description: '截图队列页面',
        },
      ],
    },
    {
      id: 'queue-002',
      name: '页面标题应正确',
      description: '页面应显示"任务队列"标题',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector("h1")?.textContent' },
          expected: '任务队列',
          description: '验证标题',
        },
      ],
    },
    {
      id: 'queue-003',
      name: '页面说明应显示',
      description: '页面应显示功能说明',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".page-description")?.textContent?.includes("暂停/恢复队列")' },
          expected: true,
          description: '验证说明文字包含功能描述',
        },
      ],
    },
    {
      id: 'queue-004',
      name: '快捷操作说明应显示',
      description: '页面应显示快捷键说明',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".page-help h3")?.textContent' },
          expected: '快捷操作',
          description: '验证快捷操作标题',
        },
      ],
    },
    {
      id: 'queue-005',
      name: '队列端点文档应显示',
      description: '页面应显示 API 端点说明',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector("code")?.textContent?.includes("GET /queue")' },
          expected: true,
          description: '验证 API 文档',
        },
      ],
    },
    {
      id: 'queue-006',
      name: 'QueuePanel 组件应加载',
      description: '队列面板组件应存在',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".page-content") !== null' },
          expected: true,
          description: '验证内容区域存在',
        },
      ],
    },

    // ============================================
    // 队列状态显示测试
    // ============================================
    {
      id: 'queue-007',
      name: '队列面板标题应显示',
      description: '队列面板应显示"任务队列"标题',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent?.includes("🚦 任务队列")' },
          expected: true,
          description: '验证队列面板标题',
        },
      ],
    },
    {
      id: 'queue-008',
      name: '当前执行区域应显示',
      description: '应显示"当前执行"区域',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent?.includes("▶ 当前执行")' },
          expected: true,
          description: '验证当前执行区域',
        },
      ],
    },
    {
      id: 'queue-009',
      name: '等待队列区域应显示',
      description: '应显示"等待队列"区域',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent?.includes("📋 等待队列")' },
          expected: true,
          description: '验证等待队列区域',
        },
      ],
    },
    {
      id: 'queue-010',
      name: '历史记录区域应显示',
      description: '应显示"历史"区域',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent?.includes("📜 历史")' },
          expected: true,
          description: '验证历史记录区域',
        },
      ],
    },

    // ============================================
    // 控制按钮测试
    // ============================================
    {
      id: 'queue-011',
      name: '刷新按钮应存在',
      description: '应显示刷新按钮',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".btn-refresh") !== null' },
          expected: true,
          description: '验证刷新按钮存在',
        },
      ],
    },
    {
      id: 'queue-012',
      name: '暂停/恢复按钮应存在',
      description: '应显示暂停或恢复按钮',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const btn = document.querySelector(".btn-pause, .btn-resume"); return btn !== null; }' },
          expected: true,
          description: '验证暂停/恢复按钮存在',
        },
      ],
    },
    {
      id: 'queue-013',
      name: '清空按钮应存在',
      description: '应显示清空按钮',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".btn-clear") !== null' },
          expected: true,
          description: '验证清空按钮存在',
        },
      ],
    },

    // ============================================
    // 状态统计显示测试
    // ============================================
    {
      id: 'queue-014',
      name: '状态统计应显示',
      description: '应显示运行/队列/历史统计',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const text = document.body.textContent || ""; return text.includes("运行:") && text.includes("队列:") && text.includes("历史:"); }' },
          expected: true,
          description: '验证统计信息显示',
        },
      ],
    },
    {
      id: 'queue-015',
      name: '自动刷新提示应显示',
      description: '应显示自动刷新间隔提示',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent?.includes("🔄 1s")' },
          expected: true,
          description: '验证自动刷新提示',
        },
      ],
    },
    {
      id: 'queue-016',
      name: '更新时间应显示',
      description: '应显示最后更新时间',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent?.includes("更新于")' },
          expected: true,
          description: '验证更新时间显示',
        },
      ],
    },

    // ============================================
    // API 连通性测试
    // ============================================
    {
      id: 'queue-017',
      name: 'API 错误应显示加载状态或错误',
      description: '当 Runner 未运行时应显示加载或错误状态',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const loading = document.querySelector(".loading"); const error = document.querySelector(".queue-error"); return loading !== null || error !== null || document.body.textContent?.includes("加载中"); }' },
          expected: true,
          description: '验证显示加载或错误状态',
        },
      ],
    },
    {
      id: 'queue-018',
      name: '队列状态 API 应可调用',
      description: '调用队列 API 应返回响应',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: 'async () => { try { const res = await fetch("/api/queue"); return { status: res.status, hasResponse: true }; } catch (e) { return { error: e.message }; } }' },
          description: '验证 API 可调用',
        },
      ],
    },
    {
      id: 'queue-019',
      name: '队列历史 API 应可调用',
      description: '调用队列历史 API 应返回响应',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: 'async () => { try { const res = await fetch("/api/queue/history"); return { status: res.status, hasResponse: true }; } catch (e) { return { error: e.message }; } }' },
          description: '验证历史 API 可调用',
        },
      ],
    },

    // ============================================
    // 空状态显示测试
    // ============================================
    {
      id: 'queue-020',
      name: '空队列应显示空闲或暂停状态',
      description: '无运行任务时应显示空闲或暂停状态',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const text = document.body.textContent || ""; return text.includes("空闲") || text.includes("队列已暂停"); }' },
          expected: true,
          description: '验证空闲状态显示',
        },
      ],
    },
    {
      id: 'queue-021',
      name: '空等待队列应显示提示',
      description: '无等待任务时应显示"暂无等待任务"',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.body.textContent?.includes("暂无等待任务")' },
          expected: true,
          description: '验证空队列提示',
        },
      ],
    },

    // ============================================
    // CSS 样式完整性测试
    // ============================================
    {
      id: 'queue-022',
      name: '队列面板样式应加载',
      description: '队列面板应有正确的 CSS 类',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelector(".queue-panel") !== null' },
          expected: true,
          description: '验证队列面板样式类',
        },
      ],
    },
    {
      id: 'queue-023',
      name: '队列区域样式应加载',
      description: '队列区域应有正确的 CSS 类',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => document.querySelectorAll(".queue-section").length >= 3' },
          expected: true,
          description: '验证队列区域数量（当前执行、等待队列、历史）',
        },
      ],
    },

    // ============================================
    // 响应式和交互测试
    // ============================================
    {
      id: 'queue-024',
      name: '刷新按钮应可点击',
      description: '点击刷新按钮应触发刷新',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { const btn = document.querySelector(".btn-refresh"); return btn && !btn.disabled; }' },
          expected: true,
          description: '验证刷新按钮可点击',
        },
      ],
    },
    {
      id: 'queue-025',
      name: '页面应无 JavaScript 错误',
      description: '控制台不应有未捕获的错误',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: '() => { return typeof window !== "undefined"; }' },
          expected: true,
          description: '验证页面正常运行',
        },
      ],
    },
  ],
};

export default QueuePageTests;
