/**
 * Parallel Scheduler
 * 
 * 任务并行调度器，实现：
 * - 基于领域的并发控制
 * - lock_key 冲突检测
 * - 只读任务无限制并行
 * 
 * @module lib/v2/parallel-scheduler
 */

/**
 * 任务领域枚举
 */
export const TaskDomain = {
  DESIGN: 'design',      // 设计文档
  ART: 'art',            // 美术资源
  CODE: 'code',          // 程序代码
  WHITEBOX: 'whitebox',  // 白盒占位
  READONLY: 'readonly',  // 只读任务
};

/**
 * 访问模式枚举
 */
export const AccessMode = {
  READ: 'read',
  WRITE: 'write',
};

/**
 * 角色到领域的映射
 */
export const ROLE_DOMAIN_MAP = {
  // 设计领域
  'l3-writer': TaskDomain.DESIGN,
  'l3-scripter': TaskDomain.DESIGN,
  'l3-level-designer': TaskDomain.DESIGN,
  'l2-level-lead': TaskDomain.DESIGN,
  
  // 美术领域
  'l3-environment-artist': TaskDomain.ART,
  'l3-character-artist': TaskDomain.ART,
  'l3-animator': TaskDomain.ART,
  'l3-vfx-artist': TaskDomain.ART,
  'l2-art-lead': TaskDomain.ART,
  
  // 程序领域
  'l3-execute': TaskDomain.CODE,
  'l3-ui-engineer': TaskDomain.CODE,
  'l3-tester': TaskDomain.CODE,
  'l2-code-review': TaskDomain.READONLY,
  
  // 只读领域
  'l1-design-review': TaskDomain.READONLY,
  'l0-audit-intake': TaskDomain.READONLY,
  'l0-acceptance-review': TaskDomain.READONLY,
  'l3-qa-signoff': TaskDomain.READONLY,
  
  // 白盒领域
  'whitebox-scene': TaskDomain.WHITEBOX,
  'whitebox-character': TaskDomain.WHITEBOX,
  'whitebox-object': TaskDomain.WHITEBOX,
  
  // 入口（默认写入代码）
  'pm-intake': TaskDomain.CODE,
  'lead-decompose': TaskDomain.DESIGN,
};

/**
 * 从 flowspec 路径推断角色
 */
export function inferRoleFromFlowspec(flowspec) {
  if (!flowspec || typeof flowspec !== 'string') {
    return null;
  }
  
  // 提取文件名
  const filename = flowspec.split('/').pop()?.replace('.flowspec.json', '') || '';
  
  // 直接匹配
  if (ROLE_DOMAIN_MAP[filename]) {
    return filename;
  }
  
  // 模糊匹配
  for (const role of Object.keys(ROLE_DOMAIN_MAP)) {
    if (filename.includes(role) || role.includes(filename)) {
      return role;
    }
  }
  
  return null;
}

/**
 * 从角色推断领域
 */
export function inferDomainFromRole(role) {
  return ROLE_DOMAIN_MAP[role] || TaskDomain.CODE;
}

/**
 * 从 flowspec 推断领域
 */
export function inferDomainFromFlowspec(flowspec) {
  const role = inferRoleFromFlowspec(flowspec);
  return role ? inferDomainFromRole(role) : TaskDomain.CODE;
}

/**
 * 从角色推断访问模式
 */
export function inferAccessModeFromRole(role) {
  const domain = inferDomainFromRole(role);
  return domain === TaskDomain.READONLY ? AccessMode.READ : AccessMode.WRITE;
}

/**
 * 并行调度器
 */
export class ParallelScheduler {
  /**
   * @param {Object} options - 配置选项
   * @param {Object} [options.maxConcurrent] - 每个领域的最大并发数
   */
  constructor(options = {}) {
    // 每个领域的最大并发数
    this.maxConcurrentByDomain = {
      [TaskDomain.DESIGN]: options.design || 3,
      [TaskDomain.ART]: options.art || 3,
      [TaskDomain.CODE]: options.code || 2,
      [TaskDomain.WHITEBOX]: options.whitebox || 5,
      [TaskDomain.READONLY]: options.readonly || 10,
    };
    
    // 当前运行中的任务（按领域）
    /** @type {Map<string, Set<string>>} */
    this.runningByDomain = new Map();
    for (const domain of Object.values(TaskDomain)) {
      this.runningByDomain.set(domain, new Set());
    }
    
    // 当前运行中的 lock_key
    /** @type {Set<string>} */
    this.runningLockKeys = new Set();
  }

