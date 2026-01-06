/**
 * Executors Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { ExecutionContext } from '../context.mjs';
import {
  getExecutor,
  hasExecutor,
  getRegisteredTypes,
  ShellExecutor,
  TransformExecutor,
  FileExecutor,
  HttpExecutor,
  NotifyExecutor,
  createShellExecutor,
} from '../executors/index.mjs';

describe('Executor Registry', () => {
  it('should have all builtin executors registered', () => {
    expect(hasExecutor('shell')).toBe(true);
    expect(hasExecutor('transform')).toBe(true);
    expect(hasExecutor('file')).toBe(true);
    expect(hasExecutor('http')).toBe(true);
    expect(hasExecutor('notify')).toBe(true);
  });

  it('should return registered types', () => {
    const types = getRegisteredTypes();
    expect(types).toContain('shell');
    expect(types).toContain('transform');
    expect(types).toContain('file');
    expect(types).toContain('http');
    expect(types).toContain('notify');
  });

  it('should get executor instance', () => {
    const shell = getExecutor('shell');
    expect(shell).toBeInstanceOf(ShellExecutor);
    expect(shell.type).toBe('shell');
  });

  it('should return null for unknown type', () => {
    expect(getExecutor('unknown')).toBeNull();
  });
});

describe('ShellExecutor', () => {
  let executor;
  let context;
  const isWindows = process.platform === 'win32';

  beforeEach(() => {
    executor = createShellExecutor();
    context = new ExecutionContext({});
  });

  it('should execute simple command (cmd on Windows)', async () => {
    const node = {
      id: 'test',
      type: 'shell',
      config: isWindows ? {
        command: 'echo hello',
        shell: 'cmd',
      } : {
        command: 'echo hello',
        shell: 'bash',
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.stdout.trim()).toBe('hello');
    expect(result.output.exitCode).toBe(0);
  });

  it('should fail for non-zero exit code', async () => {
    const node = {
      id: 'test',
      type: 'shell',
      config: isWindows ? {
        command: 'exit /b 1',
        shell: 'cmd',
      } : {
        command: 'exit 1',
        shell: 'bash',
      },
      onError: 'continue',
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(false);
    expect(result.output.exitCode).toBe(1);
  });

  it('should use custom environment variables (PowerShell on Windows)', async () => {
    const node = {
      id: 'test',
      type: 'shell',
      config: isWindows ? {
        command: 'echo %MY_VAR%',
        shell: 'cmd',
        env: { MY_VAR: 'custom_value' },
      } : {
        command: 'echo $MY_VAR',
        shell: 'bash',
        env: { MY_VAR: 'custom_value' },
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.stdout.trim()).toBe('custom_value');
  });

  it('should fail for missing command', async () => {
    const node = {
      id: 'test',
      type: 'shell',
      config: {},
      onError: 'continue',
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('required');
  });
});

describe('TransformExecutor', () => {
  let executor;
  let context;

  beforeEach(() => {
    executor = new TransformExecutor();
    context = new ExecutionContext({
      inputs: { a: 10, b: 20 },
      variables: { multiplier: 2 },
    });
  });

  it('should evaluate simple expression', async () => {
    const node = {
      id: 'test',
      type: 'transform',
      config: {
        expression: 'inputs.a + inputs.b',
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output).toBe(30);
  });

  it('should evaluate with variables', async () => {
    const node = {
      id: 'test',
      type: 'transform',
      config: {
        expression: '(inputs.a + inputs.b) * variables.multiplier',
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output).toBe(60);
  });

  it('should return object', async () => {
    const node = {
      id: 'test',
      type: 'transform',
      config: {
        expression: '({ sum: inputs.a + inputs.b, product: inputs.a * inputs.b })',
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output).toEqual({ sum: 30, product: 200 });
  });

  it('should access previous node output via $', async () => {
    // Add a completed node to context
    context.initNodeState('prev');
    context.markNodeStarted('prev');
    context.markNodeSuccess('prev', { value: 100 });

    const node = {
      id: 'test',
      type: 'transform',
      config: {
        expression: '$.value * 2',
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output).toBe(200);
  });

  it('should fail for missing expression', async () => {
    const node = {
      id: 'test',
      type: 'transform',
      config: {},
      onError: 'continue',
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should fail for dangerous expression', async () => {
    const node = {
      id: 'test',
      type: 'transform',
      config: {
        expression: 'process.exit()',
      },
      onError: 'continue',
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('forbidden');
  });
});

describe('FileExecutor', () => {
  let executor;
  let context;
  let tempDir;

  beforeEach(async () => {
    executor = new FileExecutor();
    context = new ExecutionContext({});
    tempDir = path.join(os.tmpdir(), `pipeline-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should write and read file', async () => {
    const filePath = path.join(tempDir, 'test.txt');
    
    // Write
    const writeNode = {
      id: 'write',
      type: 'file',
      config: {
        operation: 'write',
        path: filePath,
        content: 'Hello, World!',
      },
    };

    const writeResult = await executor.run(writeNode, context);
    expect(writeResult.ok).toBe(true);
    expect(writeResult.output.written).toBe(true);

    // Read
    const readNode = {
      id: 'read',
      type: 'file',
      config: {
        operation: 'read',
        path: filePath,
      },
    };

    const readResult = await executor.run(readNode, context);
    expect(readResult.ok).toBe(true);
    expect(readResult.output.content).toBe('Hello, World!');
  });

  it('should append to file', async () => {
    const filePath = path.join(tempDir, 'append.txt');
    
    // Write initial
    await fs.writeFile(filePath, 'Line 1\n');

    // Append
    const node = {
      id: 'append',
      type: 'file',
      config: {
        operation: 'append',
        path: filePath,
        content: 'Line 2\n',
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);

    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toBe('Line 1\nLine 2\n');
  });

  it('should check file exists', async () => {
    const existingFile = path.join(tempDir, 'exists.txt');
    await fs.writeFile(existingFile, 'test');

    // Existing file
    const node1 = {
      id: 'exists1',
      type: 'file',
      config: {
        operation: 'exists',
        path: existingFile,
      },
    };

    const result1 = await executor.run(node1, context);
    expect(result1.ok).toBe(true);
    expect(result1.output.exists).toBe(true);
    expect(result1.output.isFile).toBe(true);

    // Non-existing file
    const node2 = {
      id: 'exists2',
      type: 'file',
      config: {
        operation: 'exists',
        path: path.join(tempDir, 'not-exists.txt'),
      },
    };

    const result2 = await executor.run(node2, context);
    expect(result2.ok).toBe(true);
    expect(result2.output.exists).toBe(false);
  });

  it('should delete file', async () => {
    const filePath = path.join(tempDir, 'to-delete.txt');
    await fs.writeFile(filePath, 'delete me');

    const node = {
      id: 'delete',
      type: 'file',
      config: {
        operation: 'delete',
        path: filePath,
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.deleted).toBe(true);

    // Verify deleted
    try {
      await fs.access(filePath);
      throw new Error('File should not exist');
    } catch (err) {
      expect(err.code).toBe('ENOENT');
    }
  });

  it('should list directory', async () => {
    // Create some files
    await fs.writeFile(path.join(tempDir, 'file1.txt'), 'a');
    await fs.writeFile(path.join(tempDir, 'file2.txt'), 'b');
    await fs.mkdir(path.join(tempDir, 'subdir'));

    const node = {
      id: 'list',
      type: 'file',
      config: {
        operation: 'list',
        path: tempDir,
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.count).toBe(3);
    expect(result.output.items.map(i => i.name)).toContain('file1.txt');
    expect(result.output.items.map(i => i.name)).toContain('file2.txt');
    expect(result.output.items.map(i => i.name)).toContain('subdir');
  });

  it('should copy file', async () => {
    const srcPath = path.join(tempDir, 'source.txt');
    const destPath = path.join(tempDir, 'dest.txt');
    await fs.writeFile(srcPath, 'copy me');

    const node = {
      id: 'copy',
      type: 'file',
      config: {
        operation: 'copy',
        path: srcPath,
        destination: destPath,
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.copied).toBe(true);

    const content = await fs.readFile(destPath, 'utf-8');
    expect(content).toBe('copy me');
  });
});

describe('NotifyExecutor', () => {
  let executor;
  let context;

  beforeEach(() => {
    executor = new NotifyExecutor();
    context = new ExecutionContext({});
  });

  it('should send console notification', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const node = {
      id: 'notify',
      type: 'notify',
      config: {
        channel: 'console',
        message: 'Test notification',
        level: 'info',
        title: 'Test',
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.channel).toBe('console');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should send log file notification', async () => {
    const tempDir = path.join(os.tmpdir(), `notify-test-${Date.now()}`);
    const logPath = path.join(tempDir, 'notifications.log');

    const node = {
      id: 'notify',
      type: 'notify',
      config: {
        channel: 'log',
        message: 'Log notification',
        level: 'success',
        logPath,
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.channel).toBe('log');

    const content = await fs.readFile(logPath, 'utf-8');
    expect(content).toContain('Log notification');
    expect(content).toContain('SUCCESS');

    // Cleanup
    await fs.rm(tempDir, { recursive: true });
  });

  it('should fail for missing webhook url', async () => {
    const node = {
      id: 'notify',
      type: 'notify',
      config: {
        channel: 'webhook',
        message: 'Test',
      },
      onError: 'continue',
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('URL is required');
  });
});

describe('HttpExecutor', () => {
  let executor;
  let context;

  beforeEach(() => {
    executor = new HttpExecutor();
    context = new ExecutionContext({});
  });

  it('should make GET request', async () => {
    // Use a public test API
    const node = {
      id: 'http',
      type: 'http',
      config: {
        method: 'GET',
        url: 'https://httpbin.org/get',
        timeout: 10000,
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.status).toBe(200);
    expect(result.output.body).toBeDefined();
  }, 15000);

  it('should make POST request with JSON body', async () => {
    const node = {
      id: 'http',
      type: 'http',
      config: {
        method: 'POST',
        url: 'https://httpbin.org/post',
        body: { key: 'value' },
        bodyType: 'json',
        timeout: 10000,
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.status).toBe(200);
    expect(result.output.body.json).toEqual({ key: 'value' });
  }, 15000);

  it('should fail for missing URL', async () => {
    const node = {
      id: 'http',
      type: 'http',
      config: {
        method: 'GET',
      },
      onError: 'continue',
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('URL is required');
  });

  it('should handle query parameters', async () => {
    const node = {
      id: 'http',
      type: 'http',
      config: {
        method: 'GET',
        url: 'https://httpbin.org/get',
        query: { foo: 'bar', num: '123' },
        timeout: 10000,
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.body.args).toEqual({ foo: 'bar', num: '123' });
  }, 15000);

  it('should handle authorization header', async () => {
    const node = {
      id: 'http',
      type: 'http',
      config: {
        method: 'GET',
        url: 'https://httpbin.org/headers',
        auth: {
          type: 'bearer',
          credentials: 'test-token',
        },
        timeout: 10000,
      },
    };

    const result = await executor.run(node, context);
    expect(result.ok).toBe(true);
    expect(result.output.body.headers.Authorization).toBe('Bearer test-token');
  }, 15000);
});

