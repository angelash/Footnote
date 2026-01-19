/**
 * Spec Document Interface Extractor
 * 
 * 从 Markdown 规格文档中提取 TypeScript 接口定义
 * 支持提取:
 * - interface 定义
 * - type 别名
 * - enum 定义
 * 
 * @module doc-code-sync/extractors/spec-extractor
 */

import fs from 'fs';

/**
 * 从 Spec 文档中提取接口定义
 * @param {string} filePath - Markdown 文件路径
 * @returns {Promise<Array<{name: string, type: string, members: Array, raw: string}>>}
 */
export async function extractInterfacesFromSpec(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const interfaces = [];
  
  // 提取 TypeScript 代码块
  const codeBlockRegex = /```typescript\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const codeBlock = match[1];
    
    // 提取 interface 定义
    const extractedInterfaces = extractInterfaces(codeBlock);
    interfaces.push(...extractedInterfaces);
    
    // 提取 type 定义
    const extractedTypes = extractTypes(codeBlock);
    interfaces.push(...extractedTypes);
    
    // 提取 enum 定义
    const extractedEnums = extractEnums(codeBlock);
    interfaces.push(...extractedEnums);
  }
  
  return interfaces;
}

/**
 * 提取 interface 定义
 * @param {string} code - TypeScript 代码
 * @returns {Array<{name: string, type: string, members: Array, raw: string}>}
 */
function extractInterfaces(code) {
  const interfaces = [];
  
  // 匹配 interface 定义（支持 export）
  const interfaceRegex = /(?:export\s+)?interface\s+(\w+)(?:<[^>]+>)?\s*(?:extends\s+[^{]+)?\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
  let match;
  
  while ((match = interfaceRegex.exec(code)) !== null) {
    const name = match[1];
    const body = match[2];
    const members = parseInterfaceMembers(body);
    
    interfaces.push({
      name,
      type: 'interface',
      members,
      raw: match[0].trim(),
    });
  }
  
  return interfaces;
}

/**
 * 提取 type 定义
 * @param {string} code - TypeScript 代码
 * @returns {Array<{name: string, type: string, definition: string, raw: string}>}
 */
function extractTypes(code) {
  const types = [];
  
  // 匹配 type 定义（支持 export）
  const typeRegex = /(?:export\s+)?type\s+(\w+)(?:<[^>]+>)?\s*=\s*([^;]+);/g;
  let match;
  
  while ((match = typeRegex.exec(code)) !== null) {
    const name = match[1];
    const definition = match[2].trim();
    
    types.push({
      name,
      type: 'type',
      definition,
      members: parseTypeMembers(definition),
      raw: match[0].trim(),
    });
  }
  
  return types;
}

/**
 * 提取 enum 定义
 * @param {string} code - TypeScript 代码
 * @returns {Array<{name: string, type: string, members: Array, raw: string}>}
 */
function extractEnums(code) {
  const enums = [];
  
  // 匹配 enum 定义（支持 export）
  const enumRegex = /(?:export\s+)?enum\s+(\w+)\s*\{([^}]*)\}/g;
  let match;
  
  while ((match = enumRegex.exec(code)) !== null) {
    const name = match[1];
    const body = match[2];
    const members = parseEnumMembers(body);
    
    enums.push({
      name,
      type: 'enum',
      members,
      raw: match[0].trim(),
    });
  }
  
  return enums;
}

/**
 * 解析 interface 成员
 * @param {string} body - interface 内部代码
 * @returns {Array<{name: string, type: string, optional: boolean}>}
 */
function parseInterfaceMembers(body) {
  const members = [];
  const lines = body.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      continue;
    }
    
    // 匹配成员定义: name?: type; 或 name: type;
    const memberMatch = trimmed.match(/^(\w+)(\?)?:\s*([^;]+)/);
    if (memberMatch) {
      members.push({
        name: memberMatch[1],
        type: memberMatch[3].trim().replace(/;$/, ''),
        optional: !!memberMatch[2],
      });
    }
    
    // 匹配方法定义: methodName(params): returnType;
    const methodMatch = trimmed.match(/^(\w+)\(([^)]*)\):\s*([^;]+)/);
    if (methodMatch) {
      members.push({
        name: methodMatch[1],
        type: `(${methodMatch[2]}) => ${methodMatch[3].trim().replace(/;$/, '')}`,
        optional: false,
        isMethod: true,
      });
    }
  }
  
  return members;
}

/**
 * 解析 type 成员（用于联合类型等）
 * @param {string} definition - type 定义
 * @returns {Array<string>}
 */
function parseTypeMembers(definition) {
  // 联合类型
  if (definition.includes('|')) {
    return definition.split('|').map(s => s.trim().replace(/['"]/g, ''));
  }
  
  // 交叉类型
  if (definition.includes('&')) {
    return definition.split('&').map(s => s.trim());
  }
  
  return [definition];
}

/**
 * 解析 enum 成员
 * @param {string} body - enum 内部代码
 * @returns {Array<{name: string, value: string|undefined}>}
 */
function parseEnumMembers(body) {
  const members = [];
  const lines = body.split(',');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // 匹配: NAME = 'value' 或 NAME
    const memberMatch = trimmed.match(/^(\w+)(?:\s*=\s*(.+))?/);
    if (memberMatch) {
      members.push({
        name: memberMatch[1],
        value: memberMatch[2]?.trim().replace(/['"]/g, ''),
      });
    }
  }
  
  return members;
}

/**
 * 将接口定义序列化为可比较的格式
 * @param {Object} iface - 接口对象
 * @returns {string}
 */
export function serializeInterface(iface) {
  if (iface.type === 'interface') {
    const members = iface.members
      .map(m => `${m.name}${m.optional ? '?' : ''}: ${normalizeType(m.type)}`)
      .sort()
      .join('; ');
    return `interface ${iface.name} { ${members} }`;
  }
  
  if (iface.type === 'type') {
    return `type ${iface.name} = ${normalizeType(iface.definition)}`;
  }
  
  if (iface.type === 'enum') {
    const members = iface.members
      .map(m => m.value ? `${m.name}=${m.value}` : m.name)
      .join(', ');
    return `enum ${iface.name} { ${members} }`;
  }
  
  return iface.raw;
}

/**
 * 标准化类型字符串（用于比较）
 * @param {string} typeStr - 类型字符串
 * @returns {string}
 */
function normalizeType(typeStr) {
  return typeStr
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*/g, ' | ')
    .replace(/\s*&\s*/g, ' & ')
    .trim();
}
