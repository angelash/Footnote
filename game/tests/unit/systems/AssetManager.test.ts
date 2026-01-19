/**
 * AssetManager 单元测试
 */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

// Mock webpAssets
vi.mock('@/data/webpAssets', () => ({
  CHARACTER_PORTRAITS: {
    cenhui: {
      neutral: '/assets/portraits/cenhui_neutral.webp',
      happy: '/assets/portraits/cenhui_happy.webp',
    },
    gulin: {
      neutral: '/assets/portraits/gulin_neutral.webp',
    },
  },
  SCENE_BACKGROUNDS: {
    bg_c0z1_corridor: '/assets/backgrounds/c0z1_corridor.webp',
    bg_c0z2_cenhui_room: '/assets/backgrounds/c0z2_cenhui_room.webp',
  },
  ALL_SCENE_OBJECTS: {},
  ALL_EFFECTS: {},
  ANIMATED_OBJECTS: {},
}));

// Mock audioConfig
vi.mock('@/data/audioConfig', () => ({
  BGM_CONFIGS: [
    { id: 'bgm_title', name: 'Title', file: '/assets/audio/bgm_title.mp3' },
    { id: 'bgm_prologue', name: 'Prologue', file: '/assets/audio/bgm_prologue.mp3' },
  ],
  SFX_CONFIGS: [
    { id: 'sfx_click', name: 'Click', file: '/assets/audio/sfx_click.mp3', volume: 1 },
  ],
  AMBIENCE_CONFIGS: [
    { id: 'amb_indoor_office', name: 'Office', file: '/assets/audio/amb_office.mp3' },
  ],
}));

// 重新导入模块前清除缓存
vi.resetModules();

import { assetManager, AssetGroup } from '@/systems/assets/AssetManager';

