// ============================================================================
// C0-Z3.test.js - 薄墙巷口
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 两栋建筑之间的狭窄巷道，F01 薄墙回声首次出现
// ============================================================================

const ZONE_ID = 'C0-Z3';
const ZONE_NAME = '薄墙巷口';

/**
 * C0-Z3 薄墙巷口测试用例
 * 
 * 交互对象:
 * - thin_wall: 薄墙（普通点击/长按两种交互）
 * - crooked_sign: 歪斜路标
 * - wall_nail: 钉子（分支选择）
 * - exit_to_bureau: 前往维修局
 * - exit_back: 返回早餐店
 */
const TESTS = [
  // ============================================
  // TC-C0Z3-01a: 薄墙交互（普通点击）
  // ============================================
  {
    id: 'TC-C0Z3-01a',
    name: '薄墙交互（普通点击）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'thin_wall',
    objectName: '薄墙',
    description: '普通点击薄墙，只显示描述',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'thin_wall' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueContent: '一面薄墙。表面看起来正常',
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C0Z3-01b: 薄墙交互（长按触发回声）
  // ============================================
  {
    id: 'TC-C0Z3-01b',
    name: '薄墙交互（长按1000ms触发回声）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'thin_wall',
    objectName: '薄墙',
    description: '长按薄墙，触发 F01 伏笔，获得巷道记录卡片',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'thin_wall' },
      { action: 'longPress', duration: 1000 },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: ['CARD_C0_ALLEY_RECORD'],
      flags: { FLAG_HEARD_WALL_ECHO: true },
      rDelta: 0,
      pDelta: 0,
      dialogueContent: '低频回声在墙内回荡……里面是空的',
      foreshadow: { id: 'F01', action: 'plant' },
      nextZone: null,
    },
  },

  // ============================================
  // TC-C0Z3-02: 歪斜路标交互
  // ============================================
  {
    id: 'TC-C0Z3-02',
    name: '歪斜路标交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'crooked_sign',
    objectName: '歪斜路标',
    description: '普通对话，观察歪斜的路标',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'crooked_sign' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueContent: '路标歪了。暂时不能修，不在任务范围内',
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C0Z3-03a: 钉子交互 - 收起来
  // ============================================
  {
    id: 'TC-C0Z3-03a',
    name: '钉子交互 - 收起来',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'wall_nail',
    objectName: '钉子',
    description: '选择收起钉子，获得钉子卡片',
    branch: '收起来',
    preconditions: ['FLAG_HAS_NAIL = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_HAS_NAIL', value: false },
      { action: 'moveToObject', objectId: 'wall_nail' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '收起来' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C0_NAIL'],
      flags: { FLAG_HAS_NAIL: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C0Z3-03b: 钉子交互 - 不需要
  // ============================================
  {
    id: 'TC-C0Z3-03b',
    name: '钉子交互 - 不需要',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'wall_nail',
    objectName: '钉子',
    description: '选择不需要，不获取钉子',
    branch: '不需要',
    preconditions: ['FLAG_HAS_NAIL = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_HAS_NAIL', value: false },
      { action: 'moveToObject', objectId: 'wall_nail' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 1, text: '不需要' },
      { action: 'wait', duration: 2000 },
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
  // TC-C0Z3-04: 前往维修局（跳转 C0-Z4）
  // ============================================
  {
    id: 'TC-C0Z3-04',
    name: '前往维修局（跳转C0-Z4）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_to_bureau',
    objectName: '前往维修局',
    description: '离开巷口，进入维修局前台',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'exit_to_bureau' },
      { action: 'interact' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: 'C0-Z4',
    },
  },

  // ============================================
  // TC-C0Z3-05: 返回早餐店（跳转 C0-Z2）
  // ============================================
  {
    id: 'TC-C0Z3-05',
    name: '返回早餐店（跳转C0-Z2）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_back',
    objectName: '返回早餐店',
    description: '返回早餐小店',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'exit_back' },
      { action: 'interact' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: 'C0-Z2',
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
  window.C0_Z3_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C0-Z3] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
