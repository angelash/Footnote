/**
 * 本地化数据加载器
 * 提供统一的翻译文件加载接口
 * 支持动态加载、回退机制、按需加载
 */

import { i18n, SupportedLocale } from '@/systems/i18n/I18nManager';

/** 默认回退语言 */
const FALLBACK_LOCALE: SupportedLocale = 'zh-CN';

/** 已加载的翻译记录（避免重复加载） */
const loadedTranslations: Set<string> = new Set();

/**
 * 生成翻译加载键（用于去重）
 */
function getTranslationKey(locale: SupportedLocale, type: string, id?: string): string {
  return id ? `${locale}:${type}:${id}` : `${locale}:${type}`;
}

/**
 * 加载对话翻译（带回退机制）
 * @param locale 目标语言
 * @param chapter 章节ID（如 'c0', 'c1'）
 * @param options 加载选项
 */
export async function loadDialogueTranslations(
  locale: SupportedLocale,
  chapter: string,
  options: { force?: boolean; useFallback?: boolean } = {}
): Promise<boolean> {
  const { force = false, useFallback = true } = options;
  const key = getTranslationKey(locale, 'dialogues', chapter);

  // 检查是否已加载（除非强制重新加载）
  if (!force && loadedTranslations.has(key)) {
    return true;
  }

  try {
    // 动态导入 YAML 文件
    const dialogueModule = await import(`./${locale}/dialogues/${chapter}.yaml`);
    i18n.loadTranslations(locale, {
      data: dialogueModule.default,
      namespace: `dialogues.${chapter}`,
    });
    loadedTranslations.add(key);
    return true;
  } catch (error) {
    console.warn(`[Locales] Failed to load dialogue translations for ${locale}/${chapter}:`, error);

    // 尝试回退到默认语言
    if (useFallback && locale !== FALLBACK_LOCALE) {
      console.log(`[Locales] Falling back to ${FALLBACK_LOCALE} for dialogues/${chapter}`);
      return loadDialogueTranslations(FALLBACK_LOCALE, chapter, { force, useFallback: false });
    }

    return false;
  }
}

/**
 * 加载卡片翻译（带回退机制）
 * @param locale 目标语言
 * @param options 加载选项
 */
export async function loadCardTranslations(
  locale: SupportedLocale,
  options: { force?: boolean; useFallback?: boolean } = {}
): Promise<boolean> {
  const { force = false, useFallback = true } = options;
  const key = getTranslationKey(locale, 'cards');

  // 检查是否已加载（除非强制重新加载）
  if (!force && loadedTranslations.has(key)) {
    return true;
  }

  try {
    const cardsModule = await import(`./${locale}/cards.yaml`);
    i18n.loadTranslations(locale, {
      data: cardsModule.default,
      namespace: 'cards',
    });
    loadedTranslations.add(key);
    return true;
  } catch (error) {
    console.warn(`[Locales] Failed to load card translations for ${locale}:`, error);

    // 尝试回退到默认语言
    if (useFallback && locale !== FALLBACK_LOCALE) {
      console.log(`[Locales] Falling back to ${FALLBACK_LOCALE} for cards`);
      return loadCardTranslations(FALLBACK_LOCALE, { force, useFallback: false });
    }

    return false;
  }
}

/**
 * 批量加载所有翻译
 * @param locale 目标语言
 * @param chapters 需要加载的章节列表
 * @param options 加载选项
 */
export async function loadAllTranslations(
  locale: SupportedLocale,
  chapters: string[] = ['c0'],
  options: { force?: boolean; useFallback?: boolean; includeUI?: boolean } = {}
): Promise<{ success: boolean; loaded: string[]; failed: string[] }> {
  const { includeUI = true, ...restOptions } = options;
  const results: Array<{ key: string; success: boolean }> = [];

  // 加载卡片翻译
  const cardsSuccess = await loadCardTranslations(locale, restOptions);
  results.push({ key: 'cards', success: cardsSuccess });

  // 加载UI扩展翻译
  if (includeUI) {
    const uiSuccess = await loadUITranslations(locale, restOptions);
    results.push({ key: 'ui', success: uiSuccess });
  }

  // 加载对话翻译
  for (const chapter of chapters) {
    const dialogueSuccess = await loadDialogueTranslations(locale, chapter, restOptions);
    results.push({ key: `dialogues/${chapter}`, success: dialogueSuccess });
  }

  const loaded = results.filter((r) => r.success).map((r) => r.key);
  const failed = results.filter((r) => !r.success).map((r) => r.key);

  console.log(
    `[Locales] Loaded translations for ${locale}: ${loaded.length}/${results.length} successful`
  );

  return {
    success: failed.length === 0,
    loaded,
    failed,
  };
}

