/**
 * 08-ability.spec.ts
 * 深度能力系统测试
 * 
 * 测试内容：
 * - 深度感知（只看不动）
 * - 深度介入（可改变结构）
 * - 时间干预（回溯节点）
 * - 能力解锁
 * - P 值累积
 */

import { TestConfig, GameScripts } from '../config';
import { GameHelpers } from '../helpers/game-helpers';

const MCP_SERVER = 'user-chrome-devtools';

/**
 * 测试套件：深度能力系统
 */
export const AbilityTests = {
  name: '深度能力系统测试',
  
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
      id: 'ability-001',
      name: '初始应无解锁能力',
      description: '验证新游戏开始时没有解锁任何深度能力',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getAbilityState },
          validate: (state: { unlocked: string[] } | null) => {
            return state !== null && state.unlocked.length === 0;
          },
          description: '验证无解锁能力',
        },
      ],
    },

    {
      id: 'ability-002',
      name: '深度感知应能解锁',
      description: '验证深度感知能力可以解锁',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.unlockAbilityScript('depth_perception') },
          description: '解锁深度感知',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getAbilityState },
          validate: (state: { unlocked: string[] } | null) => {
            return state !== null && state.unlocked.includes('depth_perception');
          },
          description: '验证已解锁',
        },
      ],
    },

    {
      id: 'ability-003',
      name: '深度感知应能激活',
      description: '验证按空格键激活深度感知',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '按空格键',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._abilitySystem) return null;
              return scene._abilitySystem.isActive('depth_perception');
            }`,
          },
          expected: true,
          description: '验证深度感知激活',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/ability-depth-perception.png`,
          },
          description: '截图验证',
        },
      ],
    },

    {
      id: 'ability-004',
      name: '深度感知激活时应禁用移动',
      description: '验证深度感知模式下玩家无法移动',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'pos1',
          description: '记录位置',
        },
        // 尝试移动
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.simulateKeyHoldScript('w', 300) },
          description: '尝试移动',
        },
        {
          action: 'sleep',
          duration: 400,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'pos2',
          description: '获取位置',
        },
        {
          action: 'assert',
          assertion: 'custom',
          validate: (ctx: { pos1: { x: number; y: number }; pos2: { x: number; y: number } }) => {
            return ctx.pos1.x === ctx.pos2.x && ctx.pos1.y === ctx.pos2.y;
          },
          description: '验证位置未变',
        },
      ],
    },

    {
      id: 'ability-005',
      name: '深度感知应能退出',
      description: '验证再次按空格键退出深度感知',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '按空格键退出',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._abilitySystem) return null;
              return scene._abilitySystem.isActive('depth_perception');
            }`,
          },
          expected: false,
          description: '验证深度感知已退出',
        },
      ],
    },

    {
      id: 'ability-006',
      name: '使用能力应增加 P 值',
      description: '验证使用深度能力会增加观察者压力',
      steps: [
        // 获取初始 P 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._worldState) return null;
              return scene._worldState.getP();
            }`,
          },
          saveAs: 'initialP',
          description: '获取初始 P 值',
        },
        // 使用能力
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '激活深度感知',
        },
        {
          action: 'sleep',
          duration: 1000,
          description: '等待一段时间',
        },
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '退出深度感知',
        },
        {
          action: 'sleep',
          duration: 300,
        },
        // 检查 P 值
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._worldState) return null;
              return scene._worldState.getP();
            }`,
          },
          saveAs: 'newP',
          description: '获取新 P 值',
        },
        {
          action: 'assert',
          assertion: 'custom',
          validate: (ctx: { initialP: number; newP: number }) => {
            return ctx.newP > ctx.initialP;
          },
          description: '验证 P 值增加',
        },
      ],
    },

    {
      id: 'ability-007',
      name: '深度介入应能解锁',
      description: '验证深度介入能力可以解锁',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.unlockAbilityScript('depth_intervention') },
          description: '解锁深度介入',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getAbilityState },
          validate: (state: { unlocked: string[] } | null) => {
            return state !== null && state.unlocked.includes('depth_intervention');
          },
          description: '验证已解锁',
        },
      ],
    },

    {
      id: 'ability-008',
      name: '深度介入应显示可交互对象',
      description: '验证深度介入模式高亮显示可修改对象',
      steps: [
        // 先激活深度感知
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '激活深度感知',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        // 切换到深度介入模式
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'e' },
          description: '按 E 切换到深度介入',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._abilitySystem) return null;
              return scene._abilitySystem.isActive('depth_intervention');
            }`,
          },
          expected: true,
          description: '验证深度介入激活',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/ability-depth-intervention.png`,
          },
          description: '截图验证',
        },
        // 退出
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '退出深度模式',
        },
      ],
    },

    {
      id: 'ability-009',
      name: '深度介入应留下伤痕',
      description: '验证深度介入操作会留下伤痕记录',
      steps: [
        // 获取伤痕数量
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return 0;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._worldState) return 0;
              return scene._worldState.getScars().length;
            }`,
          },
          saveAs: 'initialScars',
          description: '记录初始伤痕数',
        },
        // 模拟深度介入操作
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._abilitySystem) return false;
              
              // 模拟介入操作
              scene._abilitySystem.performIntervention({
                type: 'modify',
                target: 'test_object',
                change: 'test_change',
              });
              return true;
            }`,
          },
          description: '执行介入操作',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        // 检查伤痕
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return 0;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._worldState) return 0;
              return scene._worldState.getScars().length;
            }`,
          },
          saveAs: 'newScars',
          description: '获取伤痕数',
        },
        {
          action: 'assert',
          assertion: 'custom',
          validate: (ctx: { initialScars: number; newScars: number }) => {
            return ctx.newScars > ctx.initialScars;
          },
          description: '验证伤痕增加',
        },
      ],
    },

    {
      id: 'ability-010',
      name: '时间干预应能解锁',
      description: '验证时间干预能力可以解锁',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.unlockAbilityScript('time_intervention') },
          description: '解锁时间干预',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getAbilityState },
          validate: (state: { unlocked: string[] } | null) => {
            return state !== null && state.unlocked.includes('time_intervention');
          },
          description: '验证已解锁',
        },
      ],
    },

    {
      id: 'ability-011',
      name: '时间干预应显示回溯节点',
      description: '验证时间干预模式显示可回溯的节点',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '激活深度模式',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 't' },
          description: '按 T 切换到时间干预',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._abilitySystem) return null;
              return scene._abilitySystem.isActive('time_intervention');
            }`,
          },
          expected: true,
          description: '验证时间干预激活',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/ability-time-intervention.png`,
          },
          description: '截图验证',
        },
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '退出',
        },
      ],
    },

    {
      id: 'ability-012',
      name: '能力 UI 应正确显示',
      description: '验证能力状态 UI 正确显示解锁的能力',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._abilitySystem) return null;
              return {
                unlocked: scene._abilitySystem.getUnlockedAbilities(),
                activeUI: scene._abilitySystem.isUIVisible(),
              };
            }`,
          },
          validate: (data: { unlocked: string[]; activeUI: boolean } | null) => {
            return data !== null && data.unlocked.length === 3;
          },
          description: '验证能力 UI 状态',
        },
      ],
    },
  ],
};

export default AbilityTests;
