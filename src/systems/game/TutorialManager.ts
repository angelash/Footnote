/**
 * 教程管理器
 * 管理新手引导和教程跳过功能
 * @module systems/game/TutorialManager
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { worldState } from '@/systems/world';
import { newGamePlusManager } from './NewGamePlus';

export enum TutorialStep {
  /** 移动教学 */
  MOVEMENT = 'movement',
  /** 交互教学 */
  INTERACTION = 'interaction',
  /** 对话教学 */
  DIALOGUE = 'dialogue',
  /** 卡片教学 */
  CARD = 'card',
  /** 深度感知教学 */
  DEPTH_PERCEPTION = 'depth_perception',
  /** 深度介入教学 */
  DEPTH_INTERVENTION = 'depth_intervention',
  /** 时间干预教学 */
  TIME_INTERVENTION = 'time_intervention',
  /** 存档教学 */
  SAVE = 'save',
  /** 物品栏教学 */
  INVENTORY = 'inventory',
}

interface ITutorialConfig {
  step: TutorialStep;
  title: string;
  content: string;
  highlightTarget?: string;
  position?: { x: number; y: number };
  autoAdvance?: boolean;
  advanceDelay?: number;
  skipCondition?: () => boolean;
}

const TUTORIAL_CONFIGS: ITutorialConfig[] = [
  {
    step: TutorialStep.MOVEMENT,
    title: '移动',
    content: '使用 WASD 或方向键移动角色',
    position: { x: 375, y: 700 },
    autoAdvance: true,
    advanceDelay: 5000,
  },
  {
    step: TutorialStep.INTERACTION,
    title: '交互',
    content: '靠近物体后点击进行交互',
    highlightTarget: 'interactable',
    autoAdvance: false,
  },
  {
    step: TutorialStep.DIALOGUE,
    title: '对话',
    content: '点击屏幕或按空格键推进对话\n遇到选项时点击选择',
    autoAdvance: true,
    advanceDelay: 3000,
  },
  {
    step: TutorialStep.CARD,
    title: '卡片',
    content: '收集的卡片会记录重要信息\n可在物品栏中查看',
    autoAdvance: true,
    advanceDelay: 4000,
  },
  {
    step: TutorialStep.DEPTH_PERCEPTION,
    title: '深度感知',
    content: '长按数字键 1 激活深度感知\n可以看到隐藏的内容',
    highlightTarget: 'ability_1',
    skipCondition: () => !worldState.hasAbility('DEPTH_PERCEPTION'),
  },
  {
    step: TutorialStep.DEPTH_INTERVENTION,
    title: '深度介入',
    content: '按数字键 2 激活深度介入\n可以改变结构，但会留下伤痕',
    highlightTarget: 'ability_2',
    skipCondition: () => !worldState.hasAbility('DEPTH_INTERVENTION'),
  },
  {
    step: TutorialStep.TIME_INTERVENTION,
    title: '时间干预',
    content: '按数字键 3 激活时间干预\n可以回溯到之前的节点',
    highlightTarget: 'ability_3',
    skipCondition: () => !worldState.hasAbility('TIME_INTERVENTION'),
  },
  {
    step: TutorialStep.SAVE,
    title: '存档',
    content: '按 ESC 打开菜单可以保存游戏\n游戏也会自动存档',
    autoAdvance: true,
    advanceDelay: 3000,
  },
  {
    step: TutorialStep.INVENTORY,
    title: '物品栏',
    content: '点击右上角按钮打开物品栏\n查看收集的卡片',
    highlightTarget: 'inventory_button',
    autoAdvance: true,
    advanceDelay: 4000,
  },
];

interface ITutorialManagerConfig {
  scene: Phaser.Scene;
}

/**
 * 教程管理器
 */
export class TutorialManager {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  private _backdrop!: Phaser.GameObjects.Rectangle;
  private _tutorialBox!: Phaser.GameObjects.Container;
  private _highlightGraphics!: Phaser.GameObjects.Graphics;

  private _currentStep: TutorialStep | null = null;
  private _completedSteps: Set<TutorialStep> = new Set();
  private _isActive: boolean = false;
  private _canSkipAll: boolean = false;

