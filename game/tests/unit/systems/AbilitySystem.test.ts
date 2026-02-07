/**
 * AbilitySystem 单元测试
 * 测试能力系统的激活、冷却、P值消耗等核心功能
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSTANTS } from '@/config/game.config';
import type { AbilityType } from '@/config/game.config';

// Mock worldState
const mockWorldState = {
  hasAbility: vi.fn(),
  useAbility: vi.fn(),
  addScar: vi.fn(),
  getCurrentZone: vi.fn().mockReturnValue('C0-Z1'),
  addContamination: vi.fn(),
  setFlag: vi.fn(),
  getFlag: vi.fn().mockReturnValue(false),
  addP: vi.fn(),
  addR: vi.fn(),
};

vi.mock('@/systems/world', () => ({
  worldState: mockWorldState,
}));

// Mock saveManager
const mockSaveManager = {
  getSaveList: vi.fn().mockResolvedValue([]),
  load: vi.fn().mockResolvedValue(true),
};

vi.mock('@/systems/save', () => ({
  saveManager: mockSaveManager,
}));

// Mock eventBus
const mockEventBus = {
  emit: vi.fn(),
  onTyped: vi.fn(),
};

vi.mock('@/systems/EventBus', () => ({
  eventBus: mockEventBus,
  GameEvent: {
    ABILITY_ACTIVATE: 'ABILITY_ACTIVATE',
    ABILITY_DEACTIVATE: 'ABILITY_DEACTIVATE',
    ABILITY_USE: 'ABILITY_USE',
    ABILITY_UNLOCK: 'ABILITY_UNLOCK',
  },
}));

// Mock Phaser Scene
const createMockScene = () => ({
  scale: { width: 750, height: 1334 },
  add: {
    graphics: vi.fn().mockReturnValue({
      setDepth: vi.fn().mockReturnThis(),
      fillStyle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
      strokeRoundedRect: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    }),
    rectangle: vi.fn().mockReturnValue({
      setDepth: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    }),
    container: vi.fn().mockReturnValue({
      setDepth: vi.fn().mockReturnThis(),
      add: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    }),
    text: vi.fn().mockReturnValue({
      setOrigin: vi.fn().mockReturnThis(),
      setColor: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    }),
  },
  input: {
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
  },
  time: {
    delayedCall: vi.fn().mockReturnValue({
      destroy: vi.fn(),
    }),
    addEvent: vi.fn().mockReturnValue({
      destroy: vi.fn(),
    }),
  },
  tweens: {
    add: vi.fn(),
  },
  scene: {
    start: vi.fn(),
  },
  sound: {
    add: vi.fn().mockReturnValue({
      play: vi.fn(),
      stop: vi.fn(),
    }),
  },
});

describe('AbilitySystem', () => {
  let AbilitySystem: typeof import('@/systems/ability/AbilitySystem').AbilitySystem;
  let abilitySystem: InstanceType<typeof AbilitySystem>;
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Reset mocks
    mockWorldState.hasAbility.mockReset();
    mockWorldState.useAbility.mockReset();
    mockWorldState.addScar.mockReset();
    mockWorldState.addContamination.mockReset();
    mockWorldState.getCurrentZone.mockReturnValue('C0-Z1');
    mockSaveManager.getSaveList.mockResolvedValue([]);

    // Import fresh module
    const module = await import('@/systems/ability/AbilitySystem');
    AbilitySystem = module.AbilitySystem;

    // Create mock scene and ability system
    mockScene = createMockScene();
    abilitySystem = new AbilitySystem({ scene: mockScene as unknown as Phaser.Scene });
  });

  describe('初始化', () => {
    it('应正确初始化所有能力状态', () => {
      const states = abilitySystem.getAbilityStates();

      expect(states.has('DEPTH_PERCEPTION')).toBe(true);
      expect(states.has('DEPTH_INTERVENTION')).toBe(true);
      expect(states.has('TIME_INTERVENTION')).toBe(true);

      const dpState = states.get('DEPTH_PERCEPTION' as AbilityType);
      expect(dpState?.isActive).toBe(false);
      expect(dpState?.cooldownRemaining).toBe(0);
    });
  });

  describe('能力激活', () => {
    it('未解锁能力应返回false', () => {
      mockWorldState.hasAbility.mockReturnValue(false);

      const result = abilitySystem.activateAbility('DEPTH_PERCEPTION' as AbilityType);

      expect(result).toBe(false);
      expect(mockWorldState.hasAbility).toHaveBeenCalledWith('DEPTH_PERCEPTION');
    });

    it('已解锁能力应成功激活', () => {
      mockWorldState.hasAbility.mockReturnValue(true);
      mockWorldState.useAbility.mockReturnValue(true);

      const result = abilitySystem.activateAbility('DEPTH_PERCEPTION' as AbilityType);

      expect(result).toBe(true);
      expect(mockWorldState.useAbility).toHaveBeenCalledWith('DEPTH_PERCEPTION');
      expect(abilitySystem.isAbilityActive('DEPTH_PERCEPTION' as AbilityType)).toBe(true);
    });

    it('P值过高时应返回false', () => {
      mockWorldState.hasAbility.mockReturnValue(true);
      mockWorldState.useAbility.mockReturnValue(false);

      const result = abilitySystem.activateAbility('DEPTH_PERCEPTION' as AbilityType);

      expect(result).toBe(false);
    });

    it('已激活的能力不应重复激活', () => {
      mockWorldState.hasAbility.mockReturnValue(true);
      mockWorldState.useAbility.mockReturnValue(true);

      abilitySystem.activateAbility('DEPTH_PERCEPTION' as AbilityType);
      const secondResult = abilitySystem.activateAbility('DEPTH_PERCEPTION' as AbilityType);

      expect(secondResult).toBe(false);
    });
  });

  describe('能力停用', () => {
    it('应正确停用已激活的能力', () => {
      mockWorldState.hasAbility.mockReturnValue(true);
      mockWorldState.useAbility.mockReturnValue(true);

      abilitySystem.activateAbility('DEPTH_PERCEPTION' as AbilityType);
      expect(abilitySystem.isAbilityActive('DEPTH_PERCEPTION' as AbilityType)).toBe(true);

      abilitySystem.deactivateAbility('DEPTH_PERCEPTION' as AbilityType);
      expect(abilitySystem.isAbilityActive('DEPTH_PERCEPTION' as AbilityType)).toBe(false);
    });

    it('停用未激活的能力应无效果', () => {
      // 不应抛出错误
      expect(() => {
        abilitySystem.deactivateAbility('DEPTH_PERCEPTION' as AbilityType);
      }).not.toThrow();
    });
  });

  describe('冷却时间', () => {
    it('初始冷却时间应为0', () => {
      const cooldown = abilitySystem.getCooldownRemaining('DEPTH_PERCEPTION' as AbilityType);
      expect(cooldown).toBe(0);
    });

    it('update应减少冷却时间', () => {
      // 手动设置冷却状态
      const states = abilitySystem.getAbilityStates();
      const state = states.get('DEPTH_INTERVENTION' as AbilityType);
      if (state) {
        state.cooldownRemaining = 5000;
      }

      abilitySystem.update(1000);

      const remaining = abilitySystem.getCooldownRemaining('DEPTH_INTERVENTION' as AbilityType);
      expect(remaining).toBe(4000);
    });

    it('冷却时间不应小于0', () => {
      const states = abilitySystem.getAbilityStates();
      const state = states.get('DEPTH_INTERVENTION' as AbilityType);
      if (state) {
        state.cooldownRemaining = 500;
      }

      abilitySystem.update(1000);

      const remaining = abilitySystem.getCooldownRemaining('DEPTH_INTERVENTION' as AbilityType);
      expect(remaining).toBe(0);
    });

    it('冷却中的能力不应被激活', () => {
      mockWorldState.hasAbility.mockReturnValue(true);

      // 设置冷却
      const states = abilitySystem.getAbilityStates();
      const state = states.get('DEPTH_PERCEPTION' as AbilityType);
      if (state) {
        state.cooldownRemaining = 5000;
      }

      const result = abilitySystem.activateAbility('DEPTH_PERCEPTION' as AbilityType);
      expect(result).toBe(false);
    });
  });

  describe('深度介入', () => {
    it('performIntervention应创建伤痕并停用能力', () => {
      mockWorldState.hasAbility.mockReturnValue(true);
      mockWorldState.useAbility.mockReturnValue(true);

      // 激活深度介入
      abilitySystem.activateAbility('DEPTH_INTERVENTION' as AbilityType);
      expect(abilitySystem.isAbilityActive('DEPTH_INTERVENTION' as AbilityType)).toBe(true);

      // 执行介入
      abilitySystem.performIntervention('obj_test', 'C0-Z1', 'test modification');

      expect(mockWorldState.addScar).toHaveBeenCalledWith({
        zoneId: 'C0-Z1',
        objectId: 'obj_test',
        type: 'structural_crack',
        description: 'test modification',
      });
      expect(abilitySystem.isAbilityActive('DEPTH_INTERVENTION' as AbilityType)).toBe(false);
    });

    it('未激活深度介入时performIntervention应无效', () => {
      abilitySystem.performIntervention('obj_test', 'C0-Z1', 'test');

      expect(mockWorldState.addScar).not.toHaveBeenCalled();
    });
  });

  describe('时间干预', () => {
    it('performTimeRewind应加载存档并添加污染', async () => {
      mockWorldState.hasAbility.mockReturnValue(true);
      mockWorldState.useAbility.mockReturnValue(true);

      // 激活时间干预
      abilitySystem.activateAbility('TIME_INTERVENTION' as AbilityType);
      expect(abilitySystem.isAbilityActive('TIME_INTERVENTION' as AbilityType)).toBe(true);

      // 执行回溯
      await abilitySystem.performTimeRewind('1');

      expect(mockSaveManager.load).toHaveBeenCalledWith(1);
      expect(mockWorldState.addContamination).toHaveBeenCalledWith({
        sourceZoneId: 'C0-Z1',
        affectedZoneIds: ['C0-Z1'],
        type: 'timeline_fracture',
      });
    });

    it('未激活时间干预时performTimeRewind应无效', async () => {
      await abilitySystem.performTimeRewind('1');

      expect(mockSaveManager.load).not.toHaveBeenCalled();
    });

    it('无效的节点ID应被忽略', async () => {
      mockWorldState.hasAbility.mockReturnValue(true);
      mockWorldState.useAbility.mockReturnValue(true);

      abilitySystem.activateAbility('TIME_INTERVENTION' as AbilityType);
      await abilitySystem.performTimeRewind('invalid');

      expect(mockSaveManager.load).not.toHaveBeenCalled();
    });
  });

  describe('回调', () => {
    it('激活时应调用onAbilityActivate回调', () => {
      const onActivate = vi.fn();
      abilitySystem = new AbilitySystem({
        scene: mockScene as unknown as Phaser.Scene,
        onAbilityActivate: onActivate,
      });

      mockWorldState.hasAbility.mockReturnValue(true);
      mockWorldState.useAbility.mockReturnValue(true);

      abilitySystem.activateAbility('DEPTH_PERCEPTION' as AbilityType);

      expect(onActivate).toHaveBeenCalledWith('DEPTH_PERCEPTION');
    });

    it('停用时应调用onAbilityDeactivate回调', () => {
      const onDeactivate = vi.fn();
      abilitySystem = new AbilitySystem({
        scene: mockScene as unknown as Phaser.Scene,
        onAbilityDeactivate: onDeactivate,
      });

      mockWorldState.hasAbility.mockReturnValue(true);
      mockWorldState.useAbility.mockReturnValue(true);

      abilitySystem.activateAbility('DEPTH_PERCEPTION' as AbilityType);
      abilitySystem.deactivateAbility('DEPTH_PERCEPTION' as AbilityType);

      expect(onDeactivate).toHaveBeenCalledWith('DEPTH_PERCEPTION');
    });
  });

  describe('销毁', () => {
    it('destroy应清理所有计时器', () => {
      mockWorldState.hasAbility.mockReturnValue(true);
      mockWorldState.useAbility.mockReturnValue(true);

      abilitySystem.activateAbility('DEPTH_PERCEPTION' as AbilityType);

      // 不应抛出错误
      expect(() => {
        abilitySystem.destroy();
      }).not.toThrow();
    });
  });
});
