/**
 * 场景组装器
 * 根据配置文件组装场景，支持白盒模式和正式资源模式
 * @module systems/scene/SceneAssembler
 */

import Phaser from 'phaser';
import type {
  IAssembledScene,
  ISceneAssemblerCallbacks,
  ISceneConfig,
  ISceneObjectConfig,
} from '@/types/scene';
import { TEXT_STYLES } from '@/config/game.config';
import { UI_FONT_SIZE } from '@/config/ui.config';
import { assetResolver } from '@/systems/whitebox/AssetResolver';
import { useProductionAsset } from '@/config/assetMode.config';
import { worldState } from '@/systems/world';
import { eventBus, GameEvent } from '@/systems/EventBus';
import type { IZoneBillboardConfig, IBillboardConfig } from '@/systems/whitebox/BillboardFactory';

// ==================== Zone类型映射 ====================

/** 根据Zone ID推断Zone类型 */
function inferZoneType(zoneId: string): string {
  // 根据章节和Zone推断类型
  const chapter = zoneId.split('-')[0];

  // 特定Zone类型映射
  const zoneTypeMap: Record<string, string> = {
    'C0-Z1': 'life', // 宿舍走廊
    'C0-Z2': 'life', // 早餐小店
    'C0-Z3': 'life', // 薄墙巷口
    'C0-Z4': 'municipal', // 维修局
    'C1-Z1': 'municipal', // 市政厅
    'C1-Z2': 'municipal', // 档案室
    'C1-Z3': 'archive', // 档案巷
    'C2-Z1': 'municipal', // 校准室
    'C2-Z3': 'clinic', // 诊所
    'C2-Z5': 'temple', // 祭坛
    'C2-Z7': 'edge', // 边缘断口
    'C3-Z5': 'temple', // 灯塔
    'C4-Z7': 'temple', // 神话回响
    'C5-Z6': 'anomaly', // 审计区
    'CF-Z1': 'anomaly', // 冗余字段区
  };

  if (zoneTypeMap[zoneId]) {
    return zoneTypeMap[zoneId];
  }

  // 根据章节默认类型
  const chapterDefaults: Record<string, string> = {
    C0: 'life',
    C1: 'municipal',
    C2: 'clinic',
    C3: 'archive',
    C4: 'anomaly',
    C5: 'anomaly',
    CF: 'anomaly',
    RV: 'edge',
  };

  return chapterDefaults[chapter] || 'default';
}

// ==================== SceneAssembler 类 ====================

export class SceneAssembler {
  private readonly _scene: Phaser.Scene;
  // 保留 callbacks 以便将来扩展，当前交互统一通过 InteractionPrompt 触发
  private readonly _callbacks: ISceneAssemblerCallbacks;

  constructor(scene: Phaser.Scene, callbacks: ISceneAssemblerCallbacks) {
    this._scene = scene;
    this._callbacks = callbacks;
    // 确保 callbacks 被"使用"以避免 TS 警告
    void this._callbacks;

    // 初始化资源解析器
    if (!assetResolver.isInitialized()) {
      assetResolver.init(scene);
    }
  }

  /**
   * 构建场景
   */
  build(config: ISceneConfig): IAssembledScene {
    const created: Phaser.GameObjects.GameObject[] = [];

    // 背景
    if (config.background) {
      const bgObjects = this._createBackground(config);
      created.push(...bgObjects);
    }

    // 物件
    for (const obj of config.objects) {
      const go = this._createObject(obj);
      created.push(...go);
    }

    return { objects: created };
  }

  /**
   * 销毁场景
   */
  destroy(assembled: IAssembledScene | null | undefined): void {
    if (!assembled) return;
    for (const obj of assembled.objects) {
      obj.destroy();
    }
  }

  // ==================== 背景创建 ====================

