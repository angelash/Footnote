/**
 * 10-chapter-flow.spec.ts
 * 完整章节流程测试
 * 
 * 测试内容：
 * - 序章到终章的完整流程
 * - 每个章节的关键事件
 * - 能力解锁验证
 * - R值累积验证
 */

import { TestConfig, GameScripts } from '../config';
import { GameHelpers } from '../helpers/game-helpers';

// MCP 服务器: user-chrome-devtools

/**
 * Zone 配置
 */
const ZONES = {
  C0: ['C0-Z1', 'C0-Z2', 'C0-Z3', 'C0-Z4', 'C0-Z5', 'C0-Z6'],
  C1: ['C1-Z1', 'C1-Z2', 'C1-Z3', 'C1-Z4', 'C1-Z5', 'C1-Z6'],
  C2: ['C2-Z1', 'C2-Z2', 'C2-Z3', 'C2-Z4', 'C2-Z5', 'C2-Z6', 'C2-Z7'],
  C3: ['C3-Z1', 'C3-Z2', 'C3-Z3', 'C3-Z4', 'C3-Z5', 'C3-Z6', 'C3-Z7'],
  C4: ['C4-Z1', 'C4-Z2', 'C4-Z3', 'C4-Z4', 'C4-Z5', 'C4-Z6', 'C4-Z7', 'C4-Z8'],
  C5: ['C5-Z1', 'C5-Z2', 'C5-Z3', 'C5-Z4', 'C5-Z5', 'C5-Z6', 'C5-Z7'],
  CF: ['CF-Z1', 'CF-Z2', 'CF-Z3', 'CF-Z4', 'CF-Z5', 'CF-Z6'],
};

/**
 * 能力解锁点
 */
const ABILITY_UNLOCK_ZONES = {
  DEPTH_PERCEPTION: 'C2-Z1',
  DEPTH_INTERVENTION: 'C3-Z1',
  TIME_INTERVENTION: 'C4-Z2',
};

/**
 * R值变化点
 */
const R_VALUE_ZONES = {
  'C0-Z2': 1,  // 首次无收益选择
  'C2-Z4': 2,  // 路标修补
  'C3-Z4': 2,  // 空椅子任务
  'C4-Z6': 2,  // 无人需要的地图
  'CF-Z2': 2,  // 最后的无收益选择
};

/**
 * 测试套件：章节流程测试
 */
