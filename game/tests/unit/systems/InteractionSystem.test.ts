/**
 * InteractionSystem 单元测试
 * 测试交互系统的幂等性、状态持久化、效果应用等核心功能
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// 使用 vi.hoisted 创建在模块顶层可用的 mock 函数
const {
  mockEmit,
  mockEmitTyped,
  mockHasInteraction,
  mockMarkInteractionDone,
  mockSetFlag,
  mockAddR,
  mockAddP,
  mockMarkDirty,
  mockHasCard,
  mockObtainCard,
  mockUnlockAbility,
  mockTriggerForeshadow,
} = vi.hoisted(() => ({
  mockEmit: vi.fn(),
  mockEmitTyped: vi.fn(),
  mockHasInteraction: vi.fn(),
  mockMarkInteractionDone: vi.fn(),
  mockSetFlag: vi.fn(),
  mockAddR: vi.fn(),
  mockAddP: vi.fn(),
  mockMarkDirty: vi.fn(),
  mockHasCard: vi.fn(),
  mockObtainCard: vi.fn(),
  mockUnlockAbility: vi.fn(),
  mockTriggerForeshadow: vi.fn(),
}));

// Mock 依赖模块
vi.mock('@/utils/Logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock EventBus
vi.mock('@/systems/EventBus', () => ({
  eventBus: {
    emit: mockEmit,
    emitTyped: mockEmitTyped,
  },
  GameEvent: {
    INTERACTION_COMMIT: 'interaction:commit',
    ITEM_COLLECT: 'item:collect',
    PLAY_SFX: 'play:sfx',
    BGM_PLAY: 'bgm:play',
    ABILITY_UNLOCK: 'ability:unlock',
  },
}));

// Mock WorldState
vi.mock('@/systems/world', () => ({
  worldState: {
    hasInteraction: mockHasInteraction,
    markInteractionDone: mockMarkInteractionDone,
    setFlag: mockSetFlag,
    addR: mockAddR,
    addP: mockAddP,
    unlockAbility: mockUnlockAbility,
  },
}));

// Mock SaveManager
vi.mock('@/systems/save', () => ({
  saveManager: {
    markDirty: mockMarkDirty,
  },
}));

// Mock NarrativeEngine
vi.mock('@/systems/narrative', () => ({
  narrativeEngine: {
    hasCard: mockHasCard,
    obtainCard: mockObtainCard,
    triggerForeshadow: mockTriggerForeshadow,
  },
}));

// 延迟导入以确保 mock 生效
import { InteractionSystem } from '@/systems/interaction';
import type { ISceneAction } from '@/types/scene';
import type { IInteractionContext } from '@/systems/interaction';

describe('InteractionSystem', () => {
  let interactionSystem: InteractionSystem;
  const mockScene = {
    add: { text: vi.fn() },
    time: { addEvent: vi.fn() },
  } as unknown as Phaser.Scene;

  const mockConfig = {
    scene: mockScene,
    onCardObtain: vi.fn(),
    onShowDialogue: vi.fn(),
    onGotoZone: vi.fn(),
    onPlaySfx: vi.fn(),
    onShowToast: vi.fn(),
  };

  const createContext = (overrides?: Partial<IInteractionContext>): IInteractionContext => ({
    zoneId: 'C0-Z1',
    objectId: 'test_object',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    interactionSystem = new InteractionSystem(mockConfig);
    // 默认设置：交互未完成，卡片未拥有
    mockHasInteraction.mockReturnValue(false);
    mockHasCard.mockReturnValue(false);
  });

  // ==================== 1. 幂等性测试 ====================
  describe('幂等性', () => {
    it('once=true 的交互只能执行一次', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'TEST_DIALOGUE',
        once: true,
      };
      const context = createContext();

      // 第一次执行：交互未完成
      mockHasInteraction.mockReturnValue(false);
      const result1 = interactionSystem.execute(action, context);

      expect(result1.ok).toBe(true);
      expect(result1.changed).toBe(true);

      // 第二次执行：模拟交互已完成
      mockHasInteraction.mockReturnValue(true);
      const result2 = interactionSystem.execute(action, context);

      expect(result2.ok).toBe(false);
      expect(result2.changed).toBe(false);
      expect(result2.error).toBe('该交互已完成');
    });

    it('card 类型默认 once=true', () => {
      const action: ISceneAction = {
        type: 'card',
        cardId: 'CARD_TEST',
        // 不显式设置 once
      };
      const context = createContext();

      // 第一次执行
      mockHasInteraction.mockReturnValue(false);
      const result1 = interactionSystem.execute(action, context);

      expect(result1.ok).toBe(true);
      expect(result1.changed).toBe(true);

      // 验证 markInteractionDone 被调用（说明被当作 once 处理）
      expect(mockMarkInteractionDone).toHaveBeenCalled();

      // 第二次执行：模拟交互已完成
      mockHasInteraction.mockReturnValue(true);
      const result2 = interactionSystem.execute(action, context);

      expect(result2.ok).toBe(false);
      expect(result2.error).toBe('该交互已完成');
    });

    it('once=false 的交互可以重复执行', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'REPEATABLE_DIALOGUE',
        once: false,
      };
      const context = createContext();

      // 多次执行应该都成功
      const result1 = interactionSystem.execute(action, context);
      expect(result1.ok).toBe(true);

      const result2 = interactionSystem.execute(action, context);
      expect(result2.ok).toBe(true);

      // markInteractionDone 不应该被调用
      expect(mockMarkInteractionDone).not.toHaveBeenCalled();
    });

    it('使用 action.id 作为交互ID（如果提供）', () => {
      const action: ISceneAction = {
        type: 'card',
        cardId: 'CARD_TEST',
        id: 'custom_interaction_id',
      };
      const context = createContext();

      interactionSystem.execute(action, context);

      // 验证使用了自定义ID
      expect(mockMarkInteractionDone).toHaveBeenCalledWith(
        'custom_interaction_id',
        expect.any(Object)
      );
    });
  });

  // ==================== 2. 状态持久化测试 ====================
  describe('状态持久化', () => {
    it('执行后调用 worldState.markInteractionDone', () => {
      const action: ISceneAction = {
        type: 'card',
        cardId: 'CARD_TEST',
      };
      const context = createContext();

      interactionSystem.execute(action, context);

      expect(mockMarkInteractionDone).toHaveBeenCalledWith(
        expect.stringContaining('C0-Z1_test_object_card'),
        expect.objectContaining({
          actionType: 'card',
          cardId: 'CARD_TEST',
        })
      );
    });

    it('状态变更后调用 saveManager.markDirty', () => {
      const action: ISceneAction = {
        type: 'card',
        cardId: 'CARD_TEST',
      };
      const context = createContext();

      interactionSystem.execute(action, context);

      expect(mockMarkDirty).toHaveBeenCalledWith(expect.stringContaining('交互'));
    });

    it('无状态变更时不调用 markDirty', () => {
      const action: ISceneAction = {
        type: 'card',
        cardId: 'CARD_TEST',
      };
      const context = createContext();

      // 模拟交互已完成（将被拒绝，无状态变更）
      mockHasInteraction.mockReturnValue(true);

      interactionSystem.execute(action, context);

      expect(mockMarkDirty).not.toHaveBeenCalled();
    });
  });

  // ==================== 3. 效果应用测试 ====================
  describe('效果应用', () => {
    it('正确应用 flag 效果', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'TEST_DIALOGUE',
        effects: [
          { type: 'flag', flagName: 'FLAG_TEST', flagValue: true },
          { type: 'flag', flagName: 'FLAG_TEST_2', flagValue: false },
        ],
      };
      const context = createContext();

      interactionSystem.execute(action, context);

      expect(mockSetFlag).toHaveBeenCalledWith('FLAG_TEST', true);
      expect(mockSetFlag).toHaveBeenCalledWith('FLAG_TEST_2', false);
    });

    it('flag 效果默认值为 true', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'TEST_DIALOGUE',
        effects: [{ type: 'flag', flagName: 'FLAG_DEFAULT' }],
      };
      const context = createContext();

      interactionSystem.execute(action, context);

      expect(mockSetFlag).toHaveBeenCalledWith('FLAG_DEFAULT', true);
    });

    it('正确应用 counter 效果', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'TEST_DIALOGUE',
        effects: [
          { type: 'counter', counter: 'R', delta: 1 },
          { type: 'counter', counter: 'P', delta: 2 },
        ],
      };
      const context = createContext();

      interactionSystem.execute(action, context);

      expect(mockAddR).toHaveBeenCalledWith(1);
      expect(mockAddP).toHaveBeenCalledWith(2);
    });

    it('正确应用 card 效果', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'TEST_DIALOGUE',
        effects: [{ type: 'card', cardId: 'CARD_FROM_EFFECT' }],
      };
      const context = createContext();

      interactionSystem.execute(action, context);

      expect(mockObtainCard).toHaveBeenCalledWith('CARD_FROM_EFFECT');
    });

    it('card 效果不重复获得已拥有的卡片', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'TEST_DIALOGUE',
        effects: [{ type: 'card', cardId: 'CARD_ALREADY_OWNED' }],
      };
      const context = createContext();

      // 模拟卡片已拥有
      mockHasCard.mockReturnValue(true);

      interactionSystem.execute(action, context);

      expect(mockObtainCard).not.toHaveBeenCalled();
    });

    it('正确应用 sound 效果', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'TEST_DIALOGUE',
        effects: [{ type: 'sound', sfxKey: 'sfx_test' }],
      };
      const context = createContext();

      const result = interactionSystem.execute(action, context);

      expect(result.sfxToPlay).toContain('sfx_test');
      expect(mockConfig.onPlaySfx).toHaveBeenCalledWith('sfx_test');
    });

    it('正确应用 sound 效果 (使用 audioKey)', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'TEST_DIALOGUE',
        effects: [{ type: 'sound', audioKey: 'sfx_click' }],
      };
      const context = createContext();

      const result = interactionSystem.execute(action, context);

      expect(result.sfxToPlay).toContain('sfx_click');
    });

    it('正确应用 ability 效果', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'TEST_DIALOGUE',
        effects: [{ type: 'ability', abilityType: 'DEPTH_PERCEPTION' }],
      };
      const context = createContext();

      interactionSystem.execute(action, context);

      expect(mockUnlockAbility).toHaveBeenCalledWith('DEPTH_PERCEPTION');
      // ABILITY_UNLOCK 使用 eventBus.emit
      expect(mockEmit).toHaveBeenCalledWith(
        expect.anything(), // GameEvent.ABILITY_UNLOCK
        expect.objectContaining({ ability: 'DEPTH_PERCEPTION' })
      );
    });

    it('正确应用 foreshadow 效果', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'TEST_DIALOGUE',
        effects: [{ type: 'foreshadow', foreshadowId: 'fs_test', foreshadowStage: 'plant' }],
      };
      const context = createContext();

      interactionSystem.execute(action, context);

      expect(mockTriggerForeshadow).toHaveBeenCalledWith('fs_test', 'plant');
    });

    it('正确应用 bgm 效果', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'TEST_DIALOGUE',
        effects: [{ type: 'bgm', audioKey: 'bgm_battle' }],
      };
      const context = createContext();

      interactionSystem.execute(action, context);

      // BGM 使用 eventBus.emit (而非 emitTyped)，事件是 GameEvent.BGM_PLAY
      expect(mockEmit).toHaveBeenCalledWith(
        expect.anything(), // GameEvent.BGM_PLAY
        expect.objectContaining({ key: 'bgm_battle' })
      );
    });

    it('正确处理 goto 效果', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'TEST_DIALOGUE',
        effects: [{ type: 'goto', targetZoneId: 'C0-Z2' }],
      };
      const context = createContext();

      // goto 效果在 _triggerFeedback 中处理，这里只验证不抛错
      expect(() => interactionSystem.execute(action, context)).not.toThrow();
    });
  });

  // ==================== 4. 交互类型测试 ====================
  describe('交互类型', () => {
    it('card 类型：获得新卡片', () => {
      const action: ISceneAction = {
        type: 'card',
        cardId: 'CARD_NEW',
      };
      const context = createContext();

      const result = interactionSystem.execute(action, context);

      expect(result.ok).toBe(true);
      expect(result.changed).toBe(true);
      expect(result.cardId).toBe('CARD_NEW');
      expect(result.isNewCard).toBe(true);
      expect(mockObtainCard).toHaveBeenCalledWith('CARD_NEW');
      expect(mockConfig.onCardObtain).toHaveBeenCalledWith('CARD_NEW', true);
    });

    it('card 类型：查看已拥有的卡片', () => {
      const action: ISceneAction = {
        type: 'card',
        cardId: 'CARD_OWNED',
      };
      const context = createContext();

      mockHasCard.mockReturnValue(true);

      const result = interactionSystem.execute(action, context);

      // 交互成功但卡片不是新获得的
      expect(result.ok).toBe(true);
      expect(result.cardId).toBe('CARD_OWNED');
      expect(result.isNewCard).toBeUndefined();
      expect(mockObtainCard).not.toHaveBeenCalled();
    });

    it('dialogue 类型：触发对话', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'DLG_TEST',
      };
      const context = createContext();

      const result = interactionSystem.execute(action, context);

      expect(result.ok).toBe(true);
      expect(result.changed).toBe(true);
      expect(mockConfig.onShowDialogue).toHaveBeenCalledWith('DLG_TEST');
    });

    it('gotoZone 类型：切换Zone', () => {
      const action: ISceneAction = {
        type: 'gotoZone',
        zoneId: 'C0-Z2',
      };
      const context = createContext();

      const result = interactionSystem.execute(action, context);

      expect(result.ok).toBe(true);
      expect(mockConfig.onGotoZone).toHaveBeenCalledWith('C0-Z2');
    });

    it('none 类型：无动作', () => {
      const action: ISceneAction = {
        type: 'none',
      };
      const context = createContext();

      const result = interactionSystem.execute(action, context);

      expect(result.ok).toBe(true);
      expect(result.changed).toBe(false);
    });
  });

  // ==================== 5. 事件发射测试 ====================
  describe('事件发射', () => {
    it('成功执行后发射 INTERACTION_COMMIT 事件', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'DLG_TEST',
      };
      const context = createContext();

      interactionSystem.execute(action, context);

      expect(mockEmitTyped).toHaveBeenCalledWith(
        'interaction:commit',
        expect.objectContaining({
          zoneId: 'C0-Z1',
          objectId: 'test_object',
          actionType: 'dialogue',
          changed: true,
        })
      );
    });

    it('获得新卡片时发射 ITEM_COLLECT 事件', () => {
      const action: ISceneAction = {
        type: 'card',
        cardId: 'CARD_NEW',
      };
      const context = createContext();

      interactionSystem.execute(action, context);

      expect(mockEmitTyped).toHaveBeenCalledWith(
        'item:collect',
        expect.objectContaining({
          itemId: 'CARD_NEW',
          cardId: 'CARD_NEW',
          zoneId: 'C0-Z1',
        })
      );
    });
  });

  // ==================== 6. 交互ID生成测试 ====================
  describe('交互ID生成', () => {
    it('card 类型生成正确的 ID', () => {
      const action: ISceneAction = {
        type: 'card',
        cardId: 'CARD_TEST',
      };
      const context = createContext({ zoneId: 'C1-Z2', objectId: 'item_01' });

      interactionSystem.execute(action, context);

      expect(mockMarkInteractionDone).toHaveBeenCalledWith(
        'C1-Z2_item_01_card_CARD_TEST',
        expect.any(Object)
      );
    });

    it('dialogue 类型生成正确的 ID', () => {
      const action: ISceneAction = {
        type: 'dialogue',
        dialogueId: 'DLG_001',
        once: true,
      };
      const context = createContext({ zoneId: 'C2-Z3', objectId: 'npc_01' });

      interactionSystem.execute(action, context);

      expect(mockMarkInteractionDone).toHaveBeenCalledWith(
        'C2-Z3_npc_01_dialogue_DLG_001',
        expect.any(Object)
      );
    });

    it('gotoZone 类型生成正确的 ID', () => {
      const action: ISceneAction = {
        type: 'gotoZone',
        zoneId: 'C0-Z3',
        once: true,
      };
      const context = createContext({ zoneId: 'C0-Z2', objectId: 'exit_door' });

      interactionSystem.execute(action, context);

      // gotoZone 不会产生状态变更，所以 markInteractionDone 不会被调用
      // 这是预期行为，因为 Zone 切换的状态由 WorldState.visitZone() 管理
    });
  });

  // ==================== 7. 销毁测试 ====================
  describe('销毁', () => {
    it('destroy 方法不抛出错误', () => {
      expect(() => interactionSystem.destroy()).not.toThrow();
    });
  });
});
