/**
 * 成就系统
 * 追踪和解锁游戏成就
 * @module systems/game/AchievementSystem
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { worldState } from '@/systems/world';

export enum AchievementCategory {
  /** 主线进度 */
  STORY = 'story',
  /** 探索发现 */
  EXPLORATION = 'exploration',
  /** 能力使用 */
  ABILITIES = 'abilities',
  /** 收集类 */
  COLLECTION = 'collection',
  /** 特殊行为 */
  SPECIAL = 'special',
  /** 隐藏成就 */
  HIDDEN = 'hidden',
}

export enum AchievementRarity {
  /** 普通 */
  COMMON = 'common',
  /** 稀有 */
  RARE = 'rare',
  /** 史诗 */
  EPIC = 'epic',
  /** 传说 */
  LEGENDARY = 'legendary',
}

export interface IAchievement {
  id: string;
  name: string;
  description: string;
  hiddenDescription?: string;  // 解锁前显示的描述
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  isHidden: boolean;
  condition: IAchievementCondition;
  rewards?: IAchievementReward;
}

export interface IAchievementCondition {
  type: 'flag' | 'counter' | 'zone' | 'card' | 'ending' | 'custom';
  flag?: string;
  counter?: { name: 'R' | 'P' | 'W'; value: number; comparison: 'gte' | 'lte' | 'eq' };
  zoneId?: string;
  cardCount?: number;
  endingType?: string;
  customCheck?: () => boolean;
}

export interface IAchievementReward {
  type: 'unlock' | 'cosmetic' | 'hint';
  value: string;
}

export interface IAchievementState {
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
}

/**
 * 成就定义
 */
