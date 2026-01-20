/**
 * 资源模式配置
 * 控制使用白盒占位资源还是正式资源
 * @module config/assetMode.config
 */

// ==================== 枚举定义 ====================

export enum AssetMode {
  /** 白盒模式 - 使用占位资源 */
  WHITEBOX = 'whitebox',
  /** 混合模式 - 部分使用正式资源 */
  HYBRID = 'hybrid',
  /** 正式模式 - 全部使用正式资源 */
  PRODUCTION = 'production',
}

// ==================== 类型定义 ====================

export interface IAssetModeConfig {
  /** 当前模式 */
  mode: AssetMode;

  /** 各类资源是否使用正式版 */
  useProductionAssets: {
    backgrounds: boolean;
    characters: boolean;
    objects: boolean;
    ui: boolean;
    effects: boolean;
    audio: boolean;
  };

  /** Billboard 配置 */
  billboard: {
    /** 是否显示类型标签 */
    showTypeLabel: boolean;
    /** 是否显示边界框 */
    showBoundingBox: boolean;
    /** 字体大小 */
    fontSize: number;
    /** 背景透明度 */
    bgAlpha: number;
  };

  /** 调试选项 */
  debug: {
    /** 显示碰撞框 */
    showHitboxes: boolean;
    /** 显示交互区域 */
    showInteractZones: boolean;
    /** 显示网格 */
    showGrid: boolean;
    /** 显示Zone边界 */
    showZoneBounds: boolean;
  };
}

// ==================== 颜色常量 ====================

/** 角色标识色 */
export const CHARACTER_BILLBOARD_COLORS: Record<string, number> = {
  cenhui: 0x00ffaa, // 主角 - 标志绿
  gulin: 0x4a9eff, // 顾临 - 冷静蓝
  songlan: 0xffd700, // 宋岚 - 档案金
  xucheng: 0x00ced1, // 许澄 - 医疗青
  atang: 0xff69b4, // 阿棠 - 漂移粉
  muping: 0x9370db, // 牧平 - 神秘紫
  qilan: 0x98fb98, // 栖蓝 - 温暖绿
  chenjiang: 0xffa500, // 陈匠 - 灯火橙
  system: 0x4a9eff, // 系统 - 蓝色
  unknown: 0x686868, // 未知 - 灰色
};

/** Zone类型背景色 */
export const ZONE_TYPE_COLORS: Record<string, { bg: number; border: number }> = {
  life: { bg: 0x2d2d33, border: 0x4a4a52 }, // 生活区 - 暖灰色
  municipal: { bg: 0x1e2836, border: 0x3a5070 }, // 市政区 - 冷蓝灰
  archive: { bg: 0x2d2818, border: 0x5a5030 }, // 档案区 - 暗黄色
  clinic: { bg: 0x1e2d2d, border: 0x305a5a }, // 诊所 - 青色
  temple: { bg: 0x2d2818, border: 0x5a5030 }, // 神殿 - 金色调
  edge: { bg: 0x2d1e1e, border: 0x5a3030 }, // 边缘区 - 暗红色
  anomaly: { bg: 0x251e2d, border: 0x4a3060 }, // 异常区 - 紫色
  default: { bg: 0x1e1e24, border: 0x3a3a40 }, // 默认 - 暗灰色
};

/** 物件类型图标 */
export const OBJECT_TYPE_ICONS: Record<string, string> = {
  // 交互类型
  interactable: '🔍',
  decoration: '📦',
  trigger: '⚡',
  blocker: '🚧',
  door: '🚪',
  exit: '🚶',

  // 物品类型
  item: '💎',
  card: '📄',
  save_point: '💾',
  npc_spot: '💬',

  // 场景物件
  bed: '🛏️',
  desk: '🪑',
  lamp: '💡',
  plant: '🌱',
  bookshelf: '📚',
  monitor: '🖥️',
  filing_cabinet: '🗄️',
  altar: '⛩️',
  crack: '💔',
  sign: '📋',
  chair: '🪑',
  candle: '🕯️',
  rune: '✨',

  // 默认
  unknown: '❓',
};

// ==================== 预设配置 ====================

/** 白盒配置 - 全部使用占位资源 */
export const WHITEBOX_CONFIG: IAssetModeConfig = {
  mode: AssetMode.WHITEBOX,
  useProductionAssets: {
    backgrounds: false,
    characters: false,
    objects: false,
    ui: false,
    effects: false,
    audio: false,
  },
  billboard: {
    showTypeLabel: true,
    showBoundingBox: true,
    fontSize: 14,
    bgAlpha: 0.8,
  },
  debug: {
    showHitboxes: true,
    showInteractZones: true,
    showGrid: false,
    showZoneBounds: true,
  },
};

/** 混合配置 - 背景和音频使用正式资源 */
export const HYBRID_CONFIG: IAssetModeConfig = {
  mode: AssetMode.HYBRID,
  useProductionAssets: {
    backgrounds: true,
    characters: false,
    objects: false,
    ui: false,
    effects: false,
    audio: true,
  },
  billboard: {
    showTypeLabel: true,
    showBoundingBox: false,
    fontSize: 14,
    bgAlpha: 0.6,
  },
  debug: {
    showHitboxes: false,
    showInteractZones: true,
    showGrid: false,
    showZoneBounds: false,
  },
};

/** 正式配置 - 全部使用正式资源 */
export const PRODUCTION_CONFIG: IAssetModeConfig = {
  mode: AssetMode.PRODUCTION,
  useProductionAssets: {
    backgrounds: true,
    characters: true,
    objects: true,
    ui: true,
    effects: true,
    audio: true,
  },
  billboard: {
    showTypeLabel: false,
    showBoundingBox: false,
    fontSize: 14,
    bgAlpha: 0,
  },
  debug: {
    showHitboxes: false,
    showInteractZones: false,
    showGrid: false,
    showZoneBounds: false,
  },
};

// ==================== 当前配置 ====================

/**
 * 当前使用的资源模式配置
 *
 * 开发时修改这里来切换模式：
 * - WHITEBOX_CONFIG: 白盒开发模式
 * - HYBRID_CONFIG: 混合模式（逐步替换）
 * - PRODUCTION_CONFIG: 正式发布模式
 */
export const CURRENT_ASSET_MODE = WHITEBOX_CONFIG;

// ==================== 工具函数 ====================

/**
 * 检查当前是否为白盒模式
 */
export function isWhiteboxMode(): boolean {
  return CURRENT_ASSET_MODE.mode === AssetMode.WHITEBOX;
}

/**
 * 检查特定资源类型是否使用正式资源
 */
export function useProductionAsset(type: keyof IAssetModeConfig['useProductionAssets']): boolean {
  return CURRENT_ASSET_MODE.useProductionAssets[type];
}

/**
 * 获取角色标识色
 */
export function getCharacterColor(characterId: string): number {
  return CHARACTER_BILLBOARD_COLORS[characterId] ?? CHARACTER_BILLBOARD_COLORS.unknown;
}

/**
 * 获取Zone类型颜色
 */
export function getZoneTypeColors(zoneType: string): { bg: number; border: number } {
  return ZONE_TYPE_COLORS[zoneType] ?? ZONE_TYPE_COLORS.default;
}

/**
 * 获取物件图标
 */
export function getObjectIcon(type: string, subtype?: string): string {
  return OBJECT_TYPE_ICONS[subtype ?? ''] ?? OBJECT_TYPE_ICONS[type] ?? OBJECT_TYPE_ICONS.unknown;
}
