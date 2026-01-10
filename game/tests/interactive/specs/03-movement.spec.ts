/**
 * 03-movement.spec.ts
 * 移动控制测试
 * 
 * 测试内容：
 * - WASD 键移动
 * - 方向键移动
 * - 斜向移动
 * - 移动速度
 * - 碰撞检测
 * - 移动边界
 */

import { TestConfig, GameScripts } from '../config';
import { GameHelpers, PlayerPosition } from '../helpers/game-helpers';

const MCP_SERVER = 'user-chrome-devtools';

/**
 * 测试套件：移动控制
 */
export const MovementTests = {
  name: '移动控制测试',
  
  // 前置条件：进入游戏场景
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
    // 点击新游戏进入 GameScene
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
      id: 'move-001',
      name: '应在 GameScene',
      description: '验证已进入游戏场景',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'GameScene',
          description: '验证当前场景',
        },
      ],
    },

    {
      id: 'move-002',
      name: 'W 键应使玩家向上移动',
      description: '验证按 W 键玩家 Y 坐标减小',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'initialPos',
          description: '获取初始位置',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: GameHelpers.simulateKeyHoldScript('w', 500),
          },
          description: '按住 W 键 500ms',
        },
        {
          action: 'sleep',
          duration: 600,
          description: '等待移动完成',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'newPos',
          description: '获取新位置',
        },
        {
          action: 'assert',
          assertion: 'movedUp',
          params: { before: '$initialPos', after: '$newPos' },
          description: '验证向上移动',
        },
      ],
    },

    {
      id: 'move-003',
      name: 'S 键应使玩家向下移动',
      description: '验证按 S 键玩家 Y 坐标增大',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'initialPos',
          description: '获取初始位置',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: GameHelpers.simulateKeyHoldScript('s', 500),
          },
          description: '按住 S 键 500ms',
        },
        {
          action: 'sleep',
          duration: 600,
          description: '等待移动完成',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'newPos',
          description: '获取新位置',
        },
        {
          action: 'assert',
          assertion: 'movedDown',
          params: { before: '$initialPos', after: '$newPos' },
          description: '验证向下移动',
        },
      ],
    },

    {
      id: 'move-004',
      name: 'A 键应使玩家向左移动',
      description: '验证按 A 键玩家 X 坐标减小',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'initialPos',
          description: '获取初始位置',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: GameHelpers.simulateKeyHoldScript('a', 500),
          },
          description: '按住 A 键 500ms',
        },
        {
          action: 'sleep',
          duration: 600,
          description: '等待移动完成',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'newPos',
          description: '获取新位置',
        },
        {
          action: 'assert',
          assertion: 'movedLeft',
          params: { before: '$initialPos', after: '$newPos' },
          description: '验证向左移动',
        },
      ],
    },

    {
      id: 'move-005',
      name: 'D 键应使玩家向右移动',
      description: '验证按 D 键玩家 X 坐标增大',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'initialPos',
          description: '获取初始位置',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: GameHelpers.simulateKeyHoldScript('d', 500),
          },
          description: '按住 D 键 500ms',
        },
        {
          action: 'sleep',
          duration: 600,
          description: '等待移动完成',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'newPos',
          description: '获取新位置',
        },
        {
          action: 'assert',
          assertion: 'movedRight',
          params: { before: '$initialPos', after: '$newPos' },
          description: '验证向右移动',
        },
      ],
    },

    {
      id: 'move-006',
      name: '方向键应与 WASD 功能相同（上）',
      description: '验证上方向键等同于 W 键',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'initialPos',
          description: '获取初始位置',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `async () => {
              const canvas = document.querySelector('${TestConfig.canvas.selector}');
              if (!canvas) return false;
              
              const keyDown = new KeyboardEvent('keydown', {
                key: 'ArrowUp',
                code: 'ArrowUp',
                bubbles: true,
              });
              const keyUp = new KeyboardEvent('keyup', {
                key: 'ArrowUp',
                code: 'ArrowUp',
                bubbles: true,
              });
              
              canvas.dispatchEvent(keyDown);
              await new Promise(r => setTimeout(r, 500));
              canvas.dispatchEvent(keyUp);
              return true;
            }`,
          },
          description: '按住上方向键',
        },
        {
          action: 'sleep',
          duration: 600,
          description: '等待移动完成',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'newPos',
          description: '获取新位置',
        },
        {
          action: 'assert',
          assertion: 'movedUp',
          params: { before: '$initialPos', after: '$newPos' },
          description: '验证向上移动',
        },
      ],
    },

    {
      id: 'move-007',
      name: 'W+D 应斜向右上移动',
      description: '验证同时按 W 和 D 斜向移动',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'initialPos',
          description: '获取初始位置',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `async () => {
              const canvas = document.querySelector('${TestConfig.canvas.selector}');
              if (!canvas) return false;
              
              const wDown = new KeyboardEvent('keydown', { key: 'w', code: 'KeyW', bubbles: true });
              const dDown = new KeyboardEvent('keydown', { key: 'd', code: 'KeyD', bubbles: true });
              const wUp = new KeyboardEvent('keyup', { key: 'w', code: 'KeyW', bubbles: true });
              const dUp = new KeyboardEvent('keyup', { key: 'd', code: 'KeyD', bubbles: true });
              
              canvas.dispatchEvent(wDown);
              canvas.dispatchEvent(dDown);
              await new Promise(r => setTimeout(r, 500));
              canvas.dispatchEvent(wUp);
              canvas.dispatchEvent(dUp);
              return true;
            }`,
          },
          description: '同时按 W+D',
        },
        {
          action: 'sleep',
          duration: 600,
          description: '等待移动完成',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'newPos',
          description: '获取新位置',
        },
        {
          action: 'assert',
          assertion: 'custom',
          validate: (ctx: { initialPos: PlayerPosition; newPos: PlayerPosition }) => {
            return ctx.newPos.x > ctx.initialPos.x && ctx.newPos.y < ctx.initialPos.y;
          },
          description: '验证向右上移动',
        },
      ],
    },

    {
      id: 'move-008',
      name: '不按键时应静止',
      description: '验证不输入时玩家保持静止',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'pos1',
          description: '获取位置1',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待一段时间',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'pos2',
          description: '获取位置2',
        },
        {
          action: 'assert',
          assertion: 'custom',
          validate: (ctx: { pos1: PlayerPosition; pos2: PlayerPosition }) => {
            const tolerance = 1;
            return (
              Math.abs(ctx.pos1.x - ctx.pos2.x) < tolerance &&
              Math.abs(ctx.pos1.y - ctx.pos2.y) < tolerance
            );
          },
          description: '验证位置未变',
        },
      ],
    },

    {
      id: 'move-009',
      name: '移动速度应一致',
      description: '验证水平和垂直移动速度相同',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'startPos',
          description: '记录起始位置',
        },
        // 向右移动
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.simulateKeyHoldScript('d', 300) },
          description: '向右移动 300ms',
        },
        {
          action: 'sleep',
          duration: 400,
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'afterRight',
          description: '记录向右后位置',
        },
        // 回到起点（向左）
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.simulateKeyHoldScript('a', 300) },
          description: '向左移动 300ms',
        },
        {
          action: 'sleep',
          duration: 400,
          description: '等待',
        },
        // 向上移动
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.simulateKeyHoldScript('w', 300) },
          description: '向上移动 300ms',
        },
        {
          action: 'sleep',
          duration: 400,
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'afterUp',
          description: '记录向上后位置',
        },
        {
          action: 'assert',
          assertion: 'custom',
          validate: (ctx: { startPos: PlayerPosition; afterRight: PlayerPosition; afterUp: PlayerPosition }) => {
            const rightDist = Math.abs(ctx.afterRight.x - ctx.startPos.x);
            const upDist = Math.abs(ctx.afterUp.y - ctx.startPos.y);
            const tolerance = 20; // 允许一定误差
            return Math.abs(rightDist - upDist) < tolerance;
          },
          description: '验证水平和垂直速度相近',
        },
      ],
    },

    {
      id: 'move-010',
      name: '截图验证移动',
      description: '截图记录移动前后状态',
      steps: [
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/movement-before.png`,
          },
          description: '移动前截图',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.simulateKeyHoldScript('d', 1000) },
          description: '向右移动 1 秒',
        },
        {
          action: 'sleep',
          duration: 1100,
          description: '等待移动完成',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/movement-after.png`,
          },
          description: '移动后截图',
        },
      ],
    },
  ],
};

export default MovementTests;