const ACHIEVEMENTS: IAchievement[] = [
  // ==================== 主线进度 ====================
  {
    id: 'ACH_PROLOGUE_COMPLETE',
    name: '例外处理器',
    description: '完成序章，正式加入维修局',
    category: AchievementCategory.STORY,
    rarity: AchievementRarity.COMMON,
    icon: '📋',
    isHidden: false,
    condition: { type: 'flag', flag: 'CHAPTER_C0_COMPLETE' },
  },
  {
    id: 'ACH_C1_COMPLETE',
    name: '层下记录',
    description: '完成第1章，了解宋岚的记录使命',
    category: AchievementCategory.STORY,
    rarity: AchievementRarity.COMMON,
    icon: '📖',
    isHidden: false,
    condition: { type: 'flag', flag: 'CHAPTER_C1_COMPLETE' },
  },
  {
    id: 'ACH_C2_COMPLETE',
    name: '深度感知者',
    description: '完成第2章，解锁深度感知能力',
    category: AchievementCategory.STORY,
    rarity: AchievementRarity.COMMON,
    icon: '👁️',
    isHidden: false,
    condition: { type: 'flag', flag: 'CHAPTER_C2_COMPLETE' },
  },
  {
    id: 'ACH_C3_COMPLETE',
    name: '介入者',
    description: '完成第3章，学会深度介入',
    category: AchievementCategory.STORY,
    rarity: AchievementRarity.RARE,
    icon: '✋',
    isHidden: false,
    condition: { type: 'flag', flag: 'CHAPTER_C3_COMPLETE' },
  },
  {
    id: 'ACH_C4_COMPLETE',
    name: '时间操控者',
    description: '完成第4章，掌握时间干预',
    category: AchievementCategory.STORY,
    rarity: AchievementRarity.RARE,
    icon: '⏰',
    isHidden: false,
    condition: { type: 'flag', flag: 'CHAPTER_C4_COMPLETE' },
  },
  {
    id: 'ACH_C5_COMPLETE',
    name: '版本裁决者',
    description: '完成第5章，见证版本冲突',
    category: AchievementCategory.STORY,
    rarity: AchievementRarity.EPIC,
    icon: '⚖️',
    isHidden: false,
    condition: { type: 'flag', flag: 'CHAPTER_C5_COMPLETE' },
  },
  {
    id: 'ACH_ENDING_A',
    name: '平面稳定',
    description: '达成结局A：继续收敛',
    category: AchievementCategory.STORY,
    rarity: AchievementRarity.EPIC,
    icon: '🔵',
    isHidden: false,
    condition: { type: 'ending', endingType: 'A' },
  },
  {
    id: 'ACH_ENDING_B',
    name: '真实释放',
    description: '达成结局B：释放表示',
    category: AchievementCategory.STORY,
    rarity: AchievementRarity.EPIC,
    icon: '🟠',
    isHidden: false,
    condition: { type: 'ending', endingType: 'B' },
  },
  {
    id: 'ACH_ENDING_C',
    name: '字段承载者',
    description: '达成结局C：成为桥接',
    category: AchievementCategory.STORY,
    rarity: AchievementRarity.LEGENDARY,
    icon: '🟢',
    isHidden: false,
    condition: { type: 'ending', endingType: 'C' },
  },
  {
    id: 'ACH_ALL_ENDINGS',
    name: '全知者',
    description: '达成所有三个结局',
    category: AchievementCategory.STORY,
    rarity: AchievementRarity.LEGENDARY,
    icon: '🌟',
    isHidden: false,
    condition: { type: 'flag', flag: 'ALL_ENDINGS_ACHIEVED' },
  },

  // ==================== 探索发现 ====================
  {
    id: 'ACH_FIRST_REVISIT',
    name: '故地重游',
    description: '首次使用深度感知重返已访问区域',
    category: AchievementCategory.EXPLORATION,
    rarity: AchievementRarity.COMMON,
    icon: '🔄',
    isHidden: false,
    condition: { type: 'flag', flag: 'FIRST_REVISIT_ZONE' },
  },
  {
    id: 'ACH_ALL_ZONES',
    name: '全境探索',
    description: '访问所有57个Zone',
    category: AchievementCategory.EXPLORATION,
    rarity: AchievementRarity.EPIC,
    icon: '🗺️',
    isHidden: false,
    condition: { type: 'flag', flag: 'ALL_ZONES_VISITED' },
  },
  {
    id: 'ACH_HIDDEN_PATH',
    name: '暗道行者',
    description: '发现3个隐藏路径',
    category: AchievementCategory.EXPLORATION,
    rarity: AchievementRarity.RARE,
    icon: '🚪',
    isHidden: false,
    condition: { type: 'flag', flag: 'FOUND_3_HIDDEN_PATHS' },
  },

  // ==================== 能力使用 ====================
  {
    id: 'ACH_PERCEPTION_MASTER',
    name: '洞察大师',
    description: '使用深度感知发现10个隐藏内容',
    category: AchievementCategory.ABILITIES,
    rarity: AchievementRarity.RARE,
    icon: '🔍',
    isHidden: false,
    condition: { type: 'flag', flag: 'PERCEPTION_USE_10' },
  },
  {
    id: 'ACH_INTERVENTION_MASTER',
    name: '改写者',
    description: '使用深度介入留下10道伤痕',
    category: AchievementCategory.ABILITIES,
    rarity: AchievementRarity.RARE,
    icon: '✒️',
    isHidden: false,
    condition: { type: 'flag', flag: 'INTERVENTION_USE_10' },
  },
  {
    id: 'ACH_TIME_MASTER',
    name: '时间织工',
    description: '使用时间干预回溯5次',
    category: AchievementCategory.ABILITIES,
    rarity: AchievementRarity.RARE,
    icon: '⏪',
    isHidden: false,
    condition: { type: 'flag', flag: 'TIME_REWIND_5' },
  },

  // ==================== 收集类 ====================
  {
    id: 'ACH_COLLECTOR_10',
    name: '收藏家',
    description: '收集10张卡片',
    category: AchievementCategory.COLLECTION,
    rarity: AchievementRarity.COMMON,
    icon: '🃏',
    isHidden: false,
    condition: { type: 'card', cardCount: 10 },
  },
  {
    id: 'ACH_COLLECTOR_30',
    name: '档案管理员',
    description: '收集30张卡片',
    category: AchievementCategory.COLLECTION,
    rarity: AchievementRarity.RARE,
    icon: '📚',
    isHidden: false,
    condition: { type: 'card', cardCount: 30 },
  },
  {
    id: 'ACH_COLLECTOR_ALL',
    name: '完美收藏',
    description: '收集所有卡片',
    category: AchievementCategory.COLLECTION,
    rarity: AchievementRarity.LEGENDARY,
    icon: '👑',
    isHidden: false,
    condition: { type: 'flag', flag: 'ALL_CARDS_COLLECTED' },
  },
  {
    id: 'ACH_FORESHADOW_ALL',
    name: '伏笔回收者',
    description: '回收所有20+伏笔',
    category: AchievementCategory.COLLECTION,
    rarity: AchievementRarity.LEGENDARY,
    icon: '🎯',
    isHidden: false,
    condition: { type: 'flag', flag: 'ALL_FORESHADOWS_COLLECTED' },
  },

  // ==================== 特殊行为 ====================
  {
    id: 'ACH_HIGH_R',
    name: '无意义行为者',
    description: 'R值达到10',
    hiddenDescription: '做出足够多的"无意义"行为',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    icon: '❓',
    isHidden: true,
    condition: { type: 'counter', counter: { name: 'R', value: 10, comparison: 'gte' } },
  },
  {
    id: 'ACH_LOW_INTERVENTION',
    name: '无痕穿越',
    description: '不使用深度介入完成游戏',
    hiddenDescription: '???',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.LEGENDARY,
    icon: '👻',
    isHidden: true,
    condition: { type: 'flag', flag: 'NO_INTERVENTION_USED' },
  },
  {
    id: 'ACH_SPEEDRUN',
    name: '疾风行者',
    description: '在3小时内通关',
    hiddenDescription: '快速完成游戏',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    icon: '⚡',
    isHidden: true,
    condition: { type: 'flag', flag: 'SPEEDRUN_3H' },
  },

  // ==================== 隐藏成就 ====================
  {
    id: 'ACH_QILAN_FRIEND',
    name: '多余者之友',
    description: '与栖蓝建立深厚联系',
    hiddenDescription: '???',
    category: AchievementCategory.HIDDEN,
    rarity: AchievementRarity.RARE,
    icon: '💚',
    isHidden: true,
    condition: { type: 'flag', flag: 'QILAN_FRIENDSHIP_MAX' },
  },
  {
    id: 'ACH_CHENJIANG_LIGHT',
    name: '点灯人的追随者',
    description: '理解陈匠的坚守',
    hiddenDescription: '???',
    category: AchievementCategory.HIDDEN,
    rarity: AchievementRarity.RARE,
    icon: '🕯️',
    isHidden: true,
    condition: { type: 'flag', flag: 'CHENJIANG_UNDERSTOOD' },
  },
  {
    id: 'ACH_MODEL_REWRITE',
    name: '模型改写者',
    description: '触发模型改写事件',
    hiddenDescription: '???',
    category: AchievementCategory.HIDDEN,
    rarity: AchievementRarity.LEGENDARY,
    icon: '🔮',
    isHidden: true,
    condition: { type: 'flag', flag: 'MODEL_REWRITE_TRIGGERED' },
  },
];

