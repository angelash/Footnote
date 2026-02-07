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

const mockGraphics = {
  fillStyle: vi.fn().mockReturnThis(),
  fillRoundedRect: vi.fn().mockReturnThis(),
  lineStyle: vi.fn().mockReturnThis(),
  strokeRoundedRect: vi.fn().mockReturnThis(),
  clear: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
};

const createMockScene = () => ({
  scale: { width: 720, height: 1280 },
  add: {
    image: vi.fn().mockReturnValue({ ...mockGameObject }),
    sprite: vi.fn().mockReturnValue({ ...mockGameObject }),
    text: vi.fn().mockReturnValue({ ...mockText }),
    graphics: vi.fn().mockReturnValue({ ...mockGraphics }),
    container: vi.fn().mockReturnValue({
      ...mockGameObject,
      setPosition: vi.fn().mockReturnThis(),
      setName: vi.fn().mockReturnThis(),
      add: vi.fn().mockReturnThis(),
      disableInteractive: vi.fn().mockReturnThis(),
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
  time: {
    addEvent: vi.fn().mockReturnValue({
      destroy: vi.fn(),
    }),
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

    it('交互物件的 action 数据应该被正确设置（供 InteractionSystem 使用）', () => {
      // 交互物件的点击响应已移至 InteractionSystem 统一处理
      // SceneAssembler 只负责设置 action 数据，由 InteractionSystem 读取并处理点击
      const configWithInteractive: ISceneConfig = {
        ...mockSceneConfig,
        objects: [interactiveObject],
      };

      assembler.build(configWithInteractive);

      const resolvedObject = mockAssetResolver.resolveObject.mock.results[0].value.gameObject;

      // 验证 action 数据被设置（InteractionSystem 会读取这个数据）
      expect(resolvedObject.setData).toHaveBeenCalledWith('action', interactiveObject.interactive!.action);
      
      // 验证 testid 被设置（用于测试和识别）
      // 注意: interactiveObject.id 是 'test_interactive'
      expect(resolvedObject.setData).toHaveBeenCalledWith('testid', 'test_interactive');
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

  describe('Zone 类型物件', () => {
    const zoneObject: ISceneObjectConfig = {
      id: 'zone_exit',
      x: 300,
      y: 500,
      type: 'zone',
      width: 150,
      height: 80,
      label: '出口',
      interactive: {
        cursor: true,
        action: {
          type: 'gotoZone',
          zoneId: 'C0-Z2',
        },
      },
    };

    it('应该创建 zone 容器', () => {
      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [zoneObject],
      };

      const result = assembler.build(config);

      expect(result.objects.length).toBeGreaterThan(0);
      expect(mockScene.add.container).toHaveBeenCalled();
    });

    it('zone 应该使用配置的 width/height', () => {
      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [zoneObject],
      };

      assembler.build(config);

      // Container 被创建
      expect(mockScene.add.container).toHaveBeenCalledWith(zoneObject.x, zoneObject.y);
    });

    it('没有 width/height 时应该使用默认值', () => {
      const zoneWithoutSize: ISceneObjectConfig = {
        ...zoneObject,
        width: undefined,
        height: undefined,
      };

      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [zoneWithoutSize],
      };

      // 不应抛错
      expect(() => assembler.build(config)).not.toThrow();
    });

    it('zone 应该设置交互数据', () => {
      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [zoneObject],
      };

      assembler.build(config);

      // Container 的 setData 应该被调用
      const container = mockScene.add.container.mock.results[0]?.value;
      expect(container?.setData).toHaveBeenCalledWith('action', zoneObject.interactive?.action);
    });

    it('zone 应该设置 testid 数据', () => {
      const zoneWithTestId: ISceneObjectConfig = {
        ...zoneObject,
        interactive: {
          ...zoneObject.interactive!,
          testid: 'zone_test_id',
        },
      };

      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [zoneWithTestId],
      };

      assembler.build(config);

      const container = mockScene.add.container.mock.results[0]?.value;
      expect(container?.setData).toHaveBeenCalledWith('testid', 'zone_test_id');
    });

    it('zone 应该设置深度', () => {
      const zoneWithDepth: ISceneObjectConfig = {
        ...zoneObject,
        depth: 100,
      };

      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [zoneWithDepth],
      };

      assembler.build(config);

      const container = mockScene.add.container.mock.results[0]?.value;
      expect(container?.setDepth).toHaveBeenCalledWith(100);
    });

    it('zone 没有指定深度时应该使用默认深度', () => {
      const zoneWithoutDepth: ISceneObjectConfig = {
        ...zoneObject,
        depth: undefined,
      };

      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [zoneWithoutDepth],
      };

      assembler.build(config);

      const container = mockScene.add.container.mock.results[0]?.value;
      // 默认 zone 深度为 5
      expect(container?.setDepth).toHaveBeenCalledWith(5);
    });
  });

  describe('物件尺寸估算', () => {
    it('card 类型交互应该使用 60x60 尺寸', () => {
      const cardObject: ISceneObjectConfig = {
        ...mockObjectConfig,
        interactive: {
          action: {
            type: 'card',
            cardId: 'card_001',
          },
        },
      };

      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [cardObject],
      };

      assembler.build(config);

      const billboardConfig = mockAssetResolver.resolveObject.mock.calls[0][1];
      expect(billboardConfig.width).toBe(60);
      expect(billboardConfig.height).toBe(60);
    });

    it('dialogue 类型交互应该使用 70x70 尺寸', () => {
      const dialogueObject: ISceneObjectConfig = {
        ...mockObjectConfig,
        interactive: {
          action: {
            type: 'dialogue',
            dialogueId: 'dlg_001',
          },
        },
      };

      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [dialogueObject],
      };

      assembler.build(config);

      const billboardConfig = mockAssetResolver.resolveObject.mock.calls[0][1];
      expect(billboardConfig.width).toBe(70);
      expect(billboardConfig.height).toBe(70);
    });

    it('有 scale 的物件应该相应调整尺寸', () => {
      const scaledObject: ISceneObjectConfig = {
        ...mockObjectConfig,
        scale: 2,
      };

      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [scaledObject],
      };

      assembler.build(config);

      const billboardConfig = mockAssetResolver.resolveObject.mock.calls[0][1];
      expect(billboardConfig.width).toBe(100); // 50 * 2
      expect(billboardConfig.height).toBe(100); // 50 * 2
    });
  });

  describe('更多 Zone 类型推断', () => {
    const additionalZoneTypes = [
      { zoneId: 'C0-Z2', expected: 'life' },
      { zoneId: 'C0-Z3', expected: 'life' },
      { zoneId: 'C1-Z2', expected: 'municipal' },
      { zoneId: 'C1-Z3', expected: 'archive' },
      { zoneId: 'C2-Z1', expected: 'municipal' },
      { zoneId: 'C3-Z5', expected: 'temple' },
      { zoneId: 'C4-Z7', expected: 'temple' },
      { zoneId: 'CF-Z1', expected: 'anomaly' },
      { zoneId: 'RV-Z1', expected: 'edge' },
    ];

    additionalZoneTypes.forEach(({ zoneId, expected }) => {
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
  });

  describe('物件子类型推断 - 更多模式', () => {
    const subtypeTests = [
      { texture: 'obj_lamp_ceiling', subtype: 'lamp' },
      { texture: 'obj_light_wall', subtype: 'lamp' },
      { texture: 'obj_tree_small', subtype: 'plant' },
      { texture: 'obj_door_wooden', subtype: 'door' },
      { texture: 'obj_gate_iron', subtype: 'door' },
      { texture: 'obj_monitor_old', subtype: 'monitor' },
      { texture: 'obj_screen_cracked', subtype: 'monitor' },
      { texture: 'obj_computer_terminal', subtype: 'monitor' },
      { texture: 'obj_filing_cabinet', subtype: 'filing_cabinet' },
      { texture: 'obj_drawer_unit', subtype: 'filing_cabinet' },
      { texture: 'obj_altar_stone', subtype: 'altar' },
      { texture: 'obj_crack_wall', subtype: 'crack' },
      { texture: 'obj_rift_floor', subtype: 'crack' },
      { texture: 'obj_sign_warning', subtype: 'sign' },
      { texture: 'obj_notice_board', subtype: 'sign' },
      { texture: 'obj_chair_wooden', subtype: 'chair' },
      { texture: 'obj_seat_cushion', subtype: 'chair' },
      { texture: 'obj_candle_lit', subtype: 'candle' },
      { texture: 'obj_rune_ancient', subtype: 'rune' },
      { texture: 'obj_symbol_magic', subtype: 'rune' },
    ];

    subtypeTests.forEach(({ texture, subtype }) => {
      it(`${texture} 应该推断为 ${subtype} 子类型`, () => {
        const obj: ISceneObjectConfig = {
          ...mockObjectConfig,
          texture,
        };

        const config: ISceneConfig = {
          ...mockSceneConfig,
          objects: [obj],
        };

        assembler.build(config);

        const billboardConfig = mockAssetResolver.resolveObject.mock.calls[0][1];
        expect(billboardConfig.subtype).toBe(subtype);
      });
    });
  });

  describe('物件没有 texture 时', () => {
    it('没有 texture 的非 zone 物件应该跳过创建', () => {
      const objWithoutTexture: ISceneObjectConfig = {
        id: 'obj_no_texture',
        x: 100,
        y: 200,
        type: 'image',
        // texture 未设置
      };

      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [objWithoutTexture],
      };

      assembler.build(config);

      // assetResolver.resolveObject 不应该被调用
      expect(mockAssetResolver.resolveObject).not.toHaveBeenCalled();
    });
  });

  describe('interactable 类型推断', () => {
    it('有交互但没有特定动作类型应该推断为 interactable', () => {
      const interactableObject: ISceneObjectConfig = {
        ...mockObjectConfig,
        interactive: {
          cursor: true,
          action: {
            type: 'custom' as never, // 非标准类型
          },
        },
      };

      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [interactableObject],
      };

      assembler.build(config);

      const billboardConfig = mockAssetResolver.resolveObject.mock.calls[0][1];
      expect(billboardConfig.type).toBe('interactable');
    });
  });

  describe('Hover 效果', () => {
    it('白盒物件应该设置 hover cursor', () => {
      const interactiveObject: ISceneObjectConfig = {
        ...mockObjectConfig,
        interactive: {
          cursor: true,
          action: {
            type: 'dialogue',
            dialogueId: 'dlg_test',
          },
        },
      };

      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [interactiveObject],
      };

      assembler.build(config);

      const resolvedObject = mockAssetResolver.resolveObject.mock.results[0].value.gameObject;
      // 应该设置 pointerover 和 pointerout 事件
      expect(resolvedObject.on).toHaveBeenCalledWith('pointerover', expect.any(Function));
      expect(resolvedObject.on).toHaveBeenCalledWith('pointerout', expect.any(Function));
    });
  });

  describe('存储 label 数据', () => {
    it('物件应该存储 label 数据', () => {
      const objectWithLabel: ISceneObjectConfig = {
        ...mockObjectConfig,
        label: '测试标签',
        interactive: {
          cursor: true,
        },
      };

      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [objectWithLabel],
      };

      assembler.build(config);

      const resolvedObject = mockAssetResolver.resolveObject.mock.results[0].value.gameObject;
      expect(resolvedObject.setData).toHaveBeenCalledWith('label', '测试标签');
    });
  });

  describe('没有 label 的地标点', () => {
    it('没有 label 的交互物件应该使用 id 作为 label', () => {
      const objectWithoutLabel: ISceneObjectConfig = {
        ...mockObjectConfig,
        id: 'obj_test_id',
        label: undefined,
        interactive: { cursor: true },
      };

      const config: ISceneConfig = {
        ...mockSceneConfig,
        objects: [objectWithoutLabel],
      };

      assembler.build(config);

      const bgCall = mockAssetResolver.resolveBackground.mock.calls[0];
      expect(bgCall[1].landmarks[0].label).toBe('obj_test_id');
    });
  });
});
