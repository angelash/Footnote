/**
 * 叙事引擎
 * 管理对话、卡片、伏笔等叙事内容
 * @module systems/narrative/NarrativeEngine
 */

import { eventBus, GameEvent } from '@/systems/EventBus';
import { worldState } from '@/systems/world';
import type { ChapterID } from '@/config/game.config';

// ==================== 类型定义 ====================

/**
 * 对话行
 */
export interface IDialogueLine {
  speaker: string;
  text: string;
  portrait?: string;
  emotion?: string;
  action?: IDialogueAction;
  delay?: number;
}

/**
 * 对话动作
 */
export interface IDialogueAction {
  type: 'card' | 'foreshadow' | 'flag' | 'ability' | 'sfx' | 'bgm';
  cardId?: string;
  foreshadowId?: string;
  foreshadowStage?: ForeshadowStage;
  flagName?: string;
  flagValue?: boolean;
  abilityType?: string;
  audioKey?: string;
}

/**
 * 对话选项
 */
export interface IDialogueChoice {
  id: string;
  text: string;
  condition?: IChoiceCondition;
  effects?: IChoiceEffect;
  nextDialogueId?: string;
}

/**
 * 选项条件
 */
export interface IChoiceCondition {
  hasCard?: string;
  hasAbility?: string;
  flagTrue?: string;
  rMin?: number;
}

/**
 * 选项效果
 */
export interface IChoiceEffect {
  rDelta?: number;
  pDelta?: number;
  setFlag?: { name: string; value: boolean };
  giveCard?: string;
  triggerForeshadow?: { id: string; stage: ForeshadowStage };
}

/**
 * 完整对话数据
 */
export interface IDialogueData {
  id: string;
  lines: IDialogueLine[];
  choices?: IDialogueChoice[];
  onComplete?: IDialogueAction[];
}

/**
 * 卡片数据
 */
export interface ICard {
  id: string;
  title: string;
  subtitle?: string;
  category: CardCategory;
  content: string;
  chapter: ChapterID;
  zone: string;
  image?: string;
  effects?: ICardEffect[];
}

/**
 * 卡片类别
 */
export enum CardCategory {
  ARCHIVE = 'archive',
  ITEM = 'item',
  PRAYER = 'prayer',
  VERDICT = 'verdict',
  DIARY = 'diary',
}

/**
 * 卡片效果
 */
export interface ICardEffect {
  type: 'taint' | 'flash' | 'glitch' | 'redact';
  target?: string;
  intensity?: number;
}

/**
 * 伏笔阶段
 */
export type ForeshadowStage = 'plant' | 'deepen' | 'misread' | 'collect';

/**
 * 伏笔数据
 */
export interface IForeshadow {
  id: string;
  name: string;
  description: string;
  stages: {
    plant: IForeshadowStageConfig;
    deepen: IForeshadowStageConfig;
    misread?: {
      expected: string;
      truth: string;
    };
    collect: IForeshadowStageConfig;
  };
}

/**
 * 伏笔阶段配置
 */
export interface IForeshadowStageConfig {
  zone: string;
  trigger: string;
  description: string;
}

/**
 * 伏笔状态
 */
export interface IForeshadowState {
  planted: boolean;
  deepened: boolean;
  collected: boolean;
  plantedAt?: string;
  deepenedAt?: string;
  collectedAt?: string;
}

/**
 * 叙事引擎状态
 */
export interface INarrativeState {
  cards: Map<string, ICard>;
  obtainedCardIds: Set<string>;
  viewedCardIds: Set<string>;
  foreshadowStates: Map<string, IForeshadowState>;
  currentDialogue: IDialogueData | null;
  currentLineIndex: number;
  dialogueHistory: string[];
}

// ==================== NarrativeEngine类 ====================

/**
 * 叙事引擎
 */
class NarrativeEngine {
  private static _instance: NarrativeEngine | null = null;

