/**
 * 交互系统
 * 实现统一的"真实交互循环"：Pre-check → State Change → Persistence → Feedback
 * @module systems/interaction/InteractionSystem
 */

import Phaser from 'phaser';
import { createLogger } from '@/utils/Logger';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { worldState } from '@/systems/world';
import { saveManager } from '@/systems/save';
import { narrativeEngine } from '@/systems/narrative';
import type { ISceneAction, IInteractionEffect } from '@/types/scene';

const logger = createLogger('InteractionSystem');

// ==================== 类型定义 ====================

/**
 * 交互上下文
 * 描述交互发生的环境信息
 */
export interface IInteractionContext {
  /** 当前Zone ID */
  zoneId: string;
  /** 触发交互的对象ID */
  objectId: string;
  /** 触发交互的源游戏对象（可选，用于禁用一次性物品） */
  sourceObject?: Phaser.GameObjects.GameObject;
}

/**
 * 交互结果
 * 描述交互执行后的状态
 */
export interface IInteractionResult {
  /** 是否执行成功 */
  ok: boolean;
  /** 是否产生了状态变更 */
  changed: boolean;
  /** 反馈消息列表（用于Toast显示） */
  feedback: string[];
  /** 错误信息（如果失败） */
  error?: string;
  /** 需要播放的音效列表 */
  sfxToPlay?: string[];
  /** 交互产生的卡片ID（如果有） */
  cardId?: string;
  /** 是否是新获得的卡片 */
  isNewCard?: boolean;
}

/**
 * 交互系统配置
 */
export interface IInteractionSystemConfig {
  /** 所属场景 */
  scene: Phaser.Scene;
  /** 获得卡片回调 */
  onCardObtain?: (cardId: string, isNew: boolean) => void;
  /** 显示对话回调 */
  onShowDialogue?: (dialogueId: string) => void;
  /** 切换Zone回调 */
  onGotoZone?: (zoneId: string) => void;
  /** 播放音效回调 */
  onPlaySfx?: (sfxKey: string) => void;
  /** 显示Toast回调 */
  onShowToast?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

// ==================== InteractionSystem 类 ====================

/**
 * 交互系统
 * 负责处理所有游戏内交互，确保状态一致性和持久化
 */
export class InteractionSystem {
  private _config: IInteractionSystemConfig;

  constructor(config: IInteractionSystemConfig) {
    this._config = config;
    logger.info('交互系统初始化');
  }

  /**
   * 执行交互
   * 实现四段式交互循环：Pre-check → State Change → Persistence → Feedback
   *
   * @param action 交互动作配置
   * @param context 交互上下文
   * @returns 交互结果
   */
  execute(action: ISceneAction, context: IInteractionContext): IInteractionResult {
    const result: IInteractionResult = {
      ok: false,
      changed: false,
      feedback: [],
      sfxToPlay: [],
    };

    // 生成交互ID（用于一次性交互追踪）
    const interactionId = this._generateInteractionId(action, context);

    logger.debug(`执行交互: ${interactionId}`, { action, context });

    // ==================== Phase 1: Pre-check ====================
    const preCheckResult = this._preCheck(action, context, interactionId);
    if (!preCheckResult.canProceed) {
      result.ok = false;
      result.error = preCheckResult.reason;
      logger.debug(`交互预检失败: ${preCheckResult.reason}`);
      return result;
    }

    // ==================== Phase 2: State Change ====================
    const stateChangeResult = this._applyStateChanges(action, context, interactionId);
    result.changed = stateChangeResult.changed;
    result.feedback.push(...stateChangeResult.feedback);
    result.sfxToPlay?.push(...(stateChangeResult.sfxToPlay || []));
    result.cardId = stateChangeResult.cardId;
    result.isNewCard = stateChangeResult.isNewCard;

    // ==================== Phase 3: Persistence ====================
    if (result.changed) {
      this._persist(action, context, interactionId);
    }

    // ==================== Phase 4: Feedback ====================
    this._triggerFeedback(action, context, result);

    // 发送交互提交事件
    eventBus.emitTyped(GameEvent.INTERACTION_COMMIT, {
      interactionId,
      zoneId: context.zoneId,
      objectId: context.objectId,
      actionType: action.type,
      changed: result.changed,
    });

    result.ok = true;
    logger.info(`交互完成: ${interactionId}`, { changed: result.changed });
    return result;
  }

  /**
   * 生成交互ID
   * 格式: {zoneId}_{objectId}_{actionType}_{cardId/dialogueId/targetZoneId}
   */
  private _generateInteractionId(action: ISceneAction, context: IInteractionContext): string {
    // 优先使用 action.id（如果已指定）
    if (action.id) {
      return action.id;
    }

    const parts = [context.zoneId, context.objectId, action.type];

    switch (action.type) {
      case 'card':
        if (action.cardId) parts.push(action.cardId);
        break;
      case 'dialogue':
        if (action.dialogueId) parts.push(action.dialogueId);
        break;
      case 'gotoZone':
        if (action.zoneId) parts.push(action.zoneId);
        break;
    }

    return parts.join('_');
  }

  /**
   * Phase 1: 预检查
   * 检查交互是否可以执行
   */
  private _preCheck(
    action: ISceneAction,
    _context: IInteractionContext,
    interactionId: string
  ): { canProceed: boolean; reason?: string } {
    // 检查是否是一次性交互且已完成
    const isOnce = action.once ?? (action.type === 'card'); // card 类型默认一次性
    if (isOnce && worldState.hasInteraction(interactionId)) {
      return { canProceed: false, reason: '该交互已完成' };
    }

    // 检查卡片是否已拥有（对于 card 类型）
    if (action.type === 'card' && action.cardId) {
      if (narrativeEngine.hasCard(action.cardId)) {
        // 卡片已拥有，但仍允许查看
        // 不阻止交互，只是不会标记为"新获得"
      }
    }

    // TODO: 可以添加更多预检条件，如：
    // - 检查 flag 条件
    // - 检查能力条件
    // - 检查计数器条件

    return { canProceed: true };
  }

