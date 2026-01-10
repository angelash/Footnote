/**
 * 04-ui.spec.ts
 * UI 系统测试
 * 
 * 测试内容：
 * - 暂停菜单
 * - 物品栏
 * - 卡片UI
 * - Toast 通知
 * - 深度效果
 */

import { TestConfig, GameScripts } from '../config';
import { GameHelpers } from '../helpers/game-helpers';

// MCP 服务器: user-chrome-devtools (供参考)

/**
 * 测试套件：UI 系统
 */
export const UITests = {
  name: 'UI 系统测试',
  
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
    // ==================== 暂停菜单测试 ====================
    {
      id: 'ui-001',
      name: 'ESC 应打开暂停菜单',
      description: '验证按 ESC 键能打开暂停菜单',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'Escape' },
          description: '按 ESC 键',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待菜单动画',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.isPauseMenuVisible },
          expected: true,
          description: '验证暂停菜单显示',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/ui-pause-menu.png`,
          },
          description: '截图验证',
        },
      ],
    },

    {
      id: 'ui-002',
      name: '再次 ESC 应关闭暂停菜单',
      description: '验证再次按 ESC 键能关闭暂停菜单',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'Escape' },
          description: '按 ESC 关闭',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待菜单关闭',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.isPauseMenuVisible },
          expected: false,
          description: '验证暂停菜单关闭',
        },
      ],
    },

    {
      id: 'ui-003',
      name: '暂停菜单应有继续按钮',
      description: '验证暂停菜单包含继续游戏按钮',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'Escape' },
          description: '打开暂停菜单',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._pauseMenu) return false;
              return scene._pauseMenu.hasButton('resume');
            }`,
          },
          expected: true,
          description: '验证有继续按钮',
        },
        // 关闭菜单
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'Escape' },
          description: '关闭暂停菜单',
        },
      ],
    },

    {
      id: 'ui-004',
      name: '暂停菜单继续按钮应恢复游戏',
      description: '验证点击继续按钮能恢复游戏',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'Escape' },
          description: '打开暂停菜单',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._pauseMenu) return false;
              scene._pauseMenu.clickButton('resume');
              return true;
            }`,
          },
          description: '点击继续按钮',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.isPauseMenuVisible },
          expected: false,
          description: '验证菜单关闭',
        },
      ],
    },

    // ==================== 物品栏测试 ====================
    {
      id: 'ui-005',
      name: 'I 键应打开物品栏',
      description: '验证按 I 键能打开物品栏',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'i' },
          description: '按 I 键',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待物品栏动画',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._inventoryUI) return false;
              return scene._inventoryUI.isVisible();
            }`,
          },
          expected: true,
          description: '验证物品栏显示',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/ui-inventory.png`,
          },
          description: '截图验证',
        },
      ],
    },

    {
      id: 'ui-006',
      name: '再次 I 键应关闭物品栏',
      description: '验证再次按 I 键能关闭物品栏',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'i' },
          description: '按 I 键关闭',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._inventoryUI) return false;
              return !scene._inventoryUI.isVisible();
            }`,
          },
          expected: true,
          description: '验证物品栏关闭',
        },
      ],
    },

    {
      id: 'ui-007',
      name: '添加卡片后物品栏应显示',
      description: '验证添加卡片后物品栏正确显示卡片',
      steps: [
        // 添加测试卡片
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.addCardScript('test-card-001') },
          description: '添加测试卡片',
        },
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'i' },
          description: '打开物品栏',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getInventoryItems },
          validate: (items: string[]) => items.includes('test-card-001'),
          description: '验证卡片在物品栏中',
        },
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'i' },
          description: '关闭物品栏',
        },
      ],
    },

    // ==================== 卡片详情测试 ====================
    {
      id: 'ui-008',
      name: '点击卡片应显示详情',
      description: '验证点击物品栏中的卡片能显示详情',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'i' },
          description: '打开物品栏',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._inventoryUI) return false;
              // 模拟点击第一张卡片
              return scene._inventoryUI.selectCard(0);
            }`,
          },
          description: '点击第一张卡片',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._cardUI) return false;
              return scene._cardUI.isVisible();
            }`,
          },
          expected: true,
          description: '验证卡片详情显示',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/ui-card-detail.png`,
          },
          description: '截图验证',
        },
        // 关闭
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'Escape' },
          description: '关闭卡片详情',
        },
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'i' },
          description: '关闭物品栏',
        },
      ],
    },

    // ==================== Toast 测试 ====================
    {
      id: 'ui-009',
      name: 'Toast 应能显示和自动消失',
      description: '验证 Toast 通知能正确显示和自动消失',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._toastManager) return false;
              scene._toastManager.show('测试通知消息');
              return true;
            }`,
          },
          description: '显示 Toast',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待显示',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.isToastVisibleScript() },
          expected: true,
          description: '验证 Toast 显示',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/ui-toast.png`,
          },
          description: '截图验证',
        },
        {
          action: 'sleep',
          duration: 3000,
          description: '等待自动消失',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.isToastVisibleScript() },
          expected: false,
          description: '验证 Toast 消失',
        },
      ],
    },

    // ==================== 深度效果测试 ====================
    {
      id: 'ui-010',
      name: '深度效果应可触发',
      description: '验证深度感知效果能正确触发',
      steps: [
        // 先解锁深度感知能力
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.unlockAbilityScript('depth_perception') },
          description: '解锁深度感知',
        },
        // 按空格触发
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '按空格触发深度感知',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待效果',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._depthEffects) return false;
              return scene._depthEffects.isActive();
            }`,
          },
          expected: true,
          description: '验证深度效果激活',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/ui-depth-effect.png`,
          },
          description: '截图验证',
        },
      ],
    },

    // ==================== 触控按钮测试 ====================
    {
      id: 'ui-011',
      name: '移动端触控按钮应显示',
      description: '验证移动端触控控制按钮正确显示',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._touchControls) return null;
              return {
                visible: scene._touchControls.isVisible(),
                enabled: scene._touchControls.isEnabled(),
              };
            }`,
          },
          description: '检查触控按钮状态',
        },
      ],
    },

    // ==================== UI 层级测试 ====================
    {
      id: 'ui-012',
      name: 'UI 层级应正确',
      description: '验证 UI 元素层级正确（对话框在最上层）',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene) return null;
              
              const depths = {
                player: scene._player?.depth,
                dialogueUI: scene._dialogueUI?.container?.depth,
                pauseMenu: scene._pauseMenu?.container?.depth,
                inventoryUI: scene._inventoryUI?.container?.depth,
              };
              
              return depths;
            }`,
          },
          validate: (depths: Record<string, number | undefined> | null) => {
            if (!depths) return false;
            // 对话框 > 玩家
            if (depths.dialogueUI !== undefined && depths.player !== undefined) {
              return depths.dialogueUI > depths.player;
            }
            return true;
          },
          description: '验证 UI 层级',
        },
      ],
    },
  ],
};

export default UITests;
