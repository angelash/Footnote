/**
 * SceneAssembler 单元测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Phaser geometry FIRST (hoisted)
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
    Events: {
      EventEmitter: class MockEventEmitter {
        private _listeners: Map<string | symbol, Set<(...args: unknown[]) => void>> = new Map();
        emit(event: string | symbol, ...args: unknown[]): boolean {
          const listeners = this._listeners.get(event);
          if (listeners) {
            listeners.forEach((fn) => fn(...args));
            return true;
          }
          return false;
        }
        on(event: string | symbol, fn: (...args: unknown[]) => void): this {
          if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
          }
          this._listeners.get(event)!.add(fn);
          return this;
        }
        once(event: string | symbol, fn: (...args: unknown[]) => void): this {
          const wrapper = (...args: unknown[]) => {
            this.off(event, wrapper);
            fn(...args);
          };
          return this.on(event, wrapper);
        }
        off(event: string | symbol, fn?: (...args: unknown[]) => void): this {
          if (fn) {
            this._listeners.get(event)?.delete(fn);
          } else {
            this._listeners.delete(event);
          }
          return this;
        }
        removeAllListeners(): this {
          this._listeners.clear();
          return this;
        }
        listenerCount(event: string | symbol): number {
          return this._listeners.get(event)?.size ?? 0;
        }
      },
    },
  },
}));

// Mock AssetResolver - use factory function with inline mocks
vi.mock('@/systems/whitebox/AssetResolver', () => {
  return {
    assetResolver: {
      init: vi.fn(),
      isInitialized: vi.fn().mockReturnValue(true),
      resolveBackground: vi.fn().mockReturnValue({
        gameObject: {
          destroy: vi.fn(),
          setPosition: vi.fn(),
          setDepth: vi.fn(),
        },
        isWhitebox: true,
      }),
      resolveObject: vi.fn().mockReturnValue({
        gameObject: {
          destroy: vi.fn(),
          setPosition: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setName: vi.fn().mockReturnThis(),
          setData: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
        },
        isWhitebox: true,
      }),
    },
  };
});

// Mock assetMode config
vi.mock('@/config/assetMode.config', () => ({
  useProductionAsset: vi.fn().mockReturnValue(false),
}));

// Mock game config
vi.mock('@/config/game.config', () => ({
  TEXT_STYLES: {
    MUTED: { fontFamily: 'Arial', color: '#686868' },
  },
}));

vi.mock('@/config/ui.config', () => ({
  UI_FONT_SIZE: {
    TINY: '14px',
  },
}));

const mockGameObject = {
  destroy: vi.fn(),
  setOrigin: vi.fn().mockReturnThis(),
  setDisplaySize: vi.fn().mockReturnThis(),
  setAlpha: vi.fn().mockReturnThis(),
  setScale: vi.fn().mockReturnThis(),
  setDepth: vi.fn().mockReturnThis(),
  setRotation: vi.fn().mockReturnThis(),
  setInteractive: vi.fn().mockReturnThis(),
  setData: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  play: vi.fn().mockReturnThis(),
};

const mockText = {
  destroy: vi.fn(),
  setOrigin: vi.fn().mockReturnThis(),
  setDepth: vi.fn().mockReturnThis(),
};

const createMockScene = () => ({
  scale: { width: 720, height: 1280 },
  add: {
    image: vi.fn().mockReturnValue({ ...mockGameObject }),
    sprite: vi.fn().mockReturnValue({ ...mockGameObject }),
    text: vi.fn().mockReturnValue({ ...mockText }),
    container: vi.fn().mockReturnValue({
      ...mockGameObject,
      setPosition: vi.fn().mockReturnThis(),
      setName: vi.fn().mockReturnThis(),
    }),
  },
  textures: {
    exists: vi.fn().mockReturnValue(false),
  },
  anims: {
    exists: vi.fn().mockReturnValue(false),
    create: vi.fn(),
    generateFrameNumbers: vi.fn().mockReturnValue([]),
  },
  input: {
    setDefaultCursor: vi.fn(),
  },
});

import { SceneAssembler } from '@/systems/scene/SceneAssembler';
import { assetResolver } from '@/systems/whitebox/AssetResolver';
import type { ISceneConfig, ISceneObjectConfig } from '@/types/scene';

// Get mocked versions
const mockAssetResolver = vi.mocked(assetResolver);

describe('SceneAssembler', () => {
  let assembler: SceneAssembler;
  let mockScene: ReturnType<typeof createMockScene>;
  let mockCallbacks: {
    onAction: ReturnType<typeof vi.fn>;
  };

  const mockSceneConfig: ISceneConfig = {
    id: 'C0-Z1',
    title: '测试场景',
    background: {
      texture: 'bg_test',
      x: 0,
      y: 0,
    },
    objects: [],
  };

  const mockObjectConfig: ISceneObjectConfig = {
    id: 'obj_test',
    texture: 'obj_test_texture',
    x: 100,
    y: 200,
    type: 'image',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene = createMockScene();
    mockCallbacks = {
      onAction: vi.fn(),
    };

    // 重置AssetResolver mock
    mockAssetResolver.isInitialized.mockReturnValue(true);
    
    // Reset mock implementations to return fresh objects
    mockAssetResolver.resolveBackground.mockReturnValue({
      gameObject: {
        destroy: vi.fn(),
        setPosition: vi.fn(),
        setDepth: vi.fn(),
      },
      isWhitebox: true,
    });
    
    mockAssetResolver.resolveObject.mockReturnValue({
      gameObject: {
        destroy: vi.fn(),
        setPosition: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        setName: vi.fn().mockReturnThis(),
        setData: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
      },
      isWhitebox: true,
    });

    assembler = new SceneAssembler(
      mockScene as unknown as Phaser.Scene,
      mockCallbacks
    );
  });

  describe('初始化', () => {
    it('应该初始化AssetResolver（如果未初始化）', () => {
      mockAssetResolver.isInitialized.mockReturnValue(false);

      new SceneAssembler(
        mockScene as unknown as Phaser.Scene,
        mockCallbacks
      );

      expect(mockAssetResolver.init).toHaveBeenCalledWith(mockScene);
    });

    it('已初始化时不应重复初始化', () => {
      mockAssetResolver.isInitialized.mockReturnValue(true);
      vi.clearAllMocks();

      new SceneAssembler(
        mockScene as unknown as Phaser.Scene,
        mockCallbacks
      );

      expect(mockAssetResolver.init).not.toHaveBeenCalled();
    });
  });

  describe('build - 构建场景', () => {
    it('应该返回构建的场景对象', () => {
      const result = assembler.build(mockSceneConfig);

      expect(result).toHaveProperty('objects');
      expect(Array.isArray(result.objects)).toBe(true);
    });

    it('应该创建背景', () => {
      assembler.build(mockSceneConfig);

      expect(mockAssetResolver.resolveBackground).toHaveBeenCalled();
    });

    it('没有背景配置时不应创建背景', () => {
      const configWithoutBg = { ...mockSceneConfig, background: undefined };

      assembler.build(configWithoutBg);

      expect(mockAssetResolver.resolveBackground).not.toHaveBeenCalled();
    });

    it('应该创建所有物件', () => {
      const configWithObjects: ISceneConfig = {
        ...mockSceneConfig,
        objects: [
          { ...mockObjectConfig, id: 'obj_1' },
          { ...mockObjectConfig, id: 'obj_2' },
          { ...mockObjectConfig, id: 'obj_3' },
        ],
      };

      const result = assembler.build(configWithObjects);

      // 背景 + 3个物件
      expect(result.objects.length).toBeGreaterThan(0);
    });
  });

  describe('destroy - 销毁场景', () => {
    it('应该销毁所有游戏对象', () => {
      const mockObjects = [
        { destroy: vi.fn() },
        { destroy: vi.fn() },
        { destroy: vi.fn() },
      ];

      assembler.destroy({ objects: mockObjects as unknown as Phaser.GameObjects.GameObject[] });

      mockObjects.forEach((obj) => {
        expect(obj.destroy).toHaveBeenCalled();
      });
    });

    it('null参数不应报错', () => {
      expect(() => assembler.destroy(null)).not.toThrow();
    });

    it('undefined参数不应报错', () => {
      expect(() => assembler.destroy(undefined)).not.toThrow();
    });
  });

  describe('白盒模式物件创建', () => {
    it('应该使用AssetResolver创建白盒物件', () => {
      const configWithObject: ISceneConfig = {
        ...mockSceneConfig,
        objects: [mockObjectConfig],
      };

      assembler.build(configWithObject);

      expect(mockAssetResolver.resolveObject).toHaveBeenCalled();
    });

    it('应该设置物件位置', () => {
      const configWithObject: ISceneConfig = {
        ...mockSceneConfig,
        objects: [mockObjectConfig],
      };

      assembler.build(configWithObject);

      const resolvedObject = mockAssetResolver.resolveObject.mock.results[0].value.gameObject;
      expect(resolvedObject.setPosition).toHaveBeenCalledWith(mockObjectConfig.x, mockObjectConfig.y);
    });

    it('应该设置物件深度', () => {
      const objWithDepth: ISceneObjectConfig = {
        ...mockObjectConfig,
        depth: 500,
      };

      const configWithObject: ISceneConfig = {
        ...mockSceneConfig,
        objects: [objWithDepth],
      };

      assembler.build(configWithObject);

      const resolvedObject = mockAssetResolver.resolveObject.mock.results[0].value.gameObject;
      expect(resolvedObject.setDepth).toHaveBeenCalledWith(500);
    });

    it('没有指定深度时应该使用y坐标', () => {
      const configWithObject: ISceneConfig = {
        ...mockSceneConfig,
        objects: [mockObjectConfig],
      };

      assembler.build(configWithObject);

      const resolvedObject = mockAssetResolver.resolveObject.mock.results[0].value.gameObject;
      expect(resolvedObject.setDepth).toHaveBeenCalledWith(mockObjectConfig.y);
    });
  });

  describe('交互物件', () => {
    const interactiveObject: ISceneObjectConfig = {
      ...mockObjectConfig,
      interactive: {
        cursor: true,
        action: {
          type: 'dialogue',
          dialogueId: 'dlg_test',
        },
        testid: 'test_interactive',
      },
    };

    it('应该设置交互', () => {
      const configWithInteractive: ISceneConfig = {
        ...mockSceneConfig,
        objects: [interactiveObject],
      };

      assembler.build(configWithInteractive);

      const resolvedObject = mockAssetResolver.resolveObject.mock.results[0].value.gameObject;
      expect(resolvedObject.setInteractive).toHaveBeenCalled();
    });

    it('应该设置testid数据', () => {
      const configWithInteractive: ISceneConfig = {
        ...mockSceneConfig,
        objects: [interactiveObject],
      };

      assembler.build(configWithInteractive);

      const resolvedObject = mockAssetResolver.resolveObject.mock.results[0].value.gameObject;
      expect(resolvedObject.setData).toHaveBeenCalledWith('testid', 'test_interactive');
    });

    it('应该设置action数据', () => {
      const configWithInteractive: ISceneConfig = {
        ...mockSceneConfig,
        objects: [interactiveObject],
      };

      assembler.build(configWithInteractive);

      const resolvedObject = mockAssetResolver.resolveObject.mock.results[0].value.gameObject;
      expect(resolvedObject.setData).toHaveBeenCalledWith('action', interactiveObject.interactive!.action);
    });

    // TODO: 交互物件的点击响应已移至 InteractionSystem 统一处理，此测试需要重新设计
    it.skip('点击时应该触发回调', () => {
      const configWithInteractive: ISceneConfig = {
        ...mockSceneConfig,
        objects: [interactiveObject],
      };

      assembler.build(configWithInteractive);

      const resolvedObject = mockAssetResolver.resolveObject.mock.results[0].value.gameObject;

      // 获取pointerdown回调
      const pointerdownCall = resolvedObject.on.mock.calls.find(
        (call) => call[0] === 'pointerdown'
      );
      expect(pointerdownCall).toBeDefined();

      // 模拟点击
      pointerdownCall[1]();

      expect(mockCallbacks.onAction).toHaveBeenCalledWith(
        interactiveObject.interactive!.action,
        interactiveObject.id
      );
    });

    it('action.type为none时不应设置点击回调', () => {
      const noActionObject: ISceneObjectConfig = {
        ...mockObjectConfig,
        interactive: {
          cursor: true,
          action: {
            type: 'none',
          },
        },
      };

      const configWithInteractive: ISceneConfig = {
        ...mockSceneConfig,
        objects: [noActionObject],
      };

      assembler.build(configWithInteractive);

      const resolvedObject = mockAssetResolver.resolveObject.mock.results[0].value.gameObject;

      // 不应该有pointerdown回调
      const pointerdownCall = resolvedObject.on.mock.calls.find(
        (call) => call[0] === 'pointerdown'
      );
      expect(pointerdownCall).toBeUndefined();
    });
  });

  describe('正式资源物件创建', () => {
    beforeEach(() => {
      // 模拟正式资源存在
      mockScene.textures.exists.mockReturnValue(true);

      // 重新mock assetMode
      vi.doMock('@/config/assetMode.config', () => ({
        useProductionAsset: vi.fn().mockReturnValue(true),
      }));
    });

    it('纹理不存在时应该使用白盒模式', () => {
      mockScene.textures.exists.mockReturnValue(false);

      const configWithObject: ISceneConfig = {
        ...mockSceneConfig,
        objects: [mockObjectConfig],
      };

      assembler.build(configWithObject);

      expect(mockAssetResolver.resolveObject).toHaveBeenCalled();
    });
  });

  describe('物件类型推断', () => {
    it('卡片动作应该推断为item类型', () => {
      const cardObject: ISceneObjectConfig = {
        ...mockObjectConfig,
        interactive: {
          action: {
            type: 'card',
            cardId: 'card_001',
          },
        },
      };

      const configWithCard: ISceneConfig = {
        ...mockSceneConfig,
        objects: [cardObject],
      };

      assembler.build(configWithCard);

      const billboardConfig = mockAssetResolver.resolveObject.mock.calls[0][1];
      expect(billboardConfig.type).toBe('item');
    });

    it('对话动作应该推断为npc_spot类型', () => {
      const dialogueObject: ISceneObjectConfig = {
        ...mockObjectConfig,
        interactive: {
          action: {
            type: 'dialogue',
            dialogueId: 'dlg_001',
          },
        },
      };

      const configWithDialogue: ISceneConfig = {
        ...mockSceneConfig,
        objects: [dialogueObject],
      };

      assembler.build(configWithDialogue);

      const billboardConfig = mockAssetResolver.resolveObject.mock.calls[0][1];
      expect(billboardConfig.type).toBe('npc_spot');
    });

    it('区域跳转动作应该推断为exit类型', () => {
      const exitObject: ISceneObjectConfig = {
        ...mockObjectConfig,
        interactive: {
          action: {
            type: 'gotoZone',
            zoneId: 'C0-Z2',
          },
        },
      };

      const configWithExit: ISceneConfig = {
        ...mockSceneConfig,
        objects: [exitObject],
      };

      assembler.build(configWithExit);

      const billboardConfig = mockAssetResolver.resolveObject.mock.calls[0][1];
      expect(billboardConfig.type).toBe('exit');
    });

    it('无交互物件应该推断为decoration类型', () => {
      const configWithDecoration: ISceneConfig = {
        ...mockSceneConfig,
        objects: [mockObjectConfig],
      };

      assembler.build(configWithDecoration);

      const billboardConfig = mockAssetResolver.resolveObject.mock.calls[0][1];
      expect(billboardConfig.type).toBe('decoration');
    });
  });

  describe('物件子类型推断', () => {
    it('应该从纹理名称推断子类型', () => {
      const bedObject: ISceneObjectConfig = {
        ...mockObjectConfig,
        texture: 'obj_bed_double',
      };

      const configWithBed: ISceneConfig = {
        ...mockSceneConfig,
        objects: [bedObject],
      };

      assembler.build(configWithBed);

      const billboardConfig = mockAssetResolver.resolveObject.mock.calls[0][1];
      expect(billboardConfig.subtype).toBe('bed');
    });

    it('应该从label推断子类型', () => {
      const deskObject: ISceneObjectConfig = {
        ...mockObjectConfig,
        texture: 'some_texture',
        label: '写字桌 desk',
      };

      const configWithDesk: ISceneConfig = {
        ...mockSceneConfig,
        objects: [deskObject],
      };

      assembler.build(configWithDesk);

      const billboardConfig = mockAssetResolver.resolveObject.mock.calls[0][1];
      expect(billboardConfig.subtype).toBe('desk');
    });

    it('无法推断时应该返回undefined', () => {
      const unknownObject: ISceneObjectConfig = {
        ...mockObjectConfig,
        texture: 'unknown_texture',
      };

      const configWithUnknown: ISceneConfig = {
        ...mockSceneConfig,
        objects: [unknownObject],
      };

      assembler.build(configWithUnknown);

      const billboardConfig = mockAssetResolver.resolveObject.mock.calls[0][1];
      expect(billboardConfig.subtype).toBeUndefined();
    });
  });

  describe('Zone类型推断', () => {
    const zoneTypes = [
      { zoneId: 'C0-Z1', expected: 'life' },
      { zoneId: 'C0-Z4', expected: 'municipal' },
      { zoneId: 'C1-Z1', expected: 'municipal' },
      { zoneId: 'C2-Z3', expected: 'clinic' },
      { zoneId: 'C2-Z5', expected: 'temple' },
      { zoneId: 'C2-Z7', expected: 'edge' },
      { zoneId: 'C5-Z6', expected: 'anomaly' },
    ];

    zoneTypes.forEach(({ zoneId, expected }) => {
      it(`${zoneId} 应该推断为 ${expected} 类型`, () => {
        const config: ISceneConfig = {
          ...mockSceneConfig,
          id: zoneId,
        };

        assembler.build(config);

        const bgCall = mockAssetResolver.resolveBackground.mock.calls[0];
        expect(bgCall[1].zoneType).toBe(expected);
      });
    });

    it('未知章节应该使用默认类型', () => {
      const config: ISceneConfig = {
        ...mockSceneConfig,
        id: 'X9-Z1',
      };

      assembler.build(config);

      const bgCall = mockAssetResolver.resolveBackground.mock.calls[0];
      expect(bgCall[1].zoneType).toBe('default');
    });
  });

  describe('地标点提取', () => {
    it('应该从交互物件提取地标点', () => {
      const configWithInteractive: ISceneConfig = {
        ...mockSceneConfig,
        objects: [
          {
            ...mockObjectConfig,
            id: 'obj_1',
            x: 100,
            y: 200,
            label: '物件1',
            interactive: { cursor: true },
          },
          {
            ...mockObjectConfig,
            id: 'obj_2',
            x: 300,
            y: 400,
            label: '物件2',
            interactive: { cursor: true },
          },
        ],
      };

      assembler.build(configWithInteractive);

      const bgCall = mockAssetResolver.resolveBackground.mock.calls[0];
      expect(bgCall[1].landmarks.length).toBe(2);
      expect(bgCall[1].landmarks[0]).toMatchObject({ x: 100, y: 200, label: '物件1' });
    });

    it('最多提取5个地标点', () => {
      const objects: ISceneObjectConfig[] = [];
      for (let i = 0; i < 10; i++) {
        objects.push({
          ...mockObjectConfig,
          id: `obj_${i}`,
          x: i * 50,
          y: i * 50,
          interactive: { cursor: true },
        });
      }

      const configWithManyObjects: ISceneConfig = {
        ...mockSceneConfig,
        objects,
      };

      assembler.build(configWithManyObjects);

      const bgCall = mockAssetResolver.resolveBackground.mock.calls[0];
      expect(bgCall[1].landmarks.length).toBeLessThanOrEqual(5);
    });
  });
});
