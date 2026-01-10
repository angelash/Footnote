/**
 * 06-narrative.spec.ts
 * 叙事系统测试
 * 
 * 测试内容：
 * - Zone 加载
 * - Zone 切换
 * - 事件触发
 * - R 值变化
 * - 伏笔系统
 */

import { TestConfig, GameScripts } from '../config';
import { GameHelpers } from '../helpers/game-helpers';

// MCP 服务器: user-chrome-devtools (供参考)

/**
 * 测试套件：叙事系统
 */
export const NarrativeTests = {
  name: '叙事系统测试',
  
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
    {
      id: 'narrative-001',
      name: '新游戏应从 C0-Z1 开始',
      description: '验证新游戏从序章第一个 Zone 开始',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentZone },
          expected: 'C0-Z1',
          description: '验证当前 Zone',
        },
      ],
    },

    {
      id: 'narrative-002',
      name: '初始 R 值应为 0',
      description: '验证新游戏 R 值从 0 开始',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          expected: 0,
          description: '验证 R 值为 0',
        },
      ],
    },

    {
      id: 'narrative-003',
      name: 'Zone 切换应正确触发',
      description: '验证移动到边界时能切换 Zone',
      steps: [
        // 记录初始 Zone
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentZone },
          saveAs: 'initialZone',
          description: '记录初始 Zone',
        },
        // 使用调试命令切换 Zone
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('C0-Z2') },
          description: '切换到 C0-Z2',
        },
        {
          action: 'sleep',
          duration: 1000,
          description: '等待切换',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentZone },
          expected: 'C0-Z2',
          description: '验证切换成功',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/narrative-zone-c0z2.png`,
          },
          description: '截图验证',
        },
      ],
    },

    {
      id: 'narrative-004',
      name: '无收益选择应增加 R 值',
      description: '验证选择无收益选项时 R 值增加',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          saveAs: 'initialR',
          description: '记录初始 R 值',
        },
        // 触发一个带无收益选项的对话
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._narrativeEngine) return false;
              
              // 模拟无收益选择
              scene._narrativeEngine.recordChoice({
                choiceId: 'test_no_reward',
                reward: 0,
              });
              return true;
            }`,
          },
          description: '记录无收益选择',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          saveAs: 'newR',
          description: '获取新 R 值',
        },
        {
          action: 'assert',
          assertion: 'RIncreased',
          params: { before: '$initialR', after: '$newR' },
          description: '验证 R 值增加',
        },
      ],
    },

    {
      id: 'narrative-005',
      name: 'R>=3 应触发系统语气变化',
      description: '验证 R 值达到阈值时系统有响应',
      steps: [
        // 设置 R 值到 3
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.setRValueScript(3) },
          description: '设置 R=3',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._narrativeEngine) return null;
              return scene._narrativeEngine.getSystemTone();
            }`,
          },
          validate: (tone: string | null) => {
            // R>=3 时语气应该有变化
            return tone !== null && tone !== 'normal';
          },
          description: '验证系统语气变化',
        },
      ],
    },

    {
      id: 'narrative-006',
      name: '事件触发应正确执行',
      description: '验证 Zone 事件能正确触发',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._narrativeEngine) return false;
              
              // 触发测试事件
              const result = scene._narrativeEngine.triggerEvent('test_event');
              return result;
            }`,
          },
          description: '触发测试事件',
        },
      ],
    },

    {
      id: 'narrative-007',
      name: '伏笔投放应记录',
      description: '验证伏笔投放被正确记录',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._narrativeEngine) return false;
              
              // 投放伏笔 F01
              scene._narrativeEngine.dropForeshadow('F01');
              return true;
            }`,
          },
          description: '投放伏笔 F01',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return [];
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._narrativeEngine) return [];
              return scene._narrativeEngine.getDroppedForeshadows();
            }`,
          },
          validate: (foreshadows: string[]) => foreshadows.includes('F01'),
          description: '验证伏笔被记录',
        },
      ],
    },

    {
      id: 'narrative-008',
      name: '世界状态应正确保存',
      description: '验证世界状态快照正确',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getWorldState },
          validate: (state: Record<string, unknown> | null) => {
            return (
              state !== null &&
              'currentZone' in state &&
              'r' in state &&
              'visitedZones' in state
            );
          },
          description: '验证世界状态结构',
        },
      ],
    },

    {
      id: 'narrative-009',
      name: '已访问 Zone 应记录',
      description: '验证访问过的 Zone 被记录',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return [];
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._worldState) return [];
              return scene._worldState.getVisitedZones();
            }`,
          },
          validate: (zones: string[]) => zones.length > 0,
          description: '验证有已访问 Zone',
        },
      ],
    },

    {
      id: 'narrative-010',
      name: 'Zone 重返应显示变体',
      description: '验证重返已访问 Zone 时显示变体',
      steps: [
        // 切换到另一个 Zone
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('C0-Z3') },
          description: '前往 C0-Z3',
        },
        {
          action: 'sleep',
          duration: 1000,
          description: '等待',
        },
        // 返回 C0-Z1
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('C0-Z1') },
          description: '返回 C0-Z1',
        },
        {
          action: 'sleep',
          duration: 1000,
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._narrativeEngine) return null;
              return scene._narrativeEngine.isRevisit();
            }`,
          },
          expected: true,
          description: '验证识别为重返',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/narrative-revisit.png`,
          },
          description: '截图验证',
        },
      ],
    },

    {
      id: 'narrative-011',
      name: 'Flag 应正确设置和读取',
      description: '验证叙事 Flag 系统正常工作',
      steps: [
        // 设置 flag
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._worldState) return false;
              scene._worldState.setFlag('test_flag', true);
              return true;
            }`,
          },
          description: '设置测试 flag',
        },
        // 读取 flag
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._worldState) return null;
              return scene._worldState.getFlag('test_flag');
            }`,
          },
          expected: true,
          description: '验证 flag 值',
        },
      ],
    },

    {
      id: 'narrative-012',
      name: '条件分支应正确判断',
      description: '验证基于条件的叙事分支正确执行',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._narrativeEngine) return null;
              
              // 测试条件判断
              return scene._narrativeEngine.evaluateCondition({
                type: 'flag',
                flag: 'test_flag',
                value: true,
              });
            }`,
          },
          expected: true,
          description: '验证条件判断正确',
        },
      ],
    },
  ],
};

export default NarrativeTests;
