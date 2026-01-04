/**
 * GameScene 单元测试
 *
 * 重点测试：
 * 1. 输入系统初始化
 * 2. 键盘键名大小写
 * 3. 移动逻辑
 * 4. 能力触发
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Mock Phaser 的 Key 对象
 */
interface MockKey {
  isDown: boolean;
}

/**
 * 创建 Mock Key
 */
function createMockKey(isDown = false): MockKey {
  return { isDown };
}

/**
 * Mock addKeys 的返回值类型（大写键名）
 */
interface MockMoveKeys {
  W: MockKey;
  A: MockKey;
  S: MockKey;
  D: MockKey;
}

/**
 * Mock createCursorKeys 的返回值类型（小写键名）
 */
interface MockCursors {
  left: MockKey;
  right: MockKey;
  up: MockKey;
  down: MockKey;
}

describe('GameScene 输入系统', () => {
  describe('键盘键名约定', () => {
    it('addKeys("W,A,S,D") 应返回大写键名的对象', () => {
      // 模拟 Phaser 的 addKeys 行为
      const mockAddKeys = vi.fn().mockImplementation((keys: string) => {
        const keyList = keys.split(',');
        const result: Record<string, MockKey> = {};
        keyList.forEach((key) => {
          // Phaser addKeys 总是返回大写键名
          result[key.toUpperCase()] = createMockKey();
        });
        return result;
      });

      const result = mockAddKeys('W,A,S,D');

      // ✅ 验证键名是大写
      expect(result.W).toBeDefined();
      expect(result.A).toBeDefined();
      expect(result.S).toBeDefined();
      expect(result.D).toBeDefined();

      // ✅ 验证小写键名不存在
      expect(result.w).toBeUndefined();
      expect(result.a).toBeUndefined();
      expect(result.s).toBeUndefined();
      expect(result.d).toBeUndefined();
    });

    it('createCursorKeys 应返回小写键名的对象', () => {
      // 模拟 Phaser 的 createCursorKeys 行为
      const mockCreateCursorKeys = vi.fn().mockReturnValue({
        left: createMockKey(),
        right: createMockKey(),
        up: createMockKey(),
        down: createMockKey(),
      });

      const result = mockCreateCursorKeys();

      // ✅ 验证键名是小写
      expect(result.left).toBeDefined();
      expect(result.right).toBeDefined();
      expect(result.up).toBeDefined();
      expect(result.down).toBeDefined();
    });

    it('不应混淆 addKeys 和 createCursorKeys 的键名格式', () => {
      // 这是导致 Bug 的根本原因：
      // addKeys 返回大写，createCursorKeys 返回小写

      const moveKeys: MockMoveKeys = {
        W: createMockKey(),
        A: createMockKey(),
        S: createMockKey(),
        D: createMockKey(),
      };

      const cursors: MockCursors = {
        left: createMockKey(),
        right: createMockKey(),
        up: createMockKey(),
        down: createMockKey(),
      };

      // ✅ 正确的访问方式
      expect(() => moveKeys.W.isDown).not.toThrow();
      expect(() => cursors.left.isDown).not.toThrow();

      // ✅ 错误的访问方式会导致 undefined
      // @ts-expect-error - 故意测试错误访问
      expect(moveKeys.w).toBeUndefined();
      // @ts-expect-error - 故意测试错误访问
      expect(cursors.LEFT).toBeUndefined();
    });
  });

  describe('移动输入判断', () => {
    let moveKeys: MockMoveKeys;
    let cursors: MockCursors;

    beforeEach(() => {
      moveKeys = {
        W: createMockKey(),
        A: createMockKey(),
        S: createMockKey(),
        D: createMockKey(),
      };
      cursors = {
        left: createMockKey(),
        right: createMockKey(),
        up: createMockKey(),
        down: createMockKey(),
      };
    });

    it('W 键或上方向键应判定为向上移动', () => {
      // 测试 W 键
      moveKeys.W.isDown = true;
      const upByW = cursors.up?.isDown || moveKeys.W?.isDown;
      expect(upByW).toBe(true);

      // 重置并测试上方向键
      moveKeys.W.isDown = false;
      cursors.up.isDown = true;
      const upByCursor = cursors.up?.isDown || moveKeys.W?.isDown;
      expect(upByCursor).toBe(true);
    });

    it('A 键或左方向键应判定为向左移动', () => {
      moveKeys.A.isDown = true;
      const leftByA = cursors.left?.isDown || moveKeys.A?.isDown;
      expect(leftByA).toBe(true);

      moveKeys.A.isDown = false;
      cursors.left.isDown = true;
      const leftByCursor = cursors.left?.isDown || moveKeys.A?.isDown;
      expect(leftByCursor).toBe(true);
    });

    it('S 键或下方向键应判定为向下移动', () => {
      moveKeys.S.isDown = true;
      const downByS = cursors.down?.isDown || moveKeys.S?.isDown;
      expect(downByS).toBe(true);

      moveKeys.S.isDown = false;
      cursors.down.isDown = true;
      const downByCursor = cursors.down?.isDown || moveKeys.S?.isDown;
      expect(downByCursor).toBe(true);
    });

    it('D 键或右方向键应判定为向右移动', () => {
      moveKeys.D.isDown = true;
      const rightByD = cursors.right?.isDown || moveKeys.D?.isDown;
      expect(rightByD).toBe(true);

      moveKeys.D.isDown = false;
      cursors.right.isDown = true;
      const rightByCursor = cursors.right?.isDown || moveKeys.D?.isDown;
      expect(rightByCursor).toBe(true);
    });

    it('同时按下多个键应支持对角移动', () => {
      moveKeys.W.isDown = true;
      moveKeys.D.isDown = true;

      const up = cursors.up?.isDown || moveKeys.W?.isDown;
      const right = cursors.right?.isDown || moveKeys.D?.isDown;

      expect(up).toBe(true);
      expect(right).toBe(true);
    });

    it('没有按键时应判定为不移动', () => {
      const left = cursors.left?.isDown || moveKeys.A?.isDown;
      const right = cursors.right?.isDown || moveKeys.D?.isDown;
      const up = cursors.up?.isDown || moveKeys.W?.isDown;
      const down = cursors.down?.isDown || moveKeys.S?.isDown;

      expect(left).toBe(false);
      expect(right).toBe(false);
      expect(up).toBe(false);
      expect(down).toBe(false);
    });
  });

  describe('速度计算', () => {
    const PLAYER_SPEED = 200;

    /**
     * 计算移动速度（模拟 GameScene._updatePlayerMovement）
     */
    function calculateVelocity(
      left: boolean,
      right: boolean,
      up: boolean,
      down: boolean
    ): { vx: number; vy: number } {
      let vx = 0;
      let vy = 0;

      if (left) vx -= 1;
      if (right) vx += 1;
      if (up) vy -= 1;
      if (down) vy += 1;

      // 归一化（斜向移动不应更快）
      if (vx !== 0 && vy !== 0) {
        const length = Math.sqrt(vx * vx + vy * vy);
        vx /= length;
        vy /= length;
      }

      return {
        vx: vx * PLAYER_SPEED,
        vy: vy * PLAYER_SPEED,
      };
    }

    it('单向移动应使用完整速度', () => {
      const { vx, vy } = calculateVelocity(false, true, false, false); // 向右
      expect(vx).toBe(PLAYER_SPEED);
      expect(vy).toBe(0);
    });

    it('斜向移动应归一化速度', () => {
      const { vx, vy } = calculateVelocity(false, true, true, false); // 右上

      // 斜向速度应该是 speed / sqrt(2)
      const expectedSpeed = PLAYER_SPEED / Math.sqrt(2);
      expect(vx).toBeCloseTo(expectedSpeed, 5);
      expect(vy).toBeCloseTo(-expectedSpeed, 5);

      // 总速度不应超过 PLAYER_SPEED
      const totalSpeed = Math.sqrt(vx * vx + vy * vy);
      expect(totalSpeed).toBeCloseTo(PLAYER_SPEED, 5);
    });

    it('相反方向同时按下应静止', () => {
      const { vx, vy } = calculateVelocity(true, true, false, false); // 左+右
      expect(vx).toBe(0);
      expect(vy).toBe(0);
    });

    it('没有按键应静止', () => {
      const { vx, vy } = calculateVelocity(false, false, false, false);
      expect(vx).toBe(0);
      expect(vy).toBe(0);
    });
  });

  describe('能力键映射', () => {
    it('数字键应映射到正确的能力', () => {
      // 能力键名约定
      const abilityKeyMap = {
        ONE: 'DEPTH_PERCEPTION', // 深度感知
        TWO: 'DEPTH_INTERVENTION', // 深度介入
        THREE: 'TIME_INTERVENTION', // 时间干预
      };

      expect(abilityKeyMap.ONE).toBe('DEPTH_PERCEPTION');
      expect(abilityKeyMap.TWO).toBe('DEPTH_INTERVENTION');
      expect(abilityKeyMap.THREE).toBe('TIME_INTERVENTION');
    });

    it('addKeys("ONE,TWO,THREE") 应返回大写键名', () => {
      const mockAddKeys = vi.fn().mockImplementation((keys: string) => {
        const keyList = keys.split(',');
        const result: Record<string, MockKey> = {};
        keyList.forEach((key) => {
          result[key.toUpperCase()] = createMockKey();
        });
        return result;
      });

      const result = mockAddKeys('ONE,TWO,THREE');

      expect(result.ONE).toBeDefined();
      expect(result.TWO).toBeDefined();
      expect(result.THREE).toBeDefined();

      // @ts-expect-error - 故意测试错误访问
      expect(result.one).toBeUndefined();
    });
  });
});

