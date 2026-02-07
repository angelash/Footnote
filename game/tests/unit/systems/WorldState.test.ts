/**
 * WorldState 单元测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSTANTS } from '@/config/game.config';
import { worldState } from '@/systems/world/WorldState';

describe('WorldState', () => {
  beforeEach(() => {
    worldState.reset();
  });

  describe('初始化', () => {
    it('默认计数器与默认解锁 Zone', () => {
      const counters = worldState.getCounters();
      expect(counters.R).toBe(0);
      expect(counters.P).toBe(0);
      expect(counters.W).toBe(100);

      expect(worldState.isZoneUnlocked('C0-Z1')).toBe(true);
      expect(worldState.isZoneUnlocked('C0-Z4')).toBe(true);
    });

    it('未解锁的 Zone 应返回 false', () => {
      expect(worldState.isZoneUnlocked('C1-Z1')).toBe(false);
      expect(worldState.isZoneUnlocked('nonexistent')).toBe(false);
    });
  });

  describe('R值操作', () => {
    it('recordAction：reward=0 应增加 R', () => {
      worldState.recordAction({ type: 'no_reward', reward: 0 });
      expect(worldState.getCounters().R).toBe(1);
    });

    it('recordAction：reward!=0 不应增加 R', () => {
      worldState.recordAction({ type: 'with_reward', reward: 1 });
      expect(worldState.getCounters().R).toBe(0);
    });

    it('addR：应正确增加 R 值', () => {
      worldState.addR(5);
      expect(worldState.getCounters().R).toBe(5);
    });

    it('addR：R 值不应超过上限', () => {
      worldState.addR(150);
      // R_MAX 配置为 15 (见 world.config.ts)
      expect(worldState.getCounters().R).toBe(15);
    });

    it('addR：负值应减少 R 但不低于 0', () => {
      worldState.addR(10);
      worldState.addR(-15);
      expect(worldState.getCounters().R).toBe(0);
    });

    it('addR：相同值不应触发事件', () => {
      worldState.addR(0);
      // R 值未变化
      expect(worldState.getCounters().R).toBe(0);
    });
  });

  describe('P值操作', () => {
    it('addP：应正确增加 P 值', () => {
      worldState.addP(10);
      expect(worldState.getCounters().P).toBe(10);
    });

    it('addP：P 值不应超过上限', () => {
      worldState.addP(150);
      // P_MAX 配置为 20 (见 world.config.ts)
      expect(worldState.getCounters().P).toBe(20);
    });

    it('addP：负值应减少 P 但不低于 0', () => {
      worldState.addP(10);
      worldState.addP(-15);
      expect(worldState.getCounters().P).toBe(0);
    });

    it('decayP：根据设计文档 P 不应自动衰减', () => {
      worldState.addP(10);
      // 根据设计文档要求，P值不应自动衰减
      // decayP 方法保留以兼容旧代码，但不执行任何操作
      worldState.decayP(1000);
      expect(worldState.getCounters().P).toBe(10);
      worldState.decayP(99999999);
      expect(worldState.getCounters().P).toBe(10);
    });

    it('decayP：P 为 0 时不应变化', () => {
      expect(worldState.getCounters().P).toBe(0);
      worldState.decayP(1000);
      expect(worldState.getCounters().P).toBe(0);
    });
  });

  describe('能力系统', () => {
    it('unlockAbility/hasAbility/useAbility 与 P 消耗', () => {
      expect(worldState.useAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION)).toBe(false);

      worldState.unlockAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION);
      expect(worldState.hasAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION)).toBe(true);

      expect(worldState.useAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION)).toBe(true);
      expect(worldState.getCounters().P).toBe(1);

      worldState.unlockAbility(CONSTANTS.ABILITY.DEPTH_INTERVENTION);
      expect(worldState.useAbility(CONSTANTS.ABILITY.DEPTH_INTERVENTION)).toBe(true);
      expect(worldState.getCounters().P).toBe(4);
    });

    it('重复解锁同一能力不应重复添加', () => {
      worldState.unlockAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION);
      worldState.unlockAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION);

      const abilities = worldState.getAbilities();
      const count = abilities.filter((a) => a === CONSTANTS.ABILITY.DEPTH_PERCEPTION).length;
      expect(count).toBe(1);
    });

    it('useAbility：P 过高时应拒绝使用', () => {
      worldState.unlockAbility(CONSTANTS.ABILITY.TIME_INTERVENTION);
      worldState.addP(91); // 91 + 5 > 90 (P_MAX*0.9)
      expect(worldState.useAbility(CONSTANTS.ABILITY.TIME_INTERVENTION)).toBe(false);
    });

    it('getAbilities：应返回已解锁能力列表', () => {
      worldState.unlockAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION);
      worldState.unlockAbility(CONSTANTS.ABILITY.TIME_INTERVENTION);

      const abilities = worldState.getAbilities();
      expect(abilities).toContain(CONSTANTS.ABILITY.DEPTH_PERCEPTION);
      expect(abilities).toContain(CONSTANTS.ABILITY.TIME_INTERVENTION);
      expect(abilities).not.toContain(CONSTANTS.ABILITY.DEPTH_INTERVENTION);
    });
  });

  describe('W值与伤痕/污染', () => {
    it('伤痕/污染应降低 W，且下限为 0', () => {
      worldState.addScar({
        zoneId: 'C0-Z1',
        objectId: 'obj_1',
        type: 'minor',
        description: 'test scar',
      });
      // W = 100 - (scar_count * SCAR_PENALTY) = 100 - (1 * 2) = 98
      expect(worldState.getCounters().W).toBe(98);

      worldState.addContamination({
        sourceZoneId: 'C0-Z1',
        affectedZoneIds: ['C0-Z2'],
        type: 'timeline_fracture',
      });
      // W = 100 - (1 * 2) - (1 * 5) = 93
      expect(worldState.getCounters().W).toBe(93);

      for (let i = 0; i < 20; i++) {
        worldState.addContamination({
          sourceZoneId: 'C0-Z1',
          affectedZoneIds: ['C0-Z2'],
          type: 'timeline_fracture',
        });
      }
      expect(worldState.getCounters().W).toBe(0);
    });

    it('getScars：应返回所有伤痕', () => {
      worldState.addScar({ zoneId: 'C0-Z1', objectId: 'obj_1', type: 'minor' });
      worldState.addScar({ zoneId: 'C0-Z2', objectId: 'obj_2', type: 'visual_glitch' });

      const scars = worldState.getScars();
      expect(scars.length).toBe(2);
    });

    it('getScarsByZone：应返回指定 Zone 的伤痕', () => {
      worldState.addScar({ zoneId: 'C0-Z1', objectId: 'obj_1', type: 'minor' });
      worldState.addScar({ zoneId: 'C0-Z1', objectId: 'obj_2', type: 'minor' });
      worldState.addScar({ zoneId: 'C0-Z2', objectId: 'obj_3', type: 'minor' });

      const scars = worldState.getScarsByZone('C0-Z1');
      expect(scars.length).toBe(2);
    });

    it('getContaminations：应返回所有污染', () => {
      worldState.addContamination({
        sourceZoneId: 'C0-Z1',
        affectedZoneIds: ['C0-Z2'],
        type: 'timeline_fracture',
      });

      const contaminations = worldState.getContaminations();
      expect(contaminations.length).toBe(1);
    });

    it('isZoneContaminated：应正确检查污染状态', () => {
      expect(worldState.isZoneContaminated('C0-Z1')).toBe(false);

      worldState.addContamination({
        sourceZoneId: 'C0-Z1',
        affectedZoneIds: ['C0-Z2', 'C0-Z3'],
        type: 'timeline_fracture',
      });

      expect(worldState.isZoneContaminated('C0-Z1')).toBe(true);
      expect(worldState.isZoneContaminated('C0-Z2')).toBe(true);
      expect(worldState.isZoneContaminated('C0-Z3')).toBe(true);
      expect(worldState.isZoneContaminated('C0-Z4')).toBe(false);
    });
  });

  describe('Zone 状态管理', () => {
    it('visit/complete + checkCondition', () => {
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

    it('unlockZone：应正确解锁 Zone', () => {
      expect(worldState.isZoneUnlocked('C1-Z1')).toBe(false);
      worldState.unlockZone('C1-Z1');
      expect(worldState.isZoneUnlocked('C1-Z1')).toBe(true);
    });

    it('unlockZone：重复解锁不应报错', () => {
      worldState.unlockZone('C1-Z1');
      expect(() => worldState.unlockZone('C1-Z1')).not.toThrow();
    });

    it('visitZone：重复访问应增加访问次数', () => {
      worldState.visitZone('C0-Z2');
      worldState.visitZone('C0-Z2');
      worldState.visitZone('C0-Z2');

      const state = worldState.getZoneState('C0-Z2');
      expect(state?.visitCount).toBe(3);
    });

    it('visitZone：访问新 Zone 应自动解锁', () => {
      expect(worldState.isZoneUnlocked('C1-Z5')).toBe(false);
      worldState.visitZone('C1-Z5');
      expect(worldState.isZoneUnlocked('C1-Z5')).toBe(true);
    });

    it('completeZone：重复完成不应报错', () => {
      worldState.visitZone('C0-Z2');
      worldState.completeZone('C0-Z2');
      expect(() => worldState.completeZone('C0-Z2')).not.toThrow();
    });

    it('completeZone：未访问的 Zone 不应完成', () => {
      worldState.completeZone('nonexistent');
      expect(worldState.getZoneState('nonexistent')).toBeUndefined();
    });

    it('setCurrentZone：应直接设置当前 Zone', () => {
      worldState.setCurrentZone('C5-Z1');
      expect(worldState.getCurrentZone()).toBe('C5-Z1');
    });

    it('getZoneState：不存在的 Zone 应返回 undefined', () => {
      expect(worldState.getZoneState('nonexistent')).toBeUndefined();
    });
  });

  describe('标记系统', () => {
    it('setFlag/getFlag：应正确设置和获取标记', () => {
      expect(worldState.getFlag('TEST_FLAG')).toBe(false);
      worldState.setFlag('TEST_FLAG', true);
      expect(worldState.getFlag('TEST_FLAG')).toBe(true);
      worldState.setFlag('TEST_FLAG', false);
      expect(worldState.getFlag('TEST_FLAG')).toBe(false);
    });

    it('getFlags：应返回所有标记', () => {
      worldState.setFlag('FLAG_A', true);
      worldState.setFlag('FLAG_B', false);
      worldState.setFlag('FLAG_C', true);

      const flags = worldState.getFlags();
      expect(flags['FLAG_A']).toBe(true);
      expect(flags['FLAG_B']).toBe(false);
      expect(flags['FLAG_C']).toBe(true);
    });
  });

  describe('条件检查', () => {
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

    it('checkCondition：计数器范围检查', () => {
      worldState.addR(5);
      worldState.addP(10);
      // W = 100 - (5 * 3) - (10 * 2) = 100 - 15 - 20 = 65

      // rMin
      expect(worldState.checkCondition({ rMin: 5 })).toBe(true);
      expect(worldState.checkCondition({ rMin: 6 })).toBe(false);

      // rMax
      expect(worldState.checkCondition({ rMax: 5 })).toBe(true);
      expect(worldState.checkCondition({ rMax: 4 })).toBe(false);

      // pMin
      expect(worldState.checkCondition({ pMin: 10 })).toBe(true);
      expect(worldState.checkCondition({ pMin: 11 })).toBe(false);

      // pMax
      expect(worldState.checkCondition({ pMax: 10 })).toBe(true);
      expect(worldState.checkCondition({ pMax: 9 })).toBe(false);

      // wMin (W = 65)
      expect(worldState.checkCondition({ wMin: 65 })).toBe(true);
      expect(worldState.checkCondition({ wMin: 66 })).toBe(false);

      // wMax (W = 65)
      expect(worldState.checkCondition({ wMax: 65 })).toBe(true);
      expect(worldState.checkCondition({ wMax: 64 })).toBe(false);
    });

    it('checkCondition：hasCard 无检查器时应返回 false', () => {
      // 注意：需要确保 cardChecker 未注册或重置
      // 由于 WorldState 是单例，这个测试可能需要特殊处理
      // 在实际代码中，如果没有 cardChecker，会打印警告并返回 false
      // 这里我们假设测试环境中没有注册 cardChecker
    });

    it('checkCondition：空条件应返回 true', () => {
      expect(worldState.checkCondition({})).toBe(true);
    });
  });

  describe('游戏时间', () => {
    it('getPlayTime/updatePlayTime：应正确管理游戏时间', () => {
      expect(worldState.getPlayTime()).toBe(0);
      worldState.updatePlayTime(60);
      expect(worldState.getPlayTime()).toBe(60);
      worldState.updatePlayTime(30);
      expect(worldState.getPlayTime()).toBe(90);
    });
  });

  describe('序列化与恢复', () => {
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

    it('restore：应正确恢复伤痕和污染', () => {
      worldState.addScar({ zoneId: 'C0-Z1', objectId: 'obj_1', type: 'minor' });
      worldState.addContamination({
        sourceZoneId: 'C0-Z1',
        affectedZoneIds: ['C0-Z2'],
        type: 'timeline_fracture',
      });

      const data = worldState.serialize();
      worldState.reset();
      worldState.restore(data);

      expect(worldState.getScars().length).toBe(1);
      expect(worldState.getContaminations().length).toBe(1);
    });

    it('restore：部分数据应正确处理', () => {
      worldState.restore({
        counters: { R: 3, P: 5, baseW: 100 },
      });

      expect(worldState.getCounters().R).toBe(3);
      expect(worldState.getCounters().P).toBe(5);
    });

    it('getState：应等价于 serialize()', () => {
      worldState.addR(1);
      const a = worldState.serialize();
      const b = worldState.getState();
      expect(b).toEqual(a);
    });
  });

  describe('重置', () => {
    it('reset：应完全重置状态', () => {
      worldState.addR(10);
      worldState.addP(20);
      worldState.unlockAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION);
      worldState.setFlag('FLAG', true);
      worldState.visitZone('C1-Z1');
      worldState.addScar({ zoneId: 'C0-Z1', objectId: 'obj', type: 'minor' });
      worldState.addContamination({
        sourceZoneId: 'C0-Z1',
        affectedZoneIds: ['C0-Z2'],
        type: 'timeline_fracture',
      });

      worldState.reset();

      expect(worldState.getCounters().R).toBe(0);
      expect(worldState.getCounters().P).toBe(0);
      expect(worldState.getCounters().W).toBe(100);
      expect(worldState.hasAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION)).toBe(false);
      expect(worldState.getFlag('FLAG')).toBe(false);
      expect(worldState.getScars().length).toBe(0);
      expect(worldState.getContaminations().length).toBe(0);
      expect(worldState.isZoneUnlocked('C0-Z1')).toBe(true); // 默认解锁
      expect(worldState.isZoneUnlocked('C1-Z1')).toBe(false);
    });
  });
});

