/**
 * 对话UI系统
 * 处理对话显示、打字机效果、选项、立绘等
 * 支持键盘导航和屏幕阅读器
 * @module systems/ui/DialogueUI
 */

import Phaser from 'phaser';
import { createLogger } from '@/utils/Logger';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { i18n } from '@/systems/i18n/I18nManager';
import { a11yManager, type IFocusableElement } from '@/systems/accessibility/A11yManager';

const logger = createLogger('DialogueUI');
import { TEXT_STYLES, COLORS } from '@/config/game.config';
import { UI, UI_FONT_SIZE } from '@/config/ui.config';
import {
  CharacterId,
  getPortraitKey as getCharacterPortraitKey,
  type CharacterExpression,
} from '@/config/characters.config';
import type { IDialogue, IDialogueChoice } from '@/types';

// ==================== 配置常量 ====================

const CONFIG = {
  /** 打字机效果每字符延迟(ms) */
  TYPEWRITER_DELAY: 30,
  /** 对话框宽度 */
  BOX_WIDTH: 700,
  /** 对话框高度 */
  BOX_HEIGHT: UI.DIALOGUE.BOX_HEIGHT,
  /** 对话框底部边距 */
  BOX_MARGIN_BOTTOM: UI.DIALOGUE.BOX_MARGIN_BOTTOM,
  /** 立绘宽度 */
  PORTRAIT_WIDTH: 200,
  /** 立绘高度 */
  PORTRAIT_HEIGHT: 300,
  /** 选项按钮高度 */
  CHOICE_HEIGHT: UI.DIALOGUE.CHOICE_HEIGHT,
  /** 选项间距 */
  CHOICE_SPACING: UI.DIALOGUE.CHOICE_SPACING,
};

// ==================== 类型定义 ====================

interface IDialogueUIConfig {
  scene: Phaser.Scene;
  onDialogueEnd?: (dialogueId: string) => void;
  onChoiceSelected?: (dialogueId: string, choiceIndex: number) => void;
}

interface IDialogueState {
  currentDialogue: IDialogue | null;
  currentLineIndex: number;
  isTyping: boolean;
  fullText: string;
  displayedText: string;
  typewriterTimer: Phaser.Time.TimerEvent | null;
  /** 对话已结束，等待用户点击关闭 */
  isWaitingToClose: boolean;
}

// ==================== DialogueUI类 ====================

/** 焦点组ID前缀 */
const FOCUS_GROUP_PREFIX = 'dialogue-choices-';

/**
 * 对话UI管理器
 */
export class DialogueUI {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  private _state: IDialogueState;

  // UI元素
  private _background!: Phaser.GameObjects.Graphics;
  private _speakerText!: Phaser.GameObjects.Text;
  private _dialogueText!: Phaser.GameObjects.Text;
  private _continueIndicator!: Phaser.GameObjects.Text;
  private _portrait!: Phaser.GameObjects.Image | null;
  private _choicesContainer!: Phaser.GameObjects.Container;
  private _choiceButtons: Phaser.GameObjects.Container[] = [];

  // 回调
  private _onDialogueEnd?: (dialogueId: string) => void;
  private _onChoiceSelected?: (dialogueId: string, choiceIndex: number) => void;

  // 国际化
  private _unsubscribeI18n?: () => void;

  // 键盘导航
  private _focusGroupId: string | null = null;
  private _keyDownHandler: ((event: KeyboardEvent) => void) | null = null;
  private _currentFocusIndex: number = -1;

  constructor(config: IDialogueUIConfig) {
    this._scene = config.scene;
    this._onDialogueEnd = config.onDialogueEnd;
    this._onChoiceSelected = config.onChoiceSelected;

    this._state = {
      currentDialogue: null,
      currentLineIndex: 0,
      isTyping: false,
      fullText: '',
      displayedText: '',
      typewriterTimer: null,
      isWaitingToClose: false,
    };

    this._createUI();
    this._setupInput();
    this._setupI18n();
  }

  /**
   * 设置国际化监听
   */
  private _setupI18n(): void {
    this._unsubscribeI18n = i18n.onLocaleChange(() => {
      this._updateI18nTexts();
    });
  }

