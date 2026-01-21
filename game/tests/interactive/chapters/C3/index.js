// ============================================================================
// C3 第三章测试索引
// ============================================================================

const C3Z1 = require('./C3-Z1.test.js');
const C3Z2 = require('./C3-Z2.test.js');
const C3Z3 = require('./C3-Z3.test.js');
const C3Z4 = require('./C3-Z4.test.js');
const C3Z5 = require('./C3-Z5.test.js');
const C3Z6 = require('./C3-Z6.test.js');
const C3Z7 = require('./C3-Z7.test.js');

const CHAPTER_ID = 'C3';
const CHAPTER_NAME = '第三章：深度介入';

const ZONES = [C3Z1, C3Z2, C3Z3, C3Z4, C3Z5, C3Z6, C3Z7];

const ALL_TESTS = ZONES.flatMap(zone => zone.TESTS);

const CHAPTER_STATS = {
  chapterId: CHAPTER_ID,
  chapterName: CHAPTER_NAME,
  totalZones: ZONES.length,
  totalTests: ALL_TESTS.length,
  criticalTests: ALL_TESTS.filter(t => t.critical).length,
  abilityUnlock: 'depthIntervention',
  zones: ZONES.map(z => ({
    zoneId: z.ZONE_ID,
    zoneName: z.ZONE_NAME,
    testCount: z.TESTS.length
  }))
};

module.exports = {
  CHAPTER_ID,
  CHAPTER_NAME,
  ZONES,
  ALL_TESTS,
  CHAPTER_STATS
};
