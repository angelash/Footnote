// ============================================================================
// C0-Z1.test.js - 宿舍走廊
// ============================================================================
// 生成时间: 2026-01-21
// 更新时间: 2026-01-23 (审计修复)
// Zone 描述: 维修局新人宿舍的走廊，灯光昏暗
// 
// 审计验收点：
// - [P0] 开场独白入场自动触发
// - [P0] 储物柜获取工单卡片
// - [P1] 长按身份卡触发细节对话
// - [P1] 祷词板交互
// - [P2] Flag 一致性（FLAG_C0Z1_NOTICE_EXAMINED）
// ============================================================================

const ZONE_ID = 'C0-Z1';
const ZONE_NAME = '宿舍走廊';

/**
 * C0-Z1 宿舍走廊测试用例
 * 
 * 交互对象:
 * - identity_card: 身份卡
 * - notice_board: 公告板（分支选择）
 * - storage_cabinet: 储物柜（条件交互）
 * - corridor_door: 邻居的门
 * - prayer_board: 祷词板
 * - exit_door: 出口
 */
const TESTS = [
  // ============================================
  // TC-C0Z1-00: 开场独白测试（入场自动触发）
  // ============================================
  {
    id: 'TC-C0Z1-00',
    name: '开场独白入场自动触发',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: null,
    objectName: '入场事件',
    description: '[P0] 验证进入 C0-Z1 时自动触发开场独白 CENHUI_MONO_01',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 3000 },  // 等待入场事件触发
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证：开场独白内容
      expectedLines: 3,
      dialogueContains: ['清晨', '维修', '第275周期'],
    },
    tags: ['onEnter', 'P0', 'prologue'],
  },

  // ============================================
  // TC-C0Z1-01: 身份卡交互
  // ============================================
  {
    id: 'TC-C0Z1-01',
    name: '身份卡交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'identity_card',
    objectName: '身份卡',
    description: '检查身份卡获取基础卡片',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'identity_card' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
    ],
    expectedResults: {
      cards: ['CARD_C0_IDENTITY'],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证（新增）
      expectedLines: 2,
      dialogueContains: ['身份识别卡', '岑回'],
    },
    tags: ['card', 'interaction'],
  },

  // ============================================
  // TC-C0Z1-01b: 身份卡长按细节（伏笔 F06）
  // ============================================
  {
    id: 'TC-C0Z1-01b',
    name: '身份卡长按细节（伏笔F06）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'identity_card',
    objectName: '身份卡',
    description: '[P1] 长按身份卡触发细节对话，发现日期修改痕迹（伏笔F06投放）',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'identity_card' },
      { action: 'longPress', duration: 1000 },  // 长按交互
      { action: 'waitForDialogue', timeout: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_SEEN_IDENTITY_CORRECTION: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: { id: 'F06', action: 'plant' },
      nextZone: null,
      // 对话验证：应该提到日期被修改过
      expectedLines: 4,
      dialogueContains: ['274', '275', '改过', '日期'],
    },
    tags: ['longPress', 'foreshadow', 'F06', 'P1'],
  },

  // ============================================
  // TC-C0Z1-02a: 公告板交互 - 仔细查看
  // ============================================
  {
    id: 'TC-C0Z1-02a',
    name: '公告板交互 - 仔细查看',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'notice_board',
    objectName: '公告板',
    description: '选择仔细查看，触发 R+1 和伏笔 F02',
    branch: '仔细查看',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'notice_board' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '仔细查看' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: { FLAG_SEEN_NOTICE: true },
      rDelta: 1,
      pDelta: 0,
      foreshadow: { id: 'F02', action: 'plant' },
      nextZone: null,
      // 对话验证（新增）- 选择仔细查看后有2行额外对话
      expectedLines: 5, // 3行(公告板)+2行(仔细查看后)
      dialogueContains: ['公告板', '第274周期', '第275周期', '维修配额'],
    },
  },

  // ============================================
  // TC-C0Z1-02b: 公告板交互 - 算了
  // ============================================
  {
    id: 'TC-C0Z1-02b',
    name: '公告板交互 - 算了不重要',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'notice_board',
    objectName: '公告板',
    description: '选择算了，无额外效果',
    branch: '算了',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'notice_board' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 1, text: '算了，不重要' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      flags: {},
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
    },
  },

  // ============================================
  // TC-C0Z1-03: 储物柜交互（首次 - 未取过）
  // ============================================
  {
    id: 'TC-C0Z1-03',
    name: '储物柜交互（首次）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'storage_cabinet',
    objectName: '储物柜',
    description: '[P0] 首次打开储物柜，获得餐票和工单',
    preconditions: ['FLAG_C0Z1_GOT_TOOLS = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C0Z1_GOT_TOOLS', value: false },
      { action: 'moveToObject', objectId: 'storage_cabinet' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      // [P0 修复] 现在同时获得餐票和工单
      cards: ['CARD_C0_MEAL_TICKET', 'CARD_C0_WORK_ORDER'],
      flags: { FLAG_C0Z1_GOT_TOOLS: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      // 对话验证 - 必须显示三行对话（包含工单）
      expectedLines: 3,
      dialogueContains: ['工具包已经准备好了', '早餐券也在这里', '今天的工单'],
    },
    tags: ['card', 'P0', 'value-loop'],
  },

  // ============================================
  // TC-C0Z1-04: 储物柜交互（已取过）
  // ============================================
  {
    id: 'TC-C0Z1-04',
    name: '储物柜交互（已取过）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'storage_cabinet',
    objectName: '储物柜（已取过）',
    description: '再次查看储物柜，显示已空',
    preconditions: ['FLAG_C0Z1_GOT_TOOLS = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C0Z1_GOT_TOOLS', value: true },
      { action: 'moveToObject', objectId: 'storage_cabinet' },
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
      // 对话验证（新增）
      expectedLines: 1,
      dialogueContains: ['工具包已经取过了'],
      dialogueNotContains: ['早餐券'], // 不应该再提到餐票
    },
  },

  // ============================================
  // TC-C0Z1-05: 邻居的门交互
  // ============================================
  {
    id: 'TC-C0Z1-05',
    name: '邻居的门交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'corridor_door',
    objectName: '邻居的门',
    description: '普通对话，查看门上的号码牌',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'corridor_door' },
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
      // 对话验证（新增）
      expectedLines: 2,
      dialogueContains: ['邻居的门紧闭着', '7750'],
    },
  },

  // ============================================
  // TC-C0Z1-06: 祷词板交互
  // ============================================
  {
    id: 'TC-C0Z1-06',
    name: '祷词板交互',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'prayer_board',
    objectName: '祷词板',
    description: '[P1] 祷词板交互获取晨祷卡片',
    preconditions: ['FLAG_C0Z1_PRAYER_TAKEN = false'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C0Z1_PRAYER_TAKEN', value: false },
      { action: 'moveToObject', objectId: 'prayer_board' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '取一张' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: ['CARD_C0_MORNING_PRAYER'],
      flags: { FLAG_C0Z1_PRAYER_TAKEN: true },
      rDelta: 0,
      pDelta: 0,
      foreshadow: null,
      nextZone: null,
      expectedLines: 3,
      dialogueContains: ['祷词', '每日一句', '取一张'],
    },
    tags: ['card', 'choice', 'P1'],
  },

  // ============================================
  // TC-C0Z1-06b: 祷词板交互（已取过）
  // ============================================
  {
    id: 'TC-C0Z1-06b',
    name: '祷词板交互（已取过）',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'prayer_board',
    objectName: '祷词板',
    description: '再次查看祷词板，显示已取过',
    preconditions: ['FLAG_C0Z1_PRAYER_TAKEN = true'],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'setFlag', flag: 'FLAG_C0Z1_PRAYER_TAKEN', value: true },
      { action: 'moveToObject', objectId: 'prayer_board' },
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
      expectedLines: 1,
      dialogueContains: ['今天的', '已经', '取过'],
      dialogueNotContains: ['取一张'],  // 不应该再有选项
    },
    tags: ['conditional', 'state'],
  },

  // ============================================
  // TC-C0Z1-07: 出口跳转到 C0-Z2
  // ============================================
  {
    id: 'TC-C0Z1-07',
    name: '出口跳转到C0-Z2',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'exit_door',
    objectName: '出口',
    description: '离开宿舍走廊，进入早餐小店',
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
      nextZone: 'C0-Z2',
    },
    tags: ['zone-transition'],
  },

  // ============================================
  // TC-C0Z1-08: Flag 一致性验证
  // ============================================
  {
    id: 'TC-C0Z1-08',
    name: 'Flag 一致性：FLAG_C0Z1_NOTICE_EXAMINED',
    zoneId: ZONE_ID,
    zoneName: ZONE_NAME,
    objectId: 'notice_board',
    objectName: '公告板',
    description: '[P2] 验证 FLAG_C0Z1_NOTICE_EXAMINED 设置后在 C0-Z4 可被正确读取',
    preconditions: [],
    steps: [
      { action: 'teleport', zoneId: ZONE_ID },
      { action: 'wait', duration: 2000 },
      { action: 'moveToObject', objectId: 'notice_board' },
      { action: 'interact' },
      { action: 'waitForDialogue', timeout: 1000 },
      { action: 'selectChoice', index: 0, text: '仔细查看' },
      { action: 'wait', duration: 2000 },
      // 跳转到 C0-Z4 验证 Flag 可读
      { action: 'teleport', zoneId: 'C0-Z4' },
      { action: 'wait', duration: 2000 },
    ],
    expectedResults: {
      cards: [],
      // 关键：验证 Flag 名称一致性（之前的 bug 是 FLAG_SEEN_NOTICE vs FLAG_C0Z1_NOTICE_EXAMINED）
      flags: { FLAG_C0Z1_NOTICE_EXAMINED: true },
      rDelta: 1,  // 仔细查看会 R+1
      pDelta: 0,
      foreshadow: { id: 'F02', action: 'plant' },
      nextZone: null,
    },
    tags: ['flag-consistency', 'cross-zone', 'P2'],
  },
];

