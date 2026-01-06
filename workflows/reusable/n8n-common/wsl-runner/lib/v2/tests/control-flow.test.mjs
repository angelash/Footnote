/**
 * Control Flow Executors Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { ExecutionContext } from '../context.mjs';
import {
  getExecutor,
  hasExecutor,
  ConditionExecutor,
  ParallelExecutor,
  LoopExecutor,
  SubflowExecutor,
  createConditionExecutor,
  createParallelExecutor,
  createLoopExecutor,
  createSubflowExecutor,
} from '../executors/index.mjs';

describe('Control Flow Executor Registry', () => {
  it('should have all control flow executors registered', () => {
    expect(hasExecutor('condition')).toBe(true);
    expect(hasExecutor('parallel')).toBe(true);
    expect(hasExecutor('loop')).toBe(true);
    expect(hasExecutor('subflow')).toBe(true);
  });

  it('should get control flow executor instances', () => {
    expect(getExecutor('condition')).toBeInstanceOf(ConditionExecutor);
    expect(getExecutor('parallel')).toBeInstanceOf(ParallelExecutor);
    expect(getExecutor('loop')).toBeInstanceOf(LoopExecutor);
    expect(getExecutor('subflow')).toBeInstanceOf(SubflowExecutor);
  });
});

describe('ConditionExecutor', () => {
  let executor;
  let context;

  beforeEach(() => {
    executor = createConditionExecutor();
    context = new ExecutionContext({
      inputs: { value: 10, flag: true },
      variables: { threshold: 5 },
    });
  });

  it('should evaluate true condition', async () => {
    const node = {
      id: 'cond1',
      type: 'condition',
      config: {
        expression: 'inputs.value > variables.threshold',
        onTrue: 'node_a',
        onFalse: 'node_b',
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.condition).toBe(true);
    expect(result.output.branch).toBe('true');
    expect(result.output.next).toEqual(['node_a']);
  });

  it('should evaluate false condition', async () => {
    const node = {
      id: 'cond2',
      type: 'condition',
      config: {
        expression: 'inputs.value < variables.threshold',
        onTrue: 'node_a',
        onFalse: 'node_b',
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.condition).toBe(false);
    expect(result.output.branch).toBe('false');
    expect(result.output.next).toEqual(['node_b']);
  });

  it('should handle boolean input', async () => {
    const node = {
      id: 'cond3',
      type: 'condition',
      config: {
        expression: 'inputs.flag',
        onTrue: 'yes',
        onFalse: 'no',
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.condition).toBe(true);
    expect(result.output.next).toEqual(['yes']);
  });

  it('should handle array of next nodes', async () => {
    const node = {
      id: 'cond4',
      type: 'condition',
      config: {
        expression: 'true',
        onTrue: ['node_a', 'node_b'],
        onFalse: 'node_c',
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.next).toEqual(['node_a', 'node_b']);
  });

  it('should fail for missing expression', async () => {
    const node = {
      id: 'cond5',
      type: 'condition',
      config: {},
      onError: 'continue',
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should access previous node output via $', async () => {
    context.initNodeState('prev');
    context.markNodeStarted('prev');
    context.markNodeSuccess('prev', { score: 100 });

    const node = {
      id: 'cond6',
      type: 'condition',
      config: {
        expression: '$.score >= 60',
        onTrue: 'pass',
        onFalse: 'fail',
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.condition).toBe(true);
    expect(result.output.next).toEqual(['pass']);
  });
});

describe('ParallelExecutor', () => {
  let executor;
  let context;

  beforeEach(() => {
    executor = createParallelExecutor();
    context = new ExecutionContext({});
  });

  it('should execute parallel branches', async () => {
    const node = {
      id: 'parallel1',
      type: 'parallel',
      config: {
        branches: [
          { id: 'branch_a', nodes: ['node_a1', 'node_a2'] },
          { id: 'branch_b', nodes: ['node_b1'] },
        ],
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.allSucceeded).toBe(true);
    expect(result.output.failedBranches).toEqual([]);
    expect(result.output.branches).toHaveProperty('branch_a');
    expect(result.output.branches).toHaveProperty('branch_b');
  });

  it('should fail for empty branches', async () => {
    const node = {
      id: 'parallel2',
      type: 'parallel',
      config: {
        branches: [],
      },
      onError: 'continue',
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('At least one branch');
  });

  it('should handle branch with custom executor', async () => {
    const mockExecutor = async (nodes) => {
      return { executed: nodes.length };
    };

    const node = {
      id: 'parallel3',
      type: 'parallel',
      config: {
        branches: [
          { id: 'branch_a', nodes: ['n1', 'n2'], executor: mockExecutor },
          { id: 'branch_b', nodes: ['n3'], executor: mockExecutor },
        ],
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.branches.branch_a.output).toEqual({ executed: 2 });
    expect(result.output.branches.branch_b.output).toEqual({ executed: 1 });
  });

  it('should handle branch failure', async () => {
    const successExecutor = async () => ({ success: true });
    const failExecutor = async () => { throw new Error('Branch failed'); };

    const node = {
      id: 'parallel4',
      type: 'parallel',
      config: {
        branches: [
          { id: 'success', nodes: [], executor: successExecutor },
          { id: 'failure', nodes: [], executor: failExecutor },
        ],
        failFast: false,
      },
      onError: 'continue',
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(false);
    expect(result.output.failedBranches).toContain('failure');
    expect(result.output.branches.success.status).toBe('SUCCESS');
    expect(result.output.branches.failure.status).toBe('FAILED');
  });
});

describe('LoopExecutor', () => {
  let executor;
  let context;

  beforeEach(() => {
    executor = createLoopExecutor();
    context = new ExecutionContext({
      inputs: { items: [1, 2, 3, 4, 5] },
      variables: { count: 3 },
    });
  });

  describe('forEach loop', () => {
    it('should iterate over array', async () => {
      const node = {
        id: 'loop1',
        type: 'loop',
        config: {
          type: 'forEach',
          items: 'inputs.items',
          itemAs: 'item',
          indexAs: 'idx',
          body: ['processItem'],
        },
      };

      const result = await executor.run(node, context);
      expect(result.ok).toBe(true);
      expect(result.output.totalIterations).toBe(5);
      expect(result.output.completed).toBe(true);
      expect(result.output.iterations).toHaveLength(5);
      expect(result.output.iterations[0].item).toBe(1);
      expect(result.output.iterations[4].item).toBe(5);
    });

    it('should respect maxIterations', async () => {
      const node = {
        id: 'loop2',
        type: 'loop',
        config: {
          type: 'forEach',
          items: 'inputs.items',
          maxIterations: 3,
          body: [],
        },
      };

      const result = await executor.run(node, context);
      expect(result.ok).toBe(true);
      expect(result.output.totalIterations).toBe(3);
    });

    it('should fail for non-array items', async () => {
      context.setVariable('notArray', 'string');
      
      const node = {
        id: 'loop3',
        type: 'loop',
        config: {
          type: 'forEach',
          items: 'variables.notArray',
          body: [],
        },
        onError: 'continue',
      };

      const result = await executor.run(node, context);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('array');
    });
  });

  describe('times loop', () => {
    it('should execute fixed number of times', async () => {
      const node = {
        id: 'loop4',
        type: 'loop',
        config: {
          type: 'times',
          times: 5,
          body: ['doSomething'],
        },
      };

      const result = await executor.run(node, context);
      expect(result.ok).toBe(true);
      expect(result.output.totalIterations).toBe(5);
      expect(result.output.requestedTimes).toBe(5);
    });

    it('should evaluate times from expression', async () => {
      const node = {
        id: 'loop5',
        type: 'loop',
        config: {
          type: 'times',
          times: 'variables.count',
          body: [],
        },
      };

      const result = await executor.run(node, context);
      expect(result.ok).toBe(true);
      expect(result.output.totalIterations).toBe(3);
    });
  });

  describe('while loop', () => {
    it('should loop while condition is true', async () => {
      context.setVariable('counter', 0);

      // 使用自定义执行器递增计数器
      const incrementor = async () => {
        const current = context.getVariable('counter') || 0;
        context.setVariable('counter', current + 1);
        return { counter: current + 1 };
      };

      const node = {
        id: 'loop6',
        type: 'loop',
        config: {
          type: 'while',
          condition: 'variables.counter < 5',
          body: [],
          executor: incrementor,
        },
      };

      const result = await executor.run(node, context);
      expect(result.ok).toBe(true);
      expect(result.output.totalIterations).toBe(5);
      expect(result.output.completed).toBe(true);
    });

    it('should stop at maxIterations to prevent infinite loop', async () => {
      const node = {
        id: 'loop7',
        type: 'loop',
        config: {
          type: 'while',
          condition: 'true',
          maxIterations: 10,
          body: [],
        },
      };

      const result = await executor.run(node, context);
      expect(result.ok).toBe(true);
      expect(result.output.totalIterations).toBe(10);
      expect(result.output.hitMaxIterations).toBe(true);
      expect(result.output.completed).toBe(false);
    });
  });

  describe('doWhile loop', () => {
    it('should execute at least once', async () => {
      const node = {
        id: 'loop8',
        type: 'loop',
        config: {
          type: 'doWhile',
          condition: 'false',
          body: ['executeOnce'],
        },
      };

      const result = await executor.run(node, context);
      expect(result.ok).toBe(true);
      expect(result.output.totalIterations).toBe(1);
    });
  });
});

describe('SubflowExecutor', () => {
  let executor;
  let context;

  beforeEach(() => {
    executor = createSubflowExecutor();
    context = new ExecutionContext({
      inputs: { param1: 'value1' },
    });
  });

  it('should fail for missing flowId and flowPath', async () => {
    const node = {
      id: 'subflow1',
      type: 'subflow',
      config: {},
      onError: 'continue',
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('flowId or flowPath');
  });

  it('should return pending result without loader', async () => {
    const node = {
      id: 'subflow2',
      type: 'subflow',
      config: {
        flowId: 'test-flow',
        inputs: { a: 1 },
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.status).toBe('PENDING');
    expect(result.output.flowId).toBe('test-flow');
  });

  it('should execute with mock loader and runner', async () => {
    const mockFlow = { id: 'test-flow', name: 'Test', nodes: [] };
    const mockResult = {
      success: true,
      runId: 'run-123',
      output: { result: 'done' },
      status: 'SUCCESS',
      nodes: {},
    };

    executor.setFlowLoader(async (id) => mockFlow);
    executor.setFlowRunner(async (flow, inputs) => mockResult);

    const node = {
      id: 'subflow3',
      type: 'subflow',
      config: {
        flowId: 'test-flow',
        inputs: { x: 10 },
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.status).toBe('SUCCESS');
    expect(result.output.outputs).toEqual({ result: 'done' });
  });

  it('should handle subflow failure', async () => {
    const mockFlow = { id: 'fail-flow', nodes: [] };
    const mockResult = {
      success: false,
      error: 'Subflow error',
      runId: 'run-456',
      output: {},
    };

    executor.setFlowLoader(async () => mockFlow);
    executor.setFlowRunner(async () => mockResult);

    const node = {
      id: 'subflow4',
      type: 'subflow',
      config: {
        flowId: 'fail-flow',
      },
      onError: 'continue',
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Subflow failed');
    expect(result.output.status).toBe('FAILED');
  });

  it('should interpolate inputs', async () => {
    let capturedInputs;
    const mockFlow = { id: 'test-flow', nodes: [] };
    
    executor.setFlowLoader(async () => mockFlow);
    executor.setFlowRunner(async (flow, inputs) => {
      capturedInputs = inputs;
      return { success: true, output: {}, runId: 'run-789' };
    });

    const node = {
      id: 'subflow5',
      type: 'subflow',
      config: {
        flowId: 'test-flow',
        inputs: {
          p1: '${inputs.param1}',
          p2: 'static',
        },
      },
    };

    await executor.run(node, context);
    expect(capturedInputs).toEqual({
      p1: 'value1',
      p2: 'static',
    });
  });

  it('should extract outputs with mapping', async () => {
    const mockFlow = { id: 'test-flow', nodes: [] };
    
    executor.setFlowLoader(async () => mockFlow);
    executor.setFlowRunner(async () => ({
      success: true,
      output: { data: { nested: 'value' }, count: 42 },
      runId: 'run-101',
    }));

    const node = {
      id: 'subflow6',
      type: 'subflow',
      config: {
        flowId: 'test-flow',
        outputs: {
          extracted: '${output.data.nested}',
          num: '${output.count}',
        },
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    // interpolate 使用模板字符串，数字会被转为字符串
    expect(result.output.outputs).toEqual({
      extracted: 'value',
      num: '42',
    });
  });
});

