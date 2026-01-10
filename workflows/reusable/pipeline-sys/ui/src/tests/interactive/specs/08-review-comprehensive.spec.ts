/**
 * 08-review-comprehensive.spec.ts
 * 审查中心完整测试
 */

import { TestConfig } from '../config';

export const ReviewComprehensiveTests = {
  name: '审查中心完整测试',

  tests: [
    // === 页面加载测试 ===
    {
      id: 'review-comp-001',
      name: '审查页面应加载',
      description: '访问审查页面应正确显示',
      steps: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'url', url: `${TestConfig.baseUrl}/review` },
          description: '导航到审查页面',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { format: 'png' },
          description: '截图审查页面',
        },
      ],
    },

    // === 统计卡片测试 ===
    {
      id: 'review-comp-002',
      name: '统计卡片应显示',
      description: '页面应显示4个统计卡片',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const text = document.body.textContent; return text.includes("总审查数") && text.includes("已通过") && text.includes("待处理") && text.includes("未通过"); }',
          },
          expected: true,
          description: '验证4个统计卡片存在',
        },
      ],
    },
    {
      id: 'review-comp-003',
      name: '统计数字应显示',
      description: '统计卡片应显示数字',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: '() => { return document.body.textContent.match(/\\d+/g)?.length >= 4; }',
          },
          expected: true,
          description: '验证统计数字存在',
        },
      ],
    },

    // === 操作按钮测试 ===
    {
      id: 'review-comp-004',
      name: '操作按钮应显示',
      description: '页面应有刷新、一键审核、发起审查按钮',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const text = document.body.textContent; return text.includes("刷新") && text.includes("一键完整审核") && text.includes("发起审查"); }',
          },
          expected: true,
          description: '验证3个操作按钮',
        },
      ],
    },

    // === 标签页测试 ===
    {
      id: 'review-comp-005',
      name: '标签页应显示',
      description: '页面应有审核报告和审查记录标签',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const text = document.body.textContent; return text.includes("审核报告") && text.includes("审查记录"); }',
          },
          expected: true,
          description: '验证两个标签页',
        },
      ],
    },
    {
      id: 'review-comp-006',
      name: '标签页应显示数量',
      description: '标签页应显示报告/记录数量',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const text = document.body.textContent; return /审核报告\\s*（?\\(?\\d+\\)?）?/.test(text) && /审查记录\\s*（?\\(?\\d+\\)?）?/.test(text); }',
          },
          expected: true,
          description: '验证标签页数量显示',
        },
      ],
    },

    // === 审核报告测试 ===
    {
      id: 'review-comp-007',
      name: '审核报告列表应显示',
      description: '页面应显示审核报告列表',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: '() => document.body.textContent.includes("AUDIT-")',
          },
          expected: true,
          description: '验证审核报告ID',
        },
      ],
    },
    {
      id: 'review-comp-008',
      name: '报告应显示 HEALTHY 状态',
      description: '报告应显示健康状态',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: '() => document.body.textContent.includes("HEALTHY")',
          },
          expected: true,
          description: '验证HEALTHY状态',
        },
      ],
    },
    {
      id: 'review-comp-009',
      name: '报告应显示通过率',
      description: '报告应显示通过率指标',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: '() => document.body.textContent.includes("通过率")',
          },
          expected: true,
          description: '验证通过率显示',
        },
      ],
    },
    {
      id: 'review-comp-010',
      name: '报告应显示决策建议',
      description: '报告应显示PROCEED决策',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => document.body.textContent.includes("决策建议") || document.body.textContent.includes("PROCEED")',
          },
          expected: true,
          description: '验证决策建议',
        },
      ],
    },

    // === 报告详情弹窗测试 ===
    {
      id: 'review-comp-011',
      name: '点击报告应展开详情',
      description: '点击审核报告应显示详情弹窗',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("AUDIT-")); if (btn) { btn.click(); return true; } return false; }',
          },
          description: '点击第一个报告',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待弹窗展开',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: '() => document.body.textContent.includes("概览")',
          },
          expected: true,
          description: '验证概览标签显示',
        },
      ],
    },
    {
      id: 'review-comp-012',
      name: '详情弹窗应有4个标签',
      description: '弹窗应显示概览、progress.md、issues.md、原始JSON',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const text = document.body.textContent; return text.includes("概览") && text.includes("progress.md") && text.includes("issues.md") && text.includes("原始 JSON"); }',
          },
          expected: true,
          description: '验证4个标签',
        },
      ],
    },
    {
      id: 'review-comp-013',
      name: '概览应显示关键指标',
      description: '概览应显示通过率、审查数等指标',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const text = document.body.textContent; return text.includes("关键指标") || (text.includes("overall_pass_rate") && text.includes("reviews_completed")); }',
          },
          expected: true,
          description: '验证关键指标',
        },
      ],
    },
    {
      id: 'review-comp-014',
      name: '概览应显示建议',
      description: '概览应显示建议和下一步',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: '() => document.body.textContent.includes("建议")',
          },
          expected: true,
          description: '验证建议显示',
        },
      ],
    },
    {
      id: 'review-comp-015',
      name: 'progress.md 应可查看',
      description: '切换到progress.md应显示进度报告',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent === "progress.md"); if (btn) { btn.click(); return true; } return false; }',
          },
          description: '点击progress.md标签',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待切换',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: '() => document.body.textContent.includes("进度报告")',
          },
          expected: true,
          description: '验证进度报告标题',
        },
      ],
    },
    {
      id: 'review-comp-016',
      name: 'issues.md 应可查看',
      description: '切换到issues.md应显示问题报告',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent === "issues.md"); if (btn) { btn.click(); return true; } return false; }',
          },
          description: '点击issues.md标签',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待切换',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: '() => document.body.textContent.includes("问题报告")',
          },
          expected: true,
          description: '验证问题报告标题',
        },
      ],
    },
    {
      id: 'review-comp-017',
      name: '原始JSON应可查看',
      description: '切换到原始JSON应显示JSON数据',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("原始 JSON")); if (btn) { btn.click(); return true; } return false; }',
          },
          description: '点击原始JSON标签',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待切换',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: '() => document.body.textContent.includes("audit_id")',
          },
          expected: true,
          description: '验证JSON内容',
        },
      ],
    },

    // === 审查记录测试 ===
    {
      id: 'review-comp-018',
      name: '审查记录标签可切换',
      description: '点击审查记录标签应显示记录列表',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const closeBtn = document.querySelector("button[class*=close], button:has-text(\\"×\\")") || Array.from(document.querySelectorAll("button")).find(b => b.textContent === "×"); if (closeBtn) closeBtn.click(); return true; }',
          },
          description: '关闭弹窗',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待关闭',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("审查记录")); if (btn) { btn.click(); return true; } return false; }',
          },
          description: '点击审查记录标签',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待切换',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: '() => document.body.textContent.includes("全部类型")',
          },
          expected: true,
          description: '验证类型筛选器显示',
        },
      ],
    },
    {
      id: 'review-comp-019',
      name: '审查记录应显示不同类型',
      description: '记录应包含代码审查、设计审查、QA签字等',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const text = document.body.textContent; return text.includes("代码审查") || text.includes("设计审查") || text.includes("QA签字"); }',
          },
          expected: true,
          description: '验证审查类型',
        },
      ],
    },
    {
      id: 'review-comp-020',
      name: '审查记录应显示状态',
      description: '记录应显示PASSED或APPROVED状态',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => document.body.textContent.includes("PASSED") || document.body.textContent.includes("APPROVED")',
          },
          expected: true,
          description: '验证审查状态',
        },
      ],
    },
    {
      id: 'review-comp-021',
      name: '审查记录应显示评分',
      description: '代码/设计审查应显示评分',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: '() => /评分.*\\d+\\/100/.test(document.body.textContent)',
          },
          expected: true,
          description: '验证评分显示',
        },
      ],
    },
    {
      id: 'review-comp-022',
      name: '类型筛选器应可用',
      description: '类型筛选下拉框应可展开',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const select = document.querySelector("select") || document.querySelector("[role=combobox]"); return select !== null; }',
          },
          expected: true,
          description: '验证筛选器存在',
        },
      ],
    },

    // === 发起审查测试 ===
    {
      id: 'review-comp-023',
      name: '发起审查弹窗应可打开',
      description: '点击发起审查应显示弹窗',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("发起审查")); if (btn) { btn.click(); return true; } return false; }',
          },
          description: '点击发起审查按钮',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待弹窗打开',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: '() => document.body.textContent.includes("审查类型")',
          },
          expected: true,
          description: '验证审查类型选项显示',
        },
      ],
    },
    {
      id: 'review-comp-024',
      name: '发起审查弹窗应有完整选项',
      description: '弹窗应显示类型、周期、内容、模式选项',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const text = document.body.textContent; return text.includes("审查类型") && text.includes("统计周期") && text.includes("审核内容") && text.includes("执行模式"); }',
          },
          expected: true,
          description: '验证4个选项区域',
        },
      ],
    },
    {
      id: 'review-comp-025',
      name: '审核内容复选框应可勾选',
      description: '代码审查、设计审查、QA签字复选框应可用',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const text = document.body.textContent; return text.includes("Code Review") && text.includes("Design Review") && text.includes("QA Signoff"); }',
          },
          expected: true,
          description: '验证审核内容选项',
        },
      ],
    },
    {
      id: 'review-comp-026',
      name: '发起审查API错误应正确处理',
      description: '当Runner未运行时应显示错误信息',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const submitBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("发起审查") && !b.textContent.includes("➕")); if (submitBtn) { submitBtn.click(); return true; } return false; }',
          },
          description: '点击提交按钮',
        },
        {
          action: 'sleep',
          duration: 2000,
          description: '等待API响应',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function:
              '() => { const text = document.body.textContent; return text.includes("Failed") || text.includes("Error") || text.includes("失败") || text.includes("错误") || text.includes("成功"); }',
          },
          expected: true,
          description: '验证有结果反馈（成功或错误）',
        },
      ],
    },
  ],
};

export default ReviewComprehensiveTests;
