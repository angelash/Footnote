/**
 * 伏笔管理器
 * 管理伏笔的触发、加深、回收
 * @module systems/ui/ForeshadowManager
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { worldState } from '@/systems/world';

export enum ForeshadowStage {
  /** 首次投放 */
  PLANT = 'plant',
  /** 加深 */
  DEEPEN = 'deepen',
  /** 误读（可选） */
  MISREAD = 'misread',
  /** 回收 */
  COLLECT = 'collect',
}

interface IForeshadow {
  id: string;
  name: string;
  description: string;
  stages: {
    plant?: string;
    deepen?: string;
    misread?: string;
    collect?: string;
  };
  currentStage: ForeshadowStage;
  isCollected: boolean;
}

interface IForeshadowManagerConfig {
  scene: Phaser.Scene;
}

/**
 * 伏笔管理器
 * 追踪20+伏笔的状态
 */
export class ForeshadowManager {
  private _scene: Phaser.Scene;
  private _foreshadows: Map<string, IForeshadow> = new Map();
  private _notificationContainer!: Phaser.GameObjects.Container;

  // 核心伏笔定义
  private static readonly FORESHADOW_DEFINITIONS: Omit<IForeshadow, 'currentStage' | 'isCollected'>[] = [
    {
      id: 'F01',
      name: '岑回的例外性质',
      description: '为什么岑回能看到别人看不到的',
      stages: {
        plant: 'C0-Z3',
        deepen: 'C2-Z2',
        collect: 'CF-Z3',
      },
    },
    {
      id: 'F02',
      name: '顾临的真实立场',
      description: '他是敌是友',
      stages: {
        plant: 'C0-Z4',
        deepen: 'C3-Z1',
        misread: 'C4-Z2',
        collect: 'CF-Z6',
      },
    },
    {
      id: 'F03',
      name: '宋岚的记录使命',
      description: '她为什么要记录',
      stages: {
        plant: 'C1-Z2',
        deepen: 'C2-Z2',
        collect: 'CF-Z6',
      },
    },
    {
      id: 'F04',
      name: '阿棠的漂移原因',
      description: '她为什么对不上',
      stages: {
        plant: 'C1-Z3',
        deepen: 'RV-01',
        collect: 'RV-07',
      },
    },
    {
      id: 'F05',
      name: '牧平的预言来源',
      description: '他的话从哪来',
      stages: {
        plant: 'C2-Z4',
        deepen: 'RV-05',
        collect: 'RV-09',
      },
    },
    {
      id: 'F06',
      name: '陈匠的坚守原因',
      description: '对象不存在仍坚持',
      stages: {
        plant: 'C3-Z5',
        deepen: 'C4-Z5',
        collect: 'RV-12',
      },
    },
    {
      id: 'F08',
      name: '栖蓝的存在价值',
      description: '多余者的意义',
      stages: {
        plant: 'C2-Z3',
        deepen: 'RV-02',
        collect: 'CF-Z2',
      },
    },
    {
      id: 'F15',
      name: '祷文首字链',
      description: '四张祷文的秘密',
      stages: {
        plant: 'C2-Z4',
        deepen: 'C3-Z4',
        collect: 'CF-Z6',
      },
    },
    {
      id: 'F21',
      name: '无意义判词',
      description: '此行为在当前模型中无意义',
      stages: {
        plant: 'C5-Z1',
        deepen: 'C5-Z5',
        collect: 'C5-Z7',
      },
    },
    {
      id: 'F22',
      name: '冗余信息不可关闭',
      description: '底部字段条',
      stages: {
        plant: 'CF-Z1',
        deepen: 'CF-Z2',
        collect: 'CF-Z3',
      },
    },
    {
      id: 'F23',
      name: '非最优被保存',
      description: '世界承认多余',
      stages: {
        plant: 'C5-Z5',
        deepen: 'CF-Z2',
        collect: 'CF-Z4',
      },
    },
  ];

  constructor(config: IForeshadowManagerConfig) {
    this._scene = config.scene;
    this._initializeForeshadows();
    this._createNotificationUI();
    this._setupEventListeners();
  }

  /**
   * 初始化伏笔数据
   */
  private _initializeForeshadows(): void {
    ForeshadowManager.FORESHADOW_DEFINITIONS.forEach((def) => {
      this._foreshadows.set(def.id, {
        ...def,
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
    const foreshadow = this._foreshadows.get(foreshadowId);
    
    if (!foreshadow) {
      console.warn(`[ForeshadowManager] 未知伏笔: ${foreshadowId}`);
      return;
    }

    // 更新阶段
    const newStage = stage as ForeshadowStage;
    const stageOrder = [ForeshadowStage.PLANT, ForeshadowStage.DEEPEN, ForeshadowStage.MISREAD, ForeshadowStage.COLLECT];
    const currentIndex = stageOrder.indexOf(foreshadow.currentStage);
    const newIndex = stageOrder.indexOf(newStage);

    if (newIndex > currentIndex) {
      foreshadow.currentStage = newStage;
      
      if (newStage === ForeshadowStage.COLLECT) {
        foreshadow.isCollected = true;
        this._showCollectNotification(foreshadow);
      } else {
        this._showProgressNotification(foreshadow, newStage);
      }

      // 保存到世界状态
      worldState.setFlag(`FORESHADOW_${foreshadowId}_${newStage.toUpperCase()}`, true);
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
    const icon = this._scene.add.text(-170, 0, stage === ForeshadowStage.DEEPEN ? '◇' : '◆', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#aaaaff',
    });
    icon.setOrigin(0.5);
    this._notificationContainer.add(icon);

    // 文本
    const stageText = stage === ForeshadowStage.DEEPEN ? '伏笔加深' : '伏笔误读';
    const text = this._scene.add.text(0, -10, stageText, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaaaff',
    });
    text.setOrigin(0.5);
    this._notificationContainer.add(text);

    const nameText = this._scene.add.text(0, 10, foreshadow.name, {
      fontFamily: 'monospace',
      fontSize: '16px',
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
      fontSize: '28px',
      color: '#ffaa44',
    });
    icon.setOrigin(0.5);
    this._notificationContainer.add(icon);

    // 文本
    const text = this._scene.add.text(0, -15, '伏笔回收', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffaa44',
    });
    text.setOrigin(0.5);
    this._notificationContainer.add(text);

    const nameText = this._scene.add.text(0, 8, foreshadow.name, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    });
    nameText.setOrigin(0.5);
    this._notificationContainer.add(nameText);

    const descText = this._scene.add.text(0, 28, foreshadow.description, {
      fontFamily: 'monospace',
      fontSize: '14px',
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
   */
  public triggerForeshadow(foreshadowId: string, stage: ForeshadowStage): void {
    eventBus.emit(GameEvent.FORESHADOW_TRIGGERED, { foreshadowId, stage });
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
   * 销毁
   */
  public destroy(): void {
    eventBus.off(GameEvent.FORESHADOW_TRIGGERED, this._onForeshadowTriggered, this);
    this._notificationContainer?.destroy();
  }
}




