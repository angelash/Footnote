/**
 * 自动化测试运行器
 * 通过 MCP 浏览器工具执行游戏测试
 * @module tests/auto/TestRunner
 */

import type { ITestScript, ITestResult, ITestStep, IExpectation } from '@/systems/debug/DebugCommands';

// ==================== 类型定义 ====================

/**
 * 测试套件
 */
export interface ITestSuite {
  name: string;
  description?: string;
  scripts: ITestScript[];
}

/**
 * 测试报告
 */
export interface ITestReport {
  suiteName: string;
  startTime: Date;
  endTime: Date;
  totalTests: number;
  passed: number;
  failed: number;
  results: ITestResult[];
  coverage: ICoverage;
}

/**
 * 覆盖率统计
 */
export interface ICoverage {
  zones: { visited: string[]; total: number };
  dialogues: { triggered: string[]; total: number };
  cards: { obtained: string[]; total: number };
  abilities: { unlocked: string[]; total: number };
}

// ==================== 测试脚本定义 ====================

/**
 * 序章测试脚本
 */
export const PROLOGUE_TEST: ITestScript = {
  name: '序章流程测试',
  description: '测试 C0-Z1 到 C0-Z4 的基本流程',
  setup: [
    { action: 'reset' },
  ],
  steps: [
    // 初始状态验证
    {
      action: 'wait',
      params: { ms: 500 },
      expect: { type: 'zone', target: 'current', operator: 'eq', value: 'C0-Z1' },
    },
    // 移动到交互点
    {
      action: 'navigateTo',
      params: { x: 200, y: 600 },
      delay: 500,
    },
    // 获取身份卡
    {
      action: 'obtainCard',
      params: { cardId: 'CARD_C0_01' },
      expect: { type: 'card', target: 'CARD_C0_01', operator: 'exists', value: true },
    },
    // 前往 C0-Z2
    {
      action: 'teleport',
      params: { zoneId: 'C0-Z2' },
      delay: 500,
      expect: { type: 'zone', target: 'current', operator: 'eq', value: 'C0-Z2' },
    },
    // 触发对话
    {
      action: 'triggerDialogue',
      params: { dialogueId: 'DLG_C0_BREAKFAST_OWNER' },
      delay: 200,
    },
    {
      action: 'skipDialogue',
      delay: 200,
    },
    // 前往 C0-Z3
    {
      action: 'teleport',
      params: { zoneId: 'C0-Z3' },
      delay: 500,
    },
    // 前往 C0-Z4
    {
      action: 'teleport',
      params: { zoneId: 'C0-Z4' },
      delay: 500,
    },
    // 完成序章
    {
      action: 'completeZone',
      params: { zoneId: 'C0-Z4' },
    },
  ],
  cleanup: [],
};

/**
 * 第一章测试脚本
 */
