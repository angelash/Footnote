// === C0 序章测试脚本 ===
// 生成时间: 2026-01-21
// 覆盖 Zone: C0-Z1, C0-Z2, C0-Z3, C0-Z4
// 基于: FULL_GAME_SCRIPT.md 第 20-200 行

/**
 * C0 序章测试用例数据结构
 * 包含所有交互对象的独立测试用例
 */
const C0_TESTS = {
  // ============================================
  // C0-Z1 宿舍走廊
  // ============================================
  'C0-Z1': {
    zoneId: 'C0-Z1',
    zoneName: '宿舍走廊',
    description: '维修局新人宿舍的走廊，灯光昏暗',
    openingDialogue: ['CENHUI_MONO_01', 'CENHUI_MONO_02', 'CENHUI_MONO_03'],
    tests: [
      // TC-C0Z1-01: 身份卡交互
      {
        id: 'TC-C0Z1-01',
        name: '身份卡交互',
        objectId: 'identity_card',
        objectName: '身份卡',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z1' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'identity_card' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
        ],
        expectedResults: {
          cards: ['CARD_C0_IDENTITY'],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'IDENTITY_CARD_EXAMINE',
          dialogueChain: ['IDENTITY_CARD_EXAMINE', 'IDENTITY_CARD_INFO'],
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z1-02: 公告板交互 - 仔细查看分支
      {
        id: 'TC-C0Z1-02a',
        name: '公告板交互 - 仔细查看',
        objectId: 'notice_board',
        objectName: '公告板',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z1' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'notice_board' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
          { action: 'selectChoice', choiceIndex: 0, choiceText: '仔细查看' },
          { action: 'waitForDialogueEnd', timeout: 2000 },
        ],
        expectedResults: {
          cards: [],
          flags: { FLAG_SEEN_NOTICE: true },
          rDelta: 1,
          pDelta: 0,
          dialogueId: 'NOTICE_BOARD_EXAMINE',
          foreshadow: { id: 'F02', action: 'plant' },
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z1-02b: 公告板交互 - 算了分支
      {
        id: 'TC-C0Z1-02b',
        name: '公告板交互 - 算了不重要',
        objectId: 'notice_board',
        objectName: '公告板',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z1' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'notice_board' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
          { action: 'selectChoice', choiceIndex: 1, choiceText: '算了，不重要' },
          { action: 'waitForDialogueEnd', timeout: 2000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'NOTICE_BOARD_EXAMINE',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z1-03: 储物柜交互（未取过）
      {
        id: 'TC-C0Z1-03',
        name: '储物柜交互（首次）',
        objectId: 'storage_cabinet',
        objectName: '储物柜',
        preconditions: [{ flag: 'FLAG_C0Z1_GOT_TOOLS', value: false }],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z1' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'setFlag', flag: 'FLAG_C0Z1_GOT_TOOLS', value: false },
          { action: 'moveToObject', objectId: 'storage_cabinet' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
          { action: 'waitForDialogueEnd', timeout: 3000 },
        ],
        expectedResults: {
          cards: ['CARD_C0_MEAL_TICKET'],
          flags: { FLAG_C0Z1_GOT_TOOLS: true },
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z1_STORAGE',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z1-04: 储物柜交互（已取过）
      {
        id: 'TC-C0Z1-04',
        name: '储物柜交互（已取过）',
        objectId: 'storage_cabinet',
        objectName: '储物柜（已取过）',
        preconditions: [{ flag: 'FLAG_C0Z1_GOT_TOOLS', value: true }],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z1' },
          { action: 'waitForScene', timeout: 2000 },
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
          dialogueId: 'C0Z1_STORAGE_DONE',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z1-05: 邻居的门交互
      {
        id: 'TC-C0Z1-05',
        name: '邻居的门交互',
        objectId: 'corridor_door',
        objectName: '邻居的门',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z1' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'corridor_door' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'CORRIDOR_DOOR_EXAMINE',
          dialogueContent: '邻居的门紧闭着，门上有一个褪色的号码牌',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z1-06: 出口跳转
      {
        id: 'TC-C0Z1-06',
        name: '出口跳转到C0-Z2',
        objectId: 'exit_door',
        objectName: '出口',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z1' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'exit_door' },
          { action: 'interact' },
          { action: 'waitForSceneTransition', timeout: 3000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: null,
          foreshadow: null,
          nextZone: 'C0-Z2',
        },
        branches: [],
      },
    ],
  },

  // ============================================
  // C0-Z2 早餐小店
  // ============================================
  'C0-Z2': {
    zoneId: 'C0-Z2',
    zoneName: '早餐小店',
    description: '早餐小店，无收益选择第一次出现',
    tests: [
      // TC-C0Z2-01a: 菜单板 - 固定套餐
      {
        id: 'TC-C0Z2-01a',
        name: '菜单板交互 - 固定套餐',
        objectId: 'menu_board',
        objectName: '菜单板',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z2' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'menu_board' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
          { action: 'selectChoice', choiceIndex: 0, choiceText: '固定套餐' },
          { action: 'waitForDialogueEnd', timeout: 2000 },
        ],
        expectedResults: {
          cards: [],
          flags: {
            FLAG_C0Z2_ORDER_STANDARD: true,
            FLAG_C0Z2_EATEN: true,
          },
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z2_MENU',
          dialogueChain: ['C0Z2_MENU', 'C0Z2_ORDER_STANDARD'],
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z2-01b: 菜单板 - 今日特别（R+1）
      {
        id: 'TC-C0Z2-01b',
        name: '菜单板交互 - 今日特别（无收益选择）',
        objectId: 'menu_board',
        objectName: '菜单板',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z2' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'menu_board' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
          { action: 'selectChoice', choiceIndex: 1, choiceText: '今日特别' },
          { action: 'waitForDialogueEnd', timeout: 2000 },
        ],
        expectedResults: {
          cards: [],
          flags: {
            FLAG_R_SOURCE_BREAKFAST: true,
            FLAG_C0Z2_EATEN: true,
          },
          rDelta: 1,
          pDelta: 0,
          dialogueId: 'C0Z2_MENU',
          dialogueChain: ['C0Z2_MENU', 'C0Z2_ORDER_SPECIAL'],
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z2-02: 靠窗座位
      {
        id: 'TC-C0Z2-02',
        name: '靠窗座位交互',
        objectId: 'seat_window',
        objectName: '靠窗座位',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z2' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'seat_window' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z2_SEAT_WINDOW',
          dialogueContent: '靠窗的位置，光线充足。适合快速用餐。',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z2-03: 角落座位
      {
        id: 'TC-C0Z2-03',
        name: '角落座位交互',
        objectId: 'seat_corner',
        objectName: '角落座位',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z2' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'seat_corner' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z2_SEAT_CORNER',
          dialogueContent: '角落的位置，旁边有一把空椅子',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z2-04: 栖蓝路过触发
      {
        id: 'TC-C0Z2-04',
        name: '栖蓝路过触发',
        objectId: 'qilan_trigger',
        objectName: '栖蓝路过（触发区域）',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z2' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'qilan_trigger' },
          { action: 'waitForDialogue', timeout: 2000 },
        ],
        expectedResults: {
          cards: [],
          flags: { FLAG_MET_QILAN_C0: true },
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z2_QILAN_PASSBY',
          dialogueContent: '没人坐的椅子，也得擦干净。',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z2-05: 出口跳转
      {
        id: 'TC-C0Z2-05',
        name: '出口跳转到C0-Z3',
        objectId: 'exit_door',
        objectName: '出口',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z2' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'exit_door' },
          { action: 'interact' },
          { action: 'waitForSceneTransition', timeout: 3000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: null,
          foreshadow: null,
          nextZone: 'C0-Z3',
        },
        branches: [],
      },
    ],
  },

  // ============================================
  // C0-Z3 薄墙巷口
  // ============================================
  'C0-Z3': {
    zoneId: 'C0-Z3',
    zoneName: '薄墙巷口',
    description: '两栋建筑之间的狭窄巷道。F01薄墙回声首次出现。',
    tests: [
      // TC-C0Z3-01a: 薄墙交互（普通点击）
      {
        id: 'TC-C0Z3-01a',
        name: '薄墙交互（普通点击）',
        objectId: 'thin_wall',
        objectName: '薄墙',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z3' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'thin_wall' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z3_THIN_WALL',
          dialogueContent: '一面薄墙。表面看起来正常。',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z3-01b: 薄墙交互（长按触发回声）
      {
        id: 'TC-C0Z3-01b',
        name: '薄墙交互（长按1000ms触发回声）',
        objectId: 'thin_wall',
        objectName: '薄墙',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z3' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'thin_wall' },
          { action: 'longPress', duration: 1000 },
          { action: 'waitForDialogue', timeout: 1000 },
          { action: 'waitForDialogueEnd', timeout: 3000 },
        ],
        expectedResults: {
          cards: ['CARD_C0_ALLEY_RECORD'],
          flags: { FLAG_HEARD_WALL_ECHO: true },
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z3_WALL_ECHO',
          dialogueContent: '低频回声在墙内回荡……里面是空的',
          foreshadow: { id: 'F01', action: 'plant' },
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z3-02: 歪斜路标
      {
        id: 'TC-C0Z3-02',
        name: '歪斜路标交互',
        objectId: 'crooked_sign',
        objectName: '歪斜路标',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z3' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'crooked_sign' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'CROOKED_SIGN_EXAMINE',
          dialogueContent: '路标歪了。暂时不能修，不在任务范围内。',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z3-03a: 钉子交互 - 收起来
      {
        id: 'TC-C0Z3-03a',
        name: '钉子交互 - 收起来',
        objectId: 'wall_nail',
        objectName: '钉子',
        preconditions: [{ flag: 'FLAG_HAS_NAIL', value: false }],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z3' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'setFlag', flag: 'FLAG_HAS_NAIL', value: false },
          { action: 'moveToObject', objectId: 'wall_nail' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
          { action: 'selectChoice', choiceIndex: 0, choiceText: '收起来' },
          { action: 'waitForDialogueEnd', timeout: 2000 },
        ],
        expectedResults: {
          cards: ['CARD_C0_NAIL'],
          flags: { FLAG_HAS_NAIL: true },
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z3_NAIL_PICKUP',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z3-03b: 钉子交互 - 不需要
      {
        id: 'TC-C0Z3-03b',
        name: '钉子交互 - 不需要',
        objectId: 'wall_nail',
        objectName: '钉子',
        preconditions: [{ flag: 'FLAG_HAS_NAIL', value: false }],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z3' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'setFlag', flag: 'FLAG_HAS_NAIL', value: false },
          { action: 'moveToObject', objectId: 'wall_nail' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
          { action: 'selectChoice', choiceIndex: 1, choiceText: '不需要' },
          { action: 'waitForDialogueEnd', timeout: 2000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z3_NAIL_PICKUP',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z3-04: 前往维修局
      {
        id: 'TC-C0Z3-04',
        name: '前往维修局（跳转C0-Z4）',
        objectId: 'exit_to_bureau',
        objectName: '前往维修局',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z3' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'exit_to_bureau' },
          { action: 'interact' },
          { action: 'waitForSceneTransition', timeout: 3000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: null,
          foreshadow: null,
          nextZone: 'C0-Z4',
        },
        branches: [],
      },

      // TC-C0Z3-05: 返回早餐店
      {
        id: 'TC-C0Z3-05',
        name: '返回早餐店（跳转C0-Z2）',
        objectId: 'exit_back',
        objectName: '返回早餐店',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z3' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'exit_back' },
          { action: 'interact' },
          { action: 'waitForSceneTransition', timeout: 3000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: null,
          foreshadow: null,
          nextZone: 'C0-Z2',
        },
        branches: [],
      },
    ],
  },

  // ============================================
  // C0-Z4 维修局前台
  // ============================================
  'C0-Z4': {
    zoneId: 'C0-Z4',
    zoneName: '维修局前台',
    description: '堆满旧文件的档案储存室。秩序语法第一次正面登场，顾临首次出场。',
    tests: [
      // TC-C0Z4-01: 前台窗口
      {
        id: 'TC-C0Z4-01',
        name: '前台窗口交互',
        objectId: 'reception_window',
        objectName: '前台窗口',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z4' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'reception_window' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
          { action: 'waitForDialogueEnd', timeout: 3000 },
        ],
        expectedResults: {
          cards: [],
          flags: { FLAG_C0Z4_CHECKED_IN: true },
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z4_RECEPTION',
          dialogueContent: '外勤报到？来领任务单',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z4-02: 任务板
      {
        id: 'TC-C0Z4-02',
        name: '任务板交互',
        objectId: 'task_board',
        objectName: '任务板',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z4' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'task_board' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
          { action: 'waitForDialogueEnd', timeout: 3000 },
        ],
        expectedResults: {
          cards: ['CARD_C0_TASK_SHEET'],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z4_TASKBOARD',
          dialogueContent: '巡检任务单。路线：既定路线A',
          foreshadow: { id: 'F03', action: 'deepen' },
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z4-03a: 顾临办公室 - 明白
      {
        id: 'TC-C0Z4-03a',
        name: '顾临对话 - 明白',
        objectId: 'gulin_door',
        objectName: '顾临办公室',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z4' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'gulin_door' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
          { action: 'selectChoice', choiceIndex: 0, choiceText: '明白' },
          { action: 'waitForDialogueEnd', timeout: 3000 },
        ],
        expectedResults: {
          cards: [],
          flags: {
            FLAG_C0_TASK_RECEIVED: true,
            FLAG_C0_END: true,
          },
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z4_GULIN_TALK',
          dialogueChain: ['C0Z4_GULIN_TALK', 'C0Z4_GULIN_OBEY'],
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z4-03b: 顾临办公室 - 公告板日期不对（需FLAG）
      {
        id: 'TC-C0Z4-03b',
        name: '顾临对话 - 昨晚公告板日期不对',
        objectId: 'gulin_door',
        objectName: '顾临办公室',
        preconditions: [{ flag: 'FLAG_SEEN_NOTICE', value: true }],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z4' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'setFlag', flag: 'FLAG_SEEN_NOTICE', value: true },
          { action: 'moveToObject', objectId: 'gulin_door' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
          {
            action: 'selectChoice',
            choiceIndex: 1,
            choiceText: '昨晚公告板日期不对',
            requiresFlag: 'FLAG_SEEN_NOTICE',
          },
          { action: 'waitForDialogueEnd', timeout: 3000 },
        ],
        expectedResults: {
          cards: [],
          flags: {
            FLAG_C0_TASK_RECEIVED: true,
            FLAG_C0_END: true,
          },
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z4_GULIN_TALK',
          dialogueChain: ['C0Z4_GULIN_TALK', 'C0Z4_GULIN_DATE'],
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z4-03c: 顾临办公室 - 墙里是空的（需FLAG）
      {
        id: 'TC-C0Z4-03c',
        name: '顾临对话 - 我听到墙里是空的',
        objectId: 'gulin_door',
        objectName: '顾临办公室',
        preconditions: [{ flag: 'FLAG_HEARD_WALL_ECHO', value: true }],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z4' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'setFlag', flag: 'FLAG_HEARD_WALL_ECHO', value: true },
          { action: 'moveToObject', objectId: 'gulin_door' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
          {
            action: 'selectChoice',
            choiceIndex: 2,
            choiceText: '我听到墙里是空的',
            requiresFlag: 'FLAG_HEARD_WALL_ECHO',
          },
          { action: 'waitForDialogueEnd', timeout: 3000 },
        ],
        expectedResults: {
          cards: [],
          flags: {
            FLAG_C0_TASK_RECEIVED: true,
            FLAG_C0_END: true,
          },
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'C0Z4_GULIN_TALK',
          dialogueChain: ['C0Z4_GULIN_TALK', 'C0Z4_GULIN_WALL'],
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z4-04: 规章制度
      {
        id: 'TC-C0Z4-04',
        name: '规章制度交互',
        objectId: 'info_board',
        objectName: '规章制度',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z4' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'info_board' },
          { action: 'interact' },
          { action: 'waitForDialogue', timeout: 1000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: 'INFO_BOARD_EXAMINE',
          dialogueContent: '维修局行为准则',
          foreshadow: null,
          nextZone: null,
        },
        branches: [],
      },

      // TC-C0Z4-05: 返回巷口
      {
        id: 'TC-C0Z4-05',
        name: '返回巷口（跳转C0-Z3）',
        objectId: 'exit_back',
        objectName: '返回巷口',
        preconditions: [],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z3' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'moveToObject', objectId: 'exit_back' },
          { action: 'interact' },
          { action: 'waitForSceneTransition', timeout: 3000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: null,
          foreshadow: null,
          nextZone: 'C0-Z3',
        },
        branches: [],
      },

      // TC-C0Z4-06: 出发巡检（需FLAG）
      {
        id: 'TC-C0Z4-06',
        name: '出发巡检（跳转C1-Z1）',
        objectId: 'exit_to_c1',
        objectName: '出发巡检',
        preconditions: [{ flag: 'FLAG_C0_TASK_RECEIVED', value: true }],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z4' },
          { action: 'waitForScene', timeout: 2000 },
          { action: 'setFlag', flag: 'FLAG_C0_TASK_RECEIVED', value: true },
          { action: 'moveToObject', objectId: 'exit_to_c1' },
          { action: 'interact' },
          { action: 'waitForSceneTransition', timeout: 3000 },
        ],
        expectedResults: {
          cards: [],
          flags: {},
          rDelta: 0,
          pDelta: 0,
          dialogueId: null,
          foreshadow: null,
          nextZone: 'C1-Z1',
        },
        branches: [],
      },

      // TC-C0Z4-06-blocked: 出发巡检（无FLAG时被阻止）
      {
        id: 'TC-C0Z4-06-blocked',
        name: '出发巡检（未接任务时阻止）',
        objectId: 'exit_to_c1',
        objectName: '出发巡检',
        preconditions: [{ flag: 'FLAG_C0_TASK_RECEIVED', value: false }],
        steps: [
          { action: 'teleport', zoneId: 'C0-Z4' },
          { action: 'waitForScene', timeout: 2000 },
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
          dialogueId: 'EXIT_BLOCKED',
          dialogueContent: '还没接到任务',
          foreshadow: null,
          nextZone: null, // 不跳转
        },
        branches: [],
      },
    ],
  },
};

// ============================================
// 测试统计信息
// ============================================
const C0_TEST_STATS = {
  totalZones: 4,
  zoneList: ['C0-Z1', 'C0-Z2', 'C0-Z3', 'C0-Z4'],
  totalTestCases: 0,
  totalInteractableObjects: 0,
  totalBranches: 0,
  coverage: {
    cards: [],
    flags: [],
    foreshadows: [],
    rPoints: 0,
  },
};

// 计算统计信息
(function calculateStats() {
  const allCards = new Set();
  const allFlags = new Set();
  const allForeshadows = new Set();
  let totalR = 0;

  for (const [zoneId, zoneData] of Object.entries(C0_TESTS)) {
    C0_TEST_STATS.totalTestCases += zoneData.tests.length;

    // 统计唯一对象
    const uniqueObjects = new Set(zoneData.tests.map((t) => t.objectId));
    C0_TEST_STATS.totalInteractableObjects += uniqueObjects.size;

    for (const test of zoneData.tests) {
      // 统计卡片
      if (test.expectedResults.cards) {
        test.expectedResults.cards.forEach((c) => allCards.add(c));
      }

      // 统计FLAG
      if (test.expectedResults.flags) {
        Object.keys(test.expectedResults.flags).forEach((f) => allFlags.add(f));
      }

      // 统计伏笔
      if (test.expectedResults.foreshadow) {
        allForeshadows.add(test.expectedResults.foreshadow.id);
      }

      // 统计R值
      totalR += test.expectedResults.rDelta || 0;

      // 统计分支
      C0_TEST_STATS.totalBranches += test.branches?.length || 0;
    }
  }

  C0_TEST_STATS.coverage.cards = Array.from(allCards);
  C0_TEST_STATS.coverage.flags = Array.from(allFlags);
  C0_TEST_STATS.coverage.foreshadows = Array.from(allForeshadows);
  C0_TEST_STATS.coverage.rPoints = totalR;
})();

// ============================================
// 测试执行函数
// ============================================

/**
 * 执行单个测试用例
 * @param {object} test 测试用例
 * @param {object} context 测试上下文（包含游戏实例引用）
 * @returns {object} 测试结果
 */
async function executeTest(test, context) {
  const result = {
    id: test.id,
    name: test.name,
    status: 'pending',
    startTime: Date.now(),
    endTime: null,
    errors: [],
    assertions: [],
  };

  try {
    // 检查前置条件
    for (const precondition of test.preconditions) {
      const flagValue = await context.getFlag(precondition.flag);
      if (flagValue !== precondition.value) {
        // 设置前置条件
        await context.setFlag(precondition.flag, precondition.value);
      }
    }

    // 执行测试步骤
    for (const step of test.steps) {
      await executeStep(step, context);
    }

    // 验证结果
    const validationResult = await validateResults(test.expectedResults, context);
    result.assertions = validationResult.assertions;

    if (validationResult.passed) {
      result.status = 'passed';
    } else {
      result.status = 'failed';
      result.errors = validationResult.errors;
    }
  } catch (error) {
    result.status = 'error';
    result.errors.push(error.message);
  }

  result.endTime = Date.now();
  result.duration = result.endTime - result.startTime;
  return result;
}

/**
 * 执行单个测试步骤
 * @param {object} step 步骤定义
 * @param {object} context 测试上下文
 */
async function executeStep(step, context) {
  switch (step.action) {
    case 'teleport':
      await context.teleportToZone(step.zoneId);
      break;

    case 'waitForScene':
      await context.waitForScene(step.timeout);
      break;

    case 'moveToObject':
      await context.moveToObject(step.objectId);
      break;

    case 'interact':
      await context.interact();
      break;

    case 'longPress':
      await context.longPress(step.duration);
      break;

    case 'waitForDialogue':
      await context.waitForDialogue(step.timeout);
      break;

    case 'waitForDialogueEnd':
      await context.waitForDialogueEnd(step.timeout);
      break;

    case 'selectChoice':
      await context.selectChoice(step.choiceIndex, step.choiceText);
      break;

    case 'waitForSceneTransition':
      await context.waitForSceneTransition(step.timeout);
      break;

    case 'setFlag':
      await context.setFlag(step.flag, step.value);
      break;

    default:
      throw new Error(`Unknown action: ${step.action}`);
  }
}

/**
 * 验证测试结果
 * @param {object} expected 期望结果
 * @param {object} context 测试上下文
 * @returns {object} 验证结果
 */
async function validateResults(expected, context) {
  const assertions = [];
  const errors = [];

  // 验证卡片
  if (expected.cards && expected.cards.length > 0) {
    for (const cardId of expected.cards) {
      const hasCard = await context.hasCard(cardId);
      assertions.push({
        type: 'card',
        expected: cardId,
        actual: hasCard,
        passed: hasCard,
      });
      if (!hasCard) {
        errors.push(`Expected card ${cardId} not found`);
      }
    }
  }

  // 验证FLAG
  if (expected.flags && Object.keys(expected.flags).length > 0) {
    for (const [flagName, flagValue] of Object.entries(expected.flags)) {
      const actualValue = await context.getFlag(flagName);
      const passed = actualValue === flagValue;
      assertions.push({
        type: 'flag',
        name: flagName,
        expected: flagValue,
        actual: actualValue,
        passed,
      });
      if (!passed) {
        errors.push(`Flag ${flagName}: expected ${flagValue}, got ${actualValue}`);
      }
    }
  }

  // 验证R值变化
  if (expected.rDelta !== undefined && expected.rDelta !== 0) {
    const rDelta = await context.getRDelta();
    const passed = rDelta === expected.rDelta;
    assertions.push({
      type: 'rDelta',
      expected: expected.rDelta,
      actual: rDelta,
      passed,
    });
    if (!passed) {
      errors.push(`R delta: expected ${expected.rDelta}, got ${rDelta}`);
    }
  }

  // 验证P值变化
  if (expected.pDelta !== undefined && expected.pDelta !== 0) {
    const pDelta = await context.getPDelta();
    const passed = pDelta === expected.pDelta;
    assertions.push({
      type: 'pDelta',
      expected: expected.pDelta,
      actual: pDelta,
      passed,
    });
    if (!passed) {
      errors.push(`P delta: expected ${expected.pDelta}, got ${pDelta}`);
    }
  }

  // 验证对话
  if (expected.dialogueId) {
    const currentDialogue = await context.getCurrentDialogue();
    const passed = currentDialogue === expected.dialogueId;
    assertions.push({
      type: 'dialogue',
      expected: expected.dialogueId,
      actual: currentDialogue,
      passed,
    });
    if (!passed) {
      errors.push(`Dialogue: expected ${expected.dialogueId}, got ${currentDialogue}`);
    }
  }

  // 验证伏笔
  if (expected.foreshadow) {
    const foreshadowState = await context.getForeshadowState(expected.foreshadow.id);
    const passed = foreshadowState === expected.foreshadow.action;
    assertions.push({
      type: 'foreshadow',
      id: expected.foreshadow.id,
      expected: expected.foreshadow.action,
      actual: foreshadowState,
      passed,
    });
    if (!passed) {
      errors.push(
        `Foreshadow ${expected.foreshadow.id}: expected ${expected.foreshadow.action}, got ${foreshadowState}`
      );
    }
  }

  // 验证Zone跳转
  if (expected.nextZone) {
    const currentZone = await context.getCurrentZone();
    const passed = currentZone === expected.nextZone;
    assertions.push({
      type: 'zoneTransition',
      expected: expected.nextZone,
      actual: currentZone,
      passed,
    });
    if (!passed) {
      errors.push(`Zone transition: expected ${expected.nextZone}, got ${currentZone}`);
    }
  }

  return {
    passed: errors.length === 0,
    assertions,
    errors,
  };
}

/**
 * 运行C0全部测试
 * @param {object} context 测试上下文
 * @returns {object} 测试报告
 */
async function runC0Tests(context) {
  const report = {
    chapter: 'C0',
    startTime: Date.now(),
    endTime: null,
    results: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      errors: 0,
    },
  };

  for (const [zoneId, zoneData] of Object.entries(C0_TESTS)) {
    console.log(`\n=== Testing Zone: ${zoneData.zoneName} (${zoneId}) ===`);

    for (const test of zoneData.tests) {
      console.log(`  Running: ${test.name}...`);

      // 重置游戏状态
      await context.resetState();

      const result = await executeTest(test, context);
      report.results.push(result);

      report.summary.total++;
      if (result.status === 'passed') {
        report.summary.passed++;
        console.log(`    ✅ PASSED (${result.duration}ms)`);
      } else if (result.status === 'failed') {
        report.summary.failed++;
        console.log(`    ❌ FAILED: ${result.errors.join(', ')}`);
      } else {
        report.summary.errors++;
        console.log(`    ⚠️ ERROR: ${result.errors.join(', ')}`);
      }
    }
  }

  report.endTime = Date.now();
  report.duration = report.endTime - report.startTime;

  console.log('\n=== C0 Test Summary ===');
  console.log(`Total: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Duration: ${report.duration}ms`);

  return report;
}

/**
 * 按Zone运行测试
 * @param {string} zoneId Zone ID
 * @param {object} context 测试上下文
 * @returns {object} 测试报告
 */
async function runZoneTests(zoneId, context) {
  const zoneData = C0_TESTS[zoneId];
  if (!zoneData) {
    throw new Error(`Zone ${zoneId} not found`);
  }

  const report = {
    zoneId,
    zoneName: zoneData.zoneName,
    startTime: Date.now(),
    endTime: null,
    results: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      errors: 0,
    },
  };

  for (const test of zoneData.tests) {
    await context.resetState();
    const result = await executeTest(test, context);
    report.results.push(result);

    report.summary.total++;
    if (result.status === 'passed') report.summary.passed++;
    else if (result.status === 'failed') report.summary.failed++;
    else report.summary.errors++;
  }

  report.endTime = Date.now();
  report.duration = report.endTime - report.startTime;

  return report;
}

// ============================================
// 导出
// ============================================

// 如果在Node.js环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    C0_TESTS,
    C0_TEST_STATS,
    executeTest,
    runC0Tests,
    runZoneTests,
  };
}

// 如果在浏览器环境
if (typeof window !== 'undefined') {
  window.C0_TESTS = C0_TESTS;
  window.C0_TEST_STATS = C0_TEST_STATS;
  window.runC0Tests = runC0Tests;
  window.runZoneTests = runZoneTests;
}

// ============================================
// 测试统计输出
// ============================================
console.log('=== C0 序章测试脚本加载完成 ===');
console.log(`覆盖 Zone: ${C0_TEST_STATS.zoneList.join(', ')}`);
console.log(`测试用例总数: ${C0_TEST_STATS.totalTestCases}`);
console.log(`覆盖交互对象: ${C0_TEST_STATS.totalInteractableObjects}`);
console.log(`覆盖卡片: ${C0_TEST_STATS.coverage.cards.join(', ')}`);
console.log(`覆盖FLAG: ${C0_TEST_STATS.coverage.flags.join(', ')}`);
console.log(`覆盖伏笔: ${C0_TEST_STATS.coverage.foreshadows.join(', ')}`);
console.log(`R值测试点: ${C0_TEST_STATS.coverage.rPoints}`);
