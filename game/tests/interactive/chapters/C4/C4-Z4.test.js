// ============================================================================
// C4-Z4.test.js - 诊疗台：病例卡2
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 诊疗台，获取第二张病例卡
// 关键事件: 伏笔 F14 投放
// ============================================================================

const ZONE_ID = 'C4-Z4';
const ZONE_NAME = '诊疗台：病例卡2';

/**
 * C4-Z4 诊疗台测试用例
 * 
 * 交互对象:
 * - xucheng: 许澄（开始对话）
 * - symptom_list_new: 回溯后症状清单（条件触发）
 * - med_card_point: 病例卡领取点（条件触发）
 */
const TESTS = [
  // ============================================
  // TC-C4Z4-01: 许澄交互
  // ============================================
  {
    id: 'TC-C4Z4-01',
    name: '许澄交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'xucheng',
    objectName: '许澄',
    description: '与许澄对话，开始诊疗流程',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'xucheng' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z4_STARTED: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C4Z4-02: 回溯后症状清单交互
  // ============================================
  {
    id: 'TC-C4Z4-02',
    name: '回溯后症状清单交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'symptom_list_new',
    objectName: '回溯后症状清单',
    description: '查看回溯后的症状清单',
    preconditions: ['FLAG_C4Z4_STARTED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z4_STARTED', value: true },
      { action: 'moveToObject', objectId: 'symptom_list_new' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C4Z4_SYMPTOMS_DONE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C4Z4-03: 回溯后症状清单 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z4-03',
    name: '回溯后症状清单 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'symptom_list_new',
    objectName: '回溯后症状清单（条件不满足）',
    description: '未与许澄对话时，症状清单不可查看',
    preconditions: ['FLAG_C4Z4_STARTED = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z4_STARTED', value: false },
      { action: 'moveToObject', objectId: 'symptom_list_new' },
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
    },
  },

  // ============================================
  // TC-C4Z4-04: 病例卡领取点交互 - 获取病例卡
  // ============================================
  {
    id: 'TC-C4Z4-04',
    name: '病例卡领取点交互 - 获取病例卡',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'med_card_point',
    objectName: '病例卡领取点',
    description: '完成症状检查后，领取病例卡2，触发伏笔 F14',
    preconditions: ['FLAG_C4Z4_SYMPTOMS_DONE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z4_SYMPTOMS_DONE', value: true },
      { action: 'moveToObject', objectId: 'med_card_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C4_MED_CARD_02'],
      flags: { FLAG_MED_CARD_02: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: { id: 'F14', action: 'plant' },
      nextZone: null,
    },
  },

  // ============================================
  // TC-C4Z4-05: 病例卡领取点 - 条件不满足
  // ============================================
  {
    id: 'TC-C4Z4-05',
    name: '病例卡领取点 - 条件不满足',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'med_card_point',
    objectName: '病例卡领取点（条件不满足）',
    description: '未完成症状检查时，无法领取病例卡',
    preconditions: ['FLAG_C4Z4_SYMPTOMS_DONE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C4Z4_SYMPTOMS_DONE', value: false },
      { action: 'moveToObject', objectId: 'med_card_point' },
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
      dialogueContent: '需要先完成症状检查',
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
  window.C4_Z4_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C4-Z4] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
