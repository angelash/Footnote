// ============================================================================
// C3-Z7.test.js - 边缘断口：断裂走廊
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 世界边缘的断裂走廊，C3章节终点
// ============================================================================

const ZONE_ID = 'C3-Z7';
const ZONE_NAME = '边缘断口：断裂走廊';

/**
 * C3-Z7 边缘断口测试用例
 * 
 * 交互对象:
 * - intervention_point: 介入选择（分支选择，需深度感知）
 * - end_door: 终点门（章节完成）
 * 
 * 关键事件:
 * - 加固选择：P+2, 伤痕留下
 * - 章节完成：FLAG_C3_COMPLETE
 */
const TESTS = [
  // ============================================
  // TC-C3Z7-01: 介入选择（无深度感知）
  // ============================================
  {
    id: 'TC-C3Z7-01',
    name: '介入选择（无深度感知）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'intervention_point',
    objectName: '介入选择',
    description: '在没有深度感知能力时尝试介入',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'intervention_point' },
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
      dialogueContent: '无法感知断裂',
      expectedLines: 1,
      dialogueContains: ['无法感知断裂'],
    },
  },

  // ============================================
  // TC-C3Z7-02a: 介入选择 - 加固
  // ============================================
  {
    id: 'TC-C3Z7-02a',
    name: '介入选择 - 加固',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'intervention_point',
    objectName: '介入选择',
    description: '选择加固断裂，产生伤痕和P值消耗',
    branch: '加固',
    preconditions: ['depthPerception'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'intervention_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '加固' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_FRACTURE_SAMPLE'],
      flags: { FLAG_EDGE_SCAR: 2, FLAG_C3Z7_PASSED: true },
      rDelta: 0,
      pDelta: 2,
      foreshadow: null,
      nextZone: null,
      expectedLines: 8,
      dialogueContains: ['介入', '加固', '增加结构负担', '写入稳定结构', '路面暂时稳固', '结构负担上升'],
    },
  },

  // ============================================
  // TC-C3Z7-02b: 介入选择 - 找别的路
  // ============================================
  {
    id: 'TC-C3Z7-02b',
    name: '介入选择 - 找别的路',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'intervention_point',
    objectName: '介入选择',
    description: '选择绕路，获得样本但不留伤痕',
    branch: '找别的路',
    preconditions: ['depthPerception'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'intervention_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 1, text: '找别的路' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_FRACTURE_SAMPLE'],
      flags: { FLAG_C3Z7_PASSED: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 7,
      dialogueContains: ['介入', '找到了一条稳定的骨架路径', '不会新增伤痕', '绕过了伤痕'],
    },
  },

  // ============================================
  // TC-C3Z7-03: 终点门交互（未通过断裂）
  // ============================================
  {
    id: 'TC-C3Z7-03',
    name: '终点门交互（条件不满足）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'end_door',
    objectName: '终点门',
    description: '在未通过断裂前尝试离开',
    preconditions: ['FLAG_C3Z7_PASSED = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z7_PASSED', value: false },
      { action: 'moveToObject', objectId: 'end_door' },
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
      dialogueContent: '前方断裂阻挡',
      expectedLines: 1,
      dialogueContains: ['前方断裂阻挡'],
    },
  },

  // ============================================
  // TC-C3Z7-04: 终点门 - 章节完成
  // ============================================
  {
    id: 'TC-C3Z7-04',
    name: '终点门 - 章节完成',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'end_door',
    objectName: '终点门',
    description: '通过断裂后完成C3章节',
    critical: true,
    preconditions: ['FLAG_C3Z7_PASSED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z7_PASSED', value: true },
      { action: 'moveToObject', objectId: 'end_door' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C3_COMPLETE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: 'C4-Z1',
      expectedLines: 5,
      dialogueContains: ['穿过了断裂走廊', '不知道还能撑多久', '承受越来越多的"写入"'],
    },
  },

  // ============================================
  // TC-C3Z7-05: 完整流程 - 加固路线
  // ============================================
  {
    id: 'TC-C3Z7-05',
    name: '完整流程 - 加固路线',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'end_door',
    objectName: '终点门',
    description: '完整体验边缘断口（加固路线）',
    preconditions: ['depthPerception'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      // 加固断裂
      { action: 'moveToObject', objectId: 'intervention_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '加固' },
      { action: 'closeDialogue' },
      { action: 'wait', duration: 1000 },
      // 通过终点门
      { action: 'moveToObject', objectId: 'end_door' },
      { action: 'interact' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_FRACTURE_SAMPLE'],
      flags: { FLAG_EDGE_SCAR: 2, FLAG_C3Z7_PASSED: true, FLAG_C3_COMPLETE: true },
      rDelta: 0,
      pDelta: 2,
      foreshadow: null,
      nextZone: 'C4-Z1',
      expectedLines: 13,
      dialogueContains: ['介入', '加固', '结构负担上升', '穿过了断裂走廊', '承受越来越多的"写入"'],
    },
  },

  // ============================================
  // TC-C3Z7-06: 完整流程 - 绕路路线
  // ============================================
  {
    id: 'TC-C3Z7-06',
    name: '完整流程 - 绕路路线',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'end_door',
    objectName: '终点门',
    description: '完整体验边缘断口（绕路路线）',
    preconditions: ['depthPerception'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      // 找别的路
      { action: 'moveToObject', objectId: 'intervention_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 1, text: '找别的路' },
      { action: 'closeDialogue' },
      { action: 'wait', duration: 1000 },
      // 通过终点门
      { action: 'moveToObject', objectId: 'end_door' },
      { action: 'interact' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_FRACTURE_SAMPLE'],
      flags: { FLAG_C3Z7_PASSED: true, FLAG_C3_COMPLETE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: 'C4-Z1',
      expectedLines: 12,
      dialogueContains: ['介入', '找到了一条稳定的骨架路径', '穿过了断裂走廊', '承受越来越多的"写入"'],
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
  window.C3_Z7_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C3-Z7] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象, ${ZONE_STATS.criticalCount} 个关键交互`);
