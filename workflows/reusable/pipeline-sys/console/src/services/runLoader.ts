/**
 * Run Loader Service
 * 安全读取某个 run 的工件文件
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getRunDir } from './runsIndex.js';
import { safeResolveUnderRun } from './pathGuards.js';
import { isValidStatusV1, isValidGraphV1, isValidNodeRunsSnapshotV1 } from '@pipeline-sys/shared';
import type { IStatusV1, IGraphV1, INodeRunsSnapshotV1 } from '@pipeline-sys/shared';

/**
 * 加载 status.json
 */
export async function loadStatus(runId: string): Promise<IStatusV1 | null> {
  const runDir = getRunDir(runId);
  const statusPath = path.join(runDir, 'status.json');
  
  try {
    const content = await fs.readFile(statusPath, 'utf8');
    const data = JSON.parse(content);
    
    if (isValidStatusV1(data)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 加载 graph.json
 */
export async function loadGraph(runId: string): Promise<IGraphV1 | null> {
  const runDir = getRunDir(runId);
  const graphPath = path.join(runDir, 'graph.json');
  
  try {
    const content = await fs.readFile(graphPath, 'utf8');
    const data = JSON.parse(content);
    
    if (isValidGraphV1(data)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 加载 node_runs.json
 */
export async function loadNodeRuns(runId: string): Promise<INodeRunsSnapshotV1 | null> {
  const runDir = getRunDir(runId);
  const nodeRunsPath = path.join(runDir, 'node_runs.json');
  
  try {
    const content = await fs.readFile(nodeRunsPath, 'utf8');
    const data = JSON.parse(content);
    
    if (isValidNodeRunsSnapshotV1(data)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 读取 run 目录内的任意文件（路径受限）
 */
export async function readRunFile(runId: string, relPath: string): Promise<{
  content: string;
  size: number;
  mtime: string;
} | null> {
  const runDir = getRunDir(runId);
  
  try {
    const absPath = safeResolveUnderRun(runDir, relPath);
    const stat = await fs.stat(absPath);
    
    if (!stat.isFile()) {
      return null;
    }
    
    const content = await fs.readFile(absPath, 'utf8');
    
    return {
      content,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * 获取 events.ndjson 路径
 */
export function getEventsPath(runId: string): string {
  const runDir = getRunDir(runId);
  return path.join(runDir, 'events.ndjson');
}

