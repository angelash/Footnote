/**
 * Task API Client
 * 任务提交 API 客户端
 */

import { API_BASE } from './consoleApi';

// ============================================
// 类型定义
// ============================================

// 任务类型分类
export type TaskCategory = 
  | 'intake'      // 制作人入口
  | 'engineering' // 工程开发
  | 'art'         // 美术制作
  | 'level'       // 关卡设计
  | 'whitebox'    // 白盒占位
  | 'lead';       // 组长任务

// 角色类型
export type RoleType =
  | 'L3_engineer'
  | 'L3_writer'
  | 'L3_tester'
  | 'L3_scripter'
  | 'L3_ui_engineer'
  | 'L3_level_designer'
  | 'L3_environment_artist'
  | 'L3_character_artist'
  | 'L3_animator'
  | 'L3_vfx_artist'
  | 'L2_level_lead'
  | 'L2_art_lead';

// 任务提交输入
export interface TaskSubmitInput {
  // 基础信息
  title: string;
  description: string;
  task_type?: string;
  priority?: number;

  // 路由信息
  role?: RoleType;
  category?: TaskCategory;

  // 任务参数
  task_id?: string;
  task_pack_path?: string;
  complexity?: string;
  model_override?: string;

  // 美术相关
  zone_id?: string;
  scene_name?: string;
  character_id?: string;
  animation_type?: string;
  effect_type?: string;
  asset_list?: string;

  // 关卡相关
  chapter_id?: string;

  // 白盒相关
  whitebox_type?: 'scene' | 'character' | 'object';
  object_id?: string;
  billboard_text?: string;
  color?: string;

  // 队列选项
  async?: boolean;
  queue_id?: string;
}

// 任务响应
export interface TaskResponse {
  ok: boolean;
  run_id?: string;
  status?: string;
  async?: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

// 角色配置
export interface RoleConfig {
  id: RoleType;
  name: string;
  emoji: string;
  category: TaskCategory;
  endpoint: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
}

// ============================================
// 角色配置表
// ============================================

export const ROLE_CONFIGS: RoleConfig[] = [
  // 制作人入口
  {
    id: 'L3_engineer',
    name: '智能派单',
    emoji: '🎯',
    category: 'intake',
    endpoint: '/api/task/intake',
    description: '自动分析需求，智能路由到合适的角色',
    requiredFields: ['title', 'description'],
    optionalFields: ['task_type', 'priority'],
  },

  // 工程开发
  {
    id: 'L3_engineer',
    name: '通用工程师',
    emoji: '👨‍💻',
    category: 'engineering',
    endpoint: '/api/task/role',
    description: '通用功能开发、bug修复',
    requiredFields: ['title', 'task_pack_path'],
    optionalFields: ['complexity', 'model_override'],
  },
  {
    id: 'L3_scripter',
    name: '脚本程序员',
    emoji: '📜',
    category: 'engineering',
    endpoint: '/api/task/l3/scripter',
    description: '游戏脚本、事件逻辑开发',
    requiredFields: ['title', 'task_pack_path'],
    optionalFields: ['complexity'],
  },
  {
    id: 'L3_ui_engineer',
    name: 'UI工程师',
    emoji: '🖥️',
    category: 'engineering',
    endpoint: '/api/task/l3/ui-engineer',
    description: 'UI系统、界面交互开发',
    requiredFields: ['title', 'task_pack_path'],
    optionalFields: ['complexity'],
  },
  {
    id: 'L3_writer',
    name: '编剧/文案',
    emoji: '✍️',
    category: 'engineering',
    endpoint: '/api/task/l3/writer',
    description: '对白、剧情、文案撰写',
    requiredFields: ['title', 'task_pack_path'],
    optionalFields: ['chapter_id'],
  },
  {
    id: 'L3_tester',
    name: '测试员',
    emoji: '🧪',
    category: 'engineering',
    endpoint: '/api/task/l3/tester',
    description: '功能测试、bug验证',
    requiredFields: ['title', 'task_pack_path'],
    optionalFields: ['complexity'],
  },

  // 美术制作
  {
    id: 'L3_environment_artist',
    name: '场景美术',
    emoji: '🏞️',
    category: 'art',
    endpoint: '/api/task/l3/environment-artist',
    description: '场景背景、环境资产制作',
    requiredFields: ['title', 'zone_id'],
    optionalFields: ['asset_list', 'scene_name'],
  },
  {
    id: 'L3_character_artist',
    name: '角色美术',
    emoji: '🎭',
    category: 'art',
    endpoint: '/api/task/l3/character-artist',
    description: '角色立绘、表情制作',
    requiredFields: ['title', 'character_id'],
    optionalFields: ['asset_list'],
  },
  {
    id: 'L3_animator',
    name: '动画师',
    emoji: '🎬',
    category: 'art',
    endpoint: '/api/task/l3/animator',
    description: '角色动画、过场动画制作',
    requiredFields: ['title', 'character_id', 'animation_type'],
    optionalFields: ['asset_list'],
  },
  {
    id: 'L3_vfx_artist',
    name: '特效师',
    emoji: '✨',
    category: 'art',
    endpoint: '/api/task/l3/vfx-artist',
    description: '技能特效、环境特效制作',
    requiredFields: ['title', 'effect_type'],
    optionalFields: ['asset_list', 'zone_id'],
  },

  // 关卡设计
  {
    id: 'L3_level_designer',
    name: '关卡策划',
    emoji: '🗺️',
    category: 'level',
    endpoint: '/api/task/l3/level-designer',
    description: '关卡布局、场景设计',
    requiredFields: ['title', 'zone_id'],
    optionalFields: ['chapter_id'],
  },
  {
    id: 'L2_level_lead',
    name: '关卡组长',
    emoji: '📋',
    category: 'lead',
    endpoint: '/api/task/l2/level-lead',
    description: '关卡任务分解和分配',
    requiredFields: ['title', 'chapter_id'],
    optionalFields: ['zone_id'],
  },
  {
    id: 'L2_art_lead',
    name: '美术组长',
    emoji: '🎨',
    category: 'lead',
    endpoint: '/api/task/l2/art-lead',
    description: '美术任务分解和分配',
    requiredFields: ['title', 'chapter_id'],
    optionalFields: ['zone_id'],
  },
];

// 白盒配置
export const WHITEBOX_CONFIGS = [
  {
    type: 'scene' as const,
    name: '场景白盒',
    emoji: '🏗️',
    endpoint: '/api/task/whitebox/scene',
    description: '生成场景占位配置',
    requiredFields: ['zone_id', 'scene_name'],
  },
  {
    type: 'character' as const,
    name: '角色白盒',
    emoji: '👤',
    endpoint: '/api/task/whitebox/character',
    description: '生成角色占位配置',
    requiredFields: ['character_id'],
  },
  {
    type: 'object' as const,
    name: '物件白盒',
    emoji: '📦',
    endpoint: '/api/task/whitebox/object',
    description: '生成物件占位配置',
    requiredFields: ['object_id'],
  },
];

// ============================================
// API 函数
// ============================================

/**
 * 制作人统一入口 - 智能派单
 */
export async function submitIntake(input: TaskSubmitInput): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE}/task/intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      task_type: input.task_type || 'feature',
      priority: input.priority || 5,
      async: input.async ?? true,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit task: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 通用角色任务提交
 */