interface IAchievementManagerConfig {
  scene: Phaser.Scene;
}

/**
 * 成就管理器
 */
export class AchievementManager {
  private _scene: Phaser.Scene;
  private _achievements: Map<string, IAchievement> = new Map();
  private _states: Map<string, IAchievementState> = new Map();
  private _notificationQueue: IAchievement[] = [];
  private _isShowingNotification: boolean = false;
  private _notificationContainer!: Phaser.GameObjects.Container;

  constructor(config: IAchievementManagerConfig) {
    this._scene = config.scene;
    this._initializeAchievements();
    this._loadStates();
    this._createNotificationUI();
    this._setupEventListeners();
  }

  /**
   * 初始化成就定义
   */
  private _initializeAchievements(): void {
    ACHIEVEMENTS.forEach((ach) => {
      this._achievements.set(ach.id, ach);
    });
  }

  /**
   * 加载成就状态
   */
  private _loadStates(): void {
    try {
      const stored = localStorage.getItem('footnote_achievements');
      if (stored) {
        const data = JSON.parse(stored) as Record<string, IAchievementState>;
        Object.entries(data).forEach(([id, state]) => {
          this._states.set(id, state);
        });
      }
    } catch (error) {
      console.warn('[AchievementManager] 加载成就状态失败:', error);
    }
  }

  /**
   * 保存成就状态
   */
  private _saveStates(): void {
    try {
      const data: Record<string, IAchievementState> = {};
      this._states.forEach((state, id) => {
        data[id] = state;
      });
      localStorage.setItem('footnote_achievements', JSON.stringify(data));
    } catch (error) {
      console.error('[AchievementManager] 保存成就状态失败:', error);
    }
  }

  /**
   * 创建通知UI
   */
  private _createNotificationUI(): void {
    const { width } = this._scene.scale;

    this._notificationContainer = this._scene.add.container(width / 2, -100);
    this._notificationContainer.setDepth(2000);
  }

  /**
   * 设置事件监听
   */
  private _setupEventListeners(): void {
    // 监听FLAG变化
    eventBus.onTyped(GameEvent.FLAG_SET, this._onFlagSet.bind(this));
    // 监听计数器变化
    eventBus.onTyped(GameEvent.COUNTER_R_CHANGE, this._onCounterRChange.bind(this));
    // 监听卡片收集
    eventBus.onTyped(GameEvent.CARD_OBTAIN, this._onCardObtain.bind(this));
    // 监听结局达成
    eventBus.onTyped(GameEvent.ENDING_REACH, this._onEndingReach.bind(this));
  }

