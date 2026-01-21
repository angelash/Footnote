// ============================================================================
// C2 第二章 ChromeMCP 测试索引
// ============================================================================
// 章节: C2 - 第二章
// 生成时间: 2026-01-21
// Zone覆盖: C2-Z1 ~ C2-Z7
// 关键事件: 深度感知能力解锁
// ============================================================================

// 导入各Zone测试
const { C2Z1_TESTS, C2Z1_STATS } = require('./C2-Z1.test.js');
const { C2Z2_TESTS, C2Z2_STATS } = require('./C2-Z2.test.js');
const { C2Z3_TESTS, C2Z3_STATS } = require('./C2-Z3.test.js');
const { C2Z4_TESTS, C2Z4_STATS } = require('./C2-Z4.test.js');
const { C2Z5_TESTS, C2Z5_STATS } = require('./C2-Z5.test.js');
const { C2Z6_TESTS, C2Z6_STATS } = require('./C2-Z6.test.js');
const { C2Z7_TESTS, C2Z7_STATS } = require('./C2-Z7.test.js');

// ============================================================================
// 聚合所有测试
// ============================================================================

const C2_ALL_TESTS = {
  'C2-Z1': C2Z1_TESTS,
  'C2-Z2': C2Z2_TESTS,
  'C2-Z3': C2Z3_TESTS,
  'C2-Z4': C2Z4_TESTS,
  'C2-Z5': C2Z5_TESTS,
  'C2-Z6': C2Z6_TESTS,
  'C2-Z7': C2Z7_TESTS
};

const C2_ALL_STATS = {
  'C2-Z1': C2Z1_STATS,
  'C2-Z2': C2Z2_STATS,
  'C2-Z3': C2Z3_STATS,
  'C2-Z4': C2Z4_STATS,
  'C2-Z5': C2Z5_STATS,
  'C2-Z6': C2Z6_STATS,
  'C2-Z7': C2Z7_STATS
};

// ============================================================================
// 章节级别统计
// ============================================================================

const C2_CHAPTER_STATS = {
  chapter: 'C2',
  chapterName: '第二章',
  totalZones: 7,
  zoneList: ['C2-Z1', 'C2-Z2', 'C2-Z3', 'C2-Z4', 'C2-Z5', 'C2-Z6', 'C2-Z7'],
  totalTests: 0,
  criticalTests: 0,
  coverage: {
    objects: [],
    flags: [],
    cards: [],
    abilities: ['depthPerception'],
    rPoints: 0,
    pPoints: 0,
    foreshadows: []
  },
  keyEvents: [
    { zone: 'C2-Z1', event: '深度感知能力解锁', critical: true },
    { zone: 'C2-Z2', event: 'F01薄墙回声伏笔回收', critical: true },
    { zone: 'C2-Z3', event: 'F12版本差异伏笔埋设', critical: false },
    { zone: 'C2-Z4', event: 'F05栖蓝路标伏笔（R+2）', critical: true },
    { zone: 'C2-Z5', event: '阿棠碎片日记（R+1）', critical: false },
    { zone: 'C2-Z6', event: 'F15祷文抄本伏笔（R+1）', critical: false },
    { zone: 'C2-Z7', event: 'C2章节完成标志', critical: true }
  ]
};

// 计算统计
(function calculateStats() {
  const allObjects = new Set();
  const allFlags = new Set();
  const allCards = new Set();
  const allForeshadows = new Set();
  let totalR = 0;
  let totalP = 0;

  for (const stats of Object.values(C2_ALL_STATS)) {
    C2_CHAPTER_STATS.totalTests += stats.totalTests;
    C2_CHAPTER_STATS.criticalTests += stats.criticalTests;

    stats.coverage.objects?.forEach(o => allObjects.add(o));
    stats.coverage.flags?.forEach(f => allFlags.add(f));
    stats.coverage.cards?.forEach(c => allCards.add(c));
    stats.coverage.foreshadows?.forEach(f => allForeshadows.add(f));
    totalR += stats.coverage.rPoints || 0;
    totalP += stats.coverage.pPoints || 0;
  }

  C2_CHAPTER_STATS.coverage.objects = Array.from(allObjects);
  C2_CHAPTER_STATS.coverage.flags = Array.from(allFlags);
  C2_CHAPTER_STATS.coverage.cards = Array.from(allCards);
  C2_CHAPTER_STATS.coverage.foreshadows = Array.from(allForeshadows);
  C2_CHAPTER_STATS.coverage.rPoints = totalR;
  C2_CHAPTER_STATS.coverage.pPoints = totalP;
})();

