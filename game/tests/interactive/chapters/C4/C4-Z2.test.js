// ============================================================================
// C4-Z2.test.js - 维修局：时间节点界面上线 【解锁时间干预】
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 维修局，时间干预能力解锁教程区域
// 关键事件: 解锁 timeIntervention 能力
// ============================================================================

const ZONE_ID = 'C4-Z2';
const ZONE_NAME = '维修局：时间节点界面上线';

/**
 * C4-Z2 维修局：时间节点界面上线测试用例
 * 
 * 交互对象:
 * - gulin: 顾临（教程开始）
 * - demo_screw: 螺丝（演示用）
 * - auth_terminal: 授权终端（关键：解锁时间干预）
 */
const TESTS = [
  // ============================================
  // TC-C4Z2-01: 顾临交互 - 教程开始
  // ============================================
  {
    id: 'TC-C4Z2-01',
    name: '顾临交互 - 教程开始',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'gulin',
    objectName: '顾临',
    description: '与顾临对话，开始时间干预教程',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'gulin' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z2_TUTORIAL_START: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C4Z2-02: 螺丝（演示用）交互
  // ============================================
  {
    id: 'TC-C4Z2-02',
    name: '螺丝（演示用）交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'demo_screw',
    objectName: '螺丝（演示用）',
    description: '触发螺丝掉落，然后回溯练习',
    preconditions: ['FLAG_C4Z2_TUTORIAL_START = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z2_TUTORIAL_START', value: true },
      { action: 'moveToObject', objectId: 'demo_screw' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C4_DEMO_RECEIPT'],
      flags: { FLAG_C4Z2_SCREW_FALLEN: true, FLAG_C4Z2_ROLLBACK_DONE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C4Z2-03: 授权终端交互 【关键】
  // ============================================
  {
    id: 'TC-C4Z2-03',
    name: '授权终端交互 - 解锁时间干预【关键】',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'auth_terminal',
    objectName: '授权终端',
    description: '使用授权终端，解锁时间干预能力',
    critical: true,
    preconditions: ['FLAG_C4Z2_ROLLBACK_DONE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z2_ROLLBACK_DONE', value: true },
      { action: 'moveToObject', objectId: 'auth_terminal' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C4_TIME_AUTH'],
      flags: { FLAG_TIME_INTERVENTION_UNLOCKED: true },
      abilities: ['timeIntervention'],
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C4Z2-04: 授权终端交互 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z2-04',
    name: '授权终端交互 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'auth_terminal',
    objectName: '授权终端（条件不满足）',
    description: '未完成回溯演示时，无法使用授权终端',
    preconditions: ['FLAG_C4Z2_ROLLBACK_DONE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z2_ROLLBACK_DONE', value: false },
      { action: 'moveToObject', objectId: 'auth_terminal' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      dialogueContent: '需要先完成回溯演示',
    },
  },
];

// ============================================
// Zone 统计信息
// ============================================
const ZONE_STATS = {
  zoneId: ZONE_ID,
  zoneName: ZONE_NAME,
  totalTests: TESTS.length,
  objectsCovered: [...new Set(TESTS.map(t => t.objectId))],
  cardsCovered: [...new Set(TESTS.flatMap(t => t.expectedResults.cards || []))],
  flagsCovered: [...new Set(TESTS.flatMap(t => Object.keys(t.expectedResults.flags || {})))],
  foreshadowsCovered: TESTS.filter(t => t.expectedResults.foreshadow).map(t => t.expectedResults.foreshadow.id),
  totalRPoints: TESTS.reduce((sum, t) => sum + (t.expectedResults.rDelta || 0), 0),
  branchCount: TESTS.filter(t => t.branch).length,
  criticalTests: TESTS.filter(t => t.critical).map(t => t.id),
  abilitiesUnlocked: ['timeIntervention'],
};

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.C4_Z2_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C4-Z2] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象, 关键测试: ${ZONE_STATS.criticalTests.length} 个`);
