/**
 * TypeScript Code Interface Extractor
 * 
 * 从 TypeScript 代码文件中提取接口定义
 * 
 * @module doc-code-sync/extractors/code-extractor
 */

import fs from 'fs';

/**
 * 从 TypeScript 代码文件中提取接口定义
 * @param {string} filePath - TypeScript 文件路径
 * @returns {Promise<Array<{name: string, type: string, members: Array, raw: string, exported: boolean}>>}
 */
export async function extractInterfacesFromCode(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const interfaces = [];
  
  // 移除注释以避免误匹配
  const cleanCode = removeComments(content);
  
  // 提取 interface 定义
  const extractedInterfaces = extractInterfaces(cleanCode);
  interfaces.push(...extractedInterfaces);
  
  // 提取 type 定义
  const extractedTypes = extractTypes(cleanCode);
  interfaces.push(...extractedTypes);
  
  // 提取 enum 定义
  const extractedEnums = extractEnums(cleanCode);
  interfaces.push(...extractedEnums);
  
  return interfaces;
}

/**
 * 移除代码中的注释
 * @param {string} code - TypeScript 代码
 * @returns {string}
 */
function removeComments(code) {
  // 移除多行注释 /* ... */
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 移除单行注释 // ...
  code = code.replace(/\/\/.*$/gm, '');
  
  return code;
}

/**
 * 提取 interface 定义
 * @param {string} code - TypeScript 代码
 * @returns {Array<{name: string, type: string, members: Array, raw: string, exported: boolean}>}
 */
function extractInterfaces(code) {
  const interfaces = [];
  
  // 匹配 interface 定义（支持 export，支持泛型，支持 extends）
  // 使用更稳健的匹配方式处理嵌套大括号
  const interfaceStartRegex = /(export\s+)?interface\s+(\w+)(?:<[^>]+>)?(?:\s+extends\s+[^{]+)?\s*\{/g;
  let match;
  
  while ((match = interfaceStartRegex.exec(code)) !== null) {
    const exported = !!match[1];
    const name = match[2];
    const startIndex = match.index;
    const bodyStart = startIndex + match[0].length - 1; // Position of opening {
    
    // 找到匹配的闭合大括号
    const body = extractBalancedBraces(code, bodyStart);
    if (body) {
      const members = parseInterfaceMembers(body);
      const raw = code.slice(startIndex, bodyStart + body.length + 2);
      
      interfaces.push({
        name,
        type: 'interface',
        members,
        raw: raw.trim(),
        exported,
      });
    }
  }
  
  return interfaces;
}

/**
 * 提取 type 定义
 * @param {string} code - TypeScript 代码
 * @returns {Array<{name: string, type: string, definition: string, raw: string, exported: boolean}>}
 */
function extractTypes(code) {
  const types = [];
  
  // 匹配 type 定义
  const typeRegex = /(export\s+)?type\s+(\w+)(?:<[^>]+>)?\s*=\s*([^;]+);/g;
  let match;
  
  while ((match = typeRegex.exec(code)) !== null) {
    const exported = !!match[1];
    const name = match[2];
    const definition = match[3].trim();
    
    types.push({
      name,
      type: 'type',
      definition,
      members: parseTypeMembers(definition),
      raw: match[0].trim(),
      exported,
    });
  }
  
  return types;
}

/**
 * 提取 enum 定义
 * @param {string} code - TypeScript 代码
 * @returns {Array<{name: string, type: string, members: Array, raw: string, exported: boolean}>}
 */
function extractEnums(code) {
  const enums = [];
  
  // 匹配 enum 定义
  const enumStartRegex = /(export\s+)?enum\s+(\w+)\s*\{/g;
  let match;
  
  while ((match = enumStartRegex.exec(code)) !== null) {
    const exported = !!match[1];
    const name = match[2];
    const startIndex = match.index;
    const bodyStart = startIndex + match[0].length - 1;
    
    const body = extractBalancedBraces(code, bodyStart);
    if (body) {
      const members = parseEnumMembers(body);
      const raw = code.slice(startIndex, bodyStart + body.length + 2);
      
      enums.push({
        name,
        type: 'enum',
        members,
        raw: raw.trim(),
        exported,
      });
    }
  }
  
  return enums;
}

/**
 * 提取平衡的大括号内容
 * @param {string} code - 代码
 * @param {number} startIndex - 开始位置（包含 {）
 * @returns {string|null} - 大括号内的内容（不包含外层大括号）
 */
function extractBalancedBraces(code, startIndex) {
  if (code[startIndex] !== '{') return null;
  
  let depth = 0;
  let i = startIndex;
  
  while (i < code.length) {
    const char = code[i];
    
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        return code.slice(startIndex + 1, i);
      }
    }
    
    i++;
  }
  
  return null;
}

/**
 * 解析 interface 成员
 * @param {string} body - interface 内部代码
 * @returns {Array<{name: string, type: string, optional: boolean}>}
 */
function parseInterfaceMembers(body) {
  const members = [];
  
  // 处理每一行
  const lines = body.split('\n');
  let currentMember = '';
  let braceDepth = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // 跟踪大括号深度
    for (const char of trimmed) {
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
    }
    
    currentMember += ' ' + trimmed;
    
    // 如果大括号平衡且以分号或逗号结尾，则完成一个成员
    if (braceDepth === 0 && (trimmed.endsWith(';') || trimmed.endsWith(','))) {
      const member = parseMemberLine(currentMember.trim());
      if (member) {
        members.push(member);
      }
      currentMember = '';
    }
  }
  
  // 处理最后一个成员（可能没有分号）
  if (currentMember.trim()) {
    const member = parseMemberLine(currentMember.trim());
    if (member) {
      members.push(member);
    }
  }
  
  return members;
}

/**
 * 解析单个成员行
 * @param {string} line - 成员定义行
 * @returns {{name: string, type: string, optional: boolean}|null}
 */
function parseMemberLine(line) {
  // 移除末尾的分号或逗号
  line = line.replace(/[;,]$/, '').trim();
  
  // 匹配属性: name?: type
  const propMatch = line.match(/^(\w+)(\?)?:\s*(.+)$/);
  if (propMatch) {
    return {
      name: propMatch[1],
      type: propMatch[3].trim(),
      optional: !!propMatch[2],
    };
  }
  
  // 匹配方法: methodName(params): returnType
  const methodMatch = line.match(/^(\w+)\(([^)]*)\):\s*(.+)$/);
  if (methodMatch) {
    return {
      name: methodMatch[1],
      type: `(${methodMatch[2]}) => ${methodMatch[3].trim()}`,
      optional: false,
      isMethod: true,
    };
  }
  
  return null;
}

/**
 * 解析 type 成员
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
  const entries = body.split(',');
  
  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    
    // 匹配: NAME = 'value' 或 NAME = value 或 NAME
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
 * 标准化类型字符串
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
