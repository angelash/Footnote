// ============================================================================
// Footnote C1-Z6 边缘断口：小坍塌现场 ChromeMCP 测试脚本
// ============================================================================
// 生成时间: 2026-01-21
// Zone: C1-Z6 边缘断口：小坍塌现场
// 测试用例: 7 个
// ============================================================================

const ZONE_ID = 'C1-Z6';
const ZONE_NAME = '边缘断口：小坍塌现场';
const ZONE_DESCRIPTION = '城市边缘的小型坍塌现场，第一章的结尾';

/**
 * C1-Z6 测试用例
 */
const TESTS = [
  // TC-C1Z6-01: 坍塌区域交互
  {
    id: 'TC-C1Z6-01',
    name: '坍塌区域交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'collapse_zone',
    objectName: '坍塌区域',
    description: '查看坍塌的区域',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'collapse_zone' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C1Z6_CHECKED_COLLAPSE: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z6_COLLAPSE',
      dialogueContent: '一小块地面塌陷了，露出下面的空洞',
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z6-02: 受灾住户交互
  {
    id: 'TC-C1Z6-02',
    name: '受灾住户交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'affected_resident',
    objectName: '受灾住户',
    description: '与受灾住户交谈',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'affected_resident' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z6_RESIDENT',
      dialogueContent: '昨天还好好的，今天就塌了',
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z6-03: 通讯点交互（顾临通讯）
  {
    id: 'TC-C1Z6-03',
    name: '通讯点 - 顾临通讯',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'comms_point',
    objectName: '通讯点',
    description: '通过通讯点联系顾临，汇报情况',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'comms_point' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C1Z6_CONTACTED_GULIN: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z6_COMMS_GULIN',
      dialogueContent: '小型坍塌已记录。继续观察，不要靠近边缘。',
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z6-04: 碎片交互
  {
    id: 'TC-C1Z6-04',
    name: '碎片交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'debris',
    objectName: '碎片',
    description: '查看坍塌现场的碎片，获得报告卡片',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'debris' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C1_COLLAPSE_REPORT'],
      flags: { FLAG_C1Z6_GOT_REPORT: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z6_DEBRIS',
      dialogueContent: '碎片中有一份被埋的报告',
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z6-05: 继续到C2-Z1（需FLAG）
  {
    id: 'TC-C1Z6-05',
    name: '继续前往第二章 (C2-Z1)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_to_c2',
    objectName: '继续',
    description: '完成第一章调查后前往第二章',
    preconditions: [{ flag: 'FLAG_C1_COMPLETE', value: true }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1_COMPLETE', value: true },
      { action: 'moveToObject', objectId: 'exit_to_c2' },
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
      nextZone: 'C2-Z1',
    },
  },

  // TC-C1Z6-05-blocked: 继续被阻止（未完成）
  {
    id: 'TC-C1Z6-05-blocked',
    name: '继续被阻止（未完成第一章）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_to_c2',
    objectName: '继续',
    description: '未完成第一章任务时无法前进',
    preconditions: [{ flag: 'FLAG_C1_COMPLETE', value: false }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1_COMPLETE', value: false },
      { action: 'moveToObject', objectId: 'exit_to_c2' },
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
      dialogueContent: '还有一些事情需要处理',
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z6-06: 返回礼堂街
  {
    id: 'TC-C1Z6-06',
    name: '返回礼堂街 (C1-Z5)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_back',
    objectName: '返回',
    description: '返回礼堂街',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'exit_back' },
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
];

// ============================================================================
// 测试统计
// ============================================================================
const ZONE_STATS = {
  zoneId: ZONE_ID,
  zoneName: ZONE_NAME,
  totalTests: TESTS.length,
  interactableObjects: ['collapse_zone', 'affected_resident', 'comms_point', 'debris', 'exit_to_c2', 'exit_back'],
  branches: 0,
  rValuePoints: 0,
  pValuePoints: 0,
  cards: ['CARD_C1_COLLAPSE_REPORT'],
  flags: ['FLAG_C1Z6_CHECKED_COLLAPSE', 'FLAG_C1Z6_CONTACTED_GULIN', 'FLAG_C1Z6_GOT_REPORT', 'FLAG_C1_COMPLETE'],
  foreshadows: [],
  characters: ['顾临（通讯）'],
  exits: {
    forward: 'C2-Z1',
    back: 'C1-Z5',
  },
};

// ============================================================================
// 导出
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}