  private _createBackground(config: ISceneConfig): Phaser.GameObjects.GameObject[] {
    const created: Phaser.GameObjects.GameObject[] = [];
    const bgConfig = config.background!;

    // 尝试使用正式资源
    if (useProductionAsset('backgrounds') && this._scene.textures.exists(bgConfig.texture)) {
      const bg = this._scene.add.image(bgConfig.x ?? 0, bgConfig.y ?? 0, bgConfig.texture);
      bg.setOrigin(bgConfig.origin?.[0] ?? 0, bgConfig.origin?.[1] ?? 0);
      if (bgConfig.displaySize) {
        bg.setDisplaySize(bgConfig.displaySize[0], bgConfig.displaySize[1]);
      }
      if (typeof bgConfig.alpha === 'number') bg.setAlpha(bgConfig.alpha);
      created.push(bg);
    } else {
      // 使用白盒背景
      const zoneType = inferZoneType(config.id);
      const zoneBillboardConfig: IZoneBillboardConfig = {
        zoneId: config.id,
        zoneName: config.title || config.id,
        zoneType,
        chapter: config.id.split('-')[0],
        landmarks: [], // 可以从config中提取关键交互点作为地标
      };

      // 提取地标点（从objects中找关键交互物件）
      if (config.objects) {
        const interactableObjects = config.objects.filter((obj) => obj.interactive);
        zoneBillboardConfig.landmarks = interactableObjects.slice(0, 5).map((obj) => ({
          x: obj.x,
          y: obj.y,
          label: obj.label || obj.id,
        }));
      }

      const resolved = assetResolver.resolveBackground(
        this._scene,
        zoneBillboardConfig,
        bgConfig.texture
      );
      created.push(resolved.gameObject);
    }

    return created;
  }

  // ==================== 物件创建 ====================

  private _createObject(obj: ISceneObjectConfig): Phaser.GameObjects.GameObject[] {
    const created: Phaser.GameObjects.GameObject[] = [];

    // 检查一次性物品是否已被捡取（card 类型交互）
    if (obj.interactive?.action?.type === 'card' && obj.interactive.action.cardId) {
      const cardId = obj.interactive.action.cardId;
      // 检查 FLAG（物品是否已被捡取）
      if (worldState.getFlag(`ITEM_TAKEN_${cardId}`)) {
        // 物品已被捡取，不创建可交互对象（或创建但禁用）
        return created;
      }
    }

    // zone 类型是出口/区域交互点，需要特殊处理
    if (obj.type === 'zone') {
      const zoneObjects = this._createZoneObject(obj);
      created.push(...zoneObjects);
      return created;
    }

    // 非 zone 类型必须有 texture
    if (!obj.texture) {
      return created;
    }

    // 检查是否使用正式资源
    const useProduction = useProductionAsset('objects') && this._scene.textures.exists(obj.texture);

    const createdObjects = useProduction
      ? this._createProductionObject(obj)
      : this._createWhiteboxObject(obj);
    created.push(...createdObjects);

    // 条件检查：所有对象类型都支持（image/sprite/zone）
    // - image/sprite：条件不满足时直接隐藏
    // - zone：由 _createZoneObject 处理为“变暗+禁用交互”
    this._installConditionWatcher(obj, {
      style: 'hide',
      visualTargets: createdObjects,
      interactiveTarget: obj.interactive ? createdObjects[0] : undefined,
      enableInteractive: () => {
        if (!obj.interactive) return;
        const target = createdObjects[0] as Phaser.GameObjects.GameObject | undefined;
        if (!target) return;
        if (useProduction) {
          // 正式资源：Image/Sprite 直接用 useHandCursor
          (target as Phaser.GameObjects.Image | Phaser.GameObjects.Sprite).setInteractive({
            useHandCursor: obj.interactive.cursor ?? true,
          });
        } else {
          // 白盒：Container 使用估算尺寸的矩形 hit area
          const { width, height } = this._estimateObjectSize(obj);
          (target as Phaser.GameObjects.Container).setInteractive(
            new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
            Phaser.Geom.Rectangle.Contains
          );
        }
      },
      disableInteractive: () => {
        const target = createdObjects[0] as Phaser.GameObjects.GameObject | undefined;
        if (!target) return;
        (target as unknown as { disableInteractive?: () => void }).disableInteractive?.();
      },
    });

    return created;
  }

