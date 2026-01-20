/**
 * 伏笔管理器
 * 管理伏笔的触发、加深、回收
 * @module systems/ui/ForeshadowManager
 */

import Phaser from 'phaser';
import { createLogger } from '@/utils/Logger';
import { eventBus, GameEvent } from '@/systems/EventBus';

const logger = createLogger('ForeshadowManager');
import { worldState } from '@/systems/world';
import { UI_FONT_SIZE } from '@/config/ui.config';
import type {
  IForeshadow as IForeshadowBase,
  IForeshadowStageConfig,
  ForeshadowStageLegacy,
} from '@/types';
import { normalizeForeshadowStage } from '@/types';

/**
 * 伏笔阶段枚举（统一命名）
 * - plant: 首次投放
 * - deepen: 加深
 * - mislead: 误读（可选）
 * - reveal: 回收/揭示
 */
export enum ForeshadowStage {
  /** 首次投放 */
  PLANT = 'plant',
  /** 加深 */
  DEEPEN = 'deepen',
  /** 误读（可选） */
  MISLEAD = 'mislead',
  /** 回收/揭示 */
  REVEAL = 'reveal',
}

/**
 * YAML 中的伏笔定义（兼容多种格式）
 */
interface IForeshadowYamlData {
  id: string;
  name: string;
  description?: string;
  stages: {
    plant?: IForeshadowStageConfig;
    deepen?: IForeshadowStageConfig;
    mislead?: IForeshadowStageConfig;
    /** @deprecated 使用 mislead */
    misread?: IForeshadowStageConfig;
    reveal?: IForeshadowStageConfig;
    /** @deprecated 使用 reveal */
    resolve?: IForeshadowStageConfig;
  };
}

/**
 * 运行时伏笔数据（扩展基础类型）
 */
interface IForeshadow extends IForeshadowBase {
  /** 当前阶段 */
  currentStage: ForeshadowStage;
  /** 是否已回收 */
  isCollected: boolean;
}

interface IForeshadowManagerConfig {
  scene: Phaser.Scene;
}

/**
 * 伏笔管理器
 * 追踪26+伏笔的状态
 */
export class ForeshadowManager {
  private _scene: Phaser.Scene;
  private _foreshadows: Map<string, IForeshadow> = new Map();
  private _notificationContainer!: Phaser.GameObjects.Container;
  private _isLoaded: boolean = false;

  constructor(config: IForeshadowManagerConfig) {
    this._scene = config.scene;
    this._createNotificationUI();
    this._setupEventListeners();
  }

  /**
   * 从 YAML 加载伏笔数据
   * 应在场景 create 阶段调用
   */
  public async loadFromYaml(): Promise<void> {
    if (this._isLoaded) {
      logger.warn('伏笔数据已加载，跳过重复加载');
      return;
    }

    try {
      // 从 Phaser 缓存获取已加载的 YAML 数据
      const yamlData = this._scene.cache.json.get('foreshadows');

      if (yamlData && yamlData.foreshadows) {
        this._initializeForeshadowsFromYaml(yamlData.foreshadows);
        this._isLoaded = true;
        logger.info(`成功加载 ${this._foreshadows.size} 个伏笔定义`);
      } else {
        logger.warn('未找到伏笔数据，使用空配置');
      }
    } catch (error) {
      logger.error('加载伏笔数据失败:', error);
    }
  }

  /**
   * 从 YAML 数据初始化伏笔（统一 Schema）
   */
  private _initializeForeshadowsFromYaml(
    foreshadowsData: Record<string, IForeshadowYamlData>
  ): void {
    Object.entries(foreshadowsData).forEach(([key, data]) => {
      // 跳过预留位（zone 为 TBD 的）
      const plantZone = data.stages.plant?.zone;
      if (plantZone === 'TBD') {
        logger.debug(`跳过预留伏笔: ${key}`);
        return;
      }

      // 统一阶段命名：misread -> mislead, resolve -> reveal
      const misleadStage = data.stages.mislead || data.stages.misread;
      const revealStage = data.stages.reveal || data.stages.resolve;

      this._foreshadows.set(data.id, {
        id: data.id,
        name: data.name,
        description: data.description || '',
        stages: {
          plant: data.stages.plant || { zone: '', description: '' },
          deepen: data.stages.deepen || { zone: '', description: '' },
          mislead: misleadStage,
          reveal: revealStage || { zone: '', description: '' },
        },
        currentStage: ForeshadowStage.PLANT,
        isCollected: false,
      });
    });
  }

