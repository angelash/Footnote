/**
 * 调试命令系统
 * 提供游戏内挂接口，支持自动化测试和快速调试
 * @module systems/debug/DebugCommands
 */

import { worldState } from '@/systems/world';
import { narrativeEngine } from '@/systems/narrative';
import { eventBus, GameEvent } from '@/systems/EventBus';
import type { AbilityType, ChapterID } from '@/config/game.config';

// ==================== 类型定义 ====================

/**
 * 调试命令执行结果
 */
export interface ICommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

/**
 * 测试步骤
 */
export interface ITestStep {
  action: string;
  params?: Record<string, unknown>;
  expect?: IExpectation;
  delay?: number;
}

/**
 * 期望结果
 */
export interface IExpectation {
  type: 'counter' | 'flag' | 'zone' | 'card' | 'ability' | 'position';
  target: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'exists';
  value: unknown;
}

/**
 * 测试脚本
 */
export interface ITestScript {
  name: string;
  description?: string;
  setup?: ITestStep[];
  steps: ITestStep[];
  cleanup?: ITestStep[];
}

/**
 * 测试结果
 */
export interface ITestResult {
  scriptName: string;
  passed: boolean;
  steps: IStepResult[];
  duration: number;
  error?: string;
}

interface IStepResult {
  action: string;
  passed: boolean;
  message: string;
  expectation?: IExpectation;
  actual?: unknown;
}

// ==================== DebugCommands 类 ====================

/**
 * 调试命令系统
 * 单例模式，通过 window.__DEBUG__ 暴露给控制台和自动化测试
 */
class DebugCommands {
  private static _instance: DebugCommands | null = null;
  private _scene: Phaser.Scene | null = null;
  private _isEnabled: boolean = true;
  private _commandHistory: string[] = [];
  private _testResults: ITestResult[] = [];

  private constructor() {
    // 暴露到 window 对象
    if (typeof window !== 'undefined') {
      (window as any).__DEBUG__ = this;
      (window as any).__GAME_STATE__ = () => this.getGameState();
    }
  }

  static getInstance(): DebugCommands {
    if (!DebugCommands._instance) {
      DebugCommands._instance = new DebugCommands();
    }
    return DebugCommands._instance;
  }

  /**
   * 设置场景引用
   */
  setScene(scene: Phaser.Scene): void {
    this._scene = scene;
  }

  /**
   * 启用/禁用调试命令
   */
  setEnabled(enabled: boolean): void {
    this._isEnabled = enabled;
  }

  // ==================== 游戏状态查询 ====================

  /**
   * 获取完整游戏状态（供自动化测试使用）
   */
  getGameState(): Record<string, unknown> {
    return {
      counters: worldState.getCounters(),
      abilities: worldState.getAbilities(),
      flags: worldState.getFlags(),
      currentZone: worldState.getCurrentZone(),
      playTime: worldState.getPlayTime(),
      scars: worldState.getScars(),
      contaminations: worldState.getContaminations(),
      cards: narrativeEngine.getObtainedCards(),
    };
  }

  /**
   * 获取玩家位置
   */
  getPlayerPosition(): { x: number; y: number } | null {
    if (!this._scene) return null;
    const player = (this._scene as any)._player;
    return player ? { x: player.x, y: player.y } : null;
  }

  // ==================== Zone 命令 ====================

