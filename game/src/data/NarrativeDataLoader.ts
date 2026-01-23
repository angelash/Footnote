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
// 注意：已移除旧格式对话支持，所有对话必须使用新格式（lines 数组）

/**
 * 对话行
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
 * 对话配置（统一格式）
 * 所有对话必须使用 lines 数组格式
 */
interface IRawDialogue {
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
 * 原始 Gameplay 效果数据格式
 */
interface IRawGameplayEffect {
  type: 'counterDelta' | 'setFlag' | 'giveCard' | 'unlockAbility';
  counter?: 'R' | 'P';
  delta?: number;
  flagName?: string;
  flagValue?: boolean;
  cardId?: string;
  abilityType?: string;
}

/**
 * 原始 Gameplay FX 数据格式
 */
interface IRawGameplayFx {
  trigger: 'obtain' | 'use' | 'view';
  effects: IRawGameplayEffect[];
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
  /** Gameplay 效果（Phase 3 新增） */
  gameplayFx?: IRawGameplayFx[];
  /** 是否可消耗（Phase 3 新增） */
  consumable?: boolean;
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
 * 将对话配置转换为多个IDialogue（每行一个对话，通过next链接）
 * 
 * 注意：所有对话必须使用统一的 lines 数组格式
 * 旧格式（speaker/text/next）已不再支持
 */
function normalizeDialogue(raw: IRawDialogue): IDialogue[] {
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
      // 注意：卡片和flags支持多个，需要累积
      const cardIds: string[] = [];
      for (const action of triggers) {
        if (!trigger) trigger = {};
        if (action.type === 'card' && action.cardId) {
          cardIds.push(action.cardId);
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
      // 设置卡片（支持多张）
      if (cardIds.length > 0) {
        if (!trigger) trigger = {};
        trigger.cards = cardIds;  // 使用 cards 数组存储多张卡片
        trigger.card = cardIds[0];  // 保持向后兼容，第一张卡片也放在 card
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
 * 加载对话数据
 * 
 * 注意：只支持统一的 lines 数组格式，旧格式（speaker/text/next）已不再支持
 */
export function loadDialogues(yamlContent: string): IDialogue[] {
  try {
    const data = parseYaml(yamlContent);
    if (!data?.dialogues) return [];

    const result: IDialogue[] = [];

    for (const raw of Object.values(data.dialogues) as IRawDialogue[]) {
      // 验证格式
      if (!raw.lines || !Array.isArray(raw.lines)) {
        logger.error(`对话 ${raw.id} 缺少 lines 数组，请使用统一的新格式`);
        continue;
      }
      // 转换为多个 IDialogue（每行一个，通过 next 链接）
      result.push(...normalizeDialogue(raw));
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
 * 转换 Gameplay FX 数据
 */
function transformGameplayFx(
  rawFx?: IRawGameplayFx[]
): ICard['gameplayFx'] {
  if (!rawFx || rawFx.length === 0) return undefined;

  return rawFx.map((fx) => ({
    trigger: fx.trigger,
    effects: fx.effects.map((effect) => ({
      type: effect.type,
      counter: effect.counter,
      delta: effect.delta,
      flagName: effect.flagName,
      flagValue: effect.flagValue,
      cardId: effect.cardId,
      abilityType: effect.abilityType,
    })),
  }));
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
      gameplayFx: transformGameplayFx(raw.gameplayFx),
      consumable: raw.consumable,
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
      gameplayFx: transformGameplayFx(raw.gameplayFx),
      consumable: raw.consumable,
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
  // 创建对话 ID -> 对话的映射
  const dialogueMap = new Map<string, IDialogue>();
  for (const d of dialogues) {
    dialogueMap.set(d.id, d);
  }

  // 找出所有被其他对话通过 next 引用的对话
  const referencedByNext = new Set<string>();
  for (const d of dialogues) {
    if (d.next && dialogueMap.has(d.next)) {
      referencedByNext.add(d.next);
    }
  }

  // 按对话链分组
  // 所有对话通过 next 链接形成链，链头负责收集整个链
  // 注意：_LINE_N 后缀的对话也是通过 next 链接的，不需要单独处理
  const dialogueChains = new Map<string, IDialogue[]>();

  for (const dialogue of dialogues) {
    // 跳过被其他对话通过 next 引用的对话
    // 这些对话会被链头收集，不需要单独处理
    if (referencedByNext.has(dialogue.id)) {
      continue;
    }

    // 这是一个独立对话或链头，追踪整个链
    const chain: IDialogue[] = [dialogue];
    let current = dialogue;
    while (current.next && dialogueMap.has(current.next)) {
      const nextDialogue = dialogueMap.get(current.next)!;
      chain.push(nextDialogue);
      current = nextDialogue;
      // 防止无限循环
      if (chain.length > 100) break;
    }
    dialogueChains.set(dialogue.id, chain);
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

    // 从最后一行获取 choices，从整个链合并 trigger
    const lastDialogue = chain[chain.length - 1];
    
    // 合并整个链中所有对话的 trigger（cards, flags, foreshadow 等）
    const mergedTrigger: {
      cards: string[];
      card?: string;
      foreshadow?: [string, string];
      flags: Array<{ name: string; value: boolean }>;
      ability?: string;
    } = { cards: [], flags: [] };
    
    for (const d of chain) {
      if (d.trigger) {
        // 合并卡片
        if ((d.trigger as { cards?: string[] }).cards) {
          mergedTrigger.cards.push(...(d.trigger as { cards?: string[] }).cards!);
        } else if (d.trigger.card) {
          mergedTrigger.cards.push(d.trigger.card);
        }
        // 合并伏笔（后面的覆盖前面的）
        if (d.trigger.foreshadow) {
          mergedTrigger.foreshadow = d.trigger.foreshadow;
        }
        // 合并 flags
        if (d.trigger.flags) {
          mergedTrigger.flags.push(...d.trigger.flags);
        }
        // 合并能力（后面的覆盖前面的）
        if (d.trigger.ability) {
          mergedTrigger.ability = d.trigger.ability;
        }
      }
    }
    
    // 保持向后兼容：设置 card 为第一张卡片
    if (mergedTrigger.cards.length > 0) {
      mergedTrigger.card = mergedTrigger.cards[0];
    }
    
    // 判断是否有任何 trigger 内容
    const hasTrigger = mergedTrigger.cards.length > 0 || 
                       mergedTrigger.foreshadow || 
                       mergedTrigger.flags.length > 0 || 
                       mergedTrigger.ability;

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
              // 直接使用 flagTrue，或兼容旧版 dialogueCompleted
              flagTrue: c.condition.flagTrue ?? c.condition.dialogueCompleted,
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
      onComplete: hasTrigger
        ? ([
            // 支持多张卡片
            ...mergedTrigger.cards.map((cardId) => ({
              type: 'card' as const,
              cardId,
            })),
            // 伏笔
            mergedTrigger.foreshadow
              ? {
                  type: 'foreshadow' as const,
                  foreshadowId: mergedTrigger.foreshadow[0],
                  foreshadowStage: mergedTrigger.foreshadow[1] as
                    | 'plant'
                    | 'deepen'
                    | 'misread'
                    | 'collect',
                }
              : null,
            // 能力
            mergedTrigger.ability
              ? { type: 'ability' as const, abilityType: mergedTrigger.ability }
              : null,
            // Flags
            ...mergedTrigger.flags.map((f) => ({
              type: 'flag' as const,
              flagName: f.name,
              flagValue: f.value,
            })),
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
      // Phase 3: 传递 Gameplay 效果
      gameplayFx: card.gameplayFx?.map((fx) => ({
        trigger: fx.trigger,
        effects: fx.effects.map((effect) => ({
          type: effect.type,
          counter: effect.counter,
          delta: effect.delta,
          flagName: effect.flagName,
          flagValue: effect.flagValue,
          cardId: effect.cardId,
          abilityType: effect.abilityType,
        })),
      })),
      consumable: card.consumable,
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

/**
 * 动态加载单个对话文件并注册到 NarrativeEngine
 * 这是统一的动态加载入口，确保对话链被正确处理
 * 
 * @param yamlFile 文件名（不含路径和扩展名），如 "c0_z1"
 * @returns 是否加载成功
 */
export async function loadDialogueFileAndRegister(yamlFile: string): Promise<boolean> {
  try {
    // 动态fetch YAML文件（开发环境使用 /src/data，生产环境使用 /assets/data）
    const basePath = import.meta.env.DEV ? '/src/data/dialogues' : '/assets/data/dialogues';
    const response = await fetch(`${basePath}/${yamlFile}.yaml`);
    if (!response.ok) {
      logger.debug(`对话文件不存在: ${yamlFile}.yaml`);
      return false;
    }

    const content = await response.text();
    const dialogues = loadDialogues(content);
    
    if (dialogues.length === 0) {
      logger.debug(`对话文件无有效数据: ${yamlFile}.yaml`);
      return false;
    }

    // 使用统一的注册流程（正确处理对话链）
    registerDataToNarrativeEngine(dialogues, [], []);
    
    logger.info(`动态加载对话文件成功: ${yamlFile}.yaml (${dialogues.length}条对话)`);
    return true;
  } catch (error) {
    logger.warn(`动态加载对话失败: ${yamlFile}.yaml`, error);
    return false;
  }
}

/**
 * 根据对话ID推断YAML文件名
 * 这是统一的文件推断逻辑，供 NarrativeEngine 使用
 * 
 * @example "C0Z1_IDENTITY_PICKUP" -> "c0_z1"
 * @example "CENHUI_MONO_01" -> null (旧格式，无法推断)
 */
export function inferYamlFileFromDialogueId(dialogueId: string): string | null {
  // 新格式匹配: C{chapter}Z{zone}_xxx
  const newFormatMatch = dialogueId.match(/^C(\d+)Z(\d+)_/i);
  if (newFormatMatch) {
    const chapter = newFormatMatch[1].toLowerCase();
    const zone = newFormatMatch[2];
    return `c${chapter}_z${zone}`;
  }

  // 终章格式匹配: CFZ{zone}_xxx
  const finalChapterMatch = dialogueId.match(/^CFZ(\d+)_/i);
  if (finalChapterMatch) {
    const zone = finalChapterMatch[1];
    return `cf_z${zone}`;
  }

  // 特殊对话匹配
  if (dialogueId.startsWith('RV_') || dialogueId.includes('_RV_')) {
    return 'rv_dialogues';
  }
  if (dialogueId.startsWith('NG_') || dialogueId.includes('_NG_')) {
    return 'ngplus_dialogues';
  }

  // 序章旧格式的特殊处理
  // 这些 ID 模式通常在 c0_z1.yaml 中
  const c0z1Prefixes = ['CENHUI_', 'IDENTITY_', 'NOTICE_', 'NEIGHBOR_', 'DOOR_'];
  for (const prefix of c0z1Prefixes) {
    if (dialogueId.startsWith(prefix)) {
      return 'c0_z1';
    }
  }

  logger.debug(`无法推断对话文件: ${dialogueId}`);
  return null;
}
