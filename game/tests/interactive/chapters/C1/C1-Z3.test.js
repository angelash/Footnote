// ============================================================================
// Footnote C1-Z3 档案巷口旧地图摊 ChromeMCP 测试脚本
// ============================================================================
// 生成时间: 2026-01-21
// Zone: C1-Z3 档案巷口旧地图摊
// 测试用例: 6 个
// ============================================================================

const ZONE_ID = 'C1-Z3';
const ZONE_NAME = '档案巷口旧地图摊';
const ZONE_DESCRIPTION = '宋岚的旧地图摊，首次遇见宋岚，了解版本差异的概念';

/**
 * C1-Z3 测试用例
 */
const TESTS = [
  // TC-C1Z3-01a: 宋岚对话 - 我想知道哪里不对 (R+1)
  {
    id: 'TC-C1Z3-01a',
    name: '宋岚 - 我想知道哪里不对 (R+1)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'songlan',
    objectName: '宋岚',
    description: '与宋岚交谈，选择询问"哪里不对"，接受记录任务，R+1',
    branch: '我想知道哪里不对',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'songlan' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '我想知道哪里不对' },
      { action: 'wait', duration: 1500 },
      { action: 'selectChoice', index: 0, choiceText: '好，我记下来' },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: ['CARD_C1_VERSION_MAP_01'],
      flags: { FLAG_C1Z3_RECORD_QUEST: true },
      rDelta: 1,
      pDelta: 0,
      dialogueId: 'C1Z3_SONGLAN_QUEST',
      expectedLines: 10,
      dialogueContains: ['别信路标，信脚印', '版本差异', '好，我记下来'],
      foreshadow: { id: 'F12', action: 'plant' },
      nextZone: null,
    },
    critical: true,
    rValueTest: true,
  },

  // TC-C1Z3-01b: 宋岚对话 - 只是路过
  {
    id: 'TC-C1Z3-01b',
    name: '宋岚 - 只是路过',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'songlan',
    objectName: '宋岚',
    description: '与宋岚交谈，选择"只是路过"',
    branch: '只是路过',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'songlan' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 1, choiceText: '只是路过' },
      { action: 'wait', duration: 1000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z3_SONGLAN_PASS',
      expectedLines: 7,
      dialogueContains: ['别信路标，信脚印', '版本差异', '只是路过'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z3-02: 旧地图交互
  {
    id: 'TC-C1Z3-02',
    name: '旧地图交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'old_maps',
    objectName: '旧地图',
    description: '查看摊位上的旧地图',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'old_maps' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z3_OLD_MAPS',
      expectedLines: 4,
      dialogueContains: ['这些地图', '同一个地方', '街道的位置也会变'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z3-03: 记录本交互
  {
    id: 'TC-C1Z3-03',
    name: '记录本交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'notebook',
    objectName: '记录本',
    description: '查看宋岚的记录本',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'notebook' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z3_NOTEBOOK',
      expectedLines: 5,
      dialogueContains: ['记录本', '密密麻麻', '版本差异 ≠ 错误'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z3-04: 前往诊疗台
  {
    id: 'TC-C1Z3-04',
    name: '前往诊疗台候诊区 (C1-Z4)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_to_clinic',
    objectName: '前往诊疗台',
    description: '离开地图摊，前往诊疗台候诊区',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'exit_to_clinic' },
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
      nextZone: 'C1-Z4',
    },
  },

  // TC-C1Z3-05: 返回错门走廊
  {
    id: 'TC-C1Z3-05',
    name: '返回错门走廊 (C1-Z2)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_back',
    objectName: '返回',
    description: '返回错门走廊',
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
      nextZone: 'C1-Z2',
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
  interactableObjects: ['songlan', 'old_maps', 'notebook', 'exit_to_clinic', 'exit_back'],
  branches: 2,
  rValuePoints: 1,
  pValuePoints: 0,
  cards: ['CARD_C1_VERSION_MAP_01'],
  flags: ['FLAG_C1Z3_RECORD_QUEST'],
  foreshadows: ['F12'],
  characters: ['宋岚'],
  exits: {
    forward: 'C1-Z4',
    back: 'C1-Z2',
  },
};

// ============================================================================
// 导出
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}
