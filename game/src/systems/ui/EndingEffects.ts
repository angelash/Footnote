/**
 * 结局演出效果系统
 * 三结局的视觉演出
 * @module systems/ui/EndingEffects
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { UI_FONT_SIZE } from '@/config/ui.config';
import { worldState } from '@/systems/world';
import { newGamePlusManager } from '@/systems/game/NewGamePlus';

export enum EndingType {
  /** 结局A：继续收敛（平面稳定） */
  CONVERGENCE = 'A',
  /** 结局B：释放表示（真实释放） */
  RELEASE = 'B',
  /** 结局C：承载字段（成为桥接） */
  CARRIER = 'C',
}

interface IEndingEffectsConfig {
  scene: Phaser.Scene;
}

/**
 * 结局演出效果管理器
 */
export class EndingEffects {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  private _isPlaying: boolean = false;

  constructor(config: IEndingEffectsConfig) {
    this._scene = config.scene;
    this._createContainer();
    this._setupEventListeners();
  }

  /**
   * 创建容器
   */
  private _createContainer(): void {
    const { width, height } = this._scene.scale;
    this._container = this._scene.add.container(width / 2, height / 2);
    this._container.setDepth(2000);
    this._container.setAlpha(0);
  }

  /**
   * 设置事件监听
   */
  private _setupEventListeners(): void {
    eventBus.on(GameEvent.ENDING_TRIGGERED, this._onEndingTriggered, this);
    // 监听结局FLAG设置
    eventBus.on(GameEvent.FLAG_SET, this._onFlagSet, this);
  }

  /**
   * 监听FLAG设置事件，自动触发结局
   */
  private _onFlagSet(data: { flagName: string; value: boolean }): void {
    if (!data.value) return;

    // 检查是否是结局FLAG
    if (data.flagName === 'FLAG_ENDING_A') {
      this.triggerEnding(EndingType.CONVERGENCE);
    } else if (data.flagName === 'FLAG_ENDING_B') {
      this.triggerEnding(EndingType.RELEASE);
    } else if (data.flagName === 'FLAG_ENDING_C') {
      this.triggerEnding(EndingType.CARRIER);
    }
  }

  /**
   * 判定可选结局
   * @param R 无收益残差值
   * @param W 世界可读性值
   * @returns 可选结局列表
   */
  public determineAvailableEndings(R: number, W: number): string[] {
    const available: string[] = [];

    // 结局A: 继续收敛 - R < 6 且 W > 60
    if (R < 6 && W > 60) available.push('A');

    // 结局B: 释放表示 - R >= 6 且 40 < W <= 60
    if (R >= 6 && W > 40 && W <= 60) available.push('B');

    // 结局C: 承载字段 - R >= 10 且 W <= 40
    if (R >= 10 && W <= 40) available.push('C');

    // 如果没有满足条件的结局，默认可选A
    if (available.length === 0) available.push('A');

    return available;
  }

  /**
   * 获取当前可选结局（基于当前世界状态）
   */
  public getAvailableEndings(): string[] {
    const counters = worldState.getCounters();
    return this.determineAvailableEndings(counters.R, counters.W);
  }

  /**
   * 检查结局是否可选
   */
  public isEndingAvailable(ending: string): boolean {
    return this.getAvailableEndings().includes(ending);
  }

  /**
   * 获取结局不可选的原因
   */
  public getEndingRequirement(ending: string): string {
    switch (ending) {
      case 'A':
        return 'R < 6 且 W > 60';
      case 'B':
        return 'R ≥ 6 且 40 < W ≤ 60';
      case 'C':
        return 'R ≥ 10 且 W ≤ 40';
      default:
        return '未知条件';
    }
  }

  /**
   * 结局触发处理
   */
  private _onEndingTriggered(data: { ending: EndingType }): void {
    if (this._isPlaying) return;
    this._isPlaying = true;

    switch (data.ending) {
      case EndingType.CONVERGENCE:
        this._playEndingA();
        break;
      case EndingType.RELEASE:
        this._playEndingB();
        break;
      case EndingType.CARRIER:
        this._playEndingC();
        break;
    }
  }

