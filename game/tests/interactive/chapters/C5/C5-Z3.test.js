// ============================================================================
// Footnote C5-Z3 诊疗台：许澄的抉择 ChromeMCP 测试脚本
// ============================================================================
// 生成时间: 2026-01-21
// Zone: C5-Z3 诊疗台：许澄的抉择
// 测试用例: 3 个
// ============================================================================

const ZONE_ID = 'C5-Z3';
const ZONE_NAME = '诊疗台：许澄的抉择';
const ZONE_DESCRIPTION = '岑回来到诊疗台，面对许澄的疗程说明，需要做出选择';

/**
 * C5-Z3 测试用例
 * 
 * 交互对象:
 * - treatment_card: 疗程说明卡（条件：FLAG_C5Z3_STARTED=true）
 * - choice_panel: 选择界面（条件：FLAG_C5Z3_READ_TREATMENT=true）
 */
const TESTS = [
  // ============================================
  // TC-C5Z3-01: 疗程说明卡
  // ============================================
  {
    id: 'TC-C5Z3-01',
    name: '疗程说明卡阅读',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'treatment_card',
    objectName: '疗程说明卡',
    description: '阅读疗程说明卡，了解治疗方案',
    preconditions: ['FLAG_C5Z3_STARTED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z3_STARTED', value: true },
      { action: 'moveToObject', objectId: 'treatment_card' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C5Z3_READ_TREATMENT: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z3_TREATMENT',
      foreshadow: null,
      nextZone: null,
      expectedLines: 8,
      dialogueContains: ['疗程说明', '稳定疗程', '对齐差异记忆', '差异卡将被覆盖'],
    },
  },

  // ============================================
  // TC-C5Z3-02a: 选择界面 - 我接受
  // ============================================
  {
    id: 'TC-C5Z3-02a',
    name: '选择界面 - 我接受治疗',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'choice_panel',
    objectName: '选择界面',
    description: '接受许澄的治疗方案，获得治疗回执',
    branch: '我接受',
    preconditions: ['FLAG_C5Z3_READ_TREATMENT = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z3_READ_TREATMENT', value: true },
      { action: 'moveToObject', objectId: 'choice_panel' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '我接受' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C5_TREATMENT_RECEIPT'],
      flags: { FLAG_TREATMENT_ACCEPT: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z3_CHOICE',
      foreshadow: null,
      nextZone: null,
      expectedLines: 10,
      dialogueContains: ['我接受', '接受了稳定疗程', '差异已对齐', '解释成本↓'],
    },
  },

  // ============================================
  // TC-C5Z3-02b: 选择界面 - 我拒绝 (R+2)
  // ============================================
  {
    id: 'TC-C5Z3-02b',
    name: '选择界面 - 我拒绝治疗 (R+2)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'choice_panel',
    objectName: '选择界面',
    description: '拒绝许澄的治疗方案，R+2，获得许澄的便条',
    branch: '我拒绝',
    preconditions: ['FLAG_C5Z3_READ_TREATMENT = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z3_READ_TREATMENT', value: true },
      { action: 'moveToObject', objectId: 'choice_panel' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 1, choiceText: '我拒绝' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C5_XUCHENG_NOTE'],
      flags: { FLAG_TREATMENT_REFUSE: true },
      rDelta: 2,
      pDelta: 0,
      dialogueId: 'C5Z3_CHOICE',
      foreshadow: null,
      nextZone: null,
      expectedLines: 6,
      dialogueContains: ['我拒绝', '拒绝了稳定疗程', '保住了一点东西', '私人笔记'],
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
  interactableObjects: ['treatment_card', 'choice_panel'],
  branches: 2,
  rValuePoints: 2, // 拒绝治疗 R+2
  pValuePoints: 0,
  cards: ['CARD_C5_TREATMENT_RECEIPT', 'CARD_C5_XUCHENG_NOTE'],
  flags: ['FLAG_C5Z3_STARTED', 'FLAG_C5Z3_READ_TREATMENT', 'FLAG_TREATMENT_ACCEPT', 'FLAG_TREATMENT_REFUSE'],
  foreshadows: [],
  exits: {
    forward: 'C5-Z4',
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
  window.C5_Z3_TESTS = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}

console.log(`[C5-Z3] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.interactableObjects.length} 个对象`);
