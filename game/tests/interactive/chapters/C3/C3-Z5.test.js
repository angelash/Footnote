// ============================================================================
// C3-Z5.test.js - 诊疗台：病例卡1
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 许澄的诊疗台，获取第一张病例卡
// ============================================================================

const ZONE_ID = 'C3-Z5';
const ZONE_NAME = '诊疗台：病例卡1';

/**
 * C3-Z5 诊疗台测试用例
 * 
 * 交互对象:
 * - symptom_list: 症状清单（条件交互）
 * - med_card_point: 病例卡领取点（条件交互，伏笔F14）
 * 
 * 关键事件:
 * - 伏笔 F14 投放
 * - 获取病例卡
 */
const TESTS = [
  // ============================================
  // TC-C3Z5-01: 症状清单交互（未开始）
  // ============================================
  {
    id: 'TC-C3Z5-01',
    name: '症状清单交互（未开始）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'symptom_list',
    objectName: '症状清单',
    description: '在未开始诊疗前查看症状清单',
    preconditions: ['FLAG_C3Z5_STARTED = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z5_STARTED', value: false },
      { action: 'moveToObject', objectId: 'symptom_list' },
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
      dialogueContent: '需要先登记',
    },
  },

  // ============================================
  // TC-C3Z5-02: 症状清单 - 完成填写
  // ============================================
  {
    id: 'TC-C3Z5-02',
    name: '症状清单 - 完成填写',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'symptom_list',
    objectName: '症状清单',
    description: '开始诊疗后填写症状清单',
    preconditions: ['FLAG_C3Z5_STARTED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z5_STARTED', value: true },
      { action: 'moveToObject', objectId: 'symptom_list' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C3Z5_SYMPTOMS_DONE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C3Z5-03: 病例卡领取点交互（未完成症状）
  // ============================================
  {
    id: 'TC-C3Z5-03',
    name: '病例卡领取点交互（条件不满足）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'med_card_point',
    objectName: '病例卡领取点',
    description: '在未完成症状清单前尝试领取病例卡',
    preconditions: ['FLAG_C3Z5_SYMPTOMS_DONE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z5_SYMPTOMS_DONE', value: false },
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
      dialogueContent: '请先填写症状清单',
    },
  },

  // ============================================
  // TC-C3Z5-04: 病例卡领取 - 获取病例卡
  // ============================================
  {
    id: 'TC-C3Z5-04',
    name: '病例卡领取 - 获取病例卡',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'med_card_point',
    objectName: '病例卡领取点',
    description: '完成症状清单后领取病例卡，触发伏笔F14',
    preconditions: ['FLAG_C3Z5_SYMPTOMS_DONE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z5_SYMPTOMS_DONE', value: true },
      { action: 'moveToObject', objectId: 'med_card_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_MED_CARD_01'],
      flags: { FLAG_MED_CARD_01: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: { id: 'F14', action: 'plant' },
      nextZone: null,
    },
  },

  // ============================================
  // TC-C3Z5-05: 完整流程测试
  // ============================================
  {
    id: 'TC-C3Z5-05',
    name: '完整流程：症状清单 → 病例卡领取',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'med_card_point',
    objectName: '病例卡领取点',
    description: '完整体验诊疗台流程',
    preconditions: ['FLAG_C3Z5_STARTED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z5_STARTED', value: true },
      // 先填写症状清单
      { action: 'moveToObject', objectId: 'symptom_list' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'closeDialogue' },
      { action: 'wait', duration: 1000 },
      // 再领取病例卡
      { action: 'moveToObject', objectId: 'med_card_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_MED_CARD_01'],
      flags: { FLAG_C3Z5_SYMPTOMS_DONE: true, FLAG_MED_CARD_01: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: { id: 'F14', action: 'plant' },
      nextZone: null,
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
  window.C3_Z5_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C3-Z5] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
