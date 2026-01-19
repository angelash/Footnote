/**
 * Comparison and Report Generation Module
 * 
 * 比较 Spec 文档与代码实现的一致性，生成报告
 * 
 * @module doc-code-sync/compare
 */

import { serializeInterface } from './extractors/spec-extractor.mjs';
import { serializeInterface as serializeCodeInterface } from './extractors/code-extractor.mjs';
import { normalizeColor, colorsEqual } from './extractors/color-extractor.mjs';

/**
 * 比较 Spec 和代码中的接口定义
 * @param {Map} specInterfaces - Spec 中的接口 Map<name, interface>
 * @param {Map} codeInterfaces - 代码中的接口 Map<name, interface>
 * @param {Object} mappings - 接口名称映射（可选）
 * @returns {{matches: Array, mismatches: Array, onlyInSpec: Array, onlyInCode: Array}}
 */
export function compareInterfaces(specInterfaces, codeInterfaces, mappings = {}) {
  const result = {
    matches: [],
    mismatches: [],
    onlyInSpec: [],
    onlyInCode: [],
  };
  
  // 构建反向映射
  const reverseMappings = {};
  for (const [specName, codeName] of Object.entries(mappings)) {
    reverseMappings[codeName] = specName;
  }
  
  // 检查 Spec 中的每个接口
  for (const [name, specIface] of specInterfaces) {
    const codeName = mappings[name] || name;
    const codeIface = codeInterfaces.get(codeName);
    
    if (!codeIface) {
      result.onlyInSpec.push({
        name,
        specSource: specIface.source,
        type: specIface.type,
      });
      continue;
    }
    
    // 比较接口内容
    const differences = compareInterfaceContent(specIface, codeIface);
    
    if (differences.length === 0) {
      result.matches.push({
        name,
        specSource: specIface.source,
        codeSource: codeIface.source,
      });
    } else {
      result.mismatches.push({
        name,
        specSource: specIface.source,
        codeSource: codeIface.source,
        differences,
        specInterface: specIface,
        codeInterface: codeIface,
      });
    }
  }
  
  // 检查只在代码中存在的接口
  for (const [name, codeIface] of codeInterfaces) {
    const specName = reverseMappings[name] || name;
    
    // 只报告导出的接口
    if (codeIface.exported && !specInterfaces.has(specName) && !specInterfaces.has(name)) {
      result.onlyInCode.push(name);
    }
  }
  
  return result;
}

/**
 * 比较两个接口的内容
 * @param {Object} specIface - Spec 接口定义
 * @param {Object} codeIface - 代码接口定义
 * @returns {Array<string>} - 差异列表
 */
