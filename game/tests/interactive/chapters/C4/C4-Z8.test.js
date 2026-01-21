// ============================================================================
// C4-Z8.test.js - 市政环：顾临的限制
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 市政环，顾临设置干预限制，章节结束
// 关键事件: FLAG_C4_COMPLETE 设置
// ============================================================================

const ZONE_ID = 'C4-Z8';
const ZONE_NAME = '市政环：顾临的限制';

/**
 * C4-Z8 市政环：顾临的限制测试用例
 * 
 * 交互对象:
 * - gulin: 顾临（对话）
 * - permission_panel: 权限面板（条件触发）
 * - exit_point: 离开点（条件触发，章节结束）
 */
const TESTS = [
  // ============================================
  // TC-C4Z8-01: 顾临交互
  // ============================================
  {
    id: 'TC-C4Z8-01',
    name: '顾临交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'gulin',
    objectName: '顾临',
    description: '与顾临对话',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'gulin' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z8_GULIN_SPOKE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 顾临限制对话
      expectedLines: 4,
      dialogueContains: ['用得太频繁', '解释成本上升', '不是在惩罚你', '继续被读下去'],
    },
  },

  // ============================================
  // TC-C4Z8-02: 权限面板交互
  // ============================================
  {
    id: 'TC-C4Z8-02',
    name: '权限面板交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'permission_panel',
    objectName: '权限面板',
    description: '与顾临对话后，查看权限面板，获得卡片',
    preconditions: ['FLAG_C4Z8_GULIN_SPOKE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z8_GULIN_SPOKE', value: true },
      { action: 'moveToObject', objectId: 'permission_panel' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C4_PERMISSION_CHANGE'],
      flags: { FLAG_C4Z8_SHOW_RESTRICTED: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 权限面板
      expectedLines: 6,
      dialogueContains: ['写入权限', '暂挂审核', '解释成本超阈值', '减少干预', '某些区域会受限'],
    },
  },

  // ============================================
  // TC-C4Z8-03: 权限面板 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z8-03',
    name: '权限面板 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'permission_panel',
    objectName: '权限面板（条件不满足）',
    description: '未与顾临对话时，权限面板不可查看',
    preconditions: ['FLAG_C4Z8_GULIN_SPOKE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z8_GULIN_SPOKE', value: false },
      { action: 'moveToObject', objectId: 'permission_panel' },
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
      // 对话验证 - 介入禁用演示
      expectedLines: 3,
      dialogueContains: ['深度视野', '介入', '变灰', '待审'],
    },
  },

  // ============================================
  // TC-C4Z8-04: 离开点交互 - 完成章节
  // ============================================
  {
    id: 'TC-C4Z8-04',
    name: '离开点交互 - 完成章节',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_point',
    objectName: '离开点',
    description: '干预限制设置后，离开完成第四章',
    preconditions: ['FLAG_INTERVENTION_RESTRICTED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_INTERVENTION_RESTRICTED', value: true },
      { action: 'moveToObject', objectId: 'exit_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4_COMPLETE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 离开完成章节
      expectedLines: 5,
      dialogueContains: ['去吧', '权限收紧', '仍然能选择', '会更难'],
    },
  },

  // ============================================
  // TC-C4Z8-05: 离开点 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z8-05',
    name: '离开点 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_point',
    objectName: '离开点（条件不满足）',
    description: '干预限制未设置时，无法离开',
    preconditions: ['FLAG_INTERVENTION_RESTRICTED = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_INTERVENTION_RESTRICTED', value: false },
      { action: 'moveToObject', objectId: 'exit_point' },
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
      // 对话验证 - 条件不满足提示
      expectedLines: 1,
      dialogueContains: ['还需要完成权限确认'],
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
  isChapterEnd: true,
};

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.C4_Z8_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C4-Z8] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象 [章节结束点]`);
