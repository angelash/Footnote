// ============================================================================
// C4-Z1.test.js - 坍塌后的生活区（重访）
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 坍塌后的生活区，重访场景，灾后重建中
// ============================================================================

const ZONE_ID = 'C4-Z1';
const ZONE_NAME = '坍塌后的生活区（重访）';

/**
 * C4-Z1 坍塌后的生活区（重访）测试用例
 * 
 * 交互对象:
 * - resident_a: 住户A（普通对话）
 * - scattered_items: 散落的物品（帮忙归整）
 * - notice_board: 临时公告板
 */
const TESTS = [
  // ============================================
  // TC-C4Z1-01: 住户A交互
  // ============================================
  {
    id: 'TC-C4Z1-01',
    name: '住户A交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'resident_a',
    objectName: '住户A',
    description: '与住户A进行普通对话',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'resident_a' },
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
      // 对话验证
      expectedLines: 6,
      dialogueContains: ['昨天你来过', '他昨天根本没出现', '封锁线都没拉'],
    },
  },

  // ============================================
  // TC-C4Z1-02: 散落的物品交互 - 帮忙归整
  // ============================================
  {
    id: 'TC-C4Z1-02',
    name: '散落的物品交互 - 帮忙归整',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'scattered_items',
    objectName: '散落的物品',
    description: '帮忙归整散落的物品，触发 R+1 和 FLAG',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'scattered_items' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '帮忙归整' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_HELPED_RESIDENT: true },
      rDelta: 1,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 帮忙归整分支
      expectedLines: 5,
      dialogueContains: ['散落的物品', '帮我收拾', '谢谢', '没有奖励'],
    },
  },

  // ============================================
  // TC-C4Z1-03: 临时公告板交互
  // ============================================
  {
    id: 'TC-C4Z1-03',
    name: '临时公告板交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'notice_board',
    objectName: '临时公告板',
    description: '查看临时公告板，获得卡片',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'notice_board' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C4_TEMP_NOTICE'],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 封锁胶带/公告板
      expectedLines: 4,
      dialogueContains: ['封锁胶带', '日期标注', '被涂改过'],
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
  window.C4_Z1_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C4-Z1] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