  constructor(config: ITutorialManagerConfig) {
    this._scene = config.scene;
    this._loadProgress();
    this._checkSkipPermission();
    this._createUI();
  }

  /**
   * 加载进度
   */
  private _loadProgress(): void {
    try {
      const stored = localStorage.getItem('footnote_tutorial_progress');
      if (stored) {
        const steps = JSON.parse(stored) as TutorialStep[];
        steps.forEach((step) => this._completedSteps.add(step));
      }
    } catch (error) {
      console.warn('[TutorialManager] 加载教程进度失败:', error);
    }
  }

  /**
   * 保存进度
   */
  private _saveProgress(): void {
    try {
      localStorage.setItem(
        'footnote_tutorial_progress',
        JSON.stringify(Array.from(this._completedSteps))
      );
    } catch (error) {
      console.error('[TutorialManager] 保存教程进度失败:', error);
    }
  }

  /**
   * 检查跳过权限
   */
  private _checkSkipPermission(): void {
    // NG+玩家可以跳过所有教程
    this._canSkipAll = newGamePlusManager.isNewGamePlus();

    // 或者已完成过游戏
    if (worldState.getFlag('GAME_COMPLETED_ONCE')) {
      this._canSkipAll = true;
    }
  }

  /**
   * 创建UI
   */
  private _createUI(): void {
    const { width, height } = this._scene.scale;

    this._container = this._scene.add.container(0, 0);
    this._container.setDepth(1500);
    this._container.setVisible(false);

    // 半透明背景
    this._backdrop = this._scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    this._container.add(this._backdrop);

    // 高亮图形
    this._highlightGraphics = this._scene.add.graphics();
    this._container.add(this._highlightGraphics);

    // 教程框
    this._tutorialBox = this._scene.add.container(width / 2, height / 2);
    this._container.add(this._tutorialBox);
  }

  /**
   * 显示教程步骤
   */
  public showStep(step: TutorialStep): void {
    // 检查是否已完成
    if (this._completedSteps.has(step)) {
      return;
    }

    // 获取配置
    const config = TUTORIAL_CONFIGS.find((c) => c.step === step);
    if (!config) {
      console.warn(`[TutorialManager] 未知教程步骤: ${step}`);
      return;
    }

    // 检查跳过条件
    if (config.skipCondition && config.skipCondition()) {
      return;
    }

    this._currentStep = step;
    this._isActive = true;

    this._renderTutorialBox(config);
    this._container.setVisible(true);

    // 淡入
    this._container.setAlpha(0);
    this._scene.tweens.add({
      targets: this._container,
      alpha: 1,
      duration: 300,
    });

    // 自动推进
    if (config.autoAdvance && config.advanceDelay) {
      this._scene.time.delayedCall(config.advanceDelay, () => {
        if (this._currentStep === step) {
          this.completeStep();
        }
      });
    }

    // 锁定输入
    eventBus.emit(GameEvent.INPUT_LOCK, {});
  }

  /**
   * 渲染教程框
   */
  private _renderTutorialBox(config: ITutorialConfig): void {
    this._tutorialBox.removeAll(true);
    this._highlightGraphics.clear();

    const boxWidth = 350;
    const boxHeight = 150;

    // 位置
    const pos = config.position || {
      x: this._scene.scale.width / 2,
      y: this._scene.scale.height / 2,
    };
    this._tutorialBox.setPosition(pos.x, pos.y);

    // 背景
    const bg = this._scene.add.rectangle(0, 0, boxWidth, boxHeight, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(2, 0x4a9eff);
    this._tutorialBox.add(bg);

    // 标题
    const title = this._scene.add.text(0, -50, config.title, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#4a9eff',
    });
    title.setOrigin(0.5);
    this._tutorialBox.add(title);

    // 内容
    const content = this._scene.add.text(0, 0, config.content, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 5,
    });
    content.setOrigin(0.5);
    this._tutorialBox.add(content);

    // 按钮区域
    const buttonY = 45;

    // 继续按钮
    const continueBtn = this._scene.add.rectangle(-60, buttonY, 100, 35, 0x2a4a6a);
    continueBtn.setStrokeStyle(1, 0x4a9eff);
    continueBtn.setInteractive({ useHandCursor: true });
    continueBtn.on('pointerover', () => continueBtn.setFillStyle(0x3a5a7a));
    continueBtn.on('pointerout', () => continueBtn.setFillStyle(0x2a4a6a));
    continueBtn.on('pointerdown', () => this.completeStep());
    this._tutorialBox.add(continueBtn);

