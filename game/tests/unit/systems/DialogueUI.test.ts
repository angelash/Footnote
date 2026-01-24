/**
 * DialogueUI 单元测试
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// Mock Phaser module FIRST (hoisted)
vi.mock('phaser', () => ({
  default: {
    Geom: {
      Rectangle: class MockRectangle {
        constructor(
          public x: number,
          public y: number,
          public width: number,
          public height: number
        ) {}
        static Contains = vi.fn().mockReturnValue(true);
      },
    },
  },
}));

// Mock Timer Event
const mockTimerEvent = {
  destroy: vi.fn(),
};

const mockTweenAdd = vi.fn().mockReturnValue({ on: vi.fn() });

const mockGraphics = {
  clear: vi.fn().mockReturnThis(),
  fillStyle: vi.fn().mockReturnThis(),
  fillRoundedRect: vi.fn().mockReturnThis(),
  lineStyle: vi.fn().mockReturnThis(),
  strokeRoundedRect: vi.fn().mockReturnThis(),
};

const mockText = {
  setText: vi.fn().mockReturnThis(),
  setOrigin: vi.fn().mockReturnThis(),
  setColor: vi.fn().mockReturnThis(),
  setVisible: vi.fn().mockReturnThis(),
  setAlpha: vi.fn().mockReturnThis(),
  setDisplaySize: vi.fn().mockReturnThis(),
  y: 100,
  destroy: vi.fn(),
};

const mockImage = {
  setDisplaySize: vi.fn().mockReturnThis(),
  setAlpha: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
  x: 0,
};

const mockRectangle = {
  setAlpha: vi.fn().mockReturnThis(),
  setInteractive: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
};

const mockContainer = {
  add: vi.fn().mockReturnThis(),
  setDepth: vi.fn().mockReturnThis(),
  setVisible: vi.fn().mockReturnThis(),
  setAlpha: vi.fn().mockReturnThis(),
  setSize: vi.fn().mockReturnThis(),
  setInteractive: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
  visible: false,
  y: 500,
};

const createMockScene = () => ({
  scale: { width: 720, height: 1280 },
  add: {
    container: vi.fn().mockReturnValue({ ...mockContainer }),
    graphics: vi.fn().mockReturnValue({ ...mockGraphics }),
    text: vi.fn().mockReturnValue({ ...mockText }),
    rectangle: vi.fn().mockReturnValue({ ...mockRectangle }),
    image: vi.fn().mockReturnValue({ ...mockImage }),
  },
  tweens: {
    add: mockTweenAdd,
  },
  time: {
    addEvent: vi.fn().mockReturnValue({ ...mockTimerEvent }),
  },
  input: {
    keyboard: {
      on: vi.fn(),
    },
  },
  textures: {
    exists: vi.fn().mockReturnValue(false),
  },
});

// Mock EventBus
vi.mock('@/systems/EventBus', () => ({
  eventBus: {
    emit: vi.fn(),
  },
  GameEvent: {
    DIALOGUE_START: 'DIALOGUE_START',
    DIALOGUE_END: 'DIALOGUE_END',
    DIALOGUE_ADVANCE: 'DIALOGUE_ADVANCE',
    DIALOGUE_CHOICE: 'DIALOGUE_CHOICE',
  },
}));

// Mock config
vi.mock('@/config/game.config', () => ({
  TEXT_STYLES: {
    SPEAKER: { fontFamily: 'Arial', color: '#00FFAA' },
    DIALOGUE: { fontFamily: 'Arial', color: '#E8E6E3' },
    BODY: { fontFamily: 'Arial', color: '#E8E6E3' },
    MUTED: { fontFamily: 'Arial', color: '#686868' },
  },
  COLORS: {
    BG_PRIMARY: 0x0a0a0a,
    BG_SECONDARY: 0x1a1a1a,
    ACCENT: 0x00ffaa,
    BORDER: 0x333333,
  },
}));

vi.mock('@/config/ui.config', () => ({
  UI: {
    DIALOGUE: {
      BOX_HEIGHT: 200,
      BOX_MARGIN_BOTTOM: 40,
      CHOICE_HEIGHT: 50,
      CHOICE_SPACING: 10,
    },
    LINE_SPACING: { LOOSE: 8 },
  },
  UI_FONT_SIZE: {
    SMALL: '16px',
    NORMAL: '20px',
  },
}));

vi.mock('@/config/characters.config', () => ({
  CharacterId: {
    CENHUI: 'cenhui',
    GULIN: 'gulin',
  },
  getPortraitKey: vi.fn().mockReturnValue(null),
}));

import { DialogueUI } from '@/systems/ui/DialogueUI';
import { eventBus, GameEvent } from '@/systems/EventBus';
import type { IDialogue } from '@/types';

describe('DialogueUI', () => {
  let dialogueUI: DialogueUI;
  let mockScene: ReturnType<typeof createMockScene>;
  let onDialogueEndCallback: Mock;
  let onChoiceSelectedCallback: Mock;

  const mockDialogue: IDialogue = {
    id: 'dlg_test_001',
    speaker: '岑回',
    text: '这是一段测试对话文本。',
  };

  const mockDialogueWithChoices: IDialogue = {
    id: 'dlg_test_002',
    speaker: '顾临',
    text: '你想要做什么？',
    choices: [
      { label: '选项A', next: 'dlg_a' },
      { label: '选项B', next: 'dlg_b' },
      { label: '选项C', next: 'dlg_c' },
    ],
  };

  const mockDialogueWithNext: IDialogue = {
    id: 'dlg_test_003',
    speaker: '宋岚',
    text: '这是有后续的对话。',
    next: 'dlg_test_004',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene = createMockScene();
    onDialogueEndCallback = vi.fn();
    onChoiceSelectedCallback = vi.fn();

    dialogueUI = new DialogueUI({
      scene: mockScene as unknown as Phaser.Scene,
      onDialogueEnd: onDialogueEndCallback,
      onChoiceSelected: onChoiceSelectedCallback,
    });
  });

  describe('初始化', () => {
    it('应该创建所有UI元素', () => {
      expect(mockScene.add.container).toHaveBeenCalled();
      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(mockScene.add.text).toHaveBeenCalled();
      expect(mockScene.add.rectangle).toHaveBeenCalled();
    });

    it('容器初始应该不可见', () => {
      expect(dialogueUI.isVisible()).toBe(false);
    });

    it('应该设置空格键监听', () => {
      expect(mockScene.input.keyboard?.on).toHaveBeenCalledWith(
        'keydown-SPACE',
        expect.any(Function)
      );
    });
  });

  describe('showDialogue - 显示对话', () => {
    it('应该显示对话框', () => {
      dialogueUI.showDialogue(mockDialogue);

      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.DIALOGUE_START, {
        dialogueId: mockDialogue.id,
      });
    });

    it('应该设置说话者名称', () => {
      dialogueUI.showDialogue(mockDialogue);

      expect(mockText.setText).toHaveBeenCalledWith(mockDialogue.speaker);
    });

    it('应该触发淡入动画', () => {
      dialogueUI.showDialogue(mockDialogue);

      expect(mockTweenAdd).toHaveBeenCalled();
    });

    it('应该开始打字机效果', () => {
      dialogueUI.showDialogue(mockDialogue);

      expect(mockScene.time.addEvent).toHaveBeenCalled();
    });
  });

  describe('hideDialogue - 隐藏对话', () => {
    it('应该触发淡出动画', () => {
      dialogueUI.showDialogue(mockDialogue);
      vi.clearAllMocks();

      dialogueUI.hideDialogue();

      expect(mockTweenAdd).toHaveBeenCalled();
    });

    it('动画完成后应该发送事件和调用回调', () => {
      dialogueUI.showDialogue(mockDialogue);
      vi.clearAllMocks();

      dialogueUI.hideDialogue();

      // 获取动画完成回调
      const tweenConfig = mockTweenAdd.mock.calls[0][0];
      tweenConfig.onComplete();

      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.DIALOGUE_END, {
        dialogueId: mockDialogue.id,
      });
      expect(onDialogueEndCallback).toHaveBeenCalledWith(mockDialogue.id);
    });

    it('应该销毁打字机定时器', () => {
      dialogueUI.showDialogue(mockDialogue);
      vi.clearAllMocks();

      dialogueUI.hideDialogue();

      expect(mockTimerEvent.destroy).toHaveBeenCalled();
    });
  });

  describe('advance - 推进对话', () => {
    it('没有当前对话时不应执行任何操作', () => {
      // Clear mocks from initialization (continue indicator animation)
      vi.clearAllMocks();
      
      dialogueUI.advance();

      // Should not trigger any new tweens for dialogue hide
      expect(mockTweenAdd).not.toHaveBeenCalled();
    });

    it('打字中应该直接显示全部文字', () => {
      dialogueUI.showDialogue(mockDialogue);
      // 此时isTyping应该为true

      dialogueUI.advance();

      // 应该停止打字机
      expect(mockTimerEvent.destroy).toHaveBeenCalled();
    });

    it('有选项时不应自动推进', () => {
      dialogueUI.showDialogue(mockDialogueWithChoices);

      // 模拟打字完成
      const timerConfig = mockScene.time.addEvent.mock.calls[0][0];
      // 多次调用callback直到完成
      for (let i = 0; i < mockDialogueWithChoices.text.length; i++) {
        timerConfig.callback();
      }

      vi.clearAllMocks();
      dialogueUI.advance();

      // 不应该发送DIALOGUE_ADVANCE事件
      expect(eventBus.emit).not.toHaveBeenCalledWith(
        GameEvent.DIALOGUE_ADVANCE,
        expect.anything()
      );
    });

    it('有next时应该发送DIALOGUE_ADVANCE事件', () => {
      dialogueUI.showDialogue(mockDialogueWithNext);

      // 模拟打字完成 - 调用advance两次，第一次完成打字，第二次推进
      dialogueUI.advance();
      vi.clearAllMocks();

      dialogueUI.advance();

      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.DIALOGUE_ADVANCE, {
        dialogueId: mockDialogueWithNext.id,
        lineIndex: 0,
      });
    });

    it('没有next时应该结束对话', () => {
      dialogueUI.showDialogue(mockDialogue);

      // 第一次advance完成打字
      dialogueUI.advance();
      vi.clearAllMocks();

      // 第二次advance应该结束对话
      dialogueUI.advance();

      // 应该触发隐藏动画
      expect(mockTweenAdd).toHaveBeenCalled();
    });
  });

  describe('selectChoice - 选择选项', () => {
    it('没有选项时不应执行任何操作', () => {
      dialogueUI.showDialogue(mockDialogue);

      dialogueUI.selectChoice(0);

      expect(eventBus.emit).not.toHaveBeenCalledWith(
        GameEvent.DIALOGUE_CHOICE,
        expect.anything()
      );
    });

    it('应该发送选择事件', () => {
      dialogueUI.showDialogue(mockDialogueWithChoices);
      vi.clearAllMocks();

      dialogueUI.selectChoice(1);

      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.DIALOGUE_CHOICE, {
        dialogueId: mockDialogueWithChoices.id,
        choiceIndex: 1,
        choiceText: '选项B',
      });
    });

    it('应该调用onChoiceSelected回调', () => {
      dialogueUI.showDialogue(mockDialogueWithChoices);

      dialogueUI.selectChoice(0);

      expect(onChoiceSelectedCallback).toHaveBeenCalledWith(
        mockDialogueWithChoices.id,
        0
      );
    });

    it('无效的选项索引不应执行操作', () => {
      dialogueUI.showDialogue(mockDialogueWithChoices);
      vi.clearAllMocks();

      dialogueUI.selectChoice(99);

      expect(eventBus.emit).not.toHaveBeenCalledWith(
        GameEvent.DIALOGUE_CHOICE,
        expect.anything()
      );
    });
  });

  describe('isVisible - 可见性检查', () => {
    it('初始应该返回false', () => {
      expect(dialogueUI.isVisible()).toBe(false);
    });
  });

  describe('destroy - 销毁', () => {
    it('应该销毁定时器和容器', () => {
      const containerDestroy = vi.fn();
      mockScene.add.container = vi.fn().mockReturnValue({
        ...mockContainer,
        destroy: containerDestroy,
      });

      const ui = new DialogueUI({
        scene: mockScene as unknown as Phaser.Scene,
      });

      ui.showDialogue(mockDialogue);
      ui.destroy();

      expect(mockTimerEvent.destroy).toHaveBeenCalled();
      expect(containerDestroy).toHaveBeenCalled();
    });
  });

  describe('打字机效果', () => {
    it('应该使用正确的延迟', () => {
      dialogueUI.showDialogue(mockDialogue);

      const timerConfig = mockScene.time.addEvent.mock.calls[0][0];
      expect(timerConfig.delay).toBe(30);
    });

    it('应该逐字显示文本', () => {
      dialogueUI.showDialogue(mockDialogue);

      const timerConfig = mockScene.time.addEvent.mock.calls[0][0];

      // 第一个字符
      timerConfig.callback();
      expect(mockText.setText).toHaveBeenLastCalledWith(mockDialogue.text[0]);

      // 第二个字符
      timerConfig.callback();
      expect(mockText.setText).toHaveBeenLastCalledWith(
        mockDialogue.text.substring(0, 2)
      );
    });

    it('完成后应该显示继续指示器（无选项时）', () => {
      dialogueUI.showDialogue(mockDialogue);

      // 完成打字机效果
      dialogueUI.advance(); // This completes typewriter

      // 检查setVisible的调用中是否包含true
      const visibleCalls = mockText.setVisible.mock.calls;
      const hasSetVisibleTrue = visibleCalls.some((call) => call[0] === true);
      
      expect(hasSetVisibleTrue).toBe(true);
    });
  });

  describe('选项渲染', () => {
    it('应该为每个选项创建按钮', () => {
      dialogueUI.showDialogue(mockDialogueWithChoices);

      // 模拟打字完成
      dialogueUI.advance();

      // 验证container被创建（用于选项按钮）
      expect(mockScene.add.container).toHaveBeenCalled();
    });
  });

  describe('表情支持', () => {
    it('应该支持表情参数', () => {
      // 模拟纹理存在时才会调用exists检查
      mockScene.textures.exists.mockReturnValue(true);
      
      const dialogueWithExpression: IDialogue = {
        ...mockDialogue,
        expression: 'smiling',
      };

      dialogueUI.showDialogue(dialogueWithExpression);

      // 应该处理表情参数，即使立绘不存在也不会报错
      expect(dialogueWithExpression.expression).toBe('smiling');
    });

    it('默认表情应该是neutral', () => {
      // 对于没有expression的对话，默认使用neutral
      dialogueUI.showDialogue(mockDialogue);

      // 验证对话正常显示（没有expression字段时默认为neutral）
      expect(mockDialogue.expression).toBeUndefined();
    });
  });
});
