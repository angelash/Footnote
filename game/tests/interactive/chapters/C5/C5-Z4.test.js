// ============================================================================
// Footnote C5-Z4 礼堂街：牧平的"页背风暴" ChromeMCP 测试脚本
// ============================================================================
// 生成时间: 2026-01-21
// Zone: C5-Z4 礼堂街：牧平的"页背风暴"
// 测试用例: 2 个
// ============================================================================

const ZONE_ID = 'C5-Z4';
const ZONE_NAME = '礼堂街：牧平的"页背风暴"';
const ZONE_DESCRIPTION = '岑回来到礼堂街，遇见牧平，了解他的信仰和祈祷文';

/**
 * C5-Z4 测试用例
 * 
 * 交互对象:
 * - muping: 牧平（触发对话）
 * - prayer_scroll: 抄本领取处（条件：FLAG_C5Z4_MUPING_SPOKE=true）
 */
const TESTS = [
  // ============================================
  // TC-C5Z4-01: 牧平对话
  // ============================================
  {
    id: 'TC-C5Z4-01',
    name: '牧平对话',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'muping',
    objectName: '牧平',
    description: '与牧平对话，了解他的信仰',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'muping' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C5Z4_MUPING_SPOKE: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z4_MUPING',
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C5Z4-02: 抄本领取处
  // ============================================
  {
    id: 'TC-C5Z4-02',
    name: '抄本领取处 - 领取祈祷文',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'prayer_scroll',
    objectName: '抄本领取处',
    description: '在抄本领取处领取祈祷文卡片',
    preconditions: ['FLAG_C5Z4_MUPING_SPOKE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z4_MUPING_SPOKE', value: true },
      { action: 'moveToObject', objectId: 'prayer_scroll' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: ['CARD_C5_PRAYER_04'],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z4_PRAYER',
      foreshadow: null,
      nextZone: null,
    },
  },
];

// ============================================================================
// 测试统计
// ============================================================================
const ZONE_STATS = {
  zoneId: ZONE_ID,
  zoneName: ZONE_NAME,
  totalTests: TESTS.length,
  interactableObjects: ['muping', 'prayer_scroll'],
  branches: 0,
  rValuePoints: 0,
  pValuePoints: 0,
  cards: ['CARD_C5_PRAYER_04'],
  flags: ['FLAG_C5Z4_MUPING_SPOKE'],
  foreshadows: [],
  exits: {
    forward: 'C5-Z5',
  },
};

// ============================================================================
// 导出
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.C5_Z4_TESTS = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}

console.log(`[C5-Z4] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.interactableObjects.length} 个对象`);
