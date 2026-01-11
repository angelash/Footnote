#!/usr/bin/env node
/**
 * score-calculator.mjs - 评分计算器
 *
 * 功能：
 * 1. 基于验证结果计算各维度评分
 * 2. 生成扣分明细和建议
 * 3. 输出总分和等级
 *
 * 用法：
 *   node score-calculator.mjs --project-root=/path/to/project [--verify-result=result.json]
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

// ============================================
// 评分配置
// ============================================

const SCORE_CONFIG = {
  weights: {
    completeness: 0.3,
    code_quality: 0.25,
    test_coverage: 0.2,
    doc_sync: 0.15,
    security: 0.1,
  },
  dimensions: {
    completeness: {
      name: '完整性',
      description: '功能是否完整实现',
      full_score: 100,
    },
    code_quality: {
      name: '代码规范性',
      description: '是否符合代码规范',
      full_score: 100,
    },
    test_coverage: {
      name: '测试覆盖',
      description: '单测/E2E 是否覆盖',
      full_score: 100,
    },
    doc_sync: {
      name: '文档同步',
      description: '实现是否与文档一致',
      full_score: 100,
    },
    security: {
      name: '安全性',
      description: '是否存在安全隐患',
      full_score: 100,
    },
  },
};

// ============================================
// 评分计算函数
// ============================================

/**
 * 计算完整性得分
 */
function calculateCompletenessScore(progress, items) {
  const deductions = [];
  let score = 100;

  // 基于总体完成度
  const overallPct = parseInt(progress.overall.pct, 10) || 0;
  if (overallPct < 50) {
    const deduct = Math.round((50 - overallPct) * 0.5);
    score -= deduct;
    deductions.push({
      reason: `总体完成度过低 (${overallPct}%)`,
      points: deduct,
      severity: 'major',
    });
  }

  // 检查 P0 任务完成情况
  const p0Stats = progress.by_priority?.P0 || { total: 0, done: 0 };
  if (p0Stats.total > 0) {
    const p0Pct = Math.round((p0Stats.done / p0Stats.total) * 100);
    if (p0Pct < 100) {
      const deduct = Math.round((100 - p0Pct) * 0.3);
      score -= deduct;
      deductions.push({
        reason: `P0 任务未全部完成 (${p0Stats.done}/${p0Stats.total})`,
        points: deduct,
        severity: 'blocker',
      });
    }
  }

  // 检查阻塞任务
  const blockedCount = progress.overall.blocked || 0;
  if (blockedCount > 0) {
    const deduct = Math.min(blockedCount * 5, 20);
    score -= deduct;
    deductions.push({
      reason: `存在 ${blockedCount} 个阻塞任务`,
      points: deduct,
      severity: 'blocker',
    });
  }

  // 检查各模块是否有重大缺失
  for (const [module, stats] of Object.entries(progress.by_module || {})) {
    if (stats.total > 0 && stats.done === 0 && ['system', 'narrative', 'ui'].includes(module)) {
      score -= 10;
      deductions.push({
        reason: `${module} 模块无完成项`,
        points: 10,
        severity: 'major',
      });
    }
  }

  return {
    dimension: 'completeness',
    dimension_name: '完整性',
    weight: SCORE_CONFIG.weights.completeness,
    score: Math.max(0, score),
    max_score: 100,
    weighted_score: Math.max(0, score) * SCORE_CONFIG.weights.completeness,
    deductions,
  };
}

/**
 * 计算代码规范性得分
 */
