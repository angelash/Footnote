// ============================================================================
// Footnote C1 第一章 ChromeMCP 测试脚本索引
// ============================================================================
// 生成时间: 2026-01-21
// 章节: C1 第一章
// Zone数量: 6
// 总测试用例: 40 个
// ============================================================================

const C1Z1 = require('./C1-Z1.test.js');
const C1Z2 = require('./C1-Z2.test.js');
const C1Z3 = require('./C1-Z3.test.js');
const C1Z4 = require('./C1-Z4.test.js');
const C1Z5 = require('./C1-Z5.test.js');
const C1Z6 = require('./C1-Z6.test.js');

// ============================================================================
// 章节信息
// ============================================================================
const CHAPTER_ID = 'C1';
const CHAPTER_NAME = '第一章';
const CHAPTER_DESCRIPTION = '岑回开始第一次正式巡检，遇见宋岚、许澄、阿棠、牧平等关键角色';

// ============================================================================
// Zone 列表
// ============================================================================
const ZONES = [
  { id: 'C1-Z1', name: '市政办事厅', module: C1Z1 },
  { id: 'C1-Z2', name: '错门走廊', module: C1Z2 },
  { id: 'C1-Z3', name: '档案巷口旧地图摊', module: C1Z3 },
  { id: 'C1-Z4', name: '诊疗台候诊区', module: C1Z4 },
  { id: 'C1-Z5', name: '礼堂街夜谈', module: C1Z5 },
  { id: 'C1-Z6', name: '边缘断口：小坍塌现场', module: C1Z6 },
];

// ============================================================================
// 所有测试用例
// ============================================================================
const ALL_TESTS = [
  ...C1Z1.TESTS,
  ...C1Z2.TESTS,
  ...C1Z3.TESTS,
  ...C1Z4.TESTS,
  ...C1Z5.TESTS,
  ...C1Z6.TESTS,
];

// ============================================================================
// 章节统计
// ============================================================================
const CHAPTER_STATS = {
  chapterId: CHAPTER_ID,
  chapterName: CHAPTER_NAME,
  totalZones: ZONES.length,
  totalTests: ALL_TESTS.length,
  
  // 按类型统计
  rValueTests: ALL_TESTS.filter(t => t.rValueTest).length,
  criticalTests: ALL_TESTS.filter(t => t.critical).length,
  branchTests: ALL_TESTS.filter(t => t.branch).length,
  
  // R值点位
  rValuePoints: [
    { zone: 'C1-Z1', object: 'elderly_person', action: '帮他填表', rDelta: 1 },
    { zone: 'C1-Z3', object: 'songlan', action: '我想知道哪里不对 → 好我记下来', rDelta: 1 },
    { zone: 'C1-Z5', object: 'muping', action: '你在暗示什么 → 留下听完', rDelta: 1 },
  ],
  totalRPoints: 3,
  
  // 卡片收集
  cards: [
    'CARD_C1_PERMIT',
    'CARD_C1_CORRIDOR_NOTE',
    'CARD_C1_VERSION_MAP_01',
    'CARD_C1_QUESTIONNAIRE',
    'CARD_C1_PRAYER_01',
    'CARD_C1_COLLAPSE_REPORT',
  ],
  
  // 伏笔
  foreshadows: [
    { id: 'F02', zone: 'C1-Z2', action: 'deepen' },
    { id: 'F03', zone: 'C1-Z1', action: 'deepen' },
    { id: 'F04', zone: 'C1-Z2', action: 'plant' },
    { id: 'F12', zone: 'C1-Z3', action: 'plant' },
    { id: 'F14', zone: 'C1-Z4', action: 'plant/deepen' },
    { id: 'F15', zone: 'C1-Z5', action: 'plant' },
  ],
  
  // 新角色
  newCharacters: ['宋岚', '许澄', '阿棠', '牧平'],
  
  // 章节流程
  flowPath: 'C1-Z1 → C1-Z2 → C1-Z3 → C1-Z4 → C1-Z5 → C1-Z6 → C2-Z1',
};

// ============================================================================
// 测试执行函数
// ============================================================================

