// ============================================================================
// C0 序章测试聚合文件
// ============================================================================
// 生成时间: 2026-01-21
// 包含 Zone: C0-Z1, C0-Z2, C0-Z3, C0-Z4
// ============================================================================

// 导入各 Zone 测试
const C0_Z1 = require('./C0-Z1.test.js');
const C0_Z2 = require('./C0-Z2.test.js');
const C0_Z3 = require('./C0-Z3.test.js');
const C0_Z4 = require('./C0-Z4.test.js');

// ============================================
// 章节配置
// ============================================
const CHAPTER_ID = 'C0';
const CHAPTER_NAME = '序章';
const CHAPTER_DESCRIPTION = '岑回的第一天，从宿舍到维修局报到';

// ============================================
// Zone 列表
// ============================================
const ZONES = [
  { id: 'C0-Z1', name: '宿舍走廊', tests: C0_Z1.TESTS, stats: C0_Z1.ZONE_STATS },
  { id: 'C0-Z2', name: '早餐小店', tests: C0_Z2.TESTS, stats: C0_Z2.ZONE_STATS },
  { id: 'C0-Z3', name: '薄墙巷口', tests: C0_Z3.TESTS, stats: C0_Z3.ZONE_STATS },
  { id: 'C0-Z4', name: '维修局前台', tests: C0_Z4.TESTS, stats: C0_Z4.ZONE_STATS },
];

// ============================================
// 所有测试用例
// ============================================
const ALL_TESTS = [
  ...C0_Z1.TESTS,
  ...C0_Z2.TESTS,
  ...C0_Z3.TESTS,
  ...C0_Z4.TESTS,
];

// ============================================
// 章节统计
// ============================================
const CHAPTER_STATS = {
  chapterId: CHAPTER_ID,
  chapterName: CHAPTER_NAME,
  totalZones: ZONES.length,
  totalTests: ALL_TESTS.length,
  objectsCovered: [...new Set(ALL_TESTS.map(t => t.objectId))],
  cardsCovered: [...new Set(ALL_TESTS.flatMap(t => t.expectedResults.cards || []))],
  flagsCovered: [...new Set(ALL_TESTS.flatMap(t => Object.keys(t.expectedResults.flags || {})))],
  foreshadowsCovered: ALL_TESTS.filter(t => t.expectedResults.foreshadow).map(t => t.expectedResults.foreshadow.id),
  totalRPoints: ALL_TESTS.reduce((sum, t) => sum + (t.expectedResults.rDelta || 0), 0),
  branchCount: ALL_TESTS.filter(t => t.branch).length,
  zoneBreakdown: ZONES.map(z => ({
    id: z.id,
    name: z.name,
    tests: z.tests.length,
    objects: z.stats.objectsCovered.length,
  })),
};

// ============================================
// 运行辅助函数
// ============================================

/**
 * 获取指定 Zone 的测试
 * @param {string} zoneId Zone ID (如 'C0-Z1')
 * @returns {Array} 测试用例数组
 */
function getZoneTests(zoneId) {
  const zone = ZONES.find(z => z.id === zoneId);
  return zone ? zone.tests : [];
}

/**
 * 获取指定测试用例
 * @param {string} testId 测试用例 ID (如 'TC-C0Z1-01')
 * @returns {Object|null} 测试用例
 */
function getTestById(testId) {
  return ALL_TESTS.find(t => t.id === testId) || null;
}

/**
 * 按对象 ID 查找测试
 * @param {string} objectId 对象 ID
 * @returns {Array} 相关测试用例
 */
function getTestsByObject(objectId) {
  return ALL_TESTS.filter(t => t.objectId === objectId);
}

/**
 * 获取有条件前置的测试
 * @returns {Array} 带前置条件的测试
 */
function getConditionalTests() {
  return ALL_TESTS.filter(t => t.preconditions && t.preconditions.length > 0);
}

/**
 * 获取会影响 R 值的测试
 * @returns {Array} R 值变化的测试
 */
function getRValueTests() {
  return ALL_TESTS.filter(t => t.expectedResults.rDelta && t.expectedResults.rDelta !== 0);
}

/**
 * 获取伏笔相关测试
 * @returns {Array} 触发伏笔的测试
 */
function getForeshadowTests() {
  return ALL_TESTS.filter(t => t.expectedResults.foreshadow);
}

/**
 * 打印章节统计
 */
function printStats() {
  console.log('\n========================================');
  console.log(`  ${CHAPTER_NAME} (${CHAPTER_ID}) 测试统计`);
  console.log('========================================');
  console.log(`  Zone 数量: ${CHAPTER_STATS.totalZones}`);
  console.log(`  测试用例: ${CHAPTER_STATS.totalTests}`);
  console.log(`  交互对象: ${CHAPTER_STATS.objectsCovered.length}`);
  console.log(`  卡片覆盖: ${CHAPTER_STATS.cardsCovered.length}`);
  console.log(`  FLAG 覆盖: ${CHAPTER_STATS.flagsCovered.length}`);
  console.log(`  伏笔覆盖: ${CHAPTER_STATS.foreshadowsCovered.length}`);
  console.log(`  R 值测试点: ${CHAPTER_STATS.totalRPoints}`);
  console.log(`  分支选择: ${CHAPTER_STATS.branchCount}`);
  console.log('----------------------------------------');
  CHAPTER_STATS.zoneBreakdown.forEach(z => {
    console.log(`  ${z.id} ${z.name}: ${z.tests} 用例, ${z.objects} 对象`);
  });
  console.log('========================================\n');
}

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // 章节信息
    CHAPTER_ID,
    CHAPTER_NAME,
    CHAPTER_DESCRIPTION,
    CHAPTER_STATS,
    
    // Zone 数据
    ZONES,
    C0_Z1,
    C0_Z2,
    C0_Z3,
    C0_Z4,
    
    // 测试数据
    ALL_TESTS,
    
    // 辅助函数
    getZoneTests,
    getTestById,
    getTestsByObject,
    getConditionalTests,
    getRValueTests,
    getForeshadowTests,
    printStats,
  };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.C0_CHAPTER = {
    CHAPTER_ID,
    CHAPTER_NAME,
    ZONES,
    ALL_TESTS,
    CHAPTER_STATS,
    getZoneTests,
    getTestById,
    printStats,
  };
}

// 加载完成提示
console.log(`[${CHAPTER_ID}] ${CHAPTER_NAME}测试聚合加载完成`);
console.log(`  - ${CHAPTER_STATS.totalZones} 个 Zone`);
console.log(`  - ${CHAPTER_STATS.totalTests} 个测试用例`);
console.log(`  - ${CHAPTER_STATS.objectsCovered.length} 个交互对象`);
