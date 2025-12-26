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
import { assetResolver } from '@/systems/whitebox/AssetResolver';
import { CURRENT_ASSET_MODE, useProductionAsset, getObjectIcon } from '@/config/assetMode.config';
import type { IZoneBillboardConfig, IBillboardConfig } from '@/systems/whitebox/BillboardFactory';

// ==================== Zone类型映射 ====================

/** 根据Zone ID推断Zone类型 */
function inferZoneType(zoneId: string): string {
  // 根据章节和Zone推断类型
  const chapter = zoneId.split('-')[0];
  
  // 特定Zone类型映射
  const zoneTypeMap: Record<string, string> = {
    'C0-Z1': 'life',        // 宿舍走廊
    'C0-Z2': 'life',        // 早餐小店
    'C0-Z3': 'life',        // 薄墙巷口
    'C0-Z4': 'municipal',   // 维修局
    'C1-Z1': 'municipal',   // 市政厅
    'C1-Z2': 'municipal',   // 档案室
    'C1-Z3': 'archive',     // 档案巷
    'C2-Z1': 'municipal',   // 校准室
    'C2-Z3': 'clinic',      // 诊所
    'C2-Z5': 'temple',      // 祭坛
    'C2-Z7': 'edge',        // 边缘断口
    'C3-Z5': 'temple',      // 灯塔
    'C4-Z7': 'temple',      // 神话回响
    'C5-Z6': 'anomaly',     // 审计区
    'CF-Z1': 'anomaly',     // 冗余字段区
  };

  if (zoneTypeMap[zoneId]) {
    return zoneTypeMap[zoneId];
  }

  // 根据章节默认类型
  const chapterDefaults: Record<string, string> = {
    'C0': 'life',
    'C1': 'municipal',
    'C2': 'clinic',
    'C3': 'archive',
    'C4': 'anomaly',
    'C5': 'anomaly',
    'CF': 'anomaly',
    'RV': 'edge',
  };

  return chapterDefaults[chapter] || 'default';
}

// ==================== SceneAssembler 类 ====================

export class SceneAssembler {
  private readonly _scene: Phaser.Scene;
  private readonly _callbacks: ISceneAssemblerCallbacks;
  private _useWhitebox: boolean;

  constructor(scene: Phaser.Scene, callbacks: ISceneAssemblerCallbacks) {
    this._scene = scene;
    this._callbacks = callbacks;
    this._useWhitebox = !useProductionAsset('backgrounds') || !useProductionAsset('objects');
    
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
      const bg = this._scene.add.image(
        bgConfig.x ?? 0,
        bgConfig.y ?? 0,
        bgConfig.texture
      );
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
        const interactableObjects = config.objects.filter(obj => obj.interactive);
        zoneBillboardConfig.landmarks = interactableObjects.slice(0, 5).map(obj => ({
          x: obj.x,
          y: obj.y,
          label: obj.label || obj.id,
        }));
      }

