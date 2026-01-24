/**
 * Zone 完整数据配置
 * 包含交互点、出口、R值机会等完整信息
 * 基于 IZone 接口定义
 * @module data/zones.data
 */

import type { IZone } from '@/types';
import { CONSTANTS } from '@/config/game.config';
import type { ChapterID, ZoneType } from '@/config/game.config';

// ==================== C0 序章 Zone 数据 ====================

const C0_Z1_CORRIDOR: IZone = {
  id: 'C0-Z1',
  name: '宿舍走廊',
  chapter: 'C0',
  type: CONSTANTS.ZONE_TYPE.LIFE,
  focus: '新手引导、身份确认',
  characters: ['岑回'],
  entry: {
    dialogue: 'C0Z1_WAKEUP',
  },
  interactions: [
    {
      id: 'C0Z1_NOTICE_BOARD',
      type: 'examine',
      position: [0.3, 0.5],
      label: '告示牌',
      trigger: {
        dialogue: 'C0Z1_NOTICE_BOARD_DIALOGUE',
        card: 'CARD_C0_001',
      },
    },
    {
      id: 'C0Z1_NEIGHBOR_DOOR',
      type: 'examine',
      position: [0.7, 0.4],
      label: '邻居房门',
      trigger: {
        dialogue: 'C0Z1_NEIGHBOR_DOOR_DIALOGUE',
      },
    },
    {
      id: 'C0Z1_IDENTITY_CHECK',
      type: 'special',
      position: [0.5, 0.6],
      label: '身份确认',
      trigger: {
        dialogue: 'C0Z1_IDENTITY_PICKUP',
        card: 'CARD_C0_002',
        foreshadow: ['F01', 'plant'],
      },
    },
  ],
  exits: [
    {
      to: 'C0-Z2',
      position: [0.9, 0.5],
      label: '前往早餐小店',
      condition: 'dialogue_complete',
    },
  ],
  rOpportunities: [
    {
      id: 'C0Z1_R1',
      description: '仔细查看告示牌上的模糊字迹',
      rValue: 1,
    },
  ],
  pCost: 0,
  background: 'bg_c0z1_corridor',
};

const C0_Z2_BREAKFAST: IZone = {
  id: 'C0-Z2',
  name: '早餐小店',
  chapter: 'C0',
  type: CONSTANTS.ZONE_TYPE.LIFE,
  focus: '社交互动、信息收集',
  characters: ['岑回', '店主'],
  entry: {
    dialogue: 'C0Z2_ENTRY',
  },
  interactions: [
    {
      id: 'C0Z2_SHOPKEEPER',
      type: 'talk',
      position: [0.5, 0.4],
      label: '店主',
      trigger: {
        dialogue: 'C0Z2_SHOPKEEPER_TALK',
      },
    },
    {
      id: 'C0Z2_MENU',
      type: 'examine',
      position: [0.3, 0.6],
      label: '菜单',
      trigger: {
        dialogue: 'C0Z2_MENU_EXAMINE',
        card: 'CARD_C0_003',
      },
    },
    {
      id: 'C0Z2_OTHER_CUSTOMER',
      type: 'talk',
      position: [0.7, 0.5],
      label: '其他客人',
      trigger: {
        dialogue: 'C0Z2_CUSTOMER_TALK',
      },
      condition: {
        dialogueCompleted: 'C0Z2_SHOPKEEPER_TALK',
      },
    },
  ],
  exits: [
    {
      to: 'C0-Z1',
      position: [0.1, 0.5],
      label: '返回宿舍走廊',
    },
    {
      to: 'C0-Z3',
      position: [0.9, 0.5],
      label: '前往薄墙巷口',
      condition: {
        dialogueCompleted: 'C0Z2_SHOPKEEPER_TALK',
      },
    },
  ],
  rOpportunities: [
    {
      id: 'C0Z2_R1',
      description: '询问店主关于"消失的邻居"',
      rValue: 1,
    },
  ],
  pCost: 0,
  background: 'bg_c0z2_breakfast_shop',
};