  /**
   * 判断任务是否可以开始
   * @param {Object} task - 任务对象
   * @returns {boolean}
   */
  canStart(task) {
    const domain = task.access_mode === AccessMode.READ ? TaskDomain.READONLY : (task.domain || TaskDomain.CODE);
    
    // 检查领域并发限制
    const domainRunning = this.runningByDomain.get(domain);
    const maxConcurrent = this.maxConcurrentByDomain[domain] || 1;
    
    if (domainRunning && domainRunning.size >= maxConcurrent) {
      console.log(`[Scheduler] Task ${task.id} blocked: domain ${domain} at max concurrent (${domainRunning.size}/${maxConcurrent})`);
      return false;
    }
    
    // 只读任务不检查 lock_key
    if (task.access_mode === AccessMode.READ) {
      return true;
    }
    
    // 检查 lock_key 冲突
    if (task.lock_key && this.runningLockKeys.has(task.lock_key)) {
      console.log(`[Scheduler] Task ${task.id} blocked: lock_key ${task.lock_key} in use`);
      return false;
    }
    
    return true;
  }

  /**
   * 标记任务开始运行
   * @param {Object} task - 任务对象
   */
  markRunning(task) {
    const domain = task.access_mode === AccessMode.READ ? TaskDomain.READONLY : (task.domain || TaskDomain.CODE);
    
    const domainSet = this.runningByDomain.get(domain);
    if (domainSet) {
      domainSet.add(task.id);
    }
    
    if (task.lock_key) {
      this.runningLockKeys.add(task.lock_key);
    }
    
    console.log(`[Scheduler] Task ${task.id} marked running in domain ${domain} (lock_key: ${task.lock_key || 'none'})`);
  }

  /**
   * 标记任务完成
   * @param {Object} task - 任务对象
   */
  markFinished(task) {
    const domain = task.access_mode === AccessMode.READ ? TaskDomain.READONLY : (task.domain || TaskDomain.CODE);
    
    const domainSet = this.runningByDomain.get(domain);
    if (domainSet) {
      domainSet.delete(task.id);
    }
    
    if (task.lock_key) {
      this.runningLockKeys.delete(task.lock_key);
    }
    
    console.log(`[Scheduler] Task ${task.id} finished in domain ${domain}`);
  }

  /**
   * 获取某领域运行中的任务数
   * @param {string} domain - 领域
   * @returns {number}
   */
  getRunningCount(domain) {
    return this.runningByDomain.get(domain)?.size || 0;
  }

  /**
   * 获取所有运行中的任务 ID
   * @returns {string[]}
   */
  getAllRunningIds() {
    const ids = [];
    for (const set of this.runningByDomain.values()) {
      ids.push(...set);
    }
    return ids;
  }

  /**
   * 获取调度器状态
   * @returns {Object}
   */
  getStatus() {
    const status = {
      running_by_domain: {},
      running_lock_keys: [...this.runningLockKeys],
      total_running: 0,
    };
    
    for (const [domain, set] of this.runningByDomain) {
      status.running_by_domain[domain] = {
        count: set.size,
        max: this.maxConcurrentByDomain[domain],
        tasks: [...set],
      };
      status.total_running += set.size;
    }
    
    return status;
  }

  /**
   * 重置调度器状态
   */
  reset() {
    for (const set of this.runningByDomain.values()) {
      set.clear();
    }
    this.runningLockKeys.clear();
    console.log('[Scheduler] Reset');
  }
}

/**
 * 创建调度器实例
 * @param {Object} options - 配置选项
 * @returns {ParallelScheduler}
 */
export function createScheduler(options) {
  return new ParallelScheduler(options);
}

export default ParallelScheduler;