  /**
   * 结局A：继续收敛
   * 视觉：稳定、有序、略带压抑
   */
  private _playEndingA(): void {
    const { width, height } = this._scene.scale;
    this._container.removeAll(true);

    // 淡入黑色背景
    const bg = this._scene.add.rectangle(0, 0, width, height, 0x0a0a0a, 0);
    this._container.add(bg);

    // 收敛线条动画
    const lines: Phaser.GameObjects.Line[] = [];
    for (let i = 0; i < 20; i++) {
      const line = this._scene.add.line(
        0,
        0,
        Phaser.Math.Between(-width / 2, width / 2),
        -height / 2,
        0,
        0,
        0x4444ff,
        0.5
      );
      line.setLineWidth(2);
      this._container.add(line);
      lines.push(line);
    }

    // 中心文字
    const titleText = this._scene.add.text(0, -50, '收敛继续', {
      fontFamily: 'serif',
      fontSize: UI_FONT_SIZE.HUGE,
      color: '#4444ff',
    });
    titleText.setOrigin(0.5);
    titleText.setAlpha(0);
    this._container.add(titleText);

    const subtitleText = this._scene.add.text(0, 20, '城还能继续被读。', {
      fontFamily: 'serif',
      fontSize: UI_FONT_SIZE.ICON,
      color: '#aaaacc',
    });
    subtitleText.setOrigin(0.5);
    subtitleText.setAlpha(0);
    this._container.add(subtitleText);

    const fieldText = this._scene.add.text(0, 80, '字段：◦◦◦（边缘保留）', {
      fontFamily: 'monospace',
      fontSize: UI_FONT_SIZE.MEDIUM,
      color: '#666688',
    });
    fieldText.setOrigin(0.5);
    fieldText.setAlpha(0);
    this._container.add(fieldText);

    // 动画序列
    this._scene.tweens.add({
      targets: this._container,
      alpha: 1,
      duration: 1000,
    });

    this._scene.tweens.add({
      targets: bg,
      fillAlpha: 0.95,
      duration: 2000,
    });

    // 线条收敛动画
    lines.forEach((line, i) => {
      this._scene.tweens.add({
        targets: line,
        x2: 0,
        y2: 0,
        duration: 2000,
        delay: i * 100,
        ease: 'Sine.easeIn',
      });
    });

    // 文字淡入
    this._scene.time.delayedCall(2500, () => {
      this._scene.tweens.add({
        targets: titleText,
        alpha: 1,
        y: -60,
        duration: 1000,
        ease: 'Sine.easeOut',
      });
    });

    this._scene.time.delayedCall(3500, () => {
      this._scene.tweens.add({
        targets: subtitleText,
        alpha: 1,
        duration: 800,
      });
    });

    this._scene.time.delayedCall(4500, () => {
      this._scene.tweens.add({
        targets: fieldText,
        alpha: 0.7,
        duration: 800,
      });
    });

    // 结束后跳转
    this._scene.time.delayedCall(7000, () => {
      this._transitionToEpilogue(EndingType.CONVERGENCE);
    });
  }

