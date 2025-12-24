/**
 * 像素 PNG 资源注册表
 *
 * 说明：
 * - 使用 new URL(..., import.meta.url) 让 Vite 正确打包静态资源到 dist
 * - key 会作为 Phaser 的 texture key 使用（在场景配置 YAML 中引用）
 */
export const PIXEL_IMAGE_ASSETS: Record<string, string> = {
  px_item_archive: new URL('../../assets/images/pixel/icons/items/px_item_archive.png', import.meta.url).toString(),
  px_item_keycard: new URL('../../assets/images/pixel/icons/items/px_item_keycard.png', import.meta.url).toString(),
  px_item_tape: new URL('../../assets/images/pixel/icons/items/px_item_tape.png', import.meta.url).toString(),
  px_item_wrench: new URL('../../assets/images/pixel/icons/items/px_item_wrench.png', import.meta.url).toString(),

  px_fx_scar: new URL('../../assets/images/pixel/icons/effects/px_fx_scar.png', import.meta.url).toString(),
  px_fx_glitch: new URL('../../assets/images/pixel/icons/effects/px_fx_glitch.png', import.meta.url).toString(),
  px_fx_field_accept: new URL('../../assets/images/pixel/icons/effects/px_fx_field_accept.png', import.meta.url).toString(),
  px_fx_system_correct: new URL('../../assets/images/pixel/icons/effects/px_fx_system_correct.png', import.meta.url).toString(),

  px_ui_panel_9slice: new URL('../../assets/images/pixel/ui/px_ui_panel_9slice.png', import.meta.url).toString(),
} as const;

export interface IPixelSpritesheetAsset {
  url: string;
  frameWidth: number;
  frameHeight: number;
}

export const PIXEL_SPRITESHEETS: Record<string, IPixelSpritesheetAsset> = {
  // 4 frames * 128x128（由 generate_pixel_assets.py 的 strip 输出）
  px_sprite_ghost_idle: {
    url: new URL('../../assets/images/pixel/sprites/px_sprite_ghost_idle_strip.png', import.meta.url).toString(),
    frameWidth: 128,
    frameHeight: 128,
  },
} as const;