function compareInterfaceContent(specIface, codeIface) {
  const differences = [];
  
  // 类型不匹配
  if (specIface.type !== codeIface.type) {
    differences.push(`Type mismatch: spec=${specIface.type}, code=${codeIface.type}`);
    return differences;
  }
  
  // 对于 interface 类型，比较成员
  if (specIface.type === 'interface') {
    const specMembers = new Map(specIface.members.map(m => [m.name, m]));
    const codeMembers = new Map(codeIface.members.map(m => [m.name, m]));
    
    // 检查 Spec 中定义的成员是否在代码中存在
    for (const [name, specMember] of specMembers) {
      const codeMember = codeMembers.get(name);
      
      if (!codeMember) {
        differences.push(`Missing member in code: ${name}`);
        continue;
      }
      
      // 比较可选性
      if (specMember.optional !== codeMember.optional) {
        differences.push(`Optional mismatch for '${name}': spec=${specMember.optional}, code=${codeMember.optional}`);
      }
      
      // 比较类型（简化比较，忽略空白差异）
      const specType = normalizeType(specMember.type);
      const codeType = normalizeType(codeMember.type);
      
      if (!typesCompatible(specType, codeType)) {
        differences.push(`Type mismatch for '${name}': spec='${specType}', code='${codeType}'`);
      }
    }
    
    // 检查代码中额外的必需成员（可选成员可以额外存在）
    for (const [name, codeMember] of codeMembers) {
      if (!specMembers.has(name) && !codeMember.optional) {
        // 仅警告，不作为错误（代码可以有额外成员）
        // differences.push(`Extra required member in code: ${name}`);
      }
    }
  }
  
  // 对于 type 类型，比较定义
  if (specIface.type === 'type') {
    const specDef = normalizeType(specIface.definition);
    const codeDef = normalizeType(codeIface.definition);
    
    if (!typesCompatible(specDef, codeDef)) {
      // 对于联合类型，检查成员
      if (specIface.members && codeIface.members) {
        const specSet = new Set(specIface.members);
        const codeSet = new Set(codeIface.members);
        
        const missingInCode = [...specSet].filter(m => !codeSet.has(m));
        const extraInCode = [...codeSet].filter(m => !specSet.has(m));
        
        if (missingInCode.length > 0) {
          differences.push(`Missing type members in code: ${missingInCode.join(', ')}`);
        }
        if (extraInCode.length > 0) {
          differences.push(`Extra type members in code: ${extraInCode.join(', ')}`);
        }
      } else {
        differences.push(`Definition mismatch: spec='${specDef}', code='${codeDef}'`);
      }
    }
  }
  
  // 对于 enum 类型，比较成员
  if (specIface.type === 'enum') {
    const specMembers = new Map(specIface.members.map(m => [m.name, m.value]));
    const codeMembers = new Map(codeIface.members.map(m => [m.name, m.value]));
    
    for (const [name, specValue] of specMembers) {
      const codeValue = codeMembers.get(name);
      
      if (codeValue === undefined) {
        differences.push(`Missing enum member in code: ${name}`);
        continue;
      }
      
      if (specValue !== undefined && codeValue !== undefined && specValue !== codeValue) {
        differences.push(`Enum value mismatch for '${name}': spec='${specValue}', code='${codeValue}'`);
      }
    }
  }
  
  return differences;
}

/**
 * 标准化类型字符串
 * @param {string} typeStr - 类型字符串
 * @returns {string}
 */
function normalizeType(typeStr) {
  if (!typeStr) return '';
  return typeStr
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*/g, ' | ')
    .replace(/\s*&\s*/g, ' & ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s*;\s*/g, '; ')
    .trim();
}

/**
 * 检查两个类型是否兼容
 * @param {string} specType - Spec 中的类型
 * @param {string} codeType - 代码中的类型
 * @returns {boolean}
 */
function typesCompatible(specType, codeType) {
  // 完全相同
  if (specType === codeType) return true;
  
  // 忽略某些常见差异
  const normalized1 = specType.replace(/void/g, 'undefined').toLowerCase();
  const normalized2 = codeType.replace(/void/g, 'undefined').toLowerCase();
  
  if (normalized1 === normalized2) return true;
  
  // 函数类型的简化比较
  if (specType.includes('=>') && codeType.includes('=>')) {
    // 提取返回类型进行比较
    const specReturn = specType.split('=>').pop()?.trim();
    const codeReturn = codeType.split('=>').pop()?.trim();
    if (specReturn === codeReturn) return true;
  }
  
  return false;
}

/**
 * 比较文档和代码中的颜色定义
 * @param {Map} docColors - 文档中的颜色 Map<name, {value, context}>
 * @param {Map} codeColors - 代码中的颜色 Map<name, {value, context}>
 * @returns {{matches: Array, mismatches: Array, onlyInDoc: Array, onlyInCode: Array}}
 */