function calculateCodeQualityScore(gateResults) {
  const deductions = [];
  let score = 100;

  // TypeCheck
  if (!gateResults.typecheck?.ok) {
    score -= 30;
    deductions.push({
      reason: 'TypeScript 类型检查失败',
      points: 30,
      severity: 'blocker',
    });
  }

  // Lint
  const lintDetails = gateResults.lint?.details || {};
  if (lintDetails.errors > 0) {
    const deduct = Math.min(lintDetails.errors * 5, 30);
    score -= deduct;
    deductions.push({
      reason: `Lint 存在 ${lintDetails.errors} 个错误`,
      points: deduct,
      severity: 'blocker',
    });
  }

  if (lintDetails.warnings > 100) {
    score -= 15;
    deductions.push({
      reason: `Lint 警告过多 (${lintDetails.warnings}个，建议 < 100)`,
      points: 15,
      severity: 'major',
    });
  } else if (lintDetails.warnings > 50) {
    score -= 10;
    deductions.push({
      reason: `Lint 警告较多 (${lintDetails.warnings}个，建议 < 50)`,
      points: 10,
      severity: 'minor',
    });
  } else if (lintDetails.warnings > 0) {
    score -= 5;
    deductions.push({
      reason: `存在 ${lintDetails.warnings} 个 Lint 警告`,
      points: 5,
      severity: 'info',
    });
  }

  return {
    dimension: 'code_quality',
    dimension_name: '代码规范性',
    weight: SCORE_CONFIG.weights.code_quality,
    score: Math.max(0, score),
    max_score: 100,
    weighted_score: Math.max(0, score) * SCORE_CONFIG.weights.code_quality,
    deductions,
  };
}

/**
 * 计算测试覆盖得分
 */
function calculateTestCoverageScore(gateResults, verifyResults) {
  const deductions = [];
  let score = 100;

  // 测试是否通过
  if (!gateResults.test?.ok) {
    score -= 25;
    deductions.push({
      reason: '单元测试未通过',
      points: 25,
      severity: 'blocker',
    });
  }

  // 覆盖率检查（如果有数据）
  const coverageDetails = gateResults['test:coverage']?.details || {};
  const overallCoverage = coverageDetails.overall || 0;

  if (overallCoverage > 0) {
    if (overallCoverage < 30) {
      score -= 25;
      deductions.push({
        reason: `测试覆盖率过低 (${overallCoverage}%，建议 >= 60%)`,
        points: 25,
        severity: 'major',
      });
    } else if (overallCoverage < 60) {
      score -= 15;
      deductions.push({
        reason: `测试覆盖率不足 (${overallCoverage}%，建议 >= 60%)`,
        points: 15,
        severity: 'minor',
      });
    }
  }

  // E2E 测试检查
  if (!gateResults['test:e2e']?.ok) {
    score -= 15;
    deductions.push({
      reason: 'E2E 测试未通过或缺失',
      points: 15,
      severity: 'major',
    });
  }

  // 检查验证结果中的测试证据
  const itemsWithTests = verifyResults.filter((r) => r.evidence.some((e) => e.includes('test')));
  if (itemsWithTests.length === 0 && verifyResults.length > 10) {
    score -= 10;
    deductions.push({
      reason: '工作项缺少测试证据',
      points: 10,
      severity: 'minor',
    });
  }

  return {
    dimension: 'test_coverage',
    dimension_name: '测试覆盖',
    weight: SCORE_CONFIG.weights.test_coverage,
    score: Math.max(0, score),
    max_score: 100,
    weighted_score: Math.max(0, score) * SCORE_CONFIG.weights.test_coverage,
    deductions,
  };
}

/**
 * 计算文档同步得分
 */
