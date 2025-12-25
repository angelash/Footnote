/**
 * WebP 资源注册表
 * 
 * 包含由智绘AI生成的所有像素艺术资产
 * - 角色头像（8角色 × 多种表情）
 * - 场景背景（C2-CF + 变体）
 * - 场景物件（居住区/市政/档案/诊所/神殿/边缘）
 * - 特效资产（能力/系统/环境）
 * - UI图素
 * - 可动物件动画
 */

// ==================== 角色头像 ====================

/**
 * 角色头像资产
 * 格式: portrait_[角色]_[表情]
 */
export const CHARACTER_PORTRAITS: Record<string, string> = {
  // ===== 岑回 (Cenhui) - 主角 =====
  portrait_cenhui_neutral: new URL('../../assets/images/characters/portraits/cenhui/cenhui_neutral_1.webp', import.meta.url).toString(),
  portrait_cenhui_sad: new URL('../../assets/images/characters/portraits/cenhui/cenhui_sad_1.webp', import.meta.url).toString(),
  portrait_cenhui_angry: new URL('../../assets/images/characters/portraits/cenhui/cenhui_angry_1.webp', import.meta.url).toString(),
  portrait_cenhui_smiling: new URL('../../assets/images/characters/portraits/cenhui/cenhui_smiling_1.webp', import.meta.url).toString(),
  portrait_cenhui_thinking: new URL('../../assets/images/characters/portraits/cenhui/cenhui_thinking_1.webp', import.meta.url).toString(),
  portrait_cenhui_surprised: new URL('../../assets/images/characters/portraits/cenhui/cenhui_surprised_1.webp', import.meta.url).toString(),
  portrait_cenhui_stressed: new URL('../../assets/images/characters/portraits/cenhui/cenhui_stressed_1.webp', import.meta.url).toString(),

  // ===== 顾临 (Gulin) - 维修局主管 =====
  portrait_gulin_neutral: new URL('../../assets/images/characters/portraits/gulin/gulin_neutral_1.webp', import.meta.url).toString(),
  portrait_gulin_stern: new URL('../../assets/images/characters/portraits/gulin/gulin_stern_1.webp', import.meta.url).toString(),
  portrait_gulin_displeased: new URL('../../assets/images/characters/portraits/gulin/gulin_displeased_1.webp', import.meta.url).toString(),
  portrait_gulin_thinking: new URL('../../assets/images/characters/portraits/gulin/gulin_thinking_1.webp', import.meta.url).toString(),
  portrait_gulin_surprised: new URL('../../assets/images/characters/portraits/gulin/gulin_surprised_1.webp', import.meta.url).toString(),
  portrait_gulin_angry: new URL('../../assets/images/characters/portraits/gulin/gulin_angry_1.webp', import.meta.url).toString(),
  portrait_gulin_tired: new URL('../../assets/images/characters/portraits/gulin/gulin_tired_1.webp', import.meta.url).toString(),
  portrait_gulin_worried: new URL('../../assets/images/characters/portraits/gulin/gulin_worried_1.webp', import.meta.url).toString(),

  // ===== 宋岚 (Songlan) - 层下记录者 =====
  portrait_songlan_neutral: new URL('../../assets/images/characters/portraits/songlan/songlan_neutral_1.webp', import.meta.url).toString(),
  portrait_songlan_thinking: new URL('../../assets/images/characters/portraits/songlan/songlan_thinking_1.webp', import.meta.url).toString(),
  portrait_songlan_worried: new URL('../../assets/images/characters/portraits/songlan/songlan_worried_1.webp', import.meta.url).toString(),
  portrait_songlan_serious: new URL('../../assets/images/characters/portraits/songlan/songlan_serious_1.webp', import.meta.url).toString(),
  portrait_songlan_sad: new URL('../../assets/images/characters/portraits/songlan/songlan_sad_1.webp', import.meta.url).toString(),
  portrait_songlan_kind: new URL('../../assets/images/characters/portraits/songlan/songlan_kind_1.webp', import.meta.url).toString(),
  portrait_songlan_warm: new URL('../../assets/images/characters/portraits/songlan/songlan_warm_1.webp', import.meta.url).toString(),
  portrait_songlan_curious: new URL('../../assets/images/characters/portraits/songlan/songlan_curious_1.webp', import.meta.url).toString(),

  // ===== 许澄 (Xucheng) - 医生 =====
  portrait_xucheng_neutral: new URL('../../assets/images/characters/portraits/xucheng/xucheng_neutral_1.webp', import.meta.url).toString(),
  portrait_xucheng_comforting: new URL('../../assets/images/characters/portraits/xucheng/xucheng_comforting_1.webp', import.meta.url).toString(),
  portrait_xucheng_concerned: new URL('../../assets/images/characters/portraits/xucheng/xucheng_concerned_1.webp', import.meta.url).toString(),
  portrait_xucheng_sad: new URL('../../assets/images/characters/portraits/xucheng/xucheng_sad_1.webp', import.meta.url).toString(),
  portrait_xucheng_thinking: new URL('../../assets/images/characters/portraits/xucheng/xucheng_thinking_1.webp', import.meta.url).toString(),
  portrait_xucheng_professional: new URL('../../assets/images/characters/portraits/xucheng/xucheng_professional_1.webp', import.meta.url).toString(),
  portrait_xucheng_understanding: new URL('../../assets/images/characters/portraits/xucheng/xucheng_understanding_1.webp', import.meta.url).toString(),
  portrait_xucheng_determined: new URL('../../assets/images/characters/portraits/xucheng/xucheng_determined_1.webp', import.meta.url).toString(),
  portrait_xucheng_worried: new URL('../../assets/images/characters/portraits/xucheng/xucheng_worried_1.webp', import.meta.url).toString(),

  // ===== 阿棠 (Atang) - 漂移者 =====
  portrait_atang_neutral: new URL('../../assets/images/characters/portraits/atang/atang_neutral_1.webp', import.meta.url).toString(),
  portrait_atang_dreamy: new URL('../../assets/images/characters/portraits/atang/atang_dreamy_1.webp', import.meta.url).toString(),
  portrait_atang_confused: new URL('../../assets/images/characters/portraits/atang/atang_confused_1.webp', import.meta.url).toString(),
  portrait_atang_excited: new URL('../../assets/images/characters/portraits/atang/atang_excited_1.webp', import.meta.url).toString(),
  portrait_atang_sad: new URL('../../assets/images/characters/portraits/atang/atang_sad_1.webp', import.meta.url).toString(),
  portrait_atang_curious: new URL('../../assets/images/characters/portraits/atang/atang_curious_1.webp', import.meta.url).toString(),
  portrait_atang_scared: new URL('../../assets/images/characters/portraits/atang/atang_scared_1.webp', import.meta.url).toString(),

  // ===== 牧平 (Muping) - 平面信徒 =====
  portrait_muping_neutral: new URL('../../assets/images/characters/portraits/muping/muping_neutral_1.webp', import.meta.url).toString(),
  portrait_muping_mysterious: new URL('../../assets/images/characters/portraits/muping/muping_mysterious_1.webp', import.meta.url).toString(),
  portrait_muping_serene: new URL('../../assets/images/characters/portraits/muping/muping_serene_1.webp', import.meta.url).toString(),
  portrait_muping_wise: new URL('../../assets/images/characters/portraits/muping/muping_wise_1.webp', import.meta.url).toString(),
  portrait_muping_sad: new URL('../../assets/images/characters/portraits/muping/muping_sad_1.webp', import.meta.url).toString(),

  // ===== 栖蓝 (Qilan) - 多余者代表 =====
  portrait_qilan_neutral: new URL('../../assets/images/characters/portraits/qilan/qilan_neutral_1.webp', import.meta.url).toString(),
  portrait_qilan_kind: new URL('../../assets/images/characters/portraits/qilan/qilan_kind_1.webp', import.meta.url).toString(),
  portrait_qilan_smiling: new URL('../../assets/images/characters/portraits/qilan/qilan_smiling_1.webp', import.meta.url).toString(),
  portrait_qilan_sad: new URL('../../assets/images/characters/portraits/qilan/qilan_sad_1.webp', import.meta.url).toString(),
  portrait_qilan_worried: new URL('../../assets/images/characters/portraits/qilan/qilan_worried_1.webp', import.meta.url).toString(),

  // ===== 陈匠 (Chenjiang) - 点灯者 =====
  portrait_chenjiang_neutral: new URL('../../assets/images/characters/portraits/chenjiang/chenjiang_neutral_1.webp', import.meta.url).toString(),
  portrait_chenjiang_hopeful: new URL('../../assets/images/characters/portraits/chenjiang/chenjiang_hopeful_1.webp', import.meta.url).toString(),
  portrait_chenjiang_focused: new URL('../../assets/images/characters/portraits/chenjiang/chenjiang_focused_1.webp', import.meta.url).toString(),
  portrait_chenjiang_kind: new URL('../../assets/images/characters/portraits/chenjiang/chenjiang_kind_1.webp', import.meta.url).toString(),
  portrait_chenjiang_tired: new URL('../../assets/images/characters/portraits/chenjiang/chenjiang_tired_1.webp', import.meta.url).toString(),
} as const;

