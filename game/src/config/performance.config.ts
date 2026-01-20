/**
 * 性能配置常量
 * 定义性能指标基线和门禁阈值
 * @module config/performance.config
 */

// ==================== 性能阈值定义 ====================

/**
 * 核心性能指标阈值
 * 对应 QA Bible 和 performance_spec.md 的发布门禁
 */
export const PERFORMANCE_THRESHOLDS = {
  /** First Contentful Paint 目标（毫秒）- 首屏渲染 */
  FCP_MS: 1500,

  /** Time to Interactive 目标（毫秒）- 可交互时间 */
  TTI_MS: 3000,

  /** 首屏加载目标（毫秒）- QA Bible 门禁 <3s（4G 网络） */
  FIRST_SCREEN_MS: 3000,

  /** 首屏加载红线（毫秒）- 超过此值强制告警 */
  FIRST_SCREEN_REDLINE_MS: 8000,

  /** 目标帧率 */
  FPS_TARGET: 60,

  /** 最低帧率 - QA Bible 门禁 ≥60fps */
  FPS_MIN: 55,

  /** 低端设备最低帧率 */
  FPS_MIN_LOW_END: 30,

  /** 帧率红线 - 低于此值需降级 */
  FPS_REDLINE: 24,

  /** 最大内存占用（MB）- QA Bible 门禁 <100MB */
  MEMORY_MB_MAX: 100,

  /** 内存红线（MB）- 超过此值需告警 */
  MEMORY_MB_REDLINE: 200,

  /** 章节切换最大耗时（毫秒） */
  CHAPTER_SWITCH_MS: 2000,

  /** Zone 切换最大耗时（毫秒） */
  ZONE_SWITCH_MS: 1000,

  /** 场景切换最大耗时（毫秒）- 综合门禁 */
  SCENE_SWITCH_MS: 500,

  /** 场景切换红线（毫秒） */
  SCENE_SWITCH_REDLINE_MS: 5000,

  /** 交互响应目标（毫秒） */
  INTERACTION_RESPONSE_MS: 100,

  /** 交互响应红线（毫秒） */
  INTERACTION_RESPONSE_REDLINE_MS: 300,

  /** 包体大小上限（KB）- QA Bible 门禁 <10MB */
  BUNDLE_SIZE_KB: 10240,

  /** 包体大小红线（KB） */
  BUNDLE_SIZE_REDLINE_KB: 15360,
} as const;

// ==================== 设备分级阈值 ====================

/**
 * 设备性能分级
 */
export enum DevicePerformanceTier {
  /** 高端设备 - 60fps，无限制 */
  HIGH = 'high',
  /** 中端设备 - 45fps，部分效果降级 */
  MEDIUM = 'medium',
  /** 低端设备 - 30fps，大量效果降级 */
  LOW = 'low',
}

/**
 * 设备分级阈值
 */
export const DEVICE_TIER_THRESHOLDS = {
  /** 高端设备 FPS 目标 */
  [DevicePerformanceTier.HIGH]: {
    fpsTarget: 60,
    fpsMin: 55,
    memoryLimit: 200,
    enableEffects: true,
    enableAntialias: true,
    textureQuality: 1.0,
  },
  /** 中端设备 FPS 目标 */
  [DevicePerformanceTier.MEDIUM]: {
    fpsTarget: 45,
    fpsMin: 40,
    memoryLimit: 100,
    enableEffects: true,
    enableAntialias: false,
    textureQuality: 0.75,
  },
  /** 低端设备 FPS 目标 */
  [DevicePerformanceTier.LOW]: {
    fpsTarget: 30,
    fpsMin: 24,
    memoryLimit: 64,
    enableEffects: false,
    enableAntialias: false,
    textureQuality: 0.5,
  },
} as const;

// ==================== 加载策略配置 ====================

/**
 * 资源加载优先级
 */
export enum LoadPriority {
  /** 核心 - 启动必需，阻塞加载 */
  CRITICAL = 0,
  /** 高 - 首场景必需，优先加载 */
  HIGH = 1,
  /** 中 - 当前章节需要，按需加载 */
  MEDIUM = 2,
  /** 低 - 其他章节，空闲预加载 */
  LOW = 3,
}

/**
 * 分级加载配置
 */
export const LOAD_STRATEGY = {
  /** 核心资源 - 启动时必须加载 */
  CRITICAL_ASSETS: {
    images: [
      'placeholder_bg',
      'placeholder_char',
      'placeholder_button',
    ],
    audio: [],
    data: [],
  },

  /** 首屏资源 - 菜单场景必需 */
  FIRST_SCREEN_ASSETS: {
    images: [
      'px_bg_placeholder',
    ],
    audio: [
      'bgm_title',
    ],
    data: [],
  },

  /** 首章资源 - C0 必需 */
  FIRST_CHAPTER_ASSETS: {
    dialogues: ['c0_z1', 'c0_z2'],
    cards: ['c0_cards'],
  },

  /** 空闲预加载超时（毫秒） */
  IDLE_PRELOAD_TIMEOUT_MS: 5000,

  /** 批量加载大小 */
  BATCH_SIZE: 10,

  /** 加载超时（毫秒） */
  LOAD_TIMEOUT_MS: 30000,
} as const;

// ==================== 监控配置 ====================

/**
 * 性能监控配置
 */
export const PERFORMANCE_MONITOR_CONFIG = {
  /** 更新间隔（毫秒） */
  UPDATE_INTERVAL_MS: 500,

  /** FPS 采样窗口大小 */
  FPS_SAMPLE_WINDOW: 60,

  /** 是否在生产环境启用 */
  ENABLE_IN_PRODUCTION: false,

  /** 性能数据采样间隔（毫秒）- 用于基线记录 */
  SAMPLE_INTERVAL_MS: 1000,

  /** 性能数据保留时长（秒） */
  SAMPLE_RETENTION_SECONDS: 60,

  /** 掉帧阈值（低于此帧率计为掉帧） */
  FRAME_DROP_THRESHOLD: 50,

  /** 严重掉帧阈值 */
  SEVERE_FRAME_DROP_THRESHOLD: 30,
} as const;

// ==================== 降级策略 ====================

/**
 * 性能降级配置
 */
export const PERFORMANCE_DEGRADATION = {
  /** FPS 连续低于阈值多少帧触发降级 */
  FPS_LOW_FRAME_COUNT: 60,

  /** 降级动作 */
  DEGRADATION_ACTIONS: {
    /** 第一级：关闭粒子效果 */
    LEVEL_1: {
      disableParticles: true,
      disableAnimations: false,
      reduceTextureQuality: false,
    },
    /** 第二级：关闭动画效果 */
    LEVEL_2: {
      disableParticles: true,
      disableAnimations: true,
      reduceTextureQuality: false,
    },
    /** 第三级：降低纹理质量 */
    LEVEL_3: {
      disableParticles: true,
      disableAnimations: true,
      reduceTextureQuality: true,
    },
  },
} as const;

// ==================== 导出汇总 ====================

/**
 * 统一性能配置导出
 */
export const PERFORMANCE = {
  THRESHOLDS: PERFORMANCE_THRESHOLDS,
  DEVICE_TIERS: DEVICE_TIER_THRESHOLDS,
  LOAD_STRATEGY,
  MONITOR: PERFORMANCE_MONITOR_CONFIG,
  DEGRADATION: PERFORMANCE_DEGRADATION,
} as const;

export default PERFORMANCE;
