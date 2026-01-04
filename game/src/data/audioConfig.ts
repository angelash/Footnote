/**
 * 音频配置
 * 定义游戏中所有BGM、音效和环境音
 * @module data/audioConfig
 */

import type { IBgmConfig, ISfxConfig, IAmbienceConfig } from '@/systems/audio/AudioManager';

// ==================== BGM 配置 ====================

export const BGM_CONFIGS: IBgmConfig[] = [
  {
    id: 'bgm_title',
    name: '主菜单',
    file: 'assets/audio/bgm/bgm_title.mp3',
    loop: true,
    volume: 0.7,
    fadeIn: 2000,
    fadeOut: 1500,
  },
  {
    id: 'bgm_prologue',
    name: '序章',
    file: 'assets/audio/bgm/bgm_prologue.mp3',
    loop: true,
    volume: 0.6,
    fadeIn: 2000,
    fadeOut: 1500,
  },
  {
    id: 'bgm_archive',
    name: '档案室',
    file: 'assets/audio/bgm/bgm_archive.mp3',
    loop: true,
    volume: 0.5,
    fadeIn: 2000,
    fadeOut: 1500,
  },
  {
    id: 'bgm_anomaly',
    name: '异常区域',
    file: 'assets/audio/bgm/bgm_anomaly.mp3',
    loop: true,
    volume: 0.6,
    fadeIn: 1500,
    fadeOut: 1500,
  },
  {
    id: 'bgm_drifter',
    name: '漂移者',
    file: 'assets/audio/bgm/bgm_drifter.mp3',
    loop: true,
    volume: 0.5,
    fadeIn: 2000,
    fadeOut: 1500,
  },
  {
    id: 'bgm_depth_perception',
    name: '深度感知',
    file: 'assets/audio/bgm/bgm_depth_perception.mp3',
    loop: true,
    volume: 0.6,
    fadeIn: 1000,
    fadeOut: 1000,
  },
  {
    id: 'bgm_finale',
    name: '终章',
    file: 'assets/audio/bgm/bgm_finale.mp3',
    loop: true,
    volume: 0.7,
    fadeIn: 3000,
    fadeOut: 2000,
  },
  {
    id: 'bgm_ending',
    name: '结局',
    file: 'assets/audio/bgm/bgm_ending.mp3',
    loop: false,
    volume: 0.8,
    fadeIn: 2000,
    fadeOut: 3000,
  },
];

// ==================== 音效配置 ====================