  /**
   * 更新国际化文本
   */
  private _updateI18nTexts(): void {
    // 继续指示器不需要更新（是符号）
    // 如果有当前对话，可能需要重新加载翻译
    // 这里主要是为了支持动态语言切换
  }

  // ==================== 公共方法 ====================

  /**
   * 显示对话
   */
  showDialogue(dialogue: IDialogue): void {
    // 首先停止任何正在运行的打字机效果
    // 防止多个定时器同时运行导致字符重复
    this._stopTypewriter();

    this._state.currentDialogue = dialogue;
    this._state.currentLineIndex = 0;
    this._state.fullText = dialogue.text;
    this._state.displayedText = '';
    this._state.isTyping = true;
    this._state.isWaitingToClose = false;

    // 更新UI
    this._speakerText.setText(dialogue.speaker);
    this._dialogueText.setText('');
    this._continueIndicator.setVisible(false);
    this._hideChoices();

    // 显示立绘（支持表情，默认neutral）
    const expression = dialogue.expression || 'neutral';
    this._showPortrait(dialogue.speaker, expression as CharacterExpression);

    // 显示容器和全屏点击层
    this._container.setVisible(true);
    this._container.setAlpha(0);
    this._clickLayer?.setVisible(true);

    this._scene.tweens.add({
      targets: this._container,
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });

    // 开始打字机效果
    this._startTypewriter();

    // 设置键盘导航
    this._setupKeyboardNavigation();

    // 播报对话内容给屏幕阅读器
    a11yManager.announceDialogue(dialogue.speaker, dialogue.text);

    // 发送事件
    eventBus.emit(GameEvent.DIALOGUE_START, { dialogueId: dialogue.id });
  }

