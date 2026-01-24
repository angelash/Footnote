/**
 * NG+ 对话触发配置
 * 定义 NG+ 专属对话的触发条件和时机
 * @module config/ngplus.config
 */

export interface INGPlusDialogueTrigger {
  /** NG+ 对话ID */
  dialogueId: string;
  /** 触发条件：需要哪些 flag 为 true */
  requiredFlags: string[];
  /** 阻止条件：哪些 flag 为 true 时不触发 */
  blockedByFlags?: string[];
  /** 触发后设置的 flag（防止重复触发） */
  setFlagOnComplete?: string;
  /** 触发时机：进入场景时 / 对话结束后 */
  triggerOn: 'zoneEnter' | 'afterDialogue';
  /** 触发位置：Zone ID 或对话 ID */
  triggerLocation: string;
  /** 优先级（同一位置多个触发时，数字大的优先） */
  priority?: number;
}

/**
 * NG+ 对话触发配置表
 * 按触发时机分组
 */
export const NGPLUS_DIALOGUE_TRIGGERS: INGPlusDialogueTrigger[] = [
  // ==================== 进入场景时触发 ====================

  // C0-Z1 进入时：系统循环检测（周回2+）
  {
    dialogueId: 'NGP_C0_SYSTEM_ECHO',
    requiredFlags: ['NG_PLUS_CYCLE_2'],
    blockedByFlags: ['FLAG_NGP_SYSTEM_ECHO_SHOWN'],
    setFlagOnComplete: 'FLAG_NGP_SYSTEM_ECHO_SHOWN',
    triggerOn: 'zoneEnter',
    triggerLocation: 'C0-Z1',
    priority: 10,
  },

  // ==================== 对话结束后触发 ====================

  // C0-Z4 与顾临对话后：顾临察觉异常（NG+首周回）
  {
    dialogueId: 'NGP_C0_GULIN_HINT',
    requiredFlags: ['IS_NEW_GAME_PLUS'],
    blockedByFlags: ['FLAG_NGP_GULIN_HINT_SHOWN', 'NG_PLUS_CYCLE_2'], // 只在第一周回触发
    setFlagOnComplete: 'FLAG_NGP_GULIN_HINT_SHOWN',
    triggerOn: 'afterDialogue',
    triggerLocation: 'C0Z4_GULIN_TALK',
    priority: 5,
  },

  // C0-Z4 与顾临对话后：全结局后的深度对话
  {
    dialogueId: 'NGP_GULIN_TRUE_THOUGHTS',
    requiredFlags: ['ALL_ENDINGS_ACHIEVED'],
    blockedByFlags: ['FLAG_NGP_GULIN_TRUE_SHOWN'],
    setFlagOnComplete: 'FLAG_NGP_GULIN_TRUE_SHOWN',
    triggerOn: 'afterDialogue',
    triggerLocation: 'C0Z4_GULIN_TALK',
    priority: 10,
  },

  // 全结局后：顾临的选择对话
  {
    dialogueId: 'NGP_GULIN_CHOICE',
    requiredFlags: ['ALL_ENDINGS_ACHIEVED', 'FLAG_NGP_GULIN_TRUE_SHOWN'],
    blockedByFlags: ['FLAG_NGP_GULIN_CHOICE_SHOWN'],
    setFlagOnComplete: 'FLAG_NGP_GULIN_CHOICE_SHOWN',
    triggerOn: 'afterDialogue',
    triggerLocation: 'NGP_GULIN_TRUE_THOUGHTS',
    priority: 5,
  },

  // 宋岚相关章节（C2/C3/CF）：记忆对话
  {
    dialogueId: 'NGP_SONGLAN_REMEMBER',
    requiredFlags: ['IS_NEW_GAME_PLUS'],
    blockedByFlags: ['FLAG_NGP_SONGLAN_REMEMBER_SHOWN', 'NG_PLUS_CYCLE_3'],
    setFlagOnComplete: 'FLAG_NGP_SONGLAN_REMEMBER_SHOWN',
    triggerOn: 'zoneEnter',
    triggerLocation: 'C2-Z3', // 宋岚首次正式出场
    priority: 5,
  },

  // 宋岚周回3对话
  {
    dialogueId: 'NGP_SONGLAN_CYCLE_3',
    requiredFlags: ['NG_PLUS_CYCLE_3'],
    blockedByFlags: ['FLAG_NGP_SONGLAN_CYCLE3_SHOWN'],
    setFlagOnComplete: 'FLAG_NGP_SONGLAN_CYCLE3_SHOWN',
    triggerOn: 'zoneEnter',
    triggerLocation: 'C2-Z3',
    priority: 10,
  },

  // 栖蓝背景故事（全结局后）
  {
    dialogueId: 'NGP_QILAN_BACKSTORY',
    requiredFlags: ['ALL_ENDINGS_ACHIEVED'],
    blockedByFlags: ['FLAG_NGP_QILAN_BACKSTORY_SHOWN'],
    setFlagOnComplete: 'FLAG_NGP_QILAN_BACKSTORY_SHOWN',
    triggerOn: 'zoneEnter',
    triggerLocation: 'C3-Z4', // 栖蓝相关区域
    priority: 5,
  },

  // 陈匠额外对话（NG+）
  {
    dialogueId: 'NGP_CHENJIANG_LIGHT',
    requiredFlags: ['IS_NEW_GAME_PLUS'],
    blockedByFlags: ['FLAG_NGP_CHENJIANG_SHOWN'],
    setFlagOnComplete: 'FLAG_NGP_CHENJIANG_SHOWN',
    triggerOn: 'zoneEnter',
    triggerLocation: 'C4-Z7', // 陈匠相关区域
    priority: 5,
  },

  // 阿棠周回3对话
  {
    dialogueId: 'NGP_ATANG_DRIFT',
    requiredFlags: ['NG_PLUS_CYCLE_3'],
    blockedByFlags: ['FLAG_NGP_ATANG_DRIFT_SHOWN'],
    setFlagOnComplete: 'FLAG_NGP_ATANG_DRIFT_SHOWN',
    triggerOn: 'zoneEnter',
    triggerLocation: 'C3-Z2', // 阿棠相关区域
    priority: 5,
  },

  // 牧平预言（周回2+）
  {
    dialogueId: 'NGP_MUPING_PROPHECY',
    requiredFlags: ['NG_PLUS_CYCLE_2'],
    blockedByFlags: ['FLAG_NGP_MUPING_PROPHECY_SHOWN'],
    setFlagOnComplete: 'FLAG_NGP_MUPING_PROPHECY_SHOWN',
    triggerOn: 'zoneEnter',
    triggerLocation: 'C4-Z3', // 牧平相关区域
    priority: 5,
  },

  // 系统观察5（周回5）
  {
    dialogueId: 'NGP_SYSTEM_OBSERVE_5',
    requiredFlags: ['NG_PLUS_CYCLE_5'],
    blockedByFlags: ['FLAG_NGP_SYSTEM_OBSERVE5_SHOWN'],
    setFlagOnComplete: 'FLAG_NGP_SYSTEM_OBSERVE5_SHOWN',
    triggerOn: 'zoneEnter',
    triggerLocation: 'CF-Z1', // 终章开始
    priority: 10,
  },

  // 系统最终（周回10）
  {
    dialogueId: 'NGP_SYSTEM_FINAL',
    requiredFlags: ['NG_PLUS_CYCLE_10'],
    blockedByFlags: ['FLAG_NGP_SYSTEM_FINAL_SHOWN'],
    setFlagOnComplete: 'FLAG_NGP_SYSTEM_FINAL_SHOWN',
    triggerOn: 'zoneEnter',
    triggerLocation: 'CF-Z5', // 终章结局选择
    priority: 20,
  },
];

/**
 * 获取指定 Zone 进入时的 NG+ 触发
 */
export function getNGPlusZoneEnterTriggers(zoneId: string): INGPlusDialogueTrigger[] {
  return NGPLUS_DIALOGUE_TRIGGERS.filter(
    (t) => t.triggerOn === 'zoneEnter' && t.triggerLocation === zoneId
  ).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

/**
 * 获取指定对话结束后的 NG+ 触发
 */
export function getNGPlusAfterDialogueTriggers(dialogueId: string): INGPlusDialogueTrigger[] {
  return NGPLUS_DIALOGUE_TRIGGERS.filter(
    (t) => t.triggerOn === 'afterDialogue' && t.triggerLocation === dialogueId
  ).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
