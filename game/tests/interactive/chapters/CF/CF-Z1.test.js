// ============================================================================
// CF-Z1.test.js - 模型边界：冗余字段区
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 模型边界：冗余字段区，F22 伏笔落地
// ============================================================================

const ZONE_ID = 'CF-Z1';
const ZONE_NAME = '模型边界：冗余字段区';

/**
 * CF-Z1 模型边界：冗余字段区测试用例
 * 
 * 交互对象:
 * - audit_entrance: 覆盖区入口
 * - anomaly_a: 异常点A
 * - anomaly_b: 异常点B
 * - anomaly_c: 异常点C
 * - exit_door: 出口门（条件跳转到 CF-Z2）
 * 
 * 关键伏笔: F22 落地
 */
const TESTS = [
  // ============================================
  // TC-CFZ1-01: 覆盖区入口交互
  // ============================================
  {
    id: 'TC-CFZ1-01',
    name: '覆盖区入口交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'audit_entrance',
    objectName: '覆盖区入口',
    description: '进入冗余字段区，触发 F22 激活',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'audit_entrance' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_CFZ1_ENTERED: true, FLAG_F22_ACTIVE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: { id: 'F22', action: 'plant' },
      nextZone: null,
      expectedLines: 11,
      dialogueContains: ['进入冗余字段区', '条目：观测', '收敛：失败', '字段：＿', '建议：降阶'],
    },
  },

  // ============================================
  // TC-CFZ1-02: 异常点A交互
  // ============================================
  {
    id: 'TC-CFZ1-02',
    name: '异常点A交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'anomaly_a',
    objectName: '异常点A',
    description: '检查异常点A',
    preconditions: ['FLAG_CFZ1_ENTERED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_CFZ1_ENTERED', value: true },
      { action: 'moveToObject', objectId: 'anomaly_a' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_ANOMALY_A_DONE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 4,
      dialogueContains: ['异常点A', '空白字段', '深度视野', '字段补全失败'],
    },
  },

  // ============================================
  // TC-CFZ1-03: 异常点B交互
  // ============================================
  {
    id: 'TC-CFZ1-03',
    name: '异常点B交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'anomaly_b',
    objectName: '异常点B',
    description: '检查异常点B',
    preconditions: ['FLAG_CFZ1_ENTERED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_CFZ1_ENTERED', value: true },
      { action: 'moveToObject', objectId: 'anomaly_b' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_ANOMALY_B_DONE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 4,
      dialogueContains: ['异常点B', '重复事件', '双影符号', '无法合并'],
    },
  },

  // ============================================
  // TC-CFZ1-04: 异常点C交互（最后一个，获得卡片）
  // ============================================
  {
    id: 'TC-CFZ1-04',
    name: '异常点C交互（完成所有异常点）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'anomaly_c',
    objectName: '异常点C',
    description: '检查异常点C，完成所有异常点后获得快照卡片',
    preconditions: ['FLAG_CFZ1_ENTERED = true', 'FLAG_ANOMALY_A_DONE = true', 'FLAG_ANOMALY_B_DONE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_CFZ1_ENTERED', value: true },
      { action: 'setFlag', flag: 'FLAG_ANOMALY_A_DONE', value: true },
      { action: 'setFlag', flag: 'FLAG_ANOMALY_B_DONE', value: true },
      { action: 'moveToObject', objectId: 'anomaly_c' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_REDUNDANT_SNAPSHOT'],
      flags: { FLAG_CFZ1_ALL_DONE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 4,
      dialogueContains: ['异常点C', '无收益残差', '点击标注', '不可结算'],
    },
  },

  // ============================================
  // TC-CFZ1-05: 出口门交互（条件未满足）
  // ============================================
  {
    id: 'TC-CFZ1-05',
    name: '出口门交互（条件未满足）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_door',
    objectName: '出口门',
    description: '尝试离开，但未完成所有异常点',
    preconditions: ['FLAG_CFZ1_ALL_DONE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_CFZ1_ALL_DONE', value: false },
      { action: 'moveToObject', objectId: 'exit_door' },
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
      expectedLines: 2,
      dialogueContains: ['未完成', '异常点'],
    },
  },

  // ============================================
  // TC-CFZ1-06: 出口门交互（条件满足，跳转CF-Z2）
  // ============================================
  {
    id: 'TC-CFZ1-06',
    name: '出口门交互（条件满足，跳转CF-Z2）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_door',
    objectName: '出口门',
    description: '完成所有异常点后离开，进入CF-Z2',
    preconditions: ['FLAG_CFZ1_ALL_DONE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_CFZ1_ALL_DONE', value: true },
      { action: 'moveToObject', objectId: 'exit_door' },
      { action: 'interact' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: 'CF-Z2',
      expectedLines: 2,
      dialogueContains: ['离开', '冗余字段区'],
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
};

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.CF_Z1_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[CF-Z1] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
