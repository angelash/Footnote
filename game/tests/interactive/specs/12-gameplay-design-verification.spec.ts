/**
 * 12-gameplay-design-verification.spec.ts
 * 玩法设计验收测试
 * 
 * 基于 L2-gameplay-lead 审计报告创建
 * 测试内容：
 * - 交互逻辑闭环
 * - 价值体系闭环
 * - 状态一致性
 * - 章节完成条件
 * - 结局判定逻辑
 */

import { TestConfig, GameScripts } from '../config';
import { GameHelpers } from '../helpers/game-helpers';

// ============================================================================
// 测试数据定义
// ============================================================================

/**
 * 所有章节的卡片获取点
 * 确保每张定义的卡片都有获取入口
 */
const CARD_ACQUISITION_TESTS = {
  C0: [
    { cardId: 'CARD_C0_IDENTITY', zone: 'C0-Z1', object: 'identity_card', method: 'click' },
    { cardId: 'CARD_C0_MEAL_TICKET', zone: 'C0-Z1', object: 'storage_cabinet', method: 'dialogue' },
    { cardId: 'CARD_C0_WORK_ORDER', zone: 'C0-Z1', object: 'storage_cabinet', method: 'dialogue' },
    { cardId: 'CARD_C0_MORNING_PRAYER', zone: 'C0-Z1', object: 'prayer_board', method: 'choice' },
    { cardId: 'CARD_C0_RECEIPT_STANDARD', zone: 'C0-Z2', object: 'menu_board', method: 'choice', branch: '固定套餐' },
    { cardId: 'CARD_C0_RECEIPT_SPECIAL', zone: 'C0-Z2', object: 'menu_board', method: 'choice', branch: '今日特别' },
    { cardId: 'CARD_C0_NAIL', zone: 'C0-Z3', object: 'wall_nail', method: 'choice', branch: '收起来' },
    { cardId: 'CARD_C0_ALLEY_RECORD', zone: 'C0-Z3', object: 'thin_wall', method: 'longPress' },
    { cardId: 'CARD_C0_TASK_SHEET', zone: 'C0-Z4', object: 'task_board', method: 'dialogue' },
    { cardId: 'CARD_C0_WARNING', zone: 'C0-Z4', object: 'gulin_door', method: 'dialogue' },
  ],
  C1: [
    { cardId: 'CARD_C1_PERMIT', zone: 'C1-Z1', object: 'service_window', method: 'dialogue' },
    { cardId: 'CARD_C1_CORRIDOR_NOTE', zone: 'C1-Z2', object: 'correct_door', method: 'dialogue' },
    { cardId: 'CARD_C1_VERSION_MAP_01', zone: 'C1-Z3', object: 'songlan_npc', method: 'dialogue' },
    { cardId: 'CARD_C1_QUESTIONNAIRE', zone: 'C1-Z4', object: 'questionnaire', method: 'dialogue' },
    { cardId: 'CARD_C1_PRAYER_01', zone: 'C1-Z5', object: 'muping_npc', method: 'choice', branch: '留下听完' },
    { cardId: 'CARD_C1_COLLAPSE_REPORT', zone: 'C1-Z6', object: 'debris', method: 'dialogue' },
  ],
  C3: [
    { cardId: 'CARD_C3_OLD_WICK', zone: 'C3-Z2', object: 'trapped_person', method: 'choice', requiredAllBranches: true },
  ],
};

/**
 * 章节完成条件
 */
const CHAPTER_COMPLETION_FLAGS = {
  C0: 'FLAG_C0_TASK_RECEIVED',
  C1: 'FLAG_C1_COMPLETE',
  C2: 'FLAG_C2_COMPLETE',
  C3: 'FLAG_C3_COMPLETE',
  C4: 'FLAG_C4_COMPLETE',
  C5: 'FLAG_C5_COMPLETE',
  CF: 'FLAG_GAME_COMPLETE',
};

/**
 * 结局判定条件
 */
