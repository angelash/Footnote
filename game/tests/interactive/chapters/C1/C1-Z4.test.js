// ============================================================================
// Footnote C1-Z4 诊疗台候诊区 ChromeMCP 测试脚本
// ============================================================================
// 生成时间: 2026-01-21
// Zone: C1-Z4 诊疗台候诊区
// 测试用例: 6 个
// ============================================================================

const ZONE_ID = 'C1-Z4';
const ZONE_NAME = '诊疗台候诊区';
const ZONE_DESCRIPTION = '维修局诊疗台候诊区，首次遇见许澄和阿棠';

/**
 * C1-Z4 测试用例
 */
const TESTS = [
  // TC-C1Z4-01: 问卷台交互
  {
    id: 'TC-C1Z4-01',
    name: '问卷台 - 开始填写',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'questionnaire_desk',
    objectName: '问卷台',
    description: '在问卷台填写健康问卷，获得问卷卡片',
    branch: '开始填写',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'questionnaire_desk' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '开始填写' },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: ['CARD_C1_QUESTIONNAIRE'],
      flags: { FLAG_C1Z4_QUESTIONNAIRE_DONE: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z4_QUESTIONNAIRE',
      expectedLines: 14,
      dialogueContains: ['记忆一致性评估', '状态稳定', '已对齐'],
      foreshadow: { id: 'F14', action: 'plant' },
      nextZone: null,
    },
  },

  // TC-C1Z4-01b: 问卷台 - 跳过
  {
    id: 'TC-C1Z4-01b',
    name: '问卷台 - 跳过',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'questionnaire_desk',
    objectName: '问卷台',
    description: '选择跳过问卷填写',
    branch: '跳过',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'questionnaire_desk' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 1, choiceText: '跳过' },
      { action: 'wait', duration: 1000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z4_QUESTIONNAIRE_SKIP',
      expectedLines: 4,
      dialogueContains: ['记忆一致性评估', '先看看其他'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z4-02: 许澄交互
  {
    id: 'TC-C1Z4-02',
    name: '许澄交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'xucheng',
    objectName: '许澄',
    description: '与许澄医生交谈',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'xucheng' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_MET_XUCHENG: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z4_XUCHENG',
      expectedLines: 9,
      dialogueContains: ['别强迫自己记住', '帮助大家适应', '记忆和现实之间的不一致'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z4-03: 阿棠（远处）交互
  {
    id: 'TC-C1Z4-03',
    name: '阿棠（远处）交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'atang_distant',
    objectName: '阿棠（远处）',
    description: '注意到远处的阿棠，加深F14伏笔',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'atang_distant' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z4_ATANG_DISTANT',
      expectedLines: 4,
      dialogueContains: ['你刚刚是不是又走了一遍', '她已经走开了'],
      foreshadow: { id: 'F14', action: 'deepen' },
      nextZone: null,
    },
  },

  // TC-C1Z4-04: 离开到C1-Z5（需FLAG）
  {
    id: 'TC-C1Z4-04',
    name: '离开到礼堂街 (C1-Z5)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_forward',
    objectName: '离开',
    description: '完成问卷后离开候诊区',
    preconditions: [{ flag: 'FLAG_C1Z4_QUESTIONNAIRE_DONE', value: true }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1Z4_QUESTIONNAIRE_DONE', value: true },
      { action: 'moveToObject', objectId: 'exit_forward' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForSceneTransition', timeout: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: null,
      foreshadow: null,
      nextZone: 'C1-Z5',
    },
  },

  // TC-C1Z4-04-blocked: 离开被阻止（未完成问卷）
  {
    id: 'TC-C1Z4-04-blocked',
    name: '离开被阻止（未完成问卷）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_forward',
    objectName: '离开',
    description: '未完成问卷时无法离开',
    preconditions: [{ flag: 'FLAG_C1Z4_QUESTIONNAIRE_DONE', value: false }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1Z4_QUESTIONNAIRE_DONE', value: false },
      { action: 'moveToObject', objectId: 'exit_forward' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'EXIT_BLOCKED',
      expectedLines: 1,
      dialogueContains: ['请先完成健康问卷'],
      foreshadow: null,
      nextZone: null,
    },
  },
];

// ============================================================================
// 测试统计
// ============================================================================
const ZONE_STATS = {
  zoneId: ZONE_ID,
  zoneName: ZONE_NAME,
  totalTests: TESTS.length,
  interactableObjects: ['questionnaire_desk', 'xucheng', 'atang_distant', 'exit_forward'],
  branches: 2,
  rValuePoints: 0,
  pValuePoints: 0,
  cards: ['CARD_C1_QUESTIONNAIRE'],
  flags: ['FLAG_C1Z4_QUESTIONNAIRE_DONE', 'FLAG_MET_XUCHENG'],
  foreshadows: ['F14'],
  characters: ['许澄', '阿棠'],
  exits: {
    forward: 'C1-Z5',
  },
};

// ============================================================================
// 导出
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}
