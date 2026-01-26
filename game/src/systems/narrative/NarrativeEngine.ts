/**
 * 叙事引擎
 * 管理对话、卡片、伏笔等叙事内容
 * @module systems/narrative/NarrativeEngine
 */

import { createLogger } from '@/utils/Logger';
import { eventBus, GameEvent } from '@/systems/EventBus';

const logger = createLogger('NarrativeEngine');
import { worldState } from '@/systems/world';
import type { CardType } from '@/config/game.config';
import { AbilityType } from '@/config/game.config';
// 统一使用 NarrativeDataLoader 的加载逻辑（不再使用内部的解析方法）
import { loadDialogueFileAndRegister, inferYamlFileFromDialogueId } from '@/data/NarrativeDataLoader';
// 从统一类型导入卡片相关接口（用于内部使用）
import type { ICard, ICardGameplayEffect } from '@/types';

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
 * 支持单条件和组合条件（all/any）
 */
export interface IChoiceCondition {
  hasCard?: string;
  hasAbility?: string;
  flagTrue?: string;
  flagFalse?: string;
  rMin?: number;
  rMax?: number;
  /** 所有条件都满足 */
  all?: IChoiceCondition[];
  /** 任一条件满足 */
  any?: IChoiceCondition[];
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

// ICard, ICardEffect, ICardGameplayFx, ICardGameplayEffect 已移至 @/types
// 重新导出以保持向后兼容
export type { ICard, ICardEffect, ICardGameplayFx, ICardGameplayEffect } from '@/types';
// CardType 从 @/config/game.config 导出
export type { CardType } from '@/config/game.config';

// 从统一类型定义导入
import type {
  IForeshadow as IForeshadowBase,
  IForeshadowState as IForeshadowStateBase,
  IForeshadowStageConfig as IForeshadowStageConfigBase,
  ForeshadowStage as ForeshadowStageType,
  ForeshadowStageLegacy,
} from '@/types';
import { normalizeForeshadowStage } from '@/types';

/**
 * 伏笔阶段（导出类型别名，兼容旧版命名）
 * 统一命名：plant/deepen/mislead/reveal
 * 兼容旧版：misread -> mislead, collect -> reveal
 */
export type ForeshadowStage = ForeshadowStageLegacy;

/**
 * 伏笔数据（使用统一 Schema）
 */
export interface IForeshadow extends IForeshadowBase {
  // 扩展字段（如果需要）
}

/**
 * 伏笔阶段配置（使用统一 Schema）
 */
export interface IForeshadowStageConfig extends IForeshadowStageConfigBase {
  // 扩展字段（如果需要）
}

/**
 * 伏笔状态（扩展统一 Schema，兼容旧版字段）
 */
export interface IForeshadowState extends IForeshadowStateBase {
  // 运行时兼容字段
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

  private constructor() {
    // 注册卡片检查器到 WorldState
    worldState.registerCardChecker((id) => this.hasCard(id));
  }

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
   * 加载对话 - 支持动态加载
   * 1. 先检查内存缓存（注册表）
   * 2. 如果没有，尝试从对应YAML文件动态加载
   */
  async loadDialogue(dialogueId: string): Promise<IDialogueData | null> {
    // 1. 优先从注册表获取（内存缓存）
    const registered = this._dialogueRegistry.get(dialogueId);
    if (registered) {
      return registered;
    }

    // 2. 尝试动态加载
    const loaded = await this._dynamicLoadDialogue(dialogueId);
    if (loaded) {
      return loaded;
    }

    logger.warn(`Dialogue not found: ${dialogueId}`);
    return null;
  }

  /**
   * 动态加载对话 - 使用统一的 NarrativeDataLoader 流程
   * 
   * 注意：不再使用内部的 _parseDialoguesFromYaml，而是委托给 NarrativeDataLoader
   * 这确保了对话链（通过 next 链接的旧格式对话）被正确合并处理
   */
  private async _dynamicLoadDialogue(dialogueId: string): Promise<IDialogueData | null> {
    // 使用统一的文件推断逻辑
    const yamlFile = inferYamlFileFromDialogueId(dialogueId);
    if (!yamlFile) {
      logger.debug(`无法推断对话文件: ${dialogueId}`);
      return null;
    }

    // 使用统一的加载和注册流程
    const success = await loadDialogueFileAndRegister(yamlFile);
    if (!success) {
      return null;
    }

    // 返回请求的对话（现在应该已经在注册表中了）
    return this._dialogueRegistry.get(dialogueId) || null;
  }