// ==================== 场景背景 ====================

/**
 * 场景背景资产
 * 格式: bg_[章节][区域]
 */
export const SCENE_BACKGROUNDS: Record<string, string> = {
  // ===== 序章 (C0) - SVG背景 =====
  bg_c0z1_corridor: new URL('../../assets/images/backgrounds/c0/bg_c0z1.svg', import.meta.url).toString(),
  bg_c0z2_cenhui_room: new URL('../../assets/images/backgrounds/c0/bg_c0z2.svg', import.meta.url).toString(),
  bg_c0z3_alley: new URL('../../assets/images/backgrounds/c0/bg_c0z3.svg', import.meta.url).toString(),
  bg_c0z4_archive: new URL('../../assets/images/backgrounds/c0/bg_c0z4.svg', import.meta.url).toString(),
  bg_c0z5_clinic: new URL('../../assets/images/backgrounds/c0/bg_c0z4.svg', import.meta.url).toString(), // 复用bg_c0z4
  bg_c0z6_hall_street: new URL('../../assets/images/backgrounds/c0/bg_c0z3.svg', import.meta.url).toString(), // 复用bg_c0z3

  // ===== 第1章 (C1) - SVG背景 =====
  bg_c1z1_bureau: new URL('../../assets/images/backgrounds/c1/bg_c1z1.svg', import.meta.url).toString(),
  bg_c1z2_archive: new URL('../../assets/images/backgrounds/c1/bg_c1z2.svg', import.meta.url).toString(),
  bg_c1z3_gulin_office: new URL('../../assets/images/backgrounds/c1/bg_c1z3.svg', import.meta.url).toString(),
  bg_c1z4_training: new URL('../../assets/images/backgrounds/c1/bg_c1z4.svg', import.meta.url).toString(),
  bg_c1z5_field_record: new URL('../../assets/images/backgrounds/c1/bg_c1z5.svg', import.meta.url).toString(),
  bg_c1z6_mission: new URL('../../assets/images/backgrounds/c1/bg_c1z6.svg', import.meta.url).toString(),

  // ===== 第2章 (C2) =====
  bg_c2z1_training: new URL('../../assets/images/backgrounds/c2/edge_breach_1.webp', import.meta.url).toString(),
  bg_c2z2_edge_breach: new URL('../../assets/images/backgrounds/c2/edge_breach_1.webp', import.meta.url).toString(),
  bg_c2z3_clinic: new URL('../../assets/images/backgrounds/c2/clinic_1.webp', import.meta.url).toString(),
  bg_c2z4_drifter_zone: new URL('../../assets/images/backgrounds/c2/drifter_zone_1.webp', import.meta.url).toString(),
  bg_c2z5_altar: new URL('../../assets/images/backgrounds/c2/altar_1.webp', import.meta.url).toString(),
  bg_c2z6_cottage: new URL('../../assets/images/backgrounds/c2/cottage_1.webp', import.meta.url).toString(),
  bg_c2z7_rift: new URL('../../assets/images/backgrounds/c2/rift_1.webp', import.meta.url).toString(),

  // ===== 第3章 (C3) =====
  bg_c3z1_collapse: new URL('../../assets/images/backgrounds/c3/collapse_1.webp', import.meta.url).toString(),
  bg_c3z2_intervention: new URL('../../assets/images/backgrounds/c3/intervention_1.webp', import.meta.url).toString(),
  bg_c3z3_drift_trail: new URL('../../assets/images/backgrounds/c3/drift_trail_1.webp', import.meta.url).toString(),
  bg_c3z4_version_conflict: new URL('../../assets/images/backgrounds/c3/version_conflict_1.webp', import.meta.url).toString(),
  bg_c3z5_lighthouse: new URL('../../assets/images/backgrounds/c3/lighthouse_1.webp', import.meta.url).toString(),
  bg_c3z6_server_room: new URL('../../assets/images/backgrounds/c3/server_room_1.webp', import.meta.url).toString(),
  bg_c3z7_rescue: new URL('../../assets/images/backgrounds/c3/rescue_1.webp', import.meta.url).toString(),

  // ===== 第4章 (C4) =====
  bg_c4z1_time_training: new URL('../../assets/images/backgrounds/c4/time_training_1.webp', import.meta.url).toString(),
  bg_c4z2_ledger: new URL('../../assets/images/backgrounds/c4/ledger_1.webp', import.meta.url).toString(),
  bg_c4z3_time_pollution: new URL('../../assets/images/backgrounds/c4/time_pollution_1.webp', import.meta.url).toString(),
  bg_c4z4_permission: new URL('../../assets/images/backgrounds/c4/permission_1.webp', import.meta.url).toString(),
  bg_c4z5_version_archive: new URL('../../assets/images/backgrounds/c4/version_archive_1.webp', import.meta.url).toString(),
  bg_c4z6_rewind_fail: new URL('../../assets/images/backgrounds/c4/rewind_fail_1.webp', import.meta.url).toString(),
  bg_c4z7_myth_echo: new URL('../../assets/images/backgrounds/c4/myth_echo_1.webp', import.meta.url).toString(),
  bg_c4z8_patch_boundary: new URL('../../assets/images/backgrounds/c4/patch_boundary_1.webp', import.meta.url).toString(),

  // ===== 第5章 (C5) =====
  bg_c5z1_non_convergent: new URL('../../assets/images/backgrounds/c5/non_convergent_1.webp', import.meta.url).toString(),
  bg_c5z2_judgment: new URL('../../assets/images/backgrounds/c5/judgment_1.webp', import.meta.url).toString(),
  bg_c5z3_damaged_cottage: new URL('../../assets/images/backgrounds/c5/damaged_cottage_1.webp', import.meta.url).toString(),
  bg_c5z4_stutter: new URL('../../assets/images/backgrounds/c5/stutter_1.webp', import.meta.url).toString(),
  bg_c5z5_residue: new URL('../../assets/images/backgrounds/c5/residue_1.webp', import.meta.url).toString(),
  bg_c5z6_museum: new URL('../../assets/images/backgrounds/c5/museum_1.webp', import.meta.url).toString(),
  bg_c5z7_model_boundary: new URL('../../assets/images/backgrounds/c5/model_boundary_1.webp', import.meta.url).toString(),

  // ===== 终章 (CF) =====
  bg_cfz1_viewing_space: new URL('../../assets/images/backgrounds/cf/viewing_space_1.webp', import.meta.url).toString(),
  bg_cfz2_field_accept: new URL('../../assets/images/backgrounds/cf/field_accept_1.webp', import.meta.url).toString(),
  bg_cfz3_ending_a: new URL('../../assets/images/backgrounds/cf/ending_a_1.webp', import.meta.url).toString(),
  bg_cfz4_ending_b: new URL('../../assets/images/backgrounds/cf/ending_b_1.webp', import.meta.url).toString(),
  bg_cfz5_ending_c: new URL('../../assets/images/backgrounds/cf/ending_c_1.webp', import.meta.url).toString(),
  bg_cfz6_epilogue: new URL('../../assets/images/backgrounds/cf/epilogue_1.webp', import.meta.url).toString(),
} as const;

