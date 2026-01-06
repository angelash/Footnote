/**
 * Context Module Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExecutionContext,
  createContext,
  createContextFromFlow,
} from '../context.mjs';

describe('ExecutionContext', () => {
  let ctx;

  beforeEach(() => {
    ctx = new ExecutionContext({
      inputs: { task_id: 'task-123', name: 'Test' },
      variables: { count: 0 },
      env: { NODE_ENV: 'test' },
      runId: 'run-001',
      flowName: 'Test Flow',
    });
  });

  describe('constructor and getters', () => {
    it('should initialize with provided values', () => {
      expect(ctx.inputs).toEqual({ task_id: 'task-123', name: 'Test' });
      expect(ctx.variables).toEqual({ count: 0 });
      expect(ctx.env).toEqual({ NODE_ENV: 'test' });
      expect(ctx.runId).toBe('run-001');
      expect(ctx.flowName).toBe('Test Flow');
    });

    it('should have frozen inputs', () => {
      expect(() => { ctx.inputs.task_id = 'changed'; }).toThrow();
    });

    it('should have frozen env', () => {
      expect(() => { ctx.env.NEW_VAR = 'value'; }).toThrow();
    });
  });

  describe('variables', () => {
    it('should set and get variable', () => {
      ctx.setVariable('newVar', 'value');
      expect(ctx.getVariable('newVar')).toBe('value');
    });

    it('should set multiple variables', () => {
      ctx.setVariables({ a: 1, b: 2 });
      expect(ctx.getVariable('a')).toBe(1);
      expect(ctx.getVariable('b')).toBe(2);
    });

    it('should delete variable', () => {
      ctx.setVariable('temp', 'value');
      ctx.deleteVariable('temp');
      expect(ctx.getVariable('temp')).toBeUndefined();
    });

    it('should return copy of variables', () => {
      const vars = ctx.variables;
      vars.modified = true;
      expect(ctx.getVariable('modified')).toBeUndefined();
    });
  });

  describe('node state management', () => {
    it('should initialize node state', () => {
      ctx.initNodeState('node1');
      const state = ctx.getNodeState('node1');
      expect(state).toEqual({
        id: 'node1',
        status: 'PENDING',
        started_at: null,
        finished_at: null,
        duration: null,
        output: null,
        error: null,
        attempt: 0,
      });
    });

    it('should mark node started', () => {
      ctx.initNodeState('node1');
      ctx.markNodeStarted('node1', 1);
      const state = ctx.getNodeState('node1');
      expect(state.status).toBe('RUNNING');
      expect(state.started_at).toBeTruthy();
      expect(state.attempt).toBe(1);
    });

    it('should mark node success', () => {
      ctx.initNodeState('node1');
      ctx.markNodeStarted('node1');
      ctx.markNodeSuccess('node1', { result: 'ok' });
      const state = ctx.getNodeState('node1');
      expect(state.status).toBe('SUCCESS');
      expect(state.finished_at).toBeTruthy();
      expect(state.duration).toBeGreaterThanOrEqual(0);
      expect(state.output).toEqual({ result: 'ok' });
    });

    it('should mark node failed', () => {
      ctx.initNodeState('node1');
      ctx.markNodeStarted('node1');
      ctx.markNodeFailed('node1', 'Something went wrong');
      const state = ctx.getNodeState('node1');
      expect(state.status).toBe('FAILED');
      expect(state.error).toBe('Something went wrong');
    });

    it('should mark node skipped', () => {
      ctx.initNodeState('node1');
      ctx.markNodeSkipped('node1', 'Condition not met');
      const state = ctx.getNodeState('node1');
      expect(state.status).toBe('SKIPPED');
      expect(state.error).toBe('Condition not met');
    });

    it('should mark node cancelled', () => {
      ctx.initNodeState('node1');
      ctx.markNodeStarted('node1');
      ctx.markNodeCancelled('node1');
      const state = ctx.getNodeState('node1');
      expect(state.status).toBe('CANCELLED');
    });

    it('should mark node timeout', () => {
      ctx.initNodeState('node1');
      ctx.markNodeStarted('node1');
      ctx.markNodeTimeout('node1');
      const state = ctx.getNodeState('node1');
      expect(state.status).toBe('TIMEOUT');
      expect(state.error).toBe('Timeout');
    });

    it('should check if node is finished', () => {
      ctx.initNodeState('node1');
      expect(ctx.isNodeFinished('node1')).toBe(false);
      ctx.markNodeStarted('node1');
      expect(ctx.isNodeFinished('node1')).toBe(false);
      ctx.markNodeSuccess('node1');
      expect(ctx.isNodeFinished('node1')).toBe(true);
    });

    it('should check if node is success', () => {
      ctx.initNodeState('node1');
      ctx.markNodeStarted('node1');
      expect(ctx.isNodeSuccess('node1')).toBe(false);
      ctx.markNodeSuccess('node1');
      expect(ctx.isNodeSuccess('node1')).toBe(true);
    });

    it('should get node output', () => {
      ctx.initNodeState('node1');
      ctx.markNodeStarted('node1');
      ctx.markNodeSuccess('node1', { data: 'test' });
      expect(ctx.getNodeOutput('node1')).toEqual({ data: 'test' });
    });
  });

  describe('snapshot', () => {
    it('should return complete snapshot', () => {
      ctx.initNodeState('node1');
      ctx.markNodeStarted('node1');
      ctx.markNodeSuccess('node1', { result: 1 });

      const snapshot = ctx.getSnapshot();
      expect(snapshot.inputs).toEqual({ task_id: 'task-123', name: 'Test' });
      expect(snapshot.variables).toEqual({ count: 0 });
      expect(snapshot.env).toEqual({ NODE_ENV: 'test' });
      expect(snapshot.nodes.node1.status).toBe('SUCCESS');
      expect(snapshot.run.id).toBe('run-001');
    });
  });

  describe('expression helpers', () => {
    it('should interpolate template', () => {
      const result = ctx.interpolate('Task: ${inputs.task_id}');
      expect(result).toBe('Task: task-123');
    });

    it('should interpolate deep', () => {
      const obj = { title: '${inputs.name}', nested: { id: '${inputs.task_id}' } };
      const result = ctx.interpolateDeep(obj);
      expect(result).toEqual({ title: 'Test', nested: { id: 'task-123' } });
    });

    it('should evaluate expression', () => {
      ctx.setVariable('count', 5);
      const result = ctx.evaluate('variables.count * 2');
      expect(result).toBe(10);
    });

    it('should evaluate condition', () => {
      ctx.initNodeState('node1');
      ctx.markNodeStarted('node1');
      ctx.markNodeSuccess('node1');

      expect(ctx.evaluateCondition('nodes.node1.status === "SUCCESS"')).toBe(true);
      expect(ctx.evaluateCondition('nodes.node1.status === "FAILED"')).toBe(false);
    });
  });

  describe('child context', () => {
    it('should create child context with overrides', () => {
      const child = ctx.createChildContext({ item: 'test', index: 0 });
      expect(child.getVariable('item')).toBe('test');
      expect(child.getVariable('index')).toBe(0);
      expect(child.getVariable('count')).toBe(0); // Inherited
      expect(child.inputs).toEqual(ctx.inputs); // Same inputs
    });

    it('should merge child context changes', () => {
      const child = ctx.createChildContext();
      child.setVariable('newVar', 'value');
      child.initNodeState('childNode');
      child.markNodeStarted('childNode');
      child.markNodeSuccess('childNode');

      ctx.mergeChildContext(child);
      expect(ctx.getVariable('newVar')).toBe('value');
      expect(ctx.getNodeState('childNode').status).toBe('SUCCESS');
    });

    it('should merge only specified variables', () => {
      const child = ctx.createChildContext();
      child.setVariable('a', 1);
      child.setVariable('b', 2);

      ctx.mergeChildContext(child, ['a']);
      expect(ctx.getVariable('a')).toBe(1);
      expect(ctx.getVariable('b')).toBeUndefined();
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize', () => {
      ctx.initNodeState('node1');
      ctx.markNodeStarted('node1');
      ctx.markNodeSuccess('node1', { result: 'ok' });
      ctx.setVariable('newVar', 'value');

      const serialized = ctx.serialize();
      const restored = ExecutionContext.deserialize(serialized);

      expect(restored.runId).toBe(ctx.runId);
      expect(restored.flowName).toBe(ctx.flowName);
      expect(restored.inputs).toEqual(ctx.inputs);
      expect(restored.variables).toEqual(ctx.variables);
      expect(restored.getNodeState('node1').status).toBe('SUCCESS');
    });
  });
});

describe('createContext', () => {
  it('should create context with default values', () => {
    const ctx = createContext();
    expect(ctx.inputs).toEqual({});
    expect(ctx.variables).toEqual({});
  });

  it('should create context with options', () => {
    const ctx = createContext({
      inputs: { a: 1 },
      variables: { b: 2 },
    });
    expect(ctx.inputs).toEqual({ a: 1 });
    expect(ctx.variables).toEqual({ b: 2 });
  });
});

describe('createContextFromFlow', () => {
  const flow = {
    name: 'Test Flow',
    inputs: {
      required_param: { type: 'string', required: true },
      optional_param: { type: 'string', default: 'default_value' },
    },
    variables: {
      counter: { type: 'number', default: 0 },
    },
    nodes: [
      { id: 'node1', type: 'shell' },
      { id: 'node2', type: 'shell' },
    ],
  };

  it('should create context from flow definition', () => {
    const ctx = createContextFromFlow(flow, { required_param: 'value' });
    expect(ctx.inputs.required_param).toBe('value');
    expect(ctx.inputs.optional_param).toBe('default_value');
    expect(ctx.getVariable('counter')).toBe(0);
    expect(ctx.flowName).toBe('Test Flow');
  });

  it('should initialize all node states', () => {
    const ctx = createContextFromFlow(flow, { required_param: 'value' });
    expect(ctx.getNodeState('node1').status).toBe('PENDING');
    expect(ctx.getNodeState('node2').status).toBe('PENDING');
  });

  it('should throw for missing required input', () => {
    expect(() => createContextFromFlow(flow, {})).toThrow('Missing required input parameter: required_param');
  });

  it('should use provided runId', () => {
    const ctx = createContextFromFlow(flow, { required_param: 'value' }, { runId: 'custom-run' });
    expect(ctx.runId).toBe('custom-run');
  });
});

