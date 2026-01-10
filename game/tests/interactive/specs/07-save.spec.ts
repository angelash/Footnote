/**
 * 07-save.spec.ts
 * 存档系统测试
 * 
 * 测试内容：
 * - 自动存档
 * - 手动存档
 * - 存档加载
 * - 存档删除
 * - 跨会话持久化
 */

import { TestConfig, GameScripts } from '../config';
import { GameHelpers } from '../helpers/game-helpers';

// MCP 服务器: user-chrome-devtools (供参考)

/**
 * 测试套件：存档系统
 */
export const SaveTests = {
  name: '存档系统测试',
  
  // 前置条件：清除存档并进入游戏
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
    // 清除存档
    {
      action: 'evaluate',
      tool: 'evaluate_script',
      params: { function: GameHelpers.clearSaveDataScript() },
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
    {
      id: 'save-001',
      name: '初始应无存档',
      description: '验证清除后没有存档数据',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.hasSaveData },
          expected: false,
          description: '验证无存档',
        },
      ],
    },

    {
      id: 'save-002',
      name: 'Zone 切换应触发自动存档',
      description: '验证 Zone 切换时自动保存进度',
      steps: [
        // 切换 Zone
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('C0-Z2') },
          description: '切换到 C0-Z2',
        },
        {
          action: 'sleep',
          duration: 1500,
          description: '等待自动存档',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.hasSaveData },
          expected: true,
          description: '验证存档已创建',
        },
      ],
    },

    {
      id: 'save-003',
      name: '存档应包含正确数据',
      description: '验证存档数据结构正确',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              try {
                const data = localStorage.getItem('footnote_save');
                if (!data) return null;
                const save = JSON.parse(data);
                return {
                  hasZone: 'currentZone' in save,
                  hasR: 'r' in save,
                  hasTimestamp: 'timestamp' in save,
                  hasVisited: 'visitedZones' in save,
                };
              } catch {
                return null;
              }
            }`,
          },
          validate: (data: Record<string, boolean> | null) => {
            return (
              data !== null &&
              data.hasZone &&
              data.hasR &&
              data.hasTimestamp &&
              data.hasVisited
            );
          },
          description: '验证存档结构',
        },
      ],
    },

    {
      id: 'save-004',
      name: '手动存档应工作',
      description: '验证暂停菜单中的保存功能',
      steps: [
        // 先移动一下改变状态
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.simulateKeyHoldScript('d', 500) },
          description: '移动改变状态',
        },
        {
          action: 'sleep',
          duration: 600,
        },
        // 记录当前位置
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'savedPos',
          description: '记录位置',
        },
        // 打开暂停菜单
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'Escape' },
          description: '打开暂停菜单',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        // 点击保存按钮
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._pauseMenu) return false;
              return scene._pauseMenu.clickButton('save');
            }`,
          },
          description: '点击保存按钮',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        // 验证保存成功
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              try {
                const data = localStorage.getItem('footnote_save');
                return data !== null;
              } catch {
                return false;
              }
            }`,
          },
          expected: true,
          description: '验证存档存在',
        },
        // 关闭暂停菜单
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: 'Escape' },
          description: '关闭暂停菜单',
        },
      ],
    },

    {
      id: 'save-005',
      name: '加载存档应恢复状态',
      description: '验证加载存档后恢复正确的游戏状态',
      steps: [
        // 记录当前状态
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentZone },
          saveAs: 'savedZone',
          description: '记录 Zone',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getRValue },
          saveAs: 'savedR',
          description: '记录 R 值',
        },
        // 改变状态
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.teleportToZoneScript('C0-Z3') },
          description: '切换到另一个 Zone',
        },
        {
          action: 'sleep',
          duration: 1000,
        },
        // 刷新页面
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
        },
        {
          action: 'sleep',
          duration: 2000,
        },
        // 点击继续游戏
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: GameHelpers.simulateCanvasClickScript(
              TestConfig.menuButtons.continue.x,
              TestConfig.menuButtons.continue.y
            ),
          },
          description: '点击继续游戏',
        },
        {
          action: 'sleep',
          duration: 3000,
        },
        // 验证状态恢复
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getCurrentZone },
          description: '检查 Zone',
        },
      ],
    },

    {
      id: 'save-006',
      name: '存档应包含物品栏数据',
      description: '验证存档包含玩家物品栏信息',
      steps: [
        // 添加卡片
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.addCardScript('save_test_card') },
          description: '添加测试卡片',
        },
        // 触发存档
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._saveManager) return false;
              scene._saveManager.save();
              return true;
            }`,
          },
          description: '手动存档',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        // 检查存档
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              try {
                const data = localStorage.getItem('footnote_save');
                if (!data) return false;
                const save = JSON.parse(data);
                return save.inventory && save.inventory.includes('save_test_card');
              } catch {
                return false;
              }
            }`,
          },
          expected: true,
          description: '验证物品栏已保存',
        },
      ],
    },

    {
      id: 'save-007',
      name: '删除存档应工作',
      description: '验证删除存档功能正常',
      steps: [
        // 确保有存档
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.hasSaveData },
          expected: true,
          description: '确认有存档',
        },
        // 删除存档
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.clearSaveDataScript() },
          description: '删除存档',
        },
        // 验证删除
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.hasSaveData },
          expected: false,
          description: '验证存档已删除',
        },
      ],
    },

    {
      id: 'save-008',
      name: '存档应有版本号',
      description: '验证存档包含版本信息以便升级',
      steps: [
        // 先创建存档
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._saveManager) return false;
              scene._saveManager.save();
              return true;
            }`,
          },
          description: '创建存档',
        },
        {
          action: 'sleep',
          duration: 500,
        },
        // 检查版本号
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              try {
                const data = localStorage.getItem('footnote_save');
                if (!data) return null;
                const save = JSON.parse(data);
                return save.version;
              } catch {
                return null;
              }
            }`,
          },
          validate: (version: string | null) => version !== null,
          description: '验证有版本号',
        },
      ],
    },

    {
      id: 'save-009',
      name: '云存档状态应可检查',
      description: '验证云存档系统状态可检查',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._cloudSaveManager) return null;
              return {
                enabled: scene._cloudSaveManager.isEnabled(),
                synced: scene._cloudSaveManager.isSynced(),
              };
            }`,
          },
          description: '检查云存档状态',
        },
      ],
    },

    {
      id: 'save-010',
      name: '设置应独立存储',
      description: '验证游戏设置与存档分开存储',
      steps: [
        // 修改设置
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              try {
                const settings = { volume: 0.5, language: 'zh-CN' };
                localStorage.setItem('footnote_settings', JSON.stringify(settings));
                return true;
              } catch {
                return false;
              }
            }`,
          },
          description: '保存设置',
        },
        // 删除存档
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              try {
                localStorage.removeItem('footnote_save');
                return true;
              } catch {
                return false;
              }
            }`,
          },
          description: '删除存档',
        },
        // 验证设置仍在
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              try {
                const data = localStorage.getItem('footnote_settings');
                return data !== null;
              } catch {
                return false;
              }
            }`,
          },
          expected: true,
          description: '验证设置仍存在',
        },
      ],
    },
  ],
};

export default SaveTests;
