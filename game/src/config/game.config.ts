/**
 * 游戏配置
 */
import Phaser from 'phaser';
import { UI_FONT_SIZE } from '@/config/ui.config';

// 基础游戏配置
export const GAME_CONFIG: Partial<Phaser.Types.Core.GameConfig> = {
  type: Phaser.AUTO,
  backgroundColor: '#0A0A0F',
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
};

// 场景键名
export const SCENES = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  UI_OVERLAY: 'UIOverlay',
} as const;

// 游戏常量
export const CONSTANTS = {
  // 设计尺寸
  DESIGN_WIDTH: 750,
  DESIGN_HEIGHT: 1334,

  // 能力类型
  ABILITY: {
    DEPTH_PERCEPTION: 'DEPTH_PERCEPTION',
    DEPTH_INTERVENTION: 'DEPTH_INTERVENTION',
    TIME_INTERVENTION: 'TIME_INTERVENTION',
  },

  // 章节ID
  CHAPTERS: ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'CF'] as const,

  // R值阈值
  R_THRESHOLD: {
    SYSTEM_PAUSE: 3, // 系统停顿
    F21_WEAK: 6, // 弱版F21
    MODEL_REWRITE: 10, // 模型改写路径
  },

  // P值消耗
  P_COST: {
    DEPTH_PERCEPTION: 0,
    DEPTH_INTERVENTION: 2,
    TIME_INTERVENTION: 3,
  },

  // 动画时长 (ms)
  ANIMATION: {
    DIALOGUE_CHAR: 30, // 对话文字逐字显示
    FADE_IN: 300,
    FADE_OUT: 300,
    CARD_FLIP: 400,
    DEPTH_ACTIVATE: 500,
    TIME_REWIND: 1500,
  },

  // 存档
  SAVE: {
    MAX_SLOTS: 5, // 与 SaveManager.ts 保持一致
    AUTO_SAVE_INTERVAL: 60000, // 1分钟
    AUTO_SAVE_SLOT: 0, // 自动存档槽ID
    DB_NAME: 'footnote_save',
    DB_VERSION: 1,
  },

  // Zone类型
  ZONE_TYPE: {
    LIFE: 'life',
    STRUCTURAL: 'structural',
    CAUSAL: 'causal',
    CONFLICT: 'conflict',
  },

  // 卡片类型
  CARD_TYPE: {
    ARCHIVE: 'archive',
    ITEM: 'item',
    MAP: 'map',
    PRAYER: 'prayer',
    RECEIPT: 'receipt',
    VERDICT: 'verdict',
    DIARY: 'diary',
  },
} as const;

// 颜色常量
export const COLORS = {
  // 背景
  BG_PRIMARY: 0x0a0a0f,
  BG_SECONDARY: 0x141419,
  BG_TERTIARY: 0x1e1e24,

  // 文字
  TEXT_PRIMARY: 0xe8e6e3,
  TEXT_SECONDARY: 0xa8a6a3,
  TEXT_MUTED: 0x888888,

  // 强调
  ACCENT: 0x00ffaa,
  ACCENT_DEPTH: 0x00ffaa,
  ACCENT_TIME: 0xff4444,
  ACCENT_SYSTEM: 0x4a9eff,
  ACCENT_FIELD: 0xffd700,

  // 边框
  BORDER: 0x3a3a40,

  // 功能
  SUCCESS: 0x00cc66,
  WARNING: 0xffaa00,
  ERROR: 0xff3333,
  INFO: 0x3399ff,
} as const;

// 文字样式
export const TEXT_STYLES = {
  // 标题
  TITLE: {
    fontFamily: 'Noto Sans SC',
    fontSize: UI_FONT_SIZE.SECTION,
    color: '#E8E6E3',
    fontStyle: 'bold',
  },

  // 正文
  BODY: {
    fontFamily: 'Noto Sans SC',
    fontSize: UI_FONT_SIZE.MEDIUM,
    color: '#E8E6E3',
    lineSpacing: 8,
  },

  // 对话
  DIALOGUE: {
    fontFamily: 'Noto Sans SC',
    fontSize: UI_FONT_SIZE.SMALL,
    color: '#E8E6E3',
    lineSpacing: 6,
    wordWrap: { width: 620 },
  },

  // 说话者名称
  SPEAKER: {
    fontFamily: 'Noto Sans SC',
    fontSize: UI_FONT_SIZE.TINY,
    color: '#00FFAA',
    fontStyle: 'bold',
  },

  // 系统提示
  SYSTEM: {
    fontFamily: 'Noto Sans SC',
    fontSize: UI_FONT_SIZE.TINY,
    color: '#4A9EFF',
  },

  // 卡片标题
  CARD_TITLE: {
    fontFamily: 'Noto Sans SC',
    fontSize: UI_FONT_SIZE.SMALL,
    color: '#E8E6E3',
    fontStyle: 'bold',
  },

  // 卡片正文
  CARD_BODY: {
    fontFamily: 'Noto Sans SC',
    fontSize: UI_FONT_SIZE.TINY,
    color: '#A8A6A3',
    lineSpacing: 4,
  },

  // 淡化文字（极淡小字）
  MUTED: {
    fontFamily: 'Noto Sans SC',
    fontSize: UI_FONT_SIZE.TINY,
    color: '#888888',
  },
} as const;

// 类型导出
export type ChapterID = (typeof CONSTANTS.CHAPTERS)[number];
export type AbilityType = (typeof CONSTANTS.ABILITY)[keyof typeof CONSTANTS.ABILITY];
export type ZoneType = (typeof CONSTANTS.ZONE_TYPE)[keyof typeof CONSTANTS.ZONE_TYPE];
export type CardType = (typeof CONSTANTS.CARD_TYPE)[keyof typeof CONSTANTS.CARD_TYPE];
