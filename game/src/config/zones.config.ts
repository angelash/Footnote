/**
 * Zone场景配置文件
 *
 * 定义游戏中所有Zone的信息和背景资产映射
 */

/**
 * 章节ID枚举
 */
export enum ChapterId {
  C0 = 'c0', // 序章
  C1 = 'c1', // 第1章
  C2 = 'c2', // 第2章
  C3 = 'c3', // 第3章
  C4 = 'c4', // 第4章
  C5 = 'c5', // 第5章
  CF = 'cf', // 终章
}

/**
 * Zone信息接口
 */
export interface IZoneInfo {
  id: string; // Zone ID (如 C0-Z1)
  chapter: ChapterId; // 所属章节
  name: string; // Zone名称
  description: string; // Zone描述
  backgroundKey: string; // 背景纹理键名
  ambience?: string; // 环境音效ID
  unlockCondition?: string; // 解锁条件描述
}

/**
 * Zone配置表
 */
export const ZONES: Record<string, IZoneInfo> = {
  // ===== 序章 (C0) =====
  'C0-Z1': {
    id: 'C0-Z1',
    chapter: ChapterId.C0,
    name: '宿舍走廊',
    description: '维修局新人宿舍的走廊，灯光昏暗。',
    backgroundKey: 'bg_c0z1_corridor',
  },
  'C0-Z2': {
    id: 'C0-Z2',
    chapter: ChapterId.C0,
    name: '早餐小店',
    description: '巷口食堂，维修局员工的早餐去处。',
    backgroundKey: 'bg_c0z2_breakfast_shop',
  },
  'C0-Z3': {
    id: 'C0-Z3',
    chapter: ChapterId.C0,
    name: '薄墙巷口',
    description: '两栋建筑之间的狭窄巷道。',
    backgroundKey: 'bg_c0z3_alley',
  },
  'C0-Z4': {
    id: 'C0-Z4',
    chapter: ChapterId.C0,
    name: '维修局前台',
    description: '维修局行政办事前台，秩序井然。',
    backgroundKey: 'bg_c0z4_bureau_reception',
  },
  'C0-Z5': {
    id: 'C0-Z5',
    chapter: ChapterId.C0,
    name: '废弃诊室',
    description: '已经废弃的诊疗室，设备老旧。',
    backgroundKey: 'bg_c0z5_clinic',
  },
  'C0-Z6': {
    id: 'C0-Z6',
    chapter: ChapterId.C0,
    name: '礼堂街',
    description: '通往礼堂的主街道。',
    backgroundKey: 'bg_c0z6_hall_street',
  },

  // ===== 第1章 (C1) =====
  'C1-Z1': {
    id: 'C1-Z1',
    chapter: ChapterId.C1,
    name: '市政办事厅',
    description: '维修局的行政办事大厅。',
    backgroundKey: 'bg_c1z1_bureau',
  },
  'C1-Z2': {
    id: 'C1-Z2',
    chapter: ChapterId.C1,
    name: '顾临办公室',
    description: '维修局主管顾临的办公室。',
    backgroundKey: 'bg_c1z2_archive',
  },
  'C1-Z3': {
    id: 'C1-Z3',
    chapter: ChapterId.C1,
    name: '居住区路口',
    description: '居民区的主要路口。',
    backgroundKey: 'bg_c1z3_gulin_office',
  },
  'C1-Z4': {
    id: 'C1-Z4',
    chapter: ChapterId.C1,
    name: '宋岚地图屋',
    description: '宋岚的工作室，满是地图和档案。',
    backgroundKey: 'bg_c1z4_training',
  },
  'C1-Z5': {
    id: 'C1-Z5',
    chapter: ChapterId.C1,
    name: '诊疗台候诊区',
    description: '许澄诊所的候诊区域。',
    backgroundKey: 'bg_c1z5_field_record',
  },
  'C1-Z6': {
    id: 'C1-Z6',
    chapter: ChapterId.C1,
    name: '礼堂街入口',
    description: '礼堂街的入口区域。',
    backgroundKey: 'bg_c1z6_mission',
  },

  // ===== 第2章 (C2) =====
  'C2-Z1': {
    id: 'C2-Z1',
    chapter: ChapterId.C2,
    name: '深度感知教学区',
    description: '学习深度感知能力的训练场所。',
    backgroundKey: 'bg_c2z1_training',
  },
  'C2-Z2': {
    id: 'C2-Z2',
    chapter: ChapterId.C2,
    name: '边缘断口入口',
    description: '通向边缘断口的危险区域入口。',
    backgroundKey: 'bg_c2z2_edge_breach',
  },
  'C2-Z3': {
    id: 'C2-Z3',
    chapter: ChapterId.C2,
    name: '许澄诊疗室',
    description: '许澄的主诊室，设备完善。',
    backgroundKey: 'bg_c2z3_clinic',
  },
  'C2-Z4': {
    id: 'C2-Z4',
    chapter: ChapterId.C2,
    name: '漂移者聚集点',
    description: '漂移者们聚集的地方。',
    backgroundKey: 'bg_c2z4_drifter_zone',
  },
  'C2-Z5': {
    id: 'C2-Z5',
    chapter: ChapterId.C2,
    name: '牧平祭坛',
    description: '牧平进行祭祀的神秘场所。',
    backgroundKey: 'bg_c2z5_altar',
  },
  'C2-Z6': {
    id: 'C2-Z6',
    chapter: ChapterId.C2,
    name: '栖蓝住所',
    description: '栖蓝居住的简陋小屋。',
    backgroundKey: 'bg_c2z6_cottage',
  },
  'C2-Z7': {
    id: 'C2-Z7',
    chapter: ChapterId.C2,
    name: '深度格裂隙',
    description: '空间裂隙，可窥见更深层。',
    backgroundKey: 'bg_c2z7_rift',
  },

  // ===== 第3章 (C3) =====
  'C3-Z1': {
    id: 'C3-Z1',
    chapter: ChapterId.C3,
    name: '结构崩塌点',
    description: '世界结构崩塌的危险区域。',
    backgroundKey: 'bg_c3z1_collapse',
  },
  'C3-Z2': {
    id: 'C3-Z2',
    chapter: ChapterId.C3,
    name: '深度介入教学区',
    description: '学习深度介入能力的场所。',
    backgroundKey: 'bg_c3z2_intervention',
  },
  'C3-Z3': {
    id: 'C3-Z3',
    chapter: ChapterId.C3,
    name: '阿棠漂移路径',
    description: '跟随阿棠漂移的轨迹。',
    backgroundKey: 'bg_c3z3_drift_trail',
  },
  'C3-Z4': {
    id: 'C3-Z4',
    chapter: ChapterId.C3,
    name: '版本冲突现场',
    description: '不同版本世界交叠的混乱地带。',
    backgroundKey: 'bg_c3z4_version_conflict',
  },
  'C3-Z5': {
    id: 'C3-Z5',
    chapter: ChapterId.C3,
    name: '陈匠灯塔',
    description: '陈匠坚守的灯塔，照亮黑暗。',
    backgroundKey: 'bg_c3z5_lighthouse',
  },
  'C3-Z6': {
    id: 'C3-Z6',
    chapter: ChapterId.C3,
    name: '收敛运行室外围',
    description: '核心收敛系统的外围区域。',
    backgroundKey: 'bg_c3z6_server_room',
  },
  'C3-Z7': {
    id: 'C3-Z7',
    chapter: ChapterId.C3,
    name: '救援无法归档点',
    description: '无法被系统记录的救援现场。',
    backgroundKey: 'bg_c3z7_rescue',
  },

  // ===== 第4章 (C4) =====
  'C4-Z1': {
    id: 'C4-Z1',
    chapter: ChapterId.C4,
    name: '时间干预教学区',
    description: '学习时间干预能力的禁忌场所。',
    backgroundKey: 'bg_c4z1_time_training',
  },
  'C4-Z2': {
    id: 'C4-Z2',
    chapter: ChapterId.C4,
    name: '因果账本存放处',
    description: '存放因果记录的神秘档案库。',
    backgroundKey: 'bg_c4z2_ledger',
  },
  'C4-Z3': {
    id: 'C4-Z3',
    chapter: ChapterId.C4,
    name: '时间污染区',
    description: '被时间干预污染的区域。',
    backgroundKey: 'bg_c4z3_time_pollution',
  },
  'C4-Z4': {
    id: 'C4-Z4',
    chapter: ChapterId.C4,
    name: '顾临权限室',
    description: '顾临的高权限控制室。',
    backgroundKey: 'bg_c4z4_permission',
  },
  'C4-Z5': {
    id: 'C4-Z5',
    chapter: ChapterId.C4,
    name: '宋岚版本库',
    description: '宋岚保管的版本档案库。',
    backgroundKey: 'bg_c4z5_version_archive',
  },
  'C4-Z6': {
    id: 'C4-Z6',
    chapter: ChapterId.C4,
    name: '回溯失败点',
    description: '时间回溯失败的残留点。',
    backgroundKey: 'bg_c4z6_rewind_fail',
  },
  'C4-Z7': {
    id: 'C4-Z7',
    chapter: ChapterId.C4,
    name: '牧平神话残响室',
    description: '神话残响回荡的神秘空间。',
    backgroundKey: 'bg_c4z7_myth_echo',
  },
  'C4-Z8': {
    id: 'C4-Z8',
    chapter: ChapterId.C4,
    name: '补丁边界',
    description: '系统补丁的边界区域。',
    backgroundKey: 'bg_c4z8_patch_boundary',
  },

  // ===== 第5章 (C5) =====
  'C5-Z1': {
    id: 'C5-Z1',
    chapter: ChapterId.C5,
    name: '无法收敛区域',
    description: '系统无法收敛的混沌区域。',
    backgroundKey: 'bg_c5z1_non_convergent',
  },
  'C5-Z2': {
    id: 'C5-Z2',
    chapter: ChapterId.C5,
    name: '系统判定室',
    description: '系统进行最终判定的场所。',
    backgroundKey: 'bg_c5z2_judgment',
  },
  'C5-Z3': {
    id: 'C5-Z3',
    chapter: ChapterId.C5,
    name: '栖蓝最后据点',
    description: '栖蓝的最后藏身之所。',
    backgroundKey: 'bg_c5z3_damaged_cottage',
  },
  'C5-Z4': {
    id: 'C5-Z4',
    chapter: ChapterId.C5,
    name: '顾临卡顿现场',
    description: '顾临系统卡顿的现场。',
    backgroundKey: 'bg_c5z4_stutter',
  },
  'C5-Z5': {
    id: 'C5-Z5',
    chapter: ChapterId.C5,
    name: 'R值显影点',
    description: 'R值首次可见的地方。',
    backgroundKey: 'bg_c5z5_residue',
  },
  'C5-Z6': {
    id: 'C5-Z6',
    chapter: ChapterId.C5,
    name: '多余行为博物馆',
    description: '收藏"多余"行为记录的博物馆。',
    backgroundKey: 'bg_c5z6_museum',
  },
  'C5-Z7': {
    id: 'C5-Z7',
    chapter: ChapterId.C5,
    name: '模型边界',
    description: '世界模型的最外层边界。',
    backgroundKey: 'bg_c5z7_model_boundary',
  },

  // ===== 终章 (CF) =====
  'CF-Z1': {
    id: 'CF-Z1',
    chapter: ChapterId.CF,
    name: '对视空间',
    description: '与更高层对视的空间。',
    backgroundKey: 'bg_cfz1_viewing_space',
  },
  'CF-Z2': {
    id: 'CF-Z2',
    chapter: ChapterId.CF,
    name: '字段接受室',
    description: '接受字段承载的场所。',
    backgroundKey: 'bg_cfz2_field_accept',
  },
  'CF-Z3': {
    id: 'CF-Z3',
    chapter: ChapterId.CF,
    name: '结局A-平面稳定',
    description: '选择继续收敛，保住可读性。',
    backgroundKey: 'bg_cfz3_ending_a',
  },
  'CF-Z4': {
    id: 'CF-Z4',
    chapter: ChapterId.CF,
    name: '结局B-真实释放',
    description: '选择松动表示，让涌现回归。',
    backgroundKey: 'bg_cfz4_ending_b',
  },
  'CF-Z5': {
    id: 'CF-Z5',
    chapter: ChapterId.CF,
    name: '结局C-成为系统',
    description: '选择成为新的字段承载者。',
    backgroundKey: 'bg_cfz5_ending_c',
  },
  'CF-Z6': {
    id: 'CF-Z6',
    chapter: ChapterId.CF,
    name: '尾声空间',
    description: '故事的尾声。',
    backgroundKey: 'bg_cfz6_epilogue',
  },
};

/**
 * 获取Zone背景纹理键名
 * @param zoneId Zone ID (如 C2-Z1)
 * @returns 背景纹理键名
 */
export function getZoneBackgroundKey(zoneId: string): string {
  const zone = ZONES[zoneId];
  return zone?.backgroundKey ?? 'placeholder_bg';
}

/**
 * 获取指定章节的所有Zone
 * @param chapterId 章节ID
 * @returns Zone数组
 */
export function getZonesByChapter(chapterId: ChapterId): IZoneInfo[] {
  return Object.values(ZONES).filter((zone) => zone.chapter === chapterId);
}

/**
 * 获取章节Zone数量
 * @param chapterId 章节ID
 * @returns Zone数量
 */
export function getZoneCountByChapter(chapterId: ChapterId): number {
  return getZonesByChapter(chapterId).length;
}