  /**
   * FLAG设置回调
   */
  private _onFlagSet(payload: { flagName: string; value: boolean }): void {
    if (payload.value) {
      this._checkFlagAchievements(payload.flagName);
    }
  }

  /**
   * R值变化回调
   */
  private _onCounterRChange(payload: { newValue: number }): void {
    this._checkCounterAchievements('R', payload.newValue);
  }

  /**
   * 卡片收集回调
   */
  private _onCardObtain(_payload: { cardId: string }): void {
    this._checkCardAchievements();
  }

  /**
   * 结局达成回调
   */
  private _onEndingReach(payload: { endingType: string }): void {
    this._checkEndingAchievements(payload.endingType);
  }

  /**
   * 检查FLAG相关成就
   */
  private _checkFlagAchievements(flagName: string): void {
    this._achievements.forEach((ach) => {
      if (ach.condition.type === 'flag' && ach.condition.flag === flagName) {
        this.unlock(ach.id);
      }
    });
  }

  /**
   * 检查计数器相关成就
   */
  private _checkCounterAchievements(counter: 'R' | 'P' | 'W', value: number): void {
    this._achievements.forEach((ach) => {
      if (ach.condition.type === 'counter' && ach.condition.counter?.name === counter) {
        const cond = ach.condition.counter;
        let met = false;
        switch (cond.comparison) {
          case 'gte':
            met = value >= cond.value;
            break;
          case 'lte':
            met = value <= cond.value;
            break;
          case 'eq':
            met = value === cond.value;
            break;
        }
        if (met) {
          this.unlock(ach.id);
        }
      }
    });
  }

  /**
   * 检查卡片收集成就
   */
  private _checkCardAchievements(): void {
    // 计算当前卡片数量
    let cardCount = 0;
    for (let i = 0; i < 100; i++) {
      if (worldState.getFlag(`CARD_COLLECTED_${i}`)) {
        cardCount++;
      }
    }

    this._achievements.forEach((ach) => {
      if (ach.condition.type === 'card' && ach.condition.cardCount) {
        if (cardCount >= ach.condition.cardCount) {
          this.unlock(ach.id);
        }
      }
    });
  }

  /**
   * 检查结局相关成就
   */
  private _checkEndingAchievements(endingType: string): void {
    this._achievements.forEach((ach) => {
      if (ach.condition.type === 'ending' && ach.condition.endingType === endingType) {
        this.unlock(ach.id);
      }
    });

    // 检查是否达成所有结局
    const endingsA = worldState.getFlag('ENDING_A_ACHIEVED');
    const endingsB = worldState.getFlag('ENDING_B_ACHIEVED');
    const endingsC = worldState.getFlag('ENDING_C_ACHIEVED');
    if (endingsA && endingsB && endingsC) {
      worldState.setFlag('ALL_ENDINGS_ACHIEVED', true);
    }
  }

  /**
   * 解锁成就
   */
  public unlock(achievementId: string): boolean {
    const achievement = this._achievements.get(achievementId);
    if (!achievement) {
      console.warn(`[AchievementManager] 未知成就: ${achievementId}`);
      return false;
    }

    const state = this._states.get(achievementId);
    if (state?.unlocked) {
      return false; // 已解锁
    }

    // 更新状态
    this._states.set(achievementId, {
      unlocked: true,
      unlockedAt: Date.now(),
    });

    // 保存
    this._saveStates();

    // 显示通知
    this._queueNotification(achievement);

    // 应用奖励
    if (achievement.rewards) {
      this._applyReward(achievement.rewards);
    }

    console.log(`[AchievementManager] 成就解锁: ${achievement.name}`);
    return true;
  }

  /**
   * 队列通知
   */
  private _queueNotification(achievement: IAchievement): void {
    this._notificationQueue.push(achievement);
    if (!this._isShowingNotification) {
      this._showNextNotification();
    }
  }

  /**
   * 显示下一个通知
   */
  private _showNextNotification(): void {
    if (this._notificationQueue.length === 0) {
      this._isShowingNotification = false;
      return;
    }

    this._isShowingNotification = true;
    const achievement = this._notificationQueue.shift()!;
    this._showNotification(achievement);
  }

