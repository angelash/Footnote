// ============================================================================
// C4-Z3.test.js - 边缘断口：第一次必须回溯的事件
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 边缘断口，第一次强制回溯的剧情事件
// 关键事件: 必须使用时间干预回溯才能通过
// ============================================================================

const ZONE_ID = 'C4-Z3';
const ZONE_NAME = '边缘断口：第一次必须回溯的事件';

/**
 * C4-Z3 边缘断口测试用例
 * 
 * 交互对象:
 * - alarm_coil: 警报线圈
 * - collapse_point: 坍塌点（条件触发）
 * - rollback_hint: 回溯节点提示（条件触发）
 * - safety_switch: 安全开关（条件触发）
 */
const TESTS = [
  // ============================================
  // TC-C4Z3-01: 警报线圈交互
  // ============================================
  {
    id: 'TC-C4Z3-01',
    name: '警报线圈交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'alarm_coil',
    objectName: '警报线圈',
    description: '触发警报线圈，启动警报',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'alarm_coil' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z3_ALARM_TRIGGERED: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 警报线圈
      expectedLines: 3,
      dialogueContains: ['触碰了警报线圈', '警报已触发', '倒计时开始'],
    },
  },

  // ============================================
  // TC-C4Z3-02: 坍塌点交互 - 触发必须回溯
  // ============================================
  {
    id: 'TC-C4Z3-02',
    name: '坍塌点交互 - 触发必须回溯',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'collapse_point',
    objectName: '坍塌点',
    description: '警报触发后接近坍塌点，触发必须回溯状态',
    preconditions: ['FLAG_C4Z3_ALARM_TRIGGERED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z3_ALARM_TRIGGERED', value: true },
      { action: 'moveToObject', objectId: 'collapse_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z3_MUST_ROLLBACK: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 坍塌封死
      expectedLines: 5,
      dialogueContains: ['跑向前方', '坍塌点崩落', '路被封死', '路径不可达', '选择稳定节点'],
    },
  },

  // ============================================
  // TC-C4Z3-03: 坍塌点交互 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z3-03',
    name: '坍塌点交互 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'collapse_point',
    objectName: '坍塌点（警报未触发）',
    description: '警报未触发时，坍塌点只显示普通描述',
    preconditions: ['FLAG_C4Z3_ALARM_TRIGGERED = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z3_ALARM_TRIGGERED', value: false },
      { action: 'moveToObject', objectId: 'collapse_point' },
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
      // 对话验证 - 阈值门普通描述
      expectedLines: 2,
      dialogueContains: ['阈值门', '必须通过这里'],
    },
  },

  // ============================================
  // TC-C4Z3-04: 回溯节点提示交互 - 执行回溯
  // ============================================
  {
    id: 'TC-C4Z3-04',
    name: '回溯节点提示交互 - 执行回溯',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'rollback_hint',
    objectName: '回溯节点提示',
    description: '必须回溯状态下，回溯到警报前，触发 P+3',
    preconditions: ['FLAG_C4Z3_MUST_ROLLBACK = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z3_MUST_ROLLBACK', value: true },
      { action: 'moveToObject', objectId: 'rollback_hint' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '回溯到警报前' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z3_ROLLBACK_DONE: true },
      rDelta: 0,
      pDelta: 3,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 回溯成功
      expectedLines: 8,
      dialogueContains: ['已执行回溯', '回到了触发警报之前', '补丁标记', '墙没有恢复', '安全开关'],
    },
  },

  // ============================================
  // TC-C4Z3-05: 回溯节点提示 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z3-05',
    name: '回溯节点提示 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'rollback_hint',
    objectName: '回溯节点提示（条件不满足）',
    description: '未触发必须回溯状态时，提示不可用',
    preconditions: ['FLAG_C4Z3_MUST_ROLLBACK = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z3_MUST_ROLLBACK', value: false },
      { action: 'moveToObject', objectId: 'rollback_hint' },
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
      // 对话验证 - 无可用路径提示
      expectedLines: 2,
      dialogueContains: ['当前时间线无可用路径'],
    },
  },

  // ============================================
  // TC-C4Z3-06: 安全开关交互 - 完成通过
  // ============================================
  {
    id: 'TC-C4Z3-06',
    name: '安全开关交互 - 完成通过',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'safety_switch',
    objectName: '安全开关',
    description: '回溯完成后，操作安全开关，获得卡片并通过',
    preconditions: ['FLAG_C4Z3_ROLLBACK_DONE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z3_ROLLBACK_DONE', value: true },
      { action: 'moveToObject', objectId: 'safety_switch' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C4_NODE_RECEIPT_01', 'CARD_C4_EDGE_RECORD_02'],
      flags: { FLAG_C4Z3_PASSED: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 安全开关完成
      expectedLines: 4,
      dialogueContains: ['未来的知识', '安全开关', '警报线圈失效', '应该能过去了'],
    },
  },

  // ============================================
  // TC-C4Z3-07: 安全开关交互 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z3-07',
    name: '安全开关交互 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'safety_switch',
    objectName: '安全开关（条件不满足）',
    description: '未完成回溯时，安全开关不可操作',
    preconditions: ['FLAG_C4Z3_ROLLBACK_DONE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z3_ROLLBACK_DONE', value: false },
      { action: 'moveToObject', objectId: 'safety_switch' },
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
      // 对话验证 - 条件不满足提示
      expectedLines: 1,
      dialogueContains: ['需要先完成回溯'],
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
  totalPPoints: TESTS.reduce((sum, t) => sum + (t.expectedResults.pDelta || 0), 0),
  branchCount: TESTS.filter(t => t.branch).length,
};

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.C4_Z3_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C4-Z3] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
