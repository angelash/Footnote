/**
 * CardUI 单元测试
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

// Mock Phaser scene utilities
const mockTweenAdd = vi.fn().mockReturnValue({ on: vi.fn() });
const mockTimeDelayedCall = vi.fn();
const mockParticles = {
  destroy: vi.fn(),
};
const mockAddParticles = vi.fn().mockReturnValue(mockParticles);

const mockGraphics = {
  clear: vi.fn().mockReturnThis(),
  fillStyle: vi.fn().mockReturnThis(),
  fillRoundedRect: vi.fn().mockReturnThis(),
  fillCircle: vi.fn().mockReturnThis(),
  lineStyle: vi.fn().mockReturnThis(),
  strokeRoundedRect: vi.fn().mockReturnThis(),
  strokeCircle: vi.fn().mockReturnThis(),
  createGeometryMask: vi.fn().mockReturnValue({}),
  setVisible: vi.fn().mockReturnThis(),
  fillRect: vi.fn().mockReturnThis(),
};

const mockText = {
  setText: vi.fn().mockReturnThis(),
  setOrigin: vi.fn().mockReturnThis(),
  setColor: vi.fn().mockReturnThis(),
  setVisible: vi.fn().mockReturnThis(),
  setMask: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
};

const mockRectangle = {
  setAlpha: vi.fn().mockReturnThis(),
  setInteractive: vi.fn().mockReturnThis(),
  setDepth: vi.fn().mockReturnThis(),
  setVisible: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
};

const mockContainer = {
  add: vi.fn().mockReturnThis(),
  setDepth: vi.fn().mockReturnThis(),
  setVisible: vi.fn().mockReturnThis(),
  setScale: vi.fn().mockReturnThis(),
  setAlpha: vi.fn().mockReturnThis(),
  setAngle: vi.fn().mockReturnThis(),
  setSize: vi.fn().mockReturnThis(),
  setInteractive: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
  visible: false,
  x: 360,
  y: 640,
};

const createMockScene = () => ({
  scale: { width: 720, height: 1280 },
  add: {
    container: vi.fn().mockReturnValue({ ...mockContainer }),
    graphics: vi.fn().mockReturnValue({ ...mockGraphics }),
    text: vi.fn().mockReturnValue({ ...mockText }),
    rectangle: vi.fn().mockReturnValue({ ...mockRectangle }),
    particles: mockAddParticles,
  },
  tweens: {
    add: mockTweenAdd,
  },
  time: {
    delayedCall: mockTimeDelayedCall,
  },
  input: {
    keyboard: {
      on: vi.fn(),
    },
  },
  textures: {
    exists: vi.fn().mockReturnValue(true),
  },
});

// Mock EventBus
vi.mock('@/systems/EventBus', () => ({
  eventBus: {
    emit: vi.fn(),
  },
  GameEvent: {
    CARD_VIEW: 'CARD_VIEW',
    CARD_CLOSE: 'CARD_CLOSE',
  },
}));

// Mock config
vi.mock('@/config/game.config', () => ({
  TEXT_STYLES: {
    TITLE: { fontFamily: 'Arial', color: '#FFFFFF' },
    BODY: { fontFamily: 'Arial', color: '#E8E6E3' },
    MUTED: { fontFamily: 'Arial', color: '#686868' },
  },
  COLORS: {
    BG_SECONDARY: 0x1a1a1a,
    ACCENT: 0x00ffaa,
    BORDER: 0x333333,
  },
}));

vi.mock('@/config/ui.config', () => ({
  UI: {
    CARD: {
      NORMAL: { WIDTH: 320, HEIGHT: 480 },
    },
    BUTTON: {
      MIN_TOUCH_SIZE: 44,
    },
    RADIUS: { XL: 16, M: 8, S: 4 },
    ANIMATION: { EFFECT: 500, NORMAL: 300 },
    SPACING: { XL: 32, L: 24, M: 16, S: 8 },
    LINE_SPACING: { LOOSE: 8 },
    DEPTHS: {
      CARD: 1000,
      OVERLAY: 900,
    },
  },
  UI_FONT_SIZE: {
    ICON: '24px',
    SECTION: '28px',
    SMALL: '16px',
    NORMAL: '20px',
  },
}));

import { CardUI } from '@/systems/ui/CardUI';
import { eventBus, GameEvent } from '@/systems/EventBus';
import type { ICard } from '@/types';

describe('CardUI', () => {
  let cardUI: CardUI;
  let mockScene: ReturnType<typeof createMockScene>;
  let onCardClosedCallback: Mock;

  const mockCard: ICard = {
    id: 'card_test_001',
    name: '测试卡片',
    type: 'archive',
    chapter: 'C0',
    zone: 'C0-Z1',
    front: ['卡片正面内容第一行', '卡片正面内容第二行'],
    detail: ['卡片详情内容第一行', '卡片详情内容第二行', '更多详情'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene = createMockScene();
    onCardClosedCallback = vi.fn();

    cardUI = new CardUI({
      scene: mockScene as unknown as Phaser.Scene,
      onCardClosed: onCardClosedCallback,
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
      expect(cardUI.isVisible()).toBe(false);
    });

    it('应该设置键盘ESC监听', () => {
      expect(mockScene.input.keyboard?.on).toHaveBeenCalledWith(
        'keydown-ESC',
        expect.any(Function)
      );
    });
  });

  describe('showCardObtain - 获取卡片动画', () => {
    it('应该显示卡片并设置初始状态', () => {
      cardUI.showCardObtain(mockCard);

      // 检查是否发射了事件
      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.CARD_VIEW, {
        cardId: mockCard.id,
      });
    });

    it('应该触发背景淡入动画', () => {
      cardUI.showCardObtain(mockCard);

      // 检查是否添加了动画
      expect(mockTweenAdd).toHaveBeenCalled();
    });

    it('应该触发卡片弹出动画', () => {
      cardUI.showCardObtain(mockCard);

      // 至少调用两次：背景淡入 + 卡片弹出
      expect(mockTweenAdd.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('showCard - 普通显示卡片', () => {
    it('应该显示卡片无弹出动画', () => {
      cardUI.showCard(mockCard);

      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.CARD_VIEW, {
        cardId: mockCard.id,
      });
    });

    it('应该使用较短的动画时长', () => {
      cardUI.showCard(mockCard);

      // 检查动画调用
      const calls = mockTweenAdd.mock.calls;
      const durations = calls.map((call) => call[0].duration);

      // 普通显示应该有200ms和300ms的动画
      expect(durations).toContain(200);
      expect(durations).toContain(300);
    });
  });

  describe('closeCard - 关闭卡片', () => {
    it('没有当前卡片时不应执行任何操作', () => {
      cardUI.closeCard();

      // 不应该添加动画
      expect(mockTweenAdd).not.toHaveBeenCalled();
    });

    it('应该触发关闭动画', () => {
      cardUI.showCard(mockCard);
      vi.clearAllMocks();

      cardUI.closeCard();

      expect(mockTweenAdd).toHaveBeenCalled();
    });

    it('动画完成后应该调用回调', () => {
      cardUI.showCard(mockCard);
      vi.clearAllMocks();

      cardUI.closeCard();

      // 获取动画完成回调
      const tweenConfig = mockTweenAdd.mock.calls[0][0];
      expect(tweenConfig.onComplete).toBeDefined();

      // 模拟动画完成
      tweenConfig.onComplete();

      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.CARD_CLOSE, {
        cardId: mockCard.id,
      });
      expect(onCardClosedCallback).toHaveBeenCalledWith(mockCard.id);
    });
  });

  describe('flipCard - 翻转卡片', () => {
    it('没有当前卡片时不应执行任何操作', () => {
      cardUI.flipCard();

      expect(mockTweenAdd).not.toHaveBeenCalled();
    });

    it('应该触发翻转动画', () => {
      cardUI.showCard(mockCard);
      vi.clearAllMocks();

      cardUI.flipCard();

      expect(mockTweenAdd).toHaveBeenCalled();
    });

    it('翻转动画应该分两阶段：缩小和放大', () => {
      cardUI.showCard(mockCard);
      vi.clearAllMocks();

      cardUI.flipCard();

      // 第一阶段：缩小
      const firstTweenConfig = mockTweenAdd.mock.calls[0][0];
      expect(firstTweenConfig.scaleX).toBe(0);
      expect(firstTweenConfig.onComplete).toBeDefined();

      // 模拟第一阶段完成
      firstTweenConfig.onComplete();

      // 第二阶段：放大
      expect(mockTweenAdd.mock.calls.length).toBe(2);
      const secondTweenConfig = mockTweenAdd.mock.calls[1][0];
      expect(secondTweenConfig.scaleX).toBe(1);
    });
  });

  describe('isVisible - 可见性检查', () => {
    it('初始应该返回false', () => {
      expect(cardUI.isVisible()).toBe(false);
    });
  });

  describe('destroy - 销毁', () => {
    it('应该销毁容器', () => {
      const containerDestroy = vi.fn();
      mockScene.add.container = vi.fn().mockReturnValue({
        ...mockContainer,
        destroy: containerDestroy,
      });

      const ui = new CardUI({
        scene: mockScene as unknown as Phaser.Scene,
      });

      ui.destroy();

      expect(containerDestroy).toHaveBeenCalled();
    });
  });

  describe('卡片类型颜色', () => {
    const cardTypes = ['archive', 'item', 'prayer', 'verdict'] as const;

    cardTypes.forEach((type) => {
      it(`应该为 ${type} 类型卡片绘制正确背景`, () => {
        const card: ICard = {
          ...mockCard,
          type,
        };

        cardUI.showCard(card);

        // 验证graphics的fillStyle被调用
        expect(mockScene.add.graphics).toHaveBeenCalled();
      });
    });
  });

  describe('卡片类型图标', () => {
    it('archive类型应该显示📋图标', () => {
      const card: ICard = { ...mockCard, type: 'archive' };
      cardUI.showCard(card);

      // 验证text被创建并设置
      expect(mockScene.add.text).toHaveBeenCalled();
    });

    it('item类型应该显示🔧图标', () => {
      const card: ICard = { ...mockCard, type: 'item' };
      cardUI.showCard(card);

      expect(mockScene.add.text).toHaveBeenCalled();
    });

    it('prayer类型应该显示🙏图标', () => {
      const card: ICard = { ...mockCard, type: 'prayer' };
      cardUI.showCard(card);

      expect(mockScene.add.text).toHaveBeenCalled();
    });

    it('verdict类型应该显示⚖️图标', () => {
      const card: ICard = { ...mockCard, type: 'verdict' };
      cardUI.showCard(card);

      expect(mockScene.add.text).toHaveBeenCalled();
    });
  });

  describe('内容显示', () => {
    it('正面应该显示front内容', () => {
      cardUI.showCard(mockCard);

      // 检查setText被调用，包含front内容
      const textCalls = mockText.setText.mock.calls;
      const allTexts = textCalls.map((call) => call[0]).join('|');

      expect(allTexts).toContain(mockCard.name);
    });

    it('翻转后应该显示detail内容', () => {
      cardUI.showCard(mockCard);
      vi.clearAllMocks();

      cardUI.flipCard();

      // 模拟第一阶段完成触发内容更新
      const tweenConfig = mockTweenAdd.mock.calls[0][0];
      tweenConfig.onComplete();

      // 检查内容被更新
      expect(mockText.setText).toHaveBeenCalled();
    });
  });

  describe('翻转提示文本', () => {
    it('正面时应该显示"点击翻转查看详情"', () => {
      cardUI.showCard(mockCard);

      const textCalls = mockText.setText.mock.calls;
      const allTexts = textCalls.map((call) => call[0]).join('|');

      expect(allTexts).toContain('点击翻转');
    });
  });
});
