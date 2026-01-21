// ============================================================================
// C4 Chapter Index - 第四章测试索引
// ============================================================================
// 生成时间: 2026-01-21
// 章节主题: 时间干预解锁与初次使用
// ============================================================================

const C4_Z1 = require('./C4-Z1.test.js');
const C4_Z2 = require('./C4-Z2.test.js');
const C4_Z3 = require('./C4-Z3.test.js');
const C4_Z4 = require('./C4-Z4.test.js');
const C4_Z5 = require('./C4-Z5.test.js');
const C4_Z6 = require('./C4-Z6.test.js');
const C4_Z7 = require('./C4-Z7.test.js');
const C4_Z8 = require('./C4-Z8.test.js');

// ============================================
// 章节配置
// ============================================
const CHAPTER_ID = 'C4';
const CHAPTER_NAME = '第四章：时间干预';
const CHAPTER_THEME = '解锁时间干预能力，首次强制回溯事件';

// ============================================
// 所有 Zone 测试
// ============================================
const ZONES = [
  C4_Z1,
  C4_Z2,
  C4_Z3,
  C4_Z4,
  C4_Z5,
  C4_Z6,
  C4_Z7,
  C4_Z8,
];

// ============================================
// 章节统计
// ============================================
const CHAPTER_STATS = {
  chapterId: CHAPTER_ID,
  chapterName: CHAPTER_NAME,
  chapterTheme: CHAPTER_THEME,
  totalZones: ZONES.length,
  totalTests: ZONES.reduce((sum, z) => sum + z.ZONE_STATS.totalTests, 0),
  totalObjects: [...new Set(ZONES.flatMap(z => z.ZONE_STATS.objectsCovered))].length,
  totalCards: [...new Set(ZONES.flatMap(z => z.ZONE_STATS.cardsCovered))].length,
  totalFlags: [...new Set(ZONES.flatMap(z => z.ZONE_STATS.flagsCovered))].length,
  totalRPoints: ZONES.reduce((sum, z) => sum + z.ZONE_STATS.totalRPoints, 0),
  totalPPoints: ZONES.reduce((sum, z) => sum + (z.ZONE_STATS.totalPPoints || 0), 0),
  foreshadows: [...new Set(ZONES.flatMap(z => z.ZONE_STATS.foreshadowsCovered))],
  criticalTests: ZONES.flatMap(z => z.ZONE_STATS.criticalTests || []),
  abilitiesUnlocked: ['timeIntervention'],
  zoneBreakdown: ZONES.map(z => ({
    zoneId: z.ZONE_ID,
    zoneName: z.ZONE_NAME,
    testCount: z.ZONE_STATS.totalTests,
    objects: z.ZONE_STATS.objectsCovered.length,
    cards: z.ZONE_STATS.cardsCovered.length,
  })),
};

// ============================================
// 获取所有测试用例
// ============================================
function getAllTests() {
  return ZONES.flatMap(z => z.TESTS);
}

// ============================================
// 获取关键路径测试
// ============================================
function getCriticalPathTests() {
  return ZONES.flatMap(z => z.TESTS.filter(t => t.critical));
}

// ============================================
// 按 Zone 获取测试
// ============================================
function getTestsByZone(zoneId) {
  const zone = ZONES.find(z => z.ZONE_ID === zoneId);
  return zone ? zone.TESTS : [];
}

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CHAPTER_ID,
    CHAPTER_NAME,
    CHAPTER_THEME,
    ZONES,
    CHAPTER_STATS,
    getAllTests,
    getCriticalPathTests,
    getTestsByZone,
    // 单独导出每个 Zone
    C4_Z1,
    C4_Z2,
    C4_Z3,
    C4_Z4,
    C4_Z5,
    C4_Z6,
    C4_Z7,
    C4_Z8,
  };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.C4_TESTS = {
    CHAPTER_ID,
    CHAPTER_NAME,
    CHAPTER_THEME,
    ZONES,
    CHAPTER_STATS,
    getAllTests,
    getCriticalPathTests,
    getTestsByZone,
  };
}

// ============================================
// 打印章节摘要
// ============================================
console.log(`
╔════════════════════════════════════════════════════════════╗
║  ${CHAPTER_NAME} - ChromeMCP 测试套件
╠════════════════════════════════════════════════════════════╣
║  主题: ${CHAPTER_THEME}
║  
║  Zone 数量: ${CHAPTER_STATS.totalZones}
║  测试用例: ${CHAPTER_STATS.totalTests}
║  覆盖对象: ${CHAPTER_STATS.totalObjects}
║  覆盖卡片: ${CHAPTER_STATS.totalCards}
║  覆盖 FLAG: ${CHAPTER_STATS.totalFlags}
║  R 值总计: ${CHAPTER_STATS.totalRPoints}
║  P 值总计: ${CHAPTER_STATS.totalPPoints}
║  伏笔投放: ${CHAPTER_STATS.foreshadows.join(', ') || '无'}
║  关键测试: ${CHAPTER_STATS.criticalTests.length} 个
║  能力解锁: ${CHAPTER_STATS.abilitiesUnlocked.join(', ')}
╚════════════════════════════════════════════════════════════╝
`);

// Zone 明细
console.log('Zone 明细:');
CHAPTER_STATS.zoneBreakdown.forEach(z => {
  console.log(`  ${z.zoneId}: ${z.zoneName} - ${z.testCount} 测试, ${z.objects} 对象, ${z.cards} 卡片`);
});
