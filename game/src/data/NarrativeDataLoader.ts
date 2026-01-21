/**
 * 叙事数据加载器
 * 负责加载和解析YAML格式的对话、卡片、伏笔数据
 * @module data/NarrativeDataLoader
 */

import { createLogger } from '@/utils/Logger';
import { parse as parseYaml } from 'yaml';
import { narrativeEngine } from '@/systems/narrative';

const logger = createLogger('NarrativeDataLoader');
import type {
  IDialogue,
  ICard,
  IForeshadow,
  ICardStateOverride,
  ForeshadowStage,
  IForeshadowStageConfig,
} from '@/types';
import type { CardType, ChapterID, AbilityType } from '@/config/game.config';

// ==================== 类型定义 ====================

/**
 * 旧格式对话（C0）- 单行对话
 */
interface IRawDialogueOld {
  id: string;
  speaker: string;
  text: string;
  expression?: string;
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

/**
 * 新格式对话行
 */
interface IRawDialogueLine {
  speaker: string;
  text: string;
  portrait?: string;
  emotion?: string;
  action?: IRawDialogueAction;
  delay?: number;
}

/**
 * 新格式对话动作
 */
interface IRawDialogueAction {
  type: 'card' | 'foreshadow' | 'flag' | 'ability' | 'sfx' | 'bgm';
  cardId?: string;
  foreshadowId?: string;
  foreshadowStage?: string;
  flagName?: string;
  flagValue?: boolean;
  abilityType?: string;
  audioKey?: string;
}

/**
 * 新格式对话（C1+）- 多行对话
 */
interface IRawDialogueNew {
  id: string;
  lines: IRawDialogueLine[];
  choices?: {
    id: string;
    text: string;
    condition?: IRawCondition | { flagTrue?: string };
    effects?: {
      rDelta?: number;
      pDelta?: number;
      setFlag?: { name: string; value: boolean };
      giveCard?: string;
      triggerForeshadow?: { id: string; stage: string };
    };
    nextDialogueId?: string;
  }[];
  onComplete?: IRawDialogueAction[];
}

/**
 * 统一的原始对话类型（可能是新格式或旧格式）
 */
type IRawDialogue = IRawDialogueOld | IRawDialogueNew;

/**
 * 检查是否为新格式对话
 */
function isNewFormatDialogue(raw: IRawDialogue): raw is IRawDialogueNew {
  return 'lines' in raw && Array.isArray(raw.lines);
}

/**
 * 原始卡片数据格式（兼容两种格式）
 *
 * 格式A (C0): { id, name, type, chapter, zone, front[], detail[] }
 * 格式B (C1-CF): { id, title, type, content(string), flavorText, rarity, foreshadowId }
 */
interface IRawCard {
  id: string;
  // 格式A字段
  name?: string;
  chapter?: string;
  zone?: string;
  front?: string[];
  detail?: string[];
  // 格式B字段
  title?: string;
  content?: string;
  flavorText?: string;
  rarity?: string;
  foreshadowId?: string;
  // 通用字段
  type: string;
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

/**
 * YAML 中的伏笔原始数据（兼容多种格式）
 */
interface IRawForeshadow {
  id: string;
  name: string;
  description?: string;
  stages: {
    plant: IRawStageConfig;
    deepen: IRawStageConfig;
    /** 误读阶段（可能是对象或描述格式） */
    mislead?:
      | IRawStageConfig
      | { expected?: string; truth?: string; zone?: string; description?: string };
    /** @deprecated 旧版 misread，使用 mislead */
    misread?: { expected?: string; truth?: string; zone?: string; description?: string };
    /** 回收阶段（统一命名） */
    reveal?: IRawStageConfig;
    /** @deprecated 旧版 resolve，使用 reveal */
    resolve?: IRawStageConfig;
    /** @deprecated 旧版 collect，使用 reveal */
    collect?: IRawStageConfig;
  };
  assets?: string[];
}

/**
 * YAML 中的阶段配置（兼容新旧格式）
 */
interface IRawStageConfig {
  /** 新格式：zoneId */
  zoneId?: string;
  /** 旧格式：zone */
  zone?: string;
  /** 对话ID */
  dialogueId?: string;
  /** 描述 */
  description?: string;
  /** 条件 */
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
 * 将旧格式对话转换为统一的IDialogue格式
 */
function normalizeOldFormatDialogue(raw: IRawDialogueOld): IDialogue {
  return {
    id: raw.id,
    speaker: raw.speaker,
    text: raw.text,
    expression: raw.expression as IDialogue['expression'],
    next: raw.next ?? null,
    choices: raw.choices?.map((c) => ({
      label: c.label,
      next: c.next,
      effect: c.effect,
      condition: c.condition ? transformCondition(c.condition) : undefined,
    })),
    trigger: raw.trigger
      ? {
          card: raw.trigger.card,
          foreshadow: raw.trigger.foreshadow as [string, ForeshadowStage] | undefined,
          ability: raw.trigger.ability as AbilityType | undefined,
          event: raw.trigger.event,
        }
      : undefined,
    condition: raw.condition ? transformCondition(raw.condition) : undefined,
  };
}

/**
 * 将新格式对话转换为多个IDialogue（每行一个对话，通过next链接）
 */
function normalizeNewFormatDialogue(raw: IRawDialogueNew): IDialogue[] {
  const dialogues: IDialogue[] = [];
  const lines = raw.lines;

  if (lines.length === 0) {
    return [];
  }

  // 为每一行生成对话ID
  const generateLineId = (index: number): string => {
    return index === 0 ? raw.id : `${raw.id}_LINE_${index}`;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isLastLine = i === lines.length - 1;
    const currentId = generateLineId(i);
    const nextId = isLastLine ? null : generateLineId(i + 1);

    // 转换行内动作为trigger
    let trigger: IDialogue['trigger'] | undefined;
    if (line.action) {
      trigger = {
        card: line.action.cardId,
        foreshadow:
          line.action.foreshadowId && line.action.foreshadowStage
            ? ([line.action.foreshadowId, line.action.foreshadowStage] as [string, ForeshadowStage])
            : undefined,
        ability: line.action.abilityType as AbilityType | undefined,
      };
    }

    // 最后一行处理选项和onComplete
    let choices: IDialogue['choices'] | undefined;
    if (isLastLine && raw.choices) {
      choices = raw.choices.map((c) => ({
        label: c.text,
        next: c.nextDialogueId ?? '',
        effect: c.effects
          ? {
              r: c.effects.rDelta,
              p: c.effects.pDelta,
              setFlag: c.effects.setFlag,
              giveCard: c.effects.giveCard,
              triggerForeshadow: c.effects.triggerForeshadow,
            }
          : undefined,
        condition: c.condition ? transformConditionNew(c.condition) : undefined,
      }));
    }

    // 处理onComplete中的触发器（附加到最后一行）
    if (isLastLine && raw.onComplete) {
      const triggers = raw.onComplete;
      // 合并所有onComplete动作到trigger
      for (const action of triggers) {
        if (!trigger) trigger = {};
        if (action.type === 'card' && action.cardId) {
          trigger.card = action.cardId;
        }
        if (action.type === 'foreshadow' && action.foreshadowId && action.foreshadowStage) {
          trigger.foreshadow = [action.foreshadowId, action.foreshadowStage] as [
            string,
            ForeshadowStage,
          ];
        }
        if (action.type === 'ability' && action.abilityType) {
          trigger.ability = action.abilityType as AbilityType;
        }
        // 处理 flag 类型的 onComplete 动作
        if (action.type === 'flag' && action.flagName !== undefined) {
          if (!trigger.flags) trigger.flags = [];
          trigger.flags.push({ name: action.flagName, value: action.flagValue ?? true });
        }
      }
    }

    const dialogue: IDialogue = {
      id: currentId,
      speaker: line.speaker,
      text: line.text,
      expression: (line.emotion || line.portrait) as IDialogue['expression'],
      next: nextId,
      choices,
      trigger,
    };

    dialogues.push(dialogue);
  }

  return dialogues;
}

/**
 * 转换新格式的条件
 */
function transformConditionNew(
  raw: IRawCondition | { flagTrue?: string }
): IDialogue['condition'] | undefined {
  if ('flagTrue' in raw && raw.flagTrue) {
    // 新格式的flagTrue条件 - 直接使用flagTrue字段（与NarrativeEngine._checkChoiceCondition一致）
    return {
      flagTrue: raw.flagTrue,
    };
  }
  return transformCondition(raw as IRawCondition);
}

/**
 * 加载对话数据 - 兼容新旧两种格式
 */
export function loadDialogues(yamlContent: string): IDialogue[] {
  try {
    const data = parseYaml(yamlContent);
    if (!data?.dialogues) return [];

    const result: IDialogue[] = [];

    for (const raw of Object.values(data.dialogues) as IRawDialogue[]) {
      if (isNewFormatDialogue(raw)) {
        // 新格式：多行对话转换为多个IDialogue
        result.push(...normalizeNewFormatDialogue(raw));
      } else {
        // 旧格式：单行对话直接转换
        result.push(normalizeOldFormatDialogue(raw));
      }
    }

    return result;
  } catch (error) {
    logger.error('解析对话数据失败:', error);
    return [];
  }
}

/**
 * 转换 YAML 中的 fx 数据为 ICardFX 格式
 * YAML 格式: { type, value, condition }
 * ICardFX 格式: { type, target, effect?, duration? }
 */
function transformCardFx(
  rawFx?: { type: string; value: number; condition?: IRawCondition }[]
): ICard['fx'] {
  if (!rawFx || rawFx.length === 0) return undefined;

  return rawFx.map((f) => ({
    type: f.type as 'taint' | 'flash' | 'shake' | 'fade',
    target: 'self', // 默认目标为自身
    effect: f.condition ? JSON.stringify(f.condition) : undefined,
    duration: f.value > 0 ? f.value * 1000 : undefined, // 将 value 转换为毫秒
  }));
}

/**
 * 转换 YAML 中的 states 数据为 ICardStateOverride 格式
 * YAML 格式: Record<string, { front?, detail? }>
 * ICardStateOverride 格式: { trigger, override?, append? }
 */
function transformCardStates(
  rawStates?: Record<string, { front?: string[]; detail?: string[] }>
): ICard['states'] {
  if (!rawStates) return undefined;

  const result: Record<string, ICardStateOverride> = {};
  for (const [stateKey, stateValue] of Object.entries(rawStates)) {
    result[stateKey] = {
      trigger: stateKey, // 使用 state key 作为触发器名
      override:
        stateValue.front || stateValue.detail
          ? {
              front: stateValue.front,
              detail: stateValue.detail,
            }
          : undefined,
    };
  }
  return result;
}

/**
 * 标准化卡片数据，兼容两种格式
 *
 * 格式A (C0): { id, name, type, chapter, zone, front[], detail[] }
 * 格式B (C1-CF): { id, title, type, content(string), flavorText, rarity, foreshadowId }
 *
 * @param raw 原始卡片数据
 * @returns 标准化的卡片数据
 */
function normalizeCard(raw: IRawCard): ICard {
  // 判断是哪种格式：如果有 name 和 front 字段，则是格式A
  const isFormatA = raw.name !== undefined && raw.front !== undefined;

  if (isFormatA) {
    // 格式A: 直接使用原字段
    return {
      id: raw.id,
      name: raw.name!,
      type: raw.type as CardType,
      chapter: (raw.chapter || 'C0') as ChapterID,
      zone: raw.zone || '',
      front: raw.front!,
      detail: raw.detail || [],
      fx: transformCardFx(raw.fx),
      states: transformCardStates(raw.states),
    };
  } else {
    // 格式B: 转换字段
    // content 是多行字符串，需要转换为数组
    const contentLines = raw.content
      ? raw.content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : [];

    // front 取内容前2-3行作为简介，detail 取完整内容
    const frontLines = contentLines.slice(0, Math.min(3, contentLines.length));

    // detail 包含完整内容 + flavorText（如果有）
    const detailLines = [...contentLines];
    if (raw.flavorText) {
      detailLines.push('——');
      detailLines.push(raw.flavorText);
    }

    // 从 id 解析 chapter（例如 CARD_C1_PERMIT -> C1）
    const chapterMatch = raw.id.match(/CARD_(C[0-5F]|CF|RV)_/i);
    const chapter = chapterMatch ? chapterMatch[1].toUpperCase() : 'C0';

    return {
      id: raw.id,
      name: raw.title || raw.id,
      type: raw.type as CardType,
      chapter: chapter as ChapterID,
      zone: raw.zone || '',
      front: frontLines,
      detail: detailLines,
      fx: transformCardFx(raw.fx),
      states: transformCardStates(raw.states),
    };
  }
}

/**
 * 加载卡片数据
 * 支持两种YAML格式：
 * - 格式A (C0): { id, name, type, chapter, zone, front[], detail[] }
 * - 格式B (C1-CF): { id, title, type, content(string), flavorText, rarity, foreshadowId }
 */
export function loadCards(yamlContent: string): ICard[] {
  try {
    const data = parseYaml(yamlContent);
    if (!data?.cards) return [];

    return Object.values(data.cards).map((raw: unknown) => {
      const card = raw as IRawCard;
      return normalizeCard(card);
    });
  } catch (error) {
    logger.error('解析卡片数据失败:', error);
    return [];
  }
}

/**
 * 加载伏笔数据（统一 Schema）
 * 支持新旧格式：
 * - 新格式：plant/deepen/mislead/reveal
 * - 旧格式：plant/deepen/misread/resolve 或 collect
 */
export function loadForeshadows(yamlContent: string): IForeshadow[] {
  try {
    const data = parseYaml(yamlContent);
    if (!data?.foreshadows) return [];

    return Object.values(data.foreshadows).map((raw: unknown) => {
      const fs = raw as IRawForeshadow;

      // 获取回收阶段配置（兼容 reveal/resolve/collect）
      const revealConfig = fs.stages.reveal || fs.stages.resolve || fs.stages.collect;

      // 获取误读阶段配置（兼容 mislead/misread）
      const misleadConfig = fs.stages.mislead || fs.stages.misread;

      return {
        id: fs.id,
        name: fs.name,
        description: fs.description,
        stages: {
          plant: transformStageConfig(fs.stages.plant),
          deepen: transformStageConfig(fs.stages.deepen),
          mislead: misleadConfig ? transformMisleadConfig(misleadConfig) : undefined,
          reveal: revealConfig ? transformStageConfig(revealConfig) : { zone: '', description: '' },
        },
        assets: fs.assets,
      } as IForeshadow;
    });
  } catch (error) {
    logger.error('解析伏笔数据失败:', error);
    return [];
  }
}

/**
 * 转换误读阶段配置（支持两种格式）
 */
function transformMisleadConfig(
  raw: IRawStageConfig | { expected?: string; truth?: string; zone?: string; description?: string }
): IForeshadow['stages']['mislead'] {
  // 如果是旧版 expected/truth 格式
  if ('expected' in raw || 'truth' in raw) {
    return {
      expected: raw.expected,
      truth: raw.truth,
      zone: raw.zone,
      description: raw.description,
    };
  }
  // 如果是新版阶段配置格式
  return transformStageConfig(raw as IRawStageConfig);
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

/**
 * 转换阶段配置（兼容新旧字段名）
 */
function transformStageConfig(raw: IRawStageConfig): IForeshadow['stages']['plant'] {
  return {
    zone: raw.zoneId || raw.zone || '',
    dialogueId: raw.dialogueId,
    trigger: raw.dialogueId ?? '',
    description: raw.description || '',
    condition: raw.condition ? JSON.stringify(raw.condition) : undefined,
  };
}

// ==================== 批量加载 ====================

/**
 * 所有对话文件列表（47个）
 */
const ALL_DIALOGUE_FILES = [
  // C0 序章 (4个)
  'c0_z1',
  'c0_z2',
  'c0_z3',
  'c0_z4',
  // C1 第一章 (6个)
  'c1_z1',
  'c1_z2',
  'c1_z3',
  'c1_z4',
  'c1_z5',
  'c1_z6',
  // C2 第二章 (7个)
  'c2_z1',
  'c2_z2',
  'c2_z3',
  'c2_z4',
  'c2_z5',
  'c2_z6',
  'c2_z7',
  // C3 第三章 (7个)
  'c3_z1',
  'c3_z2',
  'c3_z3',
  'c3_z4',
  'c3_z5',
  'c3_z6',
  'c3_z7',
  // C4 第四章 (8个)
  'c4_z1',
  'c4_z2',
  'c4_z3',
  'c4_z4',
  'c4_z5',
  'c4_z6',
  'c4_z7',
  'c4_z8',
  // C5 第五章 (7个)
  'c5_z1',
  'c5_z2',
  'c5_z3',
  'c5_z4',
  'c5_z5',
  'c5_z6',
  'c5_z7',
  // CF 终章 (6个)
  'cf_z1',
  'cf_z2',
  'cf_z3',
  'cf_z4',
  'cf_z5',
  'cf_z6',
  // 特殊对话 (2个)
  'rv_dialogues',
  'ngplus_dialogues',
];

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

  let loadedFileCount = 0;
  let failedFileCount = 0;

  // 加载所有47个对话文件
  for (const file of ALL_DIALOGUE_FILES) {
    try {
      let content = scene.cache.text.get(`dialogue_${file}`);

      // 如果缓存中没有，动态 fetch 加载（仅加载当前章节相关的对话）
      if (!content) {
        try {
          const response = await fetch(`/src/data/dialogues/${file}.yaml`);
          if (response.ok) {
            content = await response.text();
            logger.debug(`动态加载对话文件: ${file}`);
          }
        } catch (fetchError) {
          // 静默处理，非当前章节的文件可能不存在
        }
      }

      if (content) {
        const parsed = loadDialogues(content);
        dialogues.push(...parsed);
        loadedFileCount++;
        logger.debug(`加载对话文件成功: ${file} (${parsed.length}条对话)`);
      } else {
        logger.debug(`对话文件未在缓存中: ${file}`);
      }
    } catch (error) {
      failedFileCount++;
      logger.warn(`加载对话文件失败: ${file}`, error);
    }
  }

  // 加载卡片文件（所有章节）
  const cardFiles = [
    'c0_cards', // C0 序章: 9 张
    'c1_cards', // C1 第一章: 6 张
    'c2_cards', // C2 第二章: 7 张
    'c3_cards', // C3 第三章: 9 张
    'c4_cards', // C4 第四章: 10 张
    'c5_cards', // C5 第五章: 10 张
    'cf_cards', // CF 终章: 12 张
    'rv_cards', // RV 重返变体: 12 张
    // 总计: 75 张
  ];

  for (const file of cardFiles) {
    try {
      let content = scene.cache.text.get(`cards_${file}`);

      // 如果缓存中没有，动态 fetch 加载
      if (!content) {
        try {
          const response = await fetch(`/src/data/cards/${file}.yaml`);
          if (response.ok) {
            content = await response.text();
            logger.debug(`动态加载卡片文件: ${file}`);
          }
        } catch (fetchError) {
          logger.debug(`无法动态加载卡片文件: ${file}`, fetchError);
        }
      }

      if (content) {
        cards.push(...loadCards(content));
      }
    } catch (error) {
      logger.warn(`加载卡片文件失败: ${file}`, error);
    }
  }

  // 加载伏笔文件
  try {
    const content = scene.cache.text.get('foreshadows');
    if (content) {
      foreshadows.push(...loadForeshadows(content));
    }
  } catch (error) {
    logger.warn('加载伏笔文件失败', error);
  }

  // 注册数据到 NarrativeEngine
  registerDataToNarrativeEngine(dialogues, cards, foreshadows);

  logger.info('叙事数据加载完成:', {
    dialogueFiles: `${loadedFileCount}/${ALL_DIALOGUE_FILES.length}`,
    failedFiles: failedFileCount,
    totalDialogues: dialogues.length,
    cards: cards.length,
    foreshadows: foreshadows.length,
  });

  return { dialogues, cards, foreshadows };
}

/**
 * 将加载的数据注册到 NarrativeEngine
 * 注意：新格式对话被 normalizeNewFormatDialogue 拆分成多个单行对话（用 _LINE_ 后缀链接）
 * 这里需要将它们合并回多行对话
 */
function registerDataToNarrativeEngine(
  dialogues: IDialogue[],
  cards: ICard[],
  foreshadows: IForeshadow[]
): void {
  // 按对话链分组（基础ID -> 所有行）
  const dialogueChains = new Map<string, IDialogue[]>();

  for (const dialogue of dialogues) {
    // 检查是否是链的一部分（_LINE_N 后缀）
    const lineMatch = dialogue.id.match(/^(.+)_LINE_(\d+)$/);
    const baseId = lineMatch ? lineMatch[1] : dialogue.id;

    if (!dialogueChains.has(baseId)) {
      dialogueChains.set(baseId, []);
    }
    dialogueChains.get(baseId)!.push(dialogue);
  }

  // 转换每个对话链为 IDialogueData
  for (const [baseId, chain] of dialogueChains) {
    // 按 ID 排序：基础 ID 在前，然后按 LINE 数字排序
    chain.sort((a, b) => {
      const aMatch = a.id.match(/_LINE_(\d+)$/);
      const bMatch = b.id.match(/_LINE_(\d+)$/);
      const aNum = aMatch ? parseInt(aMatch[1], 10) : -1;
      const bNum = bMatch ? parseInt(bMatch[1], 10) : -1;
      return aNum - bNum;
    });

    // 构建 lines 数组
    const lines = chain.map((d) => ({
      speaker: d.speaker,
      text: d.text,
      portrait: d.expression,
      emotion: d.expression,
    }));

    // 从最后一行获取 choices 和 trigger
    const lastDialogue = chain[chain.length - 1];

    narrativeEngine.registerDialogue({
      id: baseId,
      lines,
      choices: lastDialogue.choices?.map((c) => ({
        id: c.label,
        text: c.label,
        nextDialogueId: c.next || undefined,
        condition: c.condition
          ? {
              hasCard: c.condition.hasCard,
              rMin: c.condition.rMin,
              flagTrue: c.condition.dialogueCompleted, // 映射 flagTrue 条件
            }
          : undefined,
        effects: c.effect
          ? {
              rDelta: c.effect.r,
              pDelta: c.effect.p,
              setFlag: c.effect.setFlag,
              giveCard: c.effect.giveCard,
              triggerForeshadow: c.effect.triggerForeshadow
                ? {
                    id: c.effect.triggerForeshadow.id,
                    stage: c.effect.triggerForeshadow.stage as
                      | 'plant'
                      | 'deepen'
                      | 'misread'
                      | 'collect',
                  }
                : undefined,
            }
          : undefined,
      })),
      onComplete: lastDialogue.trigger
        ? ([
            lastDialogue.trigger.card
              ? { type: 'card' as const, cardId: lastDialogue.trigger.card }
              : null,
            lastDialogue.trigger.foreshadow
              ? {
                  type: 'foreshadow' as const,
                  foreshadowId: lastDialogue.trigger.foreshadow[0],
                  foreshadowStage: lastDialogue.trigger.foreshadow[1] as
                    | 'plant'
                    | 'deepen'
                    | 'misread'
                    | 'collect',
                }
              : null,
            lastDialogue.trigger.ability
              ? { type: 'ability' as const, abilityType: lastDialogue.trigger.ability }
              : null,
            // 处理 flag 类型的 onComplete 动作
            ...(lastDialogue.trigger.flags?.map((f) => ({
              type: 'flag' as const,
              flagName: f.name,
              flagValue: f.value,
            })) || []),
          ].filter(Boolean) as import('@/systems/narrative').IDialogueAction[])
        : undefined,
    });
  }

  // 注册卡片
  for (const card of cards) {
    narrativeEngine.registerCard({
      id: card.id,
      title: card.name,
      subtitle: '',
      category: card.type as unknown as import('@/systems/narrative').CardCategory,
      content: card.front?.join('\n') || '',
      chapter: card.chapter,
      zone: card.zone,
      image: undefined,
      effects: card.fx?.map((f) => ({
        type: f.type as 'taint' | 'flash' | 'glitch' | 'redact',
        target: f.target,
        intensity: f.duration,
      })),
    });
  }

  // 注册伏笔（使用统一 Schema）
  for (const foreshadow of foreshadows) {
    narrativeEngine.registerForeshadow({
      id: foreshadow.id,
      name: foreshadow.name,
      description: foreshadow.description || '',
      stages: {
        plant: {
          zone: foreshadow.stages.plant.zone || '',
          trigger: foreshadow.stages.plant.trigger || foreshadow.stages.plant.dialogueId || '',
          description: foreshadow.stages.plant.description || '',
        },
        deepen: {
          zone: foreshadow.stages.deepen.zone || '',
          trigger: foreshadow.stages.deepen.trigger || foreshadow.stages.deepen.dialogueId || '',
          description: foreshadow.stages.deepen.description || '',
        },
        // 误读阶段（兼容旧版 misread）
        mislead: foreshadow.stages.mislead
          ? 'expected' in foreshadow.stages.mislead
            ? foreshadow.stages.mislead
            : {
                zone: (foreshadow.stages.mislead as IForeshadowStageConfig).zone || '',
                trigger:
                  (foreshadow.stages.mislead as IForeshadowStageConfig).trigger ||
                  (foreshadow.stages.mislead as IForeshadowStageConfig).dialogueId ||
                  '',
                description: foreshadow.stages.mislead.description || '',
              }
          : undefined,
        // 回收阶段（统一使用 reveal）
        reveal: {
          zone: foreshadow.stages.reveal.zone || '',
          trigger: foreshadow.stages.reveal.trigger || foreshadow.stages.reveal.dialogueId || '',
          description: foreshadow.stages.reveal.description || '',
        },
      },
    });
  }

  logger.info(
    `数据已注册到 NarrativeEngine: ${dialogues.length} 对话, ${cards.length} 卡片, ${foreshadows.length} 伏笔`
  );
}

/**
 * 获取所有对话文件列表
 */
export function getAllDialogueFiles(): string[] {
  return [...ALL_DIALOGUE_FILES];
}
