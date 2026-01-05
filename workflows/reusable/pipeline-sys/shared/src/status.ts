/**
 * Pipeline-Sys v1 Status Types
 * 对应 <run_id>/status.json
 */

/**
 * 仓库信息
 */
export interface IRepoInfoV1 {
  root: string;
  branch: string;
  head: string;
}

/**
 * 运行状态
 * 对应 status.json
 */
export interface IStatusV1 {
  /** 运行 ID */
  run_id: string;
  /** 任务 ID */
  task_id: string;
  /** 当前阶段编号（兼容旧版） */
  stage: number;
  /** 当前节点 ID（v1 新增） */
  current_node_id: string;
  /** 尝试次数 */
  attempt: number;
  /** 是否成功 */
  ok: boolean;
  /** 错误信息 */
  error?: string;
  /** 开始时间 ISO8601 */
  started_at: string;
  /** 更新时间 ISO8601 */
  updated_at: string;
  /** 仓库信息 */
  repo: IRepoInfoV1;
  /** 备注 */
  note?: string;
}

/**
 * 控制请求
 * 对应 control.json
 */
export interface IControlV1 {
  /** 取消请求 */
  cancel?: {
    requested_at: string;
    requested_by: string;
  };
  /** 重试请求 */
  retry?: {
    requested_at: string;
    node_id: string;
    requested_by: string;
  };
}

/**
 * 锁元信息
 * 对应 _lock/<run_id>/lock.json
 */
export interface ILockMetaV1 {
  run_id: string;
  project_root: string;
  pid: number;
  host: string;
  started_at: string;
  updated_at: string;
  /** TTL 毫秒（固定 7200000 = 2小时） */
  ttl_ms: number;
}

/**
 * 默认 TTL 毫秒
 */
export const DEFAULT_LOCK_TTL_MS = 7200000;

/**
 * 心跳间隔毫秒
 */
export const LOCK_HEARTBEAT_INTERVAL_MS = 10000;

