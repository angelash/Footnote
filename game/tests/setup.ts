/**
 * Vitest测试设置文件
 */

import { vi } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
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

        on(event: string | symbol, fn: (...args: unknown[]) => void, _context?: unknown): this {
          if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
          }
          this._listeners.get(event)!.add(fn);
          return this;
        }

        once(event: string | symbol, fn: (...args: unknown[]) => void, _context?: unknown): this {
          const wrapper = (...args: unknown[]) => {
            this.off(event, wrapper);
            fn(...args);
          };
          return this.on(event, wrapper);
        }

        off(event: string | symbol, fn?: (...args: unknown[]) => void, _context?: unknown): this {
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
    Scene: class MockScene {
      add = {
        image: vi.fn().mockReturnThis(),
        text: vi.fn().mockReturnThis(),
        graphics: vi.fn().mockReturnThis(),
        container: vi.fn().mockReturnThis(),
        sprite: vi.fn().mockReturnThis(),
      };
      physics = {
        add: {
          sprite: vi.fn().mockReturnValue({
            setScale: vi.fn().mockReturnThis(),
            setCollideWorldBounds: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setVelocity: vi.fn().mockReturnThis(),
            body: { setSize: vi.fn() },
            y: 0,
          }),
        },
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
          createCursorKeys: vi.fn().mockReturnValue({
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false },
            down: { isDown: false },
          }),
          addKeys: vi.fn().mockReturnValue({
            w: { isDown: false },
            a: { isDown: false },
            s: { isDown: false },
            d: { isDown: false },
          }),
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

// Mock window.matchMedia for A11yManager
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