export async function submitRoleTask(role: RoleType, input: TaskSubmitInput): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE}/task/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role,
      ...input,
      async: input.async ?? true,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit role task: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 特定端点任务提交
 */
export async function submitToEndpoint(endpoint: string, input: TaskSubmitInput): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      async: input.async ?? true,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit task: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 白盒任务提交
 */
export async function submitWhitebox(
  type: 'scene' | 'character' | 'object',
  input: TaskSubmitInput
): Promise<TaskResponse> {
  const endpoint = `/api/task/whitebox/${type}`;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit whitebox task: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 任务分解（组长）
 */
export async function submitDecompose(input: TaskSubmitInput): Promise<TaskResponse> {
  const response = await fetch(`${API_BASE}/task/lead/decompose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      async: input.async ?? true,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit decompose task: ${response.statusText}`);
  }
  return response.json();
}

// ============================================
// 辅助函数
// ============================================

export function getCategoryLabel(category: TaskCategory): string {
  const labels: Record<TaskCategory, string> = {
    intake: '🎯 智能派单',
    engineering: '👨‍💻 工程开发',
    art: '🎨 美术制作',
    level: '🗺️ 关卡设计',
    whitebox: '🏗️ 白盒占位',
    lead: '📋 组长任务',
  };
  return labels[category];
}

export function getCategoryColor(category: TaskCategory): string {
  const colors: Record<TaskCategory, string> = {
    intake: '#8b5cf6',
    engineering: '#3b82f6',
    art: '#ec4899',
    level: '#10b981',
    whitebox: '#6b7280',
    lead: '#f59e0b',
  };
  return colors[category];
}

export function getRolesByCategory(category: TaskCategory): RoleConfig[] {
  return ROLE_CONFIGS.filter((r) => r.category === category);
}
