// ============================================================================
// Footnote C1-Z2 错门走廊 ChromeMCP 测试脚本
// ============================================================================
// 生成时间: 2026-01-21
// Zone: C1-Z2 错门走廊
// 测试用例: 7 个
// ============================================================================

const ZONE_ID = 'C1-Z2';
const ZONE_NAME = '错门走廊';
const ZONE_DESCRIPTION = '门牌号混乱的走廊，需要根据脚印线索找到正确的门';

/**
 * C1-Z2 测试用例
 */
const TESTS = [
  // TC-C1Z2-01: 门牌17B交互
  {
    id: 'TC-C1Z2-01',
    name: '门牌17B交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'door_17b',
    objectName: '门牌17B',
    description: '查看17B号门，发现门牌歪斜',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'door_17b' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C1Z2_CHECKED_17B: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z2_DOOR_17B',
      expectedLines: 7,
      dialogueContains: ['17B', '这应该是目标房间', '这是储物间'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z2-02a: 门牌19A - 敲门（需要先查看脚印）
  {
    id: 'TC-C1Z2-02a',
    name: '门牌19A - 敲门（已查看脚印）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'door_19a',
    objectName: '门牌19A',
    description: '敲19A号门，获得走廊笔记卡片',
    branch: '敲门',
    preconditions: [{ flag: 'FLAG_C1Z2_CHECKED_FOOTPRINTS', value: true }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1Z2_CHECKED_FOOTPRINTS', value: true },
      { action: 'moveToObject', objectId: 'door_19a' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '敲门' },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: ['CARD_C1_CORRIDOR_NOTE'],
      flags: { FLAG_C1Z2_SOLVED: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z2_DOOR_19A_KNOCK',
      expectedLines: 8,
      dialogueContains: ['19A', '脚印', '门牌是错的，但空间是对的'],
      foreshadow: { id: 'F02', action: 'deepen' },
      nextZone: null,
    },
  },

  // TC-C1Z2-02b: 门牌19A - 未查看脚印
  {
    id: 'TC-C1Z2-02b',
    name: '门牌19A - 直接敲门（未查看脚印）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'door_19a',
    objectName: '门牌19A',
    description: '未查看脚印就敲门，没有反应',
    preconditions: [{ flag: 'FLAG_C1Z2_CHECKED_FOOTPRINTS', value: false }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1Z2_CHECKED_FOOTPRINTS', value: false },
      { action: 'moveToObject', objectId: 'door_19a' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z2_DOOR_19A_LOCKED',
      expectedLines: 3,
      dialogueContains: ['19A', '门牌编号', '脚印'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z2-03: 脚印交互
  {
    id: 'TC-C1Z2-03',
    name: '脚印交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'footprints',
    objectName: '脚印',
    description: '查看地上的脚印，发现线索',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'footprints' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C1Z2_CHECKED_FOOTPRINTS: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z2_FOOTPRINTS',
      expectedLines: 4,
      dialogueContains: ['地上有脚印', '很多人走过', '指向写着"19A"'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z2-04: 住户交互
  {
    id: 'TC-C1Z2-04',
    name: '住户交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'resident',
    objectName: '住户',
    description: '与走廊里的住户交谈，了解门牌错乱的情况',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'resident' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z2_RESIDENT',
      expectedLines: 7,
      dialogueContains: ['你也在找门', '17B', '门牌换过太多次了'],
      foreshadow: { id: 'F04', action: 'plant' },
      nextZone: null,
    },
  },

  // TC-C1Z2-05: 继续前进到C1-Z3（需FLAG）
  {
    id: 'TC-C1Z2-05',
    name: '继续前进到档案巷口 (C1-Z3)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_forward',
    objectName: '继续',
    description: '解开走廊谜题后继续前进',
    preconditions: [{ flag: 'FLAG_C1Z2_SOLVED', value: true }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1Z2_SOLVED', value: true },
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
      nextZone: 'C1-Z3',
    },
  },

  // TC-C1Z2-05-blocked: 继续前进被阻止（未解谜）
  {
    id: 'TC-C1Z2-05-blocked',
    name: '继续前进被阻止（未解谜）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_forward',
    objectName: '继续',
    description: '未解开走廊谜题时无法前进',
    preconditions: [{ flag: 'FLAG_C1Z2_SOLVED', value: false }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1Z2_SOLVED', value: false },
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
      dialogueContains: ['还没弄清楚这里的门牌'],
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
  interactableObjects: ['door_17b', 'door_19a', 'footprints', 'resident', 'exit_forward'],
  branches: 1,
  rValuePoints: 0,
  pValuePoints: 0,
  cards: ['CARD_C1_CORRIDOR_NOTE'],
  flags: ['FLAG_C1Z2_CHECKED_17B', 'FLAG_C1Z2_CHECKED_FOOTPRINTS', 'FLAG_C1Z2_SOLVED'],
  foreshadows: ['F02', 'F04'],
  exits: {
    forward: 'C1-Z3',
  },
};

// ============================================================================
// 导出
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}
