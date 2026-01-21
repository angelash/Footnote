// ============================================================================
// C4-Z7.test.js - 礼堂街：祷文抄本3
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 礼堂街，获取第三份祷文抄本
// ============================================================================

const ZONE_ID = 'C4-Z7';
const ZONE_NAME = '礼堂街：祷文抄本3';

/**
 * C4-Z7 礼堂街测试用例
 * 
 * 交互对象:
 * - muping: 牧平（对话）
 * - prayer_scroll: 抄本领取处（条件触发）
 */
const TESTS = [
  // ============================================
  // TC-C4Z7-01: 牧平交互
  // ============================================
  {
    id: 'TC-C4Z7-01',
    name: '牧平交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'muping',
    objectName: '牧平',
    description: '与牧平对话',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'muping' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z7_MUPING_SPOKE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C4Z7-02: 抄本领取处交互
  // ============================================
  {
    id: 'TC-C4Z7-02',
    name: '抄本领取处交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'prayer_scroll',
    objectName: '抄本领取处',
    description: '与牧平对话后，领取祷文抄本3',
    preconditions: ['FLAG_C4Z7_MUPING_SPOKE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z7_MUPING_SPOKE', value: true },
      { action: 'moveToObject', objectId: 'prayer_scroll' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C4_PRAYER_03'],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C4Z7-03: 抄本领取处 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z7-03',
    name: '抄本领取处 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'prayer_scroll',
    objectName: '抄本领取处（条件不满足）',
    description: '未与牧平对话时，无法领取抄本',
    preconditions: ['FLAG_C4Z7_MUPING_SPOKE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z7_MUPING_SPOKE', value: false },
      { action: 'moveToObject', objectId: 'prayer_scroll' },
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
      dialogueContent: '需要先与牧平交谈',
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
  window.C4_Z7_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C4-Z7] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