  /**
   * 创建通知UI
   */
  private _createNotificationUI(): void {
    const { width } = this._scene.scale;

    this._notificationContainer = this._scene.add.container(width / 2, 150);
    this._notificationContainer.setDepth(900);
    this._notificationContainer.setAlpha(0);
  }

  /**
   * 设置事件监听
   */
  private _setupEventListeners(): void {
    eventBus.on(GameEvent.FORESHADOW_TRIGGERED, this._onForeshadowTriggered, this);
  }

  /**
   * 伏笔触发处理
   */
  private _onForeshadowTriggered(data: { foreshadowId: string; stage: string }): void {
    const { foreshadowId, stage } = data;
    this._handleForeshadowInternal(foreshadowId, stage);
  }

  /**
   * 内部伏笔处理逻辑
   */
  private _handleForeshadowInternal(foreshadowId: string, stage: string): void {
    const foreshadow = this._foreshadows.get(foreshadowId);

    if (!foreshadow) {
      logger.warn(`未知伏笔: ${foreshadowId}`);
      return;
    }

    // 统一阶段命名映射（兼容旧版 misread -> mislead, collect -> reveal）
    const normalizedStage = this._normalizeStage(stage);

    // 更新阶段
    const stageOrder = [
      ForeshadowStage.PLANT,
      ForeshadowStage.DEEPEN,
      ForeshadowStage.MISLEAD,
      ForeshadowStage.REVEAL,
    ];
    const currentIndex = stageOrder.indexOf(foreshadow.currentStage);
    const newIndex = stageOrder.indexOf(normalizedStage);

    if (newIndex > currentIndex) {
      foreshadow.currentStage = normalizedStage;

      if (normalizedStage === ForeshadowStage.REVEAL) {
        foreshadow.isCollected = true;
        this._showCollectNotification(foreshadow);
      } else {
        this._showProgressNotification(foreshadow, normalizedStage);
      }

      // 保存到世界状态
      worldState.setFlag(`FORESHADOW_${foreshadowId}_${normalizedStage.toUpperCase()}`, true);

      // 转发事件到 NarrativeEngine（桥接事件系统）
      this._scene.events.emit('foreshadow_triggered', {
        id: foreshadowId,
        stage: normalizedStage,
        foreshadow: {
          name: foreshadow.name,
          description: foreshadow.description,
        },
      });

      logger.info(`伏笔 ${foreshadowId} 进入阶段: ${normalizedStage}`);
    }
  }

  /**
   * 阶段名称标准化（兼容旧版命名）
   * 使用统一的 normalizeForeshadowStage 函数
   */
  private _normalizeStage(stage: string): ForeshadowStage {
    const normalized = normalizeForeshadowStage(stage as ForeshadowStageLegacy);
    switch (normalized) {
      case 'plant':
        return ForeshadowStage.PLANT;
      case 'deepen':
        return ForeshadowStage.DEEPEN;
      case 'mislead':
        return ForeshadowStage.MISLEAD;
      case 'reveal':
        return ForeshadowStage.REVEAL;
      default:
        logger.warn(`未知伏笔阶段: ${stage}，默认为 PLANT`);
        return ForeshadowStage.PLANT;
    }
  }

  /**
   * 显示进度通知
   */
  private _showProgressNotification(foreshadow: IForeshadow, stage: ForeshadowStage): void {
    this._notificationContainer.removeAll(true);

    // 背景
    const bg = this._scene.add.rectangle(0, 0, 400, 60, 0x2a2a4a, 0.95);
    bg.setStrokeStyle(2, 0x6666aa);
    this._notificationContainer.add(bg);

    // 图标
    const iconChar = stage === ForeshadowStage.DEEPEN ? '◇' : '◆';
    const icon = this._scene.add.text(-170, 0, iconChar, {
      fontFamily: 'monospace',
      fontSize: UI_FONT_SIZE.ICON,
      color: '#aaaaff',
    });
    icon.setOrigin(0.5);
    this._notificationContainer.add(icon);

    // 文本
    const stageLabels: Record<ForeshadowStage, string> = {
      [ForeshadowStage.PLANT]: '伏笔投放',
      [ForeshadowStage.DEEPEN]: '伏笔加深',
      [ForeshadowStage.MISLEAD]: '伏笔误读',
      [ForeshadowStage.REVEAL]: '伏笔回收',
    };
    const stageText = stageLabels[stage] || '伏笔进展';

    const text = this._scene.add.text(0, -10, stageText, {
      fontFamily: 'monospace',
      fontSize: UI_FONT_SIZE.TINY,
      color: '#aaaaff',
    });
    text.setOrigin(0.5);
    this._notificationContainer.add(text);

    const nameText = this._scene.add.text(0, 10, foreshadow.name, {
      fontFamily: 'monospace',
      fontSize: UI_FONT_SIZE.SMALL,
      color: '#ffffff',
    });
    nameText.setOrigin(0.5);
    this._notificationContainer.add(nameText);

    // 动画
    this._playNotificationAnimation();
  }