  /**
   * 结局B：释放表示
   * 视觉：混乱、多彩、自由
   */
  private _playEndingB(): void {
    const { width, height } = this._scene.scale;
    this._container.removeAll(true);

    // 渐变背景
    const bg = this._scene.add.rectangle(0, 0, width, height, 0x0a0a1a, 0);
    this._container.add(bg);

    // 版本碎片
    const fragments: Phaser.GameObjects.Text[] = [];
    const fragmentTexts = ['V-A', 'V-B', 'V-C', 'V-?', '◦', '◇', '□', '△'];

    for (let i = 0; i < 30; i++) {
      const frag = this._scene.add.text(
        Phaser.Math.Between(-width / 2, width / 2),
        Phaser.Math.Between(-height / 2, height / 2),
        Phaser.Math.RND.pick(fragmentTexts),
        {
          fontFamily: 'monospace',
          fontSize: `${Phaser.Math.Between(14, 32)}px`,
          color: Phaser.Display.Color.IntegerToColor(Phaser.Math.Between(0x4444ff, 0xffaa44)).rgba,
        }
      );
      frag.setOrigin(0.5);
      frag.setAlpha(0);
      frag.setRotation(Phaser.Math.FloatBetween(-0.3, 0.3));
      this._container.add(frag);
      fragments.push(frag);
    }

    // 中心文字
    const titleText = this._scene.add.text(0, -50, '表示松开', {
      fontFamily: 'serif',
      fontSize: UI_FONT_SIZE.HUGE,
      color: '#ffaa44',
    });
    titleText.setOrigin(0.5);
    titleText.setAlpha(0);
    this._container.add(titleText);

    const subtitleText = this._scene.add.text(0, 20, '版本不再排队。它们同时存在。', {
      fontFamily: 'serif',
      fontSize: UI_FONT_SIZE.ICON,
      color: '#ccaa88',
    });
    subtitleText.setOrigin(0.5);
    subtitleText.setAlpha(0);
    this._container.add(subtitleText);

    // 动画序列
    this._scene.tweens.add({
      targets: this._container,
      alpha: 1,
      duration: 500,
    });

    this._scene.tweens.add({
      targets: bg,
      fillAlpha: 0.9,
      duration: 1500,
    });

    // 碎片飘动动画
    fragments.forEach((frag, i) => {
      this._scene.tweens.add({
        targets: frag,
        alpha: { from: 0, to: 0.7 },
        y: frag.y + Phaser.Math.Between(-50, 50),
        rotation: frag.rotation + Phaser.Math.FloatBetween(-0.5, 0.5),
        duration: 3000,
        delay: i * 50,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    });

    // 文字淡入
    this._scene.time.delayedCall(2000, () => {
      this._scene.tweens.add({
        targets: titleText,
        alpha: 1,
        scale: { from: 0.8, to: 1 },
        duration: 1000,
        ease: 'Back.easeOut',
      });
    });

    this._scene.time.delayedCall(3000, () => {
      this._scene.tweens.add({
        targets: subtitleText,
        alpha: 1,
        duration: 800,
      });
    });

    // 结束后跳转
    this._scene.time.delayedCall(7000, () => {
      this._transitionToEpilogue(EndingType.RELEASE);
    });
  }

  /**
   * 结局C：承载字段
   * 视觉：庄重、牺牲、希望
   */
  private _playEndingC(): void {
    const { width, height } = this._scene.scale;
    this._container.removeAll(true);

    // 深色背景
    const bg = this._scene.add.rectangle(0, 0, width, height, 0x0a0a0a, 0);
    this._container.add(bg);

    // 字段符号
    const fieldSymbol = this._scene.add.text(0, -100, '◦◦◦', {
      fontFamily: 'monospace',
      fontSize: UI_FONT_SIZE.GIANT,
      color: '#88ff88',
    });
    fieldSymbol.setOrigin(0.5);
    fieldSymbol.setAlpha(0);
    this._container.add(fieldSymbol);

    // 承载光环
    const halo = this._scene.add.circle(0, 0, 150, 0x88ff88, 0);
    halo.setStrokeStyle(3, 0x88ff88, 0.5);
    this._container.add(halo);

    // 中心文字
    const titleText = this._scene.add.text(0, 20, '字段交接', {
      fontFamily: 'serif',
      fontSize: UI_FONT_SIZE.HUGE,
      color: '#88ff88',
    });
    titleText.setOrigin(0.5);
    titleText.setAlpha(0);
    this._container.add(titleText);

    const subtitleText = this._scene.add.text(0, 90, '你把代价背走了。', {
      fontFamily: 'serif',
      fontSize: UI_FONT_SIZE.ICON,
      color: '#aaffaa',
    });
    subtitleText.setOrigin(0.5);
    subtitleText.setAlpha(0);
    this._container.add(subtitleText);

    const descText = this._scene.add.text(
      0,
      130,
      '你不是升维成神，你是背债。\n但你让某些人多活了一点。',
      {
        fontFamily: 'serif',
        fontSize: UI_FONT_SIZE.MEDIUM,
        color: '#88aa88',
        align: 'center',
      }
    );
    descText.setOrigin(0.5);
    descText.setAlpha(0);
    this._container.add(descText);

    // 动画序列
    this._scene.tweens.add({
      targets: this._container,
      alpha: 1,
      duration: 500,
    });

    this._scene.tweens.add({
      targets: bg,
      fillAlpha: 0.95,
      duration: 2000,
    });

    // 光环扩散
    this._scene.tweens.add({
      targets: halo,
      fillAlpha: 0.1,
      strokeAlpha: 0.8,
      scale: { from: 0.5, to: 1.2 },
      duration: 2000,
      ease: 'Sine.easeOut',
    });

    // 字段符号显现
    this._scene.time.delayedCall(1000, () => {
      this._scene.tweens.add({
        targets: fieldSymbol,
        alpha: 1,
        y: -120,
        duration: 1500,
        ease: 'Sine.easeOut',
      });

      // 符号脉冲
      this._scene.tweens.add({
        targets: fieldSymbol,
        scale: { from: 1, to: 1.1 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 1500,
      });
    });

    // 文字淡入
    this._scene.time.delayedCall(2500, () => {
      this._scene.tweens.add({
        targets: titleText,
        alpha: 1,
        duration: 1000,
      });
    });

    this._scene.time.delayedCall(3500, () => {
      this._scene.tweens.add({
        targets: subtitleText,
        alpha: 1,
        duration: 800,
      });
    });

    this._scene.time.delayedCall(4500, () => {
      this._scene.tweens.add({
        targets: descText,
        alpha: 0.8,
        duration: 800,
      });
    });

    // 结束后跳转
    this._scene.time.delayedCall(8000, () => {
      this._transitionToEpilogue(EndingType.CARRIER);
    });
  }

  /**
   * 过渡到尾声
   */
  private _transitionToEpilogue(endingType?: EndingType): void {
    this._scene.tweens.add({
      targets: this._container,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        this._isPlaying = false;

        // 记录通关（如果有结局类型）
        if (endingType) {
          newGamePlusManager.recordCompletion(endingType);
        }

        eventBus.emit(GameEvent.ZONE_TRANSITION, { targetZone: 'CF-Z6' });
      },
    });
  }

  /**
   * 触发结局
   */
  public triggerEnding(ending: EndingType): void {
    eventBus.emit(GameEvent.ENDING_TRIGGERED, { ending });
  }

  /**
   * 销毁
   */
  public destroy(): void {
    eventBus.off(GameEvent.ENDING_TRIGGERED, this._onEndingTriggered, this);
    eventBus.off(GameEvent.FLAG_SET, this._onFlagSet, this);
    this._container?.destroy();
  }
}
