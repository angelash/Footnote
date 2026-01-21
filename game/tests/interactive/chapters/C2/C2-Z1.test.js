// ============================================================================
// C2-Z1 维修局校准室 ChromeMCP 测试脚本
// ============================================================================
// Zone: C2-Z1 - 维修局校准室【解锁深度感知】
// 生成时间: 2026-01-21
// 关键事件: 深度感知能力解锁
// ============================================================================

const C2Z1_TESTS = {
  zoneId: 'C2-Z1',
  zoneName: '维修局校准室',
  description: '深度感知能力解锁场景，需完成三台校准设备后授权',
  chapterInfo: {
    chapter: 'C2',
    chapterName: '第二章',
    abilityUnlock: 'depthPerception'
  },
  tests: [
    // ========================================================================
    // TC-C2Z1-01: 校准台A
    // ========================================================================
    {
      id: 'TC-C2Z1-01',
      name: '校准台A',
      objectId: 'calibration_a',
      objectName: '校准台A',
      description: '第一个校准设备，完成后设置FLAG',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z1' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'calibration_a' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: [],
        flags: { FLAG_C2Z1_CALIBRATION_A: true },
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z1_CALIBRATION_A',
        expectedLines: 6,
        dialogueContains: ['校准台A：结构样本', '长按屏幕进入深度视野', '状态：稳定'],
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z1-02: 校准台B
    // ========================================================================
    {
      id: 'TC-C2Z1-02',
      name: '校准台B',
      objectId: 'calibration_b',
      objectName: '校准台B',
      description: '第二个校准设备，完成后设置FLAG',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z1' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'calibration_b' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: [],
        flags: { FLAG_C2Z1_CALIBRATION_B: true },
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z1_CALIBRATION_B',
        expectedLines: 5,
        dialogueContains: ['校准台B：空腔样本', '扭曲的空腔轮廓', '状态：扭曲'],
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z1-03: 校准台C
    // ========================================================================
    {
      id: 'TC-C2Z1-03',
      name: '校准台C',
      objectId: 'calibration_c',
      objectName: '校准台C',
      description: '第三个校准设备，完成后触发ALL_CALIBRATED',
      preconditions: [
        { flag: 'FLAG_C2Z1_CALIBRATION_A', value: true },
        { flag: 'FLAG_C2Z1_CALIBRATION_B', value: true }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z1' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z1_CALIBRATION_A', value: true },
        { action: 'setFlag', flag: 'FLAG_C2Z1_CALIBRATION_B', value: true },
        { action: 'moveToObject', objectId: 'calibration_c' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: [],
        flags: {
          FLAG_C2Z1_CALIBRATION_C: true,
          FLAG_C2Z1_ALL_CALIBRATED: true
        },
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z1_CALIBRATION_C',
        expectedLines: 5,
        dialogueContains: ['校准台C：断裂样本', '断裂/缺口线框', '状态：断裂'],
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z1-04: 授权终端 - 解锁深度感知（关键）
    // ========================================================================
    {
      id: 'TC-C2Z1-04',
      name: '授权终端 - 解锁深度感知',
      objectId: 'auth_terminal',
      objectName: '授权终端',
      description: '【关键】完成校准后解锁深度感知能力',
      preconditions: [
        { flag: 'FLAG_C2Z1_ALL_CALIBRATED', value: true }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z1' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z1_ALL_CALIBRATED', value: true },
        { action: 'moveToObject', objectId: 'auth_terminal' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'waitForDialogueEnd', timeout: 5000 }
      ],
      expectedResults: {
        cards: ['CARD_C2_DEPTH_AUTH'],
        flags: { FLAG_DEPTH_SENSE_UNLOCKED: true },
        abilities: ['depthPerception'],
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z1_AUTH_TERMINAL',
        expectedLines: 10,
        dialogueContains: ['校准完成', '授权：深度感知（只读）', '禁止：写入/介入', '观测将增加解释成本'],
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: true // 关键测试点：能力解锁
    },

    // ========================================================================
    // TC-C2Z1-04-blocked: 授权终端（未完成校准）
    // ========================================================================
    {
      id: 'TC-C2Z1-04-blocked',
      name: '授权终端（未完成校准时阻止）',
      objectId: 'auth_terminal',
      objectName: '授权终端',
      description: '未完成校准时无法使用授权终端',
      preconditions: [
        { flag: 'FLAG_C2Z1_ALL_CALIBRATED', value: false }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z1' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z1_ALL_CALIBRATED', value: false },
        { action: 'moveToObject', objectId: 'auth_terminal' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        abilities: [],
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z1_AUTH_BLOCKED',
        dialogueContent: '需要先完成所有校准',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z1-05: 顾临对话
    // ========================================================================
    {
      id: 'TC-C2Z1-05',
      name: '顾临对话',
      objectId: 'gulin',
      objectName: '顾临',
      description: '与顾临的普通对话',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z1' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'gulin' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z1_GULIN_TALK',
        expectedLines: 6,
        dialogueContains: ['不该被讨论的东西', '看见就记录。别动', '去完成校准流程吧'],
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z1-06: 离开到C2-Z2
    // ========================================================================
    {
      id: 'TC-C2Z1-06',
      name: '离开到C2-Z2（需解锁深度感知）',
      objectId: 'exit_forward',
      objectName: '离开',
      description: '解锁深度感知后离开到薄墙巷口（重访）',
      preconditions: [
        { flag: 'FLAG_DEPTH_SENSE_UNLOCKED', value: true }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z1' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_DEPTH_SENSE_UNLOCKED', value: true },
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
        nextZone: 'C2-Z2'
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z1-06-blocked: 离开（未解锁深度感知）
    // ========================================================================
    {
      id: 'TC-C2Z1-06-blocked',
      name: '离开（未解锁深度感知时阻止）',
      objectId: 'exit_forward',
      objectName: '离开',
      description: '未解锁深度感知时无法离开',
      preconditions: [
        { flag: 'FLAG_DEPTH_SENSE_UNLOCKED', value: false }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z1' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_DEPTH_SENSE_UNLOCKED', value: false },
        { action: 'moveToObject', objectId: 'exit_forward' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'EXIT_BLOCKED',
        dialogueContent: '需要先完成校准授权',
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    }
  ]
};

// ============================================================================
// 测试统计
// ============================================================================

const C2Z1_STATS = {
  zoneId: 'C2-Z1',
  totalTests: C2Z1_TESTS.tests.length,
  criticalTests: C2Z1_TESTS.tests.filter(t => t.critical).length,
  coverage: {
    objects: [...new Set(C2Z1_TESTS.tests.map(t => t.objectId))],
    flags: [
      'FLAG_C2Z1_CALIBRATION_A',
      'FLAG_C2Z1_CALIBRATION_B',
      'FLAG_C2Z1_CALIBRATION_C',
      'FLAG_C2Z1_ALL_CALIBRATED',
      'FLAG_DEPTH_SENSE_UNLOCKED'
    ],
    cards: ['CARD_C2_DEPTH_AUTH'],
    abilities: ['depthPerception'],
    rPoints: 0,
    foreshadows: []
  }
};

// ============================================================================
// 导出
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { C2Z1_TESTS, C2Z1_STATS };
}

if (typeof window !== 'undefined') {
  window.C2Z1_TESTS = C2Z1_TESTS;
  window.C2Z1_STATS = C2Z1_STATS;
}

console.log(`[C2-Z1] 维修局校准室 测试加载完成`);
console.log(`  测试用例: ${C2Z1_STATS.totalTests}`);
console.log(`  关键测试: ${C2Z1_STATS.criticalTests}`);
console.log(`  能力解锁: depthPerception`);
