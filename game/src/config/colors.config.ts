/**
 * 颜色配置
 * 统一管理所有 UI 颜色常量
 * @module config/colors.config
 */

// ==================== 基础颜色（Phaser 格式 0x...） ====================

export const COLORS = {
  // 背景色
  BG: {
    /** 主背景 - 深灰黑 */
    PRIMARY: 0x0a0a0f,
    /** 次背景 - 深灰 */
    SECONDARY: 0x141419,
    /** 第三背景 - 中灰 */
    TERTIARY: 0x1e1e24,
    /** 第四背景 - 浅灰 */
    QUATERNARY: 0x2a2a30,
    /** 面板背景 */
    PANEL: 0x1a1a2e,
    /** 卡片背景 */
    CARD: 0x1e1e24,
    /** 遮罩背景 */
    OVERLAY: 0x000000,
  },

  // 文字色
  TEXT: {
    /** 主文字 - 米白 */
    PRIMARY: 0xe8e6e3,
    /** 次文字 - 浅灰 */
    SECONDARY: 0xa8a6a3,
    /** 弱化文字 - 中灰 */
    MUTED: 0x888888,
    /** 禁用文字 - 深灰 */
    DISABLED: 0x666666,
    /** 暗文字 */
    DARK: 0x4a4a4a,
  },

  // 强调色
  ACCENT: {
    /** 主强调 - 青绿 */
    PRIMARY: 0x00ffaa,
    /** 深度感知 - 青绿 */
    DEPTH: 0x00ffaa,
    /** 深度介入 - 紫色 */
    INTERVENTION: 0xff00ff,
    /** 时间干预 - 红色 */
    TIME: 0xff4444,
    /** 系统 - 蓝色 */
    SYSTEM: 0x4a9eff,
    /** 字段/金色 */
    FIELD: 0xffd700,
    /** 次要强调 */
    SECONDARY: 0x00cc99,
  },

  // 功能色
  FUNCTIONAL: {
    /** 成功 - 绿色 */
    SUCCESS: 0x00cc66,
    /** 警告 - 橙色 */
    WARNING: 0xffaa00,
    /** 错误 - 红色 */
    ERROR: 0xff3333,
    /** 信息 - 蓝色 */
    INFO: 0x3399ff,
  },

  // 边框色
  BORDER: {
    /** 默认边框 */
    DEFAULT: 0x3a3a40,
    /** 高亮边框 */
    HIGHLIGHT: 0x4a9eff,
    /** 选中边框 */
    SELECTED: 0x00ffaa,
    /** 错误边框 */
    ERROR: 0xff4444,
  },

  // 特效色
  EFFECT: {
    /** 深度感知特效 - 深蓝 */
    DEPTH_PRIMARY: 0x0066aa,
    /** 深度感知特效 - 亮青 */
    DEPTH_SECONDARY: 0x00ffff,
    /** 深度介入特效 - 深紫 */
    INTERVENTION_PRIMARY: 0x6600aa,
    /** 深度介入特效 - 亮紫 */
    INTERVENTION_SECONDARY: 0xff00ff,
    /** 时间干预特效 */
    TIME_PRIMARY: 0xaa0000,
    /** 时间干预特效 */
    TIME_SECONDARY: 0xff4444,
    /** 故障效果 */
    GLITCH: 0xff0066,
  },
} as const;

// ==================== CSS 颜色（#... 格式） ====================

export const COLORS_CSS = {
  // 背景色
  BG: {
    PRIMARY: '#0A0A0F',
    SECONDARY: '#141419',
    TERTIARY: '#1E1E24',
    QUATERNARY: '#2A2A30',
    PANEL: '#1A1A2E',
    CARD: '#1E1E24',
    OVERLAY: '#000000',
  },

  // 文字色
  TEXT: {
    PRIMARY: '#E8E6E3',
    SECONDARY: '#A8A6A3',
    MUTED: '#888888',
    DISABLED: '#666666',
    DARK: '#4A4A4A',
  },

  // 强调色
  ACCENT: {
    PRIMARY: '#00FFAA',
    DEPTH: '#00FFAA',
    INTERVENTION: '#FF00FF',
    TIME: '#FF4444',
    SYSTEM: '#4A9EFF',
    FIELD: '#FFD700',
    SECONDARY: '#00CC99',
  },

  // 功能色
  FUNCTIONAL: {
    SUCCESS: '#00CC66',
    WARNING: '#FFAA00',
    ERROR: '#FF3333',
    INFO: '#3399FF',
  },

  // 边框色
  BORDER: {
    DEFAULT: '#3A3A40',
    HIGHLIGHT: '#4A9EFF',
    SELECTED: '#00FFAA',
    ERROR: '#FF4444',
  },
} as const;

// ==================== 模块专用颜色 ====================

