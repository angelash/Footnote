/**
 * Expression Engine v2
 * 
 * 表达式解析和求值引擎，支持变量引用和简单表达式
 * 
 * 支持的语法：
 * - 模板字符串: ${inputs.task_id}, ${variables.count}
 * - 属性访问: nodes['execute.edit'].status
 * - 条件表达式: status === 'SUCCESS' && count > 0
 * - 简单运算: count + 1, str1 + str2
 * 
 * 安全限制：
 * - 禁止 eval、Function、import
 * - 禁止访问全局对象
 * - 禁止修改上下文
 * 
 * @module lib/v2/expression
 */

/**
 * 表达式错误类
 */
export class ExpressionError extends Error {
  /**
   * @param {string} message - 错误信息
   * @param {string} expression - 原始表达式
   * @param {string} [reason] - 详细原因
   */
  constructor(message, expression, reason = '') {
    super(message);
    this.name = 'ExpressionError';
    this.expression = expression;
    this.reason = reason;
  }

  toString() {
    let msg = `${this.message}: "${this.expression}"`;
    if (this.reason) {
      msg += ` (${this.reason})`;
    }
    return msg;
  }
}

/**
 * 禁止的标识符列表
 * 注意：Function (大写) 构造函数被禁止，但 function 关键字声明是允许的
 */
const FORBIDDEN_IDENTIFIERS = [
  'eval',
  // 'Function' 改为精确匹配，避免误禁 function 关键字
  'constructor',
  'prototype',
  '__proto__',
  'import',
  'require',
  'process',
  'global',
  'globalThis',
  'window',
  'document',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
];

/**
 * 需要精确匹配的危险标识符（区分大小写）
 */
const FORBIDDEN_EXACT = [
  'Function',  // Function 构造函数，但允许 function 关键字
];

/**
 * 模板变量正则: ${...}
 */
const TEMPLATE_PATTERN = /\$\{([^}]+)\}/g;

/**
 * 属性访问正则: xxx.yyy 或 xxx['yyy']
 */
const PROPERTY_ACCESS_PATTERN = /^([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*|\[['"][^'"]+['"]\])*)$/;

/**
 * 检查表达式是否安全
 * @param {string} expression - 表达式字符串
 * @throws {ExpressionError} 如果表达式不安全
 */
