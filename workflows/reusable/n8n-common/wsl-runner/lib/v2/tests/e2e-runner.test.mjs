/**
 * E2E Tests for v2 FlowRunner integration with server.mjs
 * 
 * 这些测试直接测试 FlowRunner 和工件生成，不需要启动 HTTP 服务器
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { createFlowRunner, runFlow, RunStatus, NodeStatus } from '../flow-runner.mjs';

// 测试用临时目录
let testDir;

async function createTestDir() {
  const dir = path.join(os.tmpdir(), `pipeline-sys-test-${Date.now()}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanupTestDir(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

describe('FlowRunner E2E', () => {
  beforeEach(async () => {
    testDir = await createTestDir();
  });

  afterEach(async () => {
    await cleanupTestDir(testDir);
  });

  describe('Artifact Generation', () => {
    it('should generate status.json', async () => {
      const artifacts = {};
      const artifactWriter = async (name, data) => {
        artifacts[name] = data;
      };

      const flowSpec = {
        id: 'artifact-test',
        name: 'Artifact Test',
        nodes: [
          { id: 'n1', type: 'transform', expression: '42' },
        ],
      };

      const runner = createFlowRunner({ artifactWriter });
      await runner.run(flowSpec);

      expect(artifacts['status.json']).toBeDefined();
      expect(artifacts['status.json'].flow_id).toBe('artifact-test');
      expect(artifacts['status.json'].status).toBe(RunStatus.SUCCESS);
      expect(artifacts['status.json'].finished_at).toBeDefined();
    });

    it('should generate graph.json with correct structure', async () => {
      const artifacts = {};
      const artifactWriter = async (name, data) => {
        artifacts[name] = data;
      };

      const flowSpec = {
        id: 'graph-test',
        name: 'Graph Test',
        nodes: [
          { id: 'a', type: 'transform', expression: '1', on_success: 'b' },
          { id: 'b', type: 'transform', expression: '2' },
        ],
      };

      await runFlow(flowSpec, {}, { artifactWriter });

      const graph = artifacts['graph.json'];
      expect(graph.nodes).toHaveLength(2);
      expect(graph.nodes[0].id).toBe('a');
      expect(graph.nodes[0].status).toBe(NodeStatus.SUCCESS);
      expect(graph.edges).toContainEqual({ source: 'a', target: 'b' });
    });

    it('should generate events.ndjson', async () => {
      const artifacts = {};
      const artifactWriter = async (name, data, options) => {
        artifacts[name] = { data, options };
      };

      const flowSpec = {
        id: 'events-test',
        name: 'Events Test',
        nodes: [
          { id: 'n1', type: 'transform', expression: '"hello"' },
        ],
      };

      await runFlow(flowSpec, {}, { artifactWriter });

      const events = artifacts['events.ndjson'];
      expect(events).toBeDefined();
      expect(events.options?.raw).toBe(true);
      
      // 解析 NDJSON
      const lines = events.data.split('\n').filter(l => l.trim());
      expect(lines.length).toBeGreaterThan(0);
      
      const parsed = lines.map(l => JSON.parse(l));
      const types = parsed.map(e => e.type);
      expect(types).toContain('RUN_STARTED');
      expect(types).toContain('RUN_FINISHED');
    });

    it('should generate node_runs.json', async () => {
      const artifacts = {};
      const artifactWriter = async (name, data) => {
        artifacts[name] = data;
      };

      const flowSpec = {
        id: 'node-runs-test',
        name: 'Node Runs Test',
        nodes: [
          { id: 'n1', type: 'transform', expression: '100', on_success: 'n2' },
          { id: 'n2', type: 'transform', expression: 'nodes.n1.output + 50' },
        ],
      };

      await runFlow(flowSpec, {}, { artifactWriter });

      const nodeRuns = artifacts['node_runs.json'];
      expect(nodeRuns.n1).toBeDefined();
      expect(nodeRuns.n1.status).toBe(NodeStatus.SUCCESS);
      expect(nodeRuns.n1.output).toBe(100);
      expect(nodeRuns.n2).toBeDefined();
      expect(nodeRuns.n2.status).toBe(NodeStatus.SUCCESS);
      expect(nodeRuns.n2.output).toBe(150);
    });
  });

  describe('File-based FlowSpec', () => {
    it('should execute flow from JSON object', async () => {
      const flowSpec = {
        id: 'inline-flow',
        name: 'Inline Flow',
        inputs: {
          x: { type: 'number' },
        },
        nodes: [
          { id: 'calc', type: 'transform', expression: 'inputs.x * 2' },
        ],
      };

      const result = await runFlow(flowSpec, { x: 21 });

      expect(result.success).toBe(true);
      expect(result.output.calc).toBe(42);
    });
  });

  describe('Control Flow', () => {
    it('should execute condition node correctly', async () => {
      const flowSpec = {
        id: 'condition-flow',
        name: 'Condition Flow',
        inputs: {
          value: { type: 'number' },
        },
        nodes: [
          {
            id: 'check',
            type: 'condition',
            expression: 'inputs.value > 10',
            onTrue: 'big',
            onFalse: 'small',
          },
          { id: 'big', type: 'transform', expression: '"BIG"' },
          { id: 'small', type: 'transform', expression: '"SMALL"' },
        ],
      };

      const result1 = await runFlow(flowSpec, { value: 20 });
      expect(result1.success).toBe(true);
      expect(result1.output.big).toBe('BIG');
      expect(result1.nodes.small).toBeUndefined();

      const result2 = await runFlow(flowSpec, { value: 5 });
      expect(result2.success).toBe(true);
      expect(result2.output.small).toBe('SMALL');
      expect(result2.nodes.big).toBeUndefined();
    });

    it('should execute loop node correctly', async () => {
      const flowSpec = {
        id: 'loop-flow',
        name: 'Loop Flow',
        inputs: {
          items: { type: 'array' },
        },
        nodes: [
          {
            id: 'loop',
            type: 'loop',
            items: 'inputs.items',
            itemAs: 'item',
            body: [],
          },
        ],
      };

      const result = await runFlow(flowSpec, { items: ['a', 'b', 'c'] });
      expect(result.success).toBe(true);
      expect(result.output.loop.totalIterations).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle node failures gracefully', async () => {
      const flowSpec = {
        id: 'error-flow',
        name: 'Error Flow',
        nodes: [
          {
            id: 'bad',
            type: 'transform',
            expression: 'throw new Error("intentional error")',
          },
        ],
      };

      const result = await runFlow(flowSpec);

      expect(result.success).toBe(false);
      expect(result.status).toBe(RunStatus.FAILED);
      expect(result.nodes.bad.status).toBe(NodeStatus.FAILED);
    });

    it('should use on_failure branch', async () => {
      const flowSpec = {
        id: 'fallback-flow',
        name: 'Fallback Flow',
        nodes: [
          {
            id: 'risky',
            type: 'transform',
            expression: 'throw new Error("boom")',
            on_failure: 'fallback',
          },
          { id: 'fallback', type: 'transform', expression: '"recovered"' },
        ],
      };

      const result = await runFlow(flowSpec);

      expect(result.nodes.fallback?.status).toBe(NodeStatus.SUCCESS);
      expect(result.output.fallback).toBe('recovered');
    });
  });

  describe('Events', () => {
    it('should emit events during execution', async () => {
      const events = [];

      const flowSpec = {
        id: 'event-flow',
        name: 'Event Flow',
        nodes: [
          { id: 'n1', type: 'transform', expression: '1' },
        ],
      };

      const runner = createFlowRunner();
      runner.on('event', (e) => events.push(e));

      await runner.run(flowSpec);

      const types = events.map(e => e.type);
      expect(types).toContain('RUN_STARTED');
      expect(types).toContain('NODE_STARTED');
      expect(types).toContain('NODE_FINISHED');
      expect(types).toContain('RUN_FINISHED');
    });
  });
});