      const resolved = assetResolver.resolveBackground(this._scene, zoneBillboardConfig, bgConfig.texture);
      created.push(resolved.gameObject);
    }

    return created;
  }

  // ==================== 物件创建 ====================

  private _createObject(obj: ISceneObjectConfig): Phaser.GameObjects.GameObject[] {
    const created: Phaser.GameObjects.GameObject[] = [];

    // 检查是否使用正式资源
    const useProduction = useProductionAsset('objects') && this._scene.textures.exists(obj.texture);

    if (useProduction) {
      // 使用正式资源
      const productionObjects = this._createProductionObject(obj);
      created.push(...productionObjects);
    } else {
      // 使用白盒Billboard
      const whiteboxObjects = this._createWhiteboxObject(obj);
      created.push(...whiteboxObjects);
    }

    return created;
  }

  /**
   * 创建正式资源物件
   */
  private _createProductionObject(obj: ISceneObjectConfig): Phaser.GameObjects.GameObject[] {
    const created: Phaser.GameObjects.GameObject[] = [];

    type DisplayObject = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    let display: DisplayObject;

    if (obj.type === 'sprite') {
      const sprite = this._scene.add.sprite(obj.x, obj.y, obj.texture, obj.frame ?? 0);
      display = sprite;

      // 动画
      if (obj.animation) {
        const animKey = obj.animation.key;
        if (!this._scene.anims.exists(animKey)) {
          const frames =
            obj.animation.frameNumbers
              ? this._scene.anims.generateFrameNumbers(obj.texture, { frames: obj.animation.frameNumbers })
              : this._scene.anims.generateFrameNumbers(obj.texture, {
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
      display = this._scene.add.image(obj.x, obj.y, obj.texture);
    }

    // 通用属性
    if (typeof obj.scale === 'number') display.setScale(obj.scale);
    display.setDepth(typeof obj.depth === 'number' ? obj.depth : obj.y);
    if (typeof obj.alpha === 'number') display.setAlpha(obj.alpha);
    if (typeof obj.rotation === 'number') display.setRotation(obj.rotation);
    if (obj.origin) display.setOrigin(obj.origin[0], obj.origin[1]);

    // 交互
    if (obj.interactive) {
      display.setInteractive({ useHandCursor: obj.interactive.cursor ?? true });
      if (obj.interactive.action && obj.interactive.action.type !== 'none') {
        display.on('pointerdown', () => {
          this._callbacks.onAction(obj.interactive!.action!, obj.id);
        });
      }
      if (obj.interactive.testid) {
        display.setData('testid', obj.interactive.testid);
      }
    }

    created.push(display);

    // label（可选）
    if (obj.label) {
      const dx = obj.labelOffset?.[0] ?? 0;
      const dy = obj.labelOffset?.[1] ?? 72;
      const label = this._scene.add
        .text(obj.x + dx, obj.y + dy, obj.label, { ...TEXT_STYLES.MUTED, fontSize: '14px' })
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
   */
  private _createWhiteboxObject(obj: ISceneObjectConfig): Phaser.GameObjects.GameObject[] {
    const created: Phaser.GameObjects.GameObject[] = [];

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
    const resolved = assetResolver.resolveObject(this._scene, billboardConfig, obj.texture);
    const container = resolved.gameObject as Phaser.GameObjects.Container;

    // 设置位置
    container.setPosition(obj.x, obj.y);

    // 设置深度
    container.setDepth(typeof obj.depth === 'number' ? obj.depth : obj.y);

    // 交互处理
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

      if (obj.interactive.cursor) {
        this._scene.input.setDefaultCursor('pointer');
        container.on('pointerover', () => {
          this._scene.input.setDefaultCursor('pointer');
        });
        container.on('pointerout', () => {
          this._scene.input.setDefaultCursor('default');
        });
      }

      if (obj.interactive.action && obj.interactive.action.type !== 'none') {
        container.on('pointerdown', () => {
          this._callbacks.onAction(obj.interactive!.action!, obj.id);
        });
      }

      if (obj.interactive.testid) {
        container.setData('testid', obj.interactive.testid);
      }

      // 存储action供外部访问
      if (obj.interactive.action) {
        container.setData('action', obj.interactive.action);
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
    const textureKey = obj.texture.toLowerCase();
    
    // 从纹理名称推断
    const subtypePatterns: Record<string, string[]> = {
      'bed': ['bed'],
      'desk': ['desk', 'table'],
      'lamp': ['lamp', 'light'],
      'plant': ['plant', 'tree'],
      'door': ['door', 'gate'],
      'bookshelf': ['bookshelf', 'shelf', 'book'],
      'monitor': ['monitor', 'screen', 'computer'],
      'filing_cabinet': ['filing', 'cabinet', 'drawer'],
      'altar': ['altar'],
      'crack': ['crack', 'rift'],
      'sign': ['sign', 'notice', 'board'],
      'chair': ['chair', 'seat'],
      'candle': ['candle'],
      'rune': ['rune', 'symbol'],
    };

    for (const [subtype, patterns] of Object.entries(subtypePatterns)) {
      if (patterns.some(p => textureKey.includes(p))) {
        return subtype;
      }
    }

    // 从label推断
    if (obj.label) {
      const label = obj.label.toLowerCase();
      for (const [subtype, patterns] of Object.entries(subtypePatterns)) {
        if (patterns.some(p => label.includes(p))) {
          return subtype;
        }
      }
    }

    return undefined;
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
