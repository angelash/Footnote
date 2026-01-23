/**
 * 交互数据一致性审计脚本
 * 用法: npx tsx scripts/audit_interactions.ts
 *
 * 检查项：
 * 1. 场景 interactive.action 中引用的 dialogueId 是否存在
 * 2. 场景 interactive.action 中引用的 cardId 是否存在
 * 3. 场景物件依赖的 flagTrue/flagFalse 是否有设置来源
 * 4. 对话中引用的 cardId 是否存在
 * 5. 对话中的 next 引用是否存在
 * 6. 场景 gotoZone 引用的 zoneId 是否存在
 *
 * @module scripts/audit_interactions
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

// ES Module 兼容：获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== 类型定义 ====================

interface ISceneAction {
  type: 'dialogue' | 'card' | 'gotoZone' | 'none';
  dialogueId?: string;
  cardId?: string;
  zoneId?: string;
}

interface ISceneObjectCondition {
  flag?: string;
  flagTrue?: string;
  flagFalse?: string;
}

interface ISceneObject {
  id: string;
  condition?: ISceneObjectCondition;
  interactive?: {
    action?: ISceneAction;
  };
}

interface ISceneConfig {
  id: string;
  objects: ISceneObject[];
}

interface IDialogueChoice {
  next?: string;
  nextDialogueId?: string; // 另一种 next 字段名
  effect?: {
    r?: number;
    card?: string;
  };
  effects?: {
    setFlag?: {
      name: string;
      value: boolean | number;
    };
    rDelta?: number;
    pDelta?: number;
    giveCard?: string;
  };
}

interface IDialogueLine {
  speaker?: string;
  text?: string;
}

interface IDialogueOnComplete {
  type: string;
  cardId?: string;
  flagName?: string;
  flagValue?: boolean;
}

interface IDialogue {
  id: string;
  next?: string | null;
  choices?: IDialogueChoice[];
  trigger?: {
    card?: string;
    flags?: Array<{ name: string; value: boolean }>;
  };
  lines?: IDialogueLine[];
  onComplete?: IDialogueOnComplete[];
}

interface ICard {
  id: string;
  name: string;
}

interface IAuditIssue {
  severity: 'error' | 'warning';
  file: string;
  message: string;
}

// ==================== 数据扫描函数 ====================

const DATA_DIR = path.resolve(__dirname, '../src/data');

/**
 * 扫描所有场景配置
 */
function scanScenes(): Map<string, ISceneConfig> {
  const scenes = new Map<string, ISceneConfig>();
  const scenesDir = path.join(DATA_DIR, 'scenes');

  if (!fs.existsSync(scenesDir)) {
    console.warn(`场景目录不存在: ${scenesDir}`);
    return scenes;
  }

  const files = fs.readdirSync(scenesDir).filter((f) => f.endsWith('.yaml'));

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(scenesDir, file), 'utf-8');
      const scene = yaml.parse(content) as ISceneConfig;
      if (scene && scene.id) {
        scenes.set(scene.id, scene);
      }
    } catch (err) {
      console.error(`解析场景文件失败: ${file}`, err);
    }
  }

  return scenes;
}

/**
 * 扫描所有对话配置
 * 支持两种格式：
 * 1. 对象格式: dialogues: { ID: {...}, ... }
 * 2. 数组格式: dialogues: [ { id: ..., ... }, ... ]
 */
function scanDialogues(): Map<string, IDialogue> {
  const dialogues = new Map<string, IDialogue>();
  const dialoguesDir = path.join(DATA_DIR, 'dialogues');

  if (!fs.existsSync(dialoguesDir)) {
    console.warn(`对话目录不存在: ${dialoguesDir}`);
    return dialogues;
  }

  const files = fs.readdirSync(dialoguesDir).filter((f) => f.endsWith('.yaml'));

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dialoguesDir, file), 'utf-8');
      const data = yaml.parse(content) as {
        dialogues?: Record<string, IDialogue> | IDialogue[];
      };

      if (data?.dialogues) {
        // 支持数组格式: dialogues: [ { id: ..., ... }, ... ]
        if (Array.isArray(data.dialogues)) {
          for (const dialogue of data.dialogues) {
            if (dialogue.id) {
              dialogues.set(dialogue.id, dialogue);
            }
          }
        } else {
          // 支持对象格式: dialogues: { ID: {...}, ... }
          for (const [id, dialogue] of Object.entries(data.dialogues)) {
            dialogues.set(id, { ...dialogue, id });
          }
        }
      }
    } catch (err) {
      console.error(`解析对话文件失败: ${file}`, err);
    }
  }

  return dialogues;
}