export const SFX_CONFIGS: ISfxConfig[] = [
  // UI音效
  {
    id: 'sfx_button_click',
    name: '按钮点击',
    file: 'assets/audio/sfx/ui/sfx_button_click.mp3',
    volume: 0.6,
  },
  {
    id: 'sfx_button_hover',
    name: '按钮悬停',
    file: 'assets/audio/sfx/ui/sfx_button_hover.mp3',
    volume: 0.3,
  },
  {
    id: 'sfx_button_back',
    name: '返回按钮',
    file: 'assets/audio/sfx/ui/sfx_button_back.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_menu_open',
    name: '菜单打开',
    file: 'assets/audio/sfx/ui/sfx_menu_open.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_menu_close',
    name: '菜单关闭',
    file: 'assets/audio/sfx/ui/sfx_menu_close.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_dialogue_appear',
    name: '对话出现',
    file: 'assets/audio/sfx/ui/sfx_dialogue_appear.mp3',
    volume: 0.4,
  },
  {
    id: 'sfx_dialogue_text',
    name: '对话文字',
    file: 'assets/audio/sfx/ui/sfx_dialogue_text.mp3',
    volume: 0.2,
    loop: true,
  },
  {
    id: 'sfx_dialogue_complete',
    name: '对话完成',
    file: 'assets/audio/sfx/ui/sfx_dialogue_complete.mp3',
    volume: 0.4,
  },
  {
    id: 'sfx_choice_appear',
    name: '选项出现',
    file: 'assets/audio/sfx/ui/sfx_choice_appear.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_choice_select',
    name: '选项选择',
    file: 'assets/audio/sfx/ui/sfx_choice_select.mp3',
    volume: 0.6,
  },
  {
    id: 'sfx_card_get',
    name: '获得卡片',
    file: 'assets/audio/sfx/ui/sfx_card_get.mp3',
    volume: 0.7,
  },
  {
    id: 'sfx_card_flip',
    name: '卡片翻转',
    file: 'assets/audio/sfx/ui/sfx_card_flip.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_save',
    name: '保存',
    file: 'assets/audio/sfx/ui/sfx_save.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_load',
    name: '加载',
    file: 'assets/audio/sfx/ui/sfx_load.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_notification',
    name: '通知',
    file: 'assets/audio/sfx/ui/sfx_notification.mp3',
    volume: 0.6,
  },
  {
    id: 'sfx_error',
    name: '错误',
    file: 'assets/audio/sfx/ui/sfx_error.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_warning',
    name: '警告',
    file: 'assets/audio/sfx/ui/sfx_warning.mp3',
    volume: 0.6,
  },

  // 游戏音效
  {
    id: 'sfx_zone_enter',
    name: '进入区域',
    file: 'assets/audio/sfx/game/sfx_zone_enter.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_interact',
    name: '交互',
    file: 'assets/audio/sfx/game/sfx_interact.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_item_pickup',
    name: '拾取物品',
    file: 'assets/audio/sfx/game/sfx_item_pickup.mp3',
    volume: 0.6,
  },
  {
    id: 'sfx_door_open',
    name: '开门',
    file: 'assets/audio/sfx/game/sfx_door_open.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_foreshadow_trigger',
    name: '伏笔触发',
    file: 'assets/audio/sfx/game/sfx_foreshadow_trigger.mp3',
    volume: 0.7,
  },
  {
    id: 'sfx_r_increment',
    name: 'R值增加',
    file: 'assets/audio/sfx/game/sfx_r_increment.mp3',
    volume: 0.4,
  },
  {
    id: 'sfx_field_new',
    name: '新字段',
    file: 'assets/audio/sfx/game/sfx_field_new.mp3',
    volume: 0.6,
  },

  // 能力音效
  {
    id: 'sfx_depth_perception_activate',
    name: '深度感知激活',
    file: 'assets/audio/sfx/game/sfx_depth_perception_activate.mp3',
    volume: 0.7,
  },
  {
    id: 'sfx_depth_perception_deactivate',
    name: '深度感知关闭',
    file: 'assets/audio/sfx/game/sfx_depth_perception_deactivate.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_depth_intervention',
    name: '深度介入',
    file: 'assets/audio/sfx/game/sfx_depth_intervention.mp3',
    volume: 0.8,
  },
  {
    id: 'sfx_time_intervention',
    name: '时间干预',
    file: 'assets/audio/sfx/game/sfx_time_intervention.mp3',
    volume: 0.8,
  },
  {
    id: 'sfx_time_contamination',
    name: '时间污染',
    file: 'assets/audio/sfx/game/sfx_time_contamination.mp3',
    volume: 0.6,
  },

  // 环境音效
  {
    id: 'sfx_crack',
    name: '裂缝',
    file: 'assets/audio/sfx/game/sfx_crack.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_collapse',
    name: '崩塌',
    file: 'assets/audio/sfx/game/sfx_collapse.mp3',
    volume: 0.7,
  },
  {
    id: 'sfx_drift',
    name: '漂移',
    file: 'assets/audio/sfx/game/sfx_drift.mp3',
    volume: 0.5,
  },
  {
    id: 'sfx_scar_create',
    name: '伤痕创建',
    file: 'assets/audio/sfx/game/sfx_scar_create.mp3',
    volume: 0.6,
  },
  {
    id: 'sfx_system_correct',
    name: '系统修正',
    file: 'assets/audio/sfx/game/sfx_system_correct.mp3',
    volume: 0.7,
  },
];

// ==================== 环境音配置 ====================

export const AMBIENCE_CONFIGS: IAmbienceConfig[] = [
  {
    id: 'amb_indoor_office',
    name: '室内办公',
    file: 'assets/audio/ambience/amb_indoor_office.mp3',
    volume: 0.4,
    loop: true,
    fadeIn: 2000,
    fadeOut: 1500,
  },
  {
    id: 'amb_indoor_archive',
    name: '室内档案',
    file: 'assets/audio/ambience/amb_indoor_archive.mp3',
    volume: 0.3,
    loop: true,
    fadeIn: 2000,
    fadeOut: 1500,
  },
  {
    id: 'amb_anomaly_zone',
    name: '异常区域',
    file: 'assets/audio/ambience/amb_anomaly_zone.mp3',
    volume: 0.5,
    loop: true,
    fadeIn: 1500,
    fadeOut: 1500,
  },
  {
    id: 'amb_drifter_area',
    name: '漂移者区域',
    file: 'assets/audio/ambience/amb_drifter_area.mp3',
    volume: 0.4,
    loop: true,
    fadeIn: 2000,
    fadeOut: 1500,
  },
  {
    id: 'amb_depth_active',
    name: '深度感知激活',
    file: 'assets/audio/ambience/amb_depth_active.mp3',
    volume: 0.6,
    loop: true,
    fadeIn: 500,
    fadeOut: 500,
  },
  {
    id: 'amb_time_distortion',
    name: '时间扭曲',
    file: 'assets/audio/ambience/amb_time_distortion.mp3',
    volume: 0.5,
    loop: true,
    fadeIn: 1000,
    fadeOut: 1000,
  },
  {
    id: 'amb_finale',
    name: '终章',
    file: 'assets/audio/ambience/amb_finale.mp3',
    volume: 0.5,
    loop: true,
    fadeIn: 3000,
    fadeOut: 2000,
  },
];

// ==================== Zone音频映射 ====================

export interface IZoneAudioConfig {
  bgm: string;
  ambience: string;
}

