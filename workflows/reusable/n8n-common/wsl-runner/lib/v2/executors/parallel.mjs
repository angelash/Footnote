/**
 * Parallel Node Executor
 * 
 * 并行执行节点
 * 
 * Config:
 * - branches: 分支定义数组
 *   - id: 分支ID
 *   - nodes: 分支内的节点列表
 * - waitForAll: 是否等待所有分支完成 (默认 true)
 * - failFast: 任一分支失败时是否立即失败 (默认 false)
 * - maxConcurrency: 最大并发数 (默认无限制)
 * 
 * Output:
 * - branches: 各分支执行结果
 *   - [branchId]: { status, output, error, duration }
 * - allSucceeded: 是否所有分支都成功
 * - failedBranches: 失败的分支ID列表
 * 
 * @module lib/v2/executors/parallel
 */

import { NodeExecutor, successResult, failureResult } from '../executor-base.mjs';

/**
 * 分支执行状态
 */
const BranchStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

/**
 * Parallel 节点执行器
 */
export class ParallelExecutor extends NodeExecutor {
  constructor() {
    super('parallel');
  }

  /**
   * 执行并行分支
   * @param {Object} config - 节点配置
   * @param {Object} context - 执行上下文
   * @param {Object} options - 执行选项
   * @returns {Promise<NodeResult>}
   */
  async execute(config, context, options) {
    const {
      branches = [],
      waitForAll = true,
      failFast = false,
      maxConcurrency = 0,
    } = config;

    if (!branches || branches.length === 0) {
      return failureResult('At least one branch is required');
    }

    this.info(`Executing ${branches.length} parallel branches`, { waitForAll, failFast });

    const branchResults = {};
    const failedBranches = [];
    let cancelled = false;

    // 检查取消信号
    if (options.signal?.aborted) {
      return failureResult('Execution cancelled');
    }

    // 创建分支执行函数
    const executeBranch = async (branch) => {
      const { id, nodes, executor } = branch;
      const startTime = Date.now();

      try {
        if (cancelled) {
          branchResults[id] = {
            status: BranchStatus.CANCELLED,
            output: null,
            error: 'Branch cancelled due to failFast',
            duration: 0,
          };
          return;
        }

        this.debug(`Starting branch: ${id}`);

        // 如果提供了执行器回调，使用它执行分支节点
        // 否则，只记录分支信息（实际执行由流程运行器处理）
        let branchOutput = null;
        if (executor && typeof executor === 'function') {
          branchOutput = await executor(nodes, context, options);
        } else {
          // 标记需要执行的节点
          branchOutput = { nodes: nodes.map(n => n.id || n) };
        }

        const duration = Date.now() - startTime;
        branchResults[id] = {
          status: BranchStatus.SUCCESS,
          output: branchOutput,
          error: null,
          duration,
        };

        this.debug(`Branch completed: ${id}`, { duration });

      } catch (err) {
        const duration = Date.now() - startTime;
        branchResults[id] = {
          status: BranchStatus.FAILED,
          output: null,
          error: err.message,
          duration,
        };
        failedBranches.push(id);

        this.warn(`Branch failed: ${id}`, { error: err.message });

        if (failFast) {
          cancelled = true;
        }
      }
    };

    try {
      // 根据并发限制执行分支
      if (maxConcurrency > 0) {
        // 有限并发
        await this._executeWithConcurrency(branches, executeBranch, maxConcurrency, options);
      } else {
        // 无限制并发
        if (waitForAll) {
          await Promise.all(branches.map(executeBranch));
        } else {
          // 不等待所有分支，返回第一个完成的
          await Promise.race(branches.map(executeBranch));
        }
      }

      const allSucceeded = failedBranches.length === 0;

      this.info(`Parallel execution completed`, { 
        totalBranches: branches.length,
        succeeded: branches.length - failedBranches.length,
        failed: failedBranches.length,
      });

      // 如果有分支失败且不是 failFast，标记为部分成功
      if (failedBranches.length > 0) {
        return failureResult(`${failedBranches.length} branch(es) failed`, {
          branches: branchResults,
          allSucceeded: false,
          failedBranches,
        });
      }

      return successResult({
        branches: branchResults,
        allSucceeded: true,
        failedBranches: [],
      });

    } catch (err) {
      this.error(`Parallel execution error: ${err.message}`);
      return failureResult(`Parallel execution error: ${err.message}`, {
        branches: branchResults,
        allSucceeded: false,
        failedBranches,
      });
    }
  }

  /**
   * 有限并发执行
   */
  async _executeWithConcurrency(items, executor, maxConcurrency, options) {
    const results = [];
    const executing = new Set();

    for (const item of items) {
      if (options.signal?.aborted) {
        break;
      }

      const promise = executor(item).then(result => {
        executing.delete(promise);
        return result;
      });

      results.push(promise);
      executing.add(promise);

      if (executing.size >= maxConcurrency) {
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  }

  /**
   * 获取并行节点需要执行的分支节点
   * @param {Object} config - 节点配置
   * @returns {string[][]} 各分支的节点ID列表
   */
  getBranchNodes(config) {
    const { branches = [] } = config;
    return branches.map(b => b.nodes?.map(n => n.id || n) || []);
  }
}

/**
 * 创建 Parallel 执行器实例
 * @returns {ParallelExecutor}
 */
export function createParallelExecutor() {
  return new ParallelExecutor();
}

export default ParallelExecutor;

