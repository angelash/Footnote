// ============================================================================
// CF-Z6.test.js - 尾声重访
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 尾声重访，与各角色告别
// ============================================================================

const ZONE_ID = 'CF-Z6';
const ZONE_NAME = '尾声重访';

/**
 * CF-Z6 尾声重访测试用例
 * 
 * 交互对象:
 * - gulin_entry: 顾临入口
 * - songlan_entry: 宋岚入口
 * - xucheng_entry: 许澄入口
 * - muping_entry: 牧平入口
 * - atang_entry: 阿棠入口
 * - qilan_entry: 栖蓝入口
 * - clear_hint: 通关提示（条件: 所有角色已访问）
 * 
 * 特性: 访问所有角色后触发完整通关
 */
const TESTS = [
  // ============================================
  // TC-CFZ6-01: 顾临入口交互
  // ============================================
  {
    id: 'TC-CFZ6-01',
    name: '顾临入口交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'gulin_entry',
    objectName: '顾临入口',
    description: '与顾临告别，获得条款卡片',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'gulin_entry' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_GULIN_CLAUSE'],
      flags: { FLAG_GULIN_SEEN: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 3,
      dialogueContains: ['维修局走廊', '城还能继续被读', '读不下去的东西'],
    },
  },

  // ============================================
  // TC-CFZ6-02: 宋岚入口交互
  // ============================================
  {
    id: 'TC-CFZ6-02',
    name: '宋岚入口交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'songlan_entry',
    objectName: '宋岚入口',
    description: '与宋岚告别，获得标签卡片',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'songlan_entry' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_SONGLAN_LABEL'],
      flags: { FLAG_SONGLAN_SEEN: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 3,
      dialogueContains: ['版本库', '最底层多了一格', '没删掉'],
    },
  },

  // ============================================
  // TC-CFZ6-03: 许澄入口交互
  // ============================================
  {
    id: 'TC-CFZ6-03',
    name: '许澄入口交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'xucheng_entry',
    objectName: '许澄入口',
    description: '与许澄告别，获得笔记卡片',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'xucheng_entry' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_XUCHENG_NOTE'],
      flags: { FLAG_XUCHENG_SEEN: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 3,
      dialogueContains: ['诊室', '人们稳定了', '不再敢说这叫痊愈'],
    },
  },

  // ============================================
  // TC-CFZ6-04: 牧平入口交互
  // ============================================
  {
    id: 'TC-CFZ6-04',
    name: '牧平入口交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'muping_entry',
    objectName: '牧平入口',
    description: '与牧平告别，获得祈祷结果卡片',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'muping_entry' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_PRAYER_RESULT'],
      flags: { FLAG_MUPING_SEEN: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 3,
      dialogueContains: ['礼堂', '纸还在', '折痕'],
    },
  },

  // ============================================
  // TC-CFZ6-05: 阿棠入口交互
  // ============================================
  {
    id: 'TC-CFZ6-05',
    name: '阿棠入口交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'atang_entry',
    objectName: '阿棠入口',
    description: '与阿棠告别，获得日记卡片',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'atang_entry' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_ATANG_DIARY'],
      flags: { FLAG_ATANG_SEEN: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 3,
      dialogueContains: ['窗边长椅', '还是会漂', '不再全是错'],
    },
  },

  // ============================================
  // TC-CFZ6-06: 栖蓝入口交互
  // ============================================
  {
    id: 'TC-CFZ6-06',
    name: '栖蓝入口交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'qilan_entry',
    objectName: '栖蓝入口',
    description: '与栖蓝告别，获得笔记卡片',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'qilan_entry' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_CF_QILAN_NOTE'],
      flags: { FLAG_QILAN_SEEN: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 3,
      dialogueContains: ['街角', '它还在', '这就够了'],
    },
  },

  // ============================================
  // TC-CFZ6-07: 通关提示交互（条件未满足）
  // ============================================
  {
    id: 'TC-CFZ6-07',
    name: '通关提示交互（条件未满足）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'clear_hint',
    objectName: '通关提示',
    description: '未访问所有角色时，通关提示不触发',
    preconditions: ['FLAG_GULIN_SEEN = true', 'FLAG_SONGLAN_SEEN = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_GULIN_SEEN', value: true },
      { action: 'setFlag', flag: 'FLAG_SONGLAN_SEEN', value: false },
      { action: 'moveToObject', objectId: 'clear_hint' },
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
      dialogueContains: ['还有角色', '未访问'],
    },
  },

  // ============================================
  // TC-CFZ6-08: 通关提示交互（所有角色已访问）
  // ============================================
  {
    id: 'TC-CFZ6-08',
    name: '通关提示交互（完整通关）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'clear_hint',
    objectName: '通关提示',
    description: '访问所有角色后，触发完整通关',
    preconditions: [
      'FLAG_GULIN_SEEN = true',
      'FLAG_SONGLAN_SEEN = true',
      'FLAG_XUCHENG_SEEN = true',
      'FLAG_MUPING_SEEN = true',
      'FLAG_ATANG_SEEN = true',
      'FLAG_QILAN_SEEN = true',
    ],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_GULIN_SEEN', value: true },
      { action: 'setFlag', flag: 'FLAG_SONGLAN_SEEN', value: true },
      { action: 'setFlag', flag: 'FLAG_XUCHENG_SEEN', value: true },
      { action: 'setFlag', flag: 'FLAG_MUPING_SEEN', value: true },
      { action: 'setFlag', flag: 'FLAG_ATANG_SEEN', value: true },
      { action: 'setFlag', flag: 'FLAG_QILAN_SEEN', value: true },
      { action: 'moveToObject', objectId: 'clear_hint' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_ALL_EPILOGUE_SEEN: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 10,
      dialogueContains: ['通关', '多余的事', '改变了世界', '字段模式'],
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
  charactersCovered: ['顾临', '宋岚', '许澄', '牧平', '阿棠', '栖蓝'],
};

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.CF_Z6_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[CF-Z6] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.charactersCovered.length} 位角色`);