  /**
   * 创建正式资源物件
   * 注意：调用此方法前必须确保 obj.texture 存在
   */
  private _createProductionObject(obj: ISceneObjectConfig): Phaser.GameObjects.GameObject[] {
    const created: Phaser.GameObjects.GameObject[] = [];
    const texture = obj.texture!; // 已在 _createObject 中验证

    type DisplayObject = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    let display: DisplayObject;

    if (obj.type === 'sprite') {
      const sprite = this._scene.add.sprite(obj.x, obj.y, texture, obj.frame ?? 0);
      display = sprite;

      // 动画
      if (obj.animation) {
        const animKey = obj.animation.key;
        if (!this._scene.anims.exists(animKey)) {
          const frames = obj.animation.frameNumbers
            ? this._scene.anims.generateFrameNumbers(texture, {
                frames: obj.animation.frameNumbers,
              })
            : this._scene.anims.generateFrameNumbers(texture, {
                start: obj.animation.frames?.start ?? 0,
                end: obj.animation.frames?.end ?? 0,
              });
          this._scene.anims.create({
            key: animKey,
            frames,
            frameRate: obj.animation.frameRate ?? 6,
            repeat: obj.animation.repeat ?? -1,
          });
        }
        sprite.play(animKey);
      }
    } else {
      display = this._scene.add.image(obj.x, obj.y, texture);
    }

    // 通用属性
    if (typeof obj.scale === 'number') display.setScale(obj.scale);
    display.setDepth(typeof obj.depth === 'number' ? obj.depth : obj.y);
    if (typeof obj.alpha === 'number') display.setAlpha(obj.alpha);
    if (typeof obj.rotation === 'number') display.setRotation(obj.rotation);
    if (obj.origin) display.setOrigin(obj.origin[0], obj.origin[1]);

    // 交互数据存储（不再直接绑定点击事件，统一通过 InteractionPrompt 触发）
    if (obj.interactive) {
      // 保留 hover cursor 提示
      display.setInteractive({ useHandCursor: obj.interactive.cursor ?? true });
      // 存储 action 数据，供 InteractionPrompt 使用
      if (obj.interactive.action && obj.interactive.action.type !== 'none') {
        display.setData('action', obj.interactive.action);
      }
      if (obj.interactive.testid) {
        display.setData('testid', obj.interactive.testid);
      }
      // 存储标签
      if (obj.label) {
        display.setData('label', obj.label);
      }
    }

    created.push(display);

    // label（可选）
    if (obj.label) {
      const dx = obj.labelOffset?.[0] ?? 0;
      const dy = obj.labelOffset?.[1] ?? 72;
      const label = this._scene.add
        .text(obj.x + dx, obj.y + dy, obj.label, {
          ...TEXT_STYLES.MUTED,
          fontSize: UI_FONT_SIZE.TINY,
        })
        .setOrigin(0.5, 0.5);
      if (typeof obj.depth === 'number') {
        label.setDepth(obj.depth + 1);
      } else {
        label.setDepth(obj.y + 1);
      }
      created.push(label);
    }

    return created;
  }

  /**
   * 创建白盒Billboard物件
   * 注意：调用此方法前必须确保 obj.texture 存在
   */
  private _createWhiteboxObject(obj: ISceneObjectConfig): Phaser.GameObjects.GameObject[] {
    const created: Phaser.GameObjects.GameObject[] = [];
    const texture = obj.texture!; // 已在 _createObject 中验证

    // 推断物件类型
    const objectType = this._inferObjectType(obj);
    const objectSubtype = this._inferObjectSubtype(obj);

    // Billboard配置
    const billboardConfig: IBillboardConfig = {
      id: obj.id,
      name: obj.label || obj.id,
      type: objectType,
      subtype: objectSubtype,
      width: this._estimateObjectSize(obj).width,
      height: this._estimateObjectSize(obj).height,
      interactive: !!obj.interactive,
    };

    // 使用资源解析器创建Billboard
    const resolved = assetResolver.resolveObject(this._scene, billboardConfig, texture);
    const container = resolved.gameObject as Phaser.GameObjects.Container;

    // 设置位置
    container.setPosition(obj.x, obj.y);

    // 设置深度
    container.setDepth(typeof obj.depth === 'number' ? obj.depth : obj.y);

    // 交互数据存储（不再直接绑定点击事件，统一通过 InteractionPrompt 触发）
    if (obj.interactive) {
      container.setInteractive(
        new Phaser.Geom.Rectangle(
          -billboardConfig.width! / 2,
          -billboardConfig.height! / 2,
          billboardConfig.width!,
          billboardConfig.height!
        ),
        Phaser.Geom.Rectangle.Contains
      );

      // 保留 hover cursor 提示
      if (obj.interactive.cursor) {
        container.on('pointerover', () => {
          this._scene.input.setDefaultCursor('pointer');
        });
        container.on('pointerout', () => {
          this._scene.input.setDefaultCursor('default');
        });
      }

      // 存储 action 数据，供 InteractionPrompt 使用
      if (obj.interactive.action && obj.interactive.action.type !== 'none') {
        container.setData('action', obj.interactive.action);
      }

      if (obj.interactive.testid) {
        container.setData('testid', obj.interactive.testid);
      }

      // 存储标签
      if (obj.label) {
        container.setData('label', obj.label);
      }
    }

    container.setName(obj.id);
    created.push(container);

    return created;
  }

  /**
   * 推断物件主类型
   */
  private _inferObjectType(obj: ISceneObjectConfig): string {
    if (obj.interactive) {
      if (obj.interactive.action?.type === 'card') return 'item';
      if (obj.interactive.action?.type === 'dialogue') return 'npc_spot';
      if (obj.interactive.action?.type === 'gotoZone') return 'exit';
      return 'interactable';
    }
    return 'decoration';
  }