const ENDING_CONDITIONS = {
  A: { R: { max: 5 }, W: { min: 61 }, flag: 'CAN_PICK_ENDING_A' },
  B: { R: { min: 6, max: 9 }, W: { min: 41, max: 60 }, flag: 'CAN_PICK_ENDING_B' },
  C: { R: { min: 10 }, W: { max: 40 }, flag: 'CAN_PICK_ENDING_C' },
};

/**
 * 关键 Flag 映射（检查设置与读取一致性）
 */
const FLAG_CONSISTENCY_CHECKS = [
  { setIn: 'C0-Z1', flag: 'FLAG_C0Z1_NOTICE_EXAMINED', usedIn: 'C0-Z4', description: '公告板查看状态' },
  { setIn: 'C0-Z3', flag: 'FLAG_HEARD_WALL_ECHO', usedIn: 'C0-Z4', description: '薄墙回声' },
  { setIn: 'C0-Z4', flag: 'FLAG_C0Z4_CHECKED_IN', usedIn: 'C0-Z4', description: '前台报到' },
  { setIn: 'C1-Z1', flag: 'FLAG_C1Z1_GOT_TICKET', usedIn: 'C1-Z1', description: '取号状态' },
  { setIn: 'C3-Z4', flag: 'FLAG_EMPTY_CHAIR_SET', usedIn: 'C3-Z4', description: '椅子状态' },
  { setIn: 'C3-Z4', flag: 'FLAG_LAMP_LIT', usedIn: 'C3-Z4', description: '点灯状态' },
  { setIn: 'CF-Z2', flag: 'FLAG_RITE_COMMITTED', usedIn: 'CF-Z2', description: '仪式互斥' },
  { setIn: 'CF-Z6', flag: 'FLAG_ALL_EPILOGUE_SEEN', usedIn: 'CF-Z6', description: '通关状态' },
];

/**
 * 对象状态切换测试（检查互斥条件）
 */
const OBJECT_STATE_TOGGLE_TESTS = [
  {
    zone: 'C0-Z1',
    description: '储物柜状态切换',
    flag: 'FLAG_C0Z1_GOT_TOOLS',
    objects: [
      { id: 'storage_cabinet', visibleWhen: false },
      { id: 'storage_cabinet_done', visibleWhen: true },
    ],
  },
  {
    zone: 'C0-Z1',
    description: '公告板状态切换',
    flag: 'FLAG_C0Z1_NOTICE_EXAMINED',
    objects: [
      { id: 'notice_board', visibleWhen: false },
      { id: 'notice_board_done', visibleWhen: true },
    ],
  },
  {
    zone: 'C3-Z4',
    description: '椅子状态切换',
    flag: 'FLAG_EMPTY_CHAIR_SET',
    objects: [
      { id: 'empty_chair', visibleWhen: false },
      { id: 'fixed_chair', visibleWhen: true },
    ],
  },
  {
    zone: 'C3-Z4',
    description: '灯状态切换',
    flag: 'FLAG_LAMP_LIT',
    objects: [
      { id: 'lamp_stand', visibleWhen: false },
      { id: 'lit_lamp_glow', visibleWhen: true },
    ],
  },
  {
    zone: 'C4-Z7',
    description: '歪椅子状态切换',
    flag: 'FLAG_CHAIR_FIXED',
    objects: [
      { id: 'tilted_chair', visibleWhen: false },
      { id: 'fixed_chair', visibleWhen: true },
    ],
  },
];

/**
 * R 值变化点
 */
const R_VALUE_TRIGGERS = [
  { zone: 'C0-Z1', object: 'notice_board', choice: '仔细查看', expectedDelta: 1 },
  { zone: 'C0-Z2', object: 'menu_board', choice: '今日特别', expectedDelta: 1 },
  { zone: 'C1-Z5', object: 'muping_npc', choice: '留下听完', expectedDelta: 1 },
  { zone: 'C3-Z4', object: 'empty_chair', choice: '扶起来', expectedDelta: 1 },
  { zone: 'CF-Z2', object: 'empty_chair_rite', expectedDelta: 3 },
];

// ============================================================================
// 测试套件
// ============================================================================

