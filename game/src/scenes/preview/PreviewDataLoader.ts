/**
 * 预览场景数据加载器
 *
 * 统一管理预览场景的数据加载，从真实 YAML 文件读取数据
 */

import { loadCards, loadDialogues } from '@/data/NarrativeDataLoader';
import type { ICard, IDialogue } from '@/types';
import { ZONES, ChapterId } from '@/config/zones.config';
import { CONSTANTS } from '@/config/game.config';

// ==================== 卡片数据 ====================

const CARD_FILES = [
  'c0_cards',
  'c1_cards',
  'c2_cards',
  'c3_cards',
  'c4_cards',
  'c5_cards',
  'cf_cards',
  'rv_cards',
];

/**
 * 加载所有卡片数据
 */
export async function loadAllCards(): Promise<ICard[]> {
  const allCards: ICard[] = [];

  for (const file of CARD_FILES) {
    try {
      const response = await fetch(`/src/data/cards/${file}.yaml`);
      if (response.ok) {
        const content = await response.text();
        const cards = loadCards(content);
        allCards.push(...cards);
      }
    } catch (error) {
      console.warn(`加载卡片文件失败: ${file}`, error);
    }
  }

  return allCards;
}

/**
 * 获取示例卡片（每种类型各一张）
 */
export async function getSampleCards(): Promise<ICard[]> {
  const allCards = await loadAllCards();
  const sampleCards: ICard[] = [];
  const seenTypes = new Set<string>();

  for (const card of allCards) {
    if (!seenTypes.has(card.type)) {
      sampleCards.push(card);
      seenTypes.add(card.type);
    }
  }

  return sampleCards;
}

// ==================== 对话数据 ====================

// 每个章节选取的代表性对话文件
const DIALOGUE_SAMPLE_FILES = [
  'c0_z1', // 序章
  'c1_z1', // 第1章
  'c2_z1', // 第2章
  'c3_z1', // 第3章
  'c4_z1', // 第4章
  'c5_z1', // 第5章
];

/**
 * 加载示例对话数据
 */
export async function loadSampleDialogues(): Promise<IDialogue[]> {
  const allDialogues: IDialogue[] = [];

  for (const file of DIALOGUE_SAMPLE_FILES) {
    try {
      const response = await fetch(`/src/data/dialogues/${file}.yaml`);
      if (response.ok) {
        const content = await response.text();
        const dialogues = loadDialogues(content);
        // 只取前3个对话作为示例
        allDialogues.push(...dialogues.slice(0, 3));
      }
    } catch (error) {
      console.warn(`加载对话文件失败: ${file}`, error);
    }
  }

  return allDialogues;
}

// ==================== Zone 数据 ====================

/**
 * 章节配置（从 zones.config 生成）
 */
export interface IChapterConfig {
  id: ChapterId;
  name: string;
  color: string;
  zoneCount: number;
}

// 章节颜色配置
const CHAPTER_COLORS: Record<ChapterId, string> = {
  [ChapterId.C0]: '#4A9EFF',
  [ChapterId.C1]: '#00CC66',
  [ChapterId.C2]: '#FFD700',
  [ChapterId.C3]: '#FF6B6B',
  [ChapterId.C4]: '#9966FF',
  [ChapterId.C5]: '#FF9933',
  [ChapterId.CF]: '#00FFAA',
};

// 章节名称配置
const CHAPTER_NAMES: Record<ChapterId, string> = {
  [ChapterId.C0]: '序章 - 裂痕',
  [ChapterId.C1]: '第1章 - 收敛',
  [ChapterId.C2]: '第2章 - 版本',
  [ChapterId.C3]: '第3章 - 对齐',
  [ChapterId.C4]: '第4章 - 回溯',
  [ChapterId.C5]: '第5章 - 抉择',
  [ChapterId.CF]: '终章 - 显影',
};

/**
 * 获取章节配置列表
 */
export function getChapterConfigs(): IChapterConfig[] {
  const chapters: IChapterConfig[] = [];

  for (const chapterId of Object.values(ChapterId)) {
    const zoneCount = Object.values(ZONES).filter((z) => z.chapter === chapterId).length;
    chapters.push({
      id: chapterId,
      name: CHAPTER_NAMES[chapterId] || chapterId,
      color: CHAPTER_COLORS[chapterId] || '#FFFFFF',
      zoneCount,
    });
  }

  return chapters;
}

/**
 * 获取指定章节的所有 Zone
 */
export function getZonesByChapterPreview(chapterId: ChapterId): Array<{
  id: string;
  name: string;
  description?: string;
}> {
  return Object.values(ZONES)
    .filter((z) => z.chapter === chapterId)
    .map((z) => ({
      id: z.id,
      name: z.name,
      description: z.description,
    }));
}

// ==================== 卡片类型配置 ====================

export interface ICardTypeConfig {
  type: string;
  name: string;
  color: string;
  icon: string;
}

/**
 * 获取卡片类型配置
 */
export function getCardTypeConfigs(): ICardTypeConfig[] {
  return [
    { type: CONSTANTS.CARD_TYPE.ARCHIVE, name: '档案', color: '#00FFAA', icon: '📁' },
    { type: CONSTANTS.CARD_TYPE.ITEM, name: '物品', color: '#FFD700', icon: '🎒' },
    { type: CONSTANTS.CARD_TYPE.MAP, name: '地图', color: '#4A9EFF', icon: '🗺️' },
    { type: CONSTANTS.CARD_TYPE.PRAYER, name: '祈言', color: '#9933FF', icon: '🙏' },
    { type: CONSTANTS.CARD_TYPE.RECEIPT, name: '收据', color: '#A8A6A3', icon: '🧾' },
    { type: CONSTANTS.CARD_TYPE.VERDICT, name: '判词', color: '#FF4444', icon: '⚖️' },
    { type: CONSTANTS.CARD_TYPE.DIARY, name: '日记', color: '#FF8C00', icon: '📔' },
  ];
}

// ==================== 角色数据 ====================

/**
 * 获取角色示例对话文本（从真实数据中提取）
 */
export async function getCharacterSampleDialogues(): Promise<Record<string, string>> {
  const sampleDialogues: Record<string, string> = {};
  const dialogues = await loadSampleDialogues();

  for (const dialogue of dialogues) {
    const speaker = dialogue.speaker?.toLowerCase();
    if (speaker && !sampleDialogues[speaker]) {
      sampleDialogues[speaker] = dialogue.text;
    }
  }

  // 如果没有加载到数据，提供备用
  const fallbacks: Record<string, string> = {
    cenhui: '先按流程走。',
    gulin: '收敛是必要的。不然世界会记住太多。',
    songlan: '版本之间，存在差异。',
    xucheng: '有些伤，系统看不见。',
    atang: '我是谁来着...？',
    muping: '神话不是迷信，是保存技术。',
    qilan: '被遗忘的，不代表不存在。',
    chenjiang: '对象不存在，我还是要亮着灯。',
  };

  return { ...fallbacks, ...sampleDialogues };
}
