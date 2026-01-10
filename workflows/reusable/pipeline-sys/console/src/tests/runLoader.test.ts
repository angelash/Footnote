/**
 * RunLoader 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Mock config
vi.mock('../config.js', () => ({
  config: {
    projectRoot: '/mock/project',
    automationRunsDir: 'workflows/project/logs/automation_runs',
  },
}));

// Mock runsIndex to return our test directory
let mockRunDir = '';
vi.mock('../services/runsIndex.js', () => ({
  getRunDir: () => mockRunDir,
}));

// Import after mocking
const { loadStatus, loadGraph, loadNodeRuns, readRunFile, getEventsPath } = await import('../services/runLoader.js');

describe('loadStatus', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'run-loader-test-'));
    mockRunDir = tempDir;
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('should load v1 format status', async () => {
    const statusV1 = {
      run_id: 'RUN-001',
      task_id: 'TASK-001',
      stage: 99,
      current_node_id: 'stage.done',
      attempt: 1,
      ok: true,
      started_at: '2026-01-05T12:00:00Z',
      updated_at: '2026-01-05T12:05:00Z',
      repo: { root: '/test', branch: 'main', head: 'abc123' },
    };
    await fs.writeFile(path.join(tempDir, 'status.json'), JSON.stringify(statusV1));

    const result = await loadStatus('RUN-001');
    
    expect(result).not.toBeNull();
    expect(result?.run_id).toBe('RUN-001');
    expect(result?.ok).toBe(true);
    expect(result?.stage).toBe(99);
  });

  it('should load v2 format status and convert to v1', async () => {
    const statusV2 = {
      run_id: 'RUN-002',
      flow_id: 'FLOW-002',
      status: 'SUCCESS',
      started_at: '2026-01-05T12:00:00Z',
      finished_at: '2026-01-05T12:05:00Z',
    };
    await fs.writeFile(path.join(tempDir, 'status.json'), JSON.stringify(statusV2));

    const result = await loadStatus('RUN-002');
    
    expect(result).not.toBeNull();
    expect(result?.run_id).toBe('RUN-002');
    expect(result?.task_id).toBe('FLOW-002');
    expect(result?.ok).toBe(true);
    expect(result?.stage).toBe(99);
  });

  it('should return null for non-existent status', async () => {
    const result = await loadStatus('RUN-NONEXISTENT');
    expect(result).toBeNull();
  });

  it('should return null for invalid JSON', async () => {
    await fs.writeFile(path.join(tempDir, 'status.json'), 'not valid json');
    const result = await loadStatus('RUN-INVALID');
    expect(result).toBeNull();
  });
});

describe('loadGraph', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'graph-loader-test-'));
    mockRunDir = tempDir;
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('should load v1 format graph', async () => {
    const graphV1 = {
      version: 'v1',
      run_id: 'RUN-001',
      nodes: [
        { id: 'stage.intake', type: 'stage', title: 'Intake', parent_id: null, outputs: [] },
      ],
      edges: [{ from: 'stage.intake', to: 'stage.execute' }],
      layout: { direction: 'TB', group_padding: 16 },
    };
    await fs.writeFile(path.join(tempDir, 'graph.json'), JSON.stringify(graphV1));

    const result = await loadGraph('RUN-001');
    
    expect(result).not.toBeNull();
    expect(result?.version).toBe('v1');
    expect(result?.nodes).toHaveLength(1);
    expect(result?.edges).toHaveLength(1);
  });

  it('should load v2 format graph and convert to v1', async () => {
    const graphV2 = {
      nodes: [
        { id: 'node1', type: 'shell', name: 'Shell Node', status: 'SUCCESS' },
        { id: 'node2', type: 'transform', name: 'Transform', status: 'PENDING' },
      ],
      edges: [{ source: 'node1', target: 'node2' }],
    };
    await fs.writeFile(path.join(tempDir, 'graph.json'), JSON.stringify(graphV2));

    const result = await loadGraph('RUN-002');
    
    expect(result).not.toBeNull();
    expect(result?.version).toBe('v1');
    expect(result?.nodes).toHaveLength(2);
    expect(result?.nodes[0].title).toBe('Shell Node');
    expect(result?.edges[0].from).toBe('node1');
    expect(result?.edges[0].to).toBe('node2');
  });

  it('should return null for non-existent graph', async () => {
    const result = await loadGraph('RUN-NONEXISTENT');
    expect(result).toBeNull();
  });
});

describe('loadNodeRuns', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nodeRuns-loader-test-'));
    mockRunDir = tempDir;
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('should load v1 format node_runs', async () => {
    const nodeRunsV1 = {
      version: 'v1',
      run_id: 'RUN-001',
      updated_at: '2026-01-05T12:00:00Z',
      nodes: {
        'stage.intake': {
          status: 'SUCCESS',
          attempt: 1,
          started_at: '2026-01-05T12:00:00Z',
          ended_at: '2026-01-05T12:00:05Z',
          elapsed_ms: 5000,
          last_error: null,
          outputs: [],
        },
      },
    };
    await fs.writeFile(path.join(tempDir, 'node_runs.json'), JSON.stringify(nodeRunsV1));

    const result = await loadNodeRuns('RUN-001');
    
    expect(result).not.toBeNull();
    expect(result?.version).toBe('v1');
    expect(result?.nodes['stage.intake'].status).toBe('SUCCESS');
  });

  it('should load v2 format node_runs and convert to v1', async () => {
    const nodeRunsV2 = {
      node1: { status: 'SUCCESS', duration: 1000 },
      node2: { status: 'RUNNING', error: 'Some error' },
    };
    await fs.writeFile(path.join(tempDir, 'node_runs.json'), JSON.stringify(nodeRunsV2));

    const result = await loadNodeRuns('RUN-002');
    
    expect(result).not.toBeNull();
    expect(result?.version).toBe('v1');
    expect(result?.nodes['node1'].status).toBe('SUCCESS');
    expect(result?.nodes['node2'].last_error).toBe('Some error');
  });

  it('should return null for non-existent node_runs', async () => {
    const result = await loadNodeRuns('RUN-NONEXISTENT');
    expect(result).toBeNull();
  });
});

describe('readRunFile', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'read-file-test-'));
    mockRunDir = tempDir;
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('should read existing file', async () => {
    const content = 'Hello, World!';
    await fs.writeFile(path.join(tempDir, 'test.txt'), content);

    const result = await readRunFile('RUN-001', 'test.txt');
    
    expect(result).not.toBeNull();
    expect(result?.content).toBe(content);
    expect(result?.size).toBe(content.length);
  });

  it('should read nested file', async () => {
    const nestedDir = path.join(tempDir, 'nodes');
    await fs.mkdir(nestedDir, { recursive: true });
    await fs.writeFile(path.join(nestedDir, 'output.json'), '{"result": true}');

    const result = await readRunFile('RUN-001', 'nodes/output.json');
    
    expect(result).not.toBeNull();
    expect(result?.content).toBe('{"result": true}');
  });

  it('should return null for non-existent file', async () => {
    const result = await readRunFile('RUN-001', 'nonexistent.txt');
    expect(result).toBeNull();
  });

  it('should return null for directory', async () => {
    await fs.mkdir(path.join(tempDir, 'subdir'));
    const result = await readRunFile('RUN-001', 'subdir');
    expect(result).toBeNull();
  });
});

describe('getEventsPath', () => {
  it('should return correct events path', () => {
    mockRunDir = '/mock/runs/RUN-001';
    const eventsPath = getEventsPath('RUN-001');
    // Verify path contains expected components (platform-independent)
    expect(eventsPath).toContain('RUN-001');
    expect(eventsPath).toContain('events.ndjson');
  });
});