  /**
   * 推断物件子类型（用于选择图标）
   */
  private _inferObjectSubtype(obj: ISceneObjectConfig): string | undefined {
    const textureKey = (obj.texture ?? '').toLowerCase();

    // 从纹理名称推断
    const subtypePatterns: Record<string, string[]> = {
      bed: ['bed'],
      desk: ['desk', 'table'],
      lamp: ['lamp', 'light'],
      plant: ['plant', 'tree'],
      door: ['door', 'gate'],
      bookshelf: ['bookshelf', 'shelf', 'book'],
      monitor: ['monitor', 'screen', 'computer'],
      filing_cabinet: ['filing', 'cabinet', 'drawer'],
      altar: ['altar'],
      crack: ['crack', 'rift'],
      sign: ['sign', 'notice', 'board'],
      chair: ['chair', 'seat'],
      candle: ['candle'],
      rune: ['rune', 'symbol'],
    };

    for (const [subtype, patterns] of Object.entries(subtypePatterns)) {
      if (patterns.some((p) => textureKey.includes(p))) {
        return subtype;
      }
    }

    // 从label推断
    if (obj.label) {
      const label = obj.label.toLowerCase();
      for (const [subtype, patterns] of Object.entries(subtypePatterns)) {
        if (patterns.some((p) => label.includes(p))) {
          return subtype;
        }
      }
    }

    return undefined;
  }

  /**
   * 创建 Zone 类型物件（出口/区域交互点）
   * Zone 是不可见但可交互的区域，通常用于场景转换
   */
  private _createZoneObject(obj: ISceneObjectConfig): Phaser.GameObjects.GameObject[] {
    const created: Phaser.GameObjects.GameObject[] = [];

    // 获取尺寸（zone 必须有 width/height）
    const width = obj.width ?? 100;
    const height = obj.height ?? 100;

    // 创建容器
    const container = this._scene.add.container(obj.x, obj.y);
    container.setName(obj.id);

    // 可视化交互区域（白盒模式下显示，正式资源隐藏）
    const showVisual = !useProductionAsset('objects');

    if (showVisual) {
      // 背景矩形
      const bg = this._scene.add.graphics();
      bg.fillStyle(0x00ff88, 0.15);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
      bg.lineStyle(2, 0x00ff88, 0.4);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
      container.add(bg);

      // 标签文字
      if (obj.label) {
        const label = this._scene.add
          .text(0, 0, obj.label, {
            ...TEXT_STYLES.MUTED,
            fontSize: UI_FONT_SIZE.TINY,
            color: '#00FF88',
          })
          .setOrigin(0.5);
        container.add(label);
      }
    }

    // 设置深度
    container.setDepth(typeof obj.depth === 'number' ? obj.depth : 5);

    // 设置交互
    if (obj.interactive) {
      container.setInteractive(
        new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
      );

      // Hover 效果
      if (obj.interactive.cursor) {
        container.on('pointerover', () => {
          this._scene.input.setDefaultCursor('pointer');
        });
        container.on('pointerout', () => {
          this._scene.input.setDefaultCursor('default');
        });
      }

      // 存储 action 数据
      if (obj.interactive.action && obj.interactive.action.type !== 'none') {
        container.setData('action', obj.interactive.action);
      }

      if (obj.interactive.testid) {
        container.setData('testid', obj.interactive.testid);
      }

      if (obj.label) {
        container.setData('label', obj.label);
      }
    }

    // 条件检查：zone 类型用“变暗+禁用交互”的方式表达锁定状态
    this._installConditionWatcher(obj, {
      style: 'zoneDim',
      visualTargets: [container],
      interactiveTarget: obj.interactive ? container : undefined,
      enableInteractive: () => {
        container.setInteractive(
          new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
          Phaser.Geom.Rectangle.Contains
        );
      },
      disableInteractive: () => container.disableInteractive(),
    });

    created.push(container);
    return created;
  }

  private _mapAbilityActiveToFlag(abilityActive?: string): string | undefined {
    if (!abilityActive) return undefined;
    // abilityActive 暂时通过 flag 实现（兼容历史数据）
    switch (abilityActive) {
      case 'depthPerception':
        return 'FLAG_DEPTH_SENSE_ACTIVE';
      case 'depthIntervention':
        return 'FLAG_DEPTH_INTERVENTION_ACTIVE';
      case 'timeIntervention':
        return 'FLAG_TIME_INTERVENTION_ACTIVE';
      default:
        return undefined;
    }
  }

