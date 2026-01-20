/**
 * UI 统一配置
 *
 * 集中管理所有UI相关的常量，包括：
 * - 字体大小
 * - 间距
 * - 尺寸
 * - 动画
 * - 样式
 *
 * 使用方式：
 * import { UI } from '@/config/ui.config';
 * fontSize: UI.FONT_SIZE.NORMAL
 */

/**
 * 字体大小常量
 * 基于 1080x1920 分辨率设计
 *
 * 规则：
 * - TINY 是最小可用字体，不得小于此值
 * - 所有UI文字必须使用这些常量，禁止硬编码
 */
export const UI_FONT_SIZE = {
  /** 超大特效标题 - 80px (戏剧性揭示、结局标题) */
  GIANT: '80px',
  /** 大特效标题 - 64px (章节过场、重要事件) */
  MEGA: '64px',
  /** 超大标题 - 48px (游戏主标题、重要弹窗标题) */
  HUGE: '48px',
  /** 大标题 - 36px (章节标题、模块标题) */
  TITLE: '36px',
  /** 章节/区块标题 - 28px (面板标题、卡片标题) */
  SECTION: '28px',
  /** 正常文本 - 20px (正文、按钮文字、列表项) */
  NORMAL: '20px',
  /** 中间字号 - 18px (强调说明、重要标签) */
  MEDIUM: '18px',
  /** 小号文本 - 16px (说明文字、副标题、标签) */
  SMALL: '16px',
  /** 最小文本 - 14px (辅助信息、时间戳、版本号) */
  TINY: '14px',
  /** 图标文字 - 24px (emoji图标) */
  ICON: '24px',
  /** 大图标 - 32px (大号emoji) */
  ICON_LARGE: '32px',
} as const;

/**
 * 字体大小数值版本（用于需要数字的场景）
 */
export const UI_FONT_SIZE_NUM = {
  GIANT: 80,
  MEGA: 64,
  HUGE: 48,
  TITLE: 36,
  SECTION: 28,
  NORMAL: 20,
  MEDIUM: 18,
  SMALL: 16,
  TINY: 14,
  ICON: 24,
  ICON_LARGE: 32,
} as const;

/**
 * 间距常量
 */
export const UI_SPACING = {
  /** 极小间距 - 4px */
  XS: 4,
  /** 小间距 - 8px */
  SM: 8,
  /** 中间距 - 16px */
  MD: 16,
  /** 大间距 - 24px */
  LG: 24,
  /** 超大间距 - 32px */
  XL: 32,
  /** 特大间距 - 48px */
  XXL: 48,
} as const;

/**
 * 圆角常量
 */
export const UI_RADIUS = {
  /** 小圆角 - 4px */
  SM: 4,
  /** 中圆角 - 8px */
  MD: 8,
  /** 大圆角 - 12px */
  LG: 12,
  /** 特大圆角 - 16px */
  XL: 16,
  /** 圆形 - 50% */
  FULL: 9999,
} as const;

/**
 * 按钮尺寸
 */
export const UI_BUTTON = {
  /** 小按钮 */
  SM: {
    WIDTH: 100,
    HEIGHT: 36,
    FONT_SIZE: UI_FONT_SIZE.SMALL,
  },
  /** 中按钮 */
  MD: {
    WIDTH: 160,
    HEIGHT: 50,
    FONT_SIZE: UI_FONT_SIZE.NORMAL,
  },
  /** 大按钮 */
  LG: {
    WIDTH: 200,
    HEIGHT: 60,
    FONT_SIZE: UI_FONT_SIZE.NORMAL,
  },
  /** 最小点击区域 (无障碍标准) */
  MIN_TOUCH_SIZE: 44,
} as const;

/**
 * 面板尺寸
 */
export const UI_PANEL = {
  /** 小面板 */
  SM: {
    WIDTH: 400,
    HEIGHT: 300,
  },
  /** 中面板 */
  MD: {
    WIDTH: 600,
    HEIGHT: 500,
  },
  /** 大面板 */
  LG: {
    WIDTH: 800,
    HEIGHT: 700,
  },
  /** 全屏面板 */
  FULL: {
    WIDTH: 1080,
    HEIGHT: 1920,
  },
} as const;

/**
 * 卡片尺寸
 */
export const UI_CARD = {
  /** 缩略图卡片 */
  THUMB: {
    WIDTH: 160,
    HEIGHT: 200,
  },
  /** 标准卡片 */
  NORMAL: {
    WIDTH: 320,
    HEIGHT: 480,
  },
  /** 大卡片 */
  LARGE: {
    WIDTH: 400,
    HEIGHT: 600,
  },
} as const;

/**
 * 对话框尺寸
 */
export const UI_DIALOGUE = {
  /** 对话框高度 */
  BOX_HEIGHT: 240,
  /** 底部边距 */
  BOX_MARGIN_BOTTOM: 120,
  /** 内容宽度 */
  CONTENT_WIDTH: 620,
  /** 选项按钮高度 */
  CHOICE_HEIGHT: 60,
  /** 选项间距 */
  CHOICE_SPACING: 10,
} as const;

/**
 * Toast 尺寸
 */
export const UI_TOAST = {
  WIDTH: 450,
  HEIGHT: 70,
  DURATION: 3000,
} as const;

/**
 * 动画时长（毫秒）
 */
export const UI_ANIMATION = {
  /** 快速动画 - 150ms */
  FAST: 150,
  /** 标准动画 - 300ms */
  NORMAL: 300,
  /** 慢速动画 - 500ms */
  SLOW: 500,
  /** 特效动画 - 800ms */
  EFFECT: 800,
  /** 超慢动画 - 1000ms */
  EXTRA_SLOW: 1000,
} as const;