  /**
   * 显示成就通知
   */
  private _showNotification(achievement: IAchievement): void {
    this._notificationContainer.removeAll(true);

    // 背景
    const bg = this._scene.add.rectangle(0, 0, 350, 80, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(2, this._getRarityColor(achievement.rarity));
    this._notificationContainer.add(bg);

    // 图标
    const icon = this._scene.add.text(-140, 0, achievement.icon, {
      fontSize: '32px',
    });
    icon.setOrigin(0.5);
    this._notificationContainer.add(icon);

    // 标题
    const title = this._scene.add.text(-100, -15, '成就解锁', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888',
    });
    title.setOrigin(0, 0.5);
    this._notificationContainer.add(title);

    // 成就名
    const name = this._scene.add.text(-100, 8, achievement.name, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: `#${this._getRarityColor(achievement.rarity).toString(16).padStart(6, '0')}`,
    });
    name.setOrigin(0, 0.5);
    this._notificationContainer.add(name);

    // 稀有度标识
    const rarityText = this._scene.add.text(140, 0, this._getRarityText(achievement.rarity), {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: `#${this._getRarityColor(achievement.rarity).toString(16).padStart(6, '0')}`,
    });
    rarityText.setOrigin(0.5);
    this._notificationContainer.add(rarityText);

    // 动画：滑入
    this._notificationContainer.y = -100;
    this._scene.tweens.add({
      targets: this._notificationContainer,
      y: 80,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // 延迟后滑出
    this._scene.time.delayedCall(3000, () => {
      this._scene.tweens.add({
        targets: this._notificationContainer,
        y: -100,
        duration: 300,
        ease: 'Sine.easeIn',
        onComplete: () => {
          this._showNextNotification();
        },
      });
    });

    // 播放音效
    eventBus.emit(GameEvent.PLAY_SFX, { key: 'sfx_achievement' });
  }

  /**
   * 获取稀有度颜色
   */
  private _getRarityColor(rarity: AchievementRarity): number {
    switch (rarity) {
      case AchievementRarity.COMMON:
        return 0x888888;
      case AchievementRarity.RARE:
        return 0x4488ff;
      case AchievementRarity.EPIC:
        return 0xaa44ff;
      case AchievementRarity.LEGENDARY:
        return 0xffaa00;
    }
  }

  /**
   * 获取稀有度文本
   */
  private _getRarityText(rarity: AchievementRarity): string {
    switch (rarity) {
      case AchievementRarity.COMMON:
        return '普通';
      case AchievementRarity.RARE:
        return '稀有';
      case AchievementRarity.EPIC:
        return '史诗';
      case AchievementRarity.LEGENDARY:
        return '传说';
    }
  }

  /**
   * 应用奖励
   */
  private _applyReward(reward: IAchievementReward): void {
    switch (reward.type) {
      case 'unlock':
        worldState.setFlag(reward.value, true);
        break;
      case 'hint':
        // 保存提示到NG+系统
        break;
    }
  }

  /**
   * 获取成就
   */
  public getAchievement(id: string): IAchievement | undefined {
    return this._achievements.get(id);
  }

  /**
   * 获取成就状态
   */
  public getState(id: string): IAchievementState {
    return this._states.get(id) || { unlocked: false };
  }

  /**
   * 获取所有成就
   */
  public getAllAchievements(): IAchievement[] {
    return Array.from(this._achievements.values());
  }

  /**
   * 获取已解锁成就数量
   */
  public getUnlockedCount(): number {
    let count = 0;
    this._states.forEach((state) => {
      if (state.unlocked) count++;
    });
    return count;
  }

  /**
   * 获取总成就数量
   */
  public getTotalCount(): number {
    return this._achievements.size;
  }

  /**
   * 获取按分类分组的成就
   */
  public getAchievementsByCategory(): Map<AchievementCategory, IAchievement[]> {
    const grouped = new Map<AchievementCategory, IAchievement[]>();
    this._achievements.forEach((ach) => {
      const list = grouped.get(ach.category) || [];
      list.push(ach);
      grouped.set(ach.category, list);
    });
    return grouped;
  }

  /**
   * 检查是否已解锁
   */
  public isUnlocked(id: string): boolean {
    return this._states.get(id)?.unlocked ?? false;
  }

  /**
   * 销毁
   */
  public destroy(): void {
    eventBus.off(GameEvent.FLAG_SET);
    eventBus.off(GameEvent.COUNTER_R_CHANGE);
    eventBus.off(GameEvent.CARD_OBTAIN);
    eventBus.off(GameEvent.ENDING_REACH);
    this._notificationContainer?.destroy();
  }
}