function calculateDocSyncScore(verifyResults, items) {
  const deductions = [];
  let score = 100;

  // 检查工作项验证率
  const verifiedCount = verifyResults.filter((r) => r.verified).length;
  const totalCount = verifyResults.length;

  if (totalCount > 0) {
    const verifyRate = (verifiedCount / totalCount) * 100;
    if (verifyRate < 50) {
      score -= 20;
      deductions.push({
        reason: `工作项验证率过低 (${Math.round(verifyRate)}%，大量文档项无对应实现)`,
        points: 20,
        severity: 'major',
      });
    } else if (verifyRate < 80) {
      score -= 10;
      deductions.push({
        reason: `工作项验证率不足 (${Math.round(verifyRate)}%)`,
        points: 10,
        severity: 'minor',
      });
    }
  }

  // 检查缺失项
  const missingItems = verifyResults.filter((r) => r.missing.length > 0);
  if (missingItems.length > 5) {
    score -= 15;
    deductions.push({
      reason: `${missingItems.length} 个工作项有缺失文件`,
      points: 15,
      severity: 'major',
    });
  } else if (missingItems.length > 0) {
    score -= 5;
    deductions.push({
      reason: `${missingItems.length} 个工作项有缺失文件`,
      points: 5,
      severity: 'minor',
    });
  }

  return {
    dimension: 'doc_sync',
    dimension_name: '文档同步',
    weight: SCORE_CONFIG.weights.doc_sync,
    score: Math.max(0, score),
    max_score: 100,
    weighted_score: Math.max(0, score) * SCORE_CONFIG.weights.doc_sync,
    deductions,
  };
}

/**
 * 计算安全性得分
 */
async function calculateSecurityScore(projectRoot) {
  const deductions = [];
  let score = 100;

  // 检查 npm audit（如果可用）
  try {
    const { spawn } = await import('node:child_process');

    const auditResult = await new Promise((resolve) => {
      const proc = spawn('npm', ['audit', '--json'], {
        cwd: path.join(projectRoot, 'game'),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      });

      let stdout = '';
      proc.stdout.on('data', (d) => (stdout += d.toString()));
      proc.on('close', () => {
        try {
          const data = JSON.parse(stdout);
          resolve(data);
        } catch {
          resolve(null);
        }
      });
      proc.on('error', () => resolve(null));
    });

    if (auditResult && auditResult.metadata) {
      const vulnerabilities = auditResult.metadata.vulnerabilities || {};
      const high = vulnerabilities.high || 0;
      const critical = vulnerabilities.critical || 0;
      const moderate = vulnerabilities.moderate || 0;

      if (critical > 0) {
        score -= 30;
        deductions.push({
          reason: `存在 ${critical} 个严重安全漏洞`,
          points: 30,
          severity: 'blocker',
        });
      }

      if (high > 0) {
        const deduct = Math.min(high * 10, 20);
        score -= deduct;
        deductions.push({
          reason: `存在 ${high} 个高危安全漏洞`,
          points: deduct,
          severity: 'major',
        });
      }

      if (moderate > 3) {
        score -= 10;
        deductions.push({
          reason: `存在 ${moderate} 个中危安全漏洞`,
          points: 10,
          severity: 'minor',
        });
      }
    }
  } catch {
    // npm audit 不可用，跳过
    deductions.push({
      reason: '无法执行安全扫描',
      points: 0,
      severity: 'info',
    });
  }

  return {
    dimension: 'security',
    dimension_name: '安全性',
    weight: SCORE_CONFIG.weights.security,
    score: Math.max(0, score),
    max_score: 100,
    weighted_score: Math.max(0, score) * SCORE_CONFIG.weights.security,
    deductions,
  };
}

// ============================================
// 汇总函数
// ============================================

/**
 * 计算所有维度评分
 */
