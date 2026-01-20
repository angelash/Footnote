/**
 * 11-endings.spec.ts
 * 三结局完整测试
 * 
 * 测试内容：
 * - 结局 A: 平面稳定（R < 6, W > 60）
 * - 结局 B: 真实释放（R >= 6, 40 < W <= 60）
 * - 结局 C: 成为系统（R >= 10, W <= 40）
 * - 结局选择 UI
 * - 结局动画和演出
 */

import { TestConfig, GameScripts } from '../config';
import { GameHelpers } from '../helpers/game-helpers';

// MCP 服务器: user-chrome-devtools

/**
 * 结局条件配置
 */
const ENDING_CONDITIONS = {
  A: { R: { max: 5 }, W: { min: 61 }, description: '平面稳定 - 继续收敛' },
  B: { R: { min: 6, max: 9 }, W: { min: 41, max: 60 }, description: '真实释放 - 释放表示' },
  C: { R: { min: 10 }, W: { max: 40 }, description: '成为系统 - 承载字段' },
};

/**
 * 结局 Zone 映射
 */
const ENDING_ZONES = {
  A: 'CF-Z3',
  B: 'CF-Z4',
  C: 'CF-Z5',
};

/**
 * 测试套件：结局测试
 */
export const EndingTests = {
  name: '结局测试',
  
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
    {
      action: 'sleep',
      duration: 3000,
    },
  ],

  tests: [
    // ==================== 结局 A 测试 ====================
    {
      id: 'ending-a-001',
      name: '结局A条件验证',
      description: '验证结局A的触发条件（R < 6）',
      steps: [
        // 重置并设置条件
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
          description: '重置游戏状态',
        },
        { action: 'sleep', duration: 500 },
        // 设置结局 A 条件
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setupEnding('A')` },
          description: '设置结局 A 条件',
        },
        { action: 'sleep', duration: 300 },
        // 验证 R 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          validator: (value: number) => value < 6,
          description: '验证 R < 6',
        },
        // 解锁所有能力
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.unlockAllAbilities()` },
          description: '解锁所有能力',
        },
        // 跳转到终章
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('CF')` },
          description: '跳转到终章',
        },
        { action: 'sleep', duration: 1000 },
        // 进入结局选择点
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z5') },
          description: '进入结局选择点',
        },
        { action: 'sleep', duration: 500 },
        // 截图
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { filename: 'ending-a-selection.png' },
          description: '结局 A 选择界面截图',
        },
        // 进入结局 A
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z3') },
          description: '进入结局 A Zone',
        },
        { action: 'sleep', duration: 500 },
        // 设置结局 FLAG
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setFlag('FLAG_ENDING_A', true)` },
          description: '设置结局 A FLAG',
        },
        // 截图
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { filename: 'ending-a-complete.png' },
          description: '结局 A 完成截图',
        },
      ],
    },

    // ==================== 结局 B 测试 ====================
    {
      id: 'ending-b-001',
      name: '结局B条件验证',
      description: '验证结局B的触发条件（R >= 6）',
      steps: [
        // 重置并设置条件
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
          description: '重置游戏状态',
        },
        { action: 'sleep', duration: 500 },
        // 设置结局 B 条件
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setupEnding('B')` },
          description: '设置结局 B 条件',
        },
        { action: 'sleep', duration: 300 },
        // 验证 R 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          validator: (value: number) => value >= 5 && value < 10,
          description: '验证 5 <= R < 10',
        },
        // 解锁所有能力
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.unlockAllAbilities()` },
          description: '解锁所有能力',
        },
        // 跳转到终章
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('CF')` },
          description: '跳转到终章',
        },
        { action: 'sleep', duration: 1000 },
        // 进入结局选择点
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z5') },
          description: '进入结局选择点',
        },
        { action: 'sleep', duration: 500 },
        // 截图
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { filename: 'ending-b-selection.png' },
          description: '结局 B 选择界面截图',
        },
        // 进入结局 B
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z4') },
          description: '进入结局 B Zone',
        },
        { action: 'sleep', duration: 500 },
        // 设置结局 FLAG
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setFlag('FLAG_ENDING_B', true)` },
          description: '设置结局 B FLAG',
        },
        // 截图
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { filename: 'ending-b-complete.png' },
          description: '结局 B 完成截图',
        },
      ],
    },

    // ==================== 结局 C 测试 ====================
    {
      id: 'ending-c-001',
      name: '结局C条件验证',
      description: '验证结局C的触发条件（R >= 10）',
      steps: [
        // 重置并设置条件
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
          description: '重置游戏状态',
        },
        { action: 'sleep', duration: 500 },
        // 设置结局 C 条件
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setupEnding('C')` },
          description: '设置结局 C 条件',
        },
        { action: 'sleep', duration: 300 },
        // 验证 R 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          validator: (value: number) => value >= 10,
          description: '验证 R >= 10',
        },
        // 解锁所有能力
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.unlockAllAbilities()` },
          description: '解锁所有能力',
        },
        // 跳转到终章
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('CF')` },
          description: '跳转到终章',
        },
        { action: 'sleep', duration: 1000 },
        // 进入结局选择点
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z5') },
          description: '进入结局选择点',
        },
        { action: 'sleep', duration: 500 },
        // 截图
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { filename: 'ending-c-selection.png' },
          description: '结局 C 选择界面截图',
        },
        // 结局 C 就在 CF-Z5
        // 设置结局 FLAG
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setFlag('FLAG_ENDING_C', true)` },
          description: '设置结局 C FLAG',
        },
        // 截图
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { filename: 'ending-c-complete.png' },
          description: '结局 C 完成截图',
        },
      ],
    },

    // ==================== R 值阈值边界测试 ====================
    {
      id: 'ending-threshold-001',
      name: 'R值阈值边界测试',
      description: '测试 R 值在各阈值边界的行为',
      steps: [
        // 重置
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
          description: '重置游戏状态',
        },
        { action: 'sleep', duration: 300 },
        // R = 0（初始状态）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          expected: 0,
          description: '验证初始 R = 0',
        },
        // R = 3（系统停顿阈值）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setR(3)` },
          description: '设置 R = 3',
        },
        { action: 'sleep', duration: 200 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          expected: 3,
          description: '验证 R = 3（系统停顿阈值）',
        },
        // R = 6（F21 弱版阈值）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setR(6)` },
          description: '设置 R = 6',
        },
        { action: 'sleep', duration: 200 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          expected: 6,
          description: '验证 R = 6（F21 弱版阈值）',
        },
        // R = 10（模型改写阈值）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setR(10)` },
          description: '设置 R = 10',
        },
        { action: 'sleep', duration: 200 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          expected: 10,
          description: '验证 R = 10（模型改写阈值）',
        },
      ],
    },

    // ==================== 结局路线完整流程测试 ====================
    {
      id: 'ending-full-a-001',
      name: '结局A完整流程',
      description: '从头走结局A路线（保持低R值）',
      steps: [
        // 重置
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
          description: '重置游戏状态',
        },
        { action: 'sleep', duration: 500 },
        // 快速推进（不触发无收益行为）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('CF')` },
          description: '直接跳转终章',
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.unlockAllAbilities()` },
          description: '解锁所有能力',
        },
        // 保持低 R 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setR(2)` },
          description: '保持低 R 值',
        },
        // 进入终章流程
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z1') },
          description: 'CF-Z1',
        },
        { action: 'sleep', duration: 200 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z2') },
          description: 'CF-Z2',
        },
        { action: 'sleep', duration: 200 },
        // 不增加 R 值（跳过无收益选择）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z5') },
          description: '结局选择点',
        },
        { action: 'sleep', duration: 300 },
        // 验证只能选择结局 A
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          validator: (value: number) => value < 6,
          description: '验证 R < 6（只能选择结局 A）',
        },
        // 进入结局 A
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z3') },
          description: '进入结局 A',
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { filename: 'ending-a-full-route.png' },
          description: '结局 A 完整路线截图',
        },
      ],
    },

    {
      id: 'ending-full-b-001',
      name: '结局B完整流程',
      description: '从头走结局B路线（积累中等R值）',
      steps: [
        // 重置
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
          description: '重置游戏状态',
        },
        { action: 'sleep', duration: 500 },
        // 设置中等 R 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setR(6)` },
          description: '设置中等 R 值',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setP(25)` },
          description: '设置 P 值',
        },
        // 跳转终章
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('CF')` },
          description: '跳转终章',
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.unlockAllAbilities()` },
          description: '解锁所有能力',
        },
        // 进入终章流程
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z1') },
          description: 'CF-Z1',
        },
        { action: 'sleep', duration: 200 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z2') },
          description: 'CF-Z2',
        },
        { action: 'sleep', duration: 200 },
        // 增加 R 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.addR(1)` },
          description: '无收益选择 R+1',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z5') },
          description: '结局选择点',
        },
        { action: 'sleep', duration: 300 },
        // 验证可以选择结局 B
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          validator: (value: number) => value >= 6 && value < 10,
          description: '验证 6 <= R < 10（可以选择结局 B）',
        },
        // 进入结局 B
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z4') },
          description: '进入结局 B',
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { filename: 'ending-b-full-route.png' },
          description: '结局 B 完整路线截图',
        },
      ],
    },

    {
      id: 'ending-full-c-001',
      name: '结局C完整流程',
      description: '从头走结局C路线（高R值模型改写）',
      steps: [
        // 重置
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
          description: '重置游戏状态',
        },
        { action: 'sleep', duration: 500 },
        // 设置高 R 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setR(10)` },
          description: '设置高 R 值',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setP(18)` },
          description: '设置 P 值',
        },
        // 跳转终章
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('CF')` },
          description: '跳转终章',
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.unlockAllAbilities()` },
          description: '解锁所有能力',
        },
        // 进入终章流程
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z1') },
          description: 'CF-Z1',
        },
        { action: 'sleep', duration: 200 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z2') },
          description: 'CF-Z2',
        },
        { action: 'sleep', duration: 200 },
        // 增加 R 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.addR(2)` },
          description: '无收益选择 R+2',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z5') },
          description: '结局选择点',
        },
        { action: 'sleep', duration: 300 },
        // 验证可以选择结局 C
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          validator: (value: number) => value >= 10,
          description: '验证 R >= 10（可以选择结局 C）',
        },
        // 结局 C 就在 CF-Z5
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setFlag('FLAG_ENDING_C', true)` },
          description: '选择结局 C',
        },
        { action: 'sleep', duration: 500 },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { filename: 'ending-c-full-route.png' },
          description: '结局 C 完整路线截图',
        },
      ],
    },

    // ==================== 尾声重访测试 ====================
    {
      id: 'ending-epilogue-001',
      name: '尾声重访测试',
      description: '测试结局后的尾声空间（CF-Z6）',
      steps: [
        // 设置结局完成状态
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.reset()` },
          description: '重置游戏状态',
        },
        { action: 'sleep', duration: 300 },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.gotoChapter('CF')` },
          description: '跳转终章',
        },
        { action: 'sleep', duration: 500 },
        // 设置结局 FLAG（假设已完成结局 A）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: `() => window.__DEBUG__?.setFlag('FLAG_ENDING_A', true)` },
          description: '设置结局 A 完成',
        },
        // 进入尾声
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('CF-Z6') },
          description: '进入尾声空间',
        },
        { action: 'sleep', duration: 500 },
        // 验证在尾声
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentZone },
          expected: 'CF-Z6',
          description: '验证在尾声空间',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: { filename: 'epilogue-space.png' },
          description: '尾声空间截图',
        },
      ],
    },
  ],
};

export default EndingTests;
