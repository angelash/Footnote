// ============================================================================
// C0-Z1.test.js - 宿舍走廊
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 维修局新人宿舍的走廊，灯光昏暗
// ============================================================================

const ZONE_ID = 'C0-Z1';
const ZONE_NAME = '宿舍走廊';

/**
 * C0-Z1 宿舍走廊测试用例
 * 
 * 交互对象:
 * - identity_card: 身份卡
 * - notice_board: 公告板（分支选择）
 * - storage_cabinet: 储物柜（条件交互）
 * - corridor_door: 邻居的门
 * - exit_door: 出口
 */
const TESTS = [
  // ============================================
  // TC-C0Z1-01: 身份卡交互
  // ============================================
  {
    id: 'TC-C0Z1-01',
    name: '身份卡交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'identity_card',
    objectName: '身份卡',
    description: '检查身份卡获取基础卡片',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'identity_card' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
    ],
    expectedResults: {
      cards: ['CARD_C0_IDENTITY'],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证（新增）
      expectedLines: 2,
      dialogueContains: ['身份识别卡', '岑回'],
    },
  },

  // ============================================
  // TC-C0Z1-02a: 公告板交互 - 仔细查看
  // ============================================
  {
    id: 'TC-C0Z1-02a',
    name: '公告板交互 - 仔细查看',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'notice_board',
    objectName: '公告板',
    description: '选择仔细查看，触发 R+1 和伏笔 F02',
    branch: '仔细查看',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'notice_board' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '仔细查看' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_SEEN_NOTICE: true },
      rDelta: 1,
      pDelta: 0,
      foreshadow: { id: 'F02', action: 'plant' },
      nextZone: null,
      // 对话验证（新增）- 选择仔细查看后有2行额外对话
      expectedLines: 5, // 3行(公告板)+2行(仔细查看后)
      dialogueContains: ['公告板', '第274周期', '第275周期', '维修配额'],
    },
  },

  // ============================================
  // TC-C0Z1-02b: 公告板交互 - 算了
  // ============================================
  {
    id: 'TC-C0Z1-02b',
    name: '公告板交互 - 算了不重要',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'notice_board',
    objectName: '公告板',
    description: '选择算了，无额外效果',
    branch: '算了',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'notice_board' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 1, text: '算了，不重要' },
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
  // TC-C0Z1-03: 储物柜交互（首次 - 未取过）
  // ============================================
  {
    id: 'TC-C0Z1-03',
    name: '储物柜交互（首次）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'storage_cabinet',
    objectName: '储物柜',
    description: '首次打开储物柜，获得餐票',
    preconditions: ['FLAG_C0Z1_GOT_TOOLS = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C0Z1_GOT_TOOLS', value: false },
      { action: 'moveToObject', objectId: 'storage_cabinet' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C0_MEAL_TICKET'],
      flags: { FLAG_C0Z1_GOT_TOOLS: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证（新增）- 关键！必须显示两行对话
      expectedLines: 2,
      dialogueContains: ['工具包已经准备好了', '早餐券也在这里'],
    },
  },

  // ============================================
  // TC-C0Z1-04: 储物柜交互（已取过）
  // ============================================
  {
    id: 'TC-C0Z1-04',
    name: '储物柜交互（已取过）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'storage_cabinet',
    objectName: '储物柜（已取过）',
    description: '再次查看储物柜，显示已空',
    preconditions: ['FLAG_C0Z1_GOT_TOOLS = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C0Z1_GOT_TOOLS', value: true },
      { action: 'moveToObject', objectId: 'storage_cabinet' },
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
      // 对话验证（新增）
      expectedLines: 1,
      dialogueContains: ['工具包已经取过了'],
      dialogueNotContains: ['早餐券'], // 不应该再提到餐票
    },
  },

  // ============================================
  // TC-C0Z1-05: 邻居的门交互
  // ============================================
  {
    id: 'TC-C0Z1-05',
    name: '邻居的门交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'corridor_door',
    objectName: '邻居的门',
    description: '普通对话，查看门上的号码牌',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'corridor_door' },
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
      // 对话验证（新增）
      expectedLines: 2,
      dialogueContains: ['邻居的门紧闭着', '7750'],
    },
  },

  // ============================================
  // TC-C0Z1-06: 出口跳转到 C0-Z2
  // ============================================
  {
    id: 'TC-C0Z1-06',
    name: '出口跳转到C0-Z2',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_door',
    objectName: '出口',
    description: '离开宿舍走廊，进入早餐小店',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'exit_door' },
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
  window.C0_Z1_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C0-Z1] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
