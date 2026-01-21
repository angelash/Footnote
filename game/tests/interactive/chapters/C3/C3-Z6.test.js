// ============================================================================
// C3-Z6.test.js - 礼堂街：牧平的警告
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 牧平所在的礼堂街，F23伏笔加深
// ============================================================================

const ZONE_ID = 'C3-Z6';
const ZONE_NAME = '礼堂街：牧平的警告';

/**
 * C3-Z6 礼堂街测试用例
 * 
 * 交互对象:
 * - muping: 牧平（NPC对话，伏笔F23加深）
 * - prayer_scroll_point: 抄本领取处（条件交互）
 * - extra_chair: 歪椅子（R+1无收益行为）
 * 
 * 关键事件:
 * - 伏笔 F23 加深 (deepen)
 * - R+1 扶正椅子
 */
const TESTS = [
  // ============================================
  // TC-C3Z6-01: 牧平对话 - F23伏笔加深
  // ============================================
  {
    id: 'TC-C3Z6-01',
    name: '牧平对话 - F23伏笔加深',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'muping',
    objectName: '牧平',
    description: '与牧平对话，听取警告，伏笔F23加深',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'muping' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C3Z6_MUPING_SPOKE: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: { id: 'F23', action: 'deepen' },
      dialogueContent: '如果不写，人会被抹掉',
      nextZone: null,
      expectedLines: 8,
      dialogueContains: ['看见只是风，写入才是墨', '墨多了，纸会裂', '让这页纸变厚', '如果不写，人会被抹掉'],
    },
  },

  // ============================================
  // TC-C3Z6-02: 抄本领取处交互（未与牧平对话）
  // ============================================
  {
    id: 'TC-C3Z6-02',
    name: '抄本领取处交互（条件不满足）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'prayer_scroll_point',
    objectName: '抄本领取处',
    description: '在未与牧平对话前尝试领取抄本',
    preconditions: ['FLAG_C3Z6_MUPING_SPOKE = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z6_MUPING_SPOKE', value: false },
      { action: 'moveToObject', objectId: 'prayer_scroll_point' },
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
      dialogueContent: '需要先与牧平确认',
      expectedLines: 1,
      dialogueContains: ['需要先与牧平确认'],
    },
  },

  // ============================================
  // TC-C3Z6-03: 抄本领取 - 获取祈祷抄本
  // ============================================
  {
    id: 'TC-C3Z6-03',
    name: '抄本领取 - 获取祈祷抄本',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'prayer_scroll_point',
    objectName: '抄本领取处',
    description: '与牧平对话后领取祈祷抄本',
    preconditions: ['FLAG_C3Z6_MUPING_SPOKE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C3Z6_MUPING_SPOKE', value: true },
      { action: 'moveToObject', objectId: 'prayer_scroll_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_PRAYER_03'],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 4,
      dialogueContains: ['坐在前排', '听完了牧平的话', '把这个带上', '抄本'],
    },
  },

  // ============================================
  // TC-C3Z6-04: 歪椅子 - 扶正它（R+1无收益行为）
  // ============================================
  {
    id: 'TC-C3Z6-04',
    name: '歪椅子 - 扶正它',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'extra_chair',
    objectName: '歪椅子',
    description: '扶正歪斜的椅子，无收益行为触发R+1',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'extra_chair' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '扶正它' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 1,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 5,
      dialogueContains: ['椅子歪了', '把椅子扶正了', '没有人注意到', '也没有奖励', '摆好了'],
    },
  },

  // ============================================
  // TC-C3Z6-05: 歪椅子 - 不管它
  // ============================================
  {
    id: 'TC-C3Z6-05',
    name: '歪椅子 - 不管它',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'extra_chair',
    objectName: '歪椅子',
    description: '选择不扶正椅子，无额外效果',
    branch: '不管它',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'extra_chair' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 1, text: '不管它' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 2,
      dialogueContains: ['椅子歪了', '算了'],
    },
  },

  // ============================================
  // TC-C3Z6-06: 完整流程测试
  // ============================================
  {
    id: 'TC-C3Z6-06',
    name: '完整流程：牧平 → 抄本领取 → 歪椅子',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'extra_chair',
    objectName: '歪椅子',
    description: '完整体验礼堂街流程',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      // 先与牧平对话
      { action: 'moveToObject', objectId: 'muping' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'closeDialogue' },
      { action: 'wait', duration: 1000 },
      // 领取抄本
      { action: 'moveToObject', objectId: 'prayer_scroll_point' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'closeDialogue' },
      { action: 'wait', duration: 1000 },
      // 扶正椅子
      { action: 'moveToObject', objectId: 'extra_chair' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '扶正它' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C3_PRAYER_03'],
      flags: { FLAG_C3Z6_MUPING_SPOKE: true },
      rDelta: 1,
      pDelta: 0,
      foreshadow: { id: 'F23', action: 'deepen' },
      nextZone: null,
      expectedLines: 17,
      dialogueContains: ['看见只是风，写入才是墨', '把这个带上', '椅子歪了', '扶正了'],
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
  window.C3_Z6_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C3-Z6] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
