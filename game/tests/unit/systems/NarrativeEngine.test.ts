/**
 * NarrativeEngine 单元测试
 * 测试对话系统、卡片系统和伏笔系统
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// 重置模块以获得新的实例
const createFreshNarrativeEngine = async () => {
  // 重置模块缓存
  vi.resetModules();
  const { narrativeEngine } = await import('@/systems/narrative/NarrativeEngine');
  return narrativeEngine;
};

describe('NarrativeEngine', () => {
  describe('对话系统', () => {
    it('应该能注册和加载对话', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const dialogue = {
        id: 'test_dialogue_1',
        lines: [
          { speaker: '岑回', text: '这是第一行' },
          { speaker: '顾临', text: '这是第二行' },
        ],
      };

      engine.registerDialogue(dialogue);
      const loaded = await engine.loadDialogue('test_dialogue_1');

      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe('test_dialogue_1');
      expect(loaded?.lines.length).toBe(2);
    });

    it('应该能批量注册对话', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const dialogues = [
        { id: 'dlg_1', lines: [{ speaker: 'A', text: 'Hi' }] },
        { id: 'dlg_2', lines: [{ speaker: 'B', text: 'Hello' }] },
      ];

      engine.registerDialogues(dialogues);

      const dlg1 = await engine.loadDialogue('dlg_1');
      const dlg2 = await engine.loadDialogue('dlg_2');

      expect(dlg1?.id).toBe('dlg_1');
      expect(dlg2?.id).toBe('dlg_2');
    });

    it('加载不存在的对话应返回null', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const loaded = await engine.loadDialogue('non_existent_dialogue');
      expect(loaded).toBeNull();
    });

    it('开始对话后isDialogueActive应为true', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const dialogue = {
        id: 'active_test',
        lines: [{ speaker: 'Test', text: '测试' }],
      };

      engine.registerDialogue(dialogue);
      expect(engine.isDialogueActive()).toBe(false);

      await engine.startDialogue('active_test');
      expect(engine.isDialogueActive()).toBe(true);
    });

    it('对话推进应更新当前行', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const dialogue = {
        id: 'advance_test',
        lines: [
          { speaker: 'A', text: '第一行' },
          { speaker: 'B', text: '第二行' },
          { speaker: 'C', text: '第三行' },
        ],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('advance_test');

      let line = engine.getCurrentLine();
      expect(line?.text).toBe('第一行');

      engine.advance();
      line = engine.getCurrentLine();
      expect(line?.text).toBe('第二行');

      engine.advance();
      line = engine.getCurrentLine();
      expect(line?.text).toBe('第三行');
    });

    it('对话完成后isDialogueActive应为false', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const dialogue = {
        id: 'complete_test',
        lines: [{ speaker: 'A', text: '唯一一行' }],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('complete_test');

      expect(engine.isDialogueActive()).toBe(true);
      engine.advance(); // 推进完最后一行
      expect(engine.isDialogueActive()).toBe(false);
    });

    it('skipCurrentDialogue应立即结束对话', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const dialogue = {
        id: 'skip_test',
        lines: [
          { speaker: 'A', text: '第一行' },
          { speaker: 'B', text: '第二行' },
        ],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('skip_test');

      expect(engine.isDialogueActive()).toBe(true);
      engine.skipCurrentDialogue();
      expect(engine.isDialogueActive()).toBe(false);
    });

    it('对话回调应被正确调用', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const onAdvance = vi.fn();
      const onEnd = vi.fn();

      engine.setDialogueCallbacks({
        onAdvance,
        onEnd,
      });

      const dialogue = {
        id: 'callback_test',
        lines: [
          { speaker: 'A', text: '第一行' },
          { speaker: 'B', text: '第二行' },
        ],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('callback_test');

      expect(onAdvance).toHaveBeenCalledTimes(1); // 开始时显示第一行

      engine.advance();
      expect(onAdvance).toHaveBeenCalledTimes(2); // 推进到第二行

      engine.advance();
      expect(onEnd).toHaveBeenCalledTimes(1); // 对话结束
    });
  });

  describe('卡片系统', () => {
    it('应该能注册卡片', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const card = {
        id: 'card_001',
        name: '测试卡片',
        type: 'archive' as const,
        front: ['这是卡片正面'],
        detail: ['这是卡片内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      };

      engine.registerCard(card);
      const retrieved = engine.getCard('card_001');

      expect(retrieved).not.toBeUndefined();
      expect(retrieved?.name).toBe('测试卡片');
    });

    it('批量注册卡片应正常工作', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const cards = [
        {
          id: 'card_a',
          name: '卡片A',
          type: 'item' as const,
          front: ['正面A'],
          detail: ['内容A'],
          chapter: 'C1' as const,
          zone: 'C1-Z1',
        },
        {
          id: 'card_b',
          name: '卡片B',
          type: 'diary' as const,
          front: ['正面B'],
          detail: ['内容B'],
          chapter: 'C1' as const,
          zone: 'C1-Z2',
        },
      ];

      engine.registerCards(cards);

      expect(engine.getCard('card_a')?.name).toBe('卡片A');
      expect(engine.getCard('card_b')?.name).toBe('卡片B');
    });

    it('获得卡片应更新已获得列表', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const card = {
        id: 'obtain_card',
        name: '获得测试',
        type: 'archive' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      };

      engine.registerCard(card);

      expect(engine.hasCard('obtain_card')).toBe(false);
      expect(engine.getCardCount()).toBe(0);

      const result = engine.obtainCard('obtain_card');
      expect(result).toBe(true);
      expect(engine.hasCard('obtain_card')).toBe(true);
      expect(engine.getCardCount()).toBe(1);
    });

    it('重复获得同一卡片应返回false', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const card = {
        id: 'duplicate_card',
        name: '重复测试',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      };

      engine.registerCard(card);

      const firstObtain = engine.obtainCard('duplicate_card');
      const secondObtain = engine.obtainCard('duplicate_card');

      expect(firstObtain).toBe(true);
      expect(secondObtain).toBe(false);
      expect(engine.getCardCount()).toBe(1);
    });

    it('获得未注册的卡片应返回true（容错处理）', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      // 根据代码设计，即使卡片未注册，也会添加到已获得列表（容错处理）
      // 这允许场景配置的物品即使数据未加载也能被"获得"
      const result = engine.obtainCard('non_existent_card');
      expect(result).toBe(true);
    });

    it('getObtainedCards应返回所有已获得卡片', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const cards = [
        {
          id: 'card_x',
          name: '卡片X',
          type: 'archive' as const,
          front: ['正面X'],
          detail: ['X'],
          chapter: 'C0' as const,
          zone: 'C0-Z1',
        },
        {
          id: 'card_y',
          name: '卡片Y',
          type: 'item' as const,
          front: ['正面Y'],
          detail: ['Y'],
          chapter: 'C0' as const,
          zone: 'C0-Z1',
        },
        {
          id: 'card_z',
          name: '卡片Z',
          type: 'prayer' as const,
          front: ['正面Z'],
          detail: ['Z'],
          chapter: 'C0' as const,
          zone: 'C0-Z1',
        },
      ];

      engine.registerCards(cards);
      engine.obtainCard('card_x');
      engine.obtainCard('card_z');

      const obtained = engine.getObtainedCards();
      expect(obtained.length).toBe(2);
      expect(obtained.map((c) => c.id)).toContain('card_x');
      expect(obtained.map((c) => c.id)).toContain('card_z');
      expect(obtained.map((c) => c.id)).not.toContain('card_y');
    });

    it('getCardsByType应按类型筛选卡片', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const cards = [
        {
          id: 'archive_1',
          name: '档案1',
          type: 'archive' as const,
          front: ['正面1'],
          detail: ['1'],
          chapter: 'C0' as const,
          zone: 'C0-Z1',
        },
        {
          id: 'archive_2',
          name: '档案2',
          type: 'archive' as const,
          front: ['正面2'],
          detail: ['2'],
          chapter: 'C0' as const,
          zone: 'C0-Z1',
        },
        {
          id: 'item_1',
          name: '物品1',
          type: 'item' as const,
          front: ['正面3'],
          detail: ['3'],
          chapter: 'C0' as const,
          zone: 'C0-Z1',
        },
      ];

      engine.registerCards(cards);
      cards.forEach((c) => engine.obtainCard(c.id));

      const archives = engine.getCardsByType('archive');
      expect(archives.length).toBe(2);
      expect(archives.every((c) => c.type === 'archive')).toBe(true);
    });

    it('viewCard应标记卡片为已查看', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const card = {
        id: 'view_card',
        name: '查看测试',
        type: 'archive' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      };

      engine.registerCard(card);
      engine.obtainCard('view_card');

      expect(engine.isCardViewed('view_card')).toBe(false);
      engine.viewCard('view_card');
      expect(engine.isCardViewed('view_card')).toBe(true);
    });

    it('未获得的卡片不应被标记为已查看', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const card = {
        id: 'unobtained_card',
        name: '未获得',
        type: 'archive' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      };

      engine.registerCard(card);
      engine.viewCard('unobtained_card'); // 尝试查看未获得的卡片

      expect(engine.isCardViewed('unobtained_card')).toBe(false);
    });
  });

  describe('伏笔系统', () => {
    it('应该能注册伏笔', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const foreshadow = {
        id: 'F01',
        name: '测试伏笔',
        description: '这是一个测试伏笔',
        stages: {
          plant: { zone: 'C0-Z1', trigger: 'dialogue', description: '投放' },
          deepen: { zone: 'C1-Z1', trigger: 'interaction', description: '加深' },
          reveal: { zone: 'C2-Z1', trigger: 'event', description: '揭示' },
          collect: { zone: 'C3-Z1', trigger: 'event', description: '回收' },
        },
      };

      engine.registerForeshadow(foreshadow);
      const state = engine.getForeshadowState('F01');

      expect(state).toBeNull(); // 未触发任何阶段
    });

    it('批量注册伏笔应正常工作', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const foreshadows = [
        {
          id: 'F02',
          name: '伏笔2',
          description: '描述2',
          stages: {
            plant: { zone: 'C0-Z1', trigger: 't', description: 'd' },
            deepen: { zone: 'C1-Z1', trigger: 't', description: 'd' },
            reveal: { zone: 'C1-Z2', trigger: 't', description: 'd' },
            collect: { zone: 'C2-Z1', trigger: 't', description: 'd' },
          },
        },
        {
          id: 'F03',
          name: '伏笔3',
          description: '描述3',
          stages: {
            plant: { zone: 'C0-Z2', trigger: 't', description: 'd' },
            deepen: { zone: 'C1-Z2', trigger: 't', description: 'd' },
            reveal: { zone: 'C1-Z3', trigger: 't', description: 'd' },
            collect: { zone: 'C2-Z2', trigger: 't', description: 'd' },
          },
        },
      ];

      engine.registerForeshadows(foreshadows);

      expect(engine.canTriggerForeshadow('F02', 'plant')).toBe(true);
      expect(engine.canTriggerForeshadow('F03', 'plant')).toBe(true);
    });

    it('触发伏笔plant阶段应更新状态', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerForeshadow({
        id: 'F04',
        name: '触发测试',
        description: '测试',
        stages: {
          plant: { zone: 'C0-Z1', trigger: 't', description: 'd' },
          deepen: { zone: 'C1-Z1', trigger: 't', description: 'd' },
          reveal: { zone: 'C1-Z2', trigger: 't', description: 'd' },
          collect: { zone: 'C2-Z1', trigger: 't', description: 'd' },
        },
      });

      expect(engine.canTriggerForeshadow('F04', 'plant')).toBe(true);

      const result = engine.triggerForeshadow('F04', 'plant');
      expect(result).toBe(true);
      expect(engine.getForeshadowState('F04')).toBe('plant');
      expect(engine.canTriggerForeshadow('F04', 'plant')).toBe(false);
    });

    it('伏笔阶段必须按顺序触发', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerForeshadow({
        id: 'F05',
        name: '顺序测试',
        description: '测试',
        stages: {
          plant: { zone: 'C0-Z1', trigger: 't', description: 'd' },
          deepen: { zone: 'C1-Z1', trigger: 't', description: 'd' },
          reveal: { zone: 'C1-Z2', trigger: 't', description: 'd' },
          collect: { zone: 'C2-Z1', trigger: 't', description: 'd' },
        },
      });

      // 未plant时不能deepen
      expect(engine.canTriggerForeshadow('F05', 'deepen')).toBe(false);
      expect(engine.triggerForeshadow('F05', 'deepen')).toBe(false);

      // 未plant时不能collect
      expect(engine.canTriggerForeshadow('F05', 'collect')).toBe(false);
      expect(engine.triggerForeshadow('F05', 'collect')).toBe(false);

      // plant后可以deepen
      engine.triggerForeshadow('F05', 'plant');
      expect(engine.canTriggerForeshadow('F05', 'deepen')).toBe(true);
      expect(engine.triggerForeshadow('F05', 'deepen')).toBe(true);
      expect(engine.getForeshadowState('F05')).toBe('deepen');

      // plant后可以直接collect（跳过deepen）
      engine.registerForeshadow({
        id: 'F06',
        name: '跳过测试',
        description: '测试',
        stages: {
          plant: { zone: 'C0-Z1', trigger: 't', description: 'd' },
          deepen: { zone: 'C1-Z1', trigger: 't', description: 'd' },
          reveal: { zone: 'C1-Z2', trigger: 't', description: 'd' },
          collect: { zone: 'C2-Z1', trigger: 't', description: 'd' },
        },
      });
      engine.triggerForeshadow('F06', 'plant');
      expect(engine.canTriggerForeshadow('F06', 'collect')).toBe(true);
    });

    it('isForeshadowCollected应正确判断回收状态', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerForeshadow({
        id: 'F07',
        name: '回收测试',
        description: '测试',
        stages: {
          plant: { zone: 'C0-Z1', trigger: 't', description: 'd' },
          deepen: { zone: 'C1-Z1', trigger: 't', description: 'd' },
          reveal: { zone: 'C1-Z2', trigger: 't', description: 'd' },
          collect: { zone: 'C2-Z1', trigger: 't', description: 'd' },
        },
      });

      expect(engine.isForeshadowCollected('F07')).toBe(false);

      engine.triggerForeshadow('F07', 'plant');
      expect(engine.isForeshadowCollected('F07')).toBe(false);

      engine.triggerForeshadow('F07', 'collect');
      expect(engine.isForeshadowCollected('F07')).toBe(true);
    });

    it('触发不存在的伏笔应返回false', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const result = engine.triggerForeshadow('non_existent', 'plant');
      expect(result).toBe(false);
    });

    it('无效的伏笔阶段应被规范化为 plant', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerForeshadow({
        id: 'invalid_stage_test',
        name: '测试',
        description: '测试',
        stages: {
          plant: { zone: 'Z1', trigger: 't', description: 'd' },
          deepen: { zone: 'Z2', trigger: 't', description: 'd' },
          reveal: { zone: 'Z3', trigger: 't', description: 'd' },
        },
      });

      // 无效的 stage 会被规范化为 plant，未 plant 时可以触发
      expect(engine.canTriggerForeshadow('invalid_stage_test', 'invalid_stage' as any)).toBe(true);
      
      // plant 后无效 stage（被规范化为 plant）不能再触发
      engine.triggerForeshadow('invalid_stage_test', 'plant');
      expect(engine.canTriggerForeshadow('invalid_stage_test', 'invalid_stage' as any)).toBe(false);
    });

    it('getAllForeshadowStates应返回所有伏笔状态', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const foreshadows = [
        {
          id: 'F08',
          name: '伏笔8',
          description: '8',
          stages: {
            plant: { zone: 'Z1', trigger: 't', description: 'd' },
            deepen: { zone: 'Z2', trigger: 't', description: 'd' },
            reveal: { zone: 'Z2', trigger: 't', description: 'd' },
            collect: { zone: 'Z3', trigger: 't', description: 'd' },
          },
        },
        {
          id: 'F09',
          name: '伏笔9',
          description: '9',
          stages: {
            plant: { zone: 'Z1', trigger: 't', description: 'd' },
            deepen: { zone: 'Z2', trigger: 't', description: 'd' },
            reveal: { zone: 'Z2', trigger: 't', description: 'd' },
            collect: { zone: 'Z3', trigger: 't', description: 'd' },
          },
        },
      ];

      engine.registerForeshadows(foreshadows);
      engine.triggerForeshadow('F08', 'plant');

      const states = engine.getAllForeshadowStates();
      expect(states.size).toBe(2);
      expect(states.get('F08')?.planted).toBe(true);
      expect(states.get('F09')?.planted).toBe(false);
    });
  });

  describe('对话选项系统', () => {
    it('selectChoice应正确处理选项效果', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const dialogue = {
        id: 'choice_test',
        lines: [{ speaker: 'A', text: '请选择' }],
        choices: [
          {
            id: 'choice_1',
            text: '选项1',
            effects: {
              setFlag: { name: 'CHOICE_FLAG', value: true },
            },
          },
          {
            id: 'choice_2',
            text: '选项2',
            nextDialogueId: 'next_dialogue',
          },
        ],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('choice_test');

      // 选择选项1
      engine.selectChoice('choice_1');
      expect(engine.isDialogueActive()).toBe(false);
    });

    it('setChoiceHandler应设置选项处理器', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const handler = vi.fn();
      engine.setChoiceHandler(handler);

      const dialogue = {
        id: 'handler_test',
        lines: [{ speaker: 'A', text: '请选择' }],
        choices: [{ id: 'opt_1', text: '选项' }],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('handler_test');
      engine.selectChoice('opt_1');

      expect(handler).toHaveBeenCalledWith('opt_1');
    });

    it('isDialogueComplete应正确判断对话完成状态', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      expect(engine.isDialogueComplete()).toBe(true); // 无对话时为true

      const dialogue = {
        id: 'complete_check',
        lines: [{ speaker: 'A', text: '第一行' }, { speaker: 'B', text: '第二行' }],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('complete_check');

      expect(engine.isDialogueComplete()).toBe(false);
      engine.advance();
      expect(engine.isDialogueComplete()).toBe(false);
      engine.advance();
      expect(engine.isDialogueComplete()).toBe(true);
    });
  });

  describe('对话动作系统', () => {
    it('对话行应触发卡片获得动作', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      // 先注册卡片
      engine.registerCard({
        id: 'action_card',
        name: '测试卡片',
        type: 'archive' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });

      const dialogue = {
        id: 'action_test',
        lines: [
          {
            speaker: 'A',
            text: '获得卡片',
            action: { type: 'card' as const, cardId: 'action_card' },
          },
        ],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('action_test');

      expect(engine.hasCard('action_card')).toBe(true);
    });

    it('onComplete动作应在对话结束时执行', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'complete_card',
        name: '完成卡片',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });

      const dialogue = {
        id: 'oncomplete_test',
        lines: [{ speaker: 'A', text: '对话内容' }],
        onComplete: [{ type: 'card' as const, cardId: 'complete_card' }],
      };

      engine.registerDialogue(dialogue);
      expect(engine.hasCard('complete_card')).toBe(false);

      await engine.startDialogue('oncomplete_test');
      expect(engine.hasCard('complete_card')).toBe(false);

      engine.advance(); // 结束对话
      expect(engine.hasCard('complete_card')).toBe(true);
    });

    it('startDialogue可以直接传入对话行数组', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      await engine.startDialogue([
        { speaker: 'A', text: '直接行1' },
        { speaker: 'B', text: '直接行2' },
      ] as any);

      expect(engine.isDialogueActive()).toBe(true);
      expect(engine.getCurrentLine()?.text).toBe('直接行1');
    });

    it('startDialogue传入不存在的对话ID应不激活', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      await engine.startDialogue('nonexistent_dialogue_id');
      expect(engine.isDialogueActive()).toBe(false);
    });
  });

  describe('序列化和恢复', () => {
    it('serialize应返回完整状态', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      // 设置一些状态
      engine.registerCard({
        id: 'ser_card',
        name: '序列化卡',
        type: 'archive' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });
      engine.obtainCard('ser_card');
      engine.viewCard('ser_card');

      engine.registerForeshadow({
        id: 'ser_fore',
        name: '序列化伏笔',
        description: '描述',
        stages: {
          plant: { zone: 'Z1', trigger: 't', description: 'd' },
          deepen: { zone: 'Z2', trigger: 't', description: 'd' },
          reveal: { zone: 'Z2', trigger: 't', description: 'd' },
          collect: { zone: 'Z3', trigger: 't', description: 'd' },
        },
      });
      engine.triggerForeshadow('ser_fore', 'plant');

      const serialized = engine.serialize();

      expect(serialized.obtainedCards).toContain('ser_card');
      expect(serialized.viewedCards).toContain('ser_card');
      expect(serialized.foreshadowStates.ser_fore?.planted).toBe(true);
    });

    it('restore应正确恢复状态', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      // 注册卡片和伏笔（恢复前需要先注册）
      engine.registerCard({
        id: 'res_card',
        name: '恢复卡',
        type: 'archive' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });
      engine.registerForeshadow({
        id: 'res_fore',
        name: '恢复伏笔',
        description: '描述',
        stages: {
          plant: { zone: 'Z1', trigger: 't', description: 'd' },
          deepen: { zone: 'Z2', trigger: 't', description: 'd' },
          reveal: { zone: 'Z2', trigger: 't', description: 'd' },
          collect: { zone: 'Z3', trigger: 't', description: 'd' },
        },
      });

      // 恢复状态
      const savedState = {
        obtainedCards: ['res_card'],
        viewedCards: ['res_card'],
        foreshadowStates: {
          res_fore: {
            planted: true,
            deepened: false,
            revealed: false,
            plantedAt: 'C0-Z1',
          },
        },
        dialogueHistory: ['dlg_1', 'dlg_2'],
      };

      engine.restore(savedState);

      expect(engine.hasCard('res_card')).toBe(true);
      expect(engine.isCardViewed('res_card')).toBe(true);
      expect(engine.getForeshadowState('res_fore')).toBe('plant');
    });

    it('reset应清空所有状态', async () => {
      const engine = await createFreshNarrativeEngine();

      // 设置一些状态
      engine.registerCard({
        id: 'reset_card',
        name: '重置卡',
        type: 'archive' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });
      engine.obtainCard('reset_card');

      engine.registerForeshadow({
        id: 'reset_fore',
        name: '重置伏笔',
        description: '描述',
        stages: {
          plant: { zone: 'Z1', trigger: 't', description: 'd' },
          deepen: { zone: 'Z2', trigger: 't', description: 'd' },
          reveal: { zone: 'Z2', trigger: 't', description: 'd' },
          collect: { zone: 'Z3', trigger: 't', description: 'd' },
        },
      });
      engine.triggerForeshadow('reset_fore', 'plant');

      // 重置
      engine.reset();

      expect(engine.hasCard('reset_card')).toBe(false);
      expect(engine.getCardCount()).toBe(0);
      // 伏笔状态也应被重置
      const states = engine.getAllForeshadowStates();
      if (states.has('reset_fore')) {
        expect(states.get('reset_fore')?.planted).toBe(false);
      }
    });
  });

  describe('卡片使用系统', () => {
    it('useCard 应能使用有 use 效果的卡片', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const card = {
        id: 'usable_card',
        name: '可使用卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [
          {
            trigger: 'use' as const,
            effects: [
              { type: 'counterDelta' as const, counter: 'R', delta: 5 },
            ],
          },
        ],
      };

      engine.registerCard(card);
      engine.obtainCard('usable_card');

      const result = engine.useCard('usable_card');
      expect(result).toBe(true);
    });

    it('useCard 未获得的卡片应返回 false', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'not_obtained',
        name: '未获得卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [{ trigger: 'use' as const, effects: [] }],
      });

      expect(engine.useCard('not_obtained')).toBe(false);
    });

    it('useCard 没有 use 效果的卡片应返回 false', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'no_use_effect',
        name: '无效果卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        // 没有 gameplayFx
      });
      engine.obtainCard('no_use_effect');

      expect(engine.useCard('no_use_effect')).toBe(false);
    });

    it('isCardUsable 应正确判断卡片是否可使用', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'usable_test',
        name: '测试卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [{ trigger: 'use' as const, effects: [] }],
      });

      // 未获得时不可用
      expect(engine.isCardUsable('usable_test')).toBe(false);

      engine.obtainCard('usable_test');
      expect(engine.isCardUsable('usable_test')).toBe(true);
    });

    it('isCardUsable 对没有 use 效果的卡片返回 false', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'no_fx_card',
        name: '无效果',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });
      engine.obtainCard('no_fx_card');

      expect(engine.isCardUsable('no_fx_card')).toBe(false);
    });

    it('getCardEffectPreview 应返回效果预览文本', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'preview_card',
        name: '预览卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [
          {
            trigger: 'use' as const,
            effects: [
              { type: 'counterDelta' as const, counter: 'R', delta: 10 },
              { type: 'counterDelta' as const, counter: 'P', delta: -5 },
              { type: 'setFlag' as const, flagName: 'TEST_FLAG' },
              { type: 'giveCard' as const, cardId: 'bonus_card' },
              { type: 'unlockAbility' as const, abilityType: 'DEPTH_PERCEPTION' },
            ],
          },
        ],
      });

      const previews = engine.getCardEffectPreview('preview_card');
      expect(previews).toContain('R +10');
      expect(previews).toContain('P -5');
      expect(previews.some(p => p.includes('TEST_FLAG'))).toBe(true);
      expect(previews.some(p => p.includes('获得卡片'))).toBe(true);
      expect(previews.some(p => p.includes('解锁能力'))).toBe(true);
    });

    it('getCardEffectPreview 对没有效果的卡片返回空数组', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'empty_fx',
        name: '空效果',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });

      expect(engine.getCardEffectPreview('empty_fx')).toEqual([]);
    });

    it('getCardEffectPreview 对未注册卡片返回空数组', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      expect(engine.getCardEffectPreview('nonexistent')).toEqual([]);
    });
  });

  describe('卡片 Gameplay 效果', () => {
    it('applyCardGameplayFx 应应用 obtain 效果', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      // 注册一个嵌套卡片
      engine.registerCard({
        id: 'bonus_on_obtain',
        name: '获得时奖励',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });

      engine.registerCard({
        id: 'fx_obtain_card',
        name: '效果卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [
          {
            trigger: 'obtain' as const,
            effects: [
              { type: 'giveCard' as const, cardId: 'bonus_on_obtain' },
            ],
          },
        ],
      });

      // 获得卡片时会自动触发 obtain 效果
      engine.obtainCard('fx_obtain_card');

      expect(engine.hasCard('bonus_on_obtain')).toBe(true);
    });

    it('applyCardGameplayFx 应应用 view 效果', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'view_bonus',
        name: '查看奖励',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });

      engine.registerCard({
        id: 'fx_view_card',
        name: '查看效果卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [
          {
            trigger: 'view' as const,
            effects: [
              { type: 'giveCard' as const, cardId: 'view_bonus' },
            ],
          },
        ],
      });

      engine.obtainCard('fx_view_card');
      expect(engine.hasCard('view_bonus')).toBe(false);

      engine.viewCard('fx_view_card');
      expect(engine.hasCard('view_bonus')).toBe(true);
    });
  });

  describe('伏笔 mislead 阶段', () => {
    it('mislead 阶段应在 plant 后可触发', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerForeshadow({
        id: 'mislead_test',
        name: '误导测试',
        description: '测试误导阶段',
        stages: {
          plant: { zone: 'Z1', trigger: 't', description: 'd' },
          deepen: { zone: 'Z2', trigger: 't', description: 'd' },
          mislead: { zone: 'Z3', trigger: 't', description: 'd' },
          reveal: { zone: 'Z4', trigger: 't', description: 'd' },
          collect: { zone: 'Z5', trigger: 't', description: 'd' },
        },
      });

      // 未 plant 时不能 mislead
      expect(engine.canTriggerForeshadow('mislead_test', 'mislead')).toBe(false);

      engine.triggerForeshadow('mislead_test', 'plant');

      // plant 后可以 mislead
      expect(engine.canTriggerForeshadow('mislead_test', 'mislead')).toBe(true);
      
      const result = engine.triggerForeshadow('mislead_test', 'mislead');
      expect(result).toBe(true);
      expect(engine.getForeshadowState('mislead_test')).toBe('mislead');
    });

    it('mislead 后仍可触发 reveal', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerForeshadow({
        id: 'mislead_reveal',
        name: '误导后揭示',
        description: '测试',
        stages: {
          plant: { zone: 'Z1', trigger: 't', description: 'd' },
          deepen: { zone: 'Z2', trigger: 't', description: 'd' },
          mislead: { zone: 'Z3', trigger: 't', description: 'd' },
          reveal: { zone: 'Z4', trigger: 't', description: 'd' },
          collect: { zone: 'Z5', trigger: 't', description: 'd' },
        },
      });

      engine.triggerForeshadow('mislead_reveal', 'plant');
      engine.triggerForeshadow('mislead_reveal', 'mislead');

      // mislead 后仍可 reveal
      expect(engine.canTriggerForeshadow('mislead_reveal', 'reveal')).toBe(true);
      expect(engine.triggerForeshadow('mislead_reveal', 'reveal')).toBe(true);
      expect(engine.getForeshadowState('mislead_reveal')).toBe('reveal');
    });

    it('reveal 后不能再 mislead', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerForeshadow({
        id: 'no_mislead_after_reveal',
        name: '揭示后无法误导',
        description: '测试',
        stages: {
          plant: { zone: 'Z1', trigger: 't', description: 'd' },
          deepen: { zone: 'Z2', trigger: 't', description: 'd' },
          mislead: { zone: 'Z3', trigger: 't', description: 'd' },
          reveal: { zone: 'Z4', trigger: 't', description: 'd' },
          collect: { zone: 'Z5', trigger: 't', description: 'd' },
        },
      });

      engine.triggerForeshadow('no_mislead_after_reveal', 'plant');
      engine.triggerForeshadow('no_mislead_after_reveal', 'reveal');

      // reveal 后不能 mislead
      expect(engine.canTriggerForeshadow('no_mislead_after_reveal', 'mislead')).toBe(false);
      expect(engine.triggerForeshadow('no_mislead_after_reveal', 'mislead')).toBe(false);
    });
  });

  describe('对话条件系统', () => {
    it('选项条件 hasCard 应通过 onChoice 回调过滤', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'required_card',
        name: '必需卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });

      const dialogue = {
        id: 'cond_card_test',
        lines: [{ speaker: 'A', text: '选择' }],
        choices: [
          {
            id: 'needs_card',
            text: '需要卡片',
            condition: { hasCard: 'required_card' },
          },
          {
            id: 'no_condition',
            text: '无条件选项',
          },
        ],
      };

      let receivedChoices: any[] = [];
      engine.setDialogueCallbacks({
        onChoice: (choices) => {
          receivedChoices = choices;
        },
      });

      engine.registerDialogue(dialogue);
      await engine.startDialogue('cond_card_test');

      // 推进到选项界面
      engine.advance();

      // 未获得卡片时，有条件的选项应被过滤
      expect(receivedChoices.some(c => c.id === 'no_condition')).toBe(true);
      expect(receivedChoices.some(c => c.id === 'needs_card')).toBe(false);
    });

    it('选项条件满足时应显示', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'have_card',
        name: '已有卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });
      engine.obtainCard('have_card');

      const dialogue = {
        id: 'cond_met_test',
        lines: [{ speaker: 'A', text: '选择' }],
        choices: [
          {
            id: 'has_card',
            text: '有卡片',
            condition: { hasCard: 'have_card' },
          },
        ],
      };

      let receivedChoices: any[] = [];
      engine.setDialogueCallbacks({
        onChoice: (choices) => {
          receivedChoices = choices;
        },
      });

      engine.registerDialogue(dialogue);
      await engine.startDialogue('cond_met_test');
      engine.advance();

      // 已获得卡片，选项应显示
      expect(receivedChoices.some(c => c.id === 'has_card')).toBe(true);
    });
  });

  describe('按类型获取卡片', () => {
    it('getCardsByType 应返回指定类型的卡片', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'archive1',
        name: '档案1',
        type: 'archive' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });

      engine.registerCard({
        id: 'item1',
        name: '物品1',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });

      engine.registerCard({
        id: 'archive2',
        name: '档案2',
        type: 'archive' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      });

      engine.obtainCard('archive1');
      engine.obtainCard('item1');
      engine.obtainCard('archive2');

      const archives = engine.getCardsByType('archive');
      expect(archives.length).toBe(2);
      expect(archives.some(c => c.id === 'archive1')).toBe(true);
      expect(archives.some(c => c.id === 'archive2')).toBe(true);

      const items = engine.getCardsByType('item');
      expect(items.length).toBe(1);
      expect(items[0].id).toBe('item1');
    });
  });

  describe('对话动作类型', () => {
    it('对话行应触发 foreshadow 动作', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerForeshadow({
        id: 'action_foreshadow',
        name: '动作伏笔',
        description: '测试',
        stages: {
          plant: { zone: 'Z1', trigger: 't', description: 'd' },
          deepen: { zone: 'Z2', trigger: 't', description: 'd' },
          reveal: { zone: 'Z3', trigger: 't', description: 'd' },
          collect: { zone: 'Z4', trigger: 't', description: 'd' },
        },
      });

      const dialogue = {
        id: 'foreshadow_action',
        lines: [
          {
            speaker: 'A',
            text: '触发伏笔',
            action: { type: 'foreshadow' as const, foreshadowId: 'action_foreshadow', foreshadowStage: 'plant' },
          },
        ],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('foreshadow_action');

      expect(engine.getForeshadowState('action_foreshadow')).toBe('plant');
    });

    it('对话行应触发 flag 动作', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const { worldState: ws } = await import('@/systems/world');

      const dialogue = {
        id: 'flag_action',
        lines: [
          {
            speaker: 'A',
            text: '设置标记',
            action: { type: 'flag' as const, flagName: 'ACTION_FLAG', flagValue: true },
          },
        ],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('flag_action');

      expect(ws.getFlag('ACTION_FLAG')).toBe(true);
    });

    it('对话行应触发 ability 动作', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const { worldState: ws } = await import('@/systems/world');

      const dialogue = {
        id: 'ability_action',
        lines: [
          {
            speaker: 'A',
            text: '解锁能力',
            action: { type: 'ability' as const, abilityType: 'depthPerception' },
          },
        ],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('ability_action');

      expect(ws.hasAbility('DEPTH_PERCEPTION')).toBe(true);
    });

    it('对话行应触发 sfx 动作', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const { eventBus, GameEvent } = await import('@/systems/EventBus');
      const sfxSpy = vi.fn();
      eventBus.on(GameEvent.SFX_PLAY, sfxSpy);

      const dialogue = {
        id: 'sfx_action',
        lines: [
          {
            speaker: 'A',
            text: '播放音效',
            action: { type: 'sfx' as const, audioKey: 'click' },
          },
        ],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('sfx_action');

      expect(sfxSpy).toHaveBeenCalledWith({ key: 'click' });
    });

    it('对话行应触发 bgm 动作', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const { eventBus, GameEvent } = await import('@/systems/EventBus');
      const bgmSpy = vi.fn();
      eventBus.on(GameEvent.BGM_PLAY, bgmSpy);

      const dialogue = {
        id: 'bgm_action',
        lines: [
          {
            speaker: 'A',
            text: '播放BGM',
            action: { type: 'bgm' as const, audioKey: 'main_theme' },
          },
        ],
      };

      engine.registerDialogue(dialogue);
      await engine.startDialogue('bgm_action');

      expect(bgmSpy).toHaveBeenCalledWith({ key: 'main_theme' });
    });
  });

  describe('卡片 gameplay 效果 - unlockAbility', () => {
    it('gameplayFx unlockAbility 应解锁能力', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const { worldState: ws } = await import('@/systems/world');

      engine.registerCard({
        id: 'ability_card',
        name: '能力卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [
          {
            trigger: 'obtain' as const,
            effects: [
              { type: 'unlockAbility' as const, abilityType: 'DEPTH_INTERVENTION' },
            ],
          },
        ],
      });

      expect(ws.hasAbility('DEPTH_INTERVENTION')).toBe(false);
      engine.obtainCard('ability_card');
      expect(ws.hasAbility('DEPTH_INTERVENTION')).toBe(true);
    });
  });

  describe('卡片 gameplay 效果 - setFlag', () => {
    it('gameplayFx setFlag 应设置标记', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const { worldState: ws } = await import('@/systems/world');

      engine.registerCard({
        id: 'flag_card',
        name: '标记卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [
          {
            trigger: 'obtain' as const,
            effects: [
              { type: 'setFlag' as const, flagName: 'CARD_FLAG', flagValue: true },
            ],
          },
        ],
      });

      expect(ws.getFlag('CARD_FLAG')).toBe(false);
      engine.obtainCard('flag_card');
      expect(ws.getFlag('CARD_FLAG')).toBe(true);
    });

    it('gameplayFx setFlag 默认值应为 true', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const { worldState: ws } = await import('@/systems/world');

      engine.registerCard({
        id: 'flag_default_card',
        name: '默认标记卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [
          {
            trigger: 'obtain' as const,
            effects: [
              { type: 'setFlag' as const, flagName: 'DEFAULT_FLAG' },
            ],
          },
        ],
      });

      expect(ws.getFlag('DEFAULT_FLAG')).toBe(false);
      engine.obtainCard('flag_default_card');
      expect(ws.getFlag('DEFAULT_FLAG')).toBe(true);
    });
  });

  describe('卡片 gameplay 效果 - counterDelta', () => {
    it('gameplayFx counterDelta 应修改 R 值', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const { worldState: ws } = await import('@/systems/world');

      engine.registerCard({
        id: 'r_delta_card',
        name: 'R值卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [
          {
            trigger: 'obtain' as const,
            effects: [
              { type: 'counterDelta' as const, counter: 'R', delta: 3 },
            ],
          },
        ],
      });

      expect(ws.getCounters().R).toBe(0);
      engine.obtainCard('r_delta_card');
      expect(ws.getCounters().R).toBe(3);
    });

    it('gameplayFx counterDelta 应修改 P 值', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const { worldState: ws } = await import('@/systems/world');

      engine.registerCard({
        id: 'p_delta_card',
        name: 'P值卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [
          {
            trigger: 'obtain' as const,
            effects: [
              { type: 'counterDelta' as const, counter: 'P', delta: 5 },
            ],
          },
        ],
      });

      expect(ws.getCounters().P).toBe(0);
      engine.obtainCard('p_delta_card');
      expect(ws.getCounters().P).toBe(5);
    });
  });

  describe('卡片 gameplay 效果边界情况', () => {
    it('无效的效果类型应返回 false', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'invalid_fx_card',
        name: '无效效果卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [
          {
            trigger: 'obtain' as const,
            effects: [
              { type: 'invalid_type' as any },
            ],
          },
        ],
      });

      // 不应抛错
      expect(() => engine.obtainCard('invalid_fx_card')).not.toThrow();
    });

    it('缺少必要参数的效果应被跳过', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      engine.registerCard({
        id: 'missing_param_card',
        name: '缺参数卡',
        type: 'item' as const,
        front: ['正面'],
        detail: ['内容'],
        chapter: 'C0' as const,
        zone: 'C0-Z1',
        gameplayFx: [
          {
            trigger: 'obtain' as const,
            effects: [
              { type: 'giveCard' as const }, // 缺少 cardId
              { type: 'unlockAbility' as const }, // 缺少 abilityType
              { type: 'setFlag' as const }, // 缺少 flagName
            ],
          },
        ],
      });

      // 不应抛错
      expect(() => engine.obtainCard('missing_param_card')).not.toThrow();
    });
  });
});
