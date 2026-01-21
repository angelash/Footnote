// ============================================================================
// Footnote C1-Z1 市政办事厅 ChromeMCP 测试脚本
// ============================================================================
// 生成时间: 2026-01-21
// Zone: C1-Z1 市政办事厅
// 测试用例: 9 个
// ============================================================================

const ZONE_ID = 'C1-Z1';
const ZONE_NAME = '市政办事厅';
const ZONE_DESCRIPTION = '岑回来到市政办事厅办理巡检许可证，首次接触官僚流程';

/**
 * C1-Z1 测试用例
 */
const TESTS = [
  // TC-C1Z1-01: 取号机交互
  {
    id: 'TC-C1Z1-01',
    name: '取号机交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'ticket_machine',
    objectName: '取号机',
    description: '从取号机取号，开始办事流程',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'ticket_machine' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C1Z1_GOT_TICKET: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z1_TICKET',
      expectedLines: 4,
      dialogueContains: ['请取号排队', '您的号码是', '预计等待时间'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z1-02a: 填表台 - 居住环
  {
    id: 'TC-C1Z1-02a',
    name: '填表台 - 选择居住环',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'form_desk',
    objectName: '填表台',
    description: '在填表台填写巡检申请表，选择居住环',
    branch: '居住环',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'form_desk' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '居住环' },
      { action: 'wait', duration: 1000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C1Z1_FORM_FILLED: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z1_FORM',
      expectedLines: 11,
      dialogueContains: ['通行证申请表', '居住区域', '它自己改了'],
      foreshadow: { id: 'F03', action: 'deepen' },
      nextZone: null,
    },
  },

  // TC-C1Z1-02b: 填表台 - 外围区
  {
    id: 'TC-C1Z1-02b',
    name: '填表台 - 选择外围区',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'form_desk',
    objectName: '填表台',
    description: '在填表台填写巡检申请表，选择外围区',
    branch: '外围区',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'form_desk' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 1, choiceText: '外围区' },
      { action: 'wait', duration: 1000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C1Z1_FORM_FILLED: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z1_FORM',
      expectedLines: 11,
      dialogueContains: ['通行证申请表', '居住区域', '它自己改了'],
      foreshadow: { id: 'F03', action: 'deepen' },
      nextZone: null,
    },
  },

  // TC-C1Z1-03a: 服务窗口 - 提交表格（需FLAG）
  {
    id: 'TC-C1Z1-03a',
    name: '服务窗口 - 提交表格',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'service_window',
    objectName: '服务窗口',
    description: '在服务窗口提交已填好的表格，获取巡检许可证',
    branch: '提交表格',
    preconditions: [{ flag: 'FLAG_C1Z1_FORM_FILLED', value: true }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1Z1_FORM_FILLED', value: true },
      { action: 'moveToObject', objectId: 'service_window' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '提交表格' },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: ['CARD_C1_PERMIT'],
      flags: { FLAG_C1Z1_PERMIT_OBTAINED: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z1_SUBMIT',
      expectedLines: 6,
      dialogueContains: ['下一位', '格式正确', '3个工作周期'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z1-03b: 服务窗口 - 还没填好（无FLAG）
  {
    id: 'TC-C1Z1-03b',
    name: '服务窗口 - 还没填好',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'service_window',
    objectName: '服务窗口',
    description: '未填表就去服务窗口，被告知需要先填表',
    branch: '我还没填好',
    preconditions: [{ flag: 'FLAG_C1Z1_FORM_FILLED', value: false }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1Z1_FORM_FILLED', value: false },
      { action: 'moveToObject', objectId: 'service_window' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z1_WINDOW_NO_FORM',
      expectedLines: 2,
      dialogueContains: ['下一位', '填表台在那边'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z1-04a: 老人 - 帮他填表 (R+1)
  {
    id: 'TC-C1Z1-04a',
    name: '老人 - 帮他填表 (R+1)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'elderly_person',
    objectName: '老人',
    description: '帮助老人填写表格，无收益行为，R+1',
    branch: '帮他填表',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'elderly_person' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '帮他填表' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_HELPED_ELDER: true },
      rDelta: 1,
      pDelta: 0,
      dialogueId: 'C1Z1_ELDER_HELP',
      expectedLines: 9,
      dialogueContains: ['能帮我看看', '眼睛不好使', '我明明来过这里'],
      foreshadow: null,
      nextZone: null,
    },
    critical: true,
    rValueTest: true,
  },

  // TC-C1Z1-04b: 老人 - 抱歉赶时间
  {
    id: 'TC-C1Z1-04b',
    name: '老人 - 抱歉赶时间',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'elderly_person',
    objectName: '老人',
    description: '拒绝帮助老人，继续自己的事务',
    branch: '抱歉，我赶时间',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'elderly_person' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 1, choiceText: '抱歉，我赶时间' },
      { action: 'wait', duration: 1000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C1Z1_ELDER_REFUSE',
      expectedLines: 4,
      dialogueContains: ['能帮我看看', '抱歉，我赶时间', '慢慢等就好'],
      foreshadow: null,
      nextZone: null,
    },
  },

  // TC-C1Z1-05: 离开到C1-Z2（需FLAG）
  {
    id: 'TC-C1Z1-05',
    name: '离开到错门走廊 (C1-Z2)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_to_corridor',
    objectName: '离开（前往错门走廊）',
    description: '获得许可证后离开办事厅，前往错门走廊',
    preconditions: [{ flag: 'FLAG_C1Z1_PERMIT_OBTAINED', value: true }],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C1Z1_PERMIT_OBTAINED', value: true },
      { action: 'moveToObject', objectId: 'exit_to_corridor' },
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

  // TC-C1Z1-06: 返回到C0-Z4
  {
    id: 'TC-C1Z1-06',
    name: '返回维修局前台 (C0-Z4)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_back',
    objectName: '返回',
    description: '返回维修局前台',
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
      nextZone: 'C0-Z4',
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
  interactableObjects: ['ticket_machine', 'form_desk', 'service_window', 'elderly_person', 'exit_to_corridor', 'exit_back'],
  branches: 4,
  rValuePoints: 1,
  pValuePoints: 0,
  cards: ['CARD_C1_PERMIT'],
  flags: ['FLAG_C1Z1_GOT_TICKET', 'FLAG_C1Z1_FORM_FILLED', 'FLAG_C1Z1_PERMIT_OBTAINED', 'FLAG_HELPED_ELDER'],
  foreshadows: ['F03'],
  exits: {
    forward: 'C1-Z2',
    back: 'C0-Z4',
  },
};

// ============================================================================
// 导出
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}
