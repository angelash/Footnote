/**
 * 角色配置文件
 *
 * 定义游戏中所有角色的基本信息和头像映射
 */

/**
 * 角色ID枚举
 */
export enum CharacterId {
  CENHUI = 'cenhui', // 岑回 - 主角/例外处理器
  GULIN = 'gulin', // 顾临 - 维修局主管
  SONGLAN = 'songlan', // 宋岚 - 层下记录者
  XUCHENG = 'xucheng', // 许澄 - 医生
  ATANG = 'atang', // 阿棠 - 漂移者
  MUPING = 'muping', // 牧平 - 平面信徒
  QILAN = 'qilan', // 栖蓝 - 多余者代表
  CHENJIANG = 'chenjiang', // 陈匠 - 点灯者
}

/**
 * 表情类型
 */
export type ExpressionType =
  // 通用表情
  | 'neutral' // 中性
  | 'sad' // 悲伤
  | 'angry' // 愤怒
  | 'surprised' // 惊讶
  | 'thinking' // 思考
  | 'worried' // 担忧
  | 'smiling' // 微笑
  // 岑回特有
  | 'stressed' // 压力
  // 顾临特有
  | 'stern' // 严厉
  | 'displeased' // 不悦
  | 'tired' // 疲惫
  // 宋岚特有
  | 'serious' // 严肃
  | 'warm' // 温和
  | 'curious' // 好奇
  | 'kind' // 和蔼
  // 许澄特有
  | 'comforting' // 安慰
  | 'concerned' // 关切
  | 'professional' // 专业
  | 'understanding' // 理解
  | 'determined' // 坚定
  // 阿棠特有
  | 'dreamy' // 梦幻
  | 'confused' // 困惑
  | 'excited' // 兴奋
  | 'scared' // 害怕
  // 牧平特有
  | 'mysterious' // 神秘
  | 'serene' // 宁静
  | 'wise' // 智慧
  // 陈匠特有
  | 'focused' // 专注
  | 'hopeful'; // 希望

/**
 * 表情类型别名（向后兼容）
 */
export type CharacterExpression = ExpressionType;

/**
 * 角色信息接口
 */
export interface ICharacterInfo {
  id: CharacterId;
  name: string; // 中文名
  nameEn: string; // 英文名
  title: string; // 称号
  description: string; // 简介
  defaultExpression: ExpressionType;
  expressions: ExpressionType[]; // 可用表情列表
}

/**
 * 角色配置表
 */
export const CHARACTERS: Record<CharacterId, ICharacterInfo> = {
  [CharacterId.CENHUI]: {
    id: CharacterId.CENHUI,
    name: '岑回',
    nameEn: 'Cenhui',
    title: '例外处理器',
    description: '维修局新人，拥有例外于系统的特殊能力，能够触碰更高维度。',
    defaultExpression: 'neutral',
    expressions: ['neutral', 'sad', 'angry', 'smiling', 'thinking', 'surprised', 'stressed'],
  },
  [CharacterId.GULIN]: {
    id: CharacterId.GULIN,
    name: '顾临',
    nameEn: 'Gulin',
    title: '维修局主管',
    description: '维修局的主管，收敛主义者，坚信系统稳定高于一切。',
    defaultExpression: 'stern',
    expressions: [
      'neutral',
      'stern',
      'displeased',
      'thinking',
      'surprised',
      'angry',
      'tired',
      'worried',
    ],
  },
  [CharacterId.SONGLAN]: {
    id: CharacterId.SONGLAN,
    name: '宋岚',
    nameEn: 'Songlan',
    title: '层下记录者',
    description: '层下世界的记录者，守护着版本差异的秘密。',
    defaultExpression: 'neutral',
    expressions: ['neutral', 'thinking', 'worried', 'serious', 'sad', 'kind', 'warm', 'curious'],
  },
  [CharacterId.XUCHENG]: {
    id: CharacterId.XUCHENG,
    name: '许澄',
    nameEn: 'Xucheng',
    title: '医生',
    description: '诊疗台的医生，在对齐与减伤之间寻找平衡的边界人。',
    defaultExpression: 'neutral',
    expressions: [
      'neutral',
      'comforting',
      'concerned',
      'sad',
      'thinking',
      'professional',
      'understanding',
      'determined',
      'worried',
    ],
  },
  [CharacterId.ATANG]: {
    id: CharacterId.ATANG,
    name: '阿棠',
    nameEn: 'Atang',
    title: '漂移者',
    description: '对账失败的活证据，在维度间漂移，寻找自己的位置。',
    defaultExpression: 'dreamy',
    expressions: ['neutral', 'dreamy', 'confused', 'excited', 'sad', 'curious', 'scared'],
  },
  [CharacterId.MUPING]: {
    id: CharacterId.MUPING,
    name: '牧平',
    nameEn: 'Muping',
    title: '平面信徒',
    description: '神话保存技术残响的守护者，相信更高层的存在。',
    defaultExpression: 'serene',
    expressions: ['neutral', 'mysterious', 'serene', 'wise', 'sad'],
  },
  [CharacterId.QILAN]: {
    id: CharacterId.QILAN,
    name: '栖蓝',
    nameEn: 'Qilan',
    title: '多余者代表',
    description: '无收益行为的发动机，代表那些被系统认定为"多余"的人。',
    defaultExpression: 'neutral',
    expressions: ['neutral', 'kind', 'smiling', 'sad', 'worried'],
  },
  [CharacterId.CHENJIANG]: {
    id: CharacterId.CHENJIANG,
    name: '陈匠',
    nameEn: 'Chenjiang',
    title: '点灯者',
    description: '对象不存在仍坚持点灯的人，为看不见的人照亮道路。',
    defaultExpression: 'hopeful',
    expressions: ['neutral', 'hopeful', 'focused', 'kind', 'tired'],
  },
};

/**
 * 获取角色头像纹理键名
 * @param characterId 角色ID
 * @param expression 表情类型
 * @returns 纹理键名（用于Phaser texture key）
 */
export function getPortraitKey(
  characterId: CharacterId,
  expression: ExpressionType = 'neutral'
): string {
  return `portrait_${characterId}_${expression}`;
}

/**
 * 获取角色所有可用的头像纹理键名
 * @param characterId 角色ID
 * @returns 纹理键名数组
 */
export function getAllPortraitKeys(characterId: CharacterId): string[] {
  const character = CHARACTERS[characterId];
  return character.expressions.map((expr) => getPortraitKey(characterId, expr));
}

/**
 * 根据中文名获取角色ID
 * @param name 角色中文名
 * @returns 角色ID或undefined
 */
export function getCharacterIdByName(name: string): CharacterId | undefined {
  const entry = Object.values(CHARACTERS).find((c) => c.name === name);
  return entry?.id;
}

/**
 * 获取角色默认头像键名
 * @param characterId 角色ID
 * @returns 默认头像纹理键名
 */
export function getDefaultPortraitKey(characterId: CharacterId): string {
  const character = CHARACTERS[characterId];
  return getPortraitKey(characterId, character.defaultExpression);
}