// ==================== 场景物件 ====================

/**
 * 场景物件资产 - 居住区
 */
export const OBJECTS_RESIDENTIAL: Record<string, string> = {
  obj_bed: new URL('../../assets/images/objects/residential/bed_1.webp', import.meta.url).toString(),
  obj_desk: new URL('../../assets/images/objects/residential/desk_1.webp', import.meta.url).toString(),
  obj_lamp: new URL('../../assets/images/objects/residential/lamp_1.webp', import.meta.url).toString(),
  obj_door: new URL('../../assets/images/objects/residential/door_1.webp', import.meta.url).toString(),
  obj_plant: new URL('../../assets/images/objects/residential/plant_1.webp', import.meta.url).toString(),
  obj_household: new URL('../../assets/images/objects/residential/household_1.webp', import.meta.url).toString(),
} as const;

/**
 * 场景物件资产 - 市政区
 */
export const OBJECTS_MUNICIPAL: Record<string, string> = {
  obj_office_desk: new URL('../../assets/images/objects/municipal/office_desk_1.webp', import.meta.url).toString(),
  obj_filing_cabinet: new URL('../../assets/images/objects/municipal/filing_cabinet_1.webp', import.meta.url).toString(),
  obj_monitor: new URL('../../assets/images/objects/municipal/monitor_1.webp', import.meta.url).toString(),
  obj_barrier: new URL('../../assets/images/objects/municipal/barrier_1.webp', import.meta.url).toString(),
  obj_sign: new URL('../../assets/images/objects/municipal/sign_1.webp', import.meta.url).toString(),
} as const;

