// ============================================================================
// Footnote C5-Z2 市政环：纠偏中心外围 ChromeMCP 测试脚本
// ============================================================================
// 生成时间: 2026-01-21
// Zone: C5-Z2 市政环：纠偏中心外围
// 测试用例: 2 个
// ============================================================================

const ZONE_ID = 'C5-Z2';
const ZONE_NAME = '市政环：纠偏中心外围';
const ZONE_DESCRIPTION = '岑回来到纠偏中心外围，需要提交报告并与顾临对话';

/**
 * C5-Z2 测试用例
 * 
 * 交互对象:
 * - submit_window: 提交窗口（条件：FLAG_C5Z2_ENTERED=true）
 * - gulin: 顾临（关键对话）
 */
const TESTS = [
  // ============================================
  // TC-C5Z2-01: 提交窗口
  // ============================================
  {
    id: 'TC-C5Z2-01',
    name: '提交窗口 - 提交报告',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'submit_window',
    objectName: '提交窗口',
    description: '在提交窗口提交报告，获得纠偏回执',
    preconditions: ['FLAG_C5Z2_ENTERED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z2_ENTERED', value: true },
      { action: 'moveToObject', objectId: 'submit_window' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: ['CARD_C5_CORRECTION_RECEIPT'],
      flags: { FLAG_C5Z2_SUBMITTED: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z2_SUBMIT',
      foreshadow: null,
      nextZone: null,
      expectedLines: 10,
      dialogueContains: ['版本冲突记录', '待结算', '字段：＿', '解释成本↑'],
    },
  },

  // ============================================
  // TC-C5Z2-02: 顾临对话 - 那就别结算 (R+1)
  // ============================================
  {
    id: 'TC-C5Z2-02',
    name: '顾临对话 - 那就别结算 (R+1)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'gulin',
    objectName: '顾临',
    description: '与顾临对话，选择"那就别结算"，R+1',
    branch: '那就别结算',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'gulin' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '那就别结算' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C5Z2_COMPLETE: true },
      rDelta: 1,
      pDelta: 0,
      dialogueId: 'C5Z2_GULIN',
      foreshadow: null,
      nextZone: null,
      expectedLines: 7,
      dialogueContains: ['不太好结算', '系统里停很久', '那就别结算', '系统不会等'],
    },
    critical: true,
    rValueTest: true,
  },
];

// ============================================================================
// 测试统计
// ============================================================================
const ZONE_STATS = {
  zoneId: ZONE_ID,
  zoneName: ZONE_NAME,
  totalTests: TESTS.length,
  interactableObjects: ['submit_window', 'gulin'],
  branches: 1,
  rValuePoints: 1, // 顾临对话 R+1
  pValuePoints: 0,
  cards: ['CARD_C5_CORRECTION_RECEIPT'],
  flags: ['FLAG_C5Z2_ENTERED', 'FLAG_C5Z2_SUBMITTED', 'FLAG_C5Z2_COMPLETE'],
  foreshadows: [],
  exits: {
    forward: 'C5-Z3',
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
  window.C5_Z2_TESTS = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}

console.log(`[C5-Z2] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.interactableObjects.length} 个对象`);