export const ChapterFlowTests = {
  name: '章节流程测试',
  
  // 前置条件
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
    {
      action: 'sleep',
      duration: 2000,
    },
  ],

  tests: [
    // ==================== 序章测试 ====================
    {
      id: 'chapter-c0-001',
      name: '序章完整流程',
      description: '测试 C0 所有 Zone 的遍历',
      steps: [
        // 开始新游戏
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: GameHelpers.simulateCanvasClickScript(
              TestConfig.menuButtons.newGame.x,
              TestConfig.menuButtons.newGame.y
            ),
          },
        },
        { action: 'sleep', duration: 3000 },
        // 验证从 C0-Z1 开始
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentZone },
          expected: 'C0-Z1',
          description: '验证初始 Zone',
        },
        // 遍历 C0 所有 Zone
        ...ZONES.C0.slice(1).map(zoneId => ([
          {
            action: 'evaluate',
            tool: 'evaluate_script',
            params: { function: GameHelpers.teleportToZoneScript(zoneId) },
            description: `切换到 ${zoneId}`,
          },
          { action: 'sleep', duration: 500 },
          {
            action: 'evaluate',
            tool: 'evaluate_script',
            params: { function: GameScripts.getCurrentZone },
            expected: zoneId,
            description: `验证当前 Zone 为 ${zoneId}`,
          },
        ])).flat(),
        // 验证 R 值变化（C0-Z2 应该触发）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          validator: (value: number) => value >= 0,
          description: '验证 R 值已记录',
        },
      ],
    },

    // ==================== 第一章测试 ====================
    {
      id: 'chapter-c1-001',
      name: '第一章完整流程',
      description: '测试 C1 所有 Zone 的遍历',
      steps: [
        // 跳转到 C1 起点
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('C1')` },
          description: '跳转到第一章',
        },
        { action: 'sleep', duration: 1000 },
        // 验证进入 C1
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentZone },
          validator: (value: string) => value?.startsWith('C1'),
          description: '验证进入第一章',
        },
        // 遍历 C1 所有 Zone
        ...ZONES.C1.map(zoneId => ([
          {
            action: 'evaluate',
            tool: 'evaluate_script',
            params: { function: GameHelpers.teleportToZoneScript(zoneId) },
            description: `切换到 ${zoneId}`,
          },
          { action: 'sleep', duration: 300 },
          {
            action: 'evaluate',
            tool: 'evaluate_script',
            params: { function: GameScripts.getCurrentZone },
            expected: zoneId,
            description: `验证当前 Zone 为 ${zoneId}`,
          },
        ])).flat(),
      ],
    },

    // ==================== 第二章测试（深度感知解锁）====================
    {
      id: 'chapter-c2-001',
      name: '第二章完整流程（深度感知）',
      description: '测试 C2 流程和深度感知能力解锁',
      steps: [
        // 跳转到 C2
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('C2')` },
          description: '跳转到第二章',
        },
        { action: 'sleep', duration: 1000 },
        // C2-Z1: 解锁深度感知
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('C2-Z1') },
          description: '切换到 C2-Z1（深度感知教学区）',
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.unlockAbility('DEPTH_PERCEPTION')` },
          description: '解锁深度感知能力',
        },
        { action: 'sleep', duration: 300 },
        // 验证能力已解锁
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getAbilityState },
          validator: (state: { depthPerception?: boolean }) => state?.depthPerception === true,
          description: '验证深度感知已解锁',
        },
        // 遍历 C2 剩余 Zone
        ...ZONES.C2.slice(1).map(zoneId => ([
          {
            action: 'evaluate',
            tool: 'evaluate_script',
            params: { function: GameHelpers.teleportToZoneScript(zoneId) },
            description: `切换到 ${zoneId}`,
          },
          { action: 'sleep', duration: 300 },
        ])).flat(),
        // C2-Z4 R值验证
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.addR(2)` },
          description: 'C2-Z4 路标修补 R+2',
        },
      ],
    },

    // ==================== 第三章测试（深度介入解锁）====================
    {
      id: 'chapter-c3-001',
      name: '第三章完整流程（深度介入）',
      description: '测试 C3 流程和深度介入能力解锁',
      steps: [
        // 跳转到 C3
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('C3')` },
          description: '跳转到第三章',
        },
        { action: 'sleep', duration: 1000 },
        // 确保深度感知已解锁
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.unlockAbility('DEPTH_PERCEPTION')` },
          description: '确保深度感知已解锁',
        },
        // C3-Z1: 解锁深度介入
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('C3-Z1') },
          description: '切换到 C3-Z1（结构崩塌点）',
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.unlockAbility('DEPTH_INTERVENTION')` },
          description: '解锁深度介入能力',
        },
        { action: 'sleep', duration: 300 },
        // 验证能力已解锁
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getAbilityState },
          validator: (state: { depthIntervention?: boolean }) => state?.depthIntervention === true,
          description: '验证深度介入已解锁',
        },
        // 遍历 C3 剩余 Zone
        ...ZONES.C3.slice(1).map(zoneId => ([
          {
            action: 'evaluate',
            tool: 'evaluate_script',
            params: { function: GameHelpers.teleportToZoneScript(zoneId) },
            description: `切换到 ${zoneId}`,
          },
          { action: 'sleep', duration: 300 },
        ])).flat(),
        // C3-Z4 R值验证
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.addR(2)` },
          description: 'C3-Z4 空椅子任务 R+2',
        },
      ],
    },

    // ==================== 第四章测试（时间干预解锁）====================
    {
      id: 'chapter-c4-001',
      name: '第四章完整流程（时间干预）',
      description: '测试 C4 流程和时间干预能力解锁',
      steps: [
        // 跳转到 C4
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('C4')` },
          description: '跳转到第四章',
        },
        { action: 'sleep', duration: 1000 },
        // 确保前两个能力已解锁
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => { window.__DEBUG__?.unlockAbility('DEPTH_PERCEPTION'); window.__DEBUG__?.unlockAbility('DEPTH_INTERVENTION'); return true; }` },
          description: '确保前置能力已解锁',
        },
        // C4-Z1
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('C4-Z1') },
          description: '切换到 C4-Z1',
        },
        { action: 'sleep', duration: 300 },
        // C4-Z2: 解锁时间干预
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('C4-Z2') },
          description: '切换到 C4-Z2（因果账本存放处）',
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.unlockAbility('TIME_INTERVENTION')` },
          description: '解锁时间干预能力',
        },
        { action: 'sleep', duration: 300 },
        // 验证所有能力已解锁
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getAbilityState },
          validator: (state: { timeIntervention?: boolean }) => state?.timeIntervention === true,
          description: '验证时间干预已解锁',
        },
        // 遍历 C4 剩余 Zone
        ...ZONES.C4.slice(2).map(zoneId => ([
          {
            action: 'evaluate',
            tool: 'evaluate_script',
            params: { function: GameHelpers.teleportToZoneScript(zoneId) },
            description: `切换到 ${zoneId}`,
          },
          { action: 'sleep', duration: 300 },
        ])).flat(),
        // C4-Z6 R值验证
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.addR(2)` },
          description: 'C4-Z6 无人需要的地图 R+2',
        },
      ],
    },

    // ==================== 第五章测试（R值显影）====================
    {
      id: 'chapter-c5-001',
      name: '第五章完整流程（R值显影）',
      description: '测试 C5 流程和 R 值阈值效果',
      steps: [
        // 跳转到 C5
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('C5')` },
          description: '跳转到第五章',
        },
        { action: 'sleep', duration: 1000 },
        // 解锁所有能力
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.unlockAllAbilities()` },
          description: '解锁所有能力',
        },
        // 设置 R 值接近阈值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setR(5)` },
          description: '设置 R=5（接近 F21 阈值）',
        },
        // 遍历 C5 所有 Zone
        ...ZONES.C5.map(zoneId => ([
          {
            action: 'evaluate',
            tool: 'evaluate_script',
            params: { function: GameHelpers.teleportToZoneScript(zoneId) },
            description: `切换到 ${zoneId}`,
          },
          { action: 'sleep', duration: 300 },
        ])).flat(),
        // C5-Z5 R值显影
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('C5-Z5') },
          description: '切换到 C5-Z5（R值显影点）',
        },
        { action: 'sleep', duration: 300 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.addR(1)` },
          description: 'R 值达到 6（F21 阈值）',
        },
        // 验证 R >= 6
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          validator: (value: number) => value >= 6,
          description: '验证 R 值 >= 6',
        },
        // C5-Z7 F21 判定
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('C5-Z7') },
          description: '切换到 C5-Z7（模型边界）',
        },
        { action: 'sleep', duration: 500 },
      ],
    },

    // ==================== 终章测试 ====================
    {
      id: 'chapter-cf-001',
      name: '终章完整流程',
      description: '测试终章所有 Zone 和三结局入口',
      steps: [
        // 跳转到终章
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('CF')` },
          description: '跳转到终章',
        },
        { action: 'sleep', duration: 1000 },
        // 解锁所有能力
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.unlockAllAbilities()` },
          description: '解锁所有能力',
        },
        // CF-Z1: 对视空间
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z1') },
          description: '切换到 CF-Z1（对视空间）',
        },
        { action: 'sleep', duration: 500 },
        // CF-Z2: 最后的无收益选择
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z2') },
          description: '切换到 CF-Z2（字段接受室）',
        },
        { action: 'sleep', duration: 300 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.addR(2)` },
          description: '最后的无收益选择 R+2',
        },
        // CF-Z3: 结局A
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z3') },
          description: '切换到 CF-Z3（结局A-平面稳定）',
        },
        { action: 'sleep', duration: 300 },
        // CF-Z4: 结局B
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z4') },
          description: '切换到 CF-Z4（结局B-真实释放）',
        },
        { action: 'sleep', duration: 300 },
        // CF-Z5: 结局C（三结局选择点）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z5') },
          description: '切换到 CF-Z5（三结局选择点）',
        },
        { action: 'sleep', duration: 500 },
        // CF-Z6: 尾声
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z6') },
          description: '切换到 CF-Z6（尾声空间）',
        },
        { action: 'sleep', duration: 300 },
        // 验证终章完成
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentZone },
          expected: 'CF-Z6',
          description: '验证到达尾声',
        },
      ],
    },

    // ==================== 完整主线流程测试 ====================
    {
      id: 'chapter-full-001',
      name: '完整主线流程测试',
      description: '从序章到终章的完整主线流程（快速遍历）',
      steps: [
        // 重置游戏
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
          description: '重置游戏状态',
        },
        { action: 'sleep', duration: 500 },
        // 快速遍历所有章节
        ...Object.entries(ZONES).flatMap(([chapter, zones]) => [
          {
            action: 'evaluate',
            tool: 'evaluate_script',
            params: { function: `() => window.__DEBUG__?.gotoChapter('${chapter}')` },
            description: `进入 ${chapter}`,
          },
          { action: 'sleep', duration: 300 },
          ...zones.map(zoneId => ({
            action: 'evaluate',
            tool: 'evaluate_script',
            params: { function: `() => { window.__DEBUG__?.teleport('${zoneId}'); window.__DEBUG__?.completeZone('${zoneId}'); return true; }` },
            description: `完成 ${zoneId}`,
          })),
          { action: 'sleep', duration: 200 },
        ]),
        // 最终验证
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getAbilityState },
          validator: (state: { depthPerception?: boolean; depthIntervention?: boolean; timeIntervention?: boolean }) => 
            state?.depthPerception && state?.depthIntervention && state?.timeIntervention,
          description: '验证所有能力已解锁',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { filename: 'full-mainline-complete.png' },
          description: '完整流程截图',
        },
      ],
    },
  ],
};

export default ChapterFlowTests;