  /**
   * 传送到指定 Zone
   */
  teleport(zoneId: string): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    try {
      if (!this._scene) {
        return { success: false, message: '场景未初始化' };
      }

      // 解锁目标 Zone
      worldState.unlockZone(zoneId);

      // 触发 Zone 过渡
      eventBus.emit(GameEvent.ZONE_TRANSITION, { targetZone: zoneId });

      this._logCommand(`teleport(${zoneId})`);
      return { success: true, message: `传送到 ${zoneId}` };
    } catch (error) {
      return { success: false, message: '传送失败', error: String(error) };
    }
  }

  /**
   * 解锁 Zone
   */
  unlockZone(zoneId: string): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    worldState.unlockZone(zoneId);
    this._logCommand(`unlockZone(${zoneId})`);
    return { success: true, message: `解锁 Zone: ${zoneId}` };
  }

  /**
   * 完成当前 Zone
   */
  completeZone(zoneId?: string): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    const targetZone = zoneId || worldState.getCurrentZone();
    worldState.completeZone(targetZone);
    this._logCommand(`completeZone(${targetZone})`);
    return { success: true, message: `完成 Zone: ${targetZone}` };
  }

  // ==================== 计数器命令 ====================

  /**
   * 设置 R 值
   */
  setR(value: number): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    const current = worldState.getCounters().R;
    worldState.addR(value - current);
    this._logCommand(`setR(${value})`);
    return { success: true, message: `R 值设置为 ${value}`, data: { R: value } };
  }

  /**
   * 设置 P 值
   */
  setP(value: number): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    const current = worldState.getCounters().P;
    worldState.addP(value - current);
    this._logCommand(`setP(${value})`);
    return { success: true, message: `P 值设置为 ${value}`, data: { P: value } };
  }

  /**
   * 增加 R 值
   */
  addR(delta: number): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    worldState.addR(delta);
    this._logCommand(`addR(${delta})`);
    return { success: true, message: `R 值增加 ${delta}`, data: worldState.getCounters() };
  }

  /**
   * 增加 P 值
   */
  addP(delta: number): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    worldState.addP(delta);
    this._logCommand(`addP(${delta})`);
    return { success: true, message: `P 值增加 ${delta}`, data: worldState.getCounters() };
  }

  // ==================== 能力命令 ====================

  /**
   * 解锁能力
   */
  unlockAbility(ability: AbilityType): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    worldState.unlockAbility(ability);
    this._logCommand(`unlockAbility(${ability})`);
    return { success: true, message: `解锁能力: ${ability}` };
  }

  /**
   * 解锁所有能力
   */
  unlockAllAbilities(): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    const abilities: AbilityType[] = [
      'DEPTH_PERCEPTION',
      'DEPTH_INTERVENTION',
      'TIME_INTERVENTION',
    ];
    abilities.forEach((a) => worldState.unlockAbility(a));
    this._logCommand('unlockAllAbilities()');
    return { success: true, message: '解锁所有能力' };
  }

  // ==================== 卡片命令 ====================

  /**
   * 获得卡片
   */
  obtainCard(cardId: string): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    try {
      narrativeEngine.obtainCard(cardId);
      this._logCommand(`obtainCard(${cardId})`);
      return { success: true, message: `获得卡片: ${cardId}` };
    } catch (error) {
      return { success: false, message: '获得卡片失败', error: String(error) };
    }
  }

  /**
   * 获得所有卡片
   */
  obtainAllCards(): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    // TODO: 遍历所有卡片并获得
    this._logCommand('obtainAllCards()');
    return { success: true, message: '获得所有卡片（待实现）' };
  }

  // ==================== 标记命令 ====================

  /**
   * 设置标记
   */
  setFlag(name: string, value: boolean = true): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    worldState.setFlag(name, value);
    this._logCommand(`setFlag(${name}, ${value})`);
    return { success: true, message: `标记 ${name} = ${value}` };
  }

  /**
   * 获取标记
   */
  getFlag(name: string): boolean {
    return worldState.getFlag(name);
  }

  // ==================== 对话命令 ====================

  /**
   * 触发对话
   */
  async triggerDialogue(dialogueId: string): Promise<ICommandResult> {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    try {
      await narrativeEngine.startDialogue(dialogueId);
      this._logCommand(`triggerDialogue(${dialogueId})`);
      return { success: true, message: `触发对话: ${dialogueId}` };
    } catch (error) {
      return { success: false, message: '触发对话失败', error: String(error) };
    }
  }

  /**
   * 跳过当前对话
   */
  skipDialogue(): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    narrativeEngine.skipCurrentDialogue();
    this._logCommand('skipDialogue()');
    return { success: true, message: '跳过对话' };
  }

  // ==================== 玩家命令 ====================

  /**
   * 移动玩家到指定位置
   */
  movePlayer(x: number, y: number): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };
    if (!this._scene) return { success: false, message: '场景未初始化' };

    const player = (this._scene as any)._player;
    if (player) {
      player.setPosition(x, y);
      this._logCommand(`movePlayer(${x}, ${y})`);
      return { success: true, message: `玩家移动到 (${x}, ${y})` };
    }
    return { success: false, message: '玩家不存在' };
  }

  /**
   * 自动寻路到指定位置（简化版：直接移动）
   */
  async navigateTo(x: number, y: number, speed: number = 200): Promise<ICommandResult> {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };
    if (!this._scene) return { success: false, message: '场景未初始化' };

    const player = (this._scene as any)._player;
    if (!player) return { success: false, message: '玩家不存在' };

    return new Promise((resolve) => {
      const startX = player.x;
      const startY = player.y;
      const distance = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2);
      const duration = (distance / speed) * 1000;

      this._scene!.tweens.add({
        targets: player,
        x,
        y,
        duration,
        ease: 'Linear',
        onComplete: () => {
          this._logCommand(`navigateTo(${x}, ${y})`);
          resolve({ success: true, message: `导航完成 (${x}, ${y})` });
        },
      });
    });
  }

  // ==================== 快速设置命令 ====================

  /**
   * 快速设置：跳转到指定章节起点
   */
  gotoChapter(chapter: ChapterID): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    const chapterStartZones: Record<ChapterID, string> = {
      C0: 'C0-Z1',
      C1: 'C1-Z1',
      C2: 'C2-Z1',
      C3: 'C3-Z1',
      C4: 'C4-Z1',
      C5: 'C5-Z1',
      CF: 'CF-Z1',
    };

    const zoneId = chapterStartZones[chapter];
    if (!zoneId) return { success: false, message: `未知章节: ${chapter}` };

    // 设置章节前置条件
    this._setupChapterPrerequisites(chapter);

    return this.teleport(zoneId);
  }

  /**
   * 快速设置：模拟结局条件
   */
  setupEnding(ending: 'A' | 'B' | 'C'): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    switch (ending) {
      case 'A': // 平面稳定
        this.setR(2);
        this.setP(5);
        break;
      case 'B': // 真实释放
        this.setR(5);
        this.setP(25);
        break;
      case 'C': // 成为系统
        this.setR(12);
        this.setP(18);
        break;
    }

    this._logCommand(`setupEnding(${ending})`);
    return { success: true, message: `设置结局 ${ending} 条件` };
  }

  /**
   * 重置游戏状态
   */
  reset(): ICommandResult {
    if (!this._isEnabled) return { success: false, message: '调试命令已禁用' };

    worldState.reset();
    this._logCommand('reset()');
    return { success: true, message: '游戏状态已重置' };
  }

  // ==================== 测试执行 ====================

  /**
   * 执行测试脚本
   */
  async runTest(script: ITestScript): Promise<ITestResult> {
    const startTime = Date.now();
    const stepResults: IStepResult[] = [];
    let passed = true;

    console.log(`[DebugCommands] 开始测试: ${script.name}`);

    try {
      // 执行设置步骤
      if (script.setup) {
        for (const step of script.setup) {
          await this._executeStep(step);
        }
      }

      // 执行测试步骤
      for (const step of script.steps) {
        const result = await this._executeStep(step);
        stepResults.push(result);

        if (!result.passed) {
          passed = false;
          console.error(`[DebugCommands] 步骤失败: ${step.action}`, result);
        }

        // 步骤间延迟
        if (step.delay) {
          await this._delay(step.delay);
        }
      }

      // 执行清理步骤
      if (script.cleanup) {
        for (const step of script.cleanup) {
          await this._executeStep(step);
        }
      }
    } catch (error) {
      passed = false;
      console.error(`[DebugCommands] 测试出错:`, error);
    }

    const result: ITestResult = {
      scriptName: script.name,
      passed,
      steps: stepResults,
      duration: Date.now() - startTime,
    };

    this._testResults.push(result);
    console.log(`[DebugCommands] 测试完成: ${script.name} - ${passed ? '通过' : '失败'}`);

    return result;
  }

  /**
   * 执行单个测试步骤
   */
  private async _executeStep(step: ITestStep): Promise<IStepResult> {
    const result: IStepResult = {
      action: step.action,
      passed: true,
      message: '',
    };

    try {
      // 执行动作
      const commandResult = await this._executeAction(step.action, step.params);
      result.message = commandResult.message;

      if (!commandResult.success) {
        result.passed = false;
        return result;
      }

      // 验证期望
      if (step.expect) {
        const expectResult = this._checkExpectation(step.expect);
        result.expectation = step.expect;
        result.actual = expectResult.actual;
        result.passed = expectResult.passed;
        result.message = expectResult.message;
      }
    } catch (error) {
      result.passed = false;
      result.message = `执行错误: ${error}`;
    }

    return result;
  }

  /**
   * 执行动作
   */
  private async _executeAction(
    action: string,
    params?: Record<string, unknown>
  ): Promise<ICommandResult> {
    switch (action) {
      case 'teleport':
        return this.teleport(params?.zoneId as string);
      case 'setR':
        return this.setR(params?.value as number);
      case 'setP':
        return this.setP(params?.value as number);
      case 'addR':
        return this.addR(params?.delta as number);
      case 'addP':
        return this.addP(params?.delta as number);
      case 'unlockAbility':
        return this.unlockAbility(params?.ability as AbilityType);
      case 'unlockAllAbilities':
        return this.unlockAllAbilities();
      case 'obtainCard':
        return this.obtainCard(params?.cardId as string);
      case 'setFlag':
        return this.setFlag(params?.name as string, params?.value as boolean);
      case 'triggerDialogue':
        return this.triggerDialogue(params?.dialogueId as string);
      case 'skipDialogue':
        return this.skipDialogue();
      case 'movePlayer':
        return this.movePlayer(params?.x as number, params?.y as number);
      case 'navigateTo':
        return this.navigateTo(params?.x as number, params?.y as number);
      case 'completeZone':
        return this.completeZone(params?.zoneId as string);
      case 'gotoChapter':
        return this.gotoChapter(params?.chapter as ChapterID);
      case 'setupEnding':
        return this.setupEnding(params?.ending as 'A' | 'B' | 'C');
      case 'reset':
        return this.reset();
      case 'wait':
        await this._delay((params?.ms as number) || 1000);
        return { success: true, message: `等待 ${params?.ms || 1000}ms` };
      default:
        return { success: false, message: `未知动作: ${action}` };
    }
  }

  /**
   * 检查期望
   */
  private _checkExpectation(expect: IExpectation): {
    passed: boolean;
    actual: unknown;
    message: string;
  } {
    let actual: unknown;
    let passed = false;

    switch (expect.type) {
      case 'counter': {
        const counters = worldState.getCounters();
        actual = counters[expect.target as keyof typeof counters];
        break;
      }
      case 'flag':
        actual = worldState.getFlag(expect.target);
        break;
      case 'zone':
        actual = worldState.getCurrentZone();
        break;
      case 'card':
        actual = narrativeEngine.hasCard(expect.target);
        break;
      case 'ability':
        actual = worldState.hasAbility(expect.target as AbilityType);
        break;
      case 'position': {
        const pos = this.getPlayerPosition();
        actual = pos ? (expect.target === 'x' ? pos.x : pos.y) : null;
        break;
      }
    }

    // 比较
    switch (expect.operator) {
      case 'eq':
        passed = actual === expect.value;
        break;
      case 'gt':
        passed = (actual as number) > (expect.value as number);
        break;
      case 'lt':
        passed = (actual as number) < (expect.value as number);
        break;
      case 'gte':
        passed = (actual as number) >= (expect.value as number);
        break;
      case 'lte':
        passed = (actual as number) <= (expect.value as number);
        break;
      case 'contains':
        passed = String(actual).includes(String(expect.value));
        break;
      case 'exists':
        passed = actual !== undefined && actual !== null;
        break;
    }

    return {
      passed,
      actual,
      message: passed
        ? `期望通过: ${expect.target} ${expect.operator} ${expect.value}`
        : `期望失败: ${expect.target} ${expect.operator} ${expect.value}, 实际值: ${actual}`,
    };
  }

  // ==================== 工具方法 ====================

  private _setupChapterPrerequisites(chapter: ChapterID): void {
    // 根据章节设置前置条件
    const chapterNumber = parseInt(chapter.replace('C', ''));

    if (chapterNumber >= 2) {
      this.unlockAbility('DEPTH_PERCEPTION');
    }
    if (chapterNumber >= 3) {
      this.unlockAbility('DEPTH_INTERVENTION');
    }
    if (chapterNumber >= 4) {
      this.unlockAbility('TIME_INTERVENTION');
    }
  }

  private _logCommand(command: string): void {
    this._commandHistory.push(`${new Date().toISOString()} - ${command}`);
    console.log(`[DebugCommands] ${command}`);
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 获取命令历史
   */
  getCommandHistory(): string[] {
    return [...this._commandHistory];
  }

  /**
   * 获取测试结果
   */
  getTestResults(): ITestResult[] {
    return [...this._testResults];
  }

  /**
   * 清除测试结果
   */
  clearTestResults(): void {
    this._testResults = [];
  }

  /**
   * 打印帮助信息
   */
  help(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    调试命令帮助                              ║
╠══════════════════════════════════════════════════════════════╣
║ Zone 命令:                                                   ║
║   teleport(zoneId)      - 传送到指定 Zone                    ║
║   unlockZone(zoneId)    - 解锁 Zone                          ║
║   completeZone(zoneId)  - 完成 Zone                          ║
║   gotoChapter(chapter)  - 跳转到章节起点                     ║
║                                                              ║
║ 计数器命令:                                                  ║
║   setR(value)           - 设置 R 值                          ║
║   setP(value)           - 设置 P 值                          ║
║   addR(delta)           - 增加 R 值                          ║
║   addP(delta)           - 增加 P 值                          ║
║   setupEnding('A'|'B'|'C') - 设置结局条件                    ║
║                                                              ║
║ 能力命令:                                                    ║
║   unlockAbility(type)   - 解锁能力                           ║
║   unlockAllAbilities()  - 解锁所有能力                       ║
║                                                              ║
║ 卡片/对话命令:                                               ║
║   obtainCard(cardId)    - 获得卡片                           ║
║   triggerDialogue(id)   - 触发对话                           ║
║   skipDialogue()        - 跳过当前对话                       ║
║                                                              ║
║ 玩家命令:                                                    ║
║   movePlayer(x, y)      - 移动玩家                           ║
║   navigateTo(x, y)      - 自动导航                           ║
║                                                              ║
║ 状态命令:                                                    ║
║   getGameState()        - 获取完整状态                       ║
║   setFlag(name, value)  - 设置标记                           ║
║   reset()               - 重置游戏                           ║
║                                                              ║
║ 测试命令:                                                    ║
║   runTest(script)       - 执行测试脚本                       ║
║   getTestResults()      - 获取测试结果                       ║
║                                                              ║
║ 使用方式:                                                    ║
║   在浏览器控制台输入: __DEBUG__.命令名(参数)                 ║
║   例如: __DEBUG__.teleport('C1-Z1')                          ║
╚══════════════════════════════════════════════════════════════╝
    `);
  }
}

// 导出单例
export const debugCommands = DebugCommands.getInstance();
