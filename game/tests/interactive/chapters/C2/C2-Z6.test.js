// ============================================================================
// C2-Z6 礼堂街：祷文抄本2 ChromeMCP 测试脚本
// ============================================================================
// Zone: C2-Z6 - 礼堂街：祷文抄本2
// 生成时间: 2026-01-21
// 关键事件: 牧平对话（R+1），获得祷文抄本，F15伏笔
// ============================================================================

const C2Z6_TESTS = {
  zoneId: 'C2-Z6',
  zoneName: '礼堂街：祷文抄本2',
  description: '与牧平对话，获得第二份祷文抄本',
  chapterInfo: {
    chapter: 'C2',
    chapterName: '第二章',
    foreshadow: 'F15'
  },
  tests: [
    // ========================================================================
    // TC-C2Z6-01a: 牧平对话 - 我看见墙里是空的（R+1）
    // ========================================================================
    {
      id: 'TC-C2Z6-01a',
      name: '牧平对话 - 我看见墙里是空的（R+1）',
      objectId: 'muping',
      objectName: '牧平',
      description: '【关键】告诉牧平看到的空腔，引发进一步对话，R+1',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z6' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'muping' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 0, choiceText: '我看见墙里是空的' },
        { action: 'waitForDialogue', timeout: 2000 },
        { action: 'selectChoice', choiceIndex: 0, choiceText: '那我该怎么办' },
        { action: 'waitForDialogueEnd', timeout: 5000 }
      ],
      expectedResults: {
        cards: [],
        flags: { FLAG_C2Z6_TALKED_MUPING: true },
        rDelta: 1,
        pDelta: 0,
        dialogueId: 'C2Z6_MUPING_ADVICE',
        expectedLines: 4,
        dialogueContains: ['少写一点，或者写得更轻一点', '你会明白的', '他递给你一张纸'],
        dialogueChain: ['C2Z6_MUPING_WALL', 'C2Z6_MUPING_ADVICE'],
        foreshadow: null,
        nextZone: null
      },
      branches: [
        { text: '我看见墙里是空的', result: 'tell_wall' },
        { text: '普通问候', result: 'normal_chat' }
      ],
      critical: true // 关键测试点：R+1
    },

    // ========================================================================
    // TC-C2Z6-01b: 牧平对话 - 普通问候
    // ========================================================================
    {
      id: 'TC-C2Z6-01b',
      name: '牧平对话 - 普通问候',
      objectId: 'muping',
      objectName: '牧平',
      description: '与牧平普通对话',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z6' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'muping' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'selectChoice', choiceIndex: 1, choiceText: '普通问候' },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z6_MUPING_PASS',
        expectedLines: 2,
        dialogueContains: ['路过也是一种到达', '你会回来的'],
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z6-02: 祷文抄本位置 - 获取抄本
    // ========================================================================
    {
      id: 'TC-C2Z6-02',
      name: '祷文抄本位置 - 获取抄本',
      objectId: 'prayer_scroll',
      objectName: '祷文抄本位置',
      description: '获取第二份祷文抄本，F15伏笔',
      preconditions: [
        { flag: 'FLAG_C2Z6_TALKED_MUPING', value: true }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z6' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z6_TALKED_MUPING', value: true },
        { action: 'moveToObject', objectId: 'prayer_scroll' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 },
        { action: 'waitForDialogueEnd', timeout: 3000 }
      ],
      expectedResults: {
        cards: ['CARD_C2_PRAYER_02'],
        flags: { FLAG_C2Z6_GOT_PRAYER: true },
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z6_MUPING_ADVICE',
        expectedLines: 4,
        dialogueContains: ['少写一点，或者写得更轻一点', '他递给你一张纸'],
        foreshadow: { id: 'F15', action: 'plant' },
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z6-02-blocked: 祷文抄本位置（未与牧平对话）
    // ========================================================================
    {
      id: 'TC-C2Z6-02-blocked',
      name: '祷文抄本位置（未与牧平对话时）',
      objectId: 'prayer_scroll',
      objectName: '祷文抄本位置',
      description: '未与牧平对话时无法获取抄本',
      preconditions: [
        { flag: 'FLAG_C2Z6_TALKED_MUPING', value: false }
      ],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z6' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'setFlag', flag: 'FLAG_C2Z6_TALKED_MUPING', value: false },
        { action: 'moveToObject', objectId: 'prayer_scroll' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z6_MUPING_TALK',
        expectedLines: 5,
        dialogueContains: ['又见面了', '你的眼睛……不一样了', '风越大，纸越薄'],
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z6-03: 礼堂入口
    // ========================================================================
    {
      id: 'TC-C2Z6-03',
      name: '礼堂入口',
      objectId: 'hall_entrance',
      objectName: '礼堂入口',
      description: '观察礼堂入口',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z6' },
        { action: 'waitForScene', timeout: 2000 },
        { action: 'moveToObject', objectId: 'hall_entrance' },
        { action: 'interact' },
        { action: 'waitForDialogue', timeout: 1000 }
      ],
      expectedResults: {
        cards: [],
        flags: {},
        rDelta: 0,
        pDelta: 0,
        dialogueId: 'C2Z6_MUPING_END',
        expectedLines: 3,
        dialogueContains: ['去吧', '小心纸页', '你得到了一段能活下去的解释'],
        foreshadow: null,
        nextZone: null
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z6-04: 前往C2-Z7
    // ========================================================================
    {
      id: 'TC-C2Z6-04',
      name: '前往边缘断口（C2-Z7）',
      objectId: 'exit_forward',
      objectName: '前往边缘断口',
      description: '前往下一个区域',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z6' },
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
        nextZone: 'C2-Z7'
      },
      branches: [],
      critical: false
    },

    // ========================================================================
    // TC-C2Z6-05: 返回C2-Z5
    // ========================================================================
    {
      id: 'TC-C2Z6-05',
      name: '返回诊疗台（C2-Z5）',
      objectId: 'exit_back',
      objectName: '返回诊疗台',
      description: '返回上一个区域',
      preconditions: [],
      steps: [
        { action: 'teleport', zoneId: 'C2-Z6' },
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
        nextZone: 'C2-Z5'
      },
      branches: [],
      critical: false
    }
  ]
};

// ============================================================================
// 测试统计
// ============================================================================

const C2Z6_STATS = {
  zoneId: 'C2-Z6',
  totalTests: C2Z6_TESTS.tests.length,
  criticalTests: C2Z6_TESTS.tests.filter(t => t.critical).length,
  coverage: {
    objects: [...new Set(C2Z6_TESTS.tests.map(t => t.objectId))],
    flags: [
      'FLAG_C2Z6_TALKED_MUPING',
      'FLAG_C2Z6_GOT_PRAYER'
    ],
    cards: ['CARD_C2_PRAYER_02'],
    rPoints: 1,
    foreshadows: ['F15']
  }
};

// ============================================================================
// 导出
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { C2Z6_TESTS, C2Z6_STATS };
}

if (typeof window !== 'undefined') {
  window.C2Z6_TESTS = C2Z6_TESTS;
  window.C2Z6_STATS = C2Z6_STATS;
}

console.log(`[C2-Z6] 礼堂街：祷文抄本2 测试加载完成`);
console.log(`  测试用例: ${C2Z6_STATS.totalTests}`);
console.log(`  关键测试: ${C2Z6_STATS.criticalTests}`);
console.log(`  R值测试点: +1`);
console.log(`  伏笔: F15`);
