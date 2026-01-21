// ============================================================================
// C2-Z2 薄墙巷口（重访）ChromeMCP 测试脚本
// ============================================================================
// Zone: C2-Z2 - 薄墙巷口（重访）
// 生成时间: 2026-01-21
// 关键事件: 深度感知首次使用，F01伏笔回收
// ============================================================================

const C2Z2_TESTS = {
  zoneId: 'C2-Z2',
  zoneName: '薄墙巷口（重访）',
  description: '重访薄墙巷口，使用深度感知能力看到空腔',
  chapterInfo: {
    chapter: 'C2',
    chapterName: '第二章',
    foreshadowRecover: 'F01'
  },
  tests: [
    // ========================================================================
    // TC-C2Z2-01: 薄墙（普通交互）
    // ========================================================================
    {
      id: 'TC-C2Z2-01',
      name: '薄墙（普通交互）',
      objectId: 'thin_wall_depth',
      objectName: '薄墙',
      description: '薄墙普通交互，提示可使用深度感知',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z2' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'thin_wall_depth' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z2_THIN_WALL',
        dialogueContent: '这面薄墙...现在有新能力了',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z2-02: 深度感知区域 - 激活看到空腔
    // ========================================================================
    {
      id: 'TC-C2Z2-02',
      name: '深度感知区域 - 激活看到空腔',
      objectId: 'depth_sense_zone',
      objectName: '深度感知区域',
      description: '【关键】使用深度感知能力看到墙内空腔，F01伏笔回收',
      preconditions: [
        { flag: 'FLAG_DEPTH_SENSE_UNLOCKED', value: true }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z2' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_DEPTH_SENSE_UNLOCKED', value: true },
        { action: 'moveToObject', objectId: 'depth_sense_zone' },
        { action: 'longPress', duration: 1500 },
        { action: 'waitForDialogue', timeout: 2000 },
        { action: 'waitForDialogueEnd', timeout: 5000 }
      ],
      expectedResults: {
        cards: [],
        flags: { FLAG_C2Z2_SAW_CAVITY: true },
        rDelta: 0,
        pDelta: 1, // 使用深度感知能力增加P值
        dialogueId: 'C2Z2_DEPTH_SENSE',
        dialogueContent: '墙内是空的...一个隐藏的空间',
        foreshadow: { id: 'F01', action: 'recover' },
        nextZone: null
      },
      branches: [],
      critical: true // 关键测试点：F01伏笔回收
    },

    // ========================================================================
    // TC-C2Z2-02-no-ability: 深度感知区域（无能力）
    // ========================================================================
    {
      id: 'TC-C2Z2-02-no-ability',
      name: '深度感知区域（无能力时）',
      objectId: 'depth_sense_zone',
      objectName: '深度感知区域',
      description: '没有深度感知能力时无法激活',
      preconditions: [
        { flag: 'FLAG_DEPTH_SENSE_UNLOCKED', value: false }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z2' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_DEPTH_SENSE_UNLOCKED', value: false },
        { action: 'moveToObject', objectId: 'depth_sense_zone' },
        { action: 'longPress', duration: 1500 },
        { action: 'waitForDialogue', timeout: 1000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z2_NO_ABILITY',
        dialogueContent: '需要深度感知能力',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z2-03: 提交记录点 - 提交发现
    // ========================================================================
    {
      id: 'TC-C2Z2-03',
      name: '提交记录点 - 提交发现',
      objectId: 'submit_point',
      objectName: '提交记录点',
      description: '向维修局提交发现的空腔记录',
      preconditions: [
        { flag: 'FLAG_C2Z2_SAW_CAVITY', value: true }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z2' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z2_SAW_CAVITY', value: true },
        { action: 'moveToObject', objectId: 'submit_point' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 0, choiceText: '提交' },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: ['CARD_C2_DEPTH_FRAGMENT_01'],
        flags: { FLAG_REPORTED_CAVITY: true },
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z2_SUBMIT',
        foreshadow: null,
        nextZone: null
      },
      branches: [
        { text: '提交', result: 'submit_cavity' },
        { text: '不提交', result: 'skip_report' }
      ],
      critical: false
    },

    // ========================================================================
    // TC-C2Z2-03-skip: 提交记录点 - 不提交
    // ========================================================================
    {
      id: 'TC-C2Z2-03-skip',
      name: '提交记录点 - 不提交',
      objectId: 'submit_point',
      objectName: '提交记录点',
      description: '选择不提交发现',
      preconditions: [
        { flag: 'FLAG_C2Z2_SAW_CAVITY', value: true }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z2' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z2_SAW_CAVITY', value: true },
        { action: 'moveToObject', objectId: 'submit_point' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 1, choiceText: '不提交' },
        { action: 'waitForDialogueEnd', timeout: 2000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z2_SUBMIT_SKIP',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z2-03-blocked: 提交记录点（未看到空腔）
    // ========================================================================
    {
      id: 'TC-C2Z2-03-blocked',
      name: '提交记录点（未看到空腔时）',
      objectId: 'submit_point',
      objectName: '提交记录点',
      description: '未使用深度感知时无法提交',
      preconditions: [
        { flag: 'FLAG_C2Z2_SAW_CAVITY', value: false }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z2' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z2_SAW_CAVITY', value: false },
        { action: 'moveToObject', objectId: 'submit_point' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z2_SUBMIT_BLOCKED',
        dialogueContent: '没有可提交的发现',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z2-04: 前往档案巷
    // ========================================================================
    {
      id: 'TC-C2Z2-04',
      name: '前往档案巷（C2-Z3）',
      objectId: 'exit_forward',
      objectName: '前往档案巷',
      description: '前往下一个区域',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z2' },
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
        nextZone: 'C2-Z3'
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z2-05: 返回校准室
    // ========================================================================
    {
      id: 'TC-C2Z2-05',
      name: '返回校准室（C2-Z1）',
      objectId: 'exit_back',
      objectName: '返回校准室',
      description: '返回上一个区域',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z2' },
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
        nextZone: 'C2-Z1'
      },
      branches: [],
      critical: false
    }
  ]
};

// ============================================================================
// 测试统计
// ============================================================================

const C2Z2_STATS = {
  zoneId: 'C2-Z2',
  totalTests: C2Z2_TESTS.tests.length,
  criticalTests: C2Z2_TESTS.tests.filter(t => t.critical).length,
  coverage: {
    objects: [...new Set(C2Z2_TESTS.tests.map(t => t.objectId))],
    flags: [
      'FLAG_C2Z2_SAW_CAVITY',
      'FLAG_REPORTED_CAVITY'
    ],
    cards: ['CARD_C2_DEPTH_FRAGMENT_01'],
    rPoints: 0,
    pPoints: 1,
    foreshadows: ['F01']
  }
};

// ============================================================================
// 导出
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { C2Z2_TESTS, C2Z2_STATS };
}

if (typeof window !== 'undefined') {
  window.C2Z2_TESTS = C2Z2_TESTS;
  window.C2Z2_STATS = C2Z2_STATS;
}

console.log(`[C2-Z2] 薄墙巷口（重访）测试加载完成`);
console.log(`  测试用例: ${C2Z2_STATS.totalTests}`);
console.log(`  关键测试: ${C2Z2_STATS.criticalTests}`);
console.log(`  伏笔回收: F01`);
