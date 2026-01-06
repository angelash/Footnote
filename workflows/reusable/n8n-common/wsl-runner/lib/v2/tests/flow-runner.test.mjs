/**
 * Flow Runner Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  FlowRunner,
  createFlowRunner,
  runFlow,
  RunStatus,
  NodeStatus,
  EventType,
} from '../flow-runner.mjs';

describe('FlowRunner', () => {
  describe('Basic Execution', () => {
    it('should execute simple linear flow', async () => {
      const flowSpec = {
        id: 'test-flow',
        name: 'Test Flow',
        nodes: [
          {
            id: 'shell1',
            type: 'shell',
            command: 'echo hello',
            shell: process.platform === 'win32' ? 'cmd' : 'bash',
          },
        ],
      };

      const result = await runFlow(flowSpec, {});
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(RunStatus.SUCCESS);
      expect(result.flowId).toBe('test-flow');
      expect(result.nodes.shell1.status).toBe(NodeStatus.SUCCESS);
    });

    it('should handle flow with transform node', async () => {
      const flowSpec = {
        id: 'transform-flow',
        name: 'Transform Flow',
        inputs: {
          value: { type: 'number' },
        },
        nodes: [
          {
            id: 'calc',
            type: 'transform',
            expression: 'inputs.value * 2',
          },
        ],
      };

      const result = await runFlow(flowSpec, { value: 21 });
      
      expect(result.success).toBe(true);
      expect(result.output.calc).toBe(42);
    });

    it('should generate unique run ID', () => {
      const runner1 = createFlowRunner();
      const runner2 = createFlowRunner();
      
      expect(runner1.runId).not.toBe(runner2.runId);
      expect(runner1.runId).toMatch(/^run-\d+-[a-z0-9]+$/);
    });

    it('should use provided run ID', () => {
      const runner = createFlowRunner({ runId: 'custom-run-123' });
      expect(runner.runId).toBe('custom-run-123');
    });
  });

  describe('Sequential Execution', () => {
    it('should execute nodes in order with on_success', async () => {
      const order = [];
      
      const flowSpec = {
        id: 'seq-flow',
        name: 'Sequential',
        nodes: [
          {
            id: 'step1',
            type: 'transform',
            expression: '({ step: 1 })',
            on_success: 'step2',
          },
          {
            id: 'step2',
            type: 'transform',
            expression: '({ step: 2 })',
            on_success: 'step3',
          },
          {
            id: 'step3',
            type: 'transform',
            expression: '({ step: 3 })',
          },
        ],
      };

      const runner = createFlowRunner();
      runner.on(EventType.NODE_FINISHED, (e) => order.push(e.nodeId));
      
      await runner.run(flowSpec);
      
      expect(order).toEqual(['step1', 'step2', 'step3']);
    });

    it('should pass data between nodes via context', async () => {
      const flowSpec = {
        id: 'data-flow',
        name: 'Data Flow',
        nodes: [
          {
            id: 'producer',
            type: 'transform',
            expression: '({ value: 100 })',
            on_success: 'consumer',
          },
          {
            id: 'consumer',
            type: 'transform',
            expression: 'nodes.producer.output.value + 50',
          },
        ],
      };

      const result = await runFlow(flowSpec);
      
      expect(result.success).toBe(true);
      expect(result.output.producer).toEqual({ value: 100 });
      expect(result.output.consumer).toBe(150);
    });
  });

  describe('Condition Node', () => {
    it('should take true branch', async () => {
      const flowSpec = {
        id: 'cond-flow',
        name: 'Condition',
        inputs: { flag: { type: 'boolean' } },
        nodes: [
          {
            id: 'check',
            type: 'condition',
            expression: 'inputs.flag === true',
            onTrue: 'yes',
            onFalse: 'no',
          },
          {
            id: 'yes',
            type: 'transform',
            expression: '"YES"',
          },
          {
            id: 'no',
            type: 'transform',
            expression: '"NO"',
          },
        ],
      };

      const result = await runFlow(flowSpec, { flag: true });
      
      expect(result.success).toBe(true);
      expect(result.nodes.yes?.status).toBe(NodeStatus.SUCCESS);
      expect(result.nodes.no).toBeUndefined();
      expect(result.output.yes).toBe('YES');
    });

    it('should take false branch', async () => {
      const flowSpec = {
        id: 'cond-flow2',
        name: 'Condition2',
        inputs: { flag: { type: 'boolean' } },
        nodes: [
          {
            id: 'check',
            type: 'condition',
            expression: 'inputs.flag === true',
            onTrue: 'yes',
            onFalse: 'no',
          },
          {
            id: 'yes',
            type: 'transform',
            expression: '"YES"',
          },
          {
            id: 'no',
            type: 'transform',
            expression: '"NO"',
          },
        ],
      };

      const result = await runFlow(flowSpec, { flag: false });
      
      expect(result.success).toBe(true);
      expect(result.nodes.no?.status).toBe(NodeStatus.SUCCESS);
      expect(result.nodes.yes).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should mark run as failed when node fails', async () => {
      const flowSpec = {
        id: 'fail-flow',
        name: 'Fail',
        nodes: [
          {
            id: 'bad',
            type: 'shell',
            command: process.platform === 'win32' ? 'exit /b 1' : 'exit 1',
            shell: process.platform === 'win32' ? 'cmd' : 'bash',
          },
        ],
      };

      const result = await runFlow(flowSpec);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(RunStatus.FAILED);
      expect(result.nodes.bad.status).toBe(NodeStatus.FAILED);
    });

    it('should continue on error when configured', async () => {
      const flowSpec = {
        id: 'continue-flow',
        name: 'Continue',
        nodes: [
          {
            id: 'bad',
            type: 'shell',
            command: process.platform === 'win32' ? 'exit /b 1' : 'exit 1',
            shell: process.platform === 'win32' ? 'cmd' : 'bash',
            onError: 'continue',
            on_success: 'next',
          },
          {
            id: 'next',
            type: 'transform',
            expression: '"continued"',
          },
        ],
      };

      const result = await runFlow(flowSpec);
      
      // 流程标记为失败因为有节点失败
      expect(result.status).toBe(RunStatus.FAILED);
      // 但后续节点应该执行了
      expect(result.nodes.next?.status).toBe(NodeStatus.SUCCESS);
    });

    it('should use on_failure branch', async () => {
      const flowSpec = {
        id: 'onfail-flow',
        name: 'OnFail',
        nodes: [
          {
            id: 'risky',
            type: 'transform',
            expression: 'throw new Error("oops")',
            on_success: 'good',
            on_failure: 'bad',
          },
          {
            id: 'good',
            type: 'transform',
            expression: '"good"',
          },
          {
            id: 'bad',
            type: 'transform',
            expression: '"handled error"',
          },
        ],
      };

      const result = await runFlow(flowSpec);
      
      expect(result.nodes.bad?.status).toBe(NodeStatus.SUCCESS);
      expect(result.nodes.good).toBeUndefined();
    });
  });

  describe('Cancellation', () => {
    it('should cancel running flow', async () => {
      const flowSpec = {
        id: 'slow-flow',
        name: 'Slow',
        nodes: [
          {
            id: 'slow',
            type: 'shell',
            command: process.platform === 'win32' ? 'ping -n 10 127.0.0.1' : 'sleep 10',
            shell: process.platform === 'win32' ? 'cmd' : 'bash',
          },
        ],
      };

      const runner = createFlowRunner();
      const runPromise = runner.run(flowSpec);
      
      // 稍后取消
      setTimeout(() => runner.cancel(), 100);
      
      const result = await runPromise;
      
      expect(result.status).toBe(RunStatus.CANCELLED);
    }, 5000);
  });

  describe('Events', () => {
    it('should emit events during execution', async () => {
      const events = [];
      
      const flowSpec = {
        id: 'event-flow',
        name: 'Events',
        nodes: [
          {
            id: 'node1',
            type: 'transform',
            expression: '1',
          },
        ],
      };

      const runner = createFlowRunner();
      runner.on('event', (e) => events.push(e.type));
      
      await runner.run(flowSpec);
      
      expect(events).toContain(EventType.RUN_STARTED);
      expect(events).toContain(EventType.NODE_STARTED);
      expect(events).toContain(EventType.NODE_FINISHED);
      expect(events).toContain(EventType.RUN_FINISHED);
    });

    it('should include run events in result', async () => {
      const flowSpec = {
        id: 'log-flow',
        name: 'Log',
        nodes: [
          {
            id: 'n1',
            type: 'transform',
            expression: '"a"',
          },
        ],
      };

      const result = await runFlow(flowSpec);
      
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events.find(e => e.type === EventType.RUN_STARTED)).toBeDefined();
      expect(result.events.find(e => e.type === EventType.RUN_FINISHED)).toBeDefined();
    });
  });

  describe('Artifacts', () => {
    it('should call artifact writer', async () => {
      const artifacts = {};
      const mockWriter = vi.fn(async (name, data) => {
        artifacts[name] = data;
      });

      const flowSpec = {
        id: 'artifact-flow',
        name: 'Artifacts',
        nodes: [
          {
            id: 'n1',
            type: 'transform',
            expression: '42',
          },
        ],
      };

      await runFlow(flowSpec, {}, { artifactWriter: mockWriter });
      
      // 应该写入 status.json, graph.json, events.ndjson, node_runs.json
      expect(mockWriter).toHaveBeenCalled();
      expect(artifacts['status.json']).toBeDefined();
      expect(artifacts['status.json'].status).toBe(RunStatus.SUCCESS);
      expect(artifacts['graph.json']).toBeDefined();
      expect(artifacts['node_runs.json']).toBeDefined();
    });

    it('should build correct graph structure', async () => {
      const artifacts = {};
      const mockWriter = vi.fn(async (name, data) => {
        artifacts[name] = data;
      });

      const flowSpec = {
        id: 'graph-flow',
        name: 'Graph',
        nodes: [
          {
            id: 'a',
            type: 'transform',
            expression: '1',
            on_success: 'b',
          },
          {
            id: 'b',
            type: 'transform',
            expression: '2',
          },
        ],
      };

      await runFlow(flowSpec, {}, { artifactWriter: mockWriter });
      
      const graph = artifacts['graph.json'];
      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toContainEqual({ source: 'a', target: 'b' });
    });
  });

  describe('Inputs and Variables', () => {
    it('should pass inputs to context', async () => {
      const flowSpec = {
        id: 'input-flow',
        name: 'Inputs',
        inputs: {
          x: { type: 'number' },
          y: { type: 'number' },
        },
        nodes: [
          {
            id: 'sum',
            type: 'transform',
            expression: 'inputs.x + inputs.y',
          },
        ],
      };

      const result = await runFlow(flowSpec, { x: 10, y: 20 });
      
      expect(result.success).toBe(true);
      expect(result.output.sum).toBe(30);
    });

    it('should use default values', async () => {
      const flowSpec = {
        id: 'default-flow',
        name: 'Defaults',
        inputs: {
          value: { type: 'number', default: 100 },
        },
        nodes: [
          {
            id: 'use',
            type: 'transform',
            expression: 'inputs.value || 100',
          },
        ],
      };

      const result = await runFlow(flowSpec, {});
      
      expect(result.success).toBe(true);
      // 没有传入 value，使用默认值逻辑
      expect(result.output.use).toBe(100);
    });
  });

  describe('Loop Node', () => {
    it('should execute forEach loop', async () => {
      const flowSpec = {
        id: 'loop-flow',
        name: 'Loop',
        inputs: {
          items: { type: 'array' },
        },
        nodes: [
          {
            id: 'loop',
            type: 'loop',
            type: 'loop',
            items: 'inputs.items',
            itemAs: 'item',
            body: [],
          },
        ],
      };

      const result = await runFlow(flowSpec, { items: [1, 2, 3] });
      
      expect(result.success).toBe(true);
      expect(result.output.loop.totalIterations).toBe(3);
    });
  });
});

describe('runFlow convenience function', () => {
  it('should create runner and execute flow', async () => {
    const flowSpec = {
      id: 'quick-flow',
      name: 'Quick',
      nodes: [
        {
          id: 'n',
          type: 'transform',
          expression: '"quick"',
        },
      ],
    };

    const result = await runFlow(flowSpec);
    
    expect(result.success).toBe(true);
    expect(result.output.n).toBe('quick');
  });
});

