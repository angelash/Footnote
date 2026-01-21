// ============================================================================
// CF-Z2.test.js - 最后的无收益选择
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 最后的无收益选择，三种仪式，每种 R+3
// ============================================================================

const ZONE_ID = 'CF-Z2';
const ZONE_NAME = '最后的无收益选择';

/**
 * CF-Z2 最后的无收益选择测试用例
 * 
 * 交互对象:
 * - ritual_chair: 仪式①空椅占位（critical）
 * - ritual_archive: 仪式②版本库封存（critical）
 * - ritual_lamp: 仪式③点灯（critical）
 * 
 * 特性: 三种仪式互斥，每种都会导致 R+3
 */
const TESTS = [
  // ============================================
  // TC-CFZ2-01: 仪式①空椅占位
  // ============================================
  {
    id: 'TC-CFZ2-01',
    name: '仪式①空椅占位',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'ritual_chair',
    objectName: '空椅仪式',
    description: '执行空椅占位仪式，R+3，获得最终卡片',
    critical: true,
    preconditions: ['FLAG_FINAL_RITE_DONE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_FINAL_RITE_DONE', value: false },
      { action: 'moveToObject', objectId: 'ritual_chair' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '执行仪式' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_CHAIR_FINAL'],
      flags: { FLAG_RITE_CHAIR: true, FLAG_FINAL_RITE_DONE: true },
      rDelta: 3,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-CFZ2-02: 仪式②版本库封存
  // ============================================
  {
    id: 'TC-CFZ2-02',
    name: '仪式②版本库封存',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'ritual_archive',
    objectName: '版本库封存仪式',
    description: '执行版本库封存仪式，R+3，获得最终卡片',
    critical: true,
    preconditions: ['FLAG_FINAL_RITE_DONE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_FINAL_RITE_DONE', value: false },
      { action: 'setFlag', flag: 'FLAG_RITE_CHAIR', value: false },
      { action: 'moveToObject', objectId: 'ritual_archive' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '执行仪式' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_ARCHIVE_FINAL'],
      flags: { FLAG_RITE_ARCHIVE: true, FLAG_FINAL_RITE_DONE: true },
      rDelta: 3,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-CFZ2-03: 仪式③点灯
  // ============================================
  {
    id: 'TC-CFZ2-03',
    name: '仪式③点灯',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'ritual_lamp',
    objectName: '点灯仪式',
    description: '执行点灯仪式，R+3，获得最终卡片',
    critical: true,
    preconditions: ['FLAG_FINAL_RITE_DONE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_FINAL_RITE_DONE', value: false },
      { action: 'setFlag', flag: 'FLAG_RITE_CHAIR', value: false },
      { action: 'setFlag', flag: 'FLAG_RITE_ARCHIVE', value: false },
      { action: 'moveToObject', objectId: 'ritual_lamp' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '执行仪式' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_LAMP_FINAL'],
      flags: { FLAG_RITE_LAMP: true, FLAG_FINAL_RITE_DONE: true },
      rDelta: 3,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-CFZ2-04: 仪式已完成后尝试其他仪式
  // ============================================
  {
    id: 'TC-CFZ2-04',
    name: '仪式已完成后尝试其他仪式',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'ritual_archive',
    objectName: '版本库封存仪式（已完成其他仪式）',
    description: '已完成一个仪式后，尝试其他仪式应显示不可用',
    preconditions: ['FLAG_FINAL_RITE_DONE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_FINAL_RITE_DONE', value: true },
      { action: 'setFlag', flag: 'FLAG_RITE_CHAIR', value: true },
      { action: 'moveToObject', objectId: 'ritual_archive' },
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
  criticalCount: TESTS.filter(t => t.critical).length,
};

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.CF_Z2_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[CF-Z2] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, ${ZONE_STATS.criticalCount} 个关键仪式`);