export function compareColors(docColors, codeColors) {
  const result = {
    matches: [],
    mismatches: [],
    onlyInDoc: [],
    onlyInCode: [],
  };
  
  // 构建代码颜色值到键的映射
  const codeColorByValue = new Map();
  for (const [key, data] of codeColors) {
    const normalized = normalizeColor(data.value);
    if (!codeColorByValue.has(normalized)) {
      codeColorByValue.set(normalized, []);
    }
    codeColorByValue.get(normalized).push({ key, ...data });
  }
  
  // 检查文档中的颜色是否在代码中存在
  for (const [name, docColor] of docColors) {
    const docValue = normalizeColor(docColor.value);
    const codeMatches = codeColorByValue.get(docValue);
    
    if (codeMatches && codeMatches.length > 0) {
      result.matches.push({
        docName: name,
        docValue: docColor.value,
        docContext: docColor.context,
        codeKey: codeMatches[0].key,
        codeValue: codeMatches[0].value,
      });
    } else {
      // 颜色值不在代码中
      result.onlyInDoc.push({
        name,
        value: docColor.value,
        context: docColor.context,
      });
    }
  }
  
  // 构建文档颜色值集合
  const docColorValues = new Set([...docColors.values()].map(c => normalizeColor(c.value)));
  
  // 检查代码中独有的颜色
  for (const [key, codeColor] of codeColors) {
    const codeValue = normalizeColor(codeColor.value);
    if (!docColorValues.has(codeValue)) {
      result.onlyInCode.push({
        key,
        value: codeColor.value,
        context: codeColor.context,
      });
    }
  }
  
  return result;
}

/**
 * 生成同步检查报告
 * @param {Object} results - 检查结果
 * @param {Object} options - 选项
 * @returns {Object} - 报告对象
 */
export function generateReport(results, options = {}) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      matches: 0,
      mismatches: 0,
      warnings: 0,
    },
    interfaces: null,
    colors: null,
  };
  
  // 接口检查结果
  if (results.interfaces) {
    report.interfaces = {
      matches: results.interfaces.matches,
      mismatches: results.interfaces.mismatches,
      onlyInSpec: results.interfaces.onlyInSpec,
      onlyInCode: results.interfaces.onlyInCode,
    };
    
    report.summary.total += results.interfaces.matches.length + results.interfaces.mismatches.length;
    report.summary.matches += results.interfaces.matches.length;
    report.summary.mismatches += results.interfaces.mismatches.length;
    report.summary.warnings += results.interfaces.onlyInSpec.length;
  }
  
  // 颜色检查结果
  if (results.colors) {
    report.colors = {
      matches: results.colors.matches,
      mismatches: results.colors.mismatches || [],
      onlyInDoc: results.colors.onlyInDoc,
      onlyInCode: results.colors.onlyInCode,
    };
    
    report.summary.total += results.colors.matches.length;
    report.summary.matches += results.colors.matches.length;
    report.summary.warnings += results.colors.onlyInDoc.length;
  }
  
  return report;
}

/**
 * 格式化差异为可读字符串
 * @param {Object} mismatch - 不匹配项
 * @returns {string}
 */
export function formatMismatch(mismatch) {
  const lines = [];
  
  lines.push(`Interface: ${mismatch.name}`);
  lines.push(`  Spec: ${mismatch.specSource}`);
  lines.push(`  Code: ${mismatch.codeSource}`);
  
  if (mismatch.differences && mismatch.differences.length > 0) {
    lines.push('  Differences:');
    for (const diff of mismatch.differences) {
      lines.push(`    - ${diff}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * 创建比较摘要
 * @param {Object} result - 比较结果
 * @returns {Object}
 */
export function createSummary(result) {
  return {
    totalInterfaces: (result.matches?.length || 0) + (result.mismatches?.length || 0),
    matchCount: result.matches?.length || 0,
    mismatchCount: result.mismatches?.length || 0,
    onlyInSpecCount: result.onlyInSpec?.length || 0,
    onlyInCodeCount: result.onlyInCode?.length || 0,
    passRate: calculatePassRate(result),
  };
}

/**
 * 计算通过率
 * @param {Object} result - 比较结果
 * @returns {number} - 0-100 的百分比
 */
function calculatePassRate(result) {
  const total = (result.matches?.length || 0) + (result.mismatches?.length || 0);
  if (total === 0) return 100;
  return Math.round((result.matches?.length || 0) / total * 100);
}