async function calculateAllScores(projectRoot, verifyResult) {
  const { verify_results = [], gate_results = {}, progress = {} } = verifyResult;

  const scores = [];

  // 1. 完整性
  scores.push(calculateCompletenessScore(progress, verify_results));

  // 2. 代码规范性
  scores.push(calculateCodeQualityScore(gate_results));

  // 3. 测试覆盖
  scores.push(calculateTestCoverageScore(gate_results, verify_results));

  // 4. 文档同步
  scores.push(calculateDocSyncScore(verify_results, []));

  // 5. 安全性
  scores.push(await calculateSecurityScore(projectRoot));

  // 计算总分
  const totalScore = Math.round(scores.reduce((sum, s) => sum + s.weighted_score, 0));

  // 计算等级
  let grade = 'F';
  if (totalScore >= 90) grade = 'A';
  else if (totalScore >= 80) grade = 'B';
  else if (totalScore >= 70) grade = 'C';
  else if (totalScore >= 60) grade = 'D';

  // 汇总所有扣分项
  const allDeductions = scores.flatMap((s) =>
    s.deductions.map((d) => ({
      ...d,
      dimension: s.dimension_name,
    }))
  );

  // 按严重程度排序
  const severityOrder = { blocker: 0, major: 1, minor: 2, info: 3 };
  allDeductions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // 生成建议
  const recommendations = generateRecommendations(scores, allDeductions);

  return {
    total_score: totalScore,
    grade,
    score_details: scores,
    all_deductions: allDeductions,
    recommendations,
    summary: {
      dimensions_count: scores.length,
      blockers_count: allDeductions.filter((d) => d.severity === 'blocker').length,
      major_count: allDeductions.filter((d) => d.severity === 'major').length,
      minor_count: allDeductions.filter((d) => d.severity === 'minor').length,
    },
  };
}

/**
 * 生成改进建议
 */
function generateRecommendations(scores, deductions) {
  const recommendations = [];

  // 基于评分生成建议
  for (const score of scores) {
    if (score.score < 60) {
      recommendations.push(`[紧急] ${score.dimension_name}评分过低 (${score.score}分)，需要重点改进`);
    } else if (score.score < 80) {
      recommendations.push(`[建议] ${score.dimension_name}评分可提升 (${score.score}分)`);
    }
  }

  // 基于扣分项生成建议
  const blockers = deductions.filter((d) => d.severity === 'blocker');
  if (blockers.length > 0) {
    recommendations.push(`[阻塞] 存在 ${blockers.length} 个阻塞问题需要优先解决`);
  }

  // 具体建议
  if (deductions.some((d) => d.reason.includes('TypeScript'))) {
    recommendations.push('修复 TypeScript 类型错误');
  }
  if (deductions.some((d) => d.reason.includes('Lint'))) {
    recommendations.push('减少 Lint 警告，建议控制在 50 个以内');
  }
  if (deductions.some((d) => d.reason.includes('覆盖率'))) {
    recommendations.push('提升测试覆盖率，目标 >= 60%');
  }
  if (deductions.some((d) => d.reason.includes('P0'))) {
    recommendations.push('优先完成所有 P0 任务');
  }

  return [...new Set(recommendations)]; // 去重
}

// ============================================
// 主函数
// ============================================

async function main() {
  const args = process.argv.slice(2);
  let projectRoot = process.cwd();
  let verifyResultFile = '';

  for (const arg of args) {
    if (arg.startsWith('--project-root=')) {
      projectRoot = arg.split('=')[1];
    } else if (arg.startsWith('--verify-result=')) {
      verifyResultFile = arg.split('=')[1];
    }
  }

  try {
    let verifyResult;

    if (verifyResultFile) {
      const content = await fs.readFile(verifyResultFile, 'utf8');
      verifyResult = JSON.parse(content);
    } else {
      // 运行完整验证流程
      const { parseAllRequirements } = await import('./parse-requirements.mjs');
      const { verifyAll } = await import('./verify-completion.mjs');

      const parseResult = await parseAllRequirements(projectRoot);
      verifyResult = await verifyAll(projectRoot, parseResult.items);
    }

    const scoreResult = await calculateAllScores(projectRoot, verifyResult);

    console.log(JSON.stringify(scoreResult, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

// 导出
export {
  calculateAllScores,
  calculateCompletenessScore,
  calculateCodeQualityScore,
  calculateTestCoverageScore,
  calculateDocSyncScore,
  calculateSecurityScore,
  generateRecommendations,
};

// CLI 运行
main();
