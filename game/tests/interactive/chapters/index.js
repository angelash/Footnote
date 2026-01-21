// ============================================================================
// Footnote 全游戏测试主入口
// ============================================================================
// 生成时间: 2026-01-21
// 结构: 按章节文件夹 + 场景独立文件
// ============================================================================

const C0 = require('./C0');
const C1 = require('./C1');
const C2 = require('./C2');
const C3 = require('./C3');
const C4 = require('./C4');
const C5 = require('./C5');
const CF = require('./CF');

const helpers = require('./_helpers');

// ============================================================================
// 所有章节
// ============================================================================
const CHAPTERS = [C0, C1, C2, C3, C4, C5, CF];

// ============================================================================
// 所有测试用例
// ============================================================================
const ALL_TESTS = CHAPTERS.flatMap(chapter => chapter.ALL_TESTS);

// ============================================================================
// 全局统计
// ============================================================================
const GLOBAL_STATS = {
  totalChapters: CHAPTERS.length,
  totalZones: CHAPTERS.reduce((sum, ch) => sum + ch.CHAPTER_STATS.totalZones, 0),
  totalTests: ALL_TESTS.length,
  criticalTests: ALL_TESTS.filter(t => t.critical).length,
  branchTests: ALL_TESTS.filter(t => t.branch).length,
  
  // 按章节统计
  byChapter: CHAPTERS.map(ch => ({
    chapterId: ch.CHAPTER_ID,
    chapterName: ch.CHAPTER_NAME,
    zones: ch.CHAPTER_STATS.totalZones,
    tests: ch.CHAPTER_STATS.totalTests,
    critical: ch.CHAPTER_STATS.criticalTests
  })),
  
  // 能力解锁
  abilityUnlocks: [
    { chapter: 'C2-Z1', ability: 'depthPerception', name: '深度感知' },
    { chapter: 'C3-Z1', ability: 'depthIntervention', name: '深度介入' },
    { chapter: 'C4-Z2', ability: 'timeIntervention', name: '时间干预' }
  ],
  
  // 结局
  endings: [
    { id: 'A', name: '平面稳定', condition: 'R < 6 且 W > 60' },
    { id: 'B', name: '真实释放', condition: 'R >= 6 且 40 < W <= 60' },
    { id: 'C', name: '成为系统', condition: 'R >= 10 且 W <= 40' }
  ]
};

// ============================================================================
// 测试执行器
// ============================================================================

/**
 * 执行指定章节的所有测试
 */
async function runChapterTests(chapterId, options = {}) {
  const chapter = CHAPTERS.find(ch => ch.CHAPTER_ID === chapterId);
  if (!chapter) {
    console.error(`Chapter ${chapterId} not found`);
    return [];
  }

  console.log(`\n====== Testing ${chapter.CHAPTER_ID}: ${chapter.CHAPTER_NAME} ======`);
  console.log(`Zones: ${chapter.CHAPTER_STATS.totalZones}, Tests: ${chapter.CHAPTER_STATS.totalTests}`);

  const allResults = [];
  for (const zone of chapter.ZONES) {
    helpers.teleport(zone.ZONE_ID);
    await helpers.wait(2000);

    for (const test of zone.TESTS) {
      const result = await helpers.executeTest(test, options);
      allResults.push(result);
      await helpers.wait(500);
    }
  }

  return allResults;
}

/**
 * 执行指定 Zone 的所有测试
 */
async function runZoneTests(zoneId, options = {}) {
  for (const chapter of CHAPTERS) {
    const zone = chapter.ZONES.find(z => z.ZONE_ID === zoneId);
    if (zone) {
      console.log(`\n=== Testing ${zone.ZONE_ID}: ${zone.ZONE_NAME} ===`);
      helpers.teleport(zone.ZONE_ID);
      await helpers.wait(2000);

      const results = [];
      for (const test of zone.TESTS) {
        const result = await helpers.executeTest(test, options);
        results.push(result);
        await helpers.wait(500);
      }
      return results;
    }
  }
  
  console.error(`Zone ${zoneId} not found`);
  return [];
}

/**
 * 执行全部测试
 */
async function runAllTests(options = {}) {
  console.log('\n========================================');
  console.log('  Footnote Full Game Test Suite');
  console.log(`  Total Tests: ${ALL_TESTS.length}`);
  console.log(`  Chapters: ${CHAPTERS.length}`);
  console.log(`  Zones: ${GLOBAL_STATS.totalZones}`);
  console.log('========================================\n');

  const allResults = [];

  for (const chapter of CHAPTERS) {
    const results = await runChapterTests(chapter.CHAPTER_ID, options);
    allResults.push(...results);
  }

  // 生成报告
  const report = helpers.generateReport(allResults);
  
  return report;
}

/**
 * 执行关键测试（仅 critical: true）
 */
async function runCriticalTests(options = {}) {
  console.log('\n========================================');
  console.log('  Critical Tests Only');
  console.log(`  Total: ${GLOBAL_STATS.criticalTests}`);
  console.log('========================================\n');

  const criticalTests = ALL_TESTS.filter(t => t.critical);
  const results = [];

  for (const test of criticalTests) {
    helpers.teleport(test.zoneId);
    await helpers.wait(2000);
    const result = await helpers.executeTest(test, options);
    results.push(result);
    await helpers.wait(500);
  }

  return helpers.generateReport(results);
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  // 章节数据
  CHAPTERS,
  C0, C1, C2, C3, C4, C5, CF,
  
  // 所有测试
  ALL_TESTS,
  
  // 统计
  GLOBAL_STATS,
  
  // 辅助函数
  helpers,
  
  // 执行器
  runChapterTests,
  runZoneTests,
  runAllTests,
  runCriticalTests
};

// 浏览器环境
if (typeof window !== 'undefined') {
  window.FootnoteTests = module.exports;
}

console.log(`[Footnote Tests] 加载完成: ${GLOBAL_STATS.totalTests} 个用例, ${GLOBAL_STATS.totalZones} 个场景`);
