/**
 * Parser Module Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateFlowSpec,
  parseFlowSpec,
  ParseError,
  NODE_TYPES,
  getSuccessors,
  getPredecessors,
  getEntryNodes,
  getExitNodes,
} from '../parser.mjs';

describe('FlowSpec Parser', () => {
  describe('validateFlowSpec', () => {
    it('should pass for valid minimal spec', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [
          { id: 'node1', type: 'shell', config: { command: 'echo hello' } },
        ],
      };

      const result = validateFlowSpec(spec);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for missing version', () => {
      const spec = {
        name: 'Test Flow',
        nodes: [{ id: 'node1', type: 'shell' }],
      };

      const result = validateFlowSpec(spec);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'version')).toBe(true);
    });

    it('should fail for invalid version format', () => {
      const spec = {
        version: '1.0.0', // Not 2.x.x
        name: 'Test Flow',
        nodes: [{ id: 'node1', type: 'shell' }],
      };

      const result = validateFlowSpec(spec);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'version')).toBe(true);
    });

    it('should fail for missing name', () => {
      const spec = {
        version: '2.0.0',
        nodes: [{ id: 'node1', type: 'shell' }],
      };

      const result = validateFlowSpec(spec);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'name')).toBe(true);
    });

    it('should fail for missing nodes', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
      };

      const result = validateFlowSpec(spec);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'nodes')).toBe(true);
    });

    it('should fail for empty nodes array', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [],
      };

      const result = validateFlowSpec(spec);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'nodes')).toBe(true);
    });

    it('should fail for duplicate node IDs', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [
          { id: 'node1', type: 'shell' },
          { id: 'node1', type: 'shell' }, // Duplicate
        ],
      };

      const result = validateFlowSpec(spec);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Duplicate'))).toBe(true);
    });

    it('should fail for invalid node ID format', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [
          { id: 'Node1', type: 'shell' }, // Uppercase not allowed
        ],
      };

      const result = validateFlowSpec(spec);
      expect(result.valid).toBe(false);
    });

    it('should fail for unknown node type', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [
          { id: 'node1', type: 'unknown_type' },
        ],
      };

      const result = validateFlowSpec(spec);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Unknown node type'))).toBe(true);
    });

    it('should validate all supported node types', () => {
      for (const nodeType of NODE_TYPES) {
        const spec = {
          version: '2.0.0',
          name: 'Test Flow',
          nodes: [
            { id: `node-${nodeType}`, type: nodeType },
          ],
        };

        const result = validateFlowSpec(spec);
        // Shell and some others require config, but type itself should be valid
        const typeErrors = result.errors.filter(e => e.message.includes('Unknown node type'));
        expect(typeErrors).toHaveLength(0);
      }
    });

    it('should validate shell node config', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [
          { id: 'node1', type: 'shell', config: {} }, // Missing command
        ],
      };

      const result = validateFlowSpec(spec);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('command'))).toBe(true);
    });

    it('should validate edge references', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [
          { id: 'node1', type: 'shell', config: { command: 'echo' } },
        ],
        edges: [
          { from: 'node1', to: 'nonexistent' },
        ],
      };

      const result = validateFlowSpec(spec);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('unknown node'))).toBe(true);
    });
  });

  describe('parseFlowSpec', () => {
    it('should parse valid spec and create nodeMap', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [
          { id: 'node1', type: 'shell', config: { command: 'echo hello' } },
          { id: 'node2', type: 'shell', config: { command: 'echo world' } },
        ],
      };

      const flow = parseFlowSpec(spec);
      expect(flow.name).toBe('Test Flow');
      expect(flow.version).toBe('2.0.0');
      expect(flow.nodes).toHaveLength(2);
      expect(flow.nodeMap.get('node1')).toBeDefined();
      expect(flow.nodeMap.get('node2')).toBeDefined();
    });

    it('should generate default edges for sequential nodes', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [
          { id: 'node1', type: 'shell', config: { command: 'echo 1' } },
          { id: 'node2', type: 'shell', config: { command: 'echo 2' } },
          { id: 'node3', type: 'shell', config: { command: 'echo 3' } },
        ],
      };

      const flow = parseFlowSpec(spec);
      expect(flow.edges).toHaveLength(2);
      expect(flow.edges[0]).toEqual({ from: 'node1', to: 'node2', label: '', condition: null, type: 'default' });
      expect(flow.edges[1]).toEqual({ from: 'node2', to: 'node3', label: '', condition: null, type: 'default' });
    });

    it('should use custom edges when provided', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [
          { id: 'node1', type: 'shell', config: { command: 'echo 1' } },
          { id: 'node2', type: 'shell', config: { command: 'echo 2' } },
        ],
        edges: [
          { from: 'node1', to: 'node2', label: 'custom' },
        ],
      };

      const flow = parseFlowSpec(spec);
      expect(flow.edges).toHaveLength(1);
      expect(flow.edges[0].label).toBe('custom');
    });

    it('should set default values for node properties', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [
          { id: 'node1', type: 'shell', config: { command: 'echo' } },
        ],
      };

      const flow = parseFlowSpec(spec);
      const node = flow.nodes[0];
      expect(node.name).toBe('node1');
      expect(node.disabled).toBe(false);
      expect(node.onError).toBe('fail');
      expect(node.inputs).toEqual({});
      expect(node.outputs).toEqual({});
    });

    it('should parse retry config with defaults', () => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [
          {
            id: 'node1',
            type: 'shell',
            config: { command: 'echo' },
            retry: { enabled: true },
          },
        ],
      };

      const flow = parseFlowSpec(spec);
      const node = flow.nodes[0];
      expect(node.retry).toEqual({
        enabled: true,
        maxAttempts: 3,
        delay: 1000,
        backoff: 'fixed',
        backoffMultiplier: 2,
      });
    });

    it('should throw ParseError for invalid spec', () => {
      const spec = {
        name: 'Test Flow',
        nodes: [],
      };

      expect(() => parseFlowSpec(spec)).toThrow(ParseError);
    });
  });

  describe('Graph Navigation', () => {
    let flow;

    beforeEach(() => {
      const spec = {
        version: '2.0.0',
        name: 'Test Flow',
        nodes: [
          { id: 'a', type: 'shell', config: { command: 'echo a' } },
          { id: 'b', type: 'shell', config: { command: 'echo b' } },
          { id: 'c', type: 'shell', config: { command: 'echo c' } },
        ],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'a', to: 'c' },
          { from: 'b', to: 'c' },
        ],
      };
      flow = parseFlowSpec(spec);
    });

    it('should get successors', () => {
      expect(getSuccessors(flow, 'a')).toEqual(['b', 'c']);
      expect(getSuccessors(flow, 'b')).toEqual(['c']);
      expect(getSuccessors(flow, 'c')).toEqual([]);
    });

    it('should get predecessors', () => {
      expect(getPredecessors(flow, 'a')).toEqual([]);
      expect(getPredecessors(flow, 'b')).toEqual(['a']);
      expect(getPredecessors(flow, 'c')).toEqual(['a', 'b']);
    });

    it('should get entry nodes', () => {
      const entries = getEntryNodes(flow);
      expect(entries.map(n => n.id)).toEqual(['a']);
    });

    it('should get exit nodes', () => {
      const exits = getExitNodes(flow);
      expect(exits.map(n => n.id)).toEqual(['c']);
    });
  });
});

