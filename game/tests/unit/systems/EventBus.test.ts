/**
 * EventBus 单元测试
 * 测试事件发射、监听、历史记录等功能
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// 重置模块以获得新的实例
const createFreshEventBus = async () => {
  vi.resetModules();
  const { eventBus, GameEvent } = await import('@/systems/EventBus');
  eventBus.reset();
  return { eventBus, GameEvent };
};

describe('EventBus', () => {
  describe('基础事件功能', () => {
    it('应该能发射和监听事件', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.on(GameEvent.ZONE_ENTER, callback);
      eventBus.emit(GameEvent.ZONE_ENTER, {
        zoneId: 'C0-Z1',
        isFirstVisit: true,
        isRevisit: false,
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        zoneId: 'C0-Z1',
        isFirstVisit: true,
        isRevisit: false,
      });
    });

    it('once监听器应只触发一次', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.once(GameEvent.DIALOGUE_START, callback);

      eventBus.emit(GameEvent.DIALOGUE_START, { dialogueId: 'dlg_1' });
      eventBus.emit(GameEvent.DIALOGUE_START, { dialogueId: 'dlg_2' });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ dialogueId: 'dlg_1' });
    });

    it('off应移除监听器', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.on(GameEvent.CARD_OBTAIN, callback);
      eventBus.emit(GameEvent.CARD_OBTAIN, {
        cardId: 'card_1',
        card: { id: 'card_1', title: '测试', category: 'archive' },
      });
      expect(callback).toHaveBeenCalledTimes(1);

      eventBus.off(GameEvent.CARD_OBTAIN, callback);
      eventBus.emit(GameEvent.CARD_OBTAIN, {
        cardId: 'card_2',
        card: { id: 'card_2', title: '测试2', category: 'item' },
      });
      expect(callback).toHaveBeenCalledTimes(1); // 仍然是1次
    });

    it('多个监听器应都被调用', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      eventBus.on(GameEvent.ABILITY_UNLOCK, callback1);
      eventBus.on(GameEvent.ABILITY_UNLOCK, callback2);
      eventBus.on(GameEvent.ABILITY_UNLOCK, callback3);

      eventBus.emit(GameEvent.ABILITY_UNLOCK, { abilityType: 'DEPTH_PERCEPTION' });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });
  });

  describe('类型安全的事件方法', () => {
    it('emitTyped应发射类型安全的事件', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.on(GameEvent.COUNTER_R_CHANGE, callback);
      eventBus.emitTyped(GameEvent.COUNTER_R_CHANGE, {
        oldValue: 0,
        newValue: 5,
        delta: 5,
      });

      expect(callback).toHaveBeenCalledWith({
        oldValue: 0,
        newValue: 5,
        delta: 5,
      });
    });

    it('onTyped应注册类型安全的监听器', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.onTyped(GameEvent.FORESHADOW_PLANT, callback);
      eventBus.emit(GameEvent.FORESHADOW_PLANT, {
        foreshadowId: 'F01',
        zoneId: 'C0-Z1',
      });

      expect(callback).toHaveBeenCalledWith({
        foreshadowId: 'F01',
        zoneId: 'C0-Z1',
      });
    });

    it('onceTyped应只触发一次', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.onceTyped(GameEvent.SAVE_COMPLETE, callback);

      eventBus.emit(GameEvent.SAVE_COMPLETE, { slot: 1, timestamp: Date.now() });
      eventBus.emit(GameEvent.SAVE_COMPLETE, { slot: 2, timestamp: Date.now() });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('offTyped应移除类型安全的监听器', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.onTyped(GameEvent.BGM_PLAY, callback);
      eventBus.emit(GameEvent.BGM_PLAY, { key: 'bgm_1' });
      expect(callback).toHaveBeenCalledTimes(1);

      eventBus.offTyped(GameEvent.BGM_PLAY, callback);
      eventBus.emit(GameEvent.BGM_PLAY, { key: 'bgm_2' });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('事件历史记录', () => {
    it('应记录发射的事件', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();

      eventBus.emit(GameEvent.GAME_START, { isNewGame: true });
      eventBus.emit(GameEvent.ZONE_ENTER, {
        zoneId: 'C0-Z1',
        isFirstVisit: true,
        isRevisit: false,
      });

      const history = eventBus.getEventHistory();
      expect(history.length).toBe(2);
      expect(history[0].event).toBe(GameEvent.GAME_START);
      expect(history[1].event).toBe(GameEvent.ZONE_ENTER);
    });

    it('事件历史应包含时间戳', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();

      const before = Date.now();
      eventBus.emit(GameEvent.DIALOGUE_START, { dialogueId: 'test' });
      const after = Date.now();

      const history = eventBus.getEventHistory();
      expect(history[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(history[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('clearEventHistory应清空历史', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();

      eventBus.emit(GameEvent.GAME_START, { isNewGame: true });
      eventBus.emit(GameEvent.GAME_PAUSE, {});

      expect(eventBus.getEventHistory().length).toBe(2);

      eventBus.clearEventHistory();
      expect(eventBus.getEventHistory().length).toBe(0);
    });

    it('历史记录应限制最大数量', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();

      // 发射超过100个事件
      for (let i = 0; i < 150; i++) {
        eventBus.emit(GameEvent.UI_TOAST, {
          message: `Toast ${i}`,
          type: 'info',
        });
      }

      const history = eventBus.getEventHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('调试模式', () => {
    it('enableDebug/disableDebug应切换调试模式', async () => {
      const { eventBus } = await createFreshEventBus();
      // Logger 使用 console.info，格式包含时间戳和模块名
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      eventBus.enableDebug();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EventBus]')
      );

      eventBus.disableDebug();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EventBus]')
      );

      consoleSpy.mockRestore();
    });

    it('调试模式下应输出事件日志', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      // Logger.debug 使用 console.debug
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      eventBus.enableDebug();
      eventBus.emit(GameEvent.CHAPTER_START, { chapterId: 'C1' });

      // 检查是否有调试输出（具体格式可能变化）
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EventBus]'),
        expect.anything()
      );

      consoleSpy.mockRestore();
    });
  });

  describe('重置功能', () => {
    it('reset应移除所有监听器', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.on(GameEvent.ZONE_COMPLETE, callback);
      eventBus.reset();
      eventBus.emit(GameEvent.ZONE_COMPLETE, { zoneId: 'C0-Z1' });

      expect(callback).not.toHaveBeenCalled();
    });

    it('reset应清空事件历史', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();

      eventBus.emit(GameEvent.GAME_START, { isNewGame: true });
      expect(eventBus.getEventHistory().length).toBe(1);

      eventBus.reset();
      expect(eventBus.getEventHistory().length).toBe(0);
    });
  });

  describe('各种事件类型', () => {
    it('Zone相关事件', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.on(GameEvent.ZONE_UNLOCK, callback);
      eventBus.emit(GameEvent.ZONE_UNLOCK, { zoneId: 'C1-Z1' });

      expect(callback).toHaveBeenCalledWith({ zoneId: 'C1-Z1' });
    });

    it('对话相关事件', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.on(GameEvent.DIALOGUE_CHOICE, callback);
      eventBus.emit(GameEvent.DIALOGUE_CHOICE, { choiceId: 'choice_1', choiceIndex: 0 });

      expect(callback).toHaveBeenCalledWith({ choiceId: 'choice_1', choiceIndex: 0 });
    });

    it('卡片相关事件', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.on(GameEvent.CARD_VIEW, callback);
      eventBus.emit(GameEvent.CARD_VIEW, { cardId: 'card_001' });

      expect(callback).toHaveBeenCalledWith({ cardId: 'card_001' });
    });

    it('能力相关事件', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.on(GameEvent.ABILITY_USE, callback);
      eventBus.emit(GameEvent.ABILITY_USE, {
        abilityType: 'DEPTH_PERCEPTION',
        targetId: 'obj_1',
      });

      expect(callback).toHaveBeenCalledWith({
        abilityType: 'DEPTH_PERCEPTION',
        targetId: 'obj_1',
      });
    });

    it('存档相关事件', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const startCallback = vi.fn();
      const completeCallback = vi.fn();
      const errorCallback = vi.fn();

      eventBus.on(GameEvent.SAVE_START, startCallback);
      eventBus.on(GameEvent.SAVE_COMPLETE, completeCallback);
      eventBus.on(GameEvent.SAVE_ERROR, errorCallback);

      eventBus.emit(GameEvent.SAVE_START, { slot: 1 });
      eventBus.emit(GameEvent.SAVE_COMPLETE, { slot: 1, timestamp: Date.now() });
      eventBus.emit(GameEvent.SAVE_ERROR, { slot: 2, error: 'Test error' });

      expect(startCallback).toHaveBeenCalledWith({ slot: 1 });
      expect(completeCallback).toHaveBeenCalledWith(expect.objectContaining({ slot: 1 }));
      expect(errorCallback).toHaveBeenCalledWith({ slot: 2, error: 'Test error' });
    });

    it('UI相关事件', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.on(GameEvent.UI_TOAST, callback);
      eventBus.emit(GameEvent.UI_TOAST, {
        message: '测试消息',
        type: 'success',
        duration: 3000,
      });

      expect(callback).toHaveBeenCalledWith({
        message: '测试消息',
        type: 'success',
        duration: 3000,
      });
    });

    it('音频相关事件', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const bgmCallback = vi.fn();
      const sfxCallback = vi.fn();

      eventBus.on(GameEvent.BGM_PLAY, bgmCallback);
      eventBus.on(GameEvent.SFX_PLAY, sfxCallback);

      eventBus.emit(GameEvent.BGM_PLAY, { key: 'bgm_main', crossfade: true });
      eventBus.emit(GameEvent.SFX_PLAY, { key: 'click', volume: 0.8 });

      expect(bgmCallback).toHaveBeenCalledWith({ key: 'bgm_main', crossfade: true });
      expect(sfxCallback).toHaveBeenCalledWith({ key: 'click', volume: 0.8 });
    });

    it('游戏流程事件', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.on(GameEvent.ENDING_REACH, callback);
      eventBus.emit(GameEvent.ENDING_REACH, { endingType: 'A' });

      expect(callback).toHaveBeenCalledWith({ endingType: 'A' });
    });

    it('系统事件', async () => {
      const { eventBus, GameEvent } = await createFreshEventBus();
      const callback = vi.fn();

      eventBus.on(GameEvent.SYSTEM_PAUSE, callback);
      eventBus.emit(GameEvent.SYSTEM_PAUSE, { rValue: 6 });

      expect(callback).toHaveBeenCalledWith({ rValue: 6 });
    });
  });
});
