// ============================================================================
// CF 终章测试索引
// ============================================================================

const CFZ1 = require('./CF-Z1.test.js');
const CFZ2 = require('./CF-Z2.test.js');
const CFZ3 = require('./CF-Z3.test.js');
const CFZ4 = require('./CF-Z4.test.js');
const CFZ5 = require('./CF-Z5.test.js');
const CFZ6 = require('./CF-Z6.test.js');

const CHAPTER_ID = 'CF';
const CHAPTER_NAME = '终章：字段定义';

const ZONES = [CFZ1, CFZ2, CFZ3, CFZ4, CFZ5, CFZ6];

const ALL_TESTS = ZONES.flatMap(zone => zone.TESTS);

const CHAPTER_STATS = {
  chapterId: CHAPTER_ID,
  chapterName: CHAPTER_NAME,
  totalZones: ZONES.length,
  totalTests: ALL_TESTS.length,
  criticalTests: ALL_TESTS.filter(t => t.critical).length,
  endings: ['A', 'B', 'C'],
  keyForeshadows: ['F22', 'F23'],
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