/**
 * 扫描所有卡片配置
 */
function scanCards(): Set<string> {
  const cards = new Set<string>();
  const cardsDir = path.join(DATA_DIR, 'cards');

  if (!fs.existsSync(cardsDir)) {
    console.warn(`卡片目录不存在: ${cardsDir}`);
    return cards;
  }

  const files = fs.readdirSync(cardsDir).filter((f) => f.endsWith('.yaml'));

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(cardsDir, file), 'utf-8');
      const data = yaml.parse(content) as { cards?: Record<string, ICard> };

      if (data?.cards) {
        for (const id of Object.keys(data.cards)) {
          cards.add(id);
        }
      }
    } catch (err) {
      console.error(`解析卡片文件失败: ${file}`, err);
    }
  }

  return cards;
}

/**
 * 收集所有 flag 的设置来源
 */
function collectFlagSources(
  scenes: Map<string, ISceneConfig>,
  dialogues: Map<string, IDialogue>
): Set<string> {
  const flagSources = new Set<string>();

  // 从对话中收集 flag 设置
  for (const [, dialogue] of dialogues) {
    // trigger.flags
    if (dialogue.trigger?.flags) {
      for (const flag of dialogue.trigger.flags) {
        if (flag.value === true) {
          flagSources.add(flag.name);
        }
      }
    }

    // onComplete
    if (dialogue.onComplete) {
      for (const action of dialogue.onComplete) {
        if (action.type === 'flag' && action.flagName && action.flagValue === true) {
          flagSources.add(action.flagName);
        }
      }
    }

    // choices.effects.setFlag - 选项效果中的 flag 设置
    if (dialogue.choices) {
      for (const choice of dialogue.choices) {
        if (choice.effects?.setFlag?.name) {
          // 接受 true 或任何非假值（如数字 1）作为有效设置
          if (choice.effects.setFlag.value) {
            flagSources.add(choice.effects.setFlag.name);
          }
        }
      }
    }
  }

  // 从场景效果中收集 flag 设置（扩展点）
  // 未来可以从 action.effects 中收集 flag 设置
  // 目前场景中的 flag 设置主要通过对话触发

  return flagSources;
}

// ==================== 检查函数 ====================

/**
 * 检查引用完整性
 */