export const CHAPTER1_TEST: ITestScript = {
  name: '第一章流程测试',
  description: '测试 C1-Z1 到 C1-Z6 的流程',
  setup: [
    { action: 'gotoChapter', params: { chapter: 'C1' } },
  ],
  steps: [
    {
      action: 'wait',
      params: { ms: 500 },
      expect: { type: 'zone', target: 'current', operator: 'contains', value: 'C1' },
    },
    // 遍历 C1 的所有 Zone
    { action: 'teleport', params: { zoneId: 'C1-Z1' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C1-Z1' } },
    { action: 'teleport', params: { zoneId: 'C1-Z2' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C1-Z2' } },
    { action: 'teleport', params: { zoneId: 'C1-Z3' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C1-Z3' } },
    { action: 'teleport', params: { zoneId: 'C1-Z4' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C1-Z4' } },
    { action: 'teleport', params: { zoneId: 'C1-Z5' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C1-Z5' } },
    { action: 'teleport', params: { zoneId: 'C1-Z6' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C1-Z6' } },
  ],
};

/**
 * 能力系统测试脚本
 */
export const ABILITY_TEST: ITestScript = {
  name: '能力系统测试',
  description: '测试三种能力的解锁和使用',
  setup: [
    { action: 'reset' },
    { action: 'teleport', params: { zoneId: 'C2-Z1' } },
  ],
  steps: [
    // 解锁深度感知
    {
      action: 'unlockAbility',
      params: { ability: 'DEPTH_PERCEPTION' },
      expect: { type: 'ability', target: 'DEPTH_PERCEPTION', operator: 'exists', value: true },
    },
    // 解锁深度介入
    {
      action: 'unlockAbility',
      params: { ability: 'DEPTH_INTERVENTION' },
      expect: { type: 'ability', target: 'DEPTH_INTERVENTION', operator: 'exists', value: true },
    },
    // 解锁时间干预
    {
      action: 'unlockAbility',
      params: { ability: 'TIME_INTERVENTION' },
      expect: { type: 'ability', target: 'TIME_INTERVENTION', operator: 'exists', value: true },
    },
    // 验证 P 值变化
    {
      action: 'setP',
      params: { value: 10 },
      expect: { type: 'counter', target: 'P', operator: 'eq', value: 10 },
    },
  ],
};

/**
 * R 值阈值测试脚本
 */
export const R_THRESHOLD_TEST: ITestScript = {
  name: 'R值阈值测试',
  description: '测试 R 值达到不同阈值时的系统行为',
  setup: [
    { action: 'reset' },
  ],
  steps: [
    // R = 3: 系统停顿
    {
      action: 'setR',
      params: { value: 3 },
      expect: { type: 'counter', target: 'R', operator: 'gte', value: 3 },
    },
    { action: 'wait', params: { ms: 500 } },
    // R = 6: F21 弱版
    {
      action: 'setR',
      params: { value: 6 },
      expect: { type: 'counter', target: 'R', operator: 'gte', value: 6 },
    },
    { action: 'wait', params: { ms: 500 } },
    // R = 10: 模型改写
    {
      action: 'setR',
      params: { value: 10 },
      expect: { type: 'counter', target: 'R', operator: 'gte', value: 10 },
    },
  ],
};

/**
 * 结局条件测试脚本
 */
export const ENDING_TEST: ITestScript = {
  name: '结局条件测试',
  description: '测试三种结局的触发条件',
  setup: [
    { action: 'reset' },
    { action: 'unlockAllAbilities' },
  ],
  steps: [
    // 结局 A: 平面稳定
    {
      action: 'setupEnding',
      params: { ending: 'A' },
    },
    {
      action: 'wait',
      params: { ms: 200 },
      expect: { type: 'counter', target: 'R', operator: 'lt', value: 5 },
    },
    // 结局 B: 真实释放
    {
      action: 'setupEnding',
      params: { ending: 'B' },
    },
    {
      action: 'wait',
      params: { ms: 200 },
      expect: { type: 'counter', target: 'R', operator: 'gte', value: 5 },
    },
    // 结局 C: 成为系统
    {
      action: 'setupEnding',
      params: { ending: 'C' },
    },
    {
      action: 'wait',
      params: { ms: 200 },
      expect: { type: 'counter', target: 'R', operator: 'gte', value: 10 },
    },
  ],
};

/**
 * 玩家移动测试脚本
 */
export const MOVEMENT_TEST: ITestScript = {
  name: '玩家移动测试',
  description: '测试玩家移动功能',
  setup: [
    { action: 'teleport', params: { zoneId: 'C0-Z1' } },
    { action: 'wait', params: { ms: 500 } },
  ],
  steps: [
    // 移动到初始位置
    {
      action: 'movePlayer',
      params: { x: 375, y: 600 },
      delay: 100,
    },
    // 导航到目标位置
    {
      action: 'navigateTo',
      params: { x: 200, y: 400 },
      delay: 500,
    },
    // 验证位置
    {
      action: 'wait',
      params: { ms: 100 },
      expect: { type: 'position', target: 'x', operator: 'lte', value: 250 },
    },
  ],
};

// ==================== 测试套件 ====================

/**
 * 完整测试套件
 */
export const FULL_TEST_SUITE: ITestSuite = {
  name: '完整功能测试',
  description: '覆盖所有核心功能的测试套件',
  scripts: [
    MOVEMENT_TEST,
    ABILITY_TEST,
    R_THRESHOLD_TEST,
    PROLOGUE_TEST,
    CHAPTER1_TEST,
    ENDING_TEST,
  ],
};

/**
 * 快速冒烟测试套件
 */
export const SMOKE_TEST_SUITE: ITestSuite = {
  name: '冒烟测试',
  description: '快速验证核心功能',
  scripts: [
    MOVEMENT_TEST,
    ABILITY_TEST,
  ],
};

// ==================== 测试报告生成 ====================

/**
 * 生成测试报告
 */
export function generateReport(results: ITestResult[], suiteName: string): ITestReport {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  // 统计覆盖率（从测试步骤中提取）
  const visitedZones = new Set<string>();
  const triggeredDialogues = new Set<string>();
  const obtainedCards = new Set<string>();
  const unlockedAbilities = new Set<string>();

  results.forEach(r => {
    r.steps.forEach(s => {
      if (s.action === 'teleport' && s.passed) {
        // 从测试结果中提取
      }
    });
  });

  return {
    suiteName,
    startTime: new Date(),
    endTime: new Date(),
    totalTests: results.length,
    passed,
    failed,
    results,
    coverage: {
      zones: { visited: Array.from(visitedZones), total: 57 }, // 45主线 + 12重返
      dialogues: { triggered: Array.from(triggeredDialogues), total: 100 },
      cards: { obtained: Array.from(obtainedCards), total: 50 },
      abilities: { unlocked: Array.from(unlockedAbilities), total: 3 },
    },
  };
}

/**
 * 格式化测试报告
 */
export function formatReport(report: ITestReport): string {
  const lines: string[] = [];
  
  lines.push('═'.repeat(60));
  lines.push(`测试报告: ${report.suiteName}`);
  lines.push('═'.repeat(60));
  lines.push(`总计: ${report.totalTests} | 通过: ${report.passed} | 失败: ${report.failed}`);
  lines.push(`通过率: ${((report.passed / report.totalTests) * 100).toFixed(1)}%`);
  lines.push('-'.repeat(60));
  
  report.results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    lines.push(`${icon} ${index + 1}. ${result.scriptName} (${result.duration}ms)`);
    
    if (!result.passed) {
      result.steps.filter(s => !s.passed).forEach(step => {
        lines.push(`   ❌ ${step.action}: ${step.message}`);
      });
    }
  });
  
  lines.push('═'.repeat(60));
  
  return lines.join('\n');
}