// ============================================
// Zone 统计信息
// ============================================
const ZONE_STATS = {
  zoneId: ZONE_ID,
  zoneName: ZONE_NAME,
  totalTests: TESTS.length,
  objectsCovered: [...new Set(TESTS.map(t => t.objectId).filter(Boolean))],
  cardsCovered: [...new Set(TESTS.flatMap(t => t.expectedResults.cards || []))],
  flagsCovered: [...new Set(TESTS.flatMap(t => Object.keys(t.expectedResults.flags || {})))],
  foreshadowsCovered: TESTS.filter(t => t.expectedResults.foreshadow).map(t => t.expectedResults.foreshadow.id),
  totalRPoints: TESTS.reduce((sum, t) => sum + (t.expectedResults.rDelta || 0), 0),
  branchCount: TESTS.filter(t => t.branch).length,
  // 审计标签统计
  p0Tests: TESTS.filter(t => t.tags?.includes('P0')).length,
  p1Tests: TESTS.filter(t => t.tags?.includes('P1')).length,
  p2Tests: TESTS.filter(t => t.tags?.includes('P2')).length,
};

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.C0_Z1_TESTS = { ZONE_ID, ZONE_NAME, TESTS, ZONE_STATS };
}

console.log(`[C0-Z1] 测试加载完成: ${ZONE_STATS.totalTests} 个用例, 覆盖 ${ZONE_STATS.objectsCovered.length} 个对象`);
