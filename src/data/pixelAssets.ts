/**
 * 像素 PNG 资源注册表
 *
 * 说明：
 * - 使用 new URL(..., import.meta.url) 让 Vite 正确打包静态资源到 dist
 * - key 会作为 Phaser 的 texture key 使用（在场景配置 YAML 中引用）
 */
export const PIXEL_IMAGE_ASSETS: Record<string, string> = {
  // 道具图标
  px_item_archive: new URL('../../assets/images/pixel/icons/items/px_item_archive.png', import.meta.url).toString(),
  px_item_keycard: new URL('../../assets/images/pixel/icons/items/px_item_keycard.png', import.meta.url).toString(),
  px_item_tape: new URL('../../assets/images/pixel/icons/items/px_item_tape.png', import.meta.url).toString(),
  px_item_wrench: new URL('../../assets/images/pixel/icons/items/px_item_wrench.png', import.meta.url).toString(),
  // 场景物件
  px_item_healing: new URL('../../assets/images/pixel/icons/items/px_item_archive.png', import.meta.url).toString(), // 临时复用
  px_item_wall_segment: new URL('../../assets/images/pixel/icons/items/px_item_archive.png', import.meta.url).toString(), // 临时复用
  px_item_sign: new URL('../../assets/images/pixel/icons/items/px_item_archive.png', import.meta.url).toString(), // 临时复用
  px_item_door: new URL('../../assets/images/pixel/icons/items/px_item_archive.png', import.meta.url).toString(), // 临时复用

  // 特效图标
  px_fx_scar: new URL('../../assets/images/pixel/icons/effects/px_fx_scar.png', import.meta.url).toString(),
  px_fx_glitch: new URL('../../assets/images/pixel/icons/effects/px_fx_glitch.png', import.meta.url).toString(),
  px_fx_field_accept: new URL('../../assets/images/pixel/icons/effects/px_fx_field_accept.png', import.meta.url).toString(),
  px_fx_system_correct: new URL('../../assets/images/pixel/icons/effects/px_fx_system_correct.png', import.meta.url).toString(),

  // 能力图标
  px_ability_depth_perception: new URL('../../assets/images/pixel/icons/abilities/px_ability_depth_perception.png', import.meta.url).toString(),
  px_ability_depth_intervention: new URL('../../assets/images/pixel/icons/abilities/px_ability_depth_intervention.png', import.meta.url).toString(),
  px_ability_time_intervention: new URL('../../assets/images/pixel/icons/abilities/px_ability_time_intervention.png', import.meta.url).toString(),

  // 计数器图标
  px_counter_r: new URL('../../assets/images/pixel/icons/counters/px_counter_r.png', import.meta.url).toString(),
  px_counter_p: new URL('../../assets/images/pixel/icons/counters/px_counter_p.png', import.meta.url).toString(),
  px_counter_w: new URL('../../assets/images/pixel/icons/counters/px_counter_w.png', import.meta.url).toString(),

  // UI组件
  px_ui_panel_9slice: new URL('../../assets/images/pixel/ui/px_ui_panel_9slice.png', import.meta.url).toString(),
  px_hud_counter_bar: new URL('../../assets/images/pixel/ui/px_hud_counter_bar.png', import.meta.url).toString(),
  px_hud_ability_slot: new URL('../../assets/images/pixel/ui/px_hud_ability_slot.png', import.meta.url).toString(),
  px_dialogue_frame: new URL('../../assets/images/pixel/ui/px_dialogue_frame.png', import.meta.url).toString(),

  // 背景
  px_bg_placeholder: new URL('../../assets/images/pixel/backgrounds/px_bg_placeholder.png', import.meta.url).toString(),

  // 瓦片
  px_tiles_platform: new URL('../../assets/images/pixel/tiles/px_tiles_platform_basic.png', import.meta.url).toString(),
} as const;

export interface IPixelSpritesheetAsset {
  url: string;
  frameWidth: number;
  frameHeight: number;
}

export const PIXEL_SPRITESHEETS: Record<string, IPixelSpritesheetAsset> = {
  // 角色精灵 - Idle (4 frames * 128x128)
  px_sprite_ghost_idle: {
    url: new URL('../../assets/images/pixel/sprites/px_sprite_ghost_idle_strip.png', import.meta.url).toString(),
    frameWidth: 64,
    frameHeight: 64,
  },
  px_sprite_cenhui_idle: {
    url: new URL('../../assets/images/pixel/sprites/px_sprite_cenhui_idle_strip.png', import.meta.url).toString(),
    frameWidth: 128,
    frameHeight: 128,
  },
  // 角色精灵 - Walk (8 frames * 128x128)
  px_sprite_cenhui_walk: {
    url: new URL('../../assets/images/pixel/sprites/px_sprite_cenhui_walk_strip.png', import.meta.url).toString(),
    frameWidth: 128,
    frameHeight: 128,
  },
  px_sprite_gulin_idle: {
    url: new URL('../../assets/images/pixel/sprites/px_sprite_gulin_idle_strip.png', import.meta.url).toString(),
    frameWidth: 128,
    frameHeight: 128,
  },
  px_sprite_atang_idle: {
    url: new URL('../../assets/images/pixel/sprites/px_sprite_atang_idle_strip.png', import.meta.url).toString(),
    frameWidth: 128,
    frameHeight: 128,
  },

  // 效果序列 - 深度感知 (12 frames * 96x96)
  px_seq_depth_perception: {
    url: new URL('../../assets/images/pixel/sequences/px_depth_perception_strip.png', import.meta.url).toString(),
    frameWidth: 96,
    frameHeight: 96,
  },
  // 效果序列 - 深度介入 (12 frames * 64x64)
  px_seq_depth_intervention: {
    url: new URL('../../assets/images/pixel/sequences/px_depth_intervention_strip.png', import.meta.url).toString(),
    frameWidth: 64,
    frameHeight: 64,
  },
  // 效果序列 - 时间干预 (12 frames * 64x64)
  px_seq_time_intervention: {
    url: new URL('../../assets/images/pixel/sequences/px_time_intervention_strip.png', import.meta.url).toString(),
    frameWidth: 64,
    frameHeight: 64,
  },
  // 效果序列 - 加载动画 (12 frames * 64x64)
  px_seq_loader: {
    url: new URL('../../assets/images/pixel/sequences/px_loader_strip.png', import.meta.url).toString(),
    frameWidth: 64,
    frameHeight: 64,
  },
  // 效果序列 - 故障效果 (12 frames * 64x64)
  px_seq_glitch: {
    url: new URL('../../assets/images/pixel/sequences/px_glitch_strip.png', import.meta.url).toString(),
    frameWidth: 64,
    frameHeight: 64,
  },
  // 效果序列 - 字段接受 (12 frames * 64x64)
  px_seq_field_accept: {
    url: new URL('../../assets/images/pixel/sequences/px_field_accept_strip.png', import.meta.url).toString(),
    frameWidth: 64,
    frameHeight: 64,
  },
} as const;


