/**
 * 叙事数据加载器
 * 负责加载和解析YAML格式的对话、卡片、伏笔数据
 * @module data/NarrativeDataLoader
 */

import { parse as parseYaml } from 'yaml';
import type { IDialogue, ICard, IForeshadow } from '@/types';
import type { CardType, ChapterID, AbilityType } from '@/config/game.config';

// ==================== 类型定义 ====================

interface IRawDialogue {
  id: string;
  speaker: string;
  text: string;
  expression?: string; // 角色表情
  next?: string | null;
  choices?: {
    label: string;
    next: string;
    effect?: { r?: number; p?: number };
    condition?: IRawCondition;
  }[];
  trigger?: {
    card?: string;
    foreshadow?: [string, string];
    ability?: string;
    event?: string;
  };
  condition?: IRawCondition;
}

interface IRawCard {
  id: string;
  name: string;
  type: string;
  chapter: string;
  zone: string;
  front: string[];
  detail: string[];
  fx?: {
    type: string;
    value: number;
    condition?: IRawCondition;
  }[];
  states?: Record<
    string,
    {
      front?: string[];
      detail?: string[];
    }
  >;
}

interface IRawForeshadow {
  id: string;
  name: string;
  description?: string;
  stages: {
    plant: IRawStageConfig;
    deepen: IRawStageConfig;
    misread?: {
      expected: string;
      truth: string;
    };
    resolve: IRawStageConfig;
  };
  assets?: string[];
}

interface IRawStageConfig {
  zoneId: string;
  dialogueId?: string;
  condition?: IRawCondition;
}

interface IRawCondition {
  hasCard?: string;
  rMin?: number;
  rMax?: number;
  pMin?: number;
  pMax?: number;
  abilityUnlocked?: string;
  zoneVisited?: string;
  zoneCompleted?: string;
  dialogueCompleted?: string;
}

// ==================== 加载函数 ====================

/**
 * 加载对话数据
 */
export function loadDialogues(yamlContent: string): IDialogue[] {
  try {
    const data = parseYaml(yamlContent);
    if (!data?.dialogues) return [];

    return Object.values(data.dialogues).map((raw: unknown) => {
      const dialogue = raw as IRawDialogue;
      return {
        id: dialogue.id,
        speaker: dialogue.speaker,
        text: dialogue.text,
        expression: dialogue.expression as IDialogue['expression'],
        next: dialogue.next ?? null,
        choices: dialogue.choices?.map((c) => ({
          label: c.label,
          next: c.next,
          effect: c.effect,
          condition: c.condition ? transformCondition(c.condition) : undefined,
        })),
        trigger: dialogue.trigger
          ? {
              card: dialogue.trigger.card,
              foreshadow: dialogue.trigger.foreshadow as
                | [string, 'plant' | 'deepen' | 'resolve']
                | undefined,
              ability: dialogue.trigger.ability as AbilityType | undefined,
              event: dialogue.trigger.event,
            }
          : undefined,
        condition: dialogue.condition ? transformCondition(dialogue.condition) : undefined,
      } as IDialogue;
    });
  } catch (error) {
    console.error('[NarrativeDataLoader] 解析对话数据失败:', error);
    return [];
  }
}

/**
 * 加载卡片数据
 */
export function loadCards(yamlContent: string): ICard[] {
  try {
    const data = parseYaml(yamlContent);
    if (!data?.cards) return [];

    return Object.values(data.cards).map((raw: unknown) => {
      const card = raw as IRawCard;
      return {
        id: card.id,
        name: card.name,
        type: card.type as CardType,
        chapter: card.chapter as ChapterID,
        zone: card.zone,
        front: card.front,
        detail: card.detail,
        fx: card.fx?.map((f) => ({
          type: f.type,
          value: f.value,
          condition: f.condition ? transformCondition(f.condition) : undefined,
        })),
        states: card.states,
      } as ICard;
    });
  } catch (error) {
    console.error('[NarrativeDataLoader] 解析卡片数据失败:', error);
    return [];
  }
}

/**
 * 加载伏笔数据
 */
export function loadForeshadows(yamlContent: string): IForeshadow[] {
  try {
    const data = parseYaml(yamlContent);
    if (!data?.foreshadows) return [];

    return Object.values(data.foreshadows).map((raw: unknown) => {
      const fs = raw as IRawForeshadow;
      return {
        id: fs.id,
        name: fs.name,
        stages: {
          plant: transformStageConfig(fs.stages.plant),
          deepen: transformStageConfig(fs.stages.deepen),
          misread: fs.stages.misread ?? { expected: '', truth: '' },
          resolve: transformStageConfig(fs.stages.resolve),
        },
        assets: fs.assets,
      } as IForeshadow;
    });
  } catch (error) {
    console.error('[NarrativeDataLoader] 解析伏笔数据失败:', error);
    return [];
  }
}

// ==================== 辅助函数 ====================

function transformCondition(raw: IRawCondition): IDialogue['condition'] {
  return {
    hasCard: raw.hasCard,
    rMin: raw.rMin,
    rMax: raw.rMax,
    pMin: raw.pMin,
    pMax: raw.pMax,
    abilityUnlocked: raw.abilityUnlocked as AbilityType | undefined,
    zoneVisited: raw.zoneVisited,
    dialogueCompleted: raw.dialogueCompleted,
  };
}

function transformStageConfig(raw: IRawStageConfig): IForeshadow['stages']['plant'] {
  return {
    zone: raw.zoneId,
    trigger: raw.dialogueId ?? '',
    description: '',
    requires: raw.condition ? [] : undefined,
  };
}

// ==================== 批量加载 ====================

/**
 * 加载所有叙事数据
 */
export async function loadAllNarrativeData(scene: Phaser.Scene): Promise<{
  dialogues: IDialogue[];
  cards: ICard[];
  foreshadows: IForeshadow[];
}> {
  const dialogues: IDialogue[] = [];
  const cards: ICard[] = [];
  const foreshadows: IForeshadow[] = [];

  // 加载对话文件
  const dialogueFiles = ['c0_z1', 'c0_z2', 'c0_z3', 'c0_z4'];

  for (const file of dialogueFiles) {
    try {
      const content = scene.cache.text.get(`dialogue_${file}`);
      if (content) {
        dialogues.push(...loadDialogues(content));
      }
    } catch (error) {
      console.warn(`[NarrativeDataLoader] 加载对话文件失败: ${file}`, error);
    }
  }

  // 加载卡片文件
  const cardFiles = [
    'c0_cards',
    // 添加更多卡片文件...
  ];

  for (const file of cardFiles) {
    try {
      const content = scene.cache.text.get(`cards_${file}`);
      if (content) {
        cards.push(...loadCards(content));
      }
    } catch (error) {
      console.warn(`[NarrativeDataLoader] 加载卡片文件失败: ${file}`, error);
    }
  }

  // 加载伏笔文件
  try {
    const content = scene.cache.text.get('foreshadows');
    if (content) {
      foreshadows.push(...loadForeshadows(content));
    }
  } catch (error) {
    console.warn('[NarrativeDataLoader] 加载伏笔文件失败', error);
  }

  console.log(`[NarrativeDataLoader] 数据加载完成:`, {
    dialogues: dialogues.length,
    cards: cards.length,
    foreshadows: foreshadows.length,
  });

  return { dialogues, cards, foreshadows };
}
