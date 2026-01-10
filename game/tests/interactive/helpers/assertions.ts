/**
 * 自定义断言函数
 * 
 * 用于交互测试的验证
 */

import type { PlayerPosition, WorldStateSnapshot } from './game-helpers';

// 断言结果
export interface AssertionResult {
  passed: boolean;
  message: string;
  expected?: unknown;
  actual?: unknown;
}

/**
 * 断言类
 */
export class Assertions {
  private results: AssertionResult[] = [];

  /**
   * 获取所有断言结果
   */
  getResults(): AssertionResult[] {
    return [...this.results];
  }

  /**
   * 检查是否全部通过
   */
  allPassed(): boolean {
    return this.results.every(r => r.passed);
  }

  /**
   * 重置结果
   */
  reset(): void {
    this.results = [];
  }

  /**
   * 记录断言结果
   */
  private record(result: AssertionResult): void {
    this.results.push(result);
    if (!result.passed) {
      console.error(`❌ Assertion failed: ${result.message}`);
      if (result.expected !== undefined) {
        console.error(`   Expected: ${JSON.stringify(result.expected)}`);
        console.error(`   Actual: ${JSON.stringify(result.actual)}`);
      }
    } else {
      console.log(`✅ ${result.message}`);
    }
  }

  // ==================== 基础断言 ====================

  /**
   * 断言相等
   */
  assertEqual<T>(actual: T, expected: T, message: string): void {
    const passed = actual === expected;
    this.record({ passed, message, expected, actual });
  }

  /**
   * 断言不相等
   */
  assertNotEqual<T>(actual: T, notExpected: T, message: string): void {
    const passed = actual !== notExpected;
    this.record({ passed, message, expected: `not ${JSON.stringify(notExpected)}`, actual });
  }

  /**
   * 断言为真
   */
  assertTrue(actual: boolean, message: string): void {
    const passed = actual === true;
    this.record({ passed, message, expected: true, actual });
  }

  /**
   * 断言为假
   */
  assertFalse(actual: boolean, message: string): void {
    const passed = actual === false;
    this.record({ passed, message, expected: false, actual });
  }

  /**
   * 断言不为 null/undefined
   */
  assertNotNull<T>(actual: T | null | undefined, message: string): void {
    const passed = actual != null;
    this.record({ passed, message, expected: 'not null/undefined', actual });
  }

  /**
   * 断言为 null/undefined
   */
  assertNull<T>(actual: T | null | undefined, message: string): void {
    const passed = actual == null;
    this.record({ passed, message, expected: 'null/undefined', actual });
  }

  /**
   * 断言数值大于
   */
  assertGreaterThan(actual: number, expected: number, message: string): void {
    const passed = actual > expected;
    this.record({ passed, message, expected: `> ${expected}`, actual });
  }

  /**
   * 断言数值小于
   */
  assertLessThan(actual: number, expected: number, message: string): void {
    const passed = actual < expected;
    this.record({ passed, message, expected: `< ${expected}`, actual });
  }

  /**
   * 断言数值在范围内
   */
  assertInRange(actual: number, min: number, max: number, message: string): void {
    const passed = actual >= min && actual <= max;
    this.record({ passed, message, expected: `${min} <= x <= ${max}`, actual });
  }

  /**
   * 断言字符串包含
   */
  assertContains(actual: string, substring: string, message: string): void {
    const passed = actual.includes(substring);
    this.record({ passed, message, expected: `contains "${substring}"`, actual });
  }

  /**
   * 断言数组包含
   */
  assertArrayContains<T>(actual: T[], item: T, message: string): void {
    const passed = actual.includes(item);
    this.record({ passed, message, expected: `contains ${JSON.stringify(item)}`, actual });
  }

  /**
   * 断言数组长度
   */
  assertArrayLength<T>(actual: T[], expectedLength: number, message: string): void {
    const passed = actual.length === expectedLength;
    this.record({ passed, message, expected: expectedLength, actual: actual.length });
  }

  // ==================== 游戏特定断言 ====================

  /**
   * 断言场景是指定场景
   */
  assertScene(actual: string | null, expected: string, message: string): void {
    const passed = actual === expected;
    this.record({ passed, message: `场景应为 ${expected}: ${message}`, expected, actual });
  }