  /**
   * Phase 2: 状态变更
   * 应用交互产生的所有状态变更
   */
  private _applyStateChanges(
    action: ISceneAction,
    context: IInteractionContext,
    interactionId: string
  ): {
    changed: boolean;
    feedback: string[];
    sfxToPlay?: string[];
    cardId?: string;
    isNewCard?: boolean;
  } {
    const result = {
      changed: false,
      feedback: [] as string[],
      sfxToPlay: [] as string[],
      cardId: undefined as string | undefined,
      isNewCard: undefined as boolean | undefined,
    };

    // 1. 应用 effects（如果有）
    if (action.effects && action.effects.length > 0) {
      for (const effect of action.effects) {
        this._applyEffect(effect, result);
      }
    }

    // 2. 根据 action.type 执行特定逻辑
    switch (action.type) {
      case 'card':
        if (action.cardId) {
          const alreadyOwned = narrativeEngine.hasCard(action.cardId);
          if (!alreadyOwned) {
            narrativeEngine.obtainCard(action.cardId);
            result.changed = true;
            result.isNewCard = true;
            result.feedback.push(`获得卡片`);

            // 发送物品收集事件
            eventBus.emitTyped(GameEvent.ITEM_COLLECT, {
              itemId: action.cardId,
              zoneId: context.zoneId,
              objectId: context.objectId,
              cardId: action.cardId,
            });
          }
          result.cardId = action.cardId;
        }
        break;

      case 'dialogue':
        // 对话本身不产生状态变更（对话内的选择会触发变更）
        // 但需要标记对话已触发
        result.changed = true;
        break;

      case 'gotoZone':
        // Zone 切换不需要在这里记录状态变更
        // WorldState.visitZone() 会在场景切换时调用
        break;

      case 'none':
      default:
        break;
    }

    // 3. 标记一次性交互为已完成
    const isOnce = action.once ?? (action.type === 'card');
    if (isOnce && result.changed) {
      worldState.markInteractionDone(interactionId, {
        actionType: action.type,
        cardId: action.cardId,
        dialogueId: action.dialogueId,
        zoneId: action.zoneId,
      });
    }

    return result;
  }

  /**
   * 应用单个交互效果
   */
  private _applyEffect(
    effect: IInteractionEffect,
    result: { changed: boolean; feedback: string[]; sfxToPlay: string[] }
  ): void {
    switch (effect.type) {
      case 'flag':
        if (effect.flagName !== undefined) {
          worldState.setFlag(effect.flagName, effect.flagValue ?? true);
          result.changed = true;
          logger.debug(`设置 flag: ${effect.flagName} = ${effect.flagValue ?? true}`);
        }
        break;

      case 'counter':
        if (effect.counter && effect.delta !== undefined) {
          if (effect.counter === 'R') {
            worldState.addR(effect.delta);
          } else if (effect.counter === 'P') {
            worldState.addP(effect.delta);
          }
          result.changed = true;
          logger.debug(`修改计数器: ${effect.counter} += ${effect.delta}`);
        }
        break;

      case 'card':
        if (effect.cardId) {
          const alreadyOwned = narrativeEngine.hasCard(effect.cardId);
          if (!alreadyOwned) {
            narrativeEngine.obtainCard(effect.cardId);
            result.changed = true;
            result.feedback.push(`获得卡片`);
          }
        }
        break;

      case 'sound':
        if (effect.sfxKey) {
          result.sfxToPlay.push(effect.sfxKey);
        }
        break;
    }
  }

  /**
   * Phase 3: 持久化
   * 标记状态为脏，触发自动存档
   */
  private _persist(action: ISceneAction, context: IInteractionContext, interactionId: string): void {
    const reason = `交互: ${action.type} @ ${context.objectId} (${interactionId})`;
    saveManager.markDirty(reason);
    logger.debug(`状态已标脏: ${reason}`);
  }

  /**
   * Phase 4: 触发反馈
   * 触发UI反馈（Toast、音效、对话等）
   */
  private _triggerFeedback(
    action: ISceneAction,
    _context: IInteractionContext,
    result: IInteractionResult
  ): void {
    // 播放音效
    if (result.sfxToPlay && result.sfxToPlay.length > 0) {
      for (const sfx of result.sfxToPlay) {
        this._config.onPlaySfx?.(sfx);
        eventBus.emit(GameEvent.PLAY_SFX, { key: sfx });
      }
    }

    // 根据 action 类型触发特定反馈
    switch (action.type) {
      case 'card':
        if (result.cardId) {
          this._config.onCardObtain?.(result.cardId, result.isNewCard ?? false);
        }
        break;

      case 'dialogue':
        if (action.dialogueId) {
          this._config.onShowDialogue?.(action.dialogueId);
        }
        break;

      case 'gotoZone':
        if (action.zoneId) {
          this._config.onGotoZone?.(action.zoneId);
        }
        break;
    }

    // 显示反馈消息
    // 注意：卡片获得的Toast由CardUI或事件监听器处理，这里不重复显示
    // 只显示其他类型的反馈
    for (const msg of result.feedback) {
      if (action.type !== 'card') {
        this._config.onShowToast?.(msg, 'info');
      }
    }
  }

  /**
   * 销毁交互系统
   */
  destroy(): void {
    logger.info('交互系统销毁');
  }
}
