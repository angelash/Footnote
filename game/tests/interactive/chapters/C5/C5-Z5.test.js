// ============================================================================
// Footnote C5-Z5 栖蓝：空椅子的消失与归来 ChromeMCP 测试脚本
// ============================================================================
// 生成时间: 2026-01-21
// Zone: C5-Z5 栖蓝：空椅子的消失与归来
// 测试用例: 5 个
// 伏笔: F23 加深
// ============================================================================

const ZONE_ID = 'C5-Z5';
const ZONE_NAME = '栖蓝：空椅子的消失与归来';
const ZONE_DESCRIPTION = '岑回来到栖蓝的住所，发现空椅子的痕迹，需要做出选择';

/**
 * C5-Z5 测试用例
 * 
 * 交互对象:
 * - chair_position: 空位置（获得卡片）
 * - qilan: 栖蓝（选择是否留下）
 * - qilan_toolbox: 工具箱（条件：FLAG_C5Z5_STAY=true）
 * - chalk: 粉笔（条件：FLAG_C5Z5_TOOLBOX_OPEN=true）
 * - wood_plank: 木板（条件：FLAG_C5Z5_OUTLINED=true，critical）
 */
const TESTS = [
  // ============================================
  // TC-C5Z5-01: 空位置
  // ============================================
  {
    id: 'TC-C5Z5-01',
    name: '空位置 - 查看椅子痕迹',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'chair_position',
    objectName: '空位置',
    description: '查看椅子消失后留下的位置，获得纠正后的椅子卡片',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'chair_position' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: ['CARD_C5_CHAIR_CORRECTED'],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z5_CHAIR',
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C5Z5-02: 栖蓝对话 - 我留下
  // ============================================
  {
    id: 'TC-C5Z5-02',
    name: '栖蓝对话 - 我留下',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'qilan',
    objectName: '栖蓝',
    description: '与栖蓝对话，选择留下帮助',
    branch: '我留下',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'qilan' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '我留下' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C5Z5_STAY: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z5_QILAN',
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C5Z5-03: 工具箱
  // ============================================
  {
    id: 'TC-C5Z5-03',
    name: '工具箱 - 打开',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'qilan_toolbox',
    objectName: '工具箱',
    description: '打开栖蓝的工具箱',
    preconditions: ['FLAG_C5Z5_STAY = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z5_STAY', value: true },
      { action: 'moveToObject', objectId: 'qilan_toolbox' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C5Z5_TOOLBOX_OPEN: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z5_TOOLBOX',
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C5Z5-04: 粉笔
  // ============================================
  {
    id: 'TC-C5Z5-04',
    name: '粉笔 - 描边',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'chalk',
    objectName: '粉笔',
    description: '用粉笔描出椅子的轮廓',
    preconditions: ['FLAG_C5Z5_TOOLBOX_OPEN = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z5_TOOLBOX_OPEN', value: true },
      { action: 'moveToObject', objectId: 'chalk' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'wait', duration: 1500 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C5Z5_OUTLINED: true },
      rDelta: 0,
      pDelta: 0,
      dialogueId: 'C5Z5_CHALK',
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C5Z5-05: 木板 - 摆放替代椅 (R+2, F23 deepen, critical)
  // ============================================
  {
    id: 'TC-C5Z5-05',
    name: '木板 - 摆放替代椅 (R+2, F23加深)',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'wood_plank',
    objectName: '木板',
    description: '用木板摆放替代椅，R+2，触发伏笔 F23 加深',
    branch: '摆放替代椅',
    preconditions: ['FLAG_C5Z5_OUTLINED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C5Z5_OUTLINED', value: true },
      { action: 'moveToObject', objectId: 'wood_plank' },
      { action: 'wait', duration: 500 },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 2000 },
      { action: 'selectChoice', index: 0, choiceText: '摆放替代椅' },
      { action: 'wait', duration: 2500 },
    ],
    expectedResults: {
      cards: ['CARD_C5_CHAIR_PLACEHOLDER'],
      flags: { FLAG_CHAIR_PLACEHOLDER: true },
      rDelta: 2,
      pDelta: 0,
      dialogueId: 'C5Z5_WOOD',
      foreshadow: { id: 'F23', action: 'deepen' },
      nextZone: null,
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
  interactableObjects: ['chair_position', 'qilan', 'qilan_toolbox', 'chalk', 'wood_plank'],
  branches: 2,
  rValuePoints: 2, // 木板 R+2
  pValuePoints: 0,
  cards: ['CARD_C5_CHAIR_CORRECTED', 'CARD_C5_CHAIR_PLACEHOLDER'],
  flags: ['FLAG_C5Z5_STAY', 'FLAG_C5Z5_TOOLBOX_OPEN', 'FLAG_C5Z5_OUTLINED', 'FLAG_CHAIR_PLACEHOLDER'],
  foreshadows: ['F23'],
  exits: {
    forward: 'C5-Z6',
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
  window.C5_Z5_TESTS = { ZONE_ID, ZONE_NAME, ZONE_DESCRIPTION, TESTS, ZONE_STATS };
}

console.log(`[C5-Z5] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.interactableObjects.length} 个对象`);
