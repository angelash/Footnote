// ============================================================================
// CF-Z4.test.js - 世界首次保存非最优解
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 世界首次保存非最优解，验证仪式结果保留
// ============================================================================

const ZONE_ID = 'CF-Z4';
const ZONE_NAME = '世界首次保存非最优解';

/**
 * CF-Z4 世界首次保存非最优解测试用例
 * 
 * 交互对象:
 * - preserved_chair: 空椅（保留）- 条件: FLAG_RITE_CHAIR
 * - preserved_archive: 封存抄录（保留）- 条件: FLAG_RITE_ARCHIVE
 * - preserved_lamp: 弱灯（保留）- 条件: FLAG_RITE_LAMP
 * 
 * 特性: 根据 CF-Z2 选择的仪式，只有对应的保留对象可交互
 */
const TESTS = [
  // ============================================
  // TC-CFZ4-01: 空椅保留交互
  // ============================================
  {
    id: 'TC-CFZ4-01',
    name: '空椅保留交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'preserved_chair',
    objectName: '空椅（保留）',
    description: '选择空椅仪式后，查看保留的空椅，获得证明卡片',
    preconditions: ['FLAG_RITE_CHAIR = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_RITE_CHAIR', value: true },
      { action: 'moveToObject', objectId: 'preserved_chair' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_PRESERVE_PROOF'],
      flags: { FLAG_F23_REALIZED: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-CFZ4-02: 空椅保留交互（条件未满足）
  // ============================================
  {
    id: 'TC-CFZ4-02',
    name: '空椅保留交互（未选择空椅仪式）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'preserved_chair',
    objectName: '空椅（保留）',
    description: '未选择空椅仪式时，空椅不可交互',
    preconditions: ['FLAG_RITE_CHAIR = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_RITE_CHAIR', value: false },
      { action: 'moveToObject', objectId: 'preserved_chair' },
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
  // TC-CFZ4-03: 封存抄录保留交互
  // ============================================
  {
    id: 'TC-CFZ4-03',
    name: '封存抄录保留交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'preserved_archive',
    objectName: '封存抄录（保留）',
    description: '选择版本库封存仪式后，查看保留的抄录，获得证明卡片',
    preconditions: ['FLAG_RITE_ARCHIVE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_RITE_ARCHIVE', value: true },
      { action: 'moveToObject', objectId: 'preserved_archive' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_PRESERVE_PROOF'],
      flags: { FLAG_F23_REALIZED: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-CFZ4-04: 封存抄录保留交互（条件未满足）
  // ============================================
  {
    id: 'TC-CFZ4-04',
    name: '封存抄录保留交互（未选择封存仪式）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'preserved_archive',
    objectName: '封存抄录（保留）',
    description: '未选择版本库封存仪式时，抄录不可交互',
    preconditions: ['FLAG_RITE_ARCHIVE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_RITE_ARCHIVE', value: false },
      { action: 'moveToObject', objectId: 'preserved_archive' },
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
  // TC-CFZ4-05: 弱灯保留交互
  // ============================================
  {
    id: 'TC-CFZ4-05',
    name: '弱灯保留交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'preserved_lamp',
    objectName: '弱灯（保留）',
    description: '选择点灯仪式后，查看保留的弱灯，获得证明卡片',
    preconditions: ['FLAG_RITE_LAMP = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_RITE_LAMP', value: true },
      { action: 'moveToObject', objectId: 'preserved_lamp' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_PRESERVE_PROOF'],
      flags: { FLAG_F23_REALIZED: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-CFZ4-06: 弱灯保留交互（条件未满足）
  // ============================================
  {
    id: 'TC-CFZ4-06',
    name: '弱灯保留交互（未选择点灯仪式）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'preserved_lamp',
    objectName: '弱灯（保留）',
    description: '未选择点灯仪式时，弱灯不可交互',
    preconditions: ['FLAG_RITE_LAMP = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_RITE_LAMP', value: false },
      { action: 'moveToObject', objectId: 'preserved_lamp' },
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
  conditionalCount: TESTS.filter(t => t.preconditions?.length > 0).length,
};

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.CF_Z4_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[CF-Z4] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, ${ZONE_STATS.conditionalCount} 个条件分支`);
