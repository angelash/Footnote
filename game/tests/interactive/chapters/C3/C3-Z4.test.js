// ============================================================================
// C3-Z4.test.js - 栖蓝：空椅子
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 栖蓝的居所，F23伏笔投放点
// ============================================================================

const ZONE_ID = 'C3-Z4';
const ZONE_NAME = '栖蓝：空椅子';

/**
 * C3-Z4 栖蓝：空椅子测试用例
 * 
 * 交互对象:
 * - empty_chair: 空椅子（普通对话）
 * - empty_chair_repair: 完成修复（关键交互，F23伏笔）
 * - lamp_stand: 小灯座（条件交互，需旧灯芯卡片）
 * 
 * 关键事件:
 * - 伏笔 F23 投放 (plant)
 * - R+2 修复代价
 */
const TESTS = [
  // ============================================
  // TC-C3Z4-01: 空椅子普通对话
  // ============================================
  {
    id: 'TC-C3Z4-01',
    name: '空椅子普通对话',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'empty_chair',
    objectName: '空椅子',
    description: '查看空椅子，触发普通对话',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'empty_chair' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 3,
      dialogueContains: ['空椅子', '歪斜地靠在墙边', '放在这里很久了'],
    },
  },

  // ============================================
  // TC-C3Z4-02: 完成修复 - 关键交互
  // ============================================
  {
    id: 'TC-C3Z4-02',
    name: '完成修复 - F23伏笔投放',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'empty_chair_repair',
    objectName: '完成修复',
    description: '修复空椅子，投放F23伏笔，获得卡片',
    critical: true,
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'empty_chair_repair' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_EMPTY_CHAIR'],
      flags: { FLAG_EMPTY_CHAIR_SET: true },
      rDelta: 2,
      pDelta: 0,
      foreshadow: { id: 'F23', action: 'plant' },
      nextZone: null,
      expectedLines: 7,
      dialogueContains: ['把椅子扶正', '像是在等待某个人', '无可用收益', '心里好像轻了一点'],
    },
  },

  // ============================================
  // TC-C3Z4-03: 小灯座交互（无旧灯芯）
  // ============================================
  {
    id: 'TC-C3Z4-03',
    name: '小灯座交互（无旧灯芯）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'lamp_stand',
    objectName: '小灯座',
    description: '在没有旧灯芯卡片时尝试交互',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'lamp_stand' },
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
      dialogueContent: '需要灯芯',
      expectedLines: 2,
      dialogueContains: ['小灯座', '没有灯芯', '如果有灯芯'],
    },
  },

  // ============================================
  // TC-C3Z4-04: 小灯座 - 使用旧灯芯
  // ============================================
  {
    id: 'TC-C3Z4-04',
    name: '小灯座 - 使用旧灯芯点亮',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'lamp_stand',
    objectName: '小灯座',
    description: '使用从陈匠处获得的旧灯芯点亮小灯座',
    preconditions: ['CARD_C3_OLD_WICK'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'lamp_stand' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '使用旧灯芯' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_LAMP_LIT: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 7,
      dialogueContains: ['旧灯芯放进灯座', '微光亮起', '画面暖了一瞬', '眼眶红了'],
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
  totalPPoints: TESTS.reduce((sum, t) => sum + (t.expectedResults.pDelta || 0), 0),
  branchCount: TESTS.filter(t => t.branch).length,
  criticalCount: TESTS.filter(t => t.critical).length,
};

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.C3_Z4_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C3-Z4] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象, ${ZONE_STATS.criticalCount} 个关键交互`);
