/**
 * WorldState 单元测试
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { CONSTANTS } from '@/config/game.config';
import { worldState } from '@/systems/world/WorldState';

describe('WorldState', () => {
  beforeEach(() => {
    worldState.reset();
  });

  it('初始化：默认计数器与默认解锁 Zone', () => {
    const counters = worldState.getCounters();
    expect(counters.R).toBe(0);
    expect(counters.P).toBe(0);
    expect(counters.W).toBe(100);

    expect(worldState.isZoneUnlocked('C0-Z1')).toBe(true);
    expect(worldState.isZoneUnlocked('C0-Z4')).toBe(true);
  });

  it('recordAction：reward=0 应增加 R', () => {
    worldState.recordAction({ type: 'no_reward', reward: 0 });
    expect(worldState.getCounters().R).toBe(1);
  });

  it('能力：unlockAbility/hasAbility/useAbility 与 P 消耗', () => {
    expect(worldState.useAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION)).toBe(false);

    worldState.unlockAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION);
    expect(worldState.hasAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION)).toBe(true);

    expect(worldState.useAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION)).toBe(true);
    expect(worldState.getCounters().P).toBe(1);

    worldState.unlockAbility(CONSTANTS.ABILITY.DEPTH_INTERVENTION);
    expect(worldState.useAbility(CONSTANTS.ABILITY.DEPTH_INTERVENTION)).toBe(true);
    expect(worldState.getCounters().P).toBe(4);
  });

  it('P 衰减：decayP 应降低 P 且不低于 0', () => {
    worldState.addP(10);
    worldState.decayP(1000);
    expect(worldState.getCounters().P).toBeLessThan(10);
    worldState.decayP(99999999);
    expect(worldState.getCounters().P).toBeGreaterThanOrEqual(0);
  });

  it('W：伤痕/污染应降低 W，且下限为 0', () => {
    worldState.addScar({
      zoneId: 'C0-Z1',
      objectId: 'obj_1',
      type: 'minor',
      description: 'test scar',
    });
    expect(worldState.getCounters().W).toBe(95);

    worldState.addContamination({
      sourceZoneId: 'C0-Z1',
      affectedZoneIds: ['C0-Z2'],
      type: 'timeline_fracture',
    });
    expect(worldState.getCounters().W).toBe(85);

    for (let i = 0; i < 20; i++) {
      worldState.addContamination({
        sourceZoneId: 'C0-Z1',
        affectedZoneIds: ['C0-Z2'],
        type: 'timeline_fracture',
      });
    }
    expect(worldState.getCounters().W).toBe(0);
  });

  it('Zone：visit/complete + checkCondition', () => {
    expect(worldState.isZoneVisited('C0-Z2')).toBe(false);
    worldState.visitZone('C0-Z2');
    expect(worldState.isZoneVisited('C0-Z2')).toBe(true);
    expect(worldState.getCurrentZone()).toBe('C0-Z2');

    worldState.completeZone('C0-Z2');
    expect(worldState.getZoneState('C0-Z2')?.completed).toBe(true);

    worldState.setFlag('FLAG_X', true);
    worldState.unlockAbility(CONSTANTS.ABILITY.DEPTH_INTERVENTION);
    worldState.addR(2);

    expect(
      worldState.checkCondition({
        flagTrue: 'FLAG_X',
        hasAbility: CONSTANTS.ABILITY.DEPTH_INTERVENTION,
        rMin: 2,
        zoneVisited: 'C0-Z2',
        zoneCompleted: 'C0-Z2',
      })
    ).toBe(true);
    expect(worldState.checkCondition({ flagFalse: 'FLAG_X' })).toBe(false);
  });

  it('checkCondition：缺少能力/标记/访问/完成应返回 false', () => {
    // 缺少能力
    expect(
      worldState.checkCondition({
        hasAbility: CONSTANTS.ABILITY.DEPTH_PERCEPTION,
      })
    ).toBe(false);

    // flagTrue 但未设置
    expect(
      worldState.checkCondition({
        flagTrue: 'FLAG_MISSING',
      })
    ).toBe(false);

    // zoneVisited 但未访问
    worldState.unlockZone('C0-Z9');
    expect(
      worldState.checkCondition({
        zoneVisited: 'C0-Z9',
      })
    ).toBe(false);

    // zoneCompleted 但未完成
    worldState.visitZone('C0-Z9');
    expect(
      worldState.checkCondition({
        zoneCompleted: 'C0-Z9',
      })
    ).toBe(false);
  });

  it('useAbility：P 过高时应拒绝使用', () => {
    worldState.unlockAbility(CONSTANTS.ABILITY.TIME_INTERVENTION);
    worldState.addP(91); // 91 + 5 > 90 (P_MAX*0.9)
    expect(worldState.useAbility(CONSTANTS.ABILITY.TIME_INTERVENTION)).toBe(false);
  });

  it('serialize/restore：核心字段应可往返', () => {
    worldState.addR(5);
    worldState.addP(7);
    worldState.unlockAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION);
    worldState.setFlag('F', true);
    worldState.visitZone('C0-Z3');

    const data = worldState.serialize();
    worldState.reset();
    worldState.restore(data);

    expect(worldState.getCounters().R).toBe(5);
    expect(worldState.getCounters().P).toBe(7);
    expect(worldState.hasAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION)).toBe(true);
    expect(worldState.getFlag('F')).toBe(true);
    expect(worldState.getCurrentZone()).toBe('C0-Z3');
  });

  it('getState：应等价于 serialize()', () => {
    worldState.addR(1);
    const a = worldState.serialize();
    const b = worldState.getState();
    expect(b).toEqual(a);
  });
});

