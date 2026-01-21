// ============================================================================
// C2-Z3 许澄诊疗室 ChromeMCP 测试脚本
// ============================================================================
// Zone: C2-Z3 - 许澄诊疗室
// 生成时间: 2026-01-21
// 关键事件: 版本差异记录，F12伏笔埋设
// ============================================================================

const C2Z3_TESTS = {
  zoneId: 'C2-Z3',
  zoneName: '许澄诊疗室',
  description: '诊疗室场景，发现虚构楼梯并记录版本差异',
  chapterInfo: {
    chapter: 'C2',
    chapterName: '第二章',
    foreshadowPlant: 'F12'
  },
  tests: [
    // ========================================================================
    // TC-C2Z3-01: 第二段楼梯（虚构）
    // ========================================================================
    {
      id: 'TC-C2Z3-01',
      name: '第二段楼梯（虚构）',
      objectId: 'stair_segment_2_fake',
      objectName: '第二段楼梯（虚构）',
      description: '发现不存在的第二段楼梯',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z3' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'stair_segment_2_fake' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: [],
        flags: { FLAG_C2Z3_TRIGGERED_FAKE: true },
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z3_FAKE_STAIR',
        expectedLines: 5,
        dialogueContains: ['踏上这段楼梯', '脚下突然失去支撑', '这段楼梯……是假的'],
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z3-02a: 宋岚对话 - 询问楼梯
    // ========================================================================
    {
      id: 'TC-C2Z3-02a',
      name: '宋岚对话 - 询问楼梯',
      objectId: 'songlan',
      objectName: '宋岚',
      description: '与宋岚对话，询问关于楼梯的事',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z3' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'songlan' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 0, choiceText: '询问楼梯' },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z3_SONGLAN_GUIDE',
        expectedLines: 3,
        dialogueContains: ['别信你看到的楼梯，信它的骨架', '把差异记下来。差异会救你'],
        foreshadow: null,
        nextZone: null
      },
      branches: [
        { text: '询问楼梯', result: 'ask_stair' },
        { text: '普通寒暄', result: 'normal_chat' }
      ],
      critical: false
    },

    // ========================================================================
    // TC-C2Z3-02b: 宋岚对话 - 普通寒暄
    // ========================================================================
    {
      id: 'TC-C2Z3-02b',
      name: '宋岚对话 - 普通寒暄',
      objectId: 'songlan',
      objectName: '宋岚',
      description: '与宋岚普通对话',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z3' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'songlan' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 1, choiceText: '普通寒暄' },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z3_SONGLAN_PASS',
        expectedLines: 2,
        dialogueContains: ['那就用你的眼睛找路', '真实的那条'],
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z3-03: 记录差异任务点 - 记录差异（R+1）
    // ========================================================================
    {
      id: 'TC-C2Z3-03',
      name: '记录差异任务点 - 记录差异（R+1）',
      objectId: 'record_diff_point',
      objectName: '记录差异任务点',
      description: '【关键】记录版本差异，R+1，获得版本地图卡片，F12伏笔埋设',
      preconditions: [
        { flag: 'FLAG_C2Z3_TRIGGERED_FAKE', value: true }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z3' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z3_TRIGGERED_FAKE', value: true },
        { action: 'moveToObject', objectId: 'record_diff_point' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 0, choiceText: '记录差异' },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: ['CARD_C2_VERSION_MAP_02'],
        flags: { FLAG_RECORDED_STAIR_DIFF: true },
        rDelta: 1,
        pDelta: 0,
        dialogueId: 'C2Z3_RECORD_DONE',
        expectedLines: 2,
        dialogueContains: ['差异保存了', '没有奖励。但宋岚说过，这有用'],
        foreshadow: { id: 'F12', action: 'plant' },
        nextZone: null
      },
      branches: [
        { text: '记录差异', result: 'record', rDelta: 1 },
        { text: '不记录', result: 'skip' }
      ],
      critical: true // 关键测试点：R值增加 + F12伏笔
    },

    // ========================================================================
    // TC-C2Z3-03-skip: 记录差异任务点 - 不记录
    // ========================================================================
    {
      id: 'TC-C2Z3-03-skip',
      name: '记录差异任务点 - 不记录',
      objectId: 'record_diff_point',
      objectName: '记录差异任务点',
      description: '选择不记录差异',
      preconditions: [
        { flag: 'FLAG_C2Z3_TRIGGERED_FAKE', value: true }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z3' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z3_TRIGGERED_FAKE', value: true },
        { action: 'moveToObject', objectId: 'record_diff_point' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 1, choiceText: '不记录' },
        { action: 'waitForDialogueEnd', timeout: 2000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z3_RECORD_SKIP',
        expectedLines: 1,
        dialogueContains: ['算了，没时间做这个'],
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z3-03-blocked: 记录差异任务点（未触发虚构楼梯）
    // ========================================================================
    {
      id: 'TC-C2Z3-03-blocked',
      name: '记录差异任务点（未触发虚构楼梯时）',
      objectId: 'record_diff_point',
      objectName: '记录差异任务点',
      description: '未发现虚构楼梯时无法记录',
      preconditions: [
        { flag: 'FLAG_C2Z3_TRIGGERED_FAKE', value: false }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z3' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z3_TRIGGERED_FAKE', value: false },
        { action: 'moveToObject', objectId: 'record_diff_point' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z3_RECORD_DIFF',
        expectedLines: 1,
        dialogueContains: ['宋岚说的任务：把踩空的那一段记下来'],
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z3-04: 前往C2-Z4
    // ========================================================================
    {
      id: 'TC-C2Z3-04',
      name: '前往栖蓝的修补摊（C2-Z4）',
      objectId: 'exit_forward',
      objectName: '前往修补摊',
      description: '前往下一个区域',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z3' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'exit_forward' },
        { action: 'interact' },
        { action: 'waitForSceneTransition', timeout: 3000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: null,
        foreshadow: null,
        nextZone: 'C2-Z4'
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z3-05: 返回C2-Z2
    // ========================================================================
    {
      id: 'TC-C2Z3-05',
      name: '返回薄墙巷口（C2-Z2）',
      objectId: 'exit_back',
      objectName: '返回薄墙巷口',
      description: '返回上一个区域',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z3' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'exit_back' },
        { action: 'interact' },
        { action: 'waitForSceneTransition', timeout: 3000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: null,
        foreshadow: null,
        nextZone: 'C2-Z2'
      },
      branches: [],
      critical: false
    }
  ]
};

// ============================================================================
// 测试统计
// ============================================================================

const C2Z3_STATS = {
  zoneId: 'C2-Z3',
  totalTests: C2Z3_TESTS.tests.length,
  criticalTests: C2Z3_TESTS.tests.filter(t => t.critical).length,
  coverage: {
    objects: [...new Set(C2Z3_TESTS.tests.map(t => t.objectId))],
    flags: [
      'FLAG_C2Z3_TRIGGERED_FAKE',
      'FLAG_RECORDED_STAIR_DIFF'
    ],
    cards: ['CARD_C2_VERSION_MAP_02'],
    rPoints: 1,
    foreshadows: ['F12']
  }
};

// ============================================================================
// 导出
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { C2Z3_TESTS, C2Z3_STATS };
}

if (typeof window !== 'undefined') {
  window.C2Z3_TESTS = C2Z3_TESTS;
  window.C2Z3_STATS = C2Z3_STATS;
}

console.log(`[C2-Z3] 许澄诊疗室 测试加载完成`);
console.log(`  测试用例: ${C2Z3_STATS.totalTests}`);
console.log(`  关键测试: ${C2Z3_STATS.criticalTests}`);
console.log(`  R值测试点: +1`);
console.log(`  伏笔埋设: F12`);
