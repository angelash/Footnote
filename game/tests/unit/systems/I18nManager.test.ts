/**
 * I18nManager 单元测试
 * 测试国际化管理器的翻译、格式化、语言切换等功能
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
  }),
});

// Mock navigator
vi.stubGlobal('navigator', {
  language: 'zh-CN',
});

// Mock eventBus
const mockEventBus = {
  emitTyped: vi.fn(),
};

vi.mock('../EventBus', () => ({
  eventBus: mockEventBus,
  GameEvent: {
    LOCALE_CHANGED: 'LOCALE_CHANGED',
  },
}));

// 重置模块以获得新实例
const createFreshI18n = async () => {
  vi.resetModules();
  Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
  const { i18n, t, LOCALE_NAMES } = await import('@/systems/i18n/I18nManager');
  return { i18n, t, LOCALE_NAMES };
};

describe('I18nManager', () => {
  describe('基础翻译功能', () => {
    it('应返回正确的翻译文本', async () => {
      const { i18n } = await createFreshI18n();

      const text = i18n.t('common.confirm');
      expect(text).toBe('确认');
    });

    it('嵌套键应正确解析', async () => {
      const { i18n } = await createFreshI18n();

      expect(i18n.t('menu.title')).toBe('备注');
      expect(i18n.t('settings.audio')).toBe('音频');
      expect(i18n.t('pause.resume')).toBe('继续游戏');
    });

    it('不存在的键应返回键本身', async () => {
      const { i18n } = await createFreshI18n();
      i18n.setWarnOnMissing(false);

      const result = i18n.t('non.existent.key');
      expect(result).toBe('non.existent.key');
    });

    it('参数插值应正确替换{param}格式', async () => {
      const { i18n } = await createFreshI18n();

      // 加载带参数的翻译
      i18n.loadTranslations('zh-CN', {
        data: { test: { greeting: '你好，{name}！' } },
        namespace: 'custom',
      });

      const result = i18n.t('custom.test.greeting', { name: '玩家' });
      expect(result).toBe('你好，玩家！');
    });

    it('参数插值应正确替换{{param}}格式', async () => {
      const { i18n } = await createFreshI18n();

      i18n.loadTranslations('zh-CN', {
        data: { test: { message: '物品数量：{{count}}' } },
        namespace: 'custom',
      });

      const result = i18n.t('custom.test.message', { count: 10 });
      expect(result).toBe('物品数量：10');
    });
  });

  describe('语言切换', () => {
    it('setLocale应正确切换语言', async () => {
      const { i18n } = await createFreshI18n();

      i18n.setLocale('en-US');
      expect(i18n.getLocale()).toBe('en-US');
      expect(i18n.t('common.confirm')).toBe('Confirm');
    });

    it('切换语言后locale应更新', async () => {
      const { i18n } = await createFreshI18n();
      const originalLocale = i18n.getLocale();

      i18n.setLocale('en-US');

      expect(i18n.getLocale()).toBe('en-US');
      expect(i18n.getLocale()).not.toBe(originalLocale);
    });

    it('切换到相同语言不应更新', async () => {
      const { i18n } = await createFreshI18n();

      const currentLocale = i18n.getLocale();
      const listener = vi.fn();
      i18n.onLocaleChange(listener);

      i18n.setLocale(currentLocale);

      expect(listener).not.toHaveBeenCalled();
    });

    it('onLocaleChange应正确注册监听器', async () => {
      const { i18n } = await createFreshI18n();
      const listener = vi.fn();

      const unsubscribe = i18n.onLocaleChange(listener);
      i18n.setLocale('en-US');

      expect(listener).toHaveBeenCalled();

      // 取消订阅后不应再调用
      listener.mockClear();
      unsubscribe();
      i18n.setLocale('zh-CN');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('支持的语言', () => {
    it('getSupportedLocales应返回所有支持的语言', async () => {
      const { i18n } = await createFreshI18n();

      const locales = i18n.getSupportedLocales();

      expect(locales).toContain('zh-CN');
      expect(locales).toContain('zh-TW');
      expect(locales).toContain('en-US');
      expect(locales).toContain('ja-JP');
    });

    it('getLocaleName应返回语言显示名称', async () => {
      const { i18n } = await createFreshI18n();

      expect(i18n.getLocaleName('zh-CN')).toBe('简体中文');
      expect(i18n.getLocaleName('en-US')).toBe('English');
      expect(i18n.getLocaleName('ja-JP')).toBe('日本語');
    });
  });

  describe('翻译加载', () => {
    it('loadTranslations应正确加载翻译', async () => {
      const { i18n } = await createFreshI18n();

      i18n.loadTranslations('zh-CN', {
        data: { custom: { key: '自定义值' } },
      });

      expect(i18n.t('custom.key')).toBe('自定义值');
    });

    it('loadTranslations with namespace应正确加载', async () => {
      const { i18n } = await createFreshI18n();

      i18n.loadTranslations('zh-CN', {
        data: { key: '命名空间值' },
        namespace: 'myns',
      });

      expect(i18n.t('myns.key')).toBe('命名空间值');
    });

    it('loadMultipleTranslations应批量加载', async () => {
      const { i18n } = await createFreshI18n();

      i18n.loadMultipleTranslations({
        'zh-CN': { batch: { hello: '你好' } },
        'en-US': { batch: { hello: 'Hello' } },
      });

      i18n.setLocale('zh-CN');
      expect(i18n.t('batch.hello')).toBe('你好');

      i18n.setLocale('en-US');
      expect(i18n.t('batch.hello')).toBe('Hello');
    });

    it('unloadTranslations应卸载翻译', async () => {
      const { i18n } = await createFreshI18n();
      i18n.setWarnOnMissing(false);

      i18n.loadTranslations('zh-CN', {
        data: { key: '值' },
        namespace: 'unload_test',
      });

      expect(i18n.t('unload_test.key')).toBe('值');

      i18n.unloadTranslations('unload_test');

      expect(i18n.t('unload_test.key')).toBe('unload_test.key');
    });
  });

  describe('exists检查', () => {
    it('exists应正确检查翻译存在性', async () => {
      const { i18n } = await createFreshI18n();

      expect(i18n.exists('common.confirm')).toBe(true);
      expect(i18n.exists('non.existent')).toBe(false);
    });

    it('exists应支持指定语言', async () => {
      const { i18n } = await createFreshI18n();

      expect(i18n.exists('common.confirm', 'en-US')).toBe(true);
      expect(i18n.exists('common.confirm', 'ja-JP')).toBe(true);
    });
  });

  describe('批量翻译', () => {
    it('tMany应批量翻译多个键', async () => {
      const { i18n } = await createFreshI18n();

      const result = i18n.tMany(['common.confirm', 'common.cancel', 'common.back']);

      expect(result['common.confirm']).toBe('确认');
      expect(result['common.cancel']).toBe('取消');
      expect(result['common.back']).toBe('返回');
    });

    it('tAll应返回命名空间下所有翻译', async () => {
      const { i18n } = await createFreshI18n();

      const result = i18n.tAll('common');

      expect(result['confirm']).toBe('确认');
      expect(result['cancel']).toBe('取消');
    });
  });

  describe('数字格式化', () => {
    it('formatNumber应正确格式化数字', async () => {
      const { i18n } = await createFreshI18n();

      const result = i18n.formatNumber(1234567.89);
      // 中文格式：1,234,567.89
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('formatPercent应正确格式化百分比', async () => {
      const { i18n } = await createFreshI18n();

      const result = i18n.formatPercent(0.85);
      expect(result).toContain('85');
      expect(result).toContain('%');
    });

    it('formatCurrency应正确格式化货币', async () => {
      const { i18n } = await createFreshI18n();

      const result = i18n.formatCurrency(100);
      // 应包含货币符号
      expect(result.length).toBeGreaterThan(3);
    });
  });

  describe('日期格式化', () => {
    it('formatDate应正确格式化日期', async () => {
      const { i18n } = await createFreshI18n();
      const date = new Date(2025, 0, 19); // 2025-01-19

      const result = i18n.formatDate(date);
      expect(result).toContain('2025');
    });

    it('formatDate应支持时间戳', async () => {
      const { i18n } = await createFreshI18n();
      const timestamp = Date.now();

      const result = i18n.formatDate(timestamp);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('formatRelativeTime应返回相对时间', async () => {
      const { i18n } = await createFreshI18n();
      const now = Date.now();
      const oneHourAgo = now - 3600000;

      const result = i18n.formatRelativeTime(oneHourAgo, now);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('序数格式化', () => {
    it('formatOrdinal应正确格式化中文序数', async () => {
      const { i18n } = await createFreshI18n();
      i18n.setLocale('zh-CN');

      expect(i18n.formatOrdinal(1)).toBe('第1');
      expect(i18n.formatOrdinal(10)).toBe('第10');
    });

    it('formatOrdinal应正确格式化英文序数', async () => {
      const { i18n } = await createFreshI18n();
      i18n.setLocale('en-US');

      // 1 使用 'st'
      expect(i18n.formatOrdinal(1)).toBe('1st');

      // 4及以上使用 'th' (基于Intl.PluralRules的cardinal规则)
      expect(i18n.formatOrdinal(4)).toBe('4th');

      // 11, 12, 13 特殊处理为 'th'
      expect(i18n.formatOrdinal(11)).toBe('11th');
      expect(i18n.formatOrdinal(12)).toBe('12th');
      expect(i18n.formatOrdinal(13)).toBe('13th');
    });

    it('formatOrdinal应正确格式化日文序数', async () => {
      const { i18n } = await createFreshI18n();
      i18n.setLocale('ja-JP');

      expect(i18n.formatOrdinal(1)).toBe('第1');
      expect(i18n.formatOrdinal(5)).toBe('第5');
    });
  });

  describe('缺失翻译记录', () => {
    it('应记录缺失的翻译', async () => {
      const { i18n } = await createFreshI18n();
      i18n.setWarnOnMissing(false);

      i18n.t('missing.key.1');
      i18n.t('missing.key.2');

      const missing = i18n.getMissingTranslations();
      expect(missing.length).toBe(2);
      expect(missing.some((m) => m.key === 'missing.key.1')).toBe(true);
    });

    it('clearMissingTranslations应清空记录', async () => {
      const { i18n } = await createFreshI18n();
      i18n.setWarnOnMissing(false);

      i18n.t('missing.key');
      expect(i18n.getMissingTranslations().length).toBeGreaterThan(0);

      i18n.clearMissingTranslations();
      expect(i18n.getMissingTranslations().length).toBe(0);
    });
  });

  describe('回退机制', () => {
    it('setFallbackLocale应设置回退语言', async () => {
      const { i18n } = await createFreshI18n();

      i18n.setFallbackLocale('en-US');
      expect(i18n.getFallbackLocale()).toBe('en-US');
    });
  });

  describe('统计信息', () => {
    it('getStats应返回翻译统计', async () => {
      const { i18n } = await createFreshI18n();

      const stats = i18n.getStats();

      expect(stats.locale).toBeDefined();
      expect(stats.totalKeys).toBeDefined();
      expect(typeof stats.missingCount).toBe('number');
    });
  });

  describe('文本方向', () => {
    it('getTextDirection应返回ltr', async () => {
      const { i18n } = await createFreshI18n();

      expect(i18n.getTextDirection()).toBe('ltr');
    });
  });

  describe('重置', () => {
    it('reset应重置为默认状态', async () => {
      const { i18n } = await createFreshI18n();

      i18n.setLocale('en-US');
      i18n.loadTranslations('zh-CN', { data: { custom: '值' } });

      i18n.reset();

      // 验证重置后状态
      expect(i18n.t('common.confirm')).toBeDefined();
    });
  });

  describe('t快捷函数', () => {
    it('t函数应等同于i18n.t', async () => {
      const { i18n, t } = await createFreshI18n();

      const result1 = t('common.confirm');
      const result2 = i18n.t('common.confirm');

      expect(result1).toBe(result2);
    });
  });

  describe('上下文翻译', () => {
    it('tc应支持上下文翻译', async () => {
      const { i18n } = await createFreshI18n();

      i18n.loadTranslations('zh-CN', {
        data: {
          context_test: {
            greeting: {
              male: '先生，您好',
              female: '女士，您好',
              default: '您好',
            },
          },
        },
      });

      const resultMale = i18n.tc('context_test.greeting', { gender: 'male' });
      const resultFemale = i18n.tc('context_test.greeting', { gender: 'female' });

      expect(resultMale).toBe('先生，您好');
      expect(resultFemale).toBe('女士，您好');
    });
  });

  describe('复数翻译', () => {
    it('tp应支持复数形式', async () => {
      const { i18n } = await createFreshI18n();

      i18n.loadTranslations('zh-CN', {
        data: {
          plural_test: {
            items: {
              zero: '没有物品',
              one: '{count}个物品',
              other: '{count}个物品',
            },
          },
        },
      });

      const resultZero = i18n.tp('plural_test.items', 0);
      const resultOne = i18n.tp('plural_test.items', 1);
      const resultMany = i18n.tp('plural_test.items', 5);

      expect(resultZero).toContain('0');
      expect(resultOne).toContain('1');
      expect(resultMany).toContain('5');
    });
  });

  describe('URL加载翻译', () => {
    it('loadTranslationsFromUrl应从URL加载翻译', async () => {
      const { i18n } = await createFreshI18n();

      // Mock fetch
      const mockTranslations = {
        test: { greeting: 'Hello from URL' },
      };
      
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTranslations),
      });

      await i18n.loadTranslationsFromUrl('en', '/test/translations.json');
      
      // 切换到 en 语言
      i18n.setLocale('en');

      expect(i18n.t('test.greeting')).toBe('Hello from URL');
      expect(globalThis.fetch).toHaveBeenCalledWith('/test/translations.json');
    });

    it('loadTranslationsFromUrl失败时应抛出错误', async () => {
      const { i18n } = await createFreshI18n();

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(
        i18n.loadTranslationsFromUrl('en', '/invalid/url.json')
      ).rejects.toThrow('Failed to load translations');
    });

    it('loadTranslationsFromUrl网络错误应抛出异常', async () => {
      const { i18n } = await createFreshI18n();

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        i18n.loadTranslationsFromUrl('en', '/error/url.json')
      ).rejects.toThrow('Network error');
    });
  });

  describe('缺失翻译记录', () => {
    it('应记录缺失的翻译', async () => {
      const { i18n } = await createFreshI18n();
      
      // 关闭警告避免日志输出
      i18n.setWarnOnMissing(false);
      
      // 访问不存在的键
      i18n.t('nonexistent.key');
      i18n.t('another.missing.key');

      const missing = i18n.getMissingTranslations();
      expect(missing.length).toBeGreaterThan(0);
    });

    it('clearMissingTranslations应清空记录', async () => {
      const { i18n } = await createFreshI18n();
      
      i18n.setWarnOnMissing(false);
      i18n.t('missing.key');
      
      expect(i18n.getMissingTranslations().length).toBeGreaterThan(0);
      
      i18n.clearMissingTranslations();
      expect(i18n.getMissingTranslations().length).toBe(0);
    });
  });

  describe('命名空间卸载', () => {
    it('unloadTranslations应卸载指定命名空间', async () => {
      const { i18n } = await createFreshI18n();

      // 先设置语言
      i18n.setLocale('zh-CN');
      
      i18n.loadTranslations('zh-CN', {
        data: { temp: { key: '临时翻译' } },
        namespace: 'temp_ns',
      });

      // 命名空间通过点号访问
      expect(i18n.t('temp_ns.temp.key')).toBe('临时翻译');

      i18n.unloadTranslations('temp_ns');
      
      // 卸载后应返回 key 本身
      expect(i18n.t('temp_ns.temp.key')).toBe('temp_ns.temp.key');
    });
  });
});
