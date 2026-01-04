/**
 * 资源解析器
 * 根据当前模式返回正式资源或白盒占位
 * @module systems/whitebox/AssetResolver
 */

import Phaser from 'phaser';
import {
  CURRENT_ASSET_MODE,
  AssetMode,
  useProductionAsset,
  isWhiteboxMode,
} from '@/config/assetMode.config';
import {
  BillboardFactory,
  IBillboardConfig,
  ICharacterBillboardConfig,
  IZoneBillboardConfig,
} from './BillboardFactory';

// ==================== 类型定义 ====================

export interface IResolvedAsset {
  /** 解析后的游戏对象 */
  gameObject: Phaser.GameObjects.GameObject;
  /** 是否使用了白盒资源 */
  isWhitebox: boolean;
  /** 原始配置 */
  config: unknown;
}

// ==================== AssetResolver 类 ====================

/**
 * 资源解析器
 * 统一处理资源加载，自动选择白盒或正式资源
 */
class AssetResolver {
  private _billboardFactory: BillboardFactory | null = null;
  private _initialized: boolean = false;

  /**
   * 初始化（需要在Scene的create中调用）
   */
  init(scene: Phaser.Scene): void {
    if (CURRENT_ASSET_MODE.mode !== AssetMode.PRODUCTION) {
      this._billboardFactory = new BillboardFactory(scene);
    }
    this._initialized = true;
    console.log(`[AssetResolver] 初始化完成，当前模式: ${CURRENT_ASSET_MODE.mode}`);
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * 检查当前是否为白盒模式
   */
  isWhiteboxMode(): boolean {
    return isWhiteboxMode();
  }

  /**
   * 获取当前资源模式
   */
  getCurrentMode(): AssetMode {
    return CURRENT_ASSET_MODE.mode;
  }

  // ==================== 背景资源解析 ====================

  /**
   * 解析背景资源
   * @param scene Phaser场景
   * @param config Zone配置
   * @param productionKey 正式资源的纹理key
   */
  resolveBackground(
    scene: Phaser.Scene,
    config: IZoneBillboardConfig,
    productionKey: string
  ): IResolvedAsset {
    // 检查是否使用正式资源
    if (useProductionAsset('backgrounds') && scene.textures.exists(productionKey)) {
      const { width, height } = scene.scale;
      const image = scene.add.image(0, 0, productionKey).setOrigin(0).setDisplaySize(width, height);

      return {
        gameObject: image,
        isWhitebox: false,
        config,
      };
    }

    // 使用白盒背景
    if (!this._billboardFactory) {
      this._billboardFactory = new BillboardFactory(scene);
    }

    const container = this._billboardFactory.createBackground(config);
    return {
      gameObject: container,
      isWhitebox: true,
      config,
    };
  }

  // ==================== 角色资源解析 ====================

  /**
   * 解析角色资源
   * @param scene Phaser场景
   * @param config 角色配置
   * @param productionKey 正式资源的纹理key
   */
  resolveCharacter(
    scene: Phaser.Scene,
    config: ICharacterBillboardConfig,
    productionKey: string
  ): IResolvedAsset {
    if (useProductionAsset('characters') && scene.textures.exists(productionKey)) {
      const sprite = scene.add.sprite(0, 0, productionKey);
      return {
        gameObject: sprite,
        isWhitebox: false,
        config,
      };
    }

    if (!this._billboardFactory) {
      this._billboardFactory = new BillboardFactory(scene);
    }

    const container = this._billboardFactory.createCharacter(config);
    return {
      gameObject: container,
      isWhitebox: true,
      config,
    };
  }

  // ==================== 物件资源解析 ====================

  /**
   * 解析物件资源
   * @param scene Phaser场景
   * @param config 物件配置
   * @param productionKey 正式资源的纹理key
   */
  resolveObject(
    scene: Phaser.Scene,
    config: IBillboardConfig,
    productionKey: string
  ): IResolvedAsset {
    if (useProductionAsset('objects') && scene.textures.exists(productionKey)) {
      const image = scene.add.image(0, 0, productionKey);
      return {
        gameObject: image,
        isWhitebox: false,
        config,
      };
    }

    if (!this._billboardFactory) {
      this._billboardFactory = new BillboardFactory(scene);
    }

    const container = this._billboardFactory.createObject(config);
    return {
      gameObject: container,
      isWhitebox: true,
      config,
    };
  }

  // ==================== UI 资源解析 ====================

  /**
   * 解析对话框UI
   */
  resolveDialogueBox(scene: Phaser.Scene, x: number, y: number): IResolvedAsset {
    // UI 目前全部使用白盒或运行时绘制
    // 正式版UI会通过其他方式加载
    if (!this._billboardFactory) {
      this._billboardFactory = new BillboardFactory(scene);
    }

    const container = this._billboardFactory.createDialogueBox(x, y);
    return {
      gameObject: container,
      isWhitebox: true,
      config: { x, y, type: 'dialogueBox' },
    };
  }

  /**
   * 解析按钮UI
   */
  resolveButton(
    scene: Phaser.Scene,
    text: string,
    width?: number,
    height?: number,
    highlighted?: boolean
  ): IResolvedAsset {
    if (!this._billboardFactory) {
      this._billboardFactory = new BillboardFactory(scene);
    }

    const container = this._billboardFactory.createButton(text, width, height, highlighted);
    return {
      gameObject: container,
      isWhitebox: true,
      config: { text, width, height, highlighted, type: 'button' },
    };
  }

  /**
   * 解析卡片UI
   */
  resolveCard(scene: Phaser.Scene, width?: number, height?: number): IResolvedAsset {
    if (!this._billboardFactory) {
      this._billboardFactory = new BillboardFactory(scene);
    }

    const container = this._billboardFactory.createCard(width, height);
    return {
      gameObject: container,
      isWhitebox: true,
      config: { width, height, type: 'card' },
    };
  }

  /**
   * 解析面板UI
   */
  resolvePanel(scene: Phaser.Scene, width: number, height: number, title?: string): IResolvedAsset {
    if (!this._billboardFactory) {
      this._billboardFactory = new BillboardFactory(scene);
    }

    const container = this._billboardFactory.createPanel(width, height, title);
    return {
      gameObject: container,
      isWhitebox: true,
      config: { width, height, title, type: 'panel' },
    };
  }

  // ==================== 特效资源解析 ====================

  /**
   * 解析特效资源
   */
  resolveEffect(
    scene: Phaser.Scene,
    effectType: string,
    x: number,
    y: number,
    productionKey?: string
  ): IResolvedAsset {
    if (productionKey && useProductionAsset('effects') && scene.textures.exists(productionKey)) {
      const sprite = scene.add.sprite(x, y, productionKey);
      return {
        gameObject: sprite,
        isWhitebox: false,
        config: { effectType, x, y },
      };
    }

    if (!this._billboardFactory) {
      this._billboardFactory = new BillboardFactory(scene);
    }

    const container = this._billboardFactory.createEffect(effectType, x, y);
    return {
      gameObject: container,
      isWhitebox: true,
      config: { effectType, x, y },
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 获取Billboard工厂实例（供高级用法）
   */
  getBillboardFactory(scene: Phaser.Scene): BillboardFactory {
    if (!this._billboardFactory) {
      this._billboardFactory = new BillboardFactory(scene);
    }
    return this._billboardFactory;
  }

  /**
   * 重置解析器状态
   */
  reset(): void {
    this._billboardFactory = null;
    this._initialized = false;
  }

  /**
   * 获取调试信息
   */
  getDebugInfo(): Record<string, unknown> {
    return {
      mode: CURRENT_ASSET_MODE.mode,
      initialized: this._initialized,
      useProductionAssets: CURRENT_ASSET_MODE.useProductionAssets,
      billboardConfig: CURRENT_ASSET_MODE.billboard,
      debugConfig: CURRENT_ASSET_MODE.debug,
    };
  }
}

// 单例导出
export const assetResolver = new AssetResolver();
