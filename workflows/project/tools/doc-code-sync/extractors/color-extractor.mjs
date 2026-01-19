/**
 * Color Constant Extractor
 * 
 * 从文档和代码中提取颜色常量
 * 
 * @module doc-code-sync/extractors/color-extractor
 */

import fs from 'fs';

/**
 * 从 Markdown 文档（如 Art Bible）中提取颜色定义
 * @param {string} filePath - Markdown 文件路径
 * @returns {Promise<Map<string, {value: string, context: string}>>}
 */
export async function extractColorsFromDoc(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const colors = new Map();
  
  // 提取表格中的颜色
  // 匹配: | xxx | xxx | `#xxxxxx` |
  const tableColorRegex = /\|\s*\*?\*?([^|]+?)\*?\*?\s*\|\s*([^|]+?)\s*\|\s*`?(#[0-9A-Fa-f]{6})`?\s*(?:,\s*`?(#[0-9A-Fa-f]{6})`?)?\s*\|/g;
  let match;
  
  while ((match = tableColorRegex.exec(content)) !== null) {
    const category = match[1].trim();
    const usage = match[2].trim();
    const color1 = match[3];
    const color2 = match[4];
    
    // 生成规范化的键名
    const key1 = normalizeColorKey(category, usage, 0);
    colors.set(key1, {
      value: color1.toLowerCase(),
      context: `${category} - ${usage}`,
      category,
      usage,
    });
    
    if (color2) {
      const key2 = normalizeColorKey(category, usage, 1);
      colors.set(key2, {
        value: color2.toLowerCase(),
        context: `${category} - ${usage} (secondary)`,
        category,
        usage,
      });
    }
  }
  
  // 提取 Markdown 代码块中的颜色定义
  // 匹配: `#xxxxxx` 后面带有说明文字
  const inlineColorRegex = /`(#[0-9A-Fa-f]{6})`\s*[-:：]\s*([^\n`]+)/g;
  
  while ((match = inlineColorRegex.exec(content)) !== null) {
    const color = match[1];
    const description = match[2].trim();
    const key = normalizeColorKey(description);
    
    if (!colors.has(key)) {
      colors.set(key, {
        value: color.toLowerCase(),
        context: description,
      });
    }
  }
  
  // 提取能力效果配色表
  // | 能力 | 主色 | 辅色 | 效果描述 |
  const abilityColorRegex = /\|\s*([^|]+?)\s*\|\s*[^|]*`?(#[0-9A-Fa-f]{6})`?\s*\|\s*[^|]*`?(#[0-9A-Fa-f]{6})`?\s*\|\s*([^|]+?)\s*\|/g;
  
  while ((match = abilityColorRegex.exec(content)) !== null) {
    const ability = match[1].trim();
    const primaryColor = match[2];
    const secondaryColor = match[3];
    const description = match[4].trim();
    
    // 跳过表头
    if (ability.includes('能力') || ability.includes('---')) continue;
    
    colors.set(`ability_${sanitizeKey(ability)}_primary`, {
      value: primaryColor.toLowerCase(),
      context: `${ability} ability - primary`,
      category: 'ability',
    });
    
    colors.set(`ability_${sanitizeKey(ability)}_secondary`, {
      value: secondaryColor.toLowerCase(),
      context: `${ability} ability - secondary`,
      category: 'ability',
    });
  }
  
  return colors;
}

/**
 * 从 TypeScript 代码中提取颜色常量
 * @param {string} filePath - TypeScript 文件路径
 * @returns {Promise<Map<string, {value: string, context: string}>>}
 */
export async function extractColorsFromCode(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const colors = new Map();
  
  // 提取对象字面量中的颜色
  // 匹配: KEY: '#xxxxxx' 或 KEY: "#xxxxxx"
  const objectColorRegex = /(\w+):\s*['"]?(#[0-9A-Fa-f]{6})['"]?/g;
  let match;
  
  while ((match = objectColorRegex.exec(content)) !== null) {
    const key = match[1];
    const color = match[2];
    
    colors.set(key.toLowerCase(), {
      value: color.toLowerCase(),
      context: `Code constant: ${key}`,
      key: key,
    });
  }
  
  // 提取 createFontStyle 调用中的颜色
  // 匹配: createFontStyle(xxx, '#xxxxxx', ...)
  const fontStyleColorRegex = /createFontStyle\([^,]+,\s*['"]?(#[0-9A-Fa-f]{6})['"]?/g;
  
  while ((match = fontStyleColorRegex.exec(content)) !== null) {
    const color = match[1];
    const key = `fontStyle_${color.toLowerCase()}`;
    
    if (!colors.has(key)) {
      colors.set(key, {
        value: color.toLowerCase(),
        context: `Font style default color`,
      });
    }
  }
  
  // 提取 color: '#xxxxxx' 模式
  const colorPropertyRegex = /color:\s*['"]?(#[0-9A-Fa-f]{6})['"]?/g;
  
  while ((match = colorPropertyRegex.exec(content)) !== null) {
    const color = match[1];
    const key = `color_${color.toLowerCase()}`;
    
    if (!colors.has(key)) {
      colors.set(key, {
        value: color.toLowerCase(),
        context: `Color property`,
      });
    }
  }
  
  return colors;
}

/**
 * 标准化颜色键名
 * @param {string} category - 分类
 * @param {string} usage - 用途
 * @param {number} index - 索引（用于多个颜色）
 * @returns {string}
 */
function normalizeColorKey(category, usage = '', index = 0) {
  const parts = [category, usage].filter(Boolean);
  const base = parts.join('_');
  const key = sanitizeKey(base);
  return index > 0 ? `${key}_${index}` : key;
}

/**
 * 清理键名
 * @param {string} str - 原始字符串
 * @returns {string}
 */
function sanitizeKey(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

/**
 * 标准化颜色值
 * @param {string} color - 颜色值
 * @returns {string}
 */
export function normalizeColor(color) {
  return color.toLowerCase().trim();
}

/**
 * 检查两个颜色是否相等
 * @param {string} color1 - 颜色1
 * @param {string} color2 - 颜色2
 * @returns {boolean}
 */
export function colorsEqual(color1, color2) {
  return normalizeColor(color1) === normalizeColor(color2);
}
