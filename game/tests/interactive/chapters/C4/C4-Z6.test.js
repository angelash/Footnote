// ============================================================================
// C4-Z6.test.js - 栖蓝：无人需要的地图 【F21伏笔投放】
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 栖蓝相关区域，修复无人需要的地图
// 关键事件: 伏笔 F21 投放（plant）
// ============================================================================

const ZONE_ID = 'C4-Z6';
const ZONE_NAME = '栖蓝：无人需要的地图';

/**
 * C4-Z6 栖蓝：无人需要的地图测试用例
 * 
 * 交互对象:
 * - map_scroll: 地图卷
 * - glue_pot: 糨糊/胶水（条件触发）
 * - flatten_tool: 压平工具（条件触发）
 * - complete_point: 完成确认点（条件触发，关键）
 */
const TESTS = [
  // ============================================
  // TC-C4Z6-01: 地图卷交互
  // ============================================
  {
    id: 'TC-C4Z6-01',
    name: '地图卷交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'map_scroll',
    objectName: '地图卷',
    description: '查看地图卷',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'map_scroll' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z6_SAW_MAP: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 地图卷
      expectedLines: 5,
      dialogueContains: ['展开地图', '已不存在的巷子', '版本号', '消失了吗'],
    },
  },

  // ============================================
  // TC-C4Z6-02: 糨糊/胶水交互
  // ============================================
  {
    id: 'TC-C4Z6-02',
    name: '糨糊/胶水交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'glue_pot',
    objectName: '糨糊/胶水',
    description: '看过地图后，使用糨糊修复',
    preconditions: ['FLAG_C4Z6_SAW_MAP = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z6_SAW_MAP', value: true },
      { action: 'moveToObject', objectId: 'glue_pot' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z6_GLUE_APPLIED: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 抹胶
      expectedLines: 2,
      dialogueContains: ['地图背面抹上糨糊', '第1步完成'],
    },
  },

  // ============================================
  // TC-C4Z6-03: 糨糊/胶水 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z6-03',
    name: '糨糊/胶水 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'glue_pot',
    objectName: '糨糊/胶水（条件不满足）',
    description: '未看地图时，糨糊不可使用',
    preconditions: ['FLAG_C4Z6_SAW_MAP = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z6_SAW_MAP', value: false },
      { action: 'moveToObject', objectId: 'glue_pot' },
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
      // 对话验证 - 墙面位置普通描述
      expectedLines: 2,
      dialogueContains: ['破墙面', '平整的区域', '贴下一张地图'],
    },
  },

  // ============================================
  // TC-C4Z6-04: 压平工具交互
  // ============================================
  {
    id: 'TC-C4Z6-04',
    name: '压平工具交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'flatten_tool',
    objectName: '压平工具',
    description: '涂胶后，使用压平工具',
    preconditions: ['FLAG_C4Z6_GLUE_APPLIED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z6_GLUE_APPLIED', value: true },
      { action: 'moveToObject', objectId: 'flatten_tool' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z6_FLATTENED: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 压平
      expectedLines: 2,
      dialogueContains: ['贴在墙上', '用工具压平', '第2步完成'],
    },
  },

  // ============================================
  // TC-C4Z6-05: 压平工具 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z6-05',
    name: '压平工具 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'flatten_tool',
    objectName: '压平工具（条件不满足）',
    description: '未涂胶时，压平工具不可使用',
    preconditions: ['FLAG_C4Z6_GLUE_APPLIED = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z6_GLUE_APPLIED', value: false },
      { action: 'moveToObject', objectId: 'flatten_tool' },
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
      // 对话验证 - 栖蓝普通对话
      expectedLines: 3,
      dialogueContains: ['没用', '不想让它消失', '费点力气'],
    },
  },

  // ============================================
  // TC-C4Z6-06: 完成确认点交互 【关键】
  // ============================================
  {
    id: 'TC-C4Z6-06',
    name: '完成确认点交互 - 完成地图修复【关键】',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'complete_point',
    objectName: '完成确认点',
    description: '压平后确认完成，获得卡片，触发伏笔 F21，R+2',
    critical: true,
    preconditions: ['FLAG_C4Z6_FLATTENED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z6_FLATTENED', value: true },
      { action: 'moveToObject', objectId: 'complete_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C4_USELESS_MAP'],
      flags: { FLAG_MAP_PASTED: true },
      rDelta: 2,
      pDelta: 0,
      foreshadow: { id: 'F21', action: 'plant' },
      nextZone: null,
      // 对话验证 - 完成
      expectedLines: 9,
      dialogueContains: ['地图贴好了', '被抹去的地方', '无可用收益', '无法纳入当前模型', '谢谢'],
    },
  },

  // ============================================
  // TC-C4Z6-07: 完成确认点 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z6-07',
    name: '完成确认点 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'complete_point',
    objectName: '完成确认点（条件不满足）',
    description: '未完成压平时，无法确认完成',
    preconditions: ['FLAG_C4Z6_FLATTENED = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z6_FLATTENED', value: false },
      { action: 'moveToObject', objectId: 'complete_point' },
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
      dialogueContains: ['地图还没修复完成'],
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
  criticalTests: TESTS.filter(t => t.critical).map(t => t.id),
};

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.C4_Z6_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C4-Z6] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象, 关键测试: ${ZONE_STATS.criticalTests.length} 个`);