/** 伏笔系统颜色 */
export const FORESHADOW_COLORS = {
  /** 普通通知背景 */
  NORMAL_BG: 0x2a2a4a,
  /** 普通通知边框 */
  NORMAL_BORDER: 0x6666aa,
  /** 普通通知文字 */
  NORMAL_TEXT: '#AAAAFF',
  /** 误读通知背景 */
  MISREAD_BG: 0x3a2a3a,
  /** 误读通知边框 */
  MISREAD_BORDER: 0xaa66aa,
  /** 误读通知文字 */
  MISREAD_TEXT: '#AA66AA',
  /** 回收通知背景 */
  RECALL_BG: 0x2a2a2a,
  /** 回收通知边框 */
  RECALL_BORDER: 0xffaa44,
  /** 回收通知文字 */
  RECALL_TEXT: '#FFAA44',
} as const;

/** 卡片类型颜色 */
export const CARD_TYPE_COLORS = {
  /** 档案卡 */
  ARCHIVE: {
    BG: 0x1a3a4a,
    ACCENT: 0x00aa88,
    BORDER: 0x00ffaa,
  },
  /** 物品卡 */
  ITEM: {
    BG: 0x3a1a4a,
    ACCENT: 0xaa00aa,
    BORDER: 0xff00ff,
  },
  /** 地图卡 */
  MAP: {
    BG: 0x4a3a1a,
    ACCENT: 0xaa8800,
    BORDER: 0xffaa00,
  },
  /** 祈言卡 */
  PRAYER: {
    BG: 0x4a1a1a,
    ACCENT: 0xaa0000,
    BORDER: 0xff4444,
  },
  /** 收据卡 */
  RECEIPT: {
    BG: 0x2a2a3a,
    ACCENT: 0x6666aa,
    BORDER: 0x8888ff,
  },
  /** 判词卡 */
  VERDICT: {
    BG: 0x1a4a3a,
    ACCENT: 0x00aa66,
    BORDER: 0x00ff88,
  },
  /** 日记卡 */
  DIARY: {
    BG: 0x3a3a2a,
    ACCENT: 0xaaaa00,
    BORDER: 0xffff44,
  },
} as const;

/** Toast 颜色 */
export const TOAST_COLORS = {
  /** 成就 Toast */
  ACHIEVEMENT: {
    BG: 0x2a2a1a,
    BORDER: 0xffd700,
    TEXT: '#FFD700',
  },
  /** 成功 Toast */
  SUCCESS: {
    BG: 0x1a3a2a,
    BORDER: 0x00ff88,
    TEXT: '#00FF88',
  },
  /** 警告 Toast */
  WARNING: {
    BG: 0x3a3a1a,
    BORDER: 0xffaa00,
    TEXT: '#FFAA00',
  },
  /** 错误 Toast */
  ERROR: {
    BG: 0x3a1a1a,
    BORDER: 0xff4444,
    TEXT: '#FF4444',
  },
  /** 信息 Toast */
  INFO: {
    BG: 0x1a2a3a,
    BORDER: 0x4a9eff,
    TEXT: '#4A9EFF',
  },
} as const;

/** 成就稀有度颜色 */
export const ACHIEVEMENT_RARITY_COLORS = {
  /** 普通 */
  COMMON: 0x888888,
  /** 稀有 */
  RARE: 0x4488ff,
  /** 史诗 */
  EPIC: 0xaa44ff,
  /** 传说 */
  LEGENDARY: 0xffaa00,
} as const;

/** 触控 UI 颜色 */
export const TOUCH_CONTROLS_COLORS = {
  /** 摇杆背景 */
  JOYSTICK_BG: 0x333344,
  /** 摇杆激活 */
  JOYSTICK_ACTIVE: 0x4a9eff,
  /** 按钮背景 */
  BUTTON_BG: 0x2a4a6a,
  /** 按钮边框 */
  BUTTON_BORDER: 0x4a6a8a,
  /** 提示背景 */
  HINT_BG: 0x1a1a2e,
  /** 提示边框 */
  HINT_BORDER: 0x2a2a3e,
} as const;

/** 能力特效颜色 */
export const ABILITY_EFFECT_COLORS = {
  /** 深度感知 */
  DEPTH_PERCEPTION: {
    PRIMARY: 0x0066aa,
    SECONDARY: 0x00ffff,
    GLOW: 0x00aaff,
  },
  /** 深度介入 */
  DEPTH_INTERVENTION: {
    PRIMARY: 0x6600aa,
    SECONDARY: 0xff00ff,
    GLOW: 0xaa00ff,
  },
  /** 时间干预 */
  TIME_INTERVENTION: {
    PRIMARY: 0xaa0000,
    SECONDARY: 0xff4444,
    GLOW: 0xff0000,
  },
} as const;

// ==================== 辅助函数 ====================

/**
 * 将 Phaser 颜色转换为 CSS 颜色
 */
export function colorToHex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0').toUpperCase();
}

/**
 * 将 CSS 颜色转换为 Phaser 颜色
 */
export function hexToColor(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * 创建带透明度的颜色
 */
export function colorWithAlpha(color: number, alpha: number): number {
  const a = Math.round(alpha * 255);
  return (a << 24) | color;
}