const C0_Z3_ALLEY: IZone = {
  id: 'C0-Z3',
  name: '薄墙巷口',
  chapter: 'C0',
  type: CONSTANTS.ZONE_TYPE.STRUCTURAL,
  focus: '空间异常初体验',
  characters: ['岑回'],
  entry: {
    dialogue: 'C0Z3_ENTRY',
  },
  interactions: [
    {
      id: 'C0Z3_THIN_WALL',
      type: 'examine',
      position: [0.4, 0.5],
      label: '薄墙',
      trigger: {
        dialogue: 'C0Z3_THIN_WALL_EXAMINE',
        foreshadow: ['F02', 'plant'],
      },
    },
    {
      id: 'C0Z3_STRANGE_MARK',
      type: 'examine',
      position: [0.6, 0.4],
      label: '奇怪的标记',
      trigger: {
        card: 'CARD_C0_004',
      },
    },
  ],
  exits: [
    {
      to: 'C0-Z2',
      position: [0.1, 0.5],
      label: '返回早餐小店',
    },
    {
      to: 'C0-Z4',
      position: [0.9, 0.5],
      label: '前往维修局前台',
      condition: {
        hasCard: 'CARD_C0_002',
      },
    },
  ],
  rOpportunities: [
    {
      id: 'C0Z3_R1',
      description: '触摸薄墙时感受到的震动',
      rValue: 1,
    },
    {
      id: 'C0Z3_R2',
      description: '记录标记的形状',
      rValue: 1,
    },
  ],
  pCost: 0,
  background: 'bg_c0z3_alley',
};

const C0_Z4_RECEPTION: IZone = {
  id: 'C0-Z4',
  name: '维修局前台',
  chapter: 'C0',
  type: CONSTANTS.ZONE_TYPE.LIFE,
  focus: '正式入职、系统介绍',
  characters: ['岑回', '顾临'],
  entry: {
    dialogue: 'C0Z4_ENTRY',
  },
  interactions: [
    {
      id: 'C0Z4_RECEPTIONIST',
      type: 'talk',
      position: [0.5, 0.4],
      label: '前台接待',
      trigger: {
        dialogue: 'C0Z4_RECEPTIONIST_TALK',
      },
    },
    {
      id: 'C0Z4_GULIN_OFFICE',
      type: 'talk',
      position: [0.7, 0.5],
      label: '顾临办公室',
      trigger: {
        dialogue: 'C0Z4_GULIN_FIRST_MEET',
        card: 'CARD_C0_005',
        foreshadow: ['F03', 'plant'],
      },
      condition: {
        dialogueCompleted: 'C0Z4_RECEPTIONIST_TALK',
      },
    },
    {
      id: 'C0Z4_BULLETIN',
      type: 'examine',
      position: [0.3, 0.6],
      label: '公告栏',
      trigger: {
        dialogue: 'C0Z4_BULLETIN_READ',
      },
    },
  ],
  exits: [
    {
      to: 'C0-Z3',
      position: [0.1, 0.5],
      label: '返回薄墙巷口',
    },
    {
      to: 'C0-Z5',
      position: [0.9, 0.5],
      label: '前往废弃诊室',
      condition: {
        dialogueCompleted: 'C0Z4_GULIN_FIRST_MEET',
      },
    },
  ],
  rOpportunities: [
    {
      id: 'C0Z4_R1',
      description: '注意到顾临桌上的旧照片',
      rValue: 1,
    },
  ],
  pCost: 0,
  background: 'bg_c0z4_bureau_reception',
};

const C0_Z5_CLINIC: IZone = {
  id: 'C0-Z5',
  name: '废弃诊室',
  chapter: 'C0',
  type: CONSTANTS.ZONE_TYPE.CAUSAL,
  focus: '许澄初见、医疗系统介绍',
  characters: ['岑回', '许澄'],
  entry: {
    dialogue: 'C0Z5_ENTRY',
  },
  interactions: [
    {
      id: 'C0Z5_XUCHEN',
      type: 'talk',
      position: [0.5, 0.4],
      label: '许澄',
      trigger: {
        dialogue: 'C0Z5_XUCHEN_FIRST_MEET',
        card: 'CARD_C0_006',
      },
    },
    {
      id: 'C0Z5_OLD_EQUIPMENT',
      type: 'examine',
      position: [0.3, 0.6],
      label: '旧设备',
      trigger: {
        dialogue: 'C0Z5_EQUIPMENT_EXAMINE',
      },
    },
    {
      id: 'C0Z5_MEDICAL_RECORDS',
      type: 'examine',
      position: [0.7, 0.5],
      label: '病历档案',
      trigger: {
        card: 'CARD_C0_007',
        foreshadow: ['F04', 'plant'],
      },
      condition: {
        dialogueCompleted: 'C0Z5_XUCHEN_FIRST_MEET',
      },
    },
  ],
  exits: [
    {
      to: 'C0-Z4',
      position: [0.1, 0.5],
      label: '返回维修局前台',
    },
    {
      to: 'C0-Z6',
      position: [0.9, 0.5],
      label: '前往礼堂街',
      condition: {
        hasCard: 'CARD_C0_006',
      },
    },
  ],
  rOpportunities: [
    {
      id: 'C0Z5_R1',
      description: '翻阅许澄留下的笔记',
      rValue: 2,
    },
  ],
  pCost: 0,
  background: 'bg_c0z5_clinic',
};

