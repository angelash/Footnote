/**
 * Executor Base Module Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NodeExecutor,
  ExecutorRegistry,
  globalRegistry,
  createExecutor,
  successResult,
  failureResult,
} from '../executor-base.mjs';
import { ExecutionContext } from '../context.mjs';

describe('NodeExecutor', () => {
  class TestExecutor extends NodeExecutor {
    constructor() {
      super('test');
    }

    async execute(config, context, options) {
      if (config.shouldFail) {
        throw new Error('Test failure');
      }
      if (config.delay) {
        await new Promise(resolve => setTimeout(resolve, config.delay));
      }
      return successResult({ value: config.value || 'default' });
    }
  }

  let executor;
  let context;

  beforeEach(() => {
    executor = new TestExecutor();
    context = new ExecutionContext({
      inputs: { name: 'test' },
    });
  });

  describe('basic properties', () => {
    it('should have correct type', () => {
      expect(executor.type).toBe('test');
      expect(executor.nodeType).toBe('test');
    });

    it('should not be running initially', () => {
      expect(executor.isRunning).toBe(false);
    });
  });

  describe('run lifecycle', () => {
    it('should run node and return result', async () => {
      const node = {
        id: 'test-node',
        type: 'test',
        config: { value: 'hello' },
      };

      const result = await executor.run(node, context);
      expect(result.ok).toBe(true);
      expect(result.output.value).toBe('hello');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should emit started and finished events', async () => {
      const node = { id: 'test-node', type: 'test', config: {} };
      const startedHandler = vi.fn();
      const finishedHandler = vi.fn();

      executor.on('started', startedHandler);
      executor.on('finished', finishedHandler);

      await executor.run(node, context);

      expect(startedHandler).toHaveBeenCalledTimes(1);
      expect(finishedHandler).toHaveBeenCalledTimes(1);
    });

    it('should skip node when condition is false', async () => {
      const node = {
        id: 'test-node',
        type: 'test',
        config: {},
        condition: 'false',
      };

      const result = await executor.run(node, context);
      expect(result.ok).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('Condition not met');
    });

    it('should handle node failure', async () => {
      const node = {
        id: 'test-node',
        type: 'test',
        config: { shouldFail: true },
        onError: 'continue',
      };

      const result = await executor.run(node, context);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Test failure');
    });

    it('should throw when onError is fail', async () => {
      const node = {
        id: 'test-node',
        type: 'test',
        config: { shouldFail: true },
        onError: 'fail',
      };

      await expect(executor.run(node, context)).rejects.toThrow('Test failure');
    });
  });

  describe('logging', () => {
    it('should emit log events', async () => {
      const logHandler = vi.fn();
      executor.on('log', logHandler);

      executor.info('Test message', { data: 'test' });
      executor.debug('Debug message');
      executor.warn('Warning message');
      executor.error('Error message');

      expect(logHandler).toHaveBeenCalledTimes(4);
      expect(logHandler.mock.calls[0][0].level).toBe('info');
      expect(logHandler.mock.calls[0][0].message).toBe('Test message');
      expect(logHandler.mock.calls[1][0].level).toBe('debug');
      expect(logHandler.mock.calls[2][0].level).toBe('warn');
      expect(logHandler.mock.calls[3][0].level).toBe('error');
    });
  });

  describe('retry', () => {
    it('should retry on failure', async () => {
      let attempts = 0;
      class RetryExecutor extends NodeExecutor {
        constructor() {
          super('retry');
        }
        async execute() {
          attempts++;
          if (attempts < 3) {
            throw new Error('Retry me');
          }
          return successResult({ attempts });
        }
      }

      const retryExecutor = new RetryExecutor();
      const node = {
        id: 'retry-node',
        type: 'retry',
        config: {},
        retry: { enabled: true, maxAttempts: 5, delay: 10 },
      };

      const result = await retryExecutor.run(node, context);
      expect(result.ok).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should fail after max retries', async () => {
      let attempts = 0;
      class AlwaysFailExecutor extends NodeExecutor {
        constructor() {
          super('fail');
        }
        async execute() {
          attempts++;
          throw new Error('Always fail');
        }
      }

      const failExecutor = new AlwaysFailExecutor();
      const node = {
        id: 'fail-node',
        type: 'fail',
        config: {},
        retry: { enabled: true, maxAttempts: 3, delay: 10 },
        onError: 'continue',
      };

      const result = await failExecutor.run(node, context);
      expect(result.ok).toBe(false);
      expect(attempts).toBe(3);
    });
  });

  describe('timeout', () => {
    it('should timeout slow execution', async () => {
      const node = {
        id: 'slow-node',
        type: 'test',
        config: { delay: 1000 },
        timeout: 50,
        onError: 'continue',
      };

      const result = await executor.run(node, context);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Execution timeout');
    });

    it('should emit timeout event', async () => {
      const timeoutHandler = vi.fn();
      executor.on('timeout', timeoutHandler);

      const node = {
        id: 'slow-node',
        type: 'test',
        config: { delay: 1000 },
        timeout: 50,
        onError: 'continue',
      };

      await executor.run(node, context);
      expect(timeoutHandler).toHaveBeenCalled();
    });
  });

  describe('cancellation', () => {
    it('should cancel running execution', async () => {
      // Use a custom executor that properly handles abort signal
      class CancellableExecutor extends NodeExecutor {
        constructor() {
          super('cancellable');
        }
        async execute(config, context, options) {
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              resolve(successResult({ done: true }));
            }, 5000);
            
            if (options.signal) {
              options.signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new Error('Execution cancelled'));
              });
            }
          });
        }
      }

      const cancellableExecutor = new CancellableExecutor();
      const node = {
        id: 'long-node',
        type: 'cancellable',
        config: {},
        onError: 'continue',
      };

      const runPromise = cancellableExecutor.run(node, context);
      
      // Cancel after 50ms
      setTimeout(() => cancellableExecutor.cancel(), 50);

      const result = await runPromise;
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Execution cancelled');
    });
  });

  describe('variable interpolation', () => {
    it('should interpolate config values', async () => {
      let receivedConfig;
      class ConfigExecutor extends NodeExecutor {
        constructor() {
          super('config');
        }
        async execute(config) {
          receivedConfig = config;
          return successResult(config);
        }
      }

      const configExecutor = new ConfigExecutor();
      const node = {
        id: 'config-node',
        type: 'config',
        config: {
          message: 'Hello ${inputs.name}!',
        },
      };

      await configExecutor.run(node, context);
      expect(receivedConfig.message).toBe('Hello test!');
    });
  });
});

describe('ExecutorRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new ExecutorRegistry();
  });

  it('should register and get executor', () => {
    class CustomExecutor extends NodeExecutor {
      constructor() {
        super('custom');
      }
      async execute() {
        return successResult({});
      }
    }

    registry.register('custom', CustomExecutor);
    expect(registry.has('custom')).toBe(true);

    const executor = registry.get('custom');
    expect(executor).toBeInstanceOf(CustomExecutor);
    expect(executor.type).toBe('custom');
  });

  it('should return null for unregistered type', () => {
    expect(registry.get('unknown')).toBeNull();
  });

  it('should list registered types', () => {
    class Exec1 extends NodeExecutor {
      constructor() { super('type1'); }
      async execute() { return successResult({}); }
    }
    class Exec2 extends NodeExecutor {
      constructor() { super('type2'); }
      async execute() { return successResult({}); }
    }

    registry.register('type1', Exec1);
    registry.register('type2', Exec2);

    const types = registry.getRegisteredTypes();
    expect(types).toContain('type1');
    expect(types).toContain('type2');
  });

  it('should unregister executor', () => {
    class TempExecutor extends NodeExecutor {
      constructor() { super('temp'); }
      async execute() { return successResult({}); }
    }

    registry.register('temp', TempExecutor);
    expect(registry.has('temp')).toBe(true);

    registry.unregister('temp');
    expect(registry.has('temp')).toBe(false);
  });
});

describe('createExecutor', () => {
  it('should create executor from function', async () => {
    const ExecutorClass = createExecutor('simple', async (config, ctx, opts, executor) => {
      executor.info('Executing...');
      return successResult({ doubled: config.value * 2 });
    });

    const executor = new ExecutorClass();
    expect(executor.type).toBe('simple');

    const node = { id: 'n1', type: 'simple', config: { value: 5 } };
    const context = new ExecutionContext({});
    const result = await executor.run(node, context);

    expect(result.ok).toBe(true);
    expect(result.output.doubled).toBe(10);
  });
});

describe('result helpers', () => {
  it('should create success result', () => {
    const result = successResult({ data: 'test' }, { custom: 'meta' });
    expect(result.ok).toBe(true);
    expect(result.output).toEqual({ data: 'test' });
    expect(result.error).toBeNull();
    expect(result.meta).toEqual({ custom: 'meta' });
  });

  it('should create failure result', () => {
    const result = failureResult('Something went wrong', { partial: 'data' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Something went wrong');
    expect(result.output).toEqual({ partial: 'data' });
  });
});

describe('globalRegistry', () => {
  it('should be a singleton ExecutorRegistry', () => {
    expect(globalRegistry).toBeInstanceOf(ExecutorRegistry);
  });
});

