/**
 * Graph 单元测试
 */

import { describe, it, expect } from 'vitest';
import { createFixedFlowGraph, FIXED_FLOW_NODE_IDS } from '../graph';
import { NodeType, OutputKind } from '../enums';

describe('FIXED_FLOW_NODE_IDS', () => {
  it('should contain all required node IDs', () => {
    expect(FIXED_FLOW_NODE_IDS).toContain('stage.intake');
    expect(FIXED_FLOW_NODE_IDS).toContain('stage.preflight');
    expect(FIXED_FLOW_NODE_IDS).toContain('execute');
    expect(FIXED_FLOW_NODE_IDS).toContain('execute.plan');
    expect(FIXED_FLOW_NODE_IDS).toContain('execute.edit');
    expect(FIXED_FLOW_NODE_IDS).toContain('execute.lint');
    expect(FIXED_FLOW_NODE_IDS).toContain('execute.test');
    expect(FIXED_FLOW_NODE_IDS).toContain('execute.summary');
    expect(FIXED_FLOW_NODE_IDS).toContain('stage.notify');
    expect(FIXED_FLOW_NODE_IDS).toContain('stage.done');
    expect(FIXED_FLOW_NODE_IDS).toContain('stage.git');
  });

  it('should have 11 nodes', () => {
    expect(FIXED_FLOW_NODE_IDS).toHaveLength(11);
  });
});

describe('createFixedFlowGraph', () => {
  const runId = 'RUN-20260105-123456-abcd';
  const graph = createFixedFlowGraph(runId);

  it('should create graph with correct version', () => {
    expect(graph.version).toBe('v1');
  });

  it('should set run_id correctly', () => {
    expect(graph.run_id).toBe(runId);
  });

  it('should have correct number of nodes', () => {
    expect(graph.nodes).toHaveLength(11);
  });

  it('should have correct number of edges', () => {
    expect(graph.edges).toHaveLength(9);
  });

  it('should have correct layout', () => {
    expect(graph.layout.direction).toBe('TB');
    expect(graph.layout.group_padding).toBe(16);
  });

  describe('nodes', () => {
    it('should have stage.intake node with correct properties', () => {
      const node = graph.nodes.find(n => n.id === 'stage.intake');
      expect(node).toBeDefined();
      expect(node!.type).toBe(NodeType.STAGE);
      expect(node!.title).toBe('Intake');
      expect(node!.parent_id).toBeNull();
      expect(node!.outputs).toHaveLength(1);
      expect(node!.outputs[0].kind).toBe(OutputKind.JSON);
    });

    it('should have execute group node', () => {
      const node = graph.nodes.find(n => n.id === 'execute');
      expect(node).toBeDefined();
      expect(node!.type).toBe(NodeType.GROUP);
      expect(node!.outputs).toHaveLength(0);
    });

    it('should have execute.edit task node with correct parent', () => {
      const node = graph.nodes.find(n => n.id === 'execute.edit');
      expect(node).toBeDefined();
      expect(node!.type).toBe(NodeType.TASK);
      expect(node!.parent_id).toBe('execute');
    });

    it('should have execute.summary with markdown output', () => {
      const node = graph.nodes.find(n => n.id === 'execute.summary');
      expect(node).toBeDefined();
      expect(node!.outputs[0].kind).toBe(OutputKind.MARKDOWN);
    });
  });

  describe('edges', () => {
    it('should connect stage.intake to stage.preflight', () => {
      const edge = graph.edges.find(e => e.from === 'stage.intake');
      expect(edge).toBeDefined();
      expect(edge!.to).toBe('stage.preflight');
    });

    it('should connect execute.summary to stage.notify', () => {
      const edge = graph.edges.find(e => e.from === 'execute.summary');
      expect(edge).toBeDefined();
      expect(edge!.to).toBe('stage.notify');
    });

    it('should form a complete chain', () => {
      const expectedSequence = [
        ['stage.intake', 'stage.preflight'],
        ['stage.preflight', 'execute.plan'],
        ['execute.plan', 'execute.edit'],
        ['execute.edit', 'execute.lint'],
        ['execute.lint', 'execute.test'],
        ['execute.test', 'execute.summary'],
        ['execute.summary', 'stage.notify'],
        ['stage.notify', 'stage.done'],
        ['stage.done', 'stage.git'],
      ];

      expectedSequence.forEach(([from, to]) => {
        const edge = graph.edges.find(e => e.from === from && e.to === to);
        expect(edge, `Edge ${from} -> ${to} should exist`).toBeDefined();
      });
    });
  });
});

