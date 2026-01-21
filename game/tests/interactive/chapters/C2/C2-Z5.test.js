// ============================================================================
// C2-Z5 诊疗台：阿棠的碎片日记1 ChromeMCP 测试脚本
// ============================================================================
// Zone: C2-Z5 - 诊疗台：阿棠的碎片日记1
// 生成时间: 2026-01-21
// 关键事件: 阿棠对话（R+1），获得碎片日记
// ============================================================================

const C2Z5_TESTS = {
  zoneId: 'C2-Z5',
  zoneName: '诊疗台：阿棠的碎片日记1',
  description: '与阿棠对话，了解她的时间错乱症状',
  chapterInfo: {
    chapter: 'C2',
    chapterName: '第二章'
  },
  tests: [
    // ========================================================================
    // TC-C2Z5-01a: 阿棠对话 - 你说的"昨天"是哪一天（R+1）
    // ========================================================================
    {
      id: 'TC-C2Z5-01a',
      name: '阿棠对话 - 询问"昨天"（R+1）',
      objectId: 'atang',
      objectName: '阿棠',
      description: '【关键】询问阿棠关于"昨天"的问题，R+1',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z5' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'atang' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 0, choiceText: '你说的"昨天"是哪一天' },
        { action: 'waitForDialogueEnd', timeout: 5000 }
      ],
      expectedResults: {
        cards: [],
        flags: { FLAG_C2Z5_ASKED_YESTERDAY: true },
        rDelta: 1,
        pDelta: 0,
        dialogueId: 'C2Z5_ATANG_YESTERDAY',
        dialogueContent: '昨天...我不记得了',
        foreshadow: null,
        nextZone: null
      },
      branches: [
        { text: '你说的"昨天"是哪一天', result: 'ask_yesterday', rDelta: 1 },
        { text: '你还好吗', result: 'normal_chat' }
      ],
      critical: true // 关键测试点：R+1
    },

    // ========================================================================
    // TC-C2Z5-01b: 阿棠对话 - 你还好吗
    // ========================================================================
    {
      id: 'TC-C2Z5-01b',
      name: '阿棠对话 - 你还好吗',
      objectId: 'atang',
      objectName: '阿棠',
      description: '普通问候阿棠',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z5' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'atang' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 1, choiceText: '你还好吗' },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z5_ATANG_NORMAL',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z5-02: 阿棠的纸条
    // ========================================================================
    {
      id: 'TC-C2Z5-02',
      name: '阿棠的纸条',
      objectId: 'atang_note',
      objectName: '阿棠的纸条',
      description: '获得阿棠的碎片日记卡片',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z5' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'atang_note' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: ['CARD_C2_FRAGMENT_DIARY_01'],
        flags: { FLAG_C2Z5_GOT_NOTE: true },
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z5_ATANG_NOTE',
        dialogueContent: '碎片日记...记录着混乱的时间线',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z5-03: 诊疗设备
    // ========================================================================
    {
      id: 'TC-C2Z5-03',
      name: '诊疗设备',
      objectId: 'medical_device',
      objectName: '诊疗设备',
      description: '观察诊疗室的设备',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z5' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'medical_device' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z5_MEDICAL_DEVICE',
        dialogueContent: '诊疗设备，用于对齐治疗',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z5-04: 前往C2-Z6
    // ========================================================================
    {
      id: 'TC-C2Z5-04',
      name: '前往礼堂街（C2-Z6）',
      objectId: 'exit_forward',
      objectName: '前往礼堂街',
      description: '前往下一个区域',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z5' },
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
        nextZone: 'C2-Z6'
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z5-05: 返回C2-Z4
    // ========================================================================
    {
      id: 'TC-C2Z5-05',
      name: '返回修补摊（C2-Z4）',
      objectId: 'exit_back',
      objectName: '返回修补摊',
      description: '返回上一个区域',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z5' },
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
        nextZone: 'C2-Z4'
      },
      branches: [],
      critical: false
    }
  ]
};

// ============================================================================
// 测试统计
// ============================================================================

const C2Z5_STATS = {
  zoneId: 'C2-Z5',
  totalTests: C2Z5_TESTS.tests.length,
  criticalTests: C2Z5_TESTS.tests.filter(t => t.critical).length,
  coverage: {
    objects: [...new Set(C2Z5_TESTS.tests.map(t => t.objectId))],
    flags: [
      'FLAG_C2Z5_ASKED_YESTERDAY',
      'FLAG_C2Z5_GOT_NOTE'
    ],
    cards: ['CARD_C2_FRAGMENT_DIARY_01'],
    rPoints: 1,
    foreshadows: []
  }
};

// ============================================================================
// 导出
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { C2Z5_TESTS, C2Z5_STATS };
}

if (typeof window !== 'undefined') {
  window.C2Z5_TESTS = C2Z5_TESTS;
  window.C2Z5_STATS = C2Z5_STATS;
}

console.log(`[C2-Z5] 诊疗台：阿棠的碎片日记1 测试加载完成`);
console.log(`  测试用例: ${C2Z5_STATS.totalTests}`);
console.log(`  关键测试: ${C2Z5_STATS.criticalTests}`);
console.log(`  R值测试点: +1`);
