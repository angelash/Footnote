// ============================================================================
// C0-Z2.test.js - 早餐小店
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 早餐小店，无收益选择第一次出现
// ============================================================================

const ZONE_ID = 'C0-Z2';
const ZONE_NAME = '早餐小店';

/**
 * C0-Z2 早餐小店测试用例
 * 
 * 交互对象:
 * - menu_board: 菜单板（分支选择，首个 R 值选择点）
 * - seat_window: 靠窗座位
 * - seat_corner: 角落座位
 * - qilan_trigger: 栖蓝路过触发区域
 * - exit_door: 出口
 */
const TESTS = [
  // ============================================
  // TC-C0Z2-01a: 菜单板交互 - 固定套餐
  // ============================================
  {
    id: 'TC-C0Z2-01a',
    name: '菜单板交互 - 固定套餐',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'menu_board',
    objectName: '菜单板',
    description: '选择固定套餐，正常进食',
    branch: '固定套餐',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'menu_board' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '固定套餐' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {
        FLAG_C0Z2_ORDER_STANDARD: true,
        FLAG_C0Z2_EATEN: true,
      },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证: C0Z2_MENU(2) + C0Z2_ORDER_STANDARD(3) = 5
      expectedLines: 5,
      dialogueContains: ['固定套餐', '今日特别', '老样子', '省事'],
    },
  },

  // ============================================
  // TC-C0Z2-01b: 菜单板交互 - 今日特别（R+1）
  // ============================================
  {
    id: 'TC-C0Z2-01b',
    name: '菜单板交互 - 今日特别（无收益选择）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'menu_board',
    objectName: '菜单板',
    description: '选择今日特别，触发 R+1，首个无收益选择',
    branch: '今日特别',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'menu_board' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 1, text: '今日特别' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {
        FLAG_R_SOURCE_BREAKFAST: true,
        FLAG_C0Z2_EATEN: true,
      },
      rDelta: 1,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证: C0Z2_MENU(2) + C0Z2_ORDER_SPECIAL(6) = 8
      expectedLines: 8,
      dialogueContains: ['固定套餐', '今日特别', '几乎没人点', '等一会儿', '无可用收益'],
    },
  },

  // ============================================
  // TC-C0Z2-02: 靠窗座位交互
  // ============================================
  {
    id: 'TC-C0Z2-02',
    name: '靠窗座位交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'seat_window',
    objectName: '靠窗座位',
    description: '普通对话，观察座位',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'seat_window' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证: C0Z2_SEAT_WINDOW(2)
      expectedLines: 2,
      dialogueContains: ['靠窗的位置', '光线充足', '快速用餐'],
    },
  },

  // ============================================
  // TC-C0Z2-03: 角落座位交互
  // ============================================
  {
    id: 'TC-C0Z2-03',
    name: '角落座位交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'seat_corner',
    objectName: '角落座位',
    description: '普通对话，观察角落座位',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'seat_corner' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证: C0Z2_SEAT_CORNER(3)
      expectedLines: 3,
      dialogueContains: ['角落的位置', '空椅子', '干净', '没人会坐'],
    },
  },

  // ============================================
  // TC-C0Z2-04: 栖蓝路过触发
  // ============================================
  {
    id: 'TC-C0Z2-04',
    name: '栖蓝路过触发',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'qilan_trigger',
    objectName: '栖蓝路过（触发区域）',
    description: '触发栖蓝首次出场事件',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'qilan_trigger' },
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_MET_QILAN_C0: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证: C0Z2_QILAN_PASSBY(3)
      expectedLines: 3,
      dialogueContains: ['没人坐的椅子', '擦干净', '走远了'],
    },
  },

  // ============================================
  // TC-C0Z2-05: 出口跳转到 C0-Z3
  // ============================================
  {
    id: 'TC-C0Z2-05',
    name: '出口跳转到C0-Z3',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_door',
    objectName: '出口',
    description: '离开早餐小店，进入薄墙巷口',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'exit_door' },
      { action: 'interact' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: 'C0-Z3',
    },
  },
];

// ============================================
// Zone 统计信息
// ============================================
const ZONE_STATS = {
  zoneId: ZONE_ID,
  zoneName: ZONE_NAME,
  totalTests: TESTS.length,
  objectsCovered: [...new Set(TESTS.map(t => t.objectId))],
  cardsCovered: [...new Set(TESTS.flatMap(t => t.expectedResults.cards || []))],
  flagsCovered: [...new Set(TESTS.flatMap(t => Object.keys(t.expectedResults.flags || {})))],
  foreshadowsCovered: TESTS.filter(t => t.expectedResults.foreshadow).map(t => t.expectedResults.foreshadow.id),
  totalRPoints: TESTS.reduce((sum, t) => sum + (t.expectedResults.rDelta || 0), 0),
  branchCount: TESTS.filter(t => t.branch).length,
};

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.C0_Z2_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C0-Z2] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
