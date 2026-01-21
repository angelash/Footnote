// ============================================================================
// C3-Z2.test.js - 不存在的房间（可进入）
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 一个被遗忘的房间，需要深度感知才能进入
// ============================================================================

const ZONE_ID = 'C3-Z2';
const ZONE_NAME = '不存在的房间';

/**
 * C3-Z2 不存在的房间测试用例
 * 
 * 交互对象:
 * - intervention_point: 介入热点（需深度感知，长按确认）
 * - chenjiang_position: 陈匠位置（NPC，条件出现）
 * - evacuation_point: 撤离点（完成Zone）
 * 
 * 关键事件:
 * - 营救陈匠
 * - P+3, R+1 介入代价
 */
const TESTS = [
  // ============================================
  // TC-C3Z2-01: 介入热点交互（无深度感知）
  // ============================================
  {
    id: 'TC-C3Z2-01',
    name: '介入热点交互（无深度感知）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'intervention_point',
    objectName: '介入热点',
    description: '在没有深度感知能力时尝试交互',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'intervention_point' },
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
      dialogueContent: '无法感知',
      expectedLines: 1,
      dialogueContains: ['无法感知'],
    },
  },

  // ============================================
  // TC-C3Z2-02: 介入热点 - 按住确认进入房间
  // ============================================
  {
    id: 'TC-C3Z2-02',
    name: '介入热点 - 按住确认进入房间',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'intervention_point',
    objectName: '介入热点',
    description: '使用深度感知长按进入不存在的房间，产生伤痕',
    preconditions: ['depthPerception'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'intervention_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'longPress', duration: 2000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_HALL_SCAR: 1, FLAG_C3Z2_ENTERED_ROOM: true },
      rDelta: 1,
      pDelta: 3,
      foreshadow: null,
      nextZone: null,
      expectedLines: 8,
      dialogueContains: ['深度介入', '将改写结构', '留下永久伤痕', '结构在你的意识下重组', '伤痕已记录'],
    },
  },

  // ============================================
  // TC-C3Z2-03: 陈匠对话（未进入房间）
  // ============================================
  {
    id: 'TC-C3Z2-03',
    name: '陈匠对话（条件不满足）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'chenjiang_position',
    objectName: '陈匠',
    description: '在未进入房间时陈匠不可见',
    preconditions: ['FLAG_C3Z2_ENTERED_ROOM = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z2_ENTERED_ROOM', value: false },
      { action: 'moveToObject', objectId: 'chenjiang_position' },
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
      expectedLines: 0,
      dialogueContains: [],
    },
  },

  // ============================================
  // TC-C3Z2-04: 陈匠对话 - 跟我走
  // ============================================
  {
    id: 'TC-C3Z2-04',
    name: '陈匠对话 - 跟我走',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'chenjiang_position',
    objectName: '陈匠',
    description: '与陈匠对话并选择带他离开',
    preconditions: ['FLAG_C3Z2_ENTERED_ROOM = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z2_ENTERED_ROOM', value: true },
      { action: 'moveToObject', objectId: 'chenjiang_position' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '跟我走' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_OLD_WICK'],
      flags: { FLAG_C3Z2_RESCUED: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 7,
      dialogueContains: ['你看得到这里', '灯点起来', '不存在的地方，也会冷', '旧灯芯'],
    },
  },

  // ============================================
  // TC-C3Z2-05: 撤离点交互（未营救）
  // ============================================
  {
    id: 'TC-C3Z2-05',
    name: '撤离点交互（未营救）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'evacuation_point',
    objectName: '撤离点',
    description: '在未营救陈匠时尝试撤离',
    preconditions: ['FLAG_C3Z2_RESCUED = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z2_RESCUED', value: false },
      { action: 'moveToObject', objectId: 'evacuation_point' },
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
      dialogueContent: '不能丢下他',
      expectedLines: 1,
      dialogueContains: ['不能丢下他'],
    },
  },

  // ============================================
  // TC-C3Z2-06: 撤离点 - 完成撤离
  // ============================================
  {
    id: 'TC-C3Z2-06',
    name: '撤离点 - 完成撤离',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'evacuation_point',
    objectName: '撤离点',
    description: '营救陈匠后完成撤离，获得救援记录卡片',
    preconditions: ['FLAG_C3Z2_RESCUED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z2_RESCUED', value: true },
      { action: 'moveToObject', objectId: 'evacuation_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_RESCUE_RECORD'],
      flags: { FLAG_C3Z2_COMPLETE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 4,
      dialogueContains: ['带着陈匠离开', '不存在', '救援完成'],
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
  window.C3_Z2_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C3-Z2] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
