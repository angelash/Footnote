// ============================================================================
// C0-Z4.test.js - 维修局前台
// ============================================================================
// 生成时间: 2026-01-21
// Zone 描述: 堆满旧文件的档案储存室，秩序语法第一次正面登场，顾临首次出场
// ============================================================================

const ZONE_ID = 'C0-Z4';
const ZONE_NAME = '维修局前台';

/**
 * C0-Z4 维修局前台测试用例
 * 
 * 交互对象:
 * - reception_window: 前台窗口
 * - task_board: 任务板
 * - gulin_door: 顾临办公室（多分支对话，含条件选项）
 * - info_board: 规章制度
 * - exit_back: 返回巷口
 * - exit_to_c1: 出发巡检（条件跳转）
 */
const TESTS = [
  // ============================================
  // TC-C0Z4-01: 前台窗口交互
  // ============================================
  {
    id: 'TC-C0Z4-01',
    name: '前台窗口交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'reception_window',
    objectName: '前台窗口',
    description: '与前台交互，完成报到',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'reception_window' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_C0Z4_CHECKED_IN: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证: C0Z4_RECEPTION(4)
      expectedLines: 4,
      dialogueContains: ['外勤报到', '任务单', '既定路线', '顾主管'],
    },
  },

  // ============================================
  // TC-C0Z4-02: 任务板交互
  // ============================================
  {
    id: 'TC-C0Z4-02',
    name: '任务板交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'task_board',
    objectName: '任务板',
    description: '查看任务板，获得任务单卡片，触发伏笔 F03',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'task_board' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: ['CARD_C0_TASK_SHEET'],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: { id: 'F03', action: 'deepen' },
      nextZone: null,
      // 对话验证: C0Z4_TASKBOARD(5)
      expectedLines: 5,
      dialogueContains: ['巡检任务单', '路线A', '标注异常', '更正'],
    },
  },

  // ============================================
  // TC-C0Z4-03a: 顾临对话 - 明白
  // ============================================
  {
    id: 'TC-C0Z4-03a',
    name: '顾临对话 - 明白',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'gulin_door',
    objectName: '顾临办公室',
    description: '与顾临对话，选择"明白"，接受任务',
    branch: '明白',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'gulin_door' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '明白' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: {
        FLAG_C0_TASK_RECEIVED: true,
        FLAG_C0_END: true,
      },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证: C0Z4_GULIN_TALK(3) + C0Z4_GULIN_OBEY(2) = 5
      expectedLines: 5,
      dialogueContains: ['既定走', '流程解决', '例外', '复杂度', '记录在案'],
    },
  },

  // ============================================
  // TC-C0Z4-03b: 顾临对话 - 公告板日期不对（需FLAG）
  // ============================================
  {
    id: 'TC-C0Z4-03b',
    name: '顾临对话 - 昨晚公告板日期不对',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'gulin_door',
    objectName: '顾临办公室',
    description: '提出公告板日期问题（需要先查看过公告板）',
    branch: '昨晚公告板日期不对',
    preconditions: ['FLAG_SEEN_NOTICE = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_SEEN_NOTICE', value: true },
      { action: 'moveToObject', objectId: 'gulin_door' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 1, text: '昨晚公告板日期不对', requiresFlag: 'FLAG_SEEN_NOTICE' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: {
        FLAG_C0_TASK_RECEIVED: true,
        FLAG_C0_END: true,
      },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证: C0Z4_GULIN_TALK(3) + C0Z4_GULIN_DATE(4) = 7
      expectedLines: 7,
      dialogueContains: ['既定走', '流程解决', '记录就好', '主观', '事实', '记录为准'],
    },
  },

  // ============================================
  // TC-C0Z4-03c: 顾临对话 - 墙里是空的（需FLAG）
  // ============================================
  {
    id: 'TC-C0Z4-03c',
    name: '顾临对话 - 我听到墙里是空的',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'gulin_door',
    objectName: '顾临办公室',
    description: '提出薄墙回声问题（需要先触发过墙壁回声）',
    branch: '我听到墙里是空的',
    preconditions: ['FLAG_HEARD_WALL_ECHO = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_HEARD_WALL_ECHO', value: true },
      { action: 'moveToObject', objectId: 'gulin_door' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 2, text: '我听到墙里是空的', requiresFlag: 'FLAG_HEARD_WALL_ECHO' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: {
        FLAG_C0_TASK_RECEIVED: true,
        FLAG_C0_END: true,
      },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证: C0Z4_GULIN_TALK(3) + C0Z4_GULIN_WALL(5) = 8
      expectedLines: 8,
      dialogueContains: ['既定走', '流程解决', '听到', '感知异常', '结构异常', '系统判定'],
    },
  },

  // ============================================
  // TC-C0Z4-04: 规章制度交互
  // ============================================
  {
    id: 'TC-C0Z4-04',
    name: '规章制度交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'info_board',
    objectName: '规章制度',
    description: '查看维修局行为准则',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'info_board' },
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
      // 对话验证: 规章制度对话(1)
      expectedLines: 1,
      dialogueContains: ['维修局行为准则'],
    },
  },

  // ============================================
  // TC-C0Z4-05: 返回巷口（跳转 C0-Z3）
  // ============================================
  {
    id: 'TC-C0Z4-05',
    name: '返回巷口（跳转C0-Z3）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_back',
    objectName: '返回巷口',
    description: '返回薄墙巷口',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'exit_back' },
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

  // ============================================
  // TC-C0Z4-06: 出发巡检（跳转 C1-Z1）
  // ============================================
  {
    id: 'TC-C0Z4-06',
    name: '出发巡检（跳转C1-Z1）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_to_c1',
    objectName: '出发巡检',
    description: '接受任务后出发巡检，进入第一章',
    preconditions: ['FLAG_C0_TASK_RECEIVED = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C0_TASK_RECEIVED', value: true },
      { action: 'moveToObject', objectId: 'exit_to_c1' },
      { action: 'interact' },
      { action: 'wait', duration: 3000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: 'C1-Z1',
    },
  },

  // ============================================
  // TC-C0Z4-06-blocked: 出发巡检（未接任务时阻止）
  // ============================================
  {
    id: 'TC-C0Z4-06-blocked',
    name: '出发巡检（未接任务时阻止）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_to_c1',
    objectName: '出发巡检',
    description: '未接受任务时尝试出发，被阻止',
    preconditions: ['FLAG_C0_TASK_RECEIVED = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C0_TASK_RECEIVED', value: false },
      { action: 'moveToObject', objectId: 'exit_to_c1' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null, // 不跳转
      // 对话验证: 阻止提示(1)
      expectedLines: 1,
      dialogueContains: ['还没接到任务'],
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
  window.C0_Z4_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C0-Z4] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