const C0_Z6_HALL_STREET: IZone = {
  id: 'C0-Z6',
  name: '礼堂街',
  chapter: 'C0',
  type: CONSTANTS.ZONE_TYPE.CONFLICT,
  focus: '序章结束、牧平初见',
  characters: ['岑回', '牧平'],
  entry: {
    dialogue: 'C0Z6_ENTRY',
  },
  interactions: [
    {
      id: 'C0Z6_MUPING',
      type: 'talk',
      position: [0.5, 0.5],
      label: '牧平',
      trigger: {
        dialogue: 'C0Z6_MUPING_FIRST_MEET',
        card: 'CARD_C0_008',
        foreshadow: ['F05', 'plant'],
      },
    },
    {
      id: 'C0Z6_STREET_SCENE',
      type: 'examine',
      position: [0.3, 0.6],
      label: '街景',
      trigger: {
        dialogue: 'C0Z6_STREET_EXAMINE',
      },
    },
    {
      id: 'C0Z6_CROWD',
      type: 'examine',
      position: [0.7, 0.4],
      label: '人群',
      trigger: {
        dialogue: 'C0Z6_CROWD_OBSERVE',
        card: 'CARD_C0_009',
      },
      condition: {
        dialogueCompleted: 'C0Z6_MUPING_FIRST_MEET',
      },
    },
  ],
  exits: [
    {
      to: 'C0-Z5',
      position: [0.1, 0.5],
      label: '返回废弃诊室',
    },
    {
      to: 'C1-Z1',
      position: [0.9, 0.5],
      label: '进入第一章',
      condition: {
        dialogueCompleted: 'C0Z6_MUPING_FIRST_MEET',
      },
    },
  ],
  rOpportunities: [
    {
      id: 'C0Z6_R1',
      description: '倾听牧平讲述的神话故事',
      rValue: 2,
    },
  ],
  pCost: 0,
  background: 'bg_c0z6_hall_street',
};

// ==================== Zone 数据汇总 ====================

/**
 * 所有 Zone 数据
 * 按章节组织
 */
export const ZONE_DATA: Record<string, IZone> = {
  // C0 序章
  'C0-Z1': C0_Z1_CORRIDOR,
  'C0-Z2': C0_Z2_BREAKFAST,
  'C0-Z3': C0_Z3_ALLEY,
  'C0-Z4': C0_Z4_RECEPTION,
  'C0-Z5': C0_Z5_CLINIC,
  'C0-Z6': C0_Z6_HALL_STREET,

  // C1-CF 章节的 Zone 数据需要根据具体设计文档补充
  // 以下是占位结构，展示数据格式
};

/**
 * 获取所有 Zone 数据数组
 */
export function getAllZoneData(): IZone[] {
  return Object.values(ZONE_DATA);
}

/**
 * 获取指定章节的 Zone 数据
 */
export function getZoneDataByChapter(chapter: ChapterID): IZone[] {
  return Object.values(ZONE_DATA).filter(z => z.chapter === chapter);
}

/**
 * 获取指定 Zone 的数据
 */
export function getZoneData(zoneId: string): IZone | undefined {
  return ZONE_DATA[zoneId];
}

/**
 * 创建空白 Zone 模板（用于快速扩展）
 */
export function createZoneTemplate(
  id: string,
  name: string,
  chapter: ChapterID,
  type: ZoneType = CONSTANTS.ZONE_TYPE.LIFE
): IZone {
  return {
    id,
    name,
    chapter,
    type,
    focus: '',
    characters: [],
    interactions: [],
    exits: [],
    rOpportunities: [],
    pCost: 0,
    background: `bg_${id.toLowerCase().replace('-', '')}`,
  };
}

/**
 * Zone 类型到默认 P 消耗的映射
 * - life: 日常生活区域，无P消耗
 * - structural: 结构异常区域，轻度P消耗
 * - causal: 因果关联区域，中度P消耗
 * - conflict: 冲突对抗区域，重度P消耗
 */
export const ZONE_TYPE_P_COST: Record<ZoneType, number> = {
  [CONSTANTS.ZONE_TYPE.LIFE]: 0,
  [CONSTANTS.ZONE_TYPE.STRUCTURAL]: 1,
  [CONSTANTS.ZONE_TYPE.CAUSAL]: 2,
  [CONSTANTS.ZONE_TYPE.CONFLICT]: 3,
};
