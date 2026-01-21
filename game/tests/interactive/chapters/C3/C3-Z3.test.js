// ============================================================================
// C3-Z3.test.js - 档案巷：宋岚的版本库
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 宋岚管理的版本档案库，记录着世界的差异
// ============================================================================

const ZONE_ID = 'C3-Z3';
const ZONE_NAME = '档案巷：宋岚的版本库';

/**
 * C3-Z3 档案巷测试用例
 * 
 * 交互对象:
 * - map_wall: 地图墙（信息展示）
 * - annotation_desk: 差异标注台（条件交互，伏笔F12）
 * 
 * 关键事件:
 * - 伏笔 F12 投放
 * - R+1 提交差异
 */
const TESTS = [
  // ============================================
  // TC-C3Z3-01: 地图墙交互
  // ============================================
  {
    id: 'TC-C3Z3-01',
    name: '地图墙交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'map_wall',
    objectName: '地图墙',
    description: '查看地图墙上的版本地图',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'map_wall' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_VERSION_MAP_03'],
      flags: { FLAG_C3Z3_SAW_MAPS: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 9,
      dialogueContains: ['三张不同版本的地图', '门影区域', 'V1：一个小空白', 'V3：空白位置被写成', '一直在"更正"'],
    },
  },

  // ============================================
  // TC-C3Z3-02: 差异标注台交互（未看地图）
  // ============================================
  {
    id: 'TC-C3Z3-02',
    name: '差异标注台交互（条件不满足）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'annotation_desk',
    objectName: '差异标注台',
    description: '在未查看地图墙前尝试使用标注台',
    preconditions: ['FLAG_C3Z3_SAW_MAPS = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z3_SAW_MAPS', value: false },
      { action: 'moveToObject', objectId: 'annotation_desk' },
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
      dialogueContent: '需要先了解版本差异',
      expectedLines: 1,
      dialogueContains: ['需要先了解版本差异'],
    },
  },

  // ============================================
  // TC-C3Z3-03: 差异标注台 - 提交差异报告
  // ============================================
  {
    id: 'TC-C3Z3-03',
    name: '差异标注台 - 提交差异报告',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'annotation_desk',
    objectName: '差异标注台',
    description: '查看地图后提交差异报告，触发伏笔F12',
    preconditions: ['FLAG_C3Z3_SAW_MAPS = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z3_SAW_MAPS', value: true },
      { action: 'moveToObject', objectId: 'annotation_desk' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_DIFF_RECEIPT'],
      flags: { FLAG_VERSION_DIFF_SUBMITTED: true },
      rDelta: 1,
      pDelta: 0,
      foreshadow: { id: 'F12', action: 'plant' },
      nextZone: null,
      expectedLines: 6,
      dialogueContains: ['差异已保存', '奖励：无', '每一个被记录的差异', '对"唯一版本"的反驳'],
    },
  },

  // ============================================
  // TC-C3Z3-04: 完整流程测试
  // ============================================
  {
    id: 'TC-C3Z3-04',
    name: '完整流程：地图墙 → 差异标注台',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'annotation_desk',
    objectName: '差异标注台',
    description: '完整体验档案巷流程',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      // 先查看地图墙
      { action: 'moveToObject', objectId: 'map_wall' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'closeDialogue' },
      { action: 'wait', duration: 1000 },
      // 再使用差异标注台
      { action: 'moveToObject', objectId: 'annotation_desk' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_VERSION_MAP_03', 'CARD_C3_DIFF_RECEIPT'],
      flags: { FLAG_C3Z3_SAW_MAPS: true, FLAG_VERSION_DIFF_SUBMITTED: true },
      rDelta: 1,
      pDelta: 0,
      foreshadow: { id: 'F12', action: 'plant' },
      nextZone: null,
      expectedLines: 15,
      dialogueContains: ['三张不同版本的地图', '门影区域', '差异已保存', '每一个被记录的差异'],
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
  window.C3_Z3_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C3-Z3] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