  /**
   * 隐藏对话
   */
  hideDialogue(): void {
    this._stopTypewriter();

    // 移除键盘导航
    this._removeKeyboardNavigation();

    // 隐藏全屏点击层
    this._clickLayer?.setVisible(false);

    this._scene.tweens.add({
      targets: this._container,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this._container.setVisible(false);
        this._hidePortrait();

        if (this._state.currentDialogue) {
          eventBus.emit(GameEvent.DIALOGUE_END, {
            dialogueId: this._state.currentDialogue.id,
          });
          this._onDialogueEnd?.(this._state.currentDialogue.id);
        }

        this._state.currentDialogue = null;
        this._state.isWaitingToClose = false;
      },
    });
  }

  /**
   * 推进对话（点击继续）
   */
  advance(): void {
    if (!this._state.currentDialogue) return;

    // 如果正在等待关闭，点击后关闭对话
    if (this._state.isWaitingToClose) {
      this.hideDialogue();
      return;
    }

    // 如果正在打字，直接显示全部文字
    if (this._state.isTyping) {
      this._completeTypewriter();
      return;
    }

    // 如果有选项，不自动推进
    if (this._state.currentDialogue.choices && this._state.currentDialogue.choices.length > 0) {
      return;
    }

    // 总是通知外部，由外部决定是否继续或结束
    // 这样可以让 NarrativeEngine 控制多行对话的流程
    eventBus.emit(GameEvent.DIALOGUE_ADVANCE, {
      dialogueId: this._state.currentDialogue.id,
      lineIndex: this._state.currentLineIndex,
    });
  }

  /**
   * 标记对话已结束，等待用户点击关闭
   * 用于让用户有时间阅读最后一行内容
   */
  markWaitingToClose(): void {
    this._state.isWaitingToClose = true;
    // 显示继续指示器，提示用户点击关闭
    this._continueIndicator.setVisible(true);
  }

  /**
   * 选择选项
   */
  selectChoice(index: number): void {
    if (!this._state.currentDialogue?.choices) return;

    const choice = this._state.currentDialogue.choices[index];
    if (!choice) return;

    eventBus.emit(GameEvent.DIALOGUE_CHOICE, {
      dialogueId: this._state.currentDialogue.id,
      choiceIndex: index,
      choiceText: choice.label,
    });

    this._onChoiceSelected?.(this._state.currentDialogue.id, index);
  }

  /**
   * 是否正在显示对话
   */
  isVisible(): boolean {
    return this._container.visible;
  }

  /**
   * 销毁UI
   */
  destroy(): void {
    this._stopTypewriter();
    this._removeKeyboardNavigation();
    this._unsubscribeI18n?.();
    this._clickLayer?.destroy();
    this._container.destroy();
  }

  // ==================== 私有方法 - UI创建 ====================

  private _createUI(): void {
    const { width, height } = this._scene.scale;

    this._container = this._scene.add.container(0, 0);
    this._container.setDepth(1000);
    this._container.setVisible(false);

    // 半透明背景遮罩
    const overlay = this._scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3);
    this._container.add(overlay);

    // 对话框背景
    this._background = this._scene.add.graphics();
    this._drawDialogueBox();
    this._container.add(this._background);

    // 说话者名称
    this._speakerText = this._scene.add.text(
      (width - CONFIG.BOX_WIDTH) / 2 + 20,
      height - CONFIG.BOX_MARGIN_BOTTOM - CONFIG.BOX_HEIGHT + 15,
      '',
      {
        ...TEXT_STYLES.SPEAKER,
        fontSize: UI_FONT_SIZE.SMALL,
        color: '#00FFAA',
      }
    );
    this._container.add(this._speakerText);

    // 对话文字
    this._dialogueText = this._scene.add.text(
      (width - CONFIG.BOX_WIDTH) / 2 + 20,
      height - CONFIG.BOX_MARGIN_BOTTOM - CONFIG.BOX_HEIGHT + 50,
      '',
      {
        ...TEXT_STYLES.DIALOGUE,
        fontSize: UI_FONT_SIZE.SMALL,
        wordWrap: { width: CONFIG.BOX_WIDTH - 40 },
        lineSpacing: UI.LINE_SPACING.LOOSE,
      }
    );
    this._container.add(this._dialogueText);

    // 继续指示器
    this._continueIndicator = this._scene.add.text(
      (width + CONFIG.BOX_WIDTH) / 2 - 30,
      height - CONFIG.BOX_MARGIN_BOTTOM - 20,
      '▼',
      {
        fontSize: UI_FONT_SIZE.SMALL,
        color: '#686868',
      }
    );
    this._continueIndicator.setVisible(false);
    this._container.add(this._continueIndicator);

    // 继续指示器动画
    this._scene.tweens.add({
      targets: this._continueIndicator,
      y: this._continueIndicator.y + 5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 选项容器
    this._choicesContainer = this._scene.add.container(
      width / 2,
      height - CONFIG.BOX_MARGIN_BOTTOM - CONFIG.BOX_HEIGHT - 20
    );
    this._choicesContainer.setVisible(false);
    this._container.add(this._choicesContainer);

    // 立绘（初始为null）
    this._portrait = null;
  }

  private _drawDialogueBox(): void {
    const { width, height } = this._scene.scale;
    const boxX = (width - CONFIG.BOX_WIDTH) / 2;
    const boxY = height - CONFIG.BOX_MARGIN_BOTTOM - CONFIG.BOX_HEIGHT;

    this._background.clear();

    // 背景
    this._background.fillStyle(COLORS.BG_SECONDARY, 0.95);
    this._background.fillRoundedRect(boxX, boxY, CONFIG.BOX_WIDTH, CONFIG.BOX_HEIGHT, 12);

    // 边框
    this._background.lineStyle(2, COLORS.ACCENT, 0.5);
    this._background.strokeRoundedRect(boxX, boxY, CONFIG.BOX_WIDTH, CONFIG.BOX_HEIGHT, 12);
  }

  // ==================== 私有方法 - 打字机效果 ====================

  private _startTypewriter(): void {
    this._state.isTyping = true;
    let charIndex = 0;

    // 使用 loop: true 并在完成时手动停止
    // 这样可以确保 _completeTypewriter 被调用
    this._state.typewriterTimer = this._scene.time.addEvent({
      delay: CONFIG.TYPEWRITER_DELAY,
      loop: true,
      callback: () => {
        if (charIndex < this._state.fullText.length) {
          this._state.displayedText += this._state.fullText[charIndex];
          this._dialogueText.setText(this._state.displayedText);
          charIndex++;
        } else {
          // 所有字符已显示，停止定时器并完成打字机效果
          this._completeTypewriter();
        }
      },
    });
  }

  private _stopTypewriter(): void {
    if (this._state.typewriterTimer) {
      this._state.typewriterTimer.destroy();
      this._state.typewriterTimer = null;
    }
    this._state.isTyping = false;
  }

  private _completeTypewriter(): void {
    this._stopTypewriter();
    this._state.displayedText = this._state.fullText;
    this._dialogueText.setText(this._state.displayedText);
    this._state.isTyping = false;

    // 显示选项或继续指示器
    if (this._state.currentDialogue?.choices && this._state.currentDialogue.choices.length > 0) {
      this._showChoices(this._state.currentDialogue.choices);
    } else {
      this._continueIndicator.setVisible(true);
    }
  }

  // ==================== 私有方法 - 选项 ====================

  private _showChoices(choices: IDialogueChoice[]): void {
    this._hideChoices();

    const startY = -((choices.length - 1) * (CONFIG.CHOICE_HEIGHT + CONFIG.CHOICE_SPACING)) / 2;

    // 创建焦点组
    this._focusGroupId = `${FOCUS_GROUP_PREFIX}${Date.now()}`;
    const focusGroup = a11yManager.createFocusGroup(this._focusGroupId, {
      wrapAround: true,
      autoFocus: true,
      groupName: '对话选项',
    });

    choices.forEach((choice, index) => {
      const button = this._createChoiceButton(
        choice.label,
        index,
        startY + index * (CONFIG.CHOICE_HEIGHT + CONFIG.CHOICE_SPACING)
      );
      this._choiceButtons.push(button);
      this._choicesContainer.add(button);

      // 添加到焦点组
      const focusableElement: IFocusableElement = {
        id: `choice-${index}`,
        label: `${index + 1}. ${choice.label}`,
        role: 'option',
        enabled: true,
        onFocus: () => this._highlightChoice(index, true),
        onBlur: () => this._highlightChoice(index, false),
        onActivate: () => this.selectChoice(index),
      };
      focusGroup.add(focusableElement);
    });

    // 激活焦点组
    a11yManager.setActiveFocusGroup(this._focusGroupId);

    this._choicesContainer.setVisible(true);
    this._choicesContainer.setAlpha(0);

    this._scene.tweens.add({
      targets: this._choicesContainer,
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });

    // 播报选项给屏幕阅读器
    a11yManager.announceChoice(choices.map((c) => c.label));
  }

  /**
   * 高亮选项（键盘导航时使用）
   */
  private _highlightChoice(index: number, highlight: boolean): void {
    const button = this._choiceButtons[index];
    if (!button) return;

    const bg = button.list[0] as Phaser.GameObjects.Graphics;
    const label = button.list[1] as Phaser.GameObjects.Text;
    const buttonWidth = CONFIG.BOX_WIDTH - 100;

    bg.clear();
    if (highlight) {
      bg.fillStyle(COLORS.BG_SECONDARY, 1);
      bg.fillRoundedRect(
        -buttonWidth / 2,
        -CONFIG.CHOICE_HEIGHT / 2,
        buttonWidth,
        CONFIG.CHOICE_HEIGHT,
        8
      );
      bg.lineStyle(2, COLORS.ACCENT, 1);
      bg.strokeRoundedRect(
        -buttonWidth / 2,
        -CONFIG.CHOICE_HEIGHT / 2,
        buttonWidth,
        CONFIG.CHOICE_HEIGHT,
        8
      );
      label.setColor('#00FFAA');
      this._currentFocusIndex = index;
    } else {
      bg.fillStyle(COLORS.BG_PRIMARY, 0.9);
      bg.fillRoundedRect(
        -buttonWidth / 2,
        -CONFIG.CHOICE_HEIGHT / 2,
        buttonWidth,
        CONFIG.CHOICE_HEIGHT,
        8
      );
      bg.lineStyle(1, COLORS.BORDER, 1);
      bg.strokeRoundedRect(
        -buttonWidth / 2,
        -CONFIG.CHOICE_HEIGHT / 2,
        buttonWidth,
        CONFIG.CHOICE_HEIGHT,
        8
      );
      label.setColor('#E8E6E3');
    }
  }

  private _hideChoices(): void {
    // 销毁焦点组
    if (this._focusGroupId) {
      a11yManager.destroyFocusGroup(this._focusGroupId);
      this._focusGroupId = null;
    }

    this._choiceButtons.forEach((btn) => btn.destroy());
    this._choiceButtons = [];
    this._choicesContainer.setVisible(false);
    this._currentFocusIndex = -1;
  }

  private _createChoiceButton(
    text: string,
    index: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this._scene.add.container(0, y);
    const buttonWidth = CONFIG.BOX_WIDTH - 100;

    // 背景
    const bg = this._scene.add.graphics();
    bg.fillStyle(COLORS.BG_PRIMARY, 0.9);
    bg.fillRoundedRect(
      -buttonWidth / 2,
      -CONFIG.CHOICE_HEIGHT / 2,
      buttonWidth,
      CONFIG.CHOICE_HEIGHT,
      8
    );
    bg.lineStyle(1, COLORS.BORDER, 1);
    bg.strokeRoundedRect(
      -buttonWidth / 2,
      -CONFIG.CHOICE_HEIGHT / 2,
      buttonWidth,
      CONFIG.CHOICE_HEIGHT,
      8
    );

    // 文字
    const label = this._scene.add
      .text(0, 0, text, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.SMALL,
      })
      .setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(buttonWidth, CONFIG.CHOICE_HEIGHT);

    // 交互
    container
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.BG_SECONDARY, 1);
        bg.fillRoundedRect(
          -buttonWidth / 2,
          -CONFIG.CHOICE_HEIGHT / 2,
          buttonWidth,
          CONFIG.CHOICE_HEIGHT,
          8
        );
        bg.lineStyle(2, COLORS.ACCENT, 1);
        bg.strokeRoundedRect(
          -buttonWidth / 2,
          -CONFIG.CHOICE_HEIGHT / 2,
          buttonWidth,
          CONFIG.CHOICE_HEIGHT,
          8
        );
        label.setColor('#00FFAA');
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(COLORS.BG_PRIMARY, 0.9);
        bg.fillRoundedRect(
          -buttonWidth / 2,
          -CONFIG.CHOICE_HEIGHT / 2,
          buttonWidth,
          CONFIG.CHOICE_HEIGHT,
          8
        );
        bg.lineStyle(1, COLORS.BORDER, 1);
        bg.strokeRoundedRect(
          -buttonWidth / 2,
          -CONFIG.CHOICE_HEIGHT / 2,
          buttonWidth,
          CONFIG.CHOICE_HEIGHT,
          8
        );
        label.setColor('#E8E6E3');
      })
      .on('pointerdown', () => {
        this.selectChoice(index);
      });

    return container;
  }

  // ==================== 私有方法 - 立绘 ====================

  private _showPortrait(speaker: string, expression: CharacterExpression = 'neutral'): void {
    this._hidePortrait();

    // 根据说话者和表情查找立绘资源
    const portraitKey = this._getPortraitKey(speaker, expression);
    if (!portraitKey || !this._scene.textures.exists(portraitKey)) {
      logger.debug(`立绘未找到: ${speaker} - ${expression} (key: ${portraitKey})`);
      return;
    }

    logger.debug(`显示立绘: ${speaker} - ${expression} (key: ${portraitKey})`);
    const { width, height } = this._scene.scale;

    this._portrait = this._scene.add.image(
      width - CONFIG.PORTRAIT_WIDTH / 2 - 50,
      height - CONFIG.BOX_MARGIN_BOTTOM - CONFIG.BOX_HEIGHT - CONFIG.PORTRAIT_HEIGHT / 2 + 50,
      portraitKey
    );
    this._portrait.setDisplaySize(CONFIG.PORTRAIT_WIDTH, CONFIG.PORTRAIT_HEIGHT);
    this._portrait.setAlpha(0);

    this._container.add(this._portrait);

    this._scene.tweens.add({
      targets: this._portrait,
      alpha: 1,
      x: this._portrait.x - 20,
      duration: 300,
      ease: 'Power2',
    });
  }

  private _hidePortrait(): void {
    if (this._portrait) {
      this._portrait.destroy();
      this._portrait = null;
    }
  }

  private _getPortraitKey(
    speaker: string,
    expression: CharacterExpression = 'neutral'
  ): string | null {
    // 映射说话者名称到角色ID
    const speakerToCharId: Record<string, CharacterId> = {
      岑回: CharacterId.CENHUI,
      顾临: CharacterId.GULIN,
      宋岚: CharacterId.SONGLAN,
      许澄: CharacterId.XUCHENG,
      阿棠: CharacterId.ATANG,
      牧平: CharacterId.MUPING,
      栖蓝: CharacterId.QILAN,
      陈匠: CharacterId.CHENJIANG,
    };

    const charId = speakerToCharId[speaker];
    if (!charId) {
      return null;
    }

    // 使用characters.config中的表情映射
    const portraitKey = getCharacterPortraitKey(charId, expression);
    if (portraitKey) {
      return portraitKey;
    }

    // 如果指定表情不存在，回退到neutral
    if (expression !== 'neutral') {
      logger.debug(`表情 ${expression} 不存在，回退到 neutral`);
      return getCharacterPortraitKey(charId, 'neutral') || null;
    }

    return null;
  }

  // ==================== 私有方法 - 输入 ====================

  /** 全屏点击层引用 */
  private _clickLayer!: Phaser.GameObjects.Rectangle;

  private _setupInput(): void {
    const { width, height } = this._scene.scale;

    // 创建一个全屏透明点击层（放在容器最底层）
    // 使用透明度 0.01 使其可交互但几乎不可见
    this._clickLayer = this._scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.01);
    this._clickLayer.setInteractive({ useHandCursor: false });
    this._clickLayer.setDepth(999); // 比对话容器略低，但高于游戏内容

    this._clickLayer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isVisible()) return;

      // 如果点击的是选项区域，不处理
      if (this._choicesContainer.visible) {
        const choicesY = this._choicesContainer.y;
        if (Math.abs(pointer.y - choicesY) < 150) {
          return;
        }
      }

      this.advance();
    });

    // 初始隐藏点击层
    this._clickLayer.setVisible(false);

    // 空格键推进（通过 Phaser 事件）
    this._scene.input.keyboard?.on('keydown-SPACE', () => {
      if (this.isVisible() && !this._choicesContainer.visible) {
        this.advance();
      }
    });
  }

  // ==================== 私有方法 - 键盘导航 ====================

  /**
   * 设置键盘导航
   */
  private _setupKeyboardNavigation(): void {
    if (this._keyDownHandler) return;

    this._keyDownHandler = (event: KeyboardEvent): void => {
      if (!this.isVisible()) return;

      // 如果有选项显示，处理选项导航
      if (this._choicesContainer.visible) {
        // 构建按键标识
        let keyCode = event.code;
        if (event.shiftKey && keyCode === 'Tab') {
          keyCode = 'ShiftTab';
        }

        // 数字键直选 (1-9)
        if (/^Digit[1-9]$/.test(event.code)) {
          const index = parseInt(event.code.replace('Digit', ''), 10) - 1;
          if (index < this._choiceButtons.length) {
            this.selectChoice(index);
            event.preventDefault();
            return;
          }
        }

        // 小键盘数字键 (1-9)
        if (/^Numpad[1-9]$/.test(event.code)) {
          const index = parseInt(event.code.replace('Numpad', ''), 10) - 1;
          if (index < this._choiceButtons.length) {
            this.selectChoice(index);
            event.preventDefault();
            return;
          }
        }

        // 让 A11yManager 处理其他导航键
        if (a11yManager.handleKeyboardNavigation(keyCode)) {
          event.preventDefault();
          return;
        }
      } else {
        // 没有选项时，空格/回车推进对话
        if (event.code === 'Space' || event.code === 'Enter') {
          this.advance();
          event.preventDefault();
          return;
        }
      }

      // ESC 关闭对话（如果没有选项）
      if (event.code === 'Escape' && !this._choicesContainer.visible) {
        this.hideDialogue();
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', this._keyDownHandler);
  }

  /**
   * 移除键盘导航
   */
  private _removeKeyboardNavigation(): void {
    if (this._keyDownHandler) {
      window.removeEventListener('keydown', this._keyDownHandler);
      this._keyDownHandler = null;
    }

    // 清除焦点组
    if (this._focusGroupId) {
      a11yManager.destroyFocusGroup(this._focusGroupId);
      this._focusGroupId = null;
    }
  }

  /**
   * 获取当前焦点索引（用于测试/调试）
   */
  public getCurrentFocusIndex(): number {
    return this._currentFocusIndex;
  }
}
