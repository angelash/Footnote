// ============================================================================
// Footnote C5-Z1 档案巷：版本冲突现场 ChromeMCP 测试脚本
// ============================================================================
// 生成时间: 2026-01-21
// Zone: C5-Z1 档案巷：版本冲突现场
// 测试用例: 5 个
// ============================================================================

const ZONE_ID = 'C5-Z1';
const ZONE_NAME = '档案巷：版本冲突现场';
const ZONE_DESCRIPTION = '岑回进入档案巷，发现存在两个版本的历史记录，需要做出选择';

/**
 * C5-Z1 测试用例
 * 
 * 交互对象:
 * - version_switch: 版本切换点（分支选择 V-A / V-B）
 * - memorial_wall: 纪念墙（条件：FLAG_C5Z1_VERSION_B=true）
 * - diff_submit: 差异标注点（条件：FLAG_C5Z1_VERSION_SEEN=true）
 */
const TESTS = [
  // ============================================
  // TC-C5Z1-01a: 版本切换点 - 选择 V-A
  // ============================================
  {
    id: 'TC-C5Z1-01a',
    name: '版本切换点 - 选择 V-A',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'version_switch',
    objectName: '版本切换点',
    description: '在版本切换点选择 V-A 版本',
    branch: 'V-A',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'version_switch' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: 'V-A' },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C5Z1_VERSION_A: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z1_VERSION_SWITCH',
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C5Z1-01b: 版本切换点 - 选择 V-B
  // ============================================
  {
    id: 'TC-C5Z1-01b',
    name: '版本切换点 - 选择 V-B',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'version_switch',
    objectName: '版本切换点',
    description: '在版本切换点选择 V-B 版本',
    branch: 'V-B',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'version_switch' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 1, choiceText: 'V-B' },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C5Z1_VERSION_B: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z1_VERSION_SWITCH',
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C5Z1-02: 纪念墙 - 抄下来 (R+2)
  // ============================================
  {
    id: 'TC-C5Z1-02',
    name: '纪念墙 - 抄下来 (R+2)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'memorial_wall',
    objectName: '纪念墙',
    description: '在纪念墙抄下内容，获得卡片，R+2',
    branch: '抄下来',
    preconditions: ['FLAG_C5Z1_VERSION_B = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z1_VERSION_B', value: true },
      { action: 'moveToObject', objectId: 'memorial_wall' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '抄下来' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C5_MEMORIAL_COPY'],
      flags: {},
      rDelta: 2,
      pDelta: 0,
      dialogueId: 'C5Z1_MEMORIAL',
      foreshadow: null,
      nextZone: null,
    },
    critical: true,
    rValueTest: true,
  },

  // ============================================
  // TC-C5Z1-03a: 差异标注点 - 提交 V-A
  // ============================================
  {
    id: 'TC-C5Z1-03a',
    name: '差异标注点 - 提交 V-A',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'diff_submit',
    objectName: '差异标注点',
    description: '提交 V-A 版本，获得版本冲突卡片，锁定版本',
    branch: '提交V-A',
    preconditions: ['FLAG_C5Z1_VERSION_SEEN = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z1_VERSION_SEEN', value: true },
      { action: 'moveToObject', objectId: 'diff_submit' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '提交V-A' },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: ['CARD_C5_VERSION_CONFLICT'],
      flags: { FLAG_C5Z1_VERSION_LOCKED: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z1_DIFF_SUBMIT',
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C5Z1-03b: 差异标注点 - 提交 V-B (R+1)
  // ============================================
  {
    id: 'TC-C5Z1-03b',
    name: '差异标注点 - 提交 V-B (R+1)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'diff_submit',
    objectName: '差异标注点',
    description: '提交 V-B 版本，R+1，获得版本冲突卡片，锁定版本',
    branch: '提交V-B',
    preconditions: ['FLAG_C5Z1_VERSION_SEEN = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z1_VERSION_SEEN', value: true },
      { action: 'moveToObject', objectId: 'diff_submit' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 1, choiceText: '提交V-B' },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: ['CARD_C5_VERSION_CONFLICT'],
      flags: { FLAG_C5Z1_VERSION_LOCKED: true },
      rDelta: 1,
      pDelta: 0,
      dialogueId: 'C5Z1_DIFF_SUBMIT',
      foreshadow: null,
      nextZone: null,
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
  interactableObjects: ['version_switch', 'memorial_wall', 'diff_submit'],
  branches: 4,
  rValuePoints: 3, // 纪念墙R+2, 提交V-B R+1
  pValuePoints: 0,
  cards: ['CARD_C5_MEMORIAL_COPY', 'CARD_C5_VERSION_CONFLICT'],
  flags: ['FLAG_C5Z1_VERSION_A', 'FLAG_C5Z1_VERSION_B', 'FLAG_C5Z1_VERSION_SEEN', 'FLAG_C5Z1_VERSION_LOCKED'],
  foreshadows: [],
  exits: {
    forward: 'C5-Z2',
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
  window.C5_Z1_TESTS = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}

console.log(`[C5-Z1] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.interactableObjects.length} 个对象`);