  /**
   * 显示回收通知
   */
  private _showCollectNotification(foreshadow: IForeshadow): void {
    this._notificationContainer.removeAll(true);

    // 背景（金色边框）
    const bg = this._scene.add.rectangle(0, 0, 400, 80, 0x2a2a2a, 0.95);
    bg.setStrokeStyle(3, 0xffaa44);
    this._notificationContainer.add(bg);

    // 图标
    const icon = this._scene.add.text(-170, 0, '★', {
      fontFamily: 'monospace',
      fontSize: UI_FONT_SIZE.SECTION,
      color: '#ffaa44',
    });
    icon.setOrigin(0.5);
    this._notificationContainer.add(icon);

    // 文本
    const text = this._scene.add.text(0, -15, '伏笔回收', {
      fontFamily: 'monospace',
      fontSize: UI_FONT_SIZE.TINY,
      color: '#ffaa44',
    });
    text.setOrigin(0.5);
    this._notificationContainer.add(text);

    const nameText = this._scene.add.text(0, 8, foreshadow.name, {
      fontFamily: 'monospace',
      fontSize: UI_FONT_SIZE.MEDIUM,
      color: '#ffffff',
    });
    nameText.setOrigin(0.5);
    this._notificationContainer.add(nameText);

    const descText = this._scene.add.text(0, 28, foreshadow.description || '', {
      fontFamily: 'monospace',
      fontSize: UI_FONT_SIZE.TINY,
      color: '#aaaaaa',
    });
    descText.setOrigin(0.5);
    this._notificationContainer.add(descText);

    // 动画（更长时间）
    this._playNotificationAnimation(4000);

    // 播放音效
    eventBus.emit(GameEvent.PLAY_SFX, { key: 'sfx_foreshadow_trigger' });
  }

  /**
   * 播放通知动画
   */
  private _playNotificationAnimation(duration: number = 2500): void {
    // 淡入
    this._scene.tweens.add({
      targets: this._notificationContainer,
      alpha: 1,
      y: 120,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // 延迟后淡出
    this._scene.time.delayedCall(duration, () => {
      this._scene.tweens.add({
        targets: this._notificationContainer,
        alpha: 0,
        y: 100,
        duration: 300,
        ease: 'Sine.easeIn',
      });
    });
  }

  /**
   * 触发伏笔
   * @param foreshadowId 伏笔ID
   * @param stage 阶段
   */
  public triggerForeshadow(foreshadowId: string, stage: ForeshadowStage): void {
    // 通过 EventBus 发送事件
    eventBus.emit(GameEvent.FORESHADOW_TRIGGERED, { foreshadowId, stage });
  }

  /**
   * 直接触发伏笔（不通过事件总线）
   * 同时通知 NarrativeEngine
   */
  public triggerForeshadowDirect(foreshadowId: string, stage: string): void {
    this._handleForeshadowInternal(foreshadowId, stage);
  }

  /**
   * 获取伏笔状态
   */
  public getForeshadow(foreshadowId: string): IForeshadow | undefined {
    return this._foreshadows.get(foreshadowId);
  }

  /**
   * 获取所有已回收的伏笔
   */
  public getCollectedForeshadows(): IForeshadow[] {
    return Array.from(this._foreshadows.values()).filter((f) => f.isCollected);
  }

  /**
   * 获取伏笔进度
   */
  public getProgress(): { collected: number; total: number } {
    const collected = this.getCollectedForeshadows().length;
    return { collected, total: this._foreshadows.size };
  }

  /**
   * 获取所有伏笔
   */
  public getAllForeshadows(): IForeshadow[] {
    return Array.from(this._foreshadows.values());
  }

  /**
   * 检查伏笔是否已加载
   */
  public isLoaded(): boolean {
    return this._isLoaded;
  }

  /**
   * 销毁
   */
  public destroy(): void {
    eventBus.off(GameEvent.FORESHADOW_TRIGGERED, this._onForeshadowTriggered, this);
    this._notificationContainer?.destroy();
  }
}