  private _getConditionRequiredTrueFlag(
    condition: ISceneObjectConfig['condition']
  ): string | undefined {
    if (!condition) return undefined;
    return condition.flagTrue ?? condition.flag ?? this._mapAbilityActiveToFlag(condition.abilityActive);
  }

  private _installConditionWatcher(
    obj: ISceneObjectConfig,
    options: {
      style: 'hide' | 'zoneDim';
      visualTargets: Phaser.GameObjects.GameObject[];
      interactiveTarget?: Phaser.GameObjects.GameObject;
      enableInteractive?: () => void;
      disableInteractive?: () => void;
    }
  ): void {
    const condition = obj.condition;
    if (!condition) return;

    const requiredTrueFlag = this._getConditionRequiredTrueFlag(condition);
    const requiredFalseFlag = condition.flagFalse;
    if (!requiredTrueFlag && !requiredFalseFlag) return;

    const configuredAlpha = typeof obj.alpha === 'number' ? obj.alpha : 1;
    // 对于带 condition 的对象，alpha=0 通常表示“暂时隐藏等待条件”
    const enabledAlpha = configuredAlpha === 0 ? 1 : configuredAlpha;

    const checkSatisfied = (): boolean => {
      if (requiredTrueFlag && !worldState.getFlag(requiredTrueFlag)) return false;
      if (requiredFalseFlag && worldState.getFlag(requiredFalseFlag)) return false;
      return true;
    };

    const apply = (satisfied: boolean): void => {
      if (options.style === 'hide') {
        for (const target of options.visualTargets) {
          (target as unknown as { setVisible?: (v: boolean) => void }).setVisible?.(satisfied);
          if (satisfied) {
            (target as unknown as { setAlpha?: (v: number) => void }).setAlpha?.(enabledAlpha);
          }
        }
      } else {
        // zoneDim：保持可见，但用 alpha 表达锁定状态
        for (const target of options.visualTargets) {
          (target as unknown as { setVisible?: (v: boolean) => void }).setVisible?.(true);
          (target as unknown as { setAlpha?: (v: number) => void }).setAlpha?.(
            satisfied ? enabledAlpha : 0.3
          );
        }
      }

      if (options.interactiveTarget) {
        if (satisfied) {
          options.enableInteractive?.();
        } else {
          options.disableInteractive?.();
        }
      }
    };

    let last = checkSatisfied();
    apply(last);

    // 检查对象是否仍然存活
    const isAlive = (): boolean => {
      return options.visualTargets.some((t) => {
        const asAny = t as unknown as { scene?: unknown; active?: boolean };
        return !!asAny.scene && asAny.active !== false;
      });
    };

    // 使用事件监听立即响应 flag 变化（不再依赖轮询延迟）
    const relevantFlags = [requiredTrueFlag, requiredFalseFlag].filter(Boolean) as string[];
    
    const onFlagSet = (data: { flagName: string; value: boolean }): void => {
      // 检查是否是相关的 flag
      if (!relevantFlags.includes(data.flagName)) return;
      
      // 检查对象是否还存活
      if (!isAlive()) {
        // 移除监听器
        eventBus.off(GameEvent.FLAG_SET, onFlagSet);
        return;
      }

      const now = checkSatisfied();
      if (now !== last) {
        last = now;
        apply(now);
      }
    };

    // 注册 FLAG_SET 事件监听
    eventBus.on(GameEvent.FLAG_SET, onFlagSet);

    // 保留轮询作为后备（主要用于清理监听器）
    const timer = this._scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        // 对象被销毁后停止轮询和事件监听
        if (!isAlive()) {
          timer.destroy();
          eventBus.off(GameEvent.FLAG_SET, onFlagSet);
          return;
        }

        // 后备检查
        const now = checkSatisfied();
        if (now !== last) {
          last = now;
          apply(now);
        }
      },
    });
  }

  /**
   * 估算物件尺寸
   */
  private _estimateObjectSize(obj: ISceneObjectConfig): { width: number; height: number } {
    // 基础尺寸
    let width = 50;
    let height = 50;

    // 根据scale调整
    if (typeof obj.scale === 'number') {
      width *= obj.scale;
      height *= obj.scale;
    }

    // 根据类型调整
    if (obj.interactive) {
      if (obj.interactive.action?.type === 'card') {
        width = 60;
        height = 60;
      } else if (obj.interactive.action?.type === 'dialogue') {
        width = 70;
        height = 70;
      }
    }

    return { width, height };
  }
}