export function validateExpression(expression) {
  if (typeof expression !== 'string') {
    throw new ExpressionError('Expression must be a string', String(expression));
  }

  // 检查禁止的标识符（大小写不敏感）
  for (const forbidden of FORBIDDEN_IDENTIFIERS) {
    const pattern = new RegExp(`\\b${forbidden}\\b`, 'i');
    if (pattern.test(expression)) {
      throw new ExpressionError(
        'Expression contains forbidden identifier',
        expression,
        `"${forbidden}" is not allowed`
      );
    }
  }

  // 检查精确匹配的禁止标识符（区分大小写）
  for (const forbidden of FORBIDDEN_EXACT) {
    const pattern = new RegExp(`\\b${forbidden}\\b`);  // 无 'i' 标志
    if (pattern.test(expression)) {
      throw new ExpressionError(
        'Expression contains forbidden identifier',
        expression,
        `"${forbidden}" is not allowed`
      );
    }
  }

  // 检查危险模式
  const dangerousPatterns = [
    /\bimport\s*\(/,           // dynamic import
    /\brequire\s*\(/,          // require
    /\bnew\s+Function\s*\(/,   // new Function
    /\beval\s*\(/,             // eval
    /\[\s*['"]constructor['"]\s*\]/, // ['constructor']
    /\.\s*constructor\b/,       // .constructor
    /\[\s*['"]__proto__['"]\s*\]/, // ['__proto__']
    /\.\s*__proto__\b/,         // .__proto__
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(expression)) {
      throw new ExpressionError(
        'Expression contains dangerous pattern',
        expression,
        `Pattern ${pattern} is not allowed`
      );
    }
  }

  return true;
}

/**
 * 解析模板字符串中的变量引用
 * @param {string} template - 模板字符串
 * @returns {string[]} 变量引用列表
 */
export function extractVariableRefs(template) {
  const refs = [];
  let match;
  
  TEMPLATE_PATTERN.lastIndex = 0;
  while ((match = TEMPLATE_PATTERN.exec(template)) !== null) {
    refs.push(match[1].trim());
  }
  
  return refs;
}

/**
 * 安全地从对象获取嵌套属性
 * @param {Object} obj - 源对象
 * @param {string} path - 属性路径 (如 "inputs.task_id" 或 "nodes['execute.edit'].status")
 * @returns {*} 属性值
 */
export function getNestedValue(obj, path) {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  // 解析路径
  const parts = [];
  let current = '';
  let inBracket = false;
  let bracketQuote = '';

  for (let i = 0; i < path.length; i++) {
    const char = path[i];

    if (inBracket) {
      if (char === bracketQuote && path[i - 1] !== '\\') {
        // 结束引号
        parts.push(current);
        current = '';
        inBracket = false;
        bracketQuote = '';
        // 跳过结束的 ]
        while (i < path.length && path[i] !== ']') i++;
      } else if (char !== bracketQuote || path[i - 1] === '\\') {
        current += char;
      }
    } else if (char === '[') {
      if (current) {
        parts.push(current);
        current = '';
      }
      // 查找开始引号
      i++;
      if (path[i] === '"' || path[i] === "'") {
        bracketQuote = path[i];
        inBracket = true;
      } else {
        // 数字索引
        while (i < path.length && path[i] !== ']') {
          current += path[i];
          i++;
        }
        parts.push(current);
        current = '';
      }
    } else if (char === '.') {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
  }

  // 遍历路径获取值
  let value = obj;
  for (const part of parts) {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value !== 'object') {
      return undefined;
    }
    // 安全检查：禁止访问原型链
    if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
      throw new ExpressionError('Access to prototype chain is forbidden', path);
    }
    value = value[part];
  }

  return value;
}

/**
 * 检查表达式是否是简单属性访问（如 inputs.name, nodes.foo.output）
 * @param {string} expr - 表达式字符串
 * @returns {boolean}
 */
function isSimplePropertyAccess(expr) {
  // 简单属性访问：只包含标识符和点操作符
  return /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(expr);
}

/**
 * 替换模板字符串中的变量
 * 支持简单属性访问（如 ${inputs.name}）和复杂表达式（如 ${JSON.stringify(...)}）
 * @param {string} template - 模板字符串
 * @param {Object} context - 上下文对象
 * @returns {string} 替换后的字符串
 */
export function interpolate(template, context) {
  if (typeof template !== 'string') {
    return template;
  }

  return template.replace(TEMPLATE_PATTERN, (match, expr) => {
    const trimmed = expr.trim();
    validateExpression(trimmed);
    
    // 对于简单属性访问，使用 getNestedValue（更快）
    if (isSimplePropertyAccess(trimmed)) {
      const value = getNestedValue(context, trimmed);
      
      if (value === undefined) {
        return match; // 保留原始模板
      }
      
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      
      return String(value);
    }
    
    // 对于复杂表达式（如 JSON.stringify(...)），使用 evaluate
    try {
      const result = evaluate(trimmed, context);
      if (result === undefined) {
        return match;
      }
      if (typeof result === 'object') {
        return JSON.stringify(result);
      }
      return String(result);
    } catch (e) {
      // 如果 evaluate 失败，保留原始模板
      return match;
    }
  });
}

/**
 * 创建安全的表达式求值上下文
 * @param {Object} context - 原始上下文
 * @returns {Object} 安全上下文
 */
function createSafeContext(context) {
  // 创建一个干净的对象，不继承 Object.prototype
  const safe = Object.create(null);
  
  // 复制上下文属性
  for (const key of Object.keys(context)) {
    safe[key] = context[key];
  }
  
  // 添加安全的内置函数
  safe.Math = Math;
  safe.Date = Date;
  safe.JSON = {
    parse: JSON.parse,
    stringify: JSON.stringify,
  };
  safe.String = String;
  safe.Number = Number;
  safe.Boolean = Boolean;
  safe.Array = {
    isArray: Array.isArray,
  };
  safe.Object = {
    keys: Object.keys,
    values: Object.values,
    entries: Object.entries,
  };
  
  // 添加常用工具函数
  safe.parseInt = parseInt;
  safe.parseFloat = parseFloat;
  safe.isNaN = isNaN;
  safe.isFinite = isFinite;
  safe.encodeURIComponent = encodeURIComponent;
  safe.decodeURIComponent = decodeURIComponent;
  
  return safe;
}

/**
 * 求值 JavaScript 表达式
 * @param {string} expression - 表达式字符串
 * @param {Object} context - 上下文对象
 * @returns {*} 求值结果
 */
export function evaluate(expression, context = {}) {
  validateExpression(expression);
  
  const safeContext = createSafeContext(context);
  
  // 构建参数名列表和参数值列表
  const paramNames = Object.keys(safeContext);
  const paramValues = Object.values(safeContext);
  
  try {
    // 使用 Function 构造器创建沙箱函数
    // 注意：虽然我们使用了 Function，但已经通过 validateExpression 过滤了危险代码
    const fn = new Function(...paramNames, `"use strict"; return (${expression});`);
    return fn(...paramValues);
  } catch (err) {
    throw new ExpressionError(
      'Expression evaluation failed',
      expression,
      err.message
    );
  }
}

/**
 * 求值条件表达式，返回布尔值
 * @param {string} condition - 条件表达式
 * @param {Object} context - 上下文对象
 * @returns {boolean} 条件结果
 */
export function evaluateCondition(condition, context = {}) {
  if (!condition || condition.trim() === '') {
    return true; // 空条件默认为 true
  }
  
  const result = evaluate(condition, context);
  return Boolean(result);
}

/**
 * 解析输出映射表达式
 * @param {string} expr - 输出映射表达式 (如 "$.stdout" 或 "$.data.items[0]")
 * @param {Object} nodeOutput - 节点输出对象
 * @returns {*} 映射后的值
 */
export function resolveOutputMapping(expr, nodeOutput) {
  if (!expr || typeof expr !== 'string') {
    return nodeOutput;
  }
  
  // 处理 JSONPath 风格的 $ 前缀
  if (expr.startsWith('$.')) {
    const path = expr.slice(2);
    return getNestedValue(nodeOutput, path);
  }
  
  // 处理直接属性访问
  if (expr.startsWith('$')) {
    return nodeOutput;
  }
  
  // 作为表达式求值
  return evaluate(expr, { $: nodeOutput, output: nodeOutput });
}

/**
 * 批量替换对象中所有字符串值的模板变量
 * @param {*} obj - 任意值
 * @param {Object} context - 上下文对象
 * @returns {*} 替换后的值
 */
export function interpolateDeep(obj, context) {
  if (typeof obj === 'string') {
    return interpolate(obj, context);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => interpolateDeep(item, context));
  }
  
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateDeep(value, context);
    }
    return result;
  }
  
  return obj;
}

/**
 * 检查字符串是否包含模板变量
 * @param {string} str - 字符串
 * @returns {boolean} 是否包含模板变量
 */
export function hasTemplateVars(str) {
  if (typeof str !== 'string') {
    return false;
  }
  TEMPLATE_PATTERN.lastIndex = 0;
  return TEMPLATE_PATTERN.test(str);
}

/**
 * 获取表达式中引用的所有变量路径
 * @param {string} expression - 表达式
 * @returns {string[]} 变量路径列表
 */
export function getReferencedVariables(expression) {
  const refs = new Set();
  
  // 提取模板变量
  const templateVars = extractVariableRefs(expression);
  templateVars.forEach(v => refs.add(v));
  
  // 提取直接变量引用（简单的启发式方法）
  const identifierPattern = /\b(inputs|outputs|variables|nodes|env)\.[a-zA-Z_][a-zA-Z0-9_.[\]'"]*\b/g;
  let match;
  while ((match = identifierPattern.exec(expression)) !== null) {
    refs.add(match[0]);
  }
  
  return Array.from(refs);
}

export default {
  validateExpression,
  extractVariableRefs,
  getNestedValue,
  interpolate,
  interpolateDeep,
  evaluate,
  evaluateCondition,
  resolveOutputMapping,
  hasTemplateVars,
  getReferencedVariables,
  ExpressionError,
};