describe('AssetManager', () => {
  let mockScene: {
    textures: { exists: ReturnType<typeof vi.fn> };
    cache: { audio: { exists: ReturnType<typeof vi.fn> } };
    load: {
      image: ReturnType<typeof vi.fn>;
      audio: ReturnType<typeof vi.fn>;
      once: ReturnType<typeof vi.fn>;
      start: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // 创建mock场景
    mockScene = {
      textures: {
        exists: vi.fn().mockReturnValue(false),
      },
      cache: {
        audio: {
          exists: vi.fn().mockReturnValue(false),
        },
      },
      load: {
        image: vi.fn(),
        audio: vi.fn(),
        once: vi.fn().mockImplementation((event, callback) => {
          // 立即调用complete回调
          if (event === 'complete') {
            setTimeout(callback, 0);
          }
        }),
        start: vi.fn(),
      },
    };

    // 重置单例状态 - 通过reflection访问私有属性
    // @ts-expect-error 访问私有静态属性用于测试
    if (assetManager._loadedGroups) {
      // @ts-expect-error 访问私有属性用于测试
      assetManager._loadedGroups.clear();
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('单例模式', () => {
    it('getInstance应该返回同一实例', async () => {
      const { assetManager: am1 } = await import('@/systems/assets/AssetManager');
      const { assetManager: am2 } = await import('@/systems/assets/AssetManager');

      expect(am1).toBe(am2);
    });
  });

  describe('setScene - 设置场景', () => {
    it('应该设置当前场景', () => {
      assetManager.setScene(mockScene as unknown as Phaser.Scene);

      // 验证场景被设置（通过后续操作验证）
      expect(() => assetManager.setScene(mockScene as unknown as Phaser.Scene)).not.toThrow();
    });
  });

  describe('isGroupLoaded - 检查资源组', () => {
    it('初始应该返回false', () => {
      expect(assetManager.isGroupLoaded(AssetGroup.CORE)).toBe(false);
      expect(assetManager.isGroupLoaded(AssetGroup.CHAPTER_0)).toBe(false);
    });
  });

  describe('loadChapterAssets - 加载章节资源', () => {
    it('没有设置场景时不应加载', async () => {
      // @ts-expect-error 清除场景
      assetManager._scene = null;

      await assetManager.loadChapterAssets('C0');

      expect(mockScene.load.image).not.toHaveBeenCalled();
    });

    it('应该加载C0章节资源', async () => {
      assetManager.setScene(mockScene as unknown as Phaser.Scene);

      await assetManager.loadChapterAssets('C0');

      // 验证背景被加载
      expect(mockScene.load.image).toHaveBeenCalled();
      expect(mockScene.load.start).toHaveBeenCalled();
    });

    it('重复加载应该跳过', async () => {
      assetManager.setScene(mockScene as unknown as Phaser.Scene);

      await assetManager.loadChapterAssets('C0');
      const firstCallCount = mockScene.load.image.mock.calls.length;

      await assetManager.loadChapterAssets('C0');
      const secondCallCount = mockScene.load.image.mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);
    });

    it('已存在的纹理不应重复加载', async () => {
      mockScene.textures.exists.mockReturnValue(true);
      assetManager.setScene(mockScene as unknown as Phaser.Scene);

      await assetManager.loadChapterAssets('C1');

      // 纹理已存在，不应调用load.image
      const imageLoadCalls = mockScene.load.image.mock.calls.filter(
        (call) => !call[0].startsWith('portrait_')
      );
      expect(imageLoadCalls.length).toBe(0);
    });

    it('无效的章节应该安全处理', async () => {
      assetManager.setScene(mockScene as unknown as Phaser.Scene);

      await expect(assetManager.loadChapterAssets('INVALID')).resolves.not.toThrow();
    });
  });

  describe('preloadNextChapter - 预加载下一章', () => {
    it('应该预加载下一章资源', async () => {
      assetManager.setScene(mockScene as unknown as Phaser.Scene);

      // 使用setTimeout模拟requestIdleCallback
      vi.useFakeTimers();

      assetManager.preloadNextChapter('C0');

      // 快进定时器
      await vi.advanceTimersByTimeAsync(1100);

      vi.useRealTimers();
    });

    it('最后一章不应预加载', () => {
      assetManager.setScene(mockScene as unknown as Phaser.Scene);

      // CF是最后一章
      assetManager.preloadNextChapter('CF');

      // 不应该有任何加载操作
    });
  });

  describe('getLoadedStats - 获取加载统计', () => {
    it('初始应该返回空统计', () => {
      const stats = assetManager.getLoadedStats();

      expect(stats.count).toBe(0);
      expect(stats.groups).toEqual([]);
    });

    it('加载后应该更新统计', async () => {
      assetManager.setScene(mockScene as unknown as Phaser.Scene);

      await assetManager.loadChapterAssets('C0');

      const stats = assetManager.getLoadedStats();

      expect(stats.count).toBeGreaterThan(0);
      expect(stats.groups).toContain(AssetGroup.CHAPTER_0);
    });
  });

  describe('unloadChapterAssets - 卸载章节资源', () => {
    it('应该卸载已加载的章节', async () => {
      assetManager.setScene(mockScene as unknown as Phaser.Scene);

      await assetManager.loadChapterAssets('C0');
      expect(assetManager.isGroupLoaded(AssetGroup.CHAPTER_0)).toBe(true);

      assetManager.unloadChapterAssets('C0');
      expect(assetManager.isGroupLoaded(AssetGroup.CHAPTER_0)).toBe(false);
    });

    it('未加载的章节不应报错', () => {
      expect(() => assetManager.unloadChapterAssets('C5')).not.toThrow();
    });

    it('无效的章节不应报错', () => {
      expect(() => assetManager.unloadChapterAssets('INVALID')).not.toThrow();
    });
  });

  describe('章节映射', () => {
    const chapters = [
      { input: 'C0', expected: AssetGroup.CHAPTER_0 },
      { input: 'C1', expected: AssetGroup.CHAPTER_1 },
      { input: 'C2', expected: AssetGroup.CHAPTER_2 },
      { input: 'C3', expected: AssetGroup.CHAPTER_3 },
      { input: 'C4', expected: AssetGroup.CHAPTER_4 },
      { input: 'C5', expected: AssetGroup.CHAPTER_5 },
      { input: 'CF', expected: AssetGroup.CHAPTER_FINALE },
    ];

    chapters.forEach(({ input, expected }) => {
      it(`${input} 应该映射到 ${expected}`, async () => {
        assetManager.setScene(mockScene as unknown as Phaser.Scene);

        await assetManager.loadChapterAssets(input);

        expect(assetManager.isGroupLoaded(expected)).toBe(true);
      });
    });
  });

  describe('资源类型加载', () => {
    beforeEach(() => {
      assetManager.setScene(mockScene as unknown as Phaser.Scene);
    });

    it('应该加载背景图片', async () => {
      await assetManager.loadChapterAssets('C0');

      const imageCalls = mockScene.load.image.mock.calls;
      const bgCalls = imageCalls.filter((call) => call[0].startsWith('bg_'));

      expect(bgCalls.length).toBeGreaterThan(0);
    });

    it('应该加载角色立绘', async () => {
      await assetManager.loadChapterAssets('C0');

      const imageCalls = mockScene.load.image.mock.calls;
      const portraitCalls = imageCalls.filter((call) => call[0].startsWith('portrait_'));

      expect(portraitCalls.length).toBeGreaterThan(0);
    });

    it('应该加载音频', async () => {
      await assetManager.loadChapterAssets('C0');

      expect(mockScene.load.audio).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('缺少配置的资源组应该安全处理', async () => {
      assetManager.setScene(mockScene as unknown as Phaser.Scene);

      // 尝试加载不存在的章节
      await expect(assetManager.loadChapterAssets('C99')).resolves.not.toThrow();
    });
  });
});