/**
 * 场景物件资产 - 档案区
 */
export const OBJECTS_ARCHIVE: Record<string, string> = {
  obj_bookshelf: new URL('../../assets/images/objects/archive/bookshelf_1.webp', import.meta.url).toString(),
  obj_oil_lamp: new URL('../../assets/images/objects/archive/oil_lamp_1.webp', import.meta.url).toString(),
  obj_old_books: new URL('../../assets/images/objects/archive/old_books_1.webp', import.meta.url).toString(),
  obj_map: new URL('../../assets/images/objects/archive/map_1.webp', import.meta.url).toString(),
  obj_binding: new URL('../../assets/images/objects/archive/binding_1.webp', import.meta.url).toString(),
} as const;

/**
 * 场景物件资产 - 诊所
 */
export const OBJECTS_CLINIC: Record<string, string> = {
  obj_hospital_bed: new URL('../../assets/images/objects/clinic/hospital_bed_1.webp', import.meta.url).toString(),
  obj_medicine_cabinet: new URL('../../assets/images/objects/clinic/medicine_cabinet_1.webp', import.meta.url).toString(),
  obj_medical_equip: new URL('../../assets/images/objects/clinic/medical_equip_1.webp', import.meta.url).toString(),
  obj_chair: new URL('../../assets/images/objects/clinic/chair_1.webp', import.meta.url).toString(),
} as const;

