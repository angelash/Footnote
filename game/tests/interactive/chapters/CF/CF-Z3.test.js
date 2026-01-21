// ============================================================================
// CF-Z3.test.js - 尺度失配：对视
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 尺度失配：对视，F22 伏笔回收
// ============================================================================

const ZONE_ID = 'CF-Z3';
const ZONE_NAME = '尺度失配：对视';

/**
 * CF-Z3 尺度失配：对视测试用例
 * 
 * 交互对象:
 * - format_zone_1: 格式坠落区域1
 * - format_zone_2: 格式坠落区域2
 * - format_zone_3: 格式坠落区域3
 * - field_bar: 冗余字段条交互点（条件触发，F22回收）
 * 
 * 关键伏笔: F22 回收 (collect)
 */
const TESTS = [
  // ============================================
  // TC-CFZ3-01: 格式坠落区域1交互
  // ============================================
  {
    id: 'TC-CFZ3-01',
    name: '格式坠落区域1交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'format_zone_1',
    objectName: '格式坠落区域1',
    description: '检查格式坠落区域1',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'format_zone_1' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_FORMAT_1_DONE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-CFZ3-02: 格式坠落区域2交互
  // ============================================
  {
    id: 'TC-CFZ3-02',
    name: '格式坠落区域2交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'format_zone_2',
    objectName: '格式坠落区域2',
    description: '检查格式坠落区域2',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'format_zone_2' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_FORMAT_2_DONE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-CFZ3-03: 格式坠落区域3交互
  // ============================================
  {
    id: 'TC-CFZ3-03',
    name: '格式坠落区域3交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'format_zone_3',
    objectName: '格式坠落区域3',
    description: '检查格式坠落区域3，完成所有格式区域',
    preconditions: ['FLAG_FORMAT_1_DONE = true', 'FLAG_FORMAT_2_DONE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_FORMAT_1_DONE', value: true },
      { action: 'setFlag', flag: 'FLAG_FORMAT_2_DONE', value: true },
      { action: 'moveToObject', objectId: 'format_zone_3' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_CFZ3_ALL_FORMAT_DONE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-CFZ3-04: 冗余字段条交互（条件未满足）
  // ============================================
  {
    id: 'TC-CFZ3-04',
    name: '冗余字段条交互（条件未满足）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'field_bar',
    objectName: '冗余字段条',
    description: '未完成所有格式区域时，字段条不可交互',
    preconditions: ['FLAG_CFZ3_ALL_FORMAT_DONE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_CFZ3_ALL_FORMAT_DONE', value: false },
      { action: 'moveToObject', objectId: 'field_bar' },
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
    },
  },

  // ============================================
  // TC-CFZ3-05: 冗余字段条交互（F22回收）
  // ============================================
  {
    id: 'TC-CFZ3-05',
    name: '冗余字段条交互（F22回收）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'field_bar',
    objectName: '冗余字段条',
    description: '完成所有格式区域后，触发 F22 回收，P+1',
    preconditions: ['FLAG_CFZ3_ALL_FORMAT_DONE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_CFZ3_ALL_FORMAT_DONE', value: true },
      { action: 'moveToObject', objectId: 'field_bar' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_FIELD_ACCEPTED'],
      flags: { FLAG_FIELD_ACCEPTED: true },
      rDelta: 0,
      pDelta: 1,
      foreshadow: { id: 'F22', action: 'collect' },
      nextZone: null,
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
  window.CF_Z3_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[CF-Z3] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 伏笔回收: F22`);
