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
 * 第二章测试脚本 - 深度感知解锁
 */
export const CHAPTER2_TEST: ITestScript = {
  name: '第二章流程测试',
  description: '测试 C2-Z1 到 C2-Z7 的流程，包含深度感知能力解锁',
  setup: [
    { action: 'gotoChapter', params: { chapter: 'C2' } },
  ],
  steps: [
    // 验证进入 C2
    {
      action: 'wait',
      params: { ms: 500 },
      expect: { type: 'zone', target: 'current', operator: 'contains', value: 'C2' },
    },
    // C2-Z1: 深度感知教学区（能力解锁点）
    { action: 'teleport', params: { zoneId: 'C2-Z1' }, delay: 300 },
    {
      action: 'triggerDialogue',
      params: { dialogueId: 'DLG_C2Z1_AUTH_TERMINAL' },
      delay: 200,
    },
    { action: 'skipDialogue', delay: 200 },
    // 解锁深度感知能力
    {
      action: 'unlockAbility',
      params: { ability: 'DEPTH_PERCEPTION' },
      expect: { type: 'ability', target: 'DEPTH_PERCEPTION', operator: 'exists', value: true },
    },
    { action: 'setFlag', params: { name: 'FLAG_DEPTH_SENSE_UNLOCKED', value: true } },
    { action: 'obtainCard', params: { cardId: 'CARD_C2_DEPTH_AUTH' } },
    { action: 'completeZone', params: { zoneId: 'C2-Z1' } },
    
    // C2-Z2: 边缘断口入口
    { action: 'teleport', params: { zoneId: 'C2-Z2' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C2-Z2' } },
    
    // C2-Z3: 许澄诊疗室
    { action: 'teleport', params: { zoneId: 'C2-Z3' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C2-Z3' } },
    
    // C2-Z4: 漂移者聚集点（栖蓝登场，路标修补 R+2）
    { action: 'teleport', params: { zoneId: 'C2-Z4' }, delay: 300 },
    {
      action: 'addR',
      params: { delta: 2 },
      expect: { type: 'counter', target: 'R', operator: 'gte', value: 2 },
    },
    { action: 'completeZone', params: { zoneId: 'C2-Z4' } },
    
    // C2-Z5: 牧平祭坛
    { action: 'teleport', params: { zoneId: 'C2-Z5' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C2-Z5' } },
    
    // C2-Z6: 栖蓝住所
    { action: 'teleport', params: { zoneId: 'C2-Z6' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C2-Z6' } },
    
    // C2-Z7: 深度格裂隙（看到"不存在的房间"）
    { action: 'teleport', params: { zoneId: 'C2-Z7' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C2-Z7' } },
  ],
};

/**
 * 第三章测试脚本 - 深度介入解锁
 */
export const CHAPTER3_TEST: ITestScript = {
  name: '第三章流程测试',
  description: '测试 C3-Z1 到 C3-Z7 的流程，包含深度介入能力解锁',
  setup: [
    { action: 'gotoChapter', params: { chapter: 'C3' } },
    // 确保已解锁深度感知
    { action: 'unlockAbility', params: { ability: 'DEPTH_PERCEPTION' } },
  ],
  steps: [
    // 验证进入 C3
    {
      action: 'wait',
      params: { ms: 500 },
      expect: { type: 'zone', target: 'current', operator: 'contains', value: 'C3' },
    },
    // C3-Z1: 结构崩塌点（能力解锁点）
    { action: 'teleport', params: { zoneId: 'C3-Z1' }, delay: 300 },
    {
      action: 'triggerDialogue',
      params: { dialogueId: 'DLG_C3Z1_INTERVENTION_PERMIT' },
      delay: 200,
    },
    { action: 'skipDialogue', delay: 200 },
    // 解锁深度介入能力
    {
      action: 'unlockAbility',
      params: { ability: 'DEPTH_INTERVENTION' },
      expect: { type: 'ability', target: 'DEPTH_INTERVENTION', operator: 'exists', value: true },
    },
    { action: 'setFlag', params: { name: 'FLAG_DEPTH_INTERVENTION_UNLOCKED', value: true } },
    { action: 'obtainCard', params: { cardId: 'CARD_C3_DEPTH_INTERVENTION' } },
    { action: 'completeZone', params: { zoneId: 'C3-Z1' } },
    
    // C3-Z2: 深度介入教学区（第一次使用深度介入，P+2）
    { action: 'teleport', params: { zoneId: 'C3-Z2' }, delay: 300 },
    { action: 'addP', params: { delta: 2 } },
    { action: 'completeZone', params: { zoneId: 'C3-Z2' } },
    
    // C3-Z3: 阿棠漂移路径
    { action: 'teleport', params: { zoneId: 'C3-Z3' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C3-Z3' } },
    
    // C3-Z4: 版本冲突现场（空椅子任务，R+2）
    { action: 'teleport', params: { zoneId: 'C3-Z4' }, delay: 300 },
    {
      action: 'addR',
      params: { delta: 2 },
      expect: { type: 'counter', target: 'R', operator: 'gte', value: 4 },
    },
    { action: 'completeZone', params: { zoneId: 'C3-Z4' } },
    
    // C3-Z5: 陈匠灯塔
    { action: 'teleport', params: { zoneId: 'C3-Z5' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C3-Z5' } },
    
    // C3-Z6: 收敛运行室外围
    { action: 'teleport', params: { zoneId: 'C3-Z6' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C3-Z6' } },
    
    // C3-Z7: 救援无法归档点（深度介入的永久后果）
    { action: 'teleport', params: { zoneId: 'C3-Z7' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C3-Z7' } },
  ],
};

/**
 * 第四章测试脚本 - 时间干预解锁
 */
export const CHAPTER4_TEST: ITestScript = {
  name: '第四章流程测试',
  description: '测试 C4-Z1 到 C4-Z8 的流程，包含时间干预能力解锁',
  setup: [
    { action: 'gotoChapter', params: { chapter: 'C4' } },
    // 确保已解锁前两个能力
    { action: 'unlockAbility', params: { ability: 'DEPTH_PERCEPTION' } },
    { action: 'unlockAbility', params: { ability: 'DEPTH_INTERVENTION' } },
  ],
  steps: [
    // 验证进入 C4
    {
      action: 'wait',
      params: { ms: 500 },
      expect: { type: 'zone', target: 'current', operator: 'contains', value: 'C4' },
    },
    // C4-Z1: 时间干预教学区
    { action: 'teleport', params: { zoneId: 'C4-Z1' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C4-Z1' } },
    
    // C4-Z2: 因果账本存放处（能力解锁点）
    { action: 'teleport', params: { zoneId: 'C4-Z2' }, delay: 300 },
    {
      action: 'triggerDialogue',
      params: { dialogueId: 'DLG_C4Z2_TIME_AUTH' },
      delay: 200,
    },
    { action: 'skipDialogue', delay: 200 },
    // 解锁时间干预能力
    {
      action: 'unlockAbility',
      params: { ability: 'TIME_INTERVENTION' },
      expect: { type: 'ability', target: 'TIME_INTERVENTION', operator: 'exists', value: true },
    },
    { action: 'setFlag', params: { name: 'FLAG_TIME_INTERVENTION_UNLOCKED', value: true } },
    { action: 'obtainCard', params: { cardId: 'CARD_C4_TIME_AUTH' } },
    { action: 'completeZone', params: { zoneId: 'C4-Z2' } },
    
    // C4-Z3: 时间污染区
    { action: 'teleport', params: { zoneId: 'C4-Z3' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C4-Z3' } },
    
    // C4-Z4: 顾临权限室
    { action: 'teleport', params: { zoneId: 'C4-Z4' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C4-Z4' } },
    
    // C4-Z5: 宋岚版本库
    { action: 'teleport', params: { zoneId: 'C4-Z5' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C4-Z5' } },
    
    // C4-Z6: 回溯失败点（无人需要的地图，R+2，F21前奏）
    { action: 'teleport', params: { zoneId: 'C4-Z6' }, delay: 300 },
    {
      action: 'addR',
      params: { delta: 2 },
      expect: { type: 'counter', target: 'R', operator: 'gte', value: 6 },
    },
    { action: 'completeZone', params: { zoneId: 'C4-Z6' } },
    
    // C4-Z7: 牧平神话残响室
    { action: 'teleport', params: { zoneId: 'C4-Z7' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C4-Z7' } },
    
    // C4-Z8: 补丁边界（顾临开始限制例外权限）
    { action: 'teleport', params: { zoneId: 'C4-Z8' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C4-Z8' } },
  ],
};

/**
 * 第五章测试脚本 - R值显影
 */
export const CHAPTER5_TEST: ITestScript = {
  name: '第五章流程测试',
  description: '测试 C5-Z1 到 C5-Z7 的流程，R值显影和F21判定',
  setup: [
    { action: 'gotoChapter', params: { chapter: 'C5' } },
    // 确保已解锁所有能力
    { action: 'unlockAllAbilities' },
    // 设置适当的 R 值（接近阈值）
    { action: 'setR', params: { value: 5 } },
  ],
  steps: [
    // 验证进入 C5
    {
      action: 'wait',
      params: { ms: 500 },
      expect: { type: 'zone', target: 'current', operator: 'contains', value: 'C5' },
    },
    // C5-Z1: 无法收敛区域（版本冲突现场）
    { action: 'teleport', params: { zoneId: 'C5-Z1' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C5-Z1' } },
    
    // C5-Z2: 系统判定室
    { action: 'teleport', params: { zoneId: 'C5-Z2' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C5-Z2' } },
    
    // C5-Z3: 栖蓝最后据点
    { action: 'teleport', params: { zoneId: 'C5-Z3' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C5-Z3' } },
    
    // C5-Z4: 顾临卡顿现场
    { action: 'teleport', params: { zoneId: 'C5-Z4' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C5-Z4' } },
    
    // C5-Z5: R值显影点
    { action: 'teleport', params: { zoneId: 'C5-Z5' }, delay: 300 },
    // 增加 R 值以达到 F21 阈值
    {
      action: 'addR',
      params: { delta: 1 },
      expect: { type: 'counter', target: 'R', operator: 'gte', value: 6 },
    },
    { action: 'completeZone', params: { zoneId: 'C5-Z5' } },
    
    // C5-Z6: 多余行为博物馆
    { action: 'teleport', params: { zoneId: 'C5-Z6' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'C5-Z6' } },
    
    // C5-Z7: 模型边界（R>=6 触发 F21 判定句）
    { action: 'teleport', params: { zoneId: 'C5-Z7' }, delay: 300 },
    {
      action: 'wait',
      params: { ms: 300 },
      expect: { type: 'counter', target: 'R', operator: 'gte', value: 6 },
    },
    { action: 'completeZone', params: { zoneId: 'C5-Z7' } },
  ],
};

/**
 * 终章测试脚本 - 三结局选择
 */
export const CHAPTER_FINALE_TEST: ITestScript = {
  name: '终章流程测试',
  description: '测试 CF-Z1 到 CF-Z6 的流程，三结局入口验证',
  setup: [
    { action: 'gotoChapter', params: { chapter: 'CF' } },
    { action: 'unlockAllAbilities' },
  ],
  steps: [
    // 验证进入终章
    {
      action: 'wait',
      params: { ms: 500 },
      expect: { type: 'zone', target: 'current', operator: 'contains', value: 'CF' },
    },
    // CF-Z1: 对视空间（F22 空白字段块）
    { action: 'teleport', params: { zoneId: 'CF-Z1' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'CF-Z1' } },
    
    // CF-Z2: 字段接受室（最后的无收益选择，R+2）
    { action: 'teleport', params: { zoneId: 'CF-Z2' }, delay: 300 },
    { action: 'addR', params: { delta: 2 } },
    { action: 'completeZone', params: { zoneId: 'CF-Z2' } },
    
    // 根据 R 值进入不同结局 Zone
    // CF-Z3: 结局A-平面稳定
    { action: 'teleport', params: { zoneId: 'CF-Z3' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'CF-Z3' } },
    
    // CF-Z4: 结局B-真实释放
    { action: 'teleport', params: { zoneId: 'CF-Z4' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'CF-Z4' } },
    
    // CF-Z5: 结局C-成为系统（三结局选择点）
    { action: 'teleport', params: { zoneId: 'CF-Z5' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'CF-Z5' } },
    
    // CF-Z6: 尾声空间
    { action: 'teleport', params: { zoneId: 'CF-Z6' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'CF-Z6' } },
  ],
};

/**
 * 结局 A 完整流程测试
 */
export const ENDING_A_FULL_TEST: ITestScript = {
  name: '结局A完整流程测试',
  description: '从头开始走结局A路线（平面稳定）',
  setup: [
    { action: 'reset' },
  ],
  steps: [
    // 保持低 R 值（不做无收益行为）
    { action: 'setR', params: { value: 2 } },
    { action: 'setP', params: { value: 5 } },
    // 快速推进到终章
    { action: 'gotoChapter', params: { chapter: 'CF' } },
    { action: 'unlockAllAbilities' },
    // 进入结局选择
    { action: 'teleport', params: { zoneId: 'CF-Z5' }, delay: 500 },
    // 设置结局 A 条件
    { action: 'setupEnding', params: { ending: 'A' } },
    // 验证可以选择结局 A
    {
      action: 'wait',
      params: { ms: 300 },
      expect: { type: 'counter', target: 'R', operator: 'lt', value: 6 },
    },
    { action: 'setFlag', params: { name: 'FLAG_ENDING_A', value: true } },
    // 进入结局 A Zone
    { action: 'teleport', params: { zoneId: 'CF-Z3' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'CF-Z3' } },
  ],
};

/**
 * 结局 B 完整流程测试
 */
export const ENDING_B_FULL_TEST: ITestScript = {
  name: '结局B完整流程测试',
  description: '从头开始走结局B路线（真实释放）',
  setup: [
    { action: 'reset' },
  ],
  steps: [
    // 设置中等 R 值
    { action: 'setR', params: { value: 6 } },
    { action: 'setP', params: { value: 25 } },
    // 快速推进到终章
    { action: 'gotoChapter', params: { chapter: 'CF' } },
    { action: 'unlockAllAbilities' },
    // 进入结局选择
    { action: 'teleport', params: { zoneId: 'CF-Z5' }, delay: 500 },
    // 设置结局 B 条件
    { action: 'setupEnding', params: { ending: 'B' } },
    // 验证可以选择结局 B
    {
      action: 'wait',
      params: { ms: 300 },
      expect: { type: 'counter', target: 'R', operator: 'gte', value: 5 },
    },
    { action: 'setFlag', params: { name: 'FLAG_ENDING_B', value: true } },
    // 进入结局 B Zone
    { action: 'teleport', params: { zoneId: 'CF-Z4' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'CF-Z4' } },
  ],
};

/**
 * 结局 C 完整流程测试
 */
export const ENDING_C_FULL_TEST: ITestScript = {
  name: '结局C完整流程测试',
  description: '从头开始走结局C路线（成为系统）',
  setup: [
    { action: 'reset' },
  ],
  steps: [
    // 设置高 R 值
    { action: 'setR', params: { value: 12 } },
    { action: 'setP', params: { value: 18 } },
    // 快速推进到终章
    { action: 'gotoChapter', params: { chapter: 'CF' } },
    { action: 'unlockAllAbilities' },
    // 进入结局选择
    { action: 'teleport', params: { zoneId: 'CF-Z5' }, delay: 500 },
    // 设置结局 C 条件
    { action: 'setupEnding', params: { ending: 'C' } },
    // 验证可以选择结局 C
    {
      action: 'wait',
      params: { ms: 300 },
      expect: { type: 'counter', target: 'R', operator: 'gte', value: 10 },
    },
    { action: 'setFlag', params: { name: 'FLAG_ENDING_C', value: true } },
    // 进入结局 C Zone
    { action: 'teleport', params: { zoneId: 'CF-Z5' }, delay: 300 },
    { action: 'completeZone', params: { zoneId: 'CF-Z5' } },
  ],
};

/**
 * 完整主线流程测试（序章到终章）
 */
export const FULL_MAINLINE_TEST: ITestScript = {
  name: '完整主线流程测试',
  description: '测试从 C0 到 CF 的完整主线流程',
  setup: [
    { action: 'reset' },
  ],
  steps: [
    // === 序章 C0 ===
    { action: 'teleport', params: { zoneId: 'C0-Z1' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C0-Z1' } },
    { action: 'teleport', params: { zoneId: 'C0-Z2' }, delay: 200 },
    { action: 'addR', params: { delta: 1 } }, // 首次无收益选择
    { action: 'completeZone', params: { zoneId: 'C0-Z2' } },
    { action: 'teleport', params: { zoneId: 'C0-Z3' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C0-Z3' } },
    { action: 'teleport', params: { zoneId: 'C0-Z4' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C0-Z4' } },
    { action: 'teleport', params: { zoneId: 'C0-Z5' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C0-Z5' } },
    { action: 'teleport', params: { zoneId: 'C0-Z6' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C0-Z6' } },
    
    // === 第一章 C1 ===
    { action: 'teleport', params: { zoneId: 'C1-Z1' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C1-Z1' } },
    { action: 'teleport', params: { zoneId: 'C1-Z2' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C1-Z2' } },
    { action: 'teleport', params: { zoneId: 'C1-Z3' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C1-Z3' } },
    { action: 'teleport', params: { zoneId: 'C1-Z4' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C1-Z4' } },
    { action: 'teleport', params: { zoneId: 'C1-Z5' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C1-Z5' } },
    { action: 'teleport', params: { zoneId: 'C1-Z6' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C1-Z6' } },
    
    // === 第二章 C2（解锁深度感知）===
    { action: 'teleport', params: { zoneId: 'C2-Z1' }, delay: 200 },
    { action: 'unlockAbility', params: { ability: 'DEPTH_PERCEPTION' } },
    { action: 'completeZone', params: { zoneId: 'C2-Z1' } },
    { action: 'teleport', params: { zoneId: 'C2-Z2' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C2-Z2' } },
    { action: 'teleport', params: { zoneId: 'C2-Z3' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C2-Z3' } },
    { action: 'teleport', params: { zoneId: 'C2-Z4' }, delay: 200 },
    { action: 'addR', params: { delta: 2 } }, // 路标修补
    { action: 'completeZone', params: { zoneId: 'C2-Z4' } },
    { action: 'teleport', params: { zoneId: 'C2-Z5' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C2-Z5' } },
    { action: 'teleport', params: { zoneId: 'C2-Z6' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C2-Z6' } },
    { action: 'teleport', params: { zoneId: 'C2-Z7' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C2-Z7' } },
    
    // === 第三章 C3（解锁深度介入）===
    { action: 'teleport', params: { zoneId: 'C3-Z1' }, delay: 200 },
    { action: 'unlockAbility', params: { ability: 'DEPTH_INTERVENTION' } },
    { action: 'completeZone', params: { zoneId: 'C3-Z1' } },
    { action: 'teleport', params: { zoneId: 'C3-Z2' }, delay: 200 },
    { action: 'addP', params: { delta: 2 } }, // 首次介入
    { action: 'completeZone', params: { zoneId: 'C3-Z2' } },
    { action: 'teleport', params: { zoneId: 'C3-Z3' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C3-Z3' } },
    { action: 'teleport', params: { zoneId: 'C3-Z4' }, delay: 200 },
    { action: 'addR', params: { delta: 2 } }, // 空椅子任务
    { action: 'completeZone', params: { zoneId: 'C3-Z4' } },
    { action: 'teleport', params: { zoneId: 'C3-Z5' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C3-Z5' } },
    { action: 'teleport', params: { zoneId: 'C3-Z6' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C3-Z6' } },
    { action: 'teleport', params: { zoneId: 'C3-Z7' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C3-Z7' } },
    
    // === 第四章 C4（解锁时间干预）===
    { action: 'teleport', params: { zoneId: 'C4-Z1' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C4-Z1' } },
    { action: 'teleport', params: { zoneId: 'C4-Z2' }, delay: 200 },
    { action: 'unlockAbility', params: { ability: 'TIME_INTERVENTION' } },
    { action: 'completeZone', params: { zoneId: 'C4-Z2' } },
    { action: 'teleport', params: { zoneId: 'C4-Z3' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C4-Z3' } },
    { action: 'teleport', params: { zoneId: 'C4-Z4' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C4-Z4' } },
    { action: 'teleport', params: { zoneId: 'C4-Z5' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C4-Z5' } },
    { action: 'teleport', params: { zoneId: 'C4-Z6' }, delay: 200 },
    { action: 'addR', params: { delta: 2 } }, // 无人需要的地图
    { action: 'completeZone', params: { zoneId: 'C4-Z6' } },
    { action: 'teleport', params: { zoneId: 'C4-Z7' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C4-Z7' } },
    { action: 'teleport', params: { zoneId: 'C4-Z8' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C4-Z8' } },
    
    // === 第五章 C5 ===
    { action: 'teleport', params: { zoneId: 'C5-Z1' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C5-Z1' } },
    { action: 'teleport', params: { zoneId: 'C5-Z2' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C5-Z2' } },
    { action: 'teleport', params: { zoneId: 'C5-Z3' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C5-Z3' } },
    { action: 'teleport', params: { zoneId: 'C5-Z4' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C5-Z4' } },
    { action: 'teleport', params: { zoneId: 'C5-Z5' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C5-Z5' } },
    { action: 'teleport', params: { zoneId: 'C5-Z6' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C5-Z6' } },
    { action: 'teleport', params: { zoneId: 'C5-Z7' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'C5-Z7' } },
    
    // === 终章 CF ===
    { action: 'teleport', params: { zoneId: 'CF-Z1' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'CF-Z1' } },
    { action: 'teleport', params: { zoneId: 'CF-Z2' }, delay: 200 },
    { action: 'addR', params: { delta: 2 } }, // 最后的无收益选择
    { action: 'completeZone', params: { zoneId: 'CF-Z2' } },
    { action: 'teleport', params: { zoneId: 'CF-Z5' }, delay: 200 },
    // 验证完成所有主线
    {
      action: 'wait',
      params: { ms: 300 },
      expect: { type: 'ability', target: 'TIME_INTERVENTION', operator: 'exists', value: true },
    },
    { action: 'completeZone', params: { zoneId: 'CF-Z5' } },
    { action: 'teleport', params: { zoneId: 'CF-Z6' }, delay: 200 },
    { action: 'completeZone', params: { zoneId: 'CF-Z6' } },
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
    CHAPTER2_TEST,
    CHAPTER3_TEST,
    CHAPTER4_TEST,
    CHAPTER5_TEST,
    CHAPTER_FINALE_TEST,
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

/**
 * 章节流程测试套件
 */
export const CHAPTER_FLOW_SUITE: ITestSuite = {
  name: '章节流程测试',
  description: '按章节顺序测试完整主线流程',
  scripts: [
    PROLOGUE_TEST,
    CHAPTER1_TEST,
    CHAPTER2_TEST,
    CHAPTER3_TEST,
    CHAPTER4_TEST,
    CHAPTER5_TEST,
    CHAPTER_FINALE_TEST,
  ],
};

/**
 * 结局测试套件
 */
export const ENDING_SUITE: ITestSuite = {
  name: '结局测试',
  description: '测试三种结局的完整流程',
  scripts: [
    ENDING_A_FULL_TEST,
    ENDING_B_FULL_TEST,
    ENDING_C_FULL_TEST,
  ],
};

/**
 * 完整主线测试套件（一次性通关）
 */
export const MAINLINE_SUITE: ITestSuite = {
  name: '完整主线测试',
  description: '从序章到终章的完整主线流程',
  scripts: [
    FULL_MAINLINE_TEST,
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

