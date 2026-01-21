// ============================================================================
// CF-Z5.test.js - 三结局选择
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 三结局选择，最终选择决定游戏结局
// ============================================================================

const ZONE_ID = 'CF-Z5';
const ZONE_NAME = '三结局选择';

/**
 * CF-Z5 三结局选择测试用例
 * 
 * 交互对象:
 * - ending_a: 结局A（平面稳定）- 条件: R<6 且 W>60
 * - ending_b: 结局B（真实释放）- 条件: R>=6 且 40<W<=60
 * - ending_c: 结局C（成为系统）- 条件: R>=10 且 W<=40
 * 
 * 特性: 三结局互斥，需要设置 gameState 来测试不同条件
 */
const TESTS = [
  // ============================================
  // TC-CFZ5-01: 结局A - 平面稳定
  // ============================================
  {
    id: 'TC-CFZ5-01',
    name: '结局A - 平面稳定',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'ending_a',
    objectName: '结局A',
    description: '选择结局A（平面稳定），条件: R<6 且 W>60',
    critical: true,
    gameState: { R: 5, W: 70 },
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setCounter', name: 'R', value: 5 },
      { action: 'setCounter', name: 'W', value: 70 },
      { action: 'moveToObject', objectId: 'ending_a' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '确认' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_ENDING_A: true, FLAG_GAME_CLEAR: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      ending: 'A',
      nextZone: null,
      expectedLines: 6,
      dialogueContains: ['继续收敛', '维持可读性', '读不下去的东西', '也能留下'],
    },
  },

  // ============================================
  // TC-CFZ5-02: 结局A - 条件不满足（R过高）
  // ============================================
  {
    id: 'TC-CFZ5-02',
    name: '结局A - 条件不满足（R过高）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'ending_a',
    objectName: '结局A',
    description: '尝试选择结局A，但 R>=6 不满足条件',
    gameState: { R: 8, W: 70 },
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setCounter', name: 'R', value: 8 },
      { action: 'setCounter', name: 'W', value: 70 },
      { action: 'moveToObject', objectId: 'ending_a' },
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
      dialogueContains: ['条件不满足', 'R'],
    },
  },

  // ============================================
  // TC-CFZ5-03: 结局B - 真实释放
  // ============================================
  {
    id: 'TC-CFZ5-03',
    name: '结局B - 真实释放',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'ending_b',
    objectName: '结局B',
    description: '选择结局B（真实释放），条件: R>=6 且 40<W<=60',
    critical: true,
    gameState: { R: 8, W: 50 },
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setCounter', name: 'R', value: 8 },
      { action: 'setCounter', name: 'W', value: 50 },
      { action: 'moveToObject', objectId: 'ending_b' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '确认' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_ENDING_B: true, FLAG_GAME_CLEAR: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      ending: 'B',
      nextZone: null,
      expectedLines: 6,
      dialogueContains: ['释放表示', '松开压缩', '版本不再排队', '意义更自由'],
    },
  },

  // ============================================
  // TC-CFZ5-04: 结局B - 条件不满足（R过低）
  // ============================================
  {
    id: 'TC-CFZ5-04',
    name: '结局B - 条件不满足（R过低）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'ending_b',
    objectName: '结局B',
    description: '尝试选择结局B，但 R<6 不满足条件',
    gameState: { R: 4, W: 50 },
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setCounter', name: 'R', value: 4 },
      { action: 'setCounter', name: 'W', value: 50 },
      { action: 'moveToObject', objectId: 'ending_b' },
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
      dialogueContains: ['条件不满足', 'R'],
    },
  },

  // ============================================
  // TC-CFZ5-05: 结局C - 成为系统
  // ============================================
  {
    id: 'TC-CFZ5-05',
    name: '结局C - 成为系统',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'ending_c',
    objectName: '结局C',
    description: '选择结局C（成为系统），条件: R>=10 且 W<=40',
    critical: true,
    gameState: { R: 12, W: 30 },
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setCounter', name: 'R', value: 12 },
      { action: 'setCounter', name: 'W', value: 30 },
      { action: 'moveToObject', objectId: 'ending_c' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '确认' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_ENDING_C: true, FLAG_GAME_CLEAR: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      ending: 'C',
      nextZone: null,
      expectedLines: 6,
      dialogueContains: ['承载字段', '运行时载体', '代价背走', '让某些人多活了一点'],
    },
  },

  // ============================================
  // TC-CFZ5-06: 结局C - 条件不满足（R不足）
  // ============================================
  {
    id: 'TC-CFZ5-06',
    name: '结局C - 条件不满足（R不足）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'ending_c',
    objectName: '结局C',
    description: '尝试选择结局C，但 R<10 不满足条件',
    gameState: { R: 8, W: 30 },
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setCounter', name: 'R', value: 8 },
      { action: 'setCounter', name: 'W', value: 30 },
      { action: 'moveToObject', objectId: 'ending_c' },
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
      dialogueContains: ['条件不满足', 'R'],
    },
  },

  // ============================================
  // TC-CFZ5-07: 结局C - 条件不满足（W过高）
  // ============================================
  {
    id: 'TC-CFZ5-07',
    name: '结局C - 条件不满足（W过高）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'ending_c',
    objectName: '结局C',
    description: '尝试选择结局C，但 W>40 不满足条件',
    gameState: { R: 12, W: 50 },
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setCounter', name: 'R', value: 12 },
      { action: 'setCounter', name: 'W', value: 50 },
      { action: 'moveToObject', objectId: 'ending_c' },
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
      dialogueContains: ['条件不满足', 'W'],
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
  endingsCovered: ['A', 'B', 'C'],
};

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.CF_Z5_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[CF-Z5] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.endingsCovered.length} 个结局`);