  // 卡片数据
  private _cardRegistry: Map<string, ICard> = new Map();
  private _obtainedCards: Set<string> = new Set();
  private _viewedCards: Set<string> = new Set();

  // 伏笔数据
  private _foreshadowRegistry: Map<string, IForeshadow> = new Map();
  private _foreshadowStates: Map<string, IForeshadowState> = new Map();

  // 对话状态
  private _dialogueRegistry: Map<string, IDialogueData> = new Map();
  private _currentDialogue: IDialogueData | null = null;
  private _currentLineIndex: number = 0;
  private _isDialogueActive: boolean = false;
  private _dialogueHistory: string[] = [];

  // 回调
  private _onDialogueAdvance?: (line: IDialogueLine) => void;
  private _onDialogueChoice?: (choices: IDialogueChoice[]) => void;
  private _onDialogueEnd?: () => void;
  private _choiceHandler?: (choiceId: string) => void;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): NarrativeEngine {
    if (!NarrativeEngine._instance) {
      NarrativeEngine._instance = new NarrativeEngine();
    }
    return NarrativeEngine._instance;
  }

  // ==================== 对话系统 ====================

  /**
   * 注册对话数据
   */
  registerDialogue(dialogue: IDialogueData): void {
    this._dialogueRegistry.set(dialogue.id, dialogue);
  }

  /**
   * 批量注册对话
   */
  registerDialogues(dialogues: IDialogueData[]): void {
    dialogues.forEach((d) => this.registerDialogue(d));
  }

  /**
   * 加载对话
   */
  async loadDialogue(dialogueId: string): Promise<IDialogueData | null> {
    // 优先从注册表获取
    const registered = this._dialogueRegistry.get(dialogueId);
    if (registered) {
      return registered;
    }

    // TODO: 从YAML文件加载
    console.warn(`[NarrativeEngine] Dialogue not found: ${dialogueId}`);
    return null;
  }

  /**
   * 开始对话
   */
  async startDialogue(dialogueIdOrData: string | IDialogueData[]): Promise<void> {
    let dialogue: IDialogueData;

    if (typeof dialogueIdOrData === 'string') {
      const loaded = await this.loadDialogue(dialogueIdOrData);
      if (!loaded) {
        console.error(`[NarrativeEngine] Cannot start dialogue: ${dialogueIdOrData}`);
        return;
      }
      dialogue = loaded;
    } else {
      // 直接传入对话行数组
      dialogue = {
        id: `temp_${Date.now()}`,
        lines: dialogueIdOrData.map((line) =>
          typeof line === 'string' ? { speaker: '', text: line } : line
        ) as IDialogueLine[],
      };
    }

    this._currentDialogue = dialogue;
    this._currentLineIndex = 0;
    this._isDialogueActive = true;

    this._dialogueHistory.push(dialogue.id);
    eventBus.emit(GameEvent.DIALOGUE_START, { dialogueId: dialogue.id });

    // 显示第一行
    this._showCurrentLine();
  }

  /**
   * 推进对话
   */
  advance(): void {
    if (!this._isDialogueActive || !this._currentDialogue) return;

    const lines = this._currentDialogue.lines;

    // 检查是否有选项
    if (this._currentLineIndex >= lines.length - 1 && this._currentDialogue.choices) {
      this._showChoices();
      return;
    }

    // 推进到下一行
    this._currentLineIndex++;

    if (this._currentLineIndex >= lines.length) {
      this._endDialogue();
    } else {
      eventBus.emit(GameEvent.DIALOGUE_ADVANCE, { lineIndex: this._currentLineIndex });
      this._showCurrentLine();
    }
  }

  /**
   * 获取当前对话行
   */
  getCurrentLine(): IDialogueLine | null {
    if (!this._currentDialogue) return null;
    return this._currentDialogue.lines[this._currentLineIndex] || null;
  }

  /**
   * 对话是否已完成
   */
  isDialogueComplete(): boolean {
    if (!this._currentDialogue) return true;
    return this._currentLineIndex >= this._currentDialogue.lines.length;
  }

  /**
   * 对话是否激活
   */
  isDialogueActive(): boolean {
    return this._isDialogueActive;
  }

  /**
   * 选择选项
   */
  selectChoice(choiceId: string): void {
    if (!this._currentDialogue?.choices) return;

    const choice = this._currentDialogue.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    eventBus.emit(GameEvent.DIALOGUE_CHOICE, {
      choiceId,
      choiceIndex: this._currentDialogue.choices.indexOf(choice),
    });

    // 应用效果
    if (choice.effects) {
      this._applyChoiceEffects(choice.effects);
    }

    // 调用处理器
    this._choiceHandler?.(choiceId);

    // 跳转到下一个对话或结束
    if (choice.nextDialogueId) {
      this._endDialogue();
      this.startDialogue(choice.nextDialogueId);
    } else {
      this._endDialogue();
    }
  }

  /**
   * 设置选项处理器
   */
  setChoiceHandler(handler: (choiceId: string) => void): void {
    this._choiceHandler = handler;
  }

  /**
   * 设置对话回调
   */
  setDialogueCallbacks(callbacks: {
    onAdvance?: (line: IDialogueLine) => void;
    onChoice?: (choices: IDialogueChoice[]) => void;
    onEnd?: () => void;
  }): void {
    this._onDialogueAdvance = callbacks.onAdvance;
    this._onDialogueChoice = callbacks.onChoice;
    this._onDialogueEnd = callbacks.onEnd;
  }

  /**
   * 跳过当前对话（用于调试/自动化）
   */
  skipCurrentDialogue(): void {
    if (!this._isDialogueActive) return;
    this._endDialogue();
  }

  private _showCurrentLine(): void {
    const line = this.getCurrentLine();
    if (!line) return;

    // 处理行动作
    if (line.action) {
      this._handleDialogueAction(line.action);
    }

    this._onDialogueAdvance?.(line);
  }

  private _showChoices(): void {
    if (!this._currentDialogue?.choices) return;

    // 过滤可用选项
    const availableChoices = this._currentDialogue.choices.filter((c) => {
      if (!c.condition) return true;
      return this._checkChoiceCondition(c.condition);
    });

    this._onDialogueChoice?.(availableChoices);
  }

  private _endDialogue(): void {
    if (!this._currentDialogue) return;

    // 执行完成动作
    if (this._currentDialogue.onComplete) {
      this._currentDialogue.onComplete.forEach((action) => {
        this._handleDialogueAction(action);
      });
    }

    const dialogueId = this._currentDialogue.id;
    this._currentDialogue = null;
    this._currentLineIndex = 0;
    this._isDialogueActive = false;

    eventBus.emit(GameEvent.DIALOGUE_END, { dialogueId });
    this._onDialogueEnd?.();
  }

  private _handleDialogueAction(action: IDialogueAction): void {
    switch (action.type) {
      case 'card':
        if (action.cardId) this.obtainCard(action.cardId);
        break;
      case 'foreshadow':
        if (action.foreshadowId && action.foreshadowStage) {
          this.triggerForeshadow(action.foreshadowId, action.foreshadowStage);
        }
        break;
      case 'flag':
        if (action.flagName !== undefined) {
          worldState.setFlag(action.flagName, action.flagValue ?? true);
        }
        break;
      case 'ability':
        if (action.abilityType) {
          worldState.unlockAbility(action.abilityType as any);
        }
        break;
      case 'sfx':
        if (action.audioKey) {
          eventBus.emit(GameEvent.SFX_PLAY, { key: action.audioKey });
        }
        break;
      case 'bgm':
        if (action.audioKey) {
          eventBus.emit(GameEvent.BGM_PLAY, { key: action.audioKey });
        }
        break;
    }
  }

  private _checkChoiceCondition(condition: IChoiceCondition): boolean {
    if (condition.hasCard && !this.hasCard(condition.hasCard)) return false;
    if (condition.hasAbility && !worldState.hasAbility(condition.hasAbility as any)) return false;
    if (condition.flagTrue && !worldState.getFlag(condition.flagTrue)) return false;
    if (condition.rMin !== undefined) {
      const { R } = worldState.getCounters();
      if (R < condition.rMin) return false;
    }
    return true;
  }

  private _applyChoiceEffects(effects: IChoiceEffect): void {
    if (effects.rDelta) worldState.addR(effects.rDelta);
    if (effects.pDelta) worldState.addP(effects.pDelta);
    if (effects.setFlag) {
      worldState.setFlag(effects.setFlag.name, effects.setFlag.value);
    }
    if (effects.giveCard) this.obtainCard(effects.giveCard);
    if (effects.triggerForeshadow) {
      this.triggerForeshadow(effects.triggerForeshadow.id, effects.triggerForeshadow.stage);
    }
  }

  // ==================== 卡片系统 ====================

  /**
   * 注册卡片
   */
  registerCard(card: ICard): void {
    this._cardRegistry.set(card.id, card);
  }

  /**
   * 批量注册卡片
   */
  registerCards(cards: ICard[]): void {
    cards.forEach((c) => this.registerCard(c));
  }

  /**
   * 获得卡片
   */
  obtainCard(cardId: string): boolean {
    if (this._obtainedCards.has(cardId)) {
      return false; // 已拥有
    }

    const card = this._cardRegistry.get(cardId);
    if (!card) {
      console.warn(`[NarrativeEngine] Card not found: ${cardId}`);
      return false;
    }

    this._obtainedCards.add(cardId);

    eventBus.emit(GameEvent.CARD_OBTAIN, {
      cardId,
      card: { id: card.id, title: card.title, category: card.category },
    });

    return true;
  }

  /**
   * 检查是否拥有卡片
   */
  hasCard(cardId: string): boolean {
    return this._obtainedCards.has(cardId);
  }

  /**
   * 获取卡片数据
   */
  getCard(cardId: string): ICard | undefined {
    return this._cardRegistry.get(cardId);
  }

  /**
   * 获取已获得的卡片列表
   */
  getObtainedCards(): ICard[] {
    return Array.from(this._obtainedCards)
      .map((id) => this._cardRegistry.get(id))
      .filter((c): c is ICard => c !== undefined);
  }

  /**
   * 获取卡片数量
   */
  getCardCount(): number {
    return this._obtainedCards.size;
  }

  /**
   * 按类别获取卡片
   */
  getCardsByCategory(category: CardCategory | string): ICard[] {
    return this.getObtainedCards().filter((c) => c.category === category);
  }

  /**
   * 查看卡片
   */
  viewCard(cardId: string): void {
    if (this._obtainedCards.has(cardId) && !this._viewedCards.has(cardId)) {
      this._viewedCards.add(cardId);
      eventBus.emit(GameEvent.CARD_VIEW, { cardId });
    }
  }

  /**
   * 检查卡片是否已查看
   */
  isCardViewed(cardId: string): boolean {
    return this._viewedCards.has(cardId);
  }

  // ==================== 伏笔系统 ====================

  /**
   * 注册伏笔
   */
  registerForeshadow(foreshadow: IForeshadow): void {
    this._foreshadowRegistry.set(foreshadow.id, foreshadow);
    this._foreshadowStates.set(foreshadow.id, {
      planted: false,
      deepened: false,
      collected: false,
    });
  }

  /**
   * 批量注册伏笔
   */
  registerForeshadows(foreshadows: IForeshadow[]): void {
    foreshadows.forEach((f) => this.registerForeshadow(f));
  }

  /**
   * 触发伏笔
   */
  triggerForeshadow(foreshadowId: string, stage: ForeshadowStage): boolean {
    const state = this._foreshadowStates.get(foreshadowId);
    if (!state) {
      console.warn(`[NarrativeEngine] Foreshadow not found: ${foreshadowId}`);
      return false;
    }

    const currentZone = worldState.getCurrentZone();

    switch (stage) {
      case 'plant':
        if (!state.planted) {
          state.planted = true;
          state.plantedAt = currentZone;
          eventBus.emit(GameEvent.FORESHADOW_PLANT, { foreshadowId, zoneId: currentZone });
          return true;
        }
        break;

      case 'deepen':
        if (state.planted && !state.deepened) {
          state.deepened = true;
          state.deepenedAt = currentZone;
          eventBus.emit(GameEvent.FORESHADOW_DEEPEN, { foreshadowId, zoneId: currentZone });
          return true;
        }
        break;

      case 'collect':
        if (state.planted && !state.collected) {
          state.collected = true;
          state.collectedAt = currentZone;
          eventBus.emit(GameEvent.FORESHADOW_COLLECT, { foreshadowId, zoneId: currentZone });
          return true;
        }
        break;
    }

    return false;
  }

  /**
   * 获取伏笔状态
   */
  getForeshadowState(foreshadowId: string): ForeshadowStage | null {
    const state = this._foreshadowStates.get(foreshadowId);
    if (!state) return null;

    if (state.collected) return 'collect';
    if (state.deepened) return 'deepen';
    if (state.planted) return 'plant';
    return null;
  }

  /**
   * 检查伏笔是否已回收
   */
  isForeshadowCollected(foreshadowId: string): boolean {
    return this._foreshadowStates.get(foreshadowId)?.collected ?? false;
  }

  /**
   * 检查是否可以触发伏笔阶段
   */
  canTriggerForeshadow(foreshadowId: string, stage: ForeshadowStage): boolean {
    const state = this._foreshadowStates.get(foreshadowId);
    if (!state) return false;

    switch (stage) {
      case 'plant':
        return !state.planted;
      case 'deepen':
        return state.planted && !state.deepened;
      case 'collect':
        return state.planted && !state.collected;
      default:
        return false;
    }
  }

  /**
   * 获取所有伏笔状态
   */
  getAllForeshadowStates(): Map<string, IForeshadowState> {
    return new Map(this._foreshadowStates);
  }

  // ==================== 序列化 ====================

  /**
   * 序列化状态
   */
  serialize(): {
    obtainedCards: string[];
    viewedCards: string[];
    foreshadowStates: Record<string, IForeshadowState>;
    dialogueHistory: string[];
  } {
    const foreshadowStates: Record<string, IForeshadowState> = {};
    this._foreshadowStates.forEach((state, id) => {
      foreshadowStates[id] = { ...state };
    });

    return {
      obtainedCards: Array.from(this._obtainedCards),
      viewedCards: Array.from(this._viewedCards),
      foreshadowStates,
      dialogueHistory: [...this._dialogueHistory],
    };
  }

  /**
   * 恢复状态
   */
  restore(data: ReturnType<typeof this.serialize>): void {
    this._obtainedCards = new Set(data.obtainedCards);
    this._viewedCards = new Set(data.viewedCards);
    this._dialogueHistory = [...data.dialogueHistory];

    Object.entries(data.foreshadowStates).forEach(([id, state]) => {
      this._foreshadowStates.set(id, { ...state });
    });
  }

  /**
   * 重置
   */
  reset(): void {
    this._obtainedCards.clear();
    this._viewedCards.clear();
    this._foreshadowStates.forEach((state) => {
      state.planted = false;
      state.deepened = false;
      state.collected = false;
      state.plantedAt = undefined;
      state.deepenedAt = undefined;
      state.collectedAt = undefined;
    });
    this._currentDialogue = null;
    this._currentLineIndex = 0;
    this._isDialogueActive = false;
    this._dialogueHistory = [];
  }
}

// 导出单例
export const narrativeEngine = NarrativeEngine.getInstance();
