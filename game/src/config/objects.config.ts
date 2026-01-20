/**
 * 场景物件配置文件
 *
 * 定义游戏中所有可交互物件的信息
 */

/**
 * 物件区域类型
 */
export enum ObjectAreaType {
  RESIDENTIAL = 'residential', // 居住区
  MUNICIPAL = 'municipal', // 市政区
  ARCHIVE = 'archive', // 档案区
  CLINIC = 'clinic', // 诊所
  TEMPLE = 'temple', // 神殿
  EDGE = 'edge', // 边缘区
}

/**
 * 物件交互类型
 */
export enum ObjectInteractionType {
  NONE = 'none', // 无交互（纯装饰）
  EXAMINE = 'examine', // 检查（弹出描述）
  COLLECT = 'collect', // 收集（获得道具）
  USE = 'use', // 使用（触发事件）
  DIALOGUE = 'dialogue', // 对话（触发对话）
}

/**
 * 物件信息接口
 */
export interface IObjectInfo {
  id: string; // 物件ID
  name: string; // 物件名称
  description: string; // 物件描述
  textureKey: string; // 纹理键名
  area: ObjectAreaType; // 所属区域
  interaction: ObjectInteractionType; // 交互类型
  animationKey?: string; // 动画键名（可动物件）
  dialogueId?: string; // 关联对话ID
  itemId?: string; // 关联道具ID
}

/**
 * 场景物件配置表
 */