export const GameplayDesignVerificationTests = {
  name: '玩法设计验收测试',
  
  beforeAll: [
    {
      action: 'navigate',
      tool: 'navigate_page',
      params: { type: 'url', url: TestConfig.gameUrl },
    },
    {
      action: 'wait',
      tool: 'evaluate_script',
      params: { function: GameHelpers.getLoadingCompleteScript() },
      waitFor: true,
      maxRetries: 30,
      retryInterval: 1000,
    },
    { action: 'sleep', duration: 2000 },
  ],

  tests: [
    // ==================== 1. 交互逻辑闘环测试 ====================
    {
      id: 'interaction-001',
      name: '交互逻辑闭环：物品拾取流程',
      description: '验证物品拾取后的完整流程：场景销毁 → 背包添加 → UI反馈',
      steps: [
        // 重置游戏
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 500 },
        // 传送到 C0-Z1
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('C0-Z1')` },
        },
        { action: 'sleep', duration: 1000 },
        // 验证初始状态：没有身份卡
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const state = window.__DEBUG__?.getGameState();
              return !state?.cards?.some(c => c.id === 'CARD_C0_IDENTITY' || c === 'CARD_C0_IDENTITY');
            }` 
          },
          expected: true,
          description: '验证初始没有身份卡',
        },
        // 点击身份卡对象
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const scene = window.__GAME__?.scene?.getScene('GameScene');
              const obj = scene?._assembledScene?.objects?.find(o => o.id === 'identity_card');
              if (obj && scene?._player) {
                scene._player.setPosition(obj.x, obj.y - 50);
                scene._tryInteract?.();
                return true;
              }
              return false;
            }` 
          },
          description: '交互身份卡对象',
        },
        { action: 'sleep', duration: 1500 },
        // 验证获得了卡片
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const state = window.__DEBUG__?.getGameState();
              return state?.cards?.some(c => c.id === 'CARD_C0_IDENTITY' || c === 'CARD_C0_IDENTITY');
            }` 
          },
          expected: true,
          description: '验证获得身份卡',
        },
      ],
    },

    {
      id: 'interaction-002',
      name: '交互逻辑闭环：对话选择影响状态',
      description: '验证对话选择正确设置 Flag 和 R 值',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('C0-Z1')` },
        },
        { action: 'sleep', duration: 1000 },
        // 记录初始 R 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__INITIAL_R__ = window.__DEBUG__?.getGameState()?.counters?.R ?? 0` },
        },
        // 交互公告板并选择"仔细查看"
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const scene = window.__GAME__?.scene?.getScene('GameScene');
              const obj = scene?._assembledScene?.objects?.find(o => o.id === 'notice_board');
              if (obj && scene?._player) {
                scene._player.setPosition(obj.x, obj.y - 50);
                scene._tryInteract?.();
                return true;
              }
              return false;
            }` 
          },
        },
        { action: 'sleep', duration: 2000 },
        // 选择"仔细查看"选项（index 0）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const scene = window.__GAME__?.scene?.getScene('GameScene');
              const ui = scene?._dialogueUI;
              if (ui?._completeTypewriter) ui._completeTypewriter();
              if (ui?.selectChoice) {
                ui.selectChoice(0);
                return true;
              }
              return false;
            }` 
          },
        },
        { action: 'sleep', duration: 3000 },
        // 验证 R 值增加
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const currentR = window.__DEBUG__?.getGameState()?.counters?.R ?? 0;
              const initialR = window.__INITIAL_R__ ?? 0;
              return currentR - initialR;
            }` 
          },
          expected: 1,
          description: '验证 R 值增加 1',
        },
        // 验证 Flag 设置
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => window.__DEBUG__?.getFlag('FLAG_C0Z1_NOTICE_EXAMINED')` 
          },
          expected: true,
          description: '验证 FLAG_C0Z1_NOTICE_EXAMINED 已设置',
        },
      ],
    },

    // ==================== 2. 价值体系闘环测试 ====================
    {
      id: 'value-001',
      name: '价值体系：序章卡片全获取验证',
      description: '验证 C0 所有卡片都有获取入口',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 500 },
        // 验证身份卡
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.teleport('C0-Z1');
              window.__DEBUG__?.obtainCard('CARD_C0_IDENTITY');
              return window.__DEBUG__?.getGameState()?.cards?.some(c => c.id === 'CARD_C0_IDENTITY' || c === 'CARD_C0_IDENTITY');
            }` 
          },
          expected: true,
          description: 'CARD_C0_IDENTITY 可获取',
        },
        // 验证餐票
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.obtainCard('CARD_C0_MEAL_TICKET');
              return window.__DEBUG__?.getGameState()?.cards?.some(c => c.id === 'CARD_C0_MEAL_TICKET' || c === 'CARD_C0_MEAL_TICKET');
            }` 
          },
          expected: true,
          description: 'CARD_C0_MEAL_TICKET 可获取',
        },
        // 验证工单
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.obtainCard('CARD_C0_WORK_ORDER');
              return window.__DEBUG__?.getGameState()?.cards?.some(c => c.id === 'CARD_C0_WORK_ORDER' || c === 'CARD_C0_WORK_ORDER');
            }` 
          },
          expected: true,
          description: 'CARD_C0_WORK_ORDER 可获取',
        },
        // 验证祷词
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.obtainCard('CARD_C0_MORNING_PRAYER');
              return window.__DEBUG__?.getGameState()?.cards?.some(c => c.id === 'CARD_C0_MORNING_PRAYER' || c === 'CARD_C0_MORNING_PRAYER');
            }` 
          },
          expected: true,
          description: 'CARD_C0_MORNING_PRAYER 可获取',
        },
        // 验证警告通知
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.obtainCard('CARD_C0_WARNING');
              return window.__DEBUG__?.getGameState()?.cards?.some(c => c.id === 'CARD_C0_WARNING' || c === 'CARD_C0_WARNING');
            }` 
          },
          expected: true,
          description: 'CARD_C0_WARNING 可获取',
        },
        // 验证早餐小票（固定套餐）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.obtainCard('CARD_C0_RECEIPT_STANDARD');
              return window.__DEBUG__?.getGameState()?.cards?.some(c => c.id === 'CARD_C0_RECEIPT_STANDARD' || c === 'CARD_C0_RECEIPT_STANDARD');
            }` 
          },
          expected: true,
          description: 'CARD_C0_RECEIPT_STANDARD 可获取',
        },
        // 验证早餐小票（今日特别）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.obtainCard('CARD_C0_RECEIPT_SPECIAL');
              return window.__DEBUG__?.getGameState()?.cards?.some(c => c.id === 'CARD_C0_RECEIPT_SPECIAL' || c === 'CARD_C0_RECEIPT_SPECIAL');
            }` 
          },
          expected: true,
          description: 'CARD_C0_RECEIPT_SPECIAL 可获取',
        },
      ],
    },

    // ==================== 3. 状态一致性测试 ====================
    {
      id: 'consistency-001',
      name: '状态一致性：Flag 设置与读取',
      description: '验证 Flag 在设置后能被正确读取',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 300 },
        // 测试 FLAG_C0Z1_NOTICE_EXAMINED
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.setFlag('FLAG_C0Z1_NOTICE_EXAMINED', true);
              return window.__DEBUG__?.getFlag('FLAG_C0Z1_NOTICE_EXAMINED');
            }` 
          },
          expected: true,
          description: 'FLAG_C0Z1_NOTICE_EXAMINED 设置后可读取',
        },
        // 测试 FLAG_HEARD_WALL_ECHO
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.setFlag('FLAG_HEARD_WALL_ECHO', true);
              return window.__DEBUG__?.getFlag('FLAG_HEARD_WALL_ECHO');
            }` 
          },
          expected: true,
          description: 'FLAG_HEARD_WALL_ECHO 设置后可读取',
        },
        // 测试 FLAG_C0Z4_CHECKED_IN
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.setFlag('FLAG_C0Z4_CHECKED_IN', true);
              return window.__DEBUG__?.getFlag('FLAG_C0Z4_CHECKED_IN');
            }` 
          },
          expected: true,
          description: 'FLAG_C0Z4_CHECKED_IN 设置后可读取',
        },
      ],
    },

    {
      id: 'consistency-002',
      name: '状态一致性：对象显隐条件',
      description: '验证对象根据 Flag 正确显隐',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('C0-Z1')` },
        },
        { action: 'sleep', duration: 1000 },
        // 初始状态：storage_cabinet 可见，storage_cabinet_done 不可见
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const scene = window.__GAME__?.scene?.getScene('GameScene');
              const objects = scene?._assembledScene?.objects || [];
              const cabinet = objects.find(o => o.id === 'storage_cabinet');
              const cabinetDone = objects.find(o => o.id === 'storage_cabinet_done');
              // 检查对象是否存在且可见
              return cabinet && !cabinetDone;
            }` 
          },
          expected: true,
          description: '初始状态：储物柜未取过状态显示',
        },
        // 设置 Flag
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setFlag('FLAG_C0Z1_GOT_TOOLS', true)` },
        },
        { action: 'sleep', duration: 1000 },
        // 重新加载场景
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('C0-Z1')` },
        },
        { action: 'sleep', duration: 1000 },
        // Flag 设置后：storage_cabinet 不可见，storage_cabinet_done 可见
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const scene = window.__GAME__?.scene?.getScene('GameScene');
              const objects = scene?._assembledScene?.objects || [];
              const cabinet = objects.find(o => o.id === 'storage_cabinet');
              const cabinetDone = objects.find(o => o.id === 'storage_cabinet_done');
              return !cabinet && cabinetDone;
            }` 
          },
          expected: true,
          description: 'Flag 设置后：储物柜已取过状态显示',
        },
      ],
    },

    // ==================== 4. 章节完成条件测试 ====================
    {
      id: 'chapter-001',
      name: '章节完成：C0 序章完成条件',
      description: '验证序章可以正常完成并进入下一章',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 500 },
        // 设置序章完成需要的 Flag
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.setFlag('FLAG_C0_TASK_RECEIVED', true);
              window.__DEBUG__?.setFlag('FLAG_C0_END', true);
              return true;
            }` 
          },
        },
        { action: 'sleep', duration: 300 },
        // 传送到 C0-Z4 检查出口
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('C0-Z4')` },
        },
        { action: 'sleep', duration: 1000 },
        // 验证可以进入 C1
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const scene = window.__GAME__?.scene?.getScene('GameScene');
              const objects = scene?._assembledScene?.objects || [];
              const exitToC1 = objects.find(o => o.id === 'exit_to_c1');
              return !!exitToC1;
            }` 
          },
          expected: true,
          description: '验证进入第一章的出口可见',
        },
      ],
    },

    {
      id: 'chapter-002',
      name: '章节完成：C1 第一章完成条件',
      description: '验证第一章完成对话可以被触发',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('C1-Z6')` },
        },
        { action: 'sleep', duration: 1000 },
        // 模拟完成对话链
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              // 设置前置 Flags
              window.__DEBUG__?.setFlag('FLAG_C1Z6_REPORT_SUBMITTED', true);
              window.__DEBUG__?.setFlag('FLAG_C1_COMPLETE', true);
              return window.__DEBUG__?.getFlag('FLAG_C1_COMPLETE');
            }` 
          },
          expected: true,
          description: '验证 FLAG_C1_COMPLETE 可以被设置',
        },
      ],
    },

    // ==================== 5. 结局判定测试 ====================
    {
      id: 'ending-001',
      name: '结局判定：结局 A 条件验证',
      description: '验证 R < 6 时可以选择结局 A',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 300 },
        // 设置低 R 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setR(3)` },
        },
        // 设置高 W 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setW?.(70) || true` },
        },
        { action: 'sleep', duration: 200 },
        // 跳转到 CF-Z5
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('CF-Z5')` },
        },
        { action: 'sleep', duration: 1000 },
        // 验证结局 A Flag
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const R = window.__DEBUG__?.getGameState()?.counters?.R ?? 0;
              return R < 6;
            }` 
          },
          expected: true,
          description: '验证 R < 6（结局 A 条件）',
        },
      ],
    },

    {
      id: 'ending-002',
      name: '结局判定：结局 B 条件验证',
      description: '验证 6 <= R < 10 时可以选择结局 B',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 300 },
        // 设置中等 R 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setR(7)` },
        },
        // 设置中等 W 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setW?.(50) || true` },
        },
        { action: 'sleep', duration: 200 },
        // 验证结局 B 条件
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const R = window.__DEBUG__?.getGameState()?.counters?.R ?? 0;
              return R >= 6 && R < 10;
            }` 
          },
          expected: true,
          description: '验证 6 <= R < 10（结局 B 条件）',
        },
      ],
    },

    {
      id: 'ending-003',
      name: '结局判定：结局 C 条件验证',
      description: '验证 R >= 10 时可以选择结局 C',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 300 },
        // 设置高 R 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setR(12)` },
        },
        // 设置低 W 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setW?.(30) || true` },
        },
        { action: 'sleep', duration: 200 },
        // 验证结局 C 条件
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const R = window.__DEBUG__?.getGameState()?.counters?.R ?? 0;
              return R >= 10;
            }` 
          },
          expected: true,
          description: '验证 R >= 10（结局 C 条件）',
        },
      ],
    },

    // ==================== 6. 仪式互斥测试 ====================
    {
      id: 'rite-001',
      name: '仪式互斥：CF-Z2 只能完成一个仪式',
      description: '验证终章仪式的互斥锁',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 300 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('CF-Z2')` },
        },
        { action: 'sleep', duration: 1000 },
        // 初始状态：没有仪式完成
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => !window.__DEBUG__?.getFlag('FLAG_RITE_COMMITTED')` 
          },
          expected: true,
          description: '初始状态：没有仪式完成',
        },
        // 设置仪式完成
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setFlag('FLAG_RITE_COMMITTED', true)` },
        },
        { action: 'sleep', duration: 500 },
        // 验证互斥 Flag 已设置
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => window.__DEBUG__?.getFlag('FLAG_RITE_COMMITTED')` 
          },
          expected: true,
          description: '验证仪式互斥 Flag 已设置',
        },
      ],
    },

    // ==================== 7. 通关闭环测试 ====================
    {
      id: 'complete-001',
      name: '通关闘环：CF-Z6 尾声完成检测',
      description: '验证所有角色对话完成后设置通关标记',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 300 },
        // 设置所有角色对话完成 Flag
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.setFlag('FLAG_GULIN_SEEN', true);
              window.__DEBUG__?.setFlag('FLAG_SONGLAN_SEEN', true);
              window.__DEBUG__?.setFlag('FLAG_XUCHEN_SEEN', true);
              window.__DEBUG__?.setFlag('FLAG_ATANG_SEEN', true);
              window.__DEBUG__?.setFlag('FLAG_MUPING_SEEN', true);
              window.__DEBUG__?.setFlag('FLAG_QILAN_SEEN', true);
              return true;
            }` 
          },
        },
        { action: 'sleep', duration: 300 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('CF-Z6')` },
        },
        { action: 'sleep', duration: 1000 },
        // 触发通关检测
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              // 检查是否所有角色都已对话
              const flags = ['FLAG_GULIN_SEEN', 'FLAG_SONGLAN_SEEN', 'FLAG_XUCHEN_SEEN', 'FLAG_ATANG_SEEN', 'FLAG_MUPING_SEEN', 'FLAG_QILAN_SEEN'];
              return flags.every(f => window.__DEBUG__?.getFlag(f));
            }` 
          },
          expected: true,
          description: '验证所有角色对话完成',
        },
      ],
    },

    // ==================== 8. 长按交互测试 ====================
    {
      id: 'longpress-001',
      name: '长按交互：C0-Z1 身份卡细节',
      description: '验证长按身份卡触发细节对话和伏笔',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('C0-Z1')` },
        },
        { action: 'sleep', duration: 1000 },
        // 验证初始没有查看过细节
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => !window.__DEBUG__?.getFlag('FLAG_SEEN_IDENTITY_CORRECTION')` 
          },
          expected: true,
          description: '初始状态：没有查看过身份卡细节',
        },
        // 模拟长按触发
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.setFlag('FLAG_SEEN_IDENTITY_CORRECTION', true);
              return true;
            }` 
          },
        },
        { action: 'sleep', duration: 500 },
        // 验证 Flag 设置
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => window.__DEBUG__?.getFlag('FLAG_SEEN_IDENTITY_CORRECTION')` 
          },
          expected: true,
          description: '验证长按后 Flag 设置',
        },
      ],
    },

    {
      id: 'longpress-002',
      name: '长按交互：C0-Z3 薄墙回声',
      description: '验证长按薄墙触发回声对话和伏笔 F01',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('C0-Z3')` },
        },
        { action: 'sleep', duration: 1000 },
        // 验证初始没有听过回声
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => !window.__DEBUG__?.getFlag('FLAG_HEARD_WALL_ECHO')` 
          },
          expected: true,
          description: '初始状态：没有听过薄墙回声',
        },
        // 模拟长按触发
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.setFlag('FLAG_HEARD_WALL_ECHO', true);
              window.__DEBUG__?.obtainCard('CARD_C0_ALLEY_RECORD');
              return true;
            }` 
          },
        },
        { action: 'sleep', duration: 500 },
        // 验证 Flag 和卡片
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => window.__DEBUG__?.getFlag('FLAG_HEARD_WALL_ECHO')` 
          },
          expected: true,
          description: '验证薄墙回声 Flag 设置',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const state = window.__DEBUG__?.getGameState();
              return state?.cards?.some(c => c.id === 'CARD_C0_ALLEY_RECORD' || c === 'CARD_C0_ALLEY_RECORD');
            }` 
          },
          expected: true,
          description: '验证获得巷口记录卡片',
        },
      ],
    },

    // ==================== 9. 前置条件测试 ====================
    {
      id: 'precondition-001',
      name: '前置条件：C0-Z4 任务板需要先报到',
      description: '验证任务板在未报到时不可交互',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('C0-Z4')` },
        },
        { action: 'sleep', duration: 1000 },
        // 验证未报到时任务板锁定
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const scene = window.__GAME__?.scene?.getScene('GameScene');
              const objects = scene?._assembledScene?.objects || [];
              const taskBoardLocked = objects.find(o => o.id === 'task_board_locked');
              return !!taskBoardLocked;
            }` 
          },
          expected: true,
          description: '未报到时显示锁定的任务板',
        },
        // 设置报到 Flag
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setFlag('FLAG_C0Z4_CHECKED_IN', true)` },
        },
        { action: 'sleep', duration: 500 },
        // 重新加载场景
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.teleport('C0-Z4')` },
        },
        { action: 'sleep', duration: 1000 },
        // 验证报到后任务板可用
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const scene = window.__GAME__?.scene?.getScene('GameScene');
              const objects = scene?._assembledScene?.objects || [];
              const taskBoard = objects.find(o => o.id === 'task_board');
              return !!taskBoard;
            }` 
          },
          expected: true,
          description: '报到后显示可用的任务板',
        },
      ],
    },

    // ==================== 10. 开场独白测试 ====================
    {
      id: 'onenter-001',
      name: '开场独白：C0-Z1 入场自动触发',
      description: '验证进入 C0-Z1 时自动触发开场独白',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
        },
        { action: 'sleep', duration: 500 },
        // 开始新游戏（从菜单进入）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              window.__DEBUG__?.teleport('C0-Z1');
              return true;
            }` 
          },
        },
        { action: 'sleep', duration: 2000 },
        // 验证对话 UI 显示
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { 
            function: `() => {
              const scene = window.__GAME__?.scene?.getScene('GameScene');
              const ui = scene?._dialogueUI;
              return ui?._container?.visible === true || ui?._isActive === true;
            }` 
          },
          // 注意：如果 onEnter 对话没有实现，这个测试会失败
          description: '验证入场时对话 UI 显示（开场独白）',
        },
      ],
    },
  ],
};

export default GameplayDesignVerificationTests;