  // 注意：_parseDialoguesFromYaml 已移除
  // 所有对话解析现在统一由 NarrativeDataLoader 处理
  // 这确保了对话链（通过 next 链接）被正确合并

  /**
   * 开始对话
   */
  async startDialogue(dialogueIdOrData: string | IDialogueData[]): Promise<void> {
    // 如果有正在进行的对话，先结束它
    if (this._isDialogueActive && this._currentDialogue) {
      logger.warn(`中断正在进行的对话: ${this._currentDialogue.id}`);
      // 不执行 onComplete，直接清理状态
      const oldDialogueId = this._currentDialogue.id;
      this._currentDialogue = null;
      this._currentLineIndex = 0;
      this._isDialogueActive = false;
      eventBus.emit(GameEvent.DIALOGUE_END, { dialogueId: oldDialogueId });
      this._onDialogueEnd?.();
    }

    let dialogue: IDialogueData;

    if (typeof dialogueIdOrData === 'string') {
      const loaded = await this.loadDialogue(dialogueIdOrData);
      if (!loaded) {
        logger.error(`Cannot start dialogue: ${dialogueIdOrData}`);
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
      // 注意：这里不再发出 DIALOGUE_ADVANCE 事件
      // 因为这个事件是从 DialogueUI 发出的，用于通知 NarrativeEngine 推进
      // NarrativeEngine 推进后通过 _showCurrentLine() 回调通知 UI 显示新行
      // 如果这里再发出事件，会导致 GameScene._onDialogueAdvance 再次调用 advance()，形成循环
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
   * @param choiceIdOrText 选项ID或选项文本（同时支持两种查找方式）
   */
  selectChoice(choiceIdOrText: string): void {
    if (!this._currentDialogue?.choices) return;

    // 同时支持按 id 和 text 查找选项
    // 优先按 id 匹配，如果找不到再按 text 匹配
    let choice = this._currentDialogue.choices.find((c) => c.id === choiceIdOrText);
    if (!choice) {
      choice = this._currentDialogue.choices.find((c) => c.text === choiceIdOrText);
    }
    if (!choice) {
      console.warn(`[NarrativeEngine] 选项未找到: ${choiceIdOrText}`);
      return;
    }

    // 注意：不在这里发送 DIALOGUE_CHOICE 事件
    // 该事件已由 DialogueUI.selectChoice() 发送
    // 如果在这里再次发送会导致无限递归

    // 应用效果（兼容两种属性名：effect 和 effects）
    const effectData = (choice as { effect?: IChoiceEffect; effects?: IChoiceEffect }).effect || choice.effects;
    if (effectData) {
      this._applyChoiceEffects(effectData);
    }

    // 调用处理器（使用正确的变量名）
    this._choiceHandler?.(choice.id);

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

    const dialogueId = this._currentDialogue.id;
    console.log(`[NarrativeEngine] _endDialogue: ${dialogueId}`);

    // 执行完成动作
    if (this._currentDialogue.onComplete && this._currentDialogue.onComplete.length > 0) {
      console.log(`[NarrativeEngine] 执行 onComplete: ${this._currentDialogue.onComplete.length} 个动作`);
      this._currentDialogue.onComplete.forEach((action, index) => {
        console.log(`[NarrativeEngine] onComplete[${index}]:`, JSON.stringify(action));
        this._handleDialogueAction(action);
      });
    } else {
      console.log(`[NarrativeEngine] 没有 onComplete 动作`);
    }

    this._currentDialogue = null;
    this._currentLineIndex = 0;
    this._isDialogueActive = false;

    eventBus.emit(GameEvent.DIALOGUE_END, { dialogueId });
    this._onDialogueEnd?.();
  }

  private _handleDialogueAction(action: IDialogueAction): void {
    console.log(`[NarrativeEngine] _handleDialogueAction: type=${action.type}`, action);
    switch (action.type) {
      case 'card':
        if (action.cardId) {
          console.log(`[NarrativeEngine] 获得卡片: ${action.cardId}`);
          this.obtainCard(action.cardId);
        }
        break;
      case 'foreshadow':
        if (action.foreshadowId && action.foreshadowStage) {
          this.triggerForeshadow(action.foreshadowId, action.foreshadowStage);
        }
        break;
      case 'flag':
        if (action.flagName !== undefined) {
          console.log(`[NarrativeEngine] 设置 flag: ${action.flagName} = ${action.flagValue ?? true}`);
          worldState.setFlag(action.flagName, action.flagValue ?? true);
          // 验证 flag 是否设置成功
          const flagValue = worldState.getFlag(action.flagName);
          console.log(`[NarrativeEngine] 验证 flag ${action.flagName} = ${flagValue}`);
        }
        break;
      case 'ability':
        if (action.abilityType) {
          // 将 camelCase 转换为 UPPER_SNAKE_CASE
          const normalizedType = this._normalizeAbilityType(action.abilityType);
          worldState.unlockAbility(normalizedType as AbilityType);
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

  /**
   * 将 camelCase abilityType 转换为 UPPER_SNAKE_CASE
   * @example depthPerception -> DEPTH_PERCEPTION
   */
  private _normalizeAbilityType(type: string): string {
    const mapping: Record<string, string> = {
      depthPerception: 'DEPTH_PERCEPTION',
      depthIntervention: 'DEPTH_INTERVENTION',
      timeIntervention: 'TIME_INTERVENTION',
    };
    return mapping[type] || type;
  }

  /**
   * 检查选项条件
   * 支持单条件和组合条件（all/any）的递归检查
   */
  private _checkChoiceCondition(condition: IChoiceCondition): boolean {
    // 处理组合条件：all（所有条件都满足）
    if (condition.all && condition.all.length > 0) {
      const allPassed = condition.all.every((c) => this._checkChoiceCondition(c));
      if (!allPassed) return false;
    }

    // 处理组合条件：any（任一条件满足）
    if (condition.any && condition.any.length > 0) {
      const anyPassed = condition.any.some((c) => this._checkChoiceCondition(c));
      if (!anyPassed) return false;
    }

    // 检查单条件：hasCard
    if (condition.hasCard && !this.hasCard(condition.hasCard)) return false;

    // 检查单条件：hasAbility
    if (condition.hasAbility) {
      const normalizedType = this._normalizeAbilityType(condition.hasAbility);
      if (!worldState.hasAbility(normalizedType as AbilityType)) return false;
    }

    // 检查单条件：flagTrue（flag 必须为 true）
    if (condition.flagTrue && !worldState.getFlag(condition.flagTrue)) return false;

    // 检查单条件：flagFalse（flag 必须为 false 或未设置）
    if (condition.flagFalse && worldState.getFlag(condition.flagFalse)) return false;

    // 检查单条件：rMin（R 值必须 >= rMin）
    if (condition.rMin !== undefined) {
      const { R } = worldState.getCounters();
      if (R < condition.rMin) return false;
    }

    // 检查单条件：rMax（R 值必须 <= rMax）
    if (condition.rMax !== undefined) {
      const { R } = worldState.getCounters();
      if (R > condition.rMax) return false;
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
   * 即使卡片数据未注册，也会添加到已获得列表（容错处理）
   */
  obtainCard(cardId: string): boolean {
    if (this._obtainedCards.has(cardId)) {
      return false; // 已拥有
    }

    const card = this._cardRegistry.get(cardId);
    if (!card) {
      // 即使卡片未在注册表中找到，也添加到已获得列表
      // 这允许场景配置的物品即使数据未加载也能被"获得"
      logger.warn(`Card not found in registry: ${cardId}, adding to obtained list anyway`);
    }

    // 无论卡片是否在注册表中，都添加到已获得列表
    this._obtainedCards.add(cardId);

    eventBus.emit(GameEvent.CARD_OBTAIN, {
      cardId,
      card: card
        ? { id: card.id, title: card.name, category: card.type }
        : { id: cardId, title: cardId, category: 'item' },
    });

    // 自动触发 'obtain' 时机的 gameplay 效果
    if (card) {
      this.applyCardGameplayFx(cardId, 'obtain');
    }

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
   * 按类型获取卡片
   */
  getCardsByType(type: CardType | string): ICard[] {
    return this.getObtainedCards().filter((c) => c.type === type);
  }

  /**
   * 查看卡片
   */
  viewCard(cardId: string): void {
    if (this._obtainedCards.has(cardId) && !this._viewedCards.has(cardId)) {
      this._viewedCards.add(cardId);
      eventBus.emit(GameEvent.CARD_VIEW, { cardId });

      // 触发 'view' 时机的 gameplay 效果
      this.applyCardGameplayFx(cardId, 'view');
    }
  }

  /**
   * 使用卡片
   * @param cardId 卡片ID
   * @returns 是否使用成功
   */
  useCard(cardId: string): boolean {
    if (!this._obtainedCards.has(cardId)) {
      logger.warn(`Cannot use card: ${cardId} (not obtained)`);
      return false;
    }

    // 检查是否已消耗
    if (worldState.isCardConsumed(cardId)) {
      logger.warn(`Cannot use card: ${cardId} (already consumed)`);
      return false;
    }

    const card = this._cardRegistry.get(cardId);
    if (!card) {
      logger.warn(`Cannot use card: ${cardId} (not found in registry)`);
      return false;
    }

    // 检查是否有 'use' 触发的效果
    const hasUseEffect = card.gameplayFx?.some((fx) => fx.trigger === 'use');
    if (!hasUseEffect) {
      logger.info(`Card ${cardId} has no 'use' effect`);
      return false;
    }

    // 应用 'use' 效果
    const applied = this.applyCardGameplayFx(cardId, 'use');

    // 如果是消耗品，标记为已消耗
    if (applied && card.consumable) {
      worldState.consumeCard(cardId);
      this._obtainedCards.delete(cardId);
      eventBus.emit(GameEvent.CARD_CONSUME, { cardId, card: { id: card.id, title: card.name, category: card.type } });
      logger.info(`Card consumed: ${cardId}`);
    }

    return applied;
  }

  /**
   * 检查卡片是否可使用
   * @param cardId 卡片ID
   * @returns 是否可使用
   */
  isCardUsable(cardId: string): boolean {
    if (!this._obtainedCards.has(cardId)) return false;
    if (worldState.isCardConsumed(cardId)) return false;

    const card = this._cardRegistry.get(cardId);
    if (!card) return false;

    // 检查是否有 'use' 触发的效果
    return card.gameplayFx?.some((fx) => fx.trigger === 'use') ?? false;
  }

  /**
   * 获取卡片效果预览文本
   * @param cardId 卡片ID
   * @returns 效果预览文本数组
   */
  getCardEffectPreview(cardId: string): string[] {
    const card = this._cardRegistry.get(cardId);
    if (!card?.gameplayFx) return [];

    const previews: string[] = [];
    const useFx = card.gameplayFx.filter((fx) => fx.trigger === 'use');

    for (const fx of useFx) {
      for (const effect of fx.effects) {
        switch (effect.type) {
          case 'counterDelta':
            if (effect.counter && effect.delta !== undefined) {
              const sign = effect.delta >= 0 ? '+' : '';
              previews.push(`${effect.counter} ${sign}${effect.delta}`);
            }
            break;
          case 'setFlag':
            if (effect.flagName) {
              previews.push(`设置标记: ${effect.flagName}`);
            }
            break;
          case 'giveCard':
            if (effect.cardId) {
              previews.push(`获得卡片`);
            }
            break;
          case 'unlockAbility':
            if (effect.abilityType) {
              previews.push(`解锁能力`);
            }
            break;
        }
      }
    }

    return previews;
  }

  /**
   * 应用卡片 Gameplay 效果
   * @param cardId 卡片ID
   * @param trigger 触发时机
   * @returns 是否成功应用了效果
   */
  applyCardGameplayFx(cardId: string, trigger: 'obtain' | 'use' | 'view'): boolean {
    const card = this._cardRegistry.get(cardId);
    if (!card?.gameplayFx) return false;

    const fxList = card.gameplayFx.filter((fx) => fx.trigger === trigger);
    if (fxList.length === 0) return false;

    let appliedAny = false;

    for (const fx of fxList) {
      for (const effect of fx.effects) {
        const applied = this._applyGameplayEffect(effect);
        if (applied) appliedAny = true;
      }
    }

    if (appliedAny) {
      logger.info(`Applied gameplay effects for card ${cardId} on ${trigger}`);
    }

    return appliedAny;
  }

  /**
   * 应用单个 Gameplay 效果
   */
  private _applyGameplayEffect(effect: ICardGameplayEffect): boolean {
    switch (effect.type) {
      case 'counterDelta':
        if (effect.counter && effect.delta !== undefined) {
          if (effect.counter === 'R') {
            worldState.addR(effect.delta);
          } else if (effect.counter === 'P') {
            worldState.addP(effect.delta);
          }
          return true;
        }
        break;

      case 'setFlag':
        if (effect.flagName !== undefined) {
          worldState.setFlag(effect.flagName, effect.flagValue ?? true);
          return true;
        }
        break;

      case 'giveCard':
        if (effect.cardId) {
          this.obtainCard(effect.cardId);
          return true;
        }
        break;

      case 'unlockAbility':
        if (effect.abilityType) {
          const normalizedType = this._normalizeAbilityType(effect.abilityType);
          worldState.unlockAbility(normalizedType as AbilityType);
          return true;
        }
        break;
    }

    return false;
  }

  /**
   * 检查卡片是否已查看
   */
  isCardViewed(cardId: string): boolean {
    return this._viewedCards.has(cardId);
  }

  // ==================== 伏笔系统 ====================

  /**
   * 注册伏笔（使用统一 Schema）
   */
  registerForeshadow(foreshadow: IForeshadow): void {
    this._foreshadowRegistry.set(foreshadow.id, foreshadow);
    this._foreshadowStates.set(foreshadow.id, {
      planted: false,
      deepened: false,
      misled: false,
      revealed: false,
      // 兼容旧版字段
      collected: false,
      resolved: false,
    });
  }

  /**
   * 批量注册伏笔
   */
  registerForeshadows(foreshadows: IForeshadow[]): void {
    foreshadows.forEach((f) => this.registerForeshadow(f));
  }

  /**
   * 触发伏笔（统一 Schema）
   * 支持新旧阶段命名：
   * - plant: 投放
   * - deepen: 加深
   * - mislead/misread: 误读
   * - reveal/collect/resolve: 回收
   */
  triggerForeshadow(foreshadowId: string, stage: ForeshadowStage): boolean {
    const state = this._foreshadowStates.get(foreshadowId);
    if (!state) {
      logger.warn(`Foreshadow not found: ${foreshadowId}`);
      return false;
    }

    const currentZone = worldState.getCurrentZone();

    // 标准化阶段名称
    const normalizedStage = this._normalizeStage(stage);

    switch (normalizedStage) {
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

      case 'mislead':
        // mislead 是可选阶段，不影响 revealed 状态
        if (state.planted && !state.revealed) {
          state.misled = true;
          state.misledAt = currentZone;
          eventBus.emit(GameEvent.FORESHADOW_TRIGGERED, {
            foreshadowId,
            stage: 'mislead',
            zoneId: currentZone,
          });
          return true;
        }
        break;

      case 'reveal':
        if (state.planted && !state.revealed) {
          state.revealed = true;
          state.revealedAt = currentZone;
          // 兼容旧版字段
          state.collected = true;
          state.collectedAt = currentZone;
          state.resolved = true;
          state.resolvedAt = currentZone;
          eventBus.emit(GameEvent.FORESHADOW_COLLECT, { foreshadowId, zoneId: currentZone });
          return true;
        }
        break;
    }

    return false;
  }

  /**
   * 标准化阶段名称（兼容旧版命名）
   * 使用统一的 normalizeForeshadowStage 函数
   */
  private _normalizeStage(stage: ForeshadowStage): ForeshadowStageType {
    return normalizeForeshadowStage(stage as ForeshadowStageLegacy);
  }

  /**
   * 获取伏笔状态
   * 返回统一命名：plant/deepen/mislead/reveal
   */
  getForeshadowState(foreshadowId: string): ForeshadowStageType | null {
    const state = this._foreshadowStates.get(foreshadowId);
    if (!state) return null;

    if (state.revealed) return 'reveal';
    if (state.misled) return 'mislead';
    if (state.deepened) return 'deepen';
    if (state.planted) return 'plant';
    return null;
  }

  /**
   * 检查伏笔是否已回收
   */
  isForeshadowCollected(foreshadowId: string): boolean {
    const state = this._foreshadowStates.get(foreshadowId);
    // 兼容新旧字段
    return state?.revealed ?? state?.collected ?? false;
  }

  /**
   * 检查是否可以触发伏笔阶段
   * 支持新旧命名
   */
  canTriggerForeshadow(foreshadowId: string, stage: ForeshadowStage): boolean {
    const state = this._foreshadowStates.get(foreshadowId);
    if (!state) return false;

    const normalizedStage = this._normalizeStage(stage);
    const isRevealed = state.revealed ?? state.collected ?? false;

    switch (normalizedStage) {
      case 'plant':
        return !state.planted;
      case 'deepen':
        return state.planted && !state.deepened;
      case 'mislead':
        return state.planted && !isRevealed;
      case 'reveal':
        return state.planted && !isRevealed;
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
      state.misled = false;
      state.revealed = false;
      state.plantedAt = undefined;
      state.deepenedAt = undefined;
      state.misledAt = undefined;
      state.revealedAt = undefined;
      // 兼容旧版字段
      state.collected = false;
      state.collectedAt = undefined;
      state.resolved = false;
      state.resolvedAt = undefined;
    });
    this._currentDialogue = null;
    this._currentLineIndex = 0;
    this._isDialogueActive = false;
    this._dialogueHistory = [];
  }
}

// 导出单例
export const narrativeEngine = NarrativeEngine.getInstance();
