/**
 * Expression Engine Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
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
} from '../expression.mjs';

describe('Expression Engine', () => {
  describe('validateExpression', () => {
    it('should pass for safe expressions', () => {
      expect(() => validateExpression('inputs.task_id')).not.toThrow();
      expect(() => validateExpression('count + 1')).not.toThrow();
      expect(() => validateExpression('status === "SUCCESS"')).not.toThrow();
      expect(() => validateExpression('Math.max(a, b)')).not.toThrow();
    });

    it('should reject forbidden identifiers', () => {
      expect(() => validateExpression('eval("code")')).toThrow(ExpressionError);
      expect(() => validateExpression('new Function("code")')).toThrow(ExpressionError);
      expect(() => validateExpression('process.exit()')).toThrow(ExpressionError);
      expect(() => validateExpression('require("fs")')).toThrow(ExpressionError);
      expect(() => validateExpression('import("fs")')).toThrow(ExpressionError);
    });

    it('should reject prototype chain access', () => {
      expect(() => validateExpression('obj.constructor')).toThrow(ExpressionError);
      expect(() => validateExpression('obj.__proto__')).toThrow(ExpressionError);
      expect(() => validateExpression('obj["constructor"]')).toThrow(ExpressionError);
    });
  });

  describe('extractVariableRefs', () => {
    it('should extract single variable', () => {
      const refs = extractVariableRefs('Hello ${inputs.name}!');
      expect(refs).toEqual(['inputs.name']);
    });

    it('should extract multiple variables', () => {
      const refs = extractVariableRefs('${inputs.a} + ${variables.b} = ${nodes.c.output}');
      expect(refs).toEqual(['inputs.a', 'variables.b', 'nodes.c.output']);
    });

    it('should return empty array for no variables', () => {
      const refs = extractVariableRefs('No variables here');
      expect(refs).toEqual([]);
    });

    it('should handle whitespace in expressions', () => {
      const refs = extractVariableRefs('${ inputs.name }');
      expect(refs).toEqual(['inputs.name']);
    });
  });

  describe('getNestedValue', () => {
    const obj = {
      inputs: {
        task_id: 'task-123',
        config: {
          timeout: 5000,
        },
      },
      nodes: {
        'execute.edit': {
          status: 'SUCCESS',
          output: { lines: 100 },
        },
      },
      items: ['a', 'b', 'c'],
    };

    it('should get simple nested value', () => {
      expect(getNestedValue(obj, 'inputs.task_id')).toBe('task-123');
      expect(getNestedValue(obj, 'inputs.config.timeout')).toBe(5000);
    });

    it('should get value with bracket notation', () => {
      expect(getNestedValue(obj, "nodes['execute.edit'].status")).toBe('SUCCESS');
      expect(getNestedValue(obj, 'nodes["execute.edit"].output.lines')).toBe(100);
    });

    it('should get array element', () => {
      expect(getNestedValue(obj, 'items[0]')).toBe('a');
      expect(getNestedValue(obj, 'items[2]')).toBe('c');
    });

    it('should return undefined for missing path', () => {
      expect(getNestedValue(obj, 'inputs.nonexistent')).toBeUndefined();
      expect(getNestedValue(obj, 'missing.path.here')).toBeUndefined();
    });

    it('should reject prototype access', () => {
      expect(() => getNestedValue(obj, '__proto__')).toThrow(ExpressionError);
      expect(() => getNestedValue(obj, 'constructor')).toThrow(ExpressionError);
    });
  });

  describe('interpolate', () => {
    const context = {
      inputs: { name: 'World', count: 42 },
      variables: { prefix: 'Hello' },
    };

    it('should replace template variables', () => {
      expect(interpolate('${variables.prefix}, ${inputs.name}!', context)).toBe('Hello, World!');
    });

    it('should handle numbers', () => {
      expect(interpolate('Count: ${inputs.count}', context)).toBe('Count: 42');
    });

    it('should preserve unresolved variables', () => {
      expect(interpolate('${missing.var}', context)).toBe('${missing.var}');
    });

    it('should handle non-string input', () => {
      expect(interpolate(42, context)).toBe(42);
      expect(interpolate(null, context)).toBe(null);
    });

    it('should stringify objects', () => {
      const ctx = { data: { key: 'value' } };
      expect(interpolate('Data: ${data}', ctx)).toBe('Data: {"key":"value"}');
    });
  });

  describe('interpolateDeep', () => {
    const context = {
      inputs: { name: 'Test', port: 3000 },
    };

    it('should replace variables in nested objects', () => {
      const obj = {
        title: '${inputs.name} App',
        config: {
          url: 'http://localhost:${inputs.port}',
        },
      };

      const result = interpolateDeep(obj, context);
      expect(result.title).toBe('Test App');
      expect(result.config.url).toBe('http://localhost:3000');
    });

    it('should replace variables in arrays', () => {
      const arr = ['${inputs.name}', '${inputs.port}'];
      const result = interpolateDeep(arr, context);
      expect(result).toEqual(['Test', '3000']);
    });
  });

  describe('evaluate', () => {
    it('should evaluate simple expressions', () => {
      expect(evaluate('1 + 2')).toBe(3);
      expect(evaluate('"hello" + " world"')).toBe('hello world');
      expect(evaluate('true && false')).toBe(false);
    });

    it('should evaluate with context', () => {
      const ctx = { a: 10, b: 5 };
      expect(evaluate('a + b', ctx)).toBe(15);
      expect(evaluate('a * b', ctx)).toBe(50);
      expect(evaluate('a > b', ctx)).toBe(true);
    });

    it('should access nested context values', () => {
      const ctx = {
        inputs: { count: 10 },
        nodes: { 'step1': { output: 5 } },
      };
      expect(evaluate('inputs.count + nodes.step1.output', ctx)).toBe(15);
    });

    it('should support Math functions', () => {
      expect(evaluate('Math.max(1, 2, 3)')).toBe(3);
      expect(evaluate('Math.min(1, 2, 3)')).toBe(1);
      expect(evaluate('Math.floor(3.7)')).toBe(3);
    });

    it('should support String/Number functions', () => {
      expect(evaluate('String(123)')).toBe('123');
      expect(evaluate('Number("456")')).toBe(456);
      expect(evaluate('parseInt("10", 10)')).toBe(10);
    });

    it('should throw for invalid expressions', () => {
      expect(() => evaluate('invalid syntax }{{')).toThrow(ExpressionError);
    });

    it('should throw for forbidden expressions', () => {
      expect(() => evaluate('eval("code")')).toThrow(ExpressionError);
    });
  });

  describe('evaluateCondition', () => {
    it('should return true for empty condition', () => {
      expect(evaluateCondition('')).toBe(true);
      expect(evaluateCondition(null)).toBe(true);
      expect(evaluateCondition(undefined)).toBe(true);
    });

    it('should evaluate boolean expressions', () => {
      expect(evaluateCondition('true')).toBe(true);
      expect(evaluateCondition('false')).toBe(false);
      expect(evaluateCondition('1 > 0')).toBe(true);
      expect(evaluateCondition('1 < 0')).toBe(false);
    });

    it('should evaluate with context', () => {
      const ctx = { status: 'SUCCESS', count: 5 };
      expect(evaluateCondition('status === "SUCCESS"', ctx)).toBe(true);
      expect(evaluateCondition('count > 3', ctx)).toBe(true);
      expect(evaluateCondition('status === "FAILED"', ctx)).toBe(false);
    });

    it('should coerce truthy/falsy values', () => {
      expect(evaluateCondition('1')).toBe(true);
      expect(evaluateCondition('0')).toBe(false);
      expect(evaluateCondition('"non-empty"')).toBe(true);
      expect(evaluateCondition('""')).toBe(false);
    });
  });

  describe('resolveOutputMapping', () => {
    const output = {
      stdout: 'hello world',
      stderr: '',
      exitCode: 0,
      data: {
        items: [{ id: 1 }, { id: 2 }],
      },
    };

    it('should resolve JSONPath expressions', () => {
      expect(resolveOutputMapping('$.stdout', output)).toBe('hello world');
      expect(resolveOutputMapping('$.exitCode', output)).toBe(0);
      expect(resolveOutputMapping('$.data.items', output)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should return full output for $', () => {
      expect(resolveOutputMapping('$', output)).toEqual(output);
    });

    it('should return output for null/undefined expr', () => {
      expect(resolveOutputMapping(null, output)).toEqual(output);
      expect(resolveOutputMapping(undefined, output)).toEqual(output);
    });
  });

  describe('hasTemplateVars', () => {
    it('should detect template variables', () => {
      expect(hasTemplateVars('${inputs.name}')).toBe(true);
      expect(hasTemplateVars('Hello ${world}')).toBe(true);
    });

    it('should return false for no variables', () => {
      expect(hasTemplateVars('no variables')).toBe(false);
      expect(hasTemplateVars('')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(hasTemplateVars(123)).toBe(false);
      expect(hasTemplateVars(null)).toBe(false);
    });
  });

  describe('getReferencedVariables', () => {
    it('should extract all referenced variables', () => {
      const expr = '${inputs.a} + inputs.b + nodes.c.output';
      const refs = getReferencedVariables(expr);
      expect(refs).toContain('inputs.a');
      expect(refs).toContain('inputs.b');
      expect(refs).toContain('nodes.c.output');
    });
  });
});

