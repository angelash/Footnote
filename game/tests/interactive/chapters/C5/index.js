// ============================================================================
// C5 第五章测试索引
// ============================================================================

const C5Z1 = require('./C5-Z1.test.js');
const C5Z2 = require('./C5-Z2.test.js');
const C5Z3 = require('./C5-Z3.test.js');
const C5Z4 = require('./C5-Z4.test.js');
const C5Z5 = require('./C5-Z5.test.js');
const C5Z6 = require('./C5-Z6.test.js');
const C5Z7 = require('./C5-Z7.test.js');

const CHAPTER_ID = 'C5';
const CHAPTER_NAME = '第五章：版本冲突';

const ZONES = [C5Z1, C5Z2, C5Z3, C5Z4, C5Z5, C5Z6, C5Z7];

const ALL_TESTS = ZONES.flatMap(zone => zone.TESTS);

const CHAPTER_STATS = {
  chapterId: CHAPTER_ID,
  chapterName: CHAPTER_NAME,
  totalZones: ZONES.length,
  totalTests: ALL_TESTS.length,
  criticalTests: ALL_TESTS.filter(t => t.critical).length,
  keyForeshadows: ['F21', 'F23'],
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