/**
 * 执行 C1 全部测试
 * @param {object} context 测试上下文
 * @param {object} options 测试选项
 * @returns {Promise<object>} 测试报告
 */
async function runC1Tests(context, options = {}) {
  const { verbose = true, dryRun = false } = options;
  const report = {
    chapter: CHAPTER_ID,
    startTime: Date.now(),
    results: [],
    summary: { total: 0, passed: 0, failed: 0, skipped: 0, errors: 0 },
  };

  if (verbose) {
    console.log(`\n====== Testing ${CHAPTER_ID}: ${CHAPTER_NAME} ======`);
    console.log(`Total Zones: ${ZONES.length}`);
    console.log(`Total Tests: ${ALL_TESTS.length}`);
    console.log('');
  }

  for (const zone of ZONES) {
    if (verbose) {
      console.log(`\n--- ${zone.id}: ${zone.name} ---`);
    }

    for (const test of zone.module.TESTS) {
      if (dryRun) {
        report.results.push({ id: test.id, name: test.name, status: 'dry-run' });
        report.summary.total++;
        continue;
      }

      try {
        const result = await context.executeTest(test);
        report.results.push(result);
        report.summary.total++;
        
        if (result.status === 'passed') report.summary.passed++;
        else if (result.status === 'failed') report.summary.failed++;
        else if (result.status === 'skipped') report.summary.skipped++;
        else report.summary.errors++;

        if (verbose) {
          const icon = result.status === 'passed' ? '✅' : 
                       result.status === 'failed' ? '❌' : 
                       result.status === 'skipped' ? '⏭️' : '💥';
          console.log(`  ${icon} ${test.id}: ${test.name}`);
        }
      } catch (error) {
        report.results.push({ id: test.id, name: test.name, status: 'error', error: error.message });
        report.summary.errors++;
        if (verbose) {
          console.log(`  💥 ${test.id}: ${test.name} - ${error.message}`);
        }
      }
    }
  }

  report.endTime = Date.now();
  report.duration = report.endTime - report.startTime;

  if (verbose) {
    console.log('\n====== C1 Test Summary ======');
    console.log(`Total: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Skipped: ${report.summary.skipped}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log(`Duration: ${report.duration}ms`);
  }

  return report;
}

/**
 * 执行指定 Zone 的测试
 * @param {string} zoneId Zone ID
 * @param {object} context 测试上下文
 * @param {object} options 测试选项
 * @returns {Promise<object>} 测试报告
 */
async function runZoneTests(zoneId, context, options = {}) {
  const zone = ZONES.find(z => z.id === zoneId);
  if (!zone) {
    throw new Error(`Zone ${zoneId} not found in C1`);
  }

  const { verbose = true, dryRun = false } = options;
  const report = {
    zoneId,
    zoneName: zone.name,
    startTime: Date.now(),
    results: [],
    summary: { total: 0, passed: 0, failed: 0, skipped: 0, errors: 0 },
  };

  if (verbose) {
    console.log(`\n--- Testing ${zoneId}: ${zone.name} ---`);
  }

  for (const test of zone.module.TESTS) {
    if (dryRun) {
      report.results.push({ id: test.id, name: test.name, status: 'dry-run' });
      report.summary.total++;
      continue;
    }

    try {
      const result = await context.executeTest(test);
      report.results.push(result);
      report.summary.total++;
      
      if (result.status === 'passed') report.summary.passed++;
      else if (result.status === 'failed') report.summary.failed++;
      else if (result.status === 'skipped') report.summary.skipped++;
      else report.summary.errors++;
    } catch (error) {
      report.results.push({ id: test.id, name: test.name, status: 'error', error: error.message });
      report.summary.errors++;
    }
  }

  report.endTime = Date.now();
  report.duration = report.endTime - report.startTime;

  return report;
}

// ============================================================================
// 导出
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CHAPTER_ID,
    CHAPTER_NAME,
    CHAPTER_DESCRIPTION,
    ZONES,
    ALL_TESTS,
    CHAPTER_STATS,
    runC1Tests,
    runZoneTests,
    // 各 Zone 模块
    C1Z1,
    C1Z2,
    C1Z3,
    C1Z4,
    C1Z5,
    C1Z6,
  };
}
