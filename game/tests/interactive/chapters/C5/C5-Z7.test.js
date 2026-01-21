// ============================================================================
// Footnote C5-Z7 "此行为在当前模型中无意义" ChromeMCP 测试脚本
// ============================================================================
// 生成时间: 2026-01-21
// Zone: C5-Z7 "此行为在当前模型中无意义"
// 测试用例: 4 个
// 伏笔: F21 触发
// ============================================================================

const ZONE_ID = 'C5-Z7';
const ZONE_NAME = '"此行为在当前模型中无意义"';
const ZONE_DESCRIPTION = '岑回进入系统判定区域，执行一系列"无意义"的行为，触发 F21 判词';

/**
 * C5-Z7 测试用例
 * 
 * 交互对象:
 * - blank_label: 空白标签（贴回墙上）
 * - chair_outline: 椅脚印描边（重新描一遍）
 * - version_card_slot: 版本卡（放入版本卡，critical）
 * - f21_trigger: F21判词触发点（条件：FLAG_C5Z7_TASKS_DONE=true，critical）
 */
const TESTS = [
  // ============================================
  // TC-C5Z7-01: 空白标签 - 贴回墙上
  // ============================================
  {
    id: 'TC-C5Z7-01',
    name: '空白标签 - 贴回墙上',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'blank_label',
    objectName: '空白标签',
    description: '将空白标签贴回墙上',
    branch: '贴回墙上',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'blank_label' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '贴回墙上' },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C5Z7_TASK_A_DONE: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z7_LABEL',
      foreshadow: null,
      nextZone: null,
      expectedLines: 3,
      dialogueContains: ['空白标签', '贴回墙上', '无奖励'],
    },
  },

  // ============================================
  // TC-C5Z7-02: 椅脚印描边 - 重新描一遍
  // ============================================
  {
    id: 'TC-C5Z7-02',
    name: '椅脚印描边 - 重新描一遍',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'chair_outline',
    objectName: '椅脚印描边',
    description: '重新描一遍椅脚印',
    branch: '重新描一遍',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'chair_outline' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '重新描一遍' },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C5Z7_TASK_B_DONE: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z7_OUTLINE',
      foreshadow: null,
      nextZone: null,
      expectedLines: 3,
      dialogueContains: ['椅脚印描边', '重新描一遍', '无奖励'],
    },
  },

  // ============================================
  // TC-C5Z7-03: 版本卡 - 放入版本卡 (critical, F21触发)
  // ============================================
  {
    id: 'TC-C5Z7-03',
    name: '版本卡 - 放入版本卡 (F21触发前置)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'version_card_slot',
    objectName: '版本卡',
    description: '放入版本卡，完成所有任务，准备触发 F21',
    branch: '放入版本卡',
    preconditions: ['FLAG_C5Z7_TASK_A_DONE = true', 'FLAG_C5Z7_TASK_B_DONE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z7_TASK_A_DONE', value: true },
      { action: 'setFlag', flag: 'FLAG_C5Z7_TASK_B_DONE', value: true },
      { action: 'moveToObject', objectId: 'version_card_slot' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '放入版本卡' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C5Z7_TASK_C_DONE: true, FLAG_C5Z7_TASKS_DONE: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z7_VERSION_CARD',
      foreshadow: { id: 'F21', action: 'trigger' },
      nextZone: null,
      expectedLines: 5,
      dialogueContains: ['版本库的最底层', '放入版本卡', '纯仪式感', '无奖励'],
    },
    critical: true,
    foreshadowTest: true,
  },

  // ============================================
  // TC-C5Z7-04: F21判词触发点 (R+1, critical)
  // ============================================
  {
    id: 'TC-C5Z7-04',
    name: 'F21判词触发点 - 判词显现 (R+1)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'f21_trigger',
    objectName: 'F21判词触发点',
    description: '触发 F21 判词，"此行为在当前模型中无意义"，获得判词卡片，R+1',
    preconditions: ['FLAG_C5Z7_TASKS_DONE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z7_TASKS_DONE', value: true },
      { action: 'moveToObject', objectId: 'f21_trigger' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 3000 },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: ['CARD_C5_F21_JUDGMENT'],
      flags: { FLAG_F21_TRIGGERED: true },
      rDelta: 1,
      pDelta: 0,
      dialogueId: 'C5Z7_F21',
      foreshadow: { id: 'F21', action: 'triggered' },
      nextZone: null,
      expectedLines: 6,
      dialogueContains: ['此行为在当前模型中无意义', '结算卡', '新增字段将提高解释成本'],
    },
    critical: true,
    rValueTest: true,
    foreshadowTest: true,
  },
];

// ============================================================================
// 测试统计
// ============================================================================
const ZONE_STATS = {
  zoneId: ZONE_ID,
  zoneName: ZONE_NAME,
  totalTests: TESTS.length,
  interactableObjects: ['blank_label', 'chair_outline', 'version_card_slot', 'f21_trigger'],
  branches: 3,
  rValuePoints: 1, // F21判词 R+1
  pValuePoints: 0,
  cards: ['CARD_C5_F21_JUDGMENT'],
  flags: ['FLAG_C5Z7_TASK_A_DONE', 'FLAG_C5Z7_TASK_B_DONE', 'FLAG_C5Z7_TASK_C_DONE', 'FLAG_C5Z7_TASKS_DONE', 'FLAG_F21_TRIGGERED'],
  foreshadows: ['F21'],
  exits: {
    forward: 'CF-Z1', // 进入终章
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
  window.C5_Z7_TESTS = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}

console.log(`[C5-Z7] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.interactableObjects.length} 个对象`);