function checkReferences(): IAuditIssue[] {
  const scenes = scanScenes();
  const dialogues = scanDialogues();
  const cards = scanCards();
  const flagSources = collectFlagSources(scenes, dialogues);

  const issues: IAuditIssue[] = [];
  const sceneIds = new Set(scenes.keys());

  console.log(`扫描到: ${scenes.size} 个场景, ${dialogues.size} 个对话, ${cards.size} 张卡片\n`);

  // 1. 检查场景中的引用
  for (const [sceneId, scene] of scenes) {
    for (const obj of scene.objects || []) {
      const action = obj.interactive?.action;

      if (action) {
        // 检查 dialogueId 引用
        if (action.type === 'dialogue' && action.dialogueId) {
          if (!dialogues.has(action.dialogueId)) {
            issues.push({
              severity: 'error',
              file: `scenes/${sceneId}`,
              message: `对象 "${obj.id}" 引用的对话不存在: ${action.dialogueId}`,
            });
          }
        }

        // 检查 cardId 引用
        if (action.type === 'card' && action.cardId) {
          if (!cards.has(action.cardId)) {
            issues.push({
              severity: 'error',
              file: `scenes/${sceneId}`,
              message: `对象 "${obj.id}" 引用的卡片不存在: ${action.cardId}`,
            });
          }
        }

        // 检查 zoneId 引用
        if (action.type === 'gotoZone' && action.zoneId) {
          if (!sceneIds.has(action.zoneId)) {
            issues.push({
              severity: 'warning',
              file: `scenes/${sceneId}`,
              message: `对象 "${obj.id}" 引用的Zone可能不存在: ${action.zoneId}`,
            });
          }
        }
      }

      // 检查 flag 依赖
      const condition = obj.condition;
      if (condition) {
        const flagsToCheck = [condition.flag, condition.flagTrue].filter(Boolean) as string[];

        for (const flag of flagsToCheck) {
          if (!flagSources.has(flag)) {
            issues.push({
              severity: 'warning',
              file: `scenes/${sceneId}`,
              message: `对象 "${obj.id}" 依赖的 flag "${flag}" 没有找到设置来源`,
            });
          }
        }
      }
    }
  }

  // 2. 检查对话中的引用
  for (const [dialogueId, dialogue] of dialogues) {
    // 检查 next 引用
    if (dialogue.next && !dialogues.has(dialogue.next)) {
      issues.push({
        severity: 'error',
        file: `dialogues/${dialogueId}`,
        message: `对话 "${dialogueId}" 的 next 引用不存在: ${dialogue.next}`,
      });
    }

    // 检查 choices 中的 next 引用
    if (dialogue.choices) {
      for (let i = 0; i < dialogue.choices.length; i++) {
        const choice = dialogue.choices[i];
        if (choice.next && !dialogues.has(choice.next)) {
          issues.push({
            severity: 'error',
            file: `dialogues/${dialogueId}`,
            message: `对话 "${dialogueId}" 的选项 ${i + 1} 的 next 引用不存在: ${choice.next}`,
          });
        }
      }
    }

    // 检查 trigger.card 引用
    if (dialogue.trigger?.card) {
      if (!cards.has(dialogue.trigger.card)) {
        issues.push({
          severity: 'error',
          file: `dialogues/${dialogueId}`,
          message: `对话 "${dialogueId}" 触发的卡片不存在: ${dialogue.trigger.card}`,
        });
      }
    }

    // 检查 onComplete 中的 cardId
    if (dialogue.onComplete) {
      for (const action of dialogue.onComplete) {
        if (action.type === 'card' && action.cardId) {
          if (!cards.has(action.cardId)) {
            issues.push({
              severity: 'error',
              file: `dialogues/${dialogueId}`,
              message: `对话 "${dialogueId}" 的 onComplete 卡片不存在: ${action.cardId}`,
            });
          }
        }
      }
    }
  }

  return issues;
}

/**
 * 检查 once 交互的重复性问题
 */
function checkOnceInteractions(): IAuditIssue[] {
  const scenes = scanScenes();
  const issues: IAuditIssue[] = [];

  // 收集所有 card 类型交互
  const cardInteractions = new Map<string, string[]>();

  for (const [sceneId, scene] of scenes) {
    for (const obj of scene.objects || []) {
      const action = obj.interactive?.action;
      if (action?.type === 'card' && action.cardId) {
        const cardId = action.cardId;
        if (!cardInteractions.has(cardId)) {
          cardInteractions.set(cardId, []);
        }
        cardInteractions.get(cardId)!.push(`${sceneId}/${obj.id}`);
      }
    }
  }

  // 检查是否有多个地方可以获得同一张卡片
  for (const [cardId, locations] of cardInteractions) {
    if (locations.length > 1) {
      issues.push({
        severity: 'warning',
        file: 'multiple',
        message: `卡片 "${cardId}" 可在多个地方获得: ${locations.join(', ')}`,
      });
    }
  }

  return issues;
}

// ==================== 主函数 ====================

function main(): void {
  console.log('=== 交互数据一致性审计 ===\n');

  const issues: IAuditIssue[] = [];

  // 执行各项检查
  console.log('检查引用完整性...');
  issues.push(...checkReferences());

  console.log('检查 once 交互重复性...');
  issues.push(...checkOnceInteractions());

  console.log('');

  // 统计和输出结果
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  if (issues.length === 0) {
    console.log('✅ 没有发现问题');
    process.exit(0);
  } else {
    if (errors.length > 0) {
      console.log(`\n❌ 发现 ${errors.length} 个错误:\n`);
      for (const issue of errors) {
        console.log(`  [ERROR] [${issue.file}] ${issue.message}`);
      }
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️  发现 ${warnings.length} 个警告:\n`);
      for (const issue of warnings) {
        console.log(`  [WARN] [${issue.file}] ${issue.message}`);
      }
    }

    console.log(`\n总计: ${errors.length} 错误, ${warnings.length} 警告`);

    // 如果有错误，返回非零退出码
    if (errors.length > 0) {
      process.exit(1);
    }
  }
}

main();
