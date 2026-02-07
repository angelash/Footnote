/**
 * 结局演出效果系统
 * 三结局的视觉演出（数据驱动）
 * @module systems/ui/EndingEffects
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { UI_FONT_SIZE } from '@/config/ui.config';
import { worldState } from '@/systems/world';
import { narrativeEngine } from '@/systems/narrative';
import { newGamePlusManager } from '@/systems/game/NewGamePlus';
import {
  ENDING_BY_CODE,
  determineAvailableEndings,
  createEndingResult,
  getEndingRequirementText,
  formatPlayTime,
  type IEndingConfig,
} from '@/config/endings.config';
import type { IEndingResult, EndingType as EndingTypeEnum } from '@/types';

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
 * 结局演出效果管理器（数据驱动版本）
 */
export class EndingEffects {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  private _isPlaying: boolean = false;
  /** 当前结局结果（演出完成后可获取） */
  private _currentResult: IEndingResult | null = null;
  /** 游戏开始时间（用于计算总时长） */
  private _gameStartTime: number;

  constructor(config: IEndingEffectsConfig) {
    this._scene = config.scene;
    this._gameStartTime = Date.now();
    this._createContainer();
    this._setupEventListeners();
  }

  /**
   * 获取当前结局结果
   */
  public getCurrentResult(): IEndingResult | null {
    return this._currentResult;
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
   * 判定可选结局（使用配置数据）
   * @param R 无收益残差值
   * @param W 世界可读性值
   * @returns 可选结局列表
   */
  public determineAvailableEndings(R: number, W: number): string[] {
    const counters = worldState.getCounters();
    return determineAvailableEndings(R, counters.P, W);
  }

  /**
   * 获取当前可选结局（基于当前世界状态）
   */
  public getAvailableEndings(): string[] {
    const counters = worldState.getCounters();
    return determineAvailableEndings(counters.R, counters.P, counters.W);
  }

  /**
   * 检查结局是否可选
   */
  public isEndingAvailable(ending: string): boolean {
    return this.getAvailableEndings().includes(ending);
  }

  /**
   * 获取结局不可选的原因（使用配置数据）
   */
  public getEndingRequirement(ending: string): string {
    return getEndingRequirementText(ending as 'A' | 'B' | 'C');
  }

  /**
   * 获取结局配置
   */
  public getEndingConfig(ending: 'A' | 'B' | 'C'): IEndingConfig {
    return ENDING_BY_CODE[ending];
  }

  /**
   * 结局触发处理（数据驱动）
   */
  private _onEndingTriggered(data: { ending: EndingType }): void {
    if (this._isPlaying) return;
    this._isPlaying = true;

    // 生成结局结果数据
    this._generateEndingResult(data.ending);

    // 播放结局演出
    switch (data.ending) {
      case EndingType.CONVERGENCE:
        this._playEndingFromConfig(ENDING_BY_CODE['A'], EndingType.CONVERGENCE);
        break;
      case EndingType.RELEASE:
        this._playEndingFromConfig(ENDING_BY_CODE['B'], EndingType.RELEASE);
        break;
      case EndingType.CARRIER:
        this._playEndingFromConfig(ENDING_BY_CODE['C'], EndingType.CARRIER);
        break;
    }
  }

  /**
   * 生成结局结果数据
   */
  private _generateEndingResult(ending: EndingType): void {
    const counters = worldState.getCounters();
    const playTime = Date.now() - this._gameStartTime;
    
    // 获取已回收的伏笔
    const foreshadowsResolved: string[] = [];
    const foreshadowStates = narrativeEngine.getAllForeshadowStates();
    foreshadowStates.forEach((state, id) => {
      if (state.revealed) {
        foreshadowsResolved.push(id);
      }
    });

    // 映射 EndingType 到 EndingTypeEnum
    const endingTypeMap: Record<EndingType, EndingTypeEnum> = {
      [EndingType.CONVERGENCE]: 'A_STABLE_PLANE',
      [EndingType.RELEASE]: 'B_RELEASE_TRUTH',
      [EndingType.CARRIER]: 'C_BECOME_SYSTEM',
    };

    this._currentResult = createEndingResult(
      endingTypeMap[ending],
      foreshadowsResolved,
      playTime,
      counters
    );
  }

  /**
   * 通用结局演出方法（数据驱动）
   */
  private _playEndingFromConfig(config: IEndingConfig, endingType: EndingType): void {
    const { width, height } = this._scene.scale;
    this._container.removeAll(true);

    const { presentation } = config;

    // 淡入背景
    const bg = this._scene.add.rectangle(0, 0, width, height, 0x0a0a0a, 0);
    this._container.add(bg);

    // 根据结局类型添加特效元素
    this._addEndingEffects(config);

    // 字段符号
    const fieldSymbol = this._scene.add.text(0, -100, presentation.fieldSymbol, {
      fontFamily: 'monospace',
      fontSize: UI_FONT_SIZE.GIANT,
      color: `#${presentation.themeColor.toString(16).padStart(6, '0')}`,
    });
    fieldSymbol.setOrigin(0.5);
    fieldSymbol.setAlpha(0);
    this._container.add(fieldSymbol);

    // 主标题
    const titleText = this._scene.add.text(0, -20, presentation.title, {
      fontFamily: 'serif',
      fontSize: UI_FONT_SIZE.HUGE,
      color: `#${presentation.themeColor.toString(16).padStart(6, '0')}`,
    });
    titleText.setOrigin(0.5);
    titleText.setAlpha(0);
    this._container.add(titleText);

    // 副标题
    const subtitleText = this._scene.add.text(0, 40, presentation.subtitle, {
      fontFamily: 'serif',
      fontSize: UI_FONT_SIZE.ICON,
      color: `#${presentation.accentColor.toString(16).padStart(6, '0')}`,
    });
    subtitleText.setOrigin(0.5);
    subtitleText.setAlpha(0);
    this._container.add(subtitleText);

    // 描述文本（多行）
    const descY = 90;
    const descTexts: Phaser.GameObjects.Text[] = [];
    presentation.description.forEach((line, index) => {
      const descText = this._scene.add.text(0, descY + index * 30, line, {
        fontFamily: 'serif',
        fontSize: UI_FONT_SIZE.MEDIUM,
        color: `#${presentation.accentColor.toString(16).padStart(6, '0')}`,
      });
      descText.setOrigin(0.5);
      descText.setAlpha(0); // 初始透明度为0，后续通过动画渐显
      this._container.add(descText);
      descTexts.push(descText);
    });

    // 结局统计（如果有结果数据）
    if (this._currentResult) {
      const statsY = descY + presentation.description.length * 30 + 40;
      const statsText = this._scene.add.text(
        0, statsY,
        `游戏时长: ${formatPlayTime(this._currentResult.totalPlayTime)} | 伏笔回收: ${this._currentResult.foreshadowsResolved.length}/26`,
        {
          fontFamily: 'monospace',
          fontSize: UI_FONT_SIZE.SMALL,
          color: '#888888',
        }
      );
      statsText.setOrigin(0.5);
      statsText.setAlpha(0);
      this._container.add(statsText);

      // 延迟显示统计
      this._scene.time.delayedCall(presentation.duration - 2000, () => {
        this._scene.tweens.add({
          targets: statsText,
          alpha: 0.7,
          duration: 800,
        });
      });
    }

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

    // 标题淡入
    this._scene.time.delayedCall(2500, () => {
      this._scene.tweens.add({
        targets: titleText,
        alpha: 1,
        y: -30,
        duration: 1000,
        ease: 'Sine.easeOut',
      });
    });

    // 副标题淡入
    this._scene.time.delayedCall(3500, () => {
      this._scene.tweens.add({
        targets: subtitleText,
        alpha: 1,
        duration: 800,
      });
    });

    // 描述文本依次淡入
    descTexts.forEach((text, index) => {
      this._scene.time.delayedCall(4500 + index * 400, () => {
        this._scene.tweens.add({
          targets: text,
          alpha: 0.8,
          duration: 600,
        });
      });
    });

    // 结束后跳转
    this._scene.time.delayedCall(presentation.duration, () => {
      this._transitionToEpilogue(endingType);
    });
  }

  /**
   * 添加结局特效元素
   */
  private _addEndingEffects(config: IEndingConfig): void {
    const { width, height } = this._scene.scale;

    switch (config.code) {
      case 'A':
        // 收敛线条动画
        this._addConvergenceLines(width, height, config.presentation.themeColor);
        break;
      case 'B':
        // 版本碎片动画
        this._addVersionFragments(width, height);
        break;
      case 'C':
        // 承载光环
        this._addCarrierHalo(config.presentation.themeColor);
        break;
    }
  }

  /**
   * 添加收敛线条（结局A特效）
   */
  private _addConvergenceLines(width: number, height: number, color: number): void {
    const lines: Phaser.GameObjects.Line[] = [];
    for (let i = 0; i < 20; i++) {
      const line = this._scene.add.line(
        0,
        0,
        Phaser.Math.Between(-width / 2, width / 2),
        -height / 2,
        0,
        0,
        color,
        0.5
      );
      line.setLineWidth(2);
      this._container.add(line);
      lines.push(line);
    }

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
  }

  /**
   * 添加版本碎片（结局B特效）
   */
  private _addVersionFragments(width: number, height: number): void {
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

      // 碎片飘动动画
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
    }
  }

  /**
   * 添加承载光环（结局C特效）
   */
  private _addCarrierHalo(color: number): void {
    const halo = this._scene.add.circle(0, 0, 150, color, 0);
    halo.setStrokeStyle(3, color, 0.5);
    this._container.add(halo);

    // 光环扩散
    this._scene.tweens.add({
      targets: halo,
      fillAlpha: 0.1,
      strokeAlpha: 0.8,
      scale: { from: 0.5, to: 1.2 },
      duration: 2000,
      ease: 'Sine.easeOut',
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