export const SCENE_OBJECTS: Record<string, IObjectInfo> = {
  // ===== 居住区物件 =====
  obj_bed: {
    id: 'obj_bed',
    name: '床铺',
    description: '简单的单人床，被褥整洁。',
    textureKey: 'obj_bed',
    area: ObjectAreaType.RESIDENTIAL,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_desk: {
    id: 'obj_desk',
    name: '书桌',
    description: '木制书桌，上面堆放着一些文件。',
    textureKey: 'obj_desk',
    area: ObjectAreaType.RESIDENTIAL,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_lamp: {
    id: 'obj_lamp',
    name: '台灯',
    description: '台灯发出微弱的光芒，偶尔闪烁。',
    textureKey: 'obj_lamp',
    area: ObjectAreaType.RESIDENTIAL,
    interaction: ObjectInteractionType.USE,
    animationKey: 'webp_lamp_flicker',
  },
  obj_door: {
    id: 'obj_door',
    name: '门',
    description: '通往其他区域的门。',
    textureKey: 'obj_door',
    area: ObjectAreaType.RESIDENTIAL,
    interaction: ObjectInteractionType.USE,
  },
  obj_plant: {
    id: 'obj_plant',
    name: '盆栽',
    description: '一盆绿植，在昏暗中仍顽强生长。',
    textureKey: 'obj_plant',
    area: ObjectAreaType.RESIDENTIAL,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_household: {
    id: 'obj_household',
    name: '家具',
    description: '普通的家用物品。',
    textureKey: 'obj_household',
    area: ObjectAreaType.RESIDENTIAL,
    interaction: ObjectInteractionType.NONE,
  },

  // ===== 市政区物件 =====
  obj_office_desk: {
    id: 'obj_office_desk',
    name: '办公桌',
    description: '维修局的标准办公桌，上面有电脑终端。',
    textureKey: 'obj_office_desk',
    area: ObjectAreaType.MUNICIPAL,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_filing_cabinet: {
    id: 'obj_filing_cabinet',
    name: '档案柜',
    description: '存放各类报告和记录的档案柜。',
    textureKey: 'obj_filing_cabinet',
    area: ObjectAreaType.MUNICIPAL,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_monitor: {
    id: 'obj_monitor',
    name: '监视器',
    description: '显示系统状态的监视器，画面不时闪烁。',
    textureKey: 'obj_monitor',
    area: ObjectAreaType.MUNICIPAL,
    interaction: ObjectInteractionType.EXAMINE,
    animationKey: 'webp_monitor',
  },
  obj_barrier: {
    id: 'obj_barrier',
    name: '隔离带',
    description: '用于隔离危险区域的隔离带。',
    textureKey: 'obj_barrier',
    area: ObjectAreaType.MUNICIPAL,
    interaction: ObjectInteractionType.NONE,
  },
  obj_sign: {
    id: 'obj_sign',
    name: '指示牌',
    description: '标注区域方向的指示牌。',
    textureKey: 'obj_sign',
    area: ObjectAreaType.MUNICIPAL,
    interaction: ObjectInteractionType.EXAMINE,
  },

  // ===== 档案区物件 =====
  obj_bookshelf: {
    id: 'obj_bookshelf',
    name: '书架',
    description: '堆满旧书和档案的高大书架。',
    textureKey: 'obj_bookshelf',
    area: ObjectAreaType.ARCHIVE,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_oil_lamp: {
    id: 'obj_oil_lamp',
    name: '油灯',
    description: '老式油灯，火焰摇曳不定。',
    textureKey: 'obj_oil_lamp',
    area: ObjectAreaType.ARCHIVE,
    interaction: ObjectInteractionType.USE,
    animationKey: 'webp_oil_lamp',
  },
  obj_old_books: {
    id: 'obj_old_books',
    name: '旧书堆',
    description: '堆叠的旧书，有些已经破损。',
    textureKey: 'obj_old_books',
    area: ObjectAreaType.ARCHIVE,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_map: {
    id: 'obj_map',
    name: '地图',
    description: '宋岚绘制的层间地图，标注着各种记录。',
    textureKey: 'obj_map',
    area: ObjectAreaType.ARCHIVE,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_binding: {
    id: 'obj_binding',
    name: '装订材料',
    description: '用于装订档案的材料。',
    textureKey: 'obj_binding',
    area: ObjectAreaType.ARCHIVE,
    interaction: ObjectInteractionType.NONE,
  },

  // ===== 诊所物件 =====
  obj_hospital_bed: {
    id: 'obj_hospital_bed',
    name: '病床',
    description: '诊所的病床，配有简单的监护设备。',
    textureKey: 'obj_hospital_bed',
    area: ObjectAreaType.CLINIC,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_medicine_cabinet: {
    id: 'obj_medicine_cabinet',
    name: '药柜',
    description: '存放各种药品的玻璃柜。',
    textureKey: 'obj_medicine_cabinet',
    area: ObjectAreaType.CLINIC,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_medical_equip: {
    id: 'obj_medical_equip',
    name: '医疗设备',
    description: '许澄使用的诊疗设备。',
    textureKey: 'obj_medical_equip',
    area: ObjectAreaType.CLINIC,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_chair: {
    id: 'obj_chair',
    name: '椅子',
    description: '候诊区的椅子。',
    textureKey: 'obj_chair',
    area: ObjectAreaType.CLINIC,
    interaction: ObjectInteractionType.NONE,
  },

  // ===== 神殿物件 =====
  obj_altar: {
    id: 'obj_altar',
    name: '祭坛',
    description: '牧平进行仪式的祭坛，刻有神秘符文。',
    textureKey: 'obj_altar',
    area: ObjectAreaType.TEMPLE,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_candle: {
    id: 'obj_candle',
    name: '蜡烛',
    description: '祭坛上燃烧的蜡烛，火焰不受风影响。',
    textureKey: 'obj_candle',
    area: ObjectAreaType.TEMPLE,
    interaction: ObjectInteractionType.EXAMINE,
    animationKey: 'webp_candle',
  },
  obj_rune: {
    id: 'obj_rune',
    name: '符文',
    description: '刻在地面上的古老符文，隐隐发光。',
    textureKey: 'obj_rune',
    area: ObjectAreaType.TEMPLE,
    interaction: ObjectInteractionType.EXAMINE,
    animationKey: 'webp_rune',
  },
  obj_statue: {
    id: 'obj_statue',
    name: '雕像',
    description: '不知代表何物的古老雕像。',
    textureKey: 'obj_statue',
    area: ObjectAreaType.TEMPLE,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_ritual_bowl: {
    id: 'obj_ritual_bowl',
    name: '祭碗',
    description: '用于仪式的青铜碗。',
    textureKey: 'obj_ritual_bowl',
    area: ObjectAreaType.TEMPLE,
    interaction: ObjectInteractionType.EXAMINE,
  },

  // ===== 边缘区物件 =====
  obj_crack: {
    id: 'obj_crack',
    name: '裂缝',
    description: '空间中的裂缝，不断颤动，仿佛在呼吸。',
    textureKey: 'obj_crack',
    area: ObjectAreaType.EDGE,
    interaction: ObjectInteractionType.EXAMINE,
    animationKey: 'webp_crack',
  },
  obj_warning: {
    id: 'obj_warning',
    name: '警告标志',
    description: '危险区域的警告标志。',
    textureKey: 'obj_warning',
    area: ObjectAreaType.EDGE,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_ruins: {
    id: 'obj_ruins',
    name: '废墟',
    description: '崩塌的建筑残骸。',
    textureKey: 'obj_ruins',
    area: ObjectAreaType.EDGE,
    interaction: ObjectInteractionType.EXAMINE,
  },
  obj_distorted: {
    id: 'obj_distorted',
    name: '扭曲物体',
    description: '被空间扭曲影响的不明物体。',
    textureKey: 'obj_distorted',
    area: ObjectAreaType.EDGE,
    interaction: ObjectInteractionType.EXAMINE,
  },
};

/**
 * 获取指定区域的所有物件
 * @param area 区域类型
 * @returns 物件数组
 */
export function getObjectsByArea(area: ObjectAreaType): IObjectInfo[] {
  return Object.values(SCENE_OBJECTS).filter((obj) => obj.area === area);
}

/**
 * 获取所有可动物件
 * @returns 可动物件数组
 */
export function getAnimatedObjects(): IObjectInfo[] {
  return Object.values(SCENE_OBJECTS).filter((obj) => obj.animationKey !== undefined);
}

/**
 * 获取所有可交互物件
 * @returns 可交互物件数组
 */
export function getInteractableObjects(): IObjectInfo[] {
  return Object.values(SCENE_OBJECTS).filter(
    (obj) => obj.interaction !== ObjectInteractionType.NONE
  );
}