  /**
   * 断言玩家位置改变
   */
  assertPositionChanged(
    before: PlayerPosition | null,
    after: PlayerPosition | null,
    message: string
  ): void {
    if (!before || !after) {
      this.record({ passed: false, message: `无法获取位置: ${message}`, expected: 'position data', actual: { before, after } });
      return;
    }
    const passed = before.x !== after.x || before.y !== after.y;
    this.record({ passed, message, expected: 'position changed', actual: { before, after } });
  }

  /**
   * 断言玩家向上移动
   */
  assertMovedUp(
    before: PlayerPosition | null,
    after: PlayerPosition | null,
    message: string
  ): void {
    if (!before || !after) {
      this.record({ passed: false, message, expected: 'position data', actual: null });
      return;
    }
    const passed = after.y < before.y;
    this.record({ passed, message: `玩家应向上移动: ${message}`, expected: `y < ${before.y}`, actual: after.y });
  }

  /**
   * 断言玩家向下移动
   */
  assertMovedDown(
    before: PlayerPosition | null,
    after: PlayerPosition | null,
    message: string
  ): void {
    if (!before || !after) {
      this.record({ passed: false, message, expected: 'position data', actual: null });
      return;
    }
    const passed = after.y > before.y;
    this.record({ passed, message: `玩家应向下移动: ${message}`, expected: `y > ${before.y}`, actual: after.y });
  }

  /**
   * 断言玩家向左移动
   */
  assertMovedLeft(
    before: PlayerPosition | null,
    after: PlayerPosition | null,
    message: string
  ): void {
    if (!before || !after) {
      this.record({ passed: false, message, expected: 'position data', actual: null });
      return;
    }
    const passed = after.x < before.x;
    this.record({ passed, message: `玩家应向左移动: ${message}`, expected: `x < ${before.x}`, actual: after.x });
  }

  /**
   * 断言玩家向右移动
   */
  assertMovedRight(
    before: PlayerPosition | null,
    after: PlayerPosition | null,
    message: string
  ): void {
    if (!before || !after) {
      this.record({ passed: false, message, expected: 'position data', actual: null });
      return;
    }
    const passed = after.x > before.x;
    this.record({ passed, message: `玩家应向右移动: ${message}`, expected: `x > ${before.x}`, actual: after.x });
  }

  /**
   * 断言 R 值增加
   */
  assertRIncreased(before: number | null, after: number | null, message: string): void {
    if (before === null || after === null) {
      this.record({ passed: false, message, expected: 'R values', actual: null });
      return;
    }
    const passed = after > before;
    this.record({ passed, message: `R值应增加: ${message}`, expected: `> ${before}`, actual: after });
  }

  /**
   * 断言 Zone 是指定 Zone
   */
  assertZone(actual: string | null, expected: string, message: string): void {
    const passed = actual === expected;
    this.record({ passed, message: `Zone应为 ${expected}: ${message}`, expected, actual });
  }

  /**
   * 断言对话框显示
   */
  assertDialogueVisible(isVisible: boolean, message: string): void {
    this.assertTrue(isVisible, `对话框应显示: ${message}`);
  }

  /**
   * 断言对话框隐藏
   */
  assertDialogueHidden(isVisible: boolean, message: string): void {
    this.assertFalse(isVisible, `对话框应隐藏: ${message}`);
  }

  /**
   * 断言物品栏包含卡片
   */
  assertHasCard(inventory: string[], cardId: string, message: string): void {
    const passed = inventory.includes(cardId);
    this.record({ passed, message: `物品栏应包含卡片 ${cardId}: ${message}`, expected: cardId, actual: inventory });
  }

  /**
   * 断言能力已解锁
   */
  assertAbilityUnlocked(
    abilityState: { unlocked: string[] } | null,
    abilityId: string,
    message: string
  ): void {
    if (!abilityState) {
      this.record({ passed: false, message, expected: 'ability state', actual: null });
      return;
    }
    const passed = abilityState.unlocked.includes(abilityId);
    this.record({ passed, message: `能力 ${abilityId} 应已解锁: ${message}`, expected: abilityId, actual: abilityState.unlocked });
  }

  /**
   * 断言存档存在
   */
  assertSaveExists(hasSave: boolean, message: string): void {
    this.assertTrue(hasSave, `存档应存在: ${message}`);
  }

  /**
   * 断言存档不存在
   */
  assertNoSave(hasSave: boolean, message: string): void {
    this.assertFalse(hasSave, `存档应不存在: ${message}`);
  }
}

/**
 * 创建断言实例
 */
export function createAssertions(): Assertions {
  return new Assertions();
}

export default Assertions;