/**
 * 场景物件资产 - 神殿
 */
export const OBJECTS_TEMPLE: Record<string, string> = {
  obj_altar: new URL('../../assets/images/objects/temple/altar_1.webp', import.meta.url).toString(),
  obj_candle: new URL('../../assets/images/objects/temple/candle_1.webp', import.meta.url).toString(),
  obj_rune: new URL('../../assets/images/objects/temple/rune_1.webp', import.meta.url).toString(),
  obj_statue: new URL('../../assets/images/objects/temple/statue_1.webp', import.meta.url).toString(),
  obj_ritual_bowl: new URL('../../assets/images/objects/temple/ritual_bowl_1.webp', import.meta.url).toString(),
} as const;

/**
 * 场景物件资产 - 边缘区
 */
export const OBJECTS_EDGE: Record<string, string> = {
  obj_crack: new URL('../../assets/images/objects/edge/crack_1.webp', import.meta.url).toString(),
  obj_warning: new URL('../../assets/images/objects/edge/warning_1.webp', import.meta.url).toString(),
  obj_ruins: new URL('../../assets/images/objects/edge/ruins_1.webp', import.meta.url).toString(),
  obj_distorted: new URL('../../assets/images/objects/edge/distorted_1.webp', import.meta.url).toString(),
} as const;

// ==================== 特效资产 ====================

/**
 * 能力特效资产
 */
export const EFFECTS_ABILITIES: Record<string, string> = {
  fx_depth_perception: new URL('../../assets/images/effects/depth_perception/depth_perception_1.webp', import.meta.url).toString(),
  fx_depth_intervention: new URL('../../assets/images/effects/depth_intervention/depth_intervention_1.webp', import.meta.url).toString(),
  fx_time_intervention: new URL('../../assets/images/effects/time_manipulation/time_manipulation_1.webp', import.meta.url).toString(),
  fx_drift_afterimage: new URL('../../assets/images/effects/abilities/drift_afterimage_1.webp', import.meta.url).toString(),
} as const;

/**
 * 系统特效资产
 */
export const EFFECTS_SYSTEM: Record<string, string> = {
  fx_system_verdict: new URL('../../assets/images/effects/system/system_verdict_1.webp', import.meta.url).toString(),
  fx_data_ripple: new URL('../../assets/images/effects/system/data_ripple_1.webp', import.meta.url).toString(),
  fx_verdict: new URL('../../assets/images/effects/verdict/verdict_1.webp', import.meta.url).toString(),
} as const;

