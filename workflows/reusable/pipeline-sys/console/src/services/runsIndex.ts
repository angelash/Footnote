/**
 * Runs Index Service
 * 扫描 automation_runs/ 生成 run 列表
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { isHiddenDir, safeResolveUnderProject } from './pathGuards.js';
import type { IRunListItem } from '../types/dto.js';
import type { IStatusV1 } from '@pipeline-sys/shared';

/**
 * 获取所有 run 列表
 * @returns run 列表（按更新时间倒序）
 */
export async function listRuns(): Promise<IRunListItem[]> {
  const runsDir = safeResolveUnderProject(config.projectRoot, config.automationRunsDir);
  
  let entries: string[];
  try {
    entries = await fs.readdir(runsDir);
  } catch (e) {
    // 目录不存在时返回空列表
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw e;
  }
  
  // 过滤隐藏目录（如 _lock）
  const runIds = entries.filter(name => !isHiddenDir(name));
  
  const runs: Array<IRunListItem & { mtime: number }> = [];
  
  for (const runId of runIds) {
    const runDir = path.join(runsDir, runId);
    const statusPath = path.join(runDir, 'status.json');
    
    try {
      const stat = await fs.stat(statusPath);
      const content = await fs.readFile(statusPath, 'utf8');
      const rawStatus = JSON.parse(content) as Record<string, unknown>;
      
      // 兼容 v1 格式（ok/stage）和 v2 格式（status/flow_id）
      let ok: boolean;
      let stage: number;
      
      if ('status' in rawStatus) {
        // v2 FlowRunner 格式
        const v2Status = rawStatus.status as string;
        ok = v2Status === 'SUCCESS';
        stage = v2Status === 'SUCCESS' ? 99 : 
                v2Status === 'RUNNING' ? 50 : 0;
      } else {
        // v1 格式
        const status = rawStatus as unknown as IStatusV1;
        ok = status.ok;
        stage = status.stage;
      }
      
      runs.push({
        run_id: runId,
        task_id: (rawStatus.task_id as string) || (rawStatus.flow_id as string) || '',
        ok,
        stage,
        current_node_id: (rawStatus.current_node_id as string) || '',
        started_at: rawStatus.started_at as string,
        updated_at: (rawStatus.updated_at as string) || (rawStatus.finished_at as string),
        mtime: stat.mtimeMs,
      });
    } catch {
      // 跳过无效的 run 目录
      continue;
    }
  }
  
  // 按更新时间倒序
  runs.sort((a, b) => b.mtime - a.mtime);
  
  // 移除 mtime 字段
  return runs.map(({ mtime, ...rest }) => rest);
}

/**
 * 检查 run 是否存在
 */
export async function runExists(runId: string): Promise<boolean> {
  const runsDir = safeResolveUnderProject(config.projectRoot, config.automationRunsDir);
  const runDir = path.join(runsDir, runId);
  
  try {
    await fs.access(runDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取 run 目录路径
 */
export function getRunDir(runId: string): string {
  const runsDir = safeResolveUnderProject(config.projectRoot, config.automationRunsDir);
  return path.join(runsDir, runId);
}

