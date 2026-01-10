/**
 * 05-dialogue.spec.ts
 * 对话系统测试
 * 
 * 测试内容：
 * - 对话触发
 * - 对话显示
 * - 对话推进
 * - 选择分支
 * - 对话结束
 */

import { TestConfig, GameScripts } from '../config';
import { GameHelpers } from '../helpers/game-helpers';

const MCP_SERVER = 'user-chrome-devtools';

/**
 * 测试套件：对话系统
 */
export const DialogueTests = {
  name: '对话系统测试',
  
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
      id: 'dialogue-001',
      name: '对话触发时应显示对话框',
      description: '验证触发对话后对话框正确显示',
      steps: [
        // 触发测试对话
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._dialogueUI) return false;
              
              // 触发测试对话
              scene._dialogueUI.show({
                speaker: '测试角色',
                text: '这是一段测试对话文本。',
              });
              return true;
            }`,
          },
          description: '触发测试对话',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待显示动画',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.isDialogueVisible },
          expected: true,
          description: '验证对话框显示',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/dialogue-show.png`,
          },
          description: '截图验证',
        },
      ],
    },

    {
      id: 'dialogue-002',
      name: '对话应显示正确的说话者和内容',
      description: '验证对话框显示正确的角色名和对话内容',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getDialogueContentScript() },
          validate: (content: { speaker: string; text: string } | null) => {
            return (
              content !== null &&
              content.speaker === '测试角色' &&
              content.text.includes('测试对话')
            );
          },
          description: '验证对话内容',
        },
      ],
    },

    {
      id: 'dialogue-003',
      name: '点击/空格应推进对话',
      description: '验证点击或按空格键能推进对话',
      steps: [
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '按空格推进对话',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.isDialogueVisible },
          expected: false,
          description: '验证对话结束',
        },
      ],
    },

    {
      id: 'dialogue-004',
      name: '多段对话应能连续显示',
      description: '验证多段对话能连续播放',
      steps: [
        // 触发多段对话
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._dialogueUI) return false;
              
              scene._dialogueUI.showSequence([
                { speaker: '角色A', text: '第一段对话' },
                { speaker: '角色B', text: '第二段对话' },
                { speaker: '角色A', text: '第三段对话' },
              ]);
              return true;
            }`,
          },
          description: '触发多段对话',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待',
        },
        // 验证第一段
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getDialogueContentScript() },
          validate: (content: { speaker: string; text: string } | null) => {
            return content?.text === '第一段对话';
          },
          description: '验证第一段对话',
        },
        // 推进
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '推进到第二段',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待',
        },
        // 验证第二段
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.getDialogueContentScript() },
          validate: (content: { speaker: string; text: string } | null) => {
            return content?.text === '第二段对话';
          },
          description: '验证第二段对话',
        },
        // 推进完毕
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '推进到第三段',
        },
        {
          action: 'sleep',
          duration: 300,
        },
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '结束对话',
        },
      ],
    },

    {
      id: 'dialogue-005',
      name: '对话选择分支应正确显示',
      description: '验证带选择的对话能正确显示选项',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._dialogueUI) return false;
              
              scene._dialogueUI.showWithChoices({
                speaker: 'NPC',
                text: '你要选择哪个？',
                choices: [
                  { id: 'choice1', text: '选项一' },
                  { id: 'choice2', text: '选项二' },
                  { id: 'choice3', text: '选项三' },
                ],
              });
              return true;
            }`,
          },
          description: '触发带选择的对话',
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
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._dialogueUI) return null;
              return scene._dialogueUI.getChoices();
            }`,
          },
          validate: (choices: { id: string; text: string }[] | null) => {
            return choices !== null && choices.length === 3;
          },
          description: '验证显示 3 个选项',
        },
        {
          action: 'screenshot',
          tool: 'take_screenshot',
          params: {
            format: 'png',
            filePath: `${TestConfig.screenshotDir}/dialogue-choices.png`,
          },
          description: '截图验证',
        },
      ],
    },

    {
      id: 'dialogue-006',
      name: '选择选项应触发对应分支',
      description: '验证选择选项后能触发对应的对话分支',
      steps: [
        // 选择第一个选项
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._dialogueUI) return null;
              return scene._dialogueUI.selectChoice(0);
            }`,
          },
          saveAs: 'selectedChoice',
          description: '选择第一个选项',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待',
        },
        {
          action: 'assert',
          assertion: 'custom',
          validate: (ctx: { selectedChoice: string | null }) => {
            return ctx.selectedChoice === 'choice1';
          },
          description: '验证选择了选项一',
        },
        // 关闭对话
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '关闭对话',
        },
      ],
    },

    {
      id: 'dialogue-007',
      name: '键盘数字键应能选择选项',
      description: '验证按数字键能选择对应选项',
      steps: [
        // 重新触发选择对话
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._dialogueUI) return false;
              
              scene._dialogueUI.showWithChoices({
                speaker: 'NPC',
                text: '再选一次？',
                choices: [
                  { id: 'a', text: '选A' },
                  { id: 'b', text: '选B' },
                ],
              });
              return true;
            }`,
          },
          description: '触发选择对话',
        },
        {
          action: 'sleep',
          duration: 500,
          description: '等待',
        },
        // 按数字键 2
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: '2' },
          description: '按数字键 2',
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
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._dialogueUI) return null;
              return scene._dialogueUI.getLastChoice();
            }`,
          },
          expected: 'b',
          description: '验证选择了选项 B',
        },
      ],
    },

    {
      id: 'dialogue-008',
      name: '对话打字机效果应工作',
      description: '验证对话文字有打字机效果',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._dialogueUI) return false;
              
              // 触发长对话
              scene._dialogueUI.show({
                speaker: '角色',
                text: '这是一段比较长的对话文本，用来测试打字机效果是否正常工作。',
                typewriterSpeed: 30, // 每个字符 30ms
              });
              return true;
            }`,
          },
          description: '触发打字机对话',
        },
        {
          action: 'sleep',
          duration: 100,
          description: '等待少量时间',
        },
        // 检查文字是否还在打字中
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._dialogueUI) return null;
              return scene._dialogueUI.isTyping();
            }`,
          },
          expected: true,
          description: '验证打字机效果进行中',
        },
        // 等待打字完成
        {
          action: 'sleep',
          duration: 2000,
          description: '等待打字完成',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return null;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._dialogueUI) return null;
              return scene._dialogueUI.isTyping();
            }`,
          },
          expected: false,
          description: '验证打字机效果完成',
        },
        // 关闭
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '关闭对话',
        },
      ],
    },

    {
      id: 'dialogue-009',
      name: '对话中移动应被禁用',
      description: '验证对话显示时玩家移动被禁用',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: {
            function: `() => {
              const game = window.__PHASER_GAME__ || window.game;
              if (!game) return false;
              const scene = game.scene.getScene('GameScene');
              if (!scene || !scene._dialogueUI) return false;
              
              scene._dialogueUI.show({
                speaker: '角色',
                text: '对话中...',
              });
              return true;
            }`,
          },
          description: '触发对话',
        },
        {
          action: 'sleep',
          duration: 300,
          description: '等待',
        },
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
          description: '等待',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'pos2',
          description: '获取新位置',
        },
        {
          action: 'assert',
          assertion: 'custom',
          validate: (ctx: { pos1: { x: number; y: number }; pos2: { x: number; y: number } }) => {
            // 位置应该没有变化
            return ctx.pos1.x === ctx.pos2.x && ctx.pos1.y === ctx.pos2.y;
          },
          description: '验证位置未变',
        },
        // 关闭对话
        {
          action: 'press_key',
          tool: 'press_key',
          params: { key: ' ' },
          description: '关闭对话',
        },
      ],
    },

    {
      id: 'dialogue-010',
      name: '对话关闭后移动应恢复',
      description: '验证对话关闭后玩家能正常移动',
      steps: [
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameScripts.getPlayerPosition },
          saveAs: 'pos1',
          description: '记录位置',
        },
        {
          action: 'evaluate',
          tool: 'evaluate_script',
          params: { function: GameHelpers.simulateKeyHoldScript('d', 300) },
          description: '向右移动',
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
          saveAs: 'pos2',
          description: '获取新位置',
        },
        {
          action: 'assert',
          assertion: 'movedRight',
          params: { before: '$pos1', after: '$pos2' },
          description: '验证向右移动成功',
        },
      ],
    },
  ],
};

export default DialogueTests;