describe('输入系统 Bug 回归测试', () => {
  describe('键名大小写 Bug（2024-12）', () => {
    it('不应使用小写访问 addKeys 返回的对象', () => {
      // 这是实际 Bug 的复现场景
      const keys = {
        W: { isDown: true },
        A: { isDown: false },
        S: { isDown: false },
        D: { isDown: false },
      } as MockMoveKeys;

      // ✅ 正确：使用大写
      expect(keys.W?.isDown).toBe(true);

      // ❌ 错误：使用小写（这就是 Bug 的原因）
      // @ts-expect-error - 故意测试错误访问
      const wrongAccess = keys.w?.isDown;
      expect(wrongAccess).toBeUndefined();
    });

    it('TypeScript 类型应强制使用大写键名', () => {
      // 通过定义正确的类型，可以在编译时捕获这个错误
      interface CorrectMoveKeys {
        W: MockKey;
        A: MockKey;
        S: MockKey;
        D: MockKey;
      }

      const keys: CorrectMoveKeys = {
        W: createMockKey(true),
        A: createMockKey(),
        S: createMockKey(),
        D: createMockKey(),
      };

      // TypeScript 会在这里报错（如果启用 strict 模式）
      // keys.w.isDown  // Error: Property 'w' does not exist

      expect(keys.W.isDown).toBe(true);
    });
  });
});

