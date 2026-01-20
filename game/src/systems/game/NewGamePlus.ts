/**
 * New Game+ 系统
 * 通关后解锁新内容和特性
 * @module systems/game/NewGamePlus
 */

import { createLogger } from '@/utils/Logger';
import { worldState } from '@/systems/world';
import { safeStorage } from '@/systems/storage';

const logger = createLogger('NewGamePlus');
import { saveManager } from '@/systems/save';

export interface INewGamePlusRewards {
  /** 解锁的伏笔提示 */
  foreshadowHints: string[];
  /** 解锁的隐藏对话 */
  hiddenDialogues: string[];
  /** 解锁的收藏品 */
  collectibles: string[];
  /** 初始能力解锁 */
  startingAbilities: string[];
  /** 特殊功能 */
  features: string[];
}

export interface INewGamePlusState {
  /** 是否是NG+ */
  isNewGamePlus: boolean;
  /** NG+周回数 */
  cycleCount: number;
  /** 达成的结局 */
  achievedEndings: string[];
  /** 收集的卡片总数 */
  totalCardsCollected: number;
  /** 最高R值记录 */
  maxRValueReached: number;
  /** 所有伏笔回收 */
  allForeshadowsCollected: boolean;
  /** 解锁的奖励 */
  rewards: INewGamePlusRewards;
}

/**
 * New Game+ 管理器
 */
class NewGamePlusManager {
  private _state: INewGamePlusState = {
    isNewGamePlus: false,
    cycleCount: 0,
    achievedEndings: [],
    totalCardsCollected: 0,
    maxRValueReached: 0,
    allForeshadowsCollected: false,
    rewards: {
      foreshadowHints: [],
      hiddenDialogues: [],
      collectibles: [],
      startingAbilities: [],
      features: [],
    },
  };

  /**
   * 初始化NG+状态
   */
  public async initialize(): Promise<void> {
    const stored = safeStorage.get<INewGamePlusState>('ngplus');
    if (stored) {
      this._state = stored;
      logger.info('加载NG+状态:', this._state);
    }
  }

  /**
   * 通关后记录
   */
  public recordCompletion(endingType: string): void {
    // 更新周回数
    this._state.cycleCount++;
    this._state.isNewGamePlus = true;

    // 记录结局
    if (!this._state.achievedEndings.includes(endingType)) {
      this._state.achievedEndings.push(endingType);
    }

    // 记录统计
    const counters = worldState.getCounters();
    if (counters.R > this._state.maxRValueReached) {
      this._state.maxRValueReached = counters.R;
    }

    // 卡片收集数量从flags中计算
    let cardCount = 0;
    // 检查常见卡片FLAG
    for (let i = 0; i < 100; i++) {
      if (worldState.getFlag(`CARD_COLLECTED_${i}`)) {
        cardCount++;
      }
    }
    this._state.totalCardsCollected = cardCount;

    // 检查伏笔收集情况
    // TODO: 从ForeshadowManager获取实际数据
    const collectedForeshadows = this._getCollectedForeshadowCount();
    this._state.allForeshadowsCollected = collectedForeshadows >= 11;

    // 解锁奖励
    this._unlockRewards();

    // 保存
    this._save();

    logger.info('通关记录:', {
      cycle: this._state.cycleCount,
      ending: endingType,
      endings: this._state.achievedEndings,
    });
  }

  /**
   * 解锁奖励
   */
  private _unlockRewards(): void {
    const rewards = this._state.rewards;

    // 第一次通关：解锁伏笔提示
    if (this._state.cycleCount >= 1) {
      rewards.features.push('FORESHADOW_HINTS');
    }

    // 达成所有结局：解锁隐藏对话
    if (this._state.achievedEndings.length >= 3) {
      rewards.features.push('HIDDEN_DIALOGUES');
      rewards.hiddenDialogues = ['SYSTEM_EPILOGUE_FULL', 'GULIN_TRUE_THOUGHTS', 'QILAN_BACKSTORY'];
    }

    // 高R值通关（R >= 10）：解锁特殊收藏品
    if (this._state.maxRValueReached >= 10) {
      rewards.features.push('MODEL_REWRITE_INSIGHT');
      rewards.collectibles.push('CARD_MODEL_BOUNDARY_FULL');
    }

    // 收集所有伏笔：解锁初始能力
    if (this._state.allForeshadowsCollected) {
      rewards.features.push('STARTING_PERCEPTION');
      rewards.startingAbilities.push('DEPTH_PERCEPTION');
    }

    // 周回3次以上：解锁更多
    if (this._state.cycleCount >= 3) {
      rewards.features.push('ZONE_SKIP');
      rewards.features.push('COUNTER_DISPLAY');
    }
  }

  /**
   * 获取已收集伏笔数量
   */
  private _getCollectedForeshadowCount(): number {
    // 从世界状态检查伏笔FLAG
    const foreshadowIds = [
      'F01',
      'F02',
      'F03',
      'F04',
      'F05',
      'F06',
      'F08',
      'F15',
      'F21',
      'F22',
      'F23',
    ];
    let count = 0;
    foreshadowIds.forEach((id) => {
      if (worldState.getFlag(`FORESHADOW_${id}_COLLECT`)) {
        count++;
      }
    });
    return count;
  }

  /**
   * 开始New Game+
   */
  public async startNewGamePlus(): Promise<void> {
    if (!this._state.isNewGamePlus) {
      logger.warn('尚未解锁NG+');
      return;
    }

    // 重置世界状态但保留NG+数据
    worldState.reset();

    // 应用NG+奖励
    this._applyRewards();

    // 清理存档但保留NG+状态（逐个删除）
    for (let i = 0; i < 5; i++) {
      await saveManager.deleteSave(i);
    }

    logger.info('NG+开始，周回:', this._state.cycleCount);
  }

  /**
   * 应用NG+奖励
   */
  private _applyRewards(): void {
    const rewards = this._state.rewards;

    // 初始能力
    if (rewards.startingAbilities.includes('DEPTH_PERCEPTION')) {
      worldState.unlockAbility('DEPTH_PERCEPTION');
    }

    // 设置NG+标记
    worldState.setFlag('IS_NEW_GAME_PLUS', true);
    worldState.setFlag(`NG_PLUS_CYCLE_${this._state.cycleCount}`, true);
  }

  /**
   * 保存NG+状态
   */
  private _save(): void {
    if (!safeStorage.set('ngplus', this._state)) {
      logger.error('保存失败');
    }
  }

  /**
   * 获取NG+状态
   */
  public getState(): Readonly<INewGamePlusState> {
    return { ...this._state };
  }

  /**
   * 是否是NG+
   */
  public isNewGamePlus(): boolean {
    return this._state.isNewGamePlus;
  }

  /**
   * 是否解锁了特定功能
   */
  public hasFeature(feature: string): boolean {
    return this._state.rewards.features.includes(feature);
  }

  /**
   * 获取周回数
   */
  public getCycleCount(): number {
    return this._state.cycleCount;
  }

  /**
   * 获取达成的结局
   */
  public getAchievedEndings(): string[] {
    return [...this._state.achievedEndings];
  }
}

// 导出单例
export const newGamePlusManager = new NewGamePlusManager();