/**
 * 预加载当前语言的所有翻译
 * @param chapters 需要加载的章节列表（默认只加载 c0）
 */
export async function preloadCurrentLocaleTranslations(
  chapters: string[] = ['c0']
): Promise<{ success: boolean; loaded: string[]; failed: string[] }> {
  const currentLocale = i18n.getLocale();
  return loadAllTranslations(currentLocale, chapters);
}

/**
 * 切换语言并加载对应翻译
 * @param locale 目标语言
 * @param chapters 需要加载的章节列表
 */
export async function switchLocaleWithTranslations(
  locale: SupportedLocale,
  chapters: string[] = ['c0']
): Promise<{ success: boolean; loaded: string[]; failed: string[] }> {
  // 先加载翻译
  const result = await loadAllTranslations(locale, chapters);

  // 切换语言
  i18n.setLocale(locale);

  return result;
}

/**
 * 预加载多语言翻译（用于支持快速语言切换）
 * @param locales 需要预加载的语言列表
 * @param chapters 需要加载的章节列表
 */
export async function preloadMultipleLocales(
  locales: SupportedLocale[],
  chapters: string[] = ['c0']
): Promise<Map<SupportedLocale, { success: boolean; loaded: string[]; failed: string[] }>> {
  const results = new Map<
    SupportedLocale,
    { success: boolean; loaded: string[]; failed: string[] }
  >();

  // 并行加载所有语言
  await Promise.all(
    locales.map(async (locale) => {
      const result = await loadAllTranslations(locale, chapters);
      results.set(locale, result);
    })
  );

  return results;
}

/**
 * 清除已加载的翻译缓存
 * @param locale 可选，指定语言（不指定则清除全部）
 */
export function clearTranslationCache(locale?: SupportedLocale): void {
  if (locale) {
    // 清除指定语言的缓存
    for (const key of loadedTranslations) {
      if (key.startsWith(`${locale}:`)) {
        loadedTranslations.delete(key);
      }
    }
  } else {
    // 清除全部缓存
    loadedTranslations.clear();
  }
}

/**
 * 获取已加载的翻译列表
 */
export function getLoadedTranslations(): string[] {
  return Array.from(loadedTranslations);
}

/**
 * 检查翻译是否已加载
 * @param locale 目标语言
 * @param type 翻译类型（'cards' | 'dialogues' | 'ui'）
 * @param id 可选，具体ID（如章节ID）
 */
export function isTranslationLoaded(
  locale: SupportedLocale,
  type: 'cards' | 'dialogues' | 'ui',
  id?: string
): boolean {
  const key = getTranslationKey(locale, type, id);
  return loadedTranslations.has(key);
}

/**
 * 加载UI扩展翻译（带回退机制）
 * @param locale 目标语言
 * @param options 加载选项
 */
export async function loadUITranslations(
  locale: SupportedLocale,
  options: { force?: boolean; useFallback?: boolean } = {}
): Promise<boolean> {
  const { force = false, useFallback = true } = options;
  const key = getTranslationKey(locale, 'ui');

  // 检查是否已加载（除非强制重新加载）
  if (!force && loadedTranslations.has(key)) {
    return true;
  }

  try {
    const uiModule = await import(`./${locale}/ui.yaml`);
    i18n.loadTranslations(locale, {
      data: uiModule.default,
      namespace: 'ui_ext',
    });
    loadedTranslations.add(key);
    return true;
  } catch (error) {
    console.warn(`[Locales] Failed to load UI translations for ${locale}:`, error);

    // 尝试回退到默认语言
    if (useFallback && locale !== FALLBACK_LOCALE) {
      console.log(`[Locales] Falling back to ${FALLBACK_LOCALE} for UI`);
      return loadUITranslations(FALLBACK_LOCALE, { force, useFallback: false });
    }

    return false;
  }
}

/**
 * 按需加载章节对话（懒加载）
 * 当玩家进入新章节时调用
 * @param chapter 章节ID
 */
export async function loadChapterOnDemand(chapter: string): Promise<boolean> {
  const currentLocale = i18n.getLocale();

  // 检查是否已加载
  if (isTranslationLoaded(currentLocale, 'dialogues', chapter)) {
    return true;
  }

  console.log(`[Locales] Loading chapter ${chapter} on demand for ${currentLocale}`);
  return loadDialogueTranslations(currentLocale, chapter);
}