export const ZONE_AUDIO_MAP: Record<string, IZoneAudioConfig> = {
  // 序章
  'C0-Z1': { bgm: 'bgm_prologue', ambience: 'amb_indoor_office' },
  'C0-Z2': { bgm: 'bgm_prologue', ambience: 'amb_indoor_office' },
  'C0-Z3': { bgm: 'bgm_prologue', ambience: 'amb_indoor_office' },
  'C0-Z4': { bgm: 'bgm_archive', ambience: 'amb_indoor_archive' },
  'C0-Z5': { bgm: 'bgm_archive', ambience: 'amb_indoor_archive' },
  'C0-Z6': { bgm: 'bgm_prologue', ambience: 'amb_indoor_office' },

  // 第1章
  'C1-Z1': { bgm: 'bgm_prologue', ambience: 'amb_indoor_office' },
  'C1-Z2': { bgm: 'bgm_archive', ambience: 'amb_indoor_archive' },
  'C1-Z3': { bgm: 'bgm_prologue', ambience: 'amb_indoor_office' },
  'C1-Z4': { bgm: 'bgm_archive', ambience: 'amb_indoor_archive' },
  'C1-Z5': { bgm: 'bgm_archive', ambience: 'amb_indoor_archive' },
  'C1-Z6': { bgm: 'bgm_prologue', ambience: 'amb_indoor_office' },

  // 第2章
  'C2-Z1': { bgm: 'bgm_depth_perception', ambience: 'amb_depth_active' },
  'C2-Z2': { bgm: 'bgm_anomaly', ambience: 'amb_anomaly_zone' },
  'C2-Z3': { bgm: 'bgm_archive', ambience: 'amb_indoor_archive' },
  'C2-Z4': { bgm: 'bgm_drifter', ambience: 'amb_drifter_area' },
  'C2-Z5': { bgm: 'bgm_anomaly', ambience: 'amb_anomaly_zone' },
  'C2-Z6': { bgm: 'bgm_drifter', ambience: 'amb_drifter_area' },
  'C2-Z7': { bgm: 'bgm_anomaly', ambience: 'amb_anomaly_zone' },

  // 第3章
  'C3-Z1': { bgm: 'bgm_anomaly', ambience: 'amb_anomaly_zone' },
  'C3-Z2': { bgm: 'bgm_depth_perception', ambience: 'amb_depth_active' },
  'C3-Z3': { bgm: 'bgm_drifter', ambience: 'amb_drifter_area' },
  'C3-Z4': { bgm: 'bgm_anomaly', ambience: 'amb_anomaly_zone' },
  'C3-Z5': { bgm: 'bgm_archive', ambience: 'amb_indoor_archive' },
  'C3-Z6': { bgm: 'bgm_anomaly', ambience: 'amb_anomaly_zone' },
  'C3-Z7': { bgm: 'bgm_anomaly', ambience: 'amb_anomaly_zone' },

  // 第4章
  'C4-Z1': { bgm: 'bgm_depth_perception', ambience: 'amb_time_distortion' },
  'C4-Z2': { bgm: 'bgm_archive', ambience: 'amb_indoor_archive' },
  'C4-Z3': { bgm: 'bgm_anomaly', ambience: 'amb_time_distortion' },
  'C4-Z4': { bgm: 'bgm_archive', ambience: 'amb_indoor_archive' },
  'C4-Z5': { bgm: 'bgm_archive', ambience: 'amb_indoor_archive' },
  'C4-Z6': { bgm: 'bgm_anomaly', ambience: 'amb_time_distortion' },
  'C4-Z7': { bgm: 'bgm_anomaly', ambience: 'amb_anomaly_zone' },
  'C4-Z8': { bgm: 'bgm_anomaly', ambience: 'amb_anomaly_zone' },

  // 第5章
  'C5-Z1': { bgm: 'bgm_finale', ambience: 'amb_anomaly_zone' },
  'C5-Z2': { bgm: 'bgm_finale', ambience: 'amb_anomaly_zone' },
  'C5-Z3': { bgm: 'bgm_drifter', ambience: 'amb_drifter_area' },
  'C5-Z4': { bgm: 'bgm_finale', ambience: 'amb_anomaly_zone' },
  'C5-Z5': { bgm: 'bgm_finale', ambience: 'amb_anomaly_zone' },
  'C5-Z6': { bgm: 'bgm_archive', ambience: 'amb_indoor_archive' },
  'C5-Z7': { bgm: 'bgm_finale', ambience: 'amb_finale' },

  // 终章
  'CF-Z1': { bgm: 'bgm_finale', ambience: 'amb_finale' },
  'CF-Z2': { bgm: 'bgm_finale', ambience: 'amb_finale' },
  'CF-Z3': { bgm: 'bgm_ending', ambience: 'amb_finale' },
  'CF-Z4': { bgm: 'bgm_ending', ambience: 'amb_finale' },
  'CF-Z5': { bgm: 'bgm_ending', ambience: 'amb_finale' },
  'CF-Z6': { bgm: 'bgm_ending', ambience: 'amb_finale' },
};

// ==================== 导出所有配置 ====================

export const AUDIO_CONFIG = {
  bgm: BGM_CONFIGS,
  sfx: SFX_CONFIGS,
  ambience: AMBIENCE_CONFIGS,
  zoneMap: ZONE_AUDIO_MAP,
};
