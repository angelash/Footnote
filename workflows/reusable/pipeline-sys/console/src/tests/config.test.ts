/**
 * Config 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use default values when env vars not set', async () => {
    delete process.env.PIPELINE_SYS_HOST;
    delete process.env.PIPELINE_SYS_PORT;
    delete process.env.PROJECT_ROOT;
    delete process.env.RUNNER_BASE_URL;

    const { loadConfig } = await import('../config.js');
    const config = loadConfig();

    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(3230);
    expect(config.automationRunsDir).toBe('workflows/project/logs/automation_runs');
  });

  it('should use env vars when set', async () => {
    process.env.PIPELINE_SYS_HOST = '0.0.0.0';
    process.env.PIPELINE_SYS_PORT = '8080';
    process.env.PROJECT_ROOT = '/custom/path';
    process.env.RUNNER_BASE_URL = 'http://custom-runner:3210';

    const { loadConfig } = await import('../config.js');
    const config = loadConfig();

    expect(config.host).toBe('0.0.0.0');
    expect(config.port).toBe(8080);
    expect(config.projectRoot).toBe('/custom/path');
    expect(config.runnerBaseUrl).toBe('http://custom-runner:3210');
  });

  it('should parse port as integer', async () => {
    process.env.PIPELINE_SYS_PORT = '9999';

    const { loadConfig } = await import('../config.js');
    const config = loadConfig();

    expect(config.port).toBe(9999);
    expect(typeof config.port).toBe('number');
  });
});

describe('IConsoleConfig interface', () => {
  it('should have required properties', async () => {
    const { config } = await import('../config.js');

    expect(config).toHaveProperty('host');
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('projectRoot');
    expect(config).toHaveProperty('runnerBaseUrl');
    expect(config).toHaveProperty('automationRunsDir');
  });
});
