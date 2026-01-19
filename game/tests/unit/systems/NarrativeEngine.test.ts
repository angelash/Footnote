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
        title: '测试卡片',
        category: 'archive' as const,
        content: '这是卡片内容',
        chapter: 'C0' as const,
        zone: 'C0-Z1',
      };

      engine.registerCard(card);
      const retrieved = engine.getCard('card_001');

      expect(retrieved).not.toBeUndefined();
      expect(retrieved?.title).toBe('测试卡片');
    });

    it('批量注册卡片应正常工作', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const cards = [
        {
          id: 'card_a',
          title: '卡片A',
          category: 'item' as const,
          content: '内容A',
          chapter: 'C1' as const,
          zone: 'C1-Z1',
        },
        {
          id: 'card_b',
          title: '卡片B',
          category: 'diary' as const,
          content: '内容B',
          chapter: 'C1' as const,
          zone: 'C1-Z2',
        },
      ];

      engine.registerCards(cards);

      expect(engine.getCard('card_a')?.title).toBe('卡片A');
      expect(engine.getCard('card_b')?.title).toBe('卡片B');
    });

    it('获得卡片应更新已获得列表', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const card = {
        id: 'obtain_card',
        title: '获得测试',
        category: 'archive' as const,
        content: '内容',
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
        title: '重复测试',
        category: 'item' as const,
        content: '内容',
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

    it('获得未注册的卡片应返回false', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const result = engine.obtainCard('non_existent_card');
      expect(result).toBe(false);
    });

    it('getObtainedCards应返回所有已获得卡片', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const cards = [
        {
          id: 'card_x',
          title: '卡片X',
          category: 'archive' as const,
          content: 'X',
          chapter: 'C0' as const,
          zone: 'C0-Z1',
        },
        {
          id: 'card_y',
          title: '卡片Y',
          category: 'item' as const,
          content: 'Y',
          chapter: 'C0' as const,
          zone: 'C0-Z1',
        },
        {
          id: 'card_z',
          title: '卡片Z',
          category: 'prayer' as const,
          content: 'Z',
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

    it('getCardsByCategory应按类别筛选卡片', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const cards = [
        {
          id: 'archive_1',
          title: '档案1',
          category: 'archive' as const,
          content: '1',
          chapter: 'C0' as const,
          zone: 'C0-Z1',
        },
        {
          id: 'archive_2',
          title: '档案2',
          category: 'archive' as const,
          content: '2',
          chapter: 'C0' as const,
          zone: 'C0-Z1',
        },
        {
          id: 'item_1',
          title: '物品1',
          category: 'item' as const,
          content: '3',
          chapter: 'C0' as const,
          zone: 'C0-Z1',
        },
      ];

      engine.registerCards(cards);
      cards.forEach((c) => engine.obtainCard(c.id));

      const archives = engine.getCardsByCategory('archive');
      expect(archives.length).toBe(2);
      expect(archives.every((c) => c.category === 'archive')).toBe(true);
    });

    it('viewCard应标记卡片为已查看', async () => {
      const engine = await createFreshNarrativeEngine();
      engine.reset();

      const card = {
        id: 'view_card',
        title: '查看测试',
        category: 'archive' as const,
        content: '内容',
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
        title: '未获得',
        category: 'archive' as const,
        content: '内容',
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
        title: '测试卡片',
        category: 'archive' as const,
        content: '内容',
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
        title: '完成卡片',
        category: 'item' as const,
        content: '内容',
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
        title: '序列化卡',
        category: 'archive' as const,
        content: '内容',
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
        title: '恢复卡',
        category: 'archive' as const,
        content: '内容',
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
            collected: false,
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
        title: '重置卡',
        category: 'archive' as const,
        content: '内容',
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
});
