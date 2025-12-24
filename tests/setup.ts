/**
 * Vitest测试设置文件
 */

import { vi } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {
      add = {
        image: vi.fn().mockReturnThis(),
        text: vi.fn().mockReturnThis(),
        graphics: vi.fn().mockReturnThis(),
        container: vi.fn().mockReturnThis(),
        sprite: vi.fn().mockReturnThis(),
      };
      load = {
        image: vi.fn(),
        audio: vi.fn(),
        yaml: vi.fn(),
        json: vi.fn(),
      };
      events = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn(),
      };
      input = {
        on: vi.fn(),
        keyboard: {
          on: vi.fn(),
        },
      };
      time = {
        delayedCall: vi.fn(),
        now: Date.now(),
      };
      tweens = {
        add: vi.fn(),
      };
      cameras = {
        main: {
          fadeIn: vi.fn(),
          fadeOut: vi.fn(),
          once: vi.fn(),
        },
      };
      scene = {
        start: vi.fn(),
        get: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        isActive: vi.fn().mockReturnValue(true),
        isPaused: vi.fn().mockReturnValue(false),
      };
      scale = {
        width: 750,
        height: 1334,
      };
      game = {
        events: {
          emit: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
        },
        device: {
          features: { webGL: true },
          audio: { webAudio: true },
          input: { touch: true },
        },
        config: {
          fps: { forceSetTimeOut: false },
        },
        sound: {
          pauseAll: vi.fn(),
          resumeAll: vi.fn(),
        },
      };
    },
    Game: vi.fn(),
    AUTO: 'AUTO',
    Scale: {
      FIT: 'FIT',
      CENTER_BOTH: 'CENTER_BOTH',
    },
  },
}));

// Mock IndexedDB
const mockIDB = {
  open: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  }),
};

vi.mock('idb', () => ({
  openDB: mockIDB.open,
}));

// 全局设置
beforeEach(() => {
  vi.clearAllMocks();
});

// 环境变量
(globalThis as any).__DEV__ = true;
(globalThis as any).__VERSION__ = '0.1.0';