// ============================================================================
// 测试执行器（使用 _helpers.js）
// ============================================================================

/**
 * 执行C2章节所有测试
 * @param {object} options 测试选项
 * @returns {Promise<object>} 测试报告
 */
async function runC2Tests(options = {}) {
  const { verbose = true, dryRun = false } = options;

  console.log('\n========================================');
  console.log('  C2 第二章 测试套件');
  console.log('  Zone: C2-Z1 ~ C2-Z7');
  console.log(`  总测试用例: ${C2_CHAPTER_STATS.totalTests}`);
  console.log(`  关键测试: ${C2_CHAPTER_STATS.criticalTests}`);
  console.log('========================================\n');

  const results = [];
  const helpers = typeof window !== 'undefined' ? window : require('../_helpers.js');

  for (const [zoneId, zoneData] of Object.entries(C2_ALL_TESTS)) {
    if (verbose) {
      console.log(`\n=== Testing ${zoneId}: ${zoneData.zoneName} ===`);
    }

    // 传送到Zone
    helpers.teleport(zoneId);
    await helpers.wait(2000);

    for (const test of zoneData.tests) {
      const result = await helpers.executeTest(test, { dryRun, verbose });
      results.push(result);
      await helpers.wait(500);
    }
  }

  // 生成报告
  const report = helpers.generateReport(results);
  report.chapter = 'C2';
  report.chapterName = '第二章';

  return report;
}

/**
 * 执行指定Zone的测试
 * @param {string} zoneId Zone ID
 * @param {object} options 测试选项
 * @returns {Promise<object>} 测试报告
 */
async function runC2ZoneTests(zoneId, options = {}) {
  const zoneData = C2_ALL_TESTS[zoneId];
  if (!zoneData) {
    console.error(`Zone ${zoneId} not found in C2`);
    return null;
  }

  const helpers = typeof window !== 'undefined' ? window : require('../_helpers.js');
  return helpers.runZoneTests(zoneData.tests, options);
}

// ============================================================================
// 导出
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // 聚合数据
    C2_ALL_TESTS,
    C2_ALL_STATS,
    C2_CHAPTER_STATS,
    // 各Zone数据
    C2Z1_TESTS, C2Z1_STATS,
    C2Z2_TESTS, C2Z2_STATS,
    C2Z3_TESTS, C2Z3_STATS,
    C2Z4_TESTS, C2Z4_STATS,
    C2Z5_TESTS, C2Z5_STATS,
    C2Z6_TESTS, C2Z6_STATS,
    C2Z7_TESTS, C2Z7_STATS,
    // 执行器
    runC2Tests,
    runC2ZoneTests
  };
}

if (typeof window !== 'undefined') {
  window.C2_ALL_TESTS = C2_ALL_TESTS;
  window.C2_ALL_STATS = C2_ALL_STATS;
  window.C2_CHAPTER_STATS = C2_CHAPTER_STATS;
  window.runC2Tests = runC2Tests;
  window.runC2ZoneTests = runC2ZoneTests;
}

// ============================================================================
// 加载信息
// ============================================================================

console.log('\n========================================');
console.log('  C2 第二章 测试套件加载完成');
console.log('========================================');
console.log(`  Zone数量: ${C2_CHAPTER_STATS.totalZones}`);
console.log(`  测试用例: ${C2_CHAPTER_STATS.totalTests}`);
console.log(`  关键测试: ${C2_CHAPTER_STATS.criticalTests}`);
console.log(`  能力解锁: depthPerception`);
console.log(`  R值测试点: ${C2_CHAPTER_STATS.coverage.rPoints}`);
console.log(`  P值测试点: ${C2_CHAPTER_STATS.coverage.pPoints}`);
console.log(`  伏笔覆盖: ${C2_CHAPTER_STATS.coverage.foreshadows.join(', ')}`);
console.log(`  卡片覆盖: ${C2_CHAPTER_STATS.coverage.cards.join(', ')}`);
console.log('========================================\n');

/*
使用示例:

// 在浏览器控制台或 ChromeMCP 中:

// 1. 执行C2全部测试
await runC2Tests();

// 2. 执行单个Zone测试
await runC2ZoneTests('C2-Z1');

// 3. 干跑模式
await runC2Tests({ dryRun: true });

// 4. 静默模式
await runC2Tests({ verbose: false });

// 5. 查看统计
console.table(C2_CHAPTER_STATS);
console.table(C2_CHAPTER_STATS.keyEvents);
*/
