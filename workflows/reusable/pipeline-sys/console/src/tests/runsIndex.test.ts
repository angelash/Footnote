/**
 * Runs Index 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';

// Mock fs and config
vi.mock('node:fs', () => ({
  promises: {
    readdir: vi.fn(),
    stat: vi.fn(),
    readFile: vi.fn(),
    access: vi.fn(),
  },
}));

vi.mock('../config', () => ({
  config: {
    projectRoot: '/home/user/project',
    automationRunsDir: 'workflows/project/logs/automation_runs',
  },
}));

import { listRuns, runExists, getRunDir } from '../services/runsIndex';

describe('getRunDir', () => {
  it('should return correct run directory path', () => {
    const runDir = getRunDir('RUN-123');
    expect(runDir).toBe('/home/user/project/workflows/project/logs/automation_runs/RUN-123');
  });
});

describe('listRuns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when directory does not exist', async () => {
    (fs.readdir as any).mockRejectedValue({ code: 'ENOENT' });
    
    const runs = await listRuns();
    expect(runs).toEqual([]);
  });

  it('should filter out hidden directories', async () => {
    (fs.readdir as any).mockResolvedValue(['RUN-123', '_lock', '.hidden', 'RUN-456']);
    
    (fs.stat as any).mockResolvedValue({ mtimeMs: Date.now() });
    
    (fs.readFile as any).mockResolvedValue(JSON.stringify({
      task_id: 'TASK-001',
      ok: true,
      stage: 99,
      current_node_id: 'stage.done',
      started_at: '2026-01-05T12:00:00Z',
      updated_at: '2026-01-05T12:05:00Z',
    }));

    const runs = await listRuns();
    
    // Should only include non-hidden runs
    expect(runs.every(r => !r.run_id.startsWith('_'))).toBe(true);
    expect(runs.every(r => !r.run_id.startsWith('.'))).toBe(true);
  });

  it('should sort by mtime descending', async () => {
    (fs.readdir as any).mockResolvedValue(['RUN-old', 'RUN-new']);
    
    const oldTime = Date.now() - 10000;
    const newTime = Date.now();
    
    (fs.stat as any)
      .mockResolvedValueOnce({ mtimeMs: oldTime })
      .mockResolvedValueOnce({ mtimeMs: newTime });
    
    (fs.readFile as any).mockResolvedValue(JSON.stringify({
      task_id: 'TASK-001',
      ok: true,
      stage: 99,
      current_node_id: 'stage.done',
      started_at: '2026-01-05T12:00:00Z',
      updated_at: '2026-01-05T12:05:00Z',
    }));

    const runs = await listRuns();
    
    // Newer run should come first
    expect(runs[0].run_id).toBe('RUN-new');
  });
});

describe('runExists', () => {
  it('should return true when run exists', async () => {
    (fs.access as any).mockResolvedValue(undefined);
    
    const exists = await runExists('RUN-123');
    expect(exists).toBe(true);
  });

  it('should return false when run does not exist', async () => {
    (fs.access as any).mockRejectedValue({ code: 'ENOENT' });
    
    const exists = await runExists('RUN-nonexistent');
    expect(exists).toBe(false);
  });
});

