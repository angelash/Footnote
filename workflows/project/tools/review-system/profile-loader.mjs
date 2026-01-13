#!/usr/bin/env node
/**
 * profile-loader.mjs - 审查配置加载器
 * 
 * 功能：
 * - 加载 audit-profiles.yaml 配置
 * - 解析审查范围和路径过滤
 * - 提供配置查询接口
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置文件路径
const CONFIG_PATH = path.join(__dirname, '../../config/audit-profiles.yaml');

// 缓存已加载的配置
let cachedConfig = null;

/**
 * 加载审查配置
 * @returns {Promise<Object>} 配置对象
 */
export async function loadConfig() {
  if (cachedConfig) return cachedConfig;
  
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf8');
    cachedConfig = parseYaml(content);
    return cachedConfig;
  } catch (error) {
    console.error('[profile-loader] 加载配置失败:', error.message);
    // 返回默认配置
    return getDefaultConfig();
  }
}

/**
 * 获取默认配置
 */
function getDefaultConfig() {
  return {
    profiles: {
      all: {
        name: '全量审查',
        description: '审查整个项目',
        include_paths: ['**'],
        exclude_paths: ['node_modules/**', '**/logs/**'],
        design_docs: ['design/**'],
        focus: ['all'],
        commit_filter: '',
      }
    },
    annotation_statuses: {
      dismissed: { label: '误报/不适用', skip_on_reaudit: true },
      acknowledged: { label: '已知问题', skip_on_reaudit: false },
      fixed: { label: '已修复', verify_on_reaudit: true },
      wontfix: { label: '不修复', skip_on_reaudit: true },
      deferred: { label: '延期处理', show_reminder: true },
    },
    annotation_reasons: [
      { id: 'false_positive', label: '误报' },
      { id: 'known_issue', label: '已知问题' },
      { id: 'other', label: '其他' },
    ],
  };
}

/**
 * 获取指定的审查配置
 * @param {string} profileName - 配置名称（如 'game-product', 'pipeline-tools', 'all'）
 * @returns {Promise<Object>} 配置对象
 */
export async function getProfile(profileName) {
  const config = await loadConfig();
  const profile = config.profiles?.[profileName];
  
  if (!profile) {
    console.warn(`[profile-loader] 配置 '${profileName}' 不存在，使用默认配置 'all'`);
    return config.profiles?.all || getDefaultConfig().profiles.all;
  }
  
  return profile;
}

/**
 * 获取所有可用的配置名称
 * @returns {Promise<string[]>}
 */
export async function listProfiles() {
  const config = await loadConfig();
  return Object.keys(config.profiles || {});
}

/**
 * 获取标注状态配置
 * @returns {Promise<Object>}
 */
export async function getAnnotationStatuses() {
  const config = await loadConfig();
  return config.annotation_statuses || getDefaultConfig().annotation_statuses;
}

/**
 * 获取标注原因选项
 * @returns {Promise<Array>}
 */
export async function getAnnotationReasons() {
  const config = await loadConfig();
  return config.annotation_reasons || getDefaultConfig().annotation_reasons;
}

/**
 * 检查文件路径是否匹配配置的包含/排除规则
 * @param {string} filePath - 文件路径
 * @param {Object} profile - 配置对象
 * @returns {boolean}
 */
export function matchesProfile(filePath, profile) {
  const { include_paths = ['**'], exclude_paths = [] } = profile;
  
  // 检查是否匹配排除规则
  for (const pattern of exclude_paths) {
    if (matchGlob(filePath, pattern)) {
      return false;
    }
  }
  
  // 检查是否匹配包含规则
  for (const pattern of include_paths) {
    if (matchGlob(filePath, pattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 简单的 glob 匹配（支持 ** 和 *）
 * @param {string} filePath 
 * @param {string} pattern 
 * @returns {boolean}
 */
function matchGlob(filePath, pattern) {
  // 标准化路径
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');
  
  // 转换 glob 为正则
  let regex = normalizedPattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{DOUBLE_STAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/{{DOUBLE_STAR}}/g, '.*');
  
  // 如果模式不以 ^ 开头，允许任意前缀
  if (!regex.startsWith('^')) {
    regex = '(^|/)' + regex;
  }
  
  // 如果模式不以 $ 结尾，允许任意后缀（但要求是目录边界或文件结尾）
  if (!regex.endsWith('$')) {
    regex = regex + '($|/)';
  }
  
  try {
    return new RegExp(regex).test(normalizedPath);
  } catch {
    return false;
  }
}

/**
 * 过滤文件列表，只保留匹配配置的文件
 * @param {string[]} files - 文件路径列表
 * @param {Object} profile - 配置对象
 * @returns {string[]}
 */
export function filterFiles(files, profile) {
  return files.filter(f => matchesProfile(f, profile));
}

/**
 * 获取 git commit 过滤参数
 * @param {Object} profile - 配置对象
 * @returns {string}
 */
export function getCommitFilter(profile) {
  return profile.commit_filter || '';
}

// 命令行测试
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const profileName = process.argv[2] || 'all';
  
  (async () => {
    console.log('可用配置:', await listProfiles());
    console.log(`\n配置 '${profileName}':`);
    console.log(JSON.stringify(await getProfile(profileName), null, 2));
  })();
}
