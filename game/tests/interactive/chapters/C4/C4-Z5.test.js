// ============================================================================
// C4-Z5.test.js - 阿棠碎片日记2
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 阿棠相关区域，获取第二篇碎片日记
// ============================================================================

const ZONE_ID = 'C4-Z5';
const ZONE_NAME = '阿棠碎片日记2';

/**
 * C4-Z5 阿棠碎片日记2测试用例
 * 
 * 交互对象:
 * - atang: 阿棠（对话）
 * - atang_note: 阿棠的纸条（条件触发）
 * - wall_crack: 墙缝（条件触发，分支选择）
 */
const TESTS = [
  // ============================================
  // TC-C4Z5-01: 阿棠交互
  // ============================================
  {
    id: 'TC-C4Z5-01',
    name: '阿棠交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'atang',
    objectName: '阿棠',
    description: '与阿棠对话',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'atang' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z5_TALKED: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C4Z5-02: 阿棠的纸条交互
  // ============================================
  {
    id: 'TC-C4Z5-02',
    name: '阿棠的纸条交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'atang_note',
    objectName: '阿棠的纸条',
    description: '与阿棠对话后获取纸条',
    preconditions: ['FLAG_C4Z5_TALKED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z5_TALKED', value: true },
      { action: 'moveToObject', objectId: 'atang_note' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z5_HAS_NOTE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C4Z5-03: 阿棠的纸条 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z5-03',
    name: '阿棠的纸条 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'atang_note',
    objectName: '阿棠的纸条（条件不满足）',
    description: '未与阿棠对话时，纸条不可获取',
    preconditions: ['FLAG_C4Z5_TALKED = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z5_TALKED', value: false },
      { action: 'moveToObject', objectId: 'atang_note' },
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
  // TC-C4Z5-04: 墙缝交互 - 把纸条塞进去
  // ============================================
  {
    id: 'TC-C4Z5-04',
    name: '墙缝交互 - 把纸条塞进去',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'wall_crack',
    objectName: '墙缝',
    description: '把纸条塞进墙缝，获得碎片日记，触发 R+2',
    preconditions: ['FLAG_C4Z5_HAS_NOTE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z5_HAS_NOTE', value: true },
      { action: 'moveToObject', objectId: 'wall_crack' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '把纸条塞进去' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C4_FRAGMENT_DIARY_02'],
      flags: { FLAG_HELPED_ATANG_PAPER: true },
      rDelta: 2,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C4Z5-05: 墙缝交互 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z5-05',
    name: '墙缝交互 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'wall_crack',
    objectName: '墙缝（条件不满足）',
    description: '没有纸条时，墙缝只显示普通描述',
    preconditions: ['FLAG_C4Z5_HAS_NOTE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z5_HAS_NOTE', value: false },
      { action: 'moveToObject', objectId: 'wall_crack' },
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
      dialogueContent: '一道窄窄的墙缝',
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
  window.C4_Z5_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C4-Z5] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
