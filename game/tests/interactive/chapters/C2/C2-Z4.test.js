// ============================================================================
// C2-Z4 栖蓝的修补摊 ChromeMCP 测试脚本
// ============================================================================
// Zone: C2-Z4 - 栖蓝的修补摊
// 生成时间: 2026-01-21
// 关键事件: 路标修补任务，R+2，F05伏笔
// ============================================================================

const C2Z4_TESTS = {
  zoneId: 'C2-Z4',
  zoneName: '栖蓝的修补摊',
  description: '栖蓝的修补摊，帮助修复歪斜路标',
  chapterInfo: {
    chapter: 'C2',
    chapterName: '第二章',
    foreshadow: 'F05'
  },
  tests: [
    // ========================================================================
    // TC-C2Z4-01: 歪斜路标
    // ========================================================================
    {
      id: 'TC-C2Z4-01',
      name: '歪斜路标',
      objectId: 'crooked_sign',
      objectName: '歪斜路标',
      description: '观察歪斜的路标',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z4' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'crooked_sign' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'waitForDialogueEnd', timeout: 2000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z4_CROOKED_SIGN',
        dialogueContent: '路标歪了，需要钉子才能修好',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z4-02: 钉子孔 - 捡起钉子
    // ========================================================================
    {
      id: 'TC-C2Z4-02',
      name: '钉子孔 - 捡起钉子',
      objectId: 'nail_hole',
      objectName: '钉子孔',
      description: '从钉子孔捡起钉子',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z4' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'nail_hole' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 0, choiceText: '捡起钉子' },
        { action: 'waitForDialogueEnd', timeout: 2000 }
      ],
      expectedResults: {
        cards: ['CARD_C2_NAIL'],
        flags: { FLAG_C2Z4_HAS_NAIL: true },
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z4_NAIL_PICKUP',
        foreshadow: null,
        nextZone: null
      },
      branches: [
        { text: '捡起钉子', result: 'pickup' },
        { text: '不需要', result: 'skip' }
      ],
      critical: false
    },

    // ========================================================================
    // TC-C2Z4-02-skip: 钉子孔 - 不需要
    // ========================================================================
    {
      id: 'TC-C2Z4-02-skip',
      name: '钉子孔 - 不需要',
      objectId: 'nail_hole',
      objectName: '钉子孔',
      description: '选择不捡钉子',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z4' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'nail_hole' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 1, choiceText: '不需要' },
        { action: 'waitForDialogueEnd', timeout: 2000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z4_NAIL_SKIP',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z4-03: 栖蓝对话 - 我帮你
    // ========================================================================
    {
      id: 'TC-C2Z4-03',
      name: '栖蓝对话 - 我帮你',
      objectId: 'qilan',
      objectName: '栖蓝',
      description: '与栖蓝对话，同意帮助',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z4' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'qilan' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 0, choiceText: '我帮你' },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: [],
        flags: { FLAG_C2Z4_AGREED_HELP: true },
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z4_QILAN_HELP',
        foreshadow: null,
        nextZone: null
      },
      branches: [
        { text: '我帮你', result: 'agree_help' },
        { text: '我很忙', result: 'decline' }
      ],
      critical: false
    },

    // ========================================================================
    // TC-C2Z4-03-decline: 栖蓝对话 - 我很忙
    // ========================================================================
    {
      id: 'TC-C2Z4-03-decline',
      name: '栖蓝对话 - 我很忙',
      objectId: 'qilan',
      objectName: '栖蓝',
      description: '与栖蓝对话，拒绝帮助',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z4' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'qilan' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 1, choiceText: '我很忙' },
        { action: 'waitForDialogueEnd', timeout: 2000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z4_QILAN_DECLINE',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z4-04: 完成修补（R+2）
    // ========================================================================
    {
      id: 'TC-C2Z4-04',
      name: '完成修补（R+2, F05）',
      objectId: 'complete_point',
      objectName: '完成修补',
      description: '【关键】完成路标修补，R+2，F05伏笔，获得修补记录卡片',
      preconditions: [
        { flag: 'FLAG_C2Z4_HAS_NAIL', value: true }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z4' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z4_HAS_NAIL', value: true },
        { action: 'moveToObject', objectId: 'complete_point' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'waitForDialogueEnd', timeout: 5000 }
      ],
      expectedResults: {
        cards: ['CARD_C2_REPAIR_RECORD'],
        flags: { FLAG_HELPED_QILAN_SIGN: true },
        rDelta: 2,
        pDelta: 0,
        dialogueId: 'C2Z4_COMPLETE_REPAIR',
        foreshadow: { id: 'F05', action: 'plant' },
        nextZone: null
      },
      branches: [],
      critical: true // 关键测试点：R+2 + F05伏笔
    },

    // ========================================================================
    // TC-C2Z4-04-blocked: 完成修补（无钉子）
    // ========================================================================
    {
      id: 'TC-C2Z4-04-blocked',
      name: '完成修补（无钉子时阻止）',
      objectId: 'complete_point',
      objectName: '完成修补',
      description: '没有钉子时无法完成修补',
      preconditions: [
        { flag: 'FLAG_C2Z4_HAS_NAIL', value: false }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z4' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z4_HAS_NAIL', value: false },
        { action: 'moveToObject', objectId: 'complete_point' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z4_REPAIR_BLOCKED',
        dialogueContent: '需要钉子才能修好',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z4-05: 前往C2-Z5
    // ========================================================================
    {
      id: 'TC-C2Z4-05',
      name: '前往诊疗台（C2-Z5）',
      objectId: 'exit_forward',
      objectName: '前往诊疗台',
      description: '前往下一个区域',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z4' },
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
        nextZone: 'C2-Z5'
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z4-06: 返回C2-Z3
    // ========================================================================
    {
      id: 'TC-C2Z4-06',
      name: '返回诊疗室（C2-Z3）',
      objectId: 'exit_back',
      objectName: '返回诊疗室',
      description: '返回上一个区域',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z4' },
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
        nextZone: 'C2-Z3'
      },
      branches: [],
      critical: false
    }
  ]
};

// ============================================================================
// 测试统计
// ============================================================================

const C2Z4_STATS = {
  zoneId: 'C2-Z4',
  totalTests: C2Z4_TESTS.tests.length,
  criticalTests: C2Z4_TESTS.tests.filter(t => t.critical).length,
  coverage: {
    objects: [...new Set(C2Z4_TESTS.tests.map(t => t.objectId))],
    flags: [
      'FLAG_C2Z4_HAS_NAIL',
      'FLAG_C2Z4_AGREED_HELP',
      'FLAG_HELPED_QILAN_SIGN'
    ],
    cards: ['CARD_C2_NAIL', 'CARD_C2_REPAIR_RECORD'],
    rPoints: 2,
    foreshadows: ['F05']
  }
};

// ============================================================================
// 导出
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { C2Z4_TESTS, C2Z4_STATS };
}

if (typeof window !== 'undefined') {
  window.C2Z4_TESTS = C2Z4_TESTS;
  window.C2Z4_STATS = C2Z4_STATS;
}

console.log(`[C2-Z4] 栖蓝的修补摊 测试加载完成`);
console.log(`  测试用例: ${C2Z4_STATS.totalTests}`);
console.log(`  关键测试: ${C2Z4_STATS.criticalTests}`);
console.log(`  R值测试点: +2`);
console.log(`  伏笔: F05`);