    const continueText = this._scene.add.text(-60, buttonY, '继续', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#4a9eff',
    });
    continueText.setOrigin(0.5);
    this._tutorialBox.add(continueText);

    // 跳过全部按钮（仅NG+可用）
    if (this._canSkipAll) {
      const skipBtn = this._scene.add.rectangle(60, buttonY, 100, 35, 0x4a2a2a);
      skipBtn.setStrokeStyle(1, 0xff6644);
      skipBtn.setInteractive({ useHandCursor: true });
      skipBtn.on('pointerover', () => skipBtn.setFillStyle(0x5a3a3a));
      skipBtn.on('pointerout', () => skipBtn.setFillStyle(0x4a2a2a));
      skipBtn.on('pointerdown', () => this.skipAll());
      this._tutorialBox.add(skipBtn);

      const skipText = this._scene.add.text(60, buttonY, '跳过全部', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ff6644',
      });
      skipText.setOrigin(0.5);
      this._tutorialBox.add(skipText);
    }

    // 高亮目标
    if (config.highlightTarget) {
      this._highlightTarget(config.highlightTarget);
    }
  }

  /**
   * 高亮目标
   */
  private _highlightTarget(targetName: string): void {
    // 查找目标对象
    const target = this._scene.children.getByName(targetName);
    if (!target || !('getBounds' in target)) {
      return;
    }

    const targetWithBounds = target as unknown as Phaser.GameObjects.Sprite;
    const bounds = targetWithBounds.getBounds();

    // 绘制高亮框
    this._highlightGraphics.lineStyle(3, 0x4a9eff, 1);
    this._highlightGraphics.strokeRoundedRect(
      bounds.x - 5,
      bounds.y - 5,
      bounds.width + 10,
      bounds.height + 10,
      8
    );

    // 脉冲动画
    this._scene.tweens.add({
      targets: this._highlightGraphics,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 完成当前步骤
   */
  public completeStep(): void {
    if (!this._currentStep) return;

    this._completedSteps.add(this._currentStep);
    this._saveProgress();

    this._hide();
  }

  /**
   * 跳过所有教程
   */
  public skipAll(): void {
    if (!this._canSkipAll) return;

    // 标记所有步骤为完成
    TUTORIAL_CONFIGS.forEach((config) => {
      this._completedSteps.add(config.step);
    });
    this._saveProgress();

    this._hide();

    // 显示提示
    eventBus.emitTyped(GameEvent.UI_TOAST, {
      message: '已跳过所有教程',
      type: 'info',
    });
  }

  /**
   * 隐藏教程
   */
  private _hide(): void {
    this._scene.tweens.add({
      targets: this._container,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this._container.setVisible(false);
        this._currentStep = null;
        this._isActive = false;
        this._highlightGraphics.clear();
        this._scene.tweens.killTweensOf(this._highlightGraphics);

        // 解锁输入
        eventBus.emit(GameEvent.INPUT_UNLOCK, {});
      },
    });
  }

  /**
   * 检查并显示下一个教程
   */
  public checkAndShowNext(): void {
    for (const config of TUTORIAL_CONFIGS) {
      if (!this._completedSteps.has(config.step)) {
        if (!config.skipCondition || !config.skipCondition()) {
          this.showStep(config.step);
          return;
        }
      }
    }
  }

  /**
   * 是否已完成步骤
   */
  public isStepCompleted(step: TutorialStep): boolean {
    return this._completedSteps.has(step);
  }

  /**
   * 是否全部完成
   */
  public isAllCompleted(): boolean {
    return TUTORIAL_CONFIGS.every(
      (config) =>
        this._completedSteps.has(config.step) || (config.skipCondition && config.skipCondition())
    );
  }

  /**
   * 重置进度
   */
  public resetProgress(): void {
    this._completedSteps.clear();
    localStorage.removeItem('footnote_tutorial_progress');
  }

  /**
   * 是否活跃
   */
  public isActive(): boolean {
    return this._isActive;
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this._container?.destroy();
  }
}
