// ============================================================================
// C3-Z1.test.js - 维修局：例外许可签发
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 例外许可签发处，解锁深度介入能力
// ============================================================================

const ZONE_ID = 'C3-Z1';
const ZONE_NAME = '维修局：例外许可签发';

/**
 * C3-Z1 维修局：例外许可签发测试用例
 * 
 * 交互对象:
 * - gulin: 顾临（NPC对话）
 * - permit_folder: 许可文件夹（关键道具，解锁深度介入）
 * 
 * 关键事件:
 * - 解锁深度介入能力 (depthIntervention)
 */
const TESTS = [
  // ============================================
  // TC-C3Z1-01: 顾临对话
  // ============================================
  {
    id: 'TC-C3Z1-01',
    name: '顾临对话',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'gulin',
    objectName: '顾临',
    description: '与顾临对话，获得许可签发指引',
    preconditions: ['FLAG_C3Z1_ENTERED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z1_ENTERED', value: true },
      { action: 'moveToObject', objectId: 'gulin' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C3Z1_GULIN_SPOKE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 6,
      dialogueContains: ['你已经看见了', '今天开始你可以写入', '这是债，不是奖赏'],
    },
  },

  // ============================================
  // TC-C3Z1-02: 许可文件夹交互（未与顾临对话）
  // ============================================
  {
    id: 'TC-C3Z1-02',
    name: '许可文件夹交互（条件不满足）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'permit_folder',
    objectName: '许可文件夹',
    description: '在未与顾临对话前尝试访问许可文件夹',
    preconditions: ['FLAG_C3Z1_GULIN_SPOKE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z1_GULIN_SPOKE', value: false },
      { action: 'moveToObject', objectId: 'permit_folder' },
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
      dialogueContent: '需要先获得授权',
      expectedLines: 1,
      dialogueContains: ['需要先获得授权'],
    },
  },

  // ============================================
  // TC-C3Z1-03: 许可文件夹签署（关键交互）
  // ============================================
  {
    id: 'TC-C3Z1-03',
    name: '许可文件夹签署 - 解锁深度介入',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'permit_folder',
    objectName: '许可文件夹',
    description: '签署许可文件，获得深度介入能力解锁卡片',
    critical: true,
    preconditions: ['FLAG_C3Z1_GULIN_SPOKE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z1_GULIN_SPOKE', value: true },
      { action: 'moveToObject', objectId: 'permit_folder' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '签署' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_DEPTH_INTERVENTION'],
      flags: { FLAG_DEPTH_INTERVENTION_UNLOCKED: true },
      abilities: ['depthIntervention'],
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 10,
      dialogueContains: ['深度介入许可', '警告：写入会增加解释成本', '签下了自己的名字', '许可已签发'],
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
  abilitiesCovered: [...new Set(TESTS.flatMap(t => t.expectedResults.abilities || []))],
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
  window.C3_Z1_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C3-Z1] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象, ${ZONE_STATS.criticalCount} 个关键交互`);