/**
 * 环境特效资产
 */
export const EFFECTS_ENVIRONMENTAL: Record<string, string> = {
  fx_dimensional_scar: new URL('../../assets/images/effects/environmental/dimensional_scar_1.webp', import.meta.url).toString(),
  fx_scar: new URL('../../assets/images/effects/scar/scar_1.webp', import.meta.url).toString(),
  fx_drift: new URL('../../assets/images/effects/drift/drift_1.webp', import.meta.url).toString(),
} as const;

// ==================== 可动物件动画 ====================

export interface IWebpSpritesheetAsset {
  frames: string[];  // 所有帧的URL
  frameCount: number;
}

/**
 * 可动物件动画资产
 */
export const ANIMATED_OBJECTS: Record<string, IWebpSpritesheetAsset> = {
  // 台灯闪烁
  anim_lamp_flicker: {
    frames: [
      new URL('../../assets/images/objects/animated/lamp/lamp_flicker_1.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/lamp/lamp_flicker_2.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/lamp/lamp_flicker_3.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/lamp/lamp_flicker_4.webp', import.meta.url).toString(),
    ],
    frameCount: 4,
  },
  // 油灯火焰
  anim_oil_lamp: {
    frames: [
      new URL('../../assets/images/objects/animated/oil_lamp/oil_lamp_1.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/oil_lamp/oil_lamp_2.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/oil_lamp/oil_lamp_3.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/oil_lamp/oil_lamp_4.webp', import.meta.url).toString(),
    ],
    frameCount: 4,
  },
  // 蜡烛燃烧
  anim_candle: {
    frames: [
      new URL('../../assets/images/objects/animated/candle/candle_1.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/candle/candle_2.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/candle/candle_3.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/candle/candle_4.webp', import.meta.url).toString(),
    ],
    frameCount: 4,
  },
  // 监视器闪烁
  anim_monitor: {
    frames: [
      new URL('../../assets/images/objects/animated/monitor/monitor_1.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/monitor/monitor_2.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/monitor/monitor_3.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/monitor/monitor_4.webp', import.meta.url).toString(),
    ],
    frameCount: 4,
  },
  // 裂缝颤动
  anim_crack: {
    frames: [
      new URL('../../assets/images/objects/animated/crack/crack_1.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/crack/crack_2.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/crack/crack_3.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/crack/crack_4.webp', import.meta.url).toString(),
    ],
    frameCount: 4,
  },
  // 符文发光
  anim_rune: {
    frames: [
      new URL('../../assets/images/objects/animated/rune/rune_1.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/rune/rune_2.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/rune/rune_3.webp', import.meta.url).toString(),
      new URL('../../assets/images/objects/animated/rune/rune_4.webp', import.meta.url).toString(),
    ],
    frameCount: 4,
  },
} as const;

// ==================== 整合导出 ====================

/**
 * 所有场景物件（合并）
 */
export const ALL_SCENE_OBJECTS: Record<string, string> = {
  ...OBJECTS_RESIDENTIAL,
  ...OBJECTS_MUNICIPAL,
  ...OBJECTS_ARCHIVE,
  ...OBJECTS_CLINIC,
  ...OBJECTS_TEMPLE,
  ...OBJECTS_EDGE,
} as const;

/**
 * 所有特效（合并）
 */
export const ALL_EFFECTS: Record<string, string> = {
  ...EFFECTS_ABILITIES,
  ...EFFECTS_SYSTEM,
  ...EFFECTS_ENVIRONMENTAL,
} as const;

/**
 * 统计信息
 */
export const WEBP_ASSET_STATS = {
  portraits: Object.keys(CHARACTER_PORTRAITS).length,
  backgrounds: Object.keys(SCENE_BACKGROUNDS).length,
  objects: Object.keys(ALL_SCENE_OBJECTS).length,
  effects: Object.keys(ALL_EFFECTS).length,
  animated: Object.keys(ANIMATED_OBJECTS).length,
  get total(): number {
    return this.portraits + this.backgrounds + this.objects + this.effects + this.animated;
  },
} as const;

console.log(`[WebpAssets] 已注册 ${WEBP_ASSET_STATS.total} 个webp资产`);

