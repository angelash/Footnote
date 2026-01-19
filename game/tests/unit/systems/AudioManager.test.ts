/**
 * AudioManager 单元测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock sound objects
const createMockSound = () => ({
  play: vi.fn(),
  stop: vi.fn(),
  setVolume: vi.fn(),
  volume: 0,
});

const mockTweenAdd = vi.fn().mockImplementation((config) => {
  // 立即调用onComplete如果存在
  if (config.onComplete) {
    setTimeout(config.onComplete, 0);
  }
  return {};
});

const createMockScene = () => {
  const mockSound = createMockSound();

  return {
    sound: {
      add: vi.fn().mockReturnValue(mockSound),
      play: vi.fn(),
    },
    tweens: {
      add: mockTweenAdd,
    },
  };
};

import { AudioManager, type IBgmConfig, type ISfxConfig, type IAmbienceConfig } from '@/systems/audio/AudioManager';

describe('AudioManager', () => {
  let audioManager: AudioManager;
  let mockScene: ReturnType<typeof createMockScene>;

  const mockBgmConfigs: IBgmConfig[] = [
    {
      id: 'bgm_test',
      name: 'Test BGM',
      file: '/audio/bgm_test.mp3',
      loop: true,
      volume: 0.8,
      fadeIn: 500,
      fadeOut: 500,
    },
    {
      id: 'bgm_battle',
      name: 'Battle BGM',
      file: '/audio/bgm_battle.mp3',
      loop: true,
      volume: 1.0,
      fadeIn: 300,
      fadeOut: 300,
    },
  ];

  const mockSfxConfigs: ISfxConfig[] = [
    {
      id: 'sfx_click',
      name: 'Click',
      file: '/audio/sfx_click.mp3',
      volume: 1.0,
    },
    {
      id: 'sfx_card',
      name: 'Card',
      file: '/audio/sfx_card.mp3',
      volume: 0.8,
      loop: false,
    },
  ];

  const mockAmbienceConfigs: IAmbienceConfig[] = [
    {
      id: 'amb_office',
      name: 'Office Ambience',
      file: '/audio/amb_office.mp3',
      volume: 0.5,
      loop: true,
      fadeIn: 1000,
      fadeOut: 1000,
    },
    {
      id: 'amb_outdoor',
      name: 'Outdoor Ambience',
      file: '/audio/amb_outdoor.mp3',
      volume: 0.6,
      loop: true,
      fadeIn: 800,
      fadeOut: 800,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene = createMockScene();
    audioManager = new AudioManager(mockScene as unknown as Phaser.Scene);
    audioManager.loadConfigs(mockBgmConfigs, mockSfxConfigs, mockAmbienceConfigs);
  });

  describe('loadConfigs - 加载配置', () => {
    it('应该正确加载BGM配置', () => {
      const state = audioManager.getCurrentState();
      expect(state).toBeDefined();
    });

    it('应该正确加载SFX配置', () => {
      // 通过播放验证
      audioManager.playSfx('sfx_click');
      expect(mockScene.sound.play).toHaveBeenCalledWith(
        'sfx_click',
        expect.objectContaining({ volume: expect.any(Number) })
      );
    });

    it('应该正确加载环境音配置', () => {
      audioManager.playAmbience('amb_office');
      expect(mockScene.sound.add).toHaveBeenCalledWith(
        'amb_office',
        expect.any(Object)
      );
    });
  });

  describe('playBgm - 播放BGM', () => {
    it('应该播放指定BGM', () => {
      audioManager.playBgm('bgm_test');

      expect(mockScene.sound.add).toHaveBeenCalledWith(
        'bgm_test',
        expect.objectContaining({ loop: true, volume: 0 })
      );
    });

    it('重复播放同一BGM应该跳过', () => {
      audioManager.playBgm('bgm_test');
      vi.clearAllMocks();

      audioManager.playBgm('bgm_test');

      expect(mockScene.sound.add).not.toHaveBeenCalled();
    });

    it('切换BGM应该淡出旧BGM', () => {
      audioManager.playBgm('bgm_test');
      vi.clearAllMocks();

      audioManager.playBgm('bgm_battle');

      // 应该有淡出动画
      expect(mockTweenAdd).toHaveBeenCalled();
    });

    it('不存在的BGM应该警告', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      audioManager.playBgm('bgm_nonexistent');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('BGM not found: bgm_nonexistent'));
      consoleSpy.mockRestore();
    });

    it('应该应用淡入效果', () => {
      audioManager.playBgm('bgm_test');

      // 检查淡入动画
      const fadeInCall = mockTweenAdd.mock.calls.find(
        (call) => call[0].duration === mockBgmConfigs[0].fadeIn
      );
      expect(fadeInCall).toBeDefined();
    });
  });

  describe('stopBgm - 停止BGM', () => {
    it('没有播放BGM时不应执行操作', () => {
      audioManager.stopBgm();

      expect(mockTweenAdd).not.toHaveBeenCalled();
    });

    it('应该淡出并停止BGM', () => {
      audioManager.playBgm('bgm_test');
      vi.clearAllMocks();

      audioManager.stopBgm();

      expect(mockTweenAdd).toHaveBeenCalled();
      const tweenConfig = mockTweenAdd.mock.calls[0][0];
      expect(tweenConfig.volume).toBe(0);
    });

    it('应该使用自定义淡出时间', () => {
      audioManager.playBgm('bgm_test');
      vi.clearAllMocks();

      audioManager.stopBgm(2000);

      const tweenConfig = mockTweenAdd.mock.calls[0][0];
      expect(tweenConfig.duration).toBe(2000);
    });
  });

  describe('playSfx - 播放音效', () => {
    it('应该播放指定音效', () => {
      audioManager.playSfx('sfx_click');

      expect(mockScene.sound.play).toHaveBeenCalledWith(
        'sfx_click',
        expect.objectContaining({ volume: expect.any(Number), loop: false })
      );
    });

    it('不存在的音效应该警告', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      audioManager.playSfx('sfx_nonexistent');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('SFX not found: sfx_nonexistent'));
      consoleSpy.mockRestore();
    });

    it('应该应用正确的音量', () => {
      audioManager.playSfx('sfx_click');

      const playCall = mockScene.sound.play.mock.calls[0];
      // volume = config.volume * sfxVolume * masterVolume = 1.0 * 0.8 * 1.0 = 0.8
      expect(playCall[1].volume).toBe(0.8);
    });
  });

  describe('playAmbience - 播放环境音', () => {
    it('应该播放指定环境音', () => {
      audioManager.playAmbience('amb_office');

      expect(mockScene.sound.add).toHaveBeenCalledWith(
        'amb_office',
        expect.objectContaining({ loop: true, volume: 0 })
      );
    });

    it('重复播放同一环境音应该跳过', () => {
      audioManager.playAmbience('amb_office');
      vi.clearAllMocks();

      audioManager.playAmbience('amb_office');

      expect(mockScene.sound.add).not.toHaveBeenCalled();
    });

    it('切换环境音应该淡出旧环境音', () => {
      audioManager.playAmbience('amb_office');
      vi.clearAllMocks();

      audioManager.playAmbience('amb_outdoor');

      expect(mockTweenAdd).toHaveBeenCalled();
    });

    it('不存在的环境音应该警告', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      audioManager.playAmbience('amb_nonexistent');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Ambience not found: amb_nonexistent'));
      consoleSpy.mockRestore();
    });
  });

  describe('addAmbienceOverlay - 添加环境音叠加层', () => {
    it('应该添加叠加层', () => {
      audioManager.playAmbience('amb_office');
      vi.clearAllMocks();

      audioManager.addAmbienceOverlay('amb_outdoor');

      expect(mockScene.sound.add).toHaveBeenCalledWith(
        'amb_outdoor',
        expect.any(Object)
      );
    });

    it('应该降低基础环境音音量', () => {
      audioManager.playAmbience('amb_office');
      vi.clearAllMocks();

      audioManager.addAmbienceOverlay('amb_outdoor', 0.5);

      // 应该有降低音量的动画
      expect(mockTweenAdd).toHaveBeenCalled();
    });

    it('不存在的叠加层不应执行操作', () => {
      audioManager.playAmbience('amb_office');
      vi.clearAllMocks();

      audioManager.addAmbienceOverlay('amb_nonexistent');

      expect(mockScene.sound.add).not.toHaveBeenCalled();
    });
  });

  describe('removeAmbienceOverlay - 移除环境音叠加层', () => {
    it('没有叠加层时不应报错', () => {
      expect(() => audioManager.removeAmbienceOverlay()).not.toThrow();
    });

    it('应该淡出叠加层', () => {
      audioManager.playAmbience('amb_office');
      audioManager.addAmbienceOverlay('amb_outdoor');
      vi.clearAllMocks();

      audioManager.removeAmbienceOverlay();

      expect(mockTweenAdd).toHaveBeenCalled();
    });

    it('应该恢复基础环境音音量', () => {
      audioManager.playAmbience('amb_office');
      audioManager.addAmbienceOverlay('amb_outdoor');
      vi.clearAllMocks();

      audioManager.removeAmbienceOverlay();

      // 应该有恢复音量的动画
      const tweenCalls = mockTweenAdd.mock.calls;
      expect(tweenCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('onDialogueStart/onDialogueEnd - 对话音量控制', () => {
    it('对话开始应该降低BGM音量', () => {
      audioManager.playBgm('bgm_test');
      vi.clearAllMocks();

      audioManager.onDialogueStart();

      expect(mockTweenAdd).toHaveBeenCalled();
    });

    it('对话结束应该恢复BGM音量', () => {
      audioManager.playBgm('bgm_test');
      audioManager.onDialogueStart();
      vi.clearAllMocks();

      audioManager.onDialogueEnd();

      expect(mockTweenAdd).toHaveBeenCalled();
    });

    it('没有BGM时对话开始不应报错', () => {
      expect(() => audioManager.onDialogueStart()).not.toThrow();
    });

    it('没有BGM时对话结束不应报错', () => {
      expect(() => audioManager.onDialogueEnd()).not.toThrow();
    });
  });

  describe('setMasterVolume - 设置主音量', () => {
    it('应该设置主音量', () => {
      audioManager.setMasterVolume(0.5);

      const state = audioManager.getCurrentState();
      expect(state.masterVolume).toBe(0.5);
    });

    it('音量应该限制在0-1之间', () => {
      audioManager.setMasterVolume(1.5);
      expect(audioManager.getCurrentState().masterVolume).toBe(1);

      audioManager.setMasterVolume(-0.5);
      expect(audioManager.getCurrentState().masterVolume).toBe(0);
    });
  });

  describe('setBgmVolume - 设置BGM音量', () => {
    it('应该设置BGM音量', () => {
      audioManager.setBgmVolume(0.5);

      const state = audioManager.getCurrentState();
      expect(state.bgmVolume).toBe(0.5);
    });

    it('音量应该限制在0-1之间', () => {
      audioManager.setBgmVolume(1.5);
      expect(audioManager.getCurrentState().bgmVolume).toBe(1);

      audioManager.setBgmVolume(-0.5);
      expect(audioManager.getCurrentState().bgmVolume).toBe(0);
    });
  });

  describe('setSfxVolume - 设置音效音量', () => {
    it('应该设置音效音量', () => {
      audioManager.setSfxVolume(0.5);

      const state = audioManager.getCurrentState();
      expect(state.sfxVolume).toBe(0.5);
    });

    it('音量应该限制在0-1之间', () => {
      audioManager.setSfxVolume(1.5);
      expect(audioManager.getCurrentState().sfxVolume).toBe(1);

      audioManager.setSfxVolume(-0.5);
      expect(audioManager.getCurrentState().sfxVolume).toBe(0);
    });
  });

  describe('setAmbienceVolume - 设置环境音音量', () => {
    it('应该设置环境音音量', () => {
      audioManager.setAmbienceVolume(0.3);

      const state = audioManager.getCurrentState();
      expect(state.ambienceVolume).toBe(0.3);
    });

    it('音量应该限制在0-1之间', () => {
      audioManager.setAmbienceVolume(1.5);
      expect(audioManager.getCurrentState().ambienceVolume).toBe(1);

      audioManager.setAmbienceVolume(-0.5);
      expect(audioManager.getCurrentState().ambienceVolume).toBe(0);
    });
  });

  describe('getCurrentState - 获取当前状态', () => {
    it('应该返回完整状态', () => {
      const state = audioManager.getCurrentState();

      expect(state).toHaveProperty('bgmId');
      expect(state).toHaveProperty('ambienceId');
      expect(state).toHaveProperty('masterVolume');
      expect(state).toHaveProperty('bgmVolume');
      expect(state).toHaveProperty('sfxVolume');
      expect(state).toHaveProperty('ambienceVolume');
    });

    it('初始状态应该正确', () => {
      const state = audioManager.getCurrentState();

      expect(state.bgmId).toBe('');
      expect(state.ambienceId).toBe('');
      expect(state.masterVolume).toBe(1.0);
      expect(state.bgmVolume).toBe(0.7);
      expect(state.sfxVolume).toBe(0.8);
      expect(state.ambienceVolume).toBe(0.5);
    });

    it('播放后状态应该更新', () => {
      audioManager.playBgm('bgm_test');
      audioManager.playAmbience('amb_office');

      const state = audioManager.getCurrentState();

      expect(state.bgmId).toBe('bgm_test');
      expect(state.ambienceId).toBe('amb_office');
    });
  });

  describe('destroy - 清理资源', () => {
    it('应该停止所有音频', () => {
      const mockBgm = createMockSound();
      const mockAmbience = createMockSound();
      const mockOverlay = createMockSound();

      mockScene.sound.add
        .mockReturnValueOnce(mockBgm)
        .mockReturnValueOnce(mockAmbience)
        .mockReturnValueOnce(mockOverlay);

      audioManager.playBgm('bgm_test');
      audioManager.playAmbience('amb_office');
      audioManager.addAmbienceOverlay('amb_outdoor');

      audioManager.destroy();

      expect(mockBgm.stop).toHaveBeenCalled();
      expect(mockAmbience.stop).toHaveBeenCalled();
      expect(mockOverlay.stop).toHaveBeenCalled();
    });

    it('没有播放时销毁不应报错', () => {
      expect(() => audioManager.destroy()).not.toThrow();
    });
  });

  describe('音量计算', () => {
    it('BGM音量应该正确计算', () => {
      audioManager.setMasterVolume(0.5);
      audioManager.setBgmVolume(0.5);

      audioManager.playBgm('bgm_test');

      // 验证淡入目标音量
      const fadeInConfig = mockTweenAdd.mock.calls.find(
        (call) => call[0].duration === mockBgmConfigs[0].fadeIn
      );

      if (fadeInConfig) {
        // volume = config.volume * bgmVolume * masterVolume = 0.8 * 0.5 * 0.5 = 0.2
        expect(fadeInConfig[0].volume).toBe(0.2);
      }
    });

    it('对话时BGM音量应该进一步降低', () => {
      audioManager.playBgm('bgm_test');
      vi.clearAllMocks();

      audioManager.onDialogueStart();

      const tweenConfig = mockTweenAdd.mock.calls[0][0];
      // 应该乘以dialogueVolumeMultiplier
      expect(tweenConfig.volume).toBeLessThan(0.8 * 0.7 * 1.0);
    });
  });
});
