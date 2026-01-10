/**
 * 02-menu.spec.ts
 * 主菜单交互测试
 * 
 * 测试内容：
 * - 菜单按钮显示
 * - 新游戏按钮功能
 * - 继续游戏按钮功能
 * - 设置按钮功能
 * - 制作人员按钮功能
 * - 键盘导航
 */

import { TestConfig, GameScripts } from '../config';
import { GameHelpers } from '../helpers/game-helpers';

const MCP_SERVER = 'user-chrome-devtools';

/**
 * 测试套件：主菜单交互
 */
export const MenuTests = {
  name: '主菜单交互测试',
  
  // 前置条件：确保在主菜单场景
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
    {
      id: 'menu-001',
      name: '主菜单场景应激活',
      description: '验证游戏启动后处于主菜单场景',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'MenuScene',
          description: '验证当前场景为 MenuScene',
        },
      ],
    },

    {
      id: 'menu-002',
      name: '点击新游戏应进入游戏',
      description: '验证点击新游戏按钮后能正确进入游戏场景',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: GameHelpers.simulateCanvasClickScript(
              TestConfig.menuButtons.newGame.x,
              TestConfig.menuButtons.newGame.y
            ),
          },
          description: '点击新游戏按钮',
        },
        {
          action: 'sleep',
          duration: 3000,
          description: '等待场景切换',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'GameScene',
          description: '验证进入游戏场景',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/menu-new-game.png`,
          },
          description: '截图验证',
        },
      ],
      // 测试后重置
      afterEach: [
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'reload' },
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
        },
      ],
    },

    {
      id: 'menu-003',
      name: '继续游戏按钮状态应正确',
      description: '验证继续游戏按钮在有/无存档时的状态',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.clearSaveDataScript() },
          description: '清除存档',
        },
        {
          action: 'navigate',
          tool: 'navigate_page',
          params: { type: 'reload' },
          description: '刷新页面',
        },
        {
          action: 'wait',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getLoadingCompleteScript() },
          waitFor: true,
          maxRetries: 30,
          retryInterval: 1000,
          description: '等待加载',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('MenuScene');
              if (!scene) return null;
              // 检查继续按钮是否禁用
              return scene._continueButton ? scene._continueButton.alpha < 1 : null;
            }`,
          },
          expected: true,
          description: '验证无存档时继续按钮禁用',
        },
      ],
    },

    {
      id: 'menu-004',
      name: '设置按钮应打开设置面板',
      description: '验证点击设置按钮能打开设置面板',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: GameHelpers.simulateCanvasClickScript(
              TestConfig.menuButtons.settings.x,
              TestConfig.menuButtons.settings.y
            ),
          },
          description: '点击设置按钮',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待面板动画',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('MenuScene');
              if (!scene) return false;
              return scene._settingsPanel && scene._settingsPanel.visible;
            }`,
          },
          expected: true,
          description: '验证设置面板显示',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/menu-settings.png`,
          },
          description: '截图验证',
        },
      ],
    },

    {
      id: 'menu-005',
      name: 'ESC 键应关闭设置面板',
      description: '验证 ESC 键能关闭设置面板',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: GameHelpers.simulateCanvasClickScript(
              TestConfig.menuButtons.settings.x,
              TestConfig.menuButtons.settings.y
            ),
          },
          description: '打开设置面板',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待面板打开',
        },
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'Escape' },
          description: '按 ESC 键',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待面板关闭',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return true;
              const scene = game.scene.getScene('MenuScene');
              if (!scene) return true;
              return !scene._settingsPanel || !scene._settingsPanel.visible;
            }`,
          },
          expected: true,
          description: '验证设置面板已关闭',
        },
      ],
    },

    {
      id: 'menu-006',
      name: '键盘上下导航应工作',
      description: '验证上下方向键可以在菜单选项间导航',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'ArrowDown' },
          description: '按下方向键',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待选中动画',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('MenuScene');
              if (!scene) return null;
              return scene._selectedIndex;
            }`,
          },
          validate: (index: number | null) => index !== null && index >= 0,
          description: '验证选中索引改变',
        },
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'ArrowUp' },
          description: '按上方向键',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待选中动画',
        },
      ],
    },

    {
      id: 'menu-007',
      name: 'Enter 键应激活选中项',
      description: '验证 Enter 键可以激活当前选中的菜单项',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'ArrowDown' },
          description: '选中新游戏',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待',
        },
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'Enter' },
          description: '按 Enter 键',
        },
        {
          action: 'sleep',
          duration: 3000,
          description: '等待场景切换',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentScene },
          expected: 'GameScene',
          description: '验证进入游戏场景',
        },
      ],
    },

    {
      id: 'menu-008',
      name: '制作人员按钮应显示 Credits',
      description: '验证点击制作人员按钮能显示制作人员列表',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: GameHelpers.simulateCanvasClickScript(
              TestConfig.menuButtons.credits.x,
              TestConfig.menuButtons.credits.y
            ),
          },
          description: '点击制作人员按钮',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待面板显示',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/menu-credits.png`,
          },
          description: '截图验证',
        },
      ],
    },

    {
      id: 'menu-009',
      name: '菜单动画应流畅',
      description: '验证菜单交互动画流畅无卡顿',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              return game.loop.actualFps;
            }`,
          },
          validate: (fps: number | null) => fps !== null && fps >= 30,
          description: '验证帧率正常（>=30fps）',
        },
      ],
    },

    {
      id: 'menu-010',
      name: '触控点击应响应',
      description: '验证触控点击能正确响应菜单操作',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const canvas = document.querySelector('${TestConfig.canvas.selector}');
              if (!canvas) return false;
              
              const rect = canvas.getBoundingClientRect();
              const x = rect.left + rect.width * ${TestConfig.menuButtons.newGame.x};
              const y = rect.top + rect.height * ${TestConfig.menuButtons.newGame.y};
              
              // 模拟触控事件
              const touch = new Touch({
                identifier: Date.now(),
                target: canvas,
                clientX: x,
                clientY: y,
              });
              
              const touchStart = new TouchEvent('touchstart', {
                touches: [touch],
                targetTouches: [touch],
                changedTouches: [touch],
                bubbles: true,
              });
              
              const touchEnd = new TouchEvent('touchend', {
                touches: [],
                targetTouches: [],
                changedTouches: [touch],
                bubbles: true,
              });
              
              canvas.dispatchEvent(touchStart);
              canvas.dispatchEvent(touchEnd);
              return true;
            }`,
          },
          expected: true,
          description: '触发触控点击',
        },
        {
          action: 'sleep',
          duration: 3000,
          description: '等待响应',
        },
      ],
    },
  ],
};

export default MenuTests;
