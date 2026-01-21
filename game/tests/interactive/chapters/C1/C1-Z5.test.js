// ============================================================================
// Footnote C1-Z5 礼堂街夜谈 ChromeMCP 测试脚本
// ============================================================================
// 生成时间: 2026-01-21
// Zone: C1-Z5 礼堂街夜谈
// 测试用例: 5 个
// ============================================================================

const ZONE_ID = 'C1-Z5';
const ZONE_NAME = '礼堂街夜谈';
const ZONE_DESCRIPTION = '夜晚的礼堂街，首次遇见牧平，了解平面信徒的信仰';

/**
 * C1-Z5 测试用例
 */
const TESTS = [
  // TC-C1Z5-01a: 牧平对话 - 留下听完 (R+1)
  {
    id: 'TC-C1Z5-01a',
    name: '牧平 - 留下听完 (R+1)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'muping',
    objectName: '牧平',
    description: '与牧平交谈，选择留下听完他的话，无收益行为，R+1',
    branch: '留下听完',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'muping' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '你在暗示什么' },
      { action: 'wait', duration: 1500 },
      { action: 'selectChoice', index: 0, choiceText: '留下听完' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C1_PRAYER_01'],
      flags: { FLAG_C1Z5_STAYED: true },
      rDelta: 1,
      pDelta: 0,
      dialogueId: 'C1Z5_MUPING_STAYED',
      expectedLines: 20,
      dialogueContains: ['纸页不恨你', '留下听完', '这是抄本'],
      foreshadow: { id: 'F15', action: 'plant' },
      nextZone: null,
    },
    critical: true,
    rValueTest: true,
  },

  // TC-C1Z5-01b: 牧平对话 - 没时间
  {
    id: 'TC-C1Z5-01b',
    name: '牧平 - 没时间',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'muping',
    objectName: '牧平',
    description: '与牧平交谈，选择没时间听',
    branch: '没时间',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'muping' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 1, choiceText: '没时间' },
      { action: 'wait', duration: 1000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z5_MUPING_LEAVE',
      expectedLines: 8,
      dialogueContains: ['纸页不恨你', '没时间', '路过也是一种到达'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z5-02: 抄本交互（需FLAG）
  {
    id: 'TC-C1Z5-02',
    name: '抄本交互（已留下听完）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'prayer_note',
    objectName: '抄本',
    description: '查看牧平留下的祷文抄本',
    preconditions: [{ flag: 'FLAG_C1Z5_STAYED', value: true }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1Z5_STAYED', value: true },
      { action: 'moveToObject', objectId: 'prayer_note' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C1_PRAYER_01'],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z5_PRAYER_NOTE',
      expectedLines: 1,
      dialogueContains: ['手抄的祷文'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z5-02b: 抄本交互（未留下）
  {
    id: 'TC-C1Z5-02b',
    name: '抄本交互（未留下听完）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'prayer_note',
    objectName: '抄本',
    description: '未留下听完时，抄本位置空无一物',
    preconditions: [{ flag: 'FLAG_C1Z5_STAYED', value: false }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1Z5_STAYED', value: false },
      { action: 'moveToObject', objectId: 'prayer_note' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z5_PRAYER_NOTE_EMPTY',
      expectedLines: 1,
      dialogueContains: ['什么也没有'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z5-03: 前往边缘
  {
    id: 'TC-C1Z5-03',
    name: '前往边缘断口 (C1-Z6)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_forward',
    objectName: '前往边缘',
    description: '离开礼堂街，前往边缘断口',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
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
      nextZone: 'C1-Z6',
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
  interactableObjects: ['muping', 'prayer_note', 'exit_forward'],
  branches: 2,
  rValuePoints: 1,
  pValuePoints: 0,
  cards: ['CARD_C1_PRAYER_01'],
  flags: ['FLAG_C1Z5_STAYED'],
  foreshadows: ['F15'],
  characters: ['牧平'],
  exits: {
    forward: 'C1-Z6',
  },
};

// ============================================================================
// 导出
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}