/**
 * Z-Index 层级
 */
export const UI_DEPTH = {
  /** 背景层 */
  BACKGROUND: 0,
  /** 场景物件层 */
  OBJECTS: 100,
  /** 角色层 */
  CHARACTERS: 200,
  /** 特效层 */
  EFFECTS: 300,
  /** UI基础层 */
  UI_BASE: 1000,
  /** 对话层 */
  DIALOGUE: 1100,
  /** 弹窗层 */
  POPUP: 1200,
  /** 遮罩层 */
  OVERLAY: 1300,
  /** Toast层 */
  TOAST: 1400,
  /** 最顶层 */
  TOP: 9999,
} as const;

/**
 * 透明度常量
 */
export const UI_ALPHA = {
  /** 完全透明 */
  TRANSPARENT: 0,
  /** 轻微透明 */
  LIGHT: 0.3,
  /** 半透明 */
  MEDIUM: 0.5,
  /** 较不透明 */
  HEAVY: 0.7,
  /** 几乎不透明 */
  DENSE: 0.85,
  /** 完全不透明 */
  OPAQUE: 1,
} as const;

/**
 * 线宽常量
 */
export const UI_LINE_WIDTH = {
  /** 细线 - 1px */
  THIN: 1,
  /** 普通线 - 2px */
  NORMAL: 2,
  /** 粗线 - 3px */
  THICK: 3,
  /** 特粗线 - 4px */
  HEAVY: 4,
} as const;

/**
 * 文字行高
 */
export const UI_LINE_SPACING = {
  /** 紧凑 */
  TIGHT: 4,
  /** 正常 */
  NORMAL: 6,
  /** 宽松 */
  LOOSE: 8,
  /** 很宽松 */
  EXTRA_LOOSE: 12,
} as const;

/**
 * 统一导出对象（方便使用）
 */
export const UI = {
  FONT_SIZE: UI_FONT_SIZE,
  FONT_SIZE_NUM: UI_FONT_SIZE_NUM,
  SPACING: UI_SPACING,
  RADIUS: UI_RADIUS,
  BUTTON: UI_BUTTON,
  PANEL: UI_PANEL,
  CARD: UI_CARD,
  DIALOGUE: UI_DIALOGUE,
  TOAST: UI_TOAST,
  ANIMATION: UI_ANIMATION,
  DEPTH: UI_DEPTH,
  ALPHA: UI_ALPHA,
  LINE_WIDTH: UI_LINE_WIDTH,
  LINE_SPACING: UI_LINE_SPACING,
} as const;

/**
 * 创建字体样式的辅助函数
 */
export function createFontStyle(
  size: string = UI_FONT_SIZE.NORMAL,
  color: string = '#E8E6E3',
  options: {
    fontFamily?: string;
    fontStyle?: string;
    lineSpacing?: number;
    wordWrap?: { width: number; useAdvancedWrap?: boolean };
  } = {}
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: options.fontFamily ?? 'Noto Sans SC',
    fontSize: size,
    color,
    fontStyle: options.fontStyle,
    lineSpacing: options.lineSpacing ?? UI_LINE_SPACING.NORMAL,
    wordWrap: options.wordWrap,
  };
}

/**
 * 预定义的文字样式
 */
export const UI_TEXT_STYLES = {
  /** 页面标题 */
  PAGE_TITLE: createFontStyle(UI_FONT_SIZE.TITLE, '#E8E6E3', { fontStyle: 'bold' }),
  /** 区块标题 */
  SECTION_TITLE: createFontStyle(UI_FONT_SIZE.SECTION, '#E8E6E3', { fontStyle: 'bold' }),
  /** 正文 */
  BODY: createFontStyle(UI_FONT_SIZE.NORMAL, '#E8E6E3', { lineSpacing: UI_LINE_SPACING.LOOSE }),
  /** 对话文字 */
  DIALOGUE: createFontStyle(UI_FONT_SIZE.NORMAL, '#E8E6E3', {
    lineSpacing: UI_LINE_SPACING.NORMAL,
    wordWrap: { width: UI_DIALOGUE.CONTENT_WIDTH, useAdvancedWrap: true },
  }),
  /** 说话者名称 */
  SPEAKER: createFontStyle(UI_FONT_SIZE.SMALL, '#00FFAA', { fontStyle: 'bold' }),
  /** 按钮文字 */
  BUTTON: createFontStyle(UI_FONT_SIZE.NORMAL, '#E8E6E3'),
  /** 标签文字 */
  LABEL: createFontStyle(UI_FONT_SIZE.SMALL, '#A8A6A3'),
  /** 辅助文字 */
  HELPER: createFontStyle(UI_FONT_SIZE.TINY, '#888888'),
  /** 系统提示 */
  SYSTEM: createFontStyle(UI_FONT_SIZE.SMALL, '#4A9EFF'),
  /** 强调文字 */
  ACCENT: createFontStyle(UI_FONT_SIZE.NORMAL, '#00FFAA'),
  /** 警告文字 */
  WARNING: createFontStyle(UI_FONT_SIZE.NORMAL, '#FFAA00'),
  /** 错误文字 */
  ERROR: createFontStyle(UI_FONT_SIZE.NORMAL, '#FF3333'),
} as const;

// 类型导出
export type UIFontSize = (typeof UI_FONT_SIZE)[keyof typeof UI_FONT_SIZE];
export type UISpacing = (typeof UI_SPACING)[keyof typeof UI_SPACING];
