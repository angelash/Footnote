/**
 * 国际化管理器
 * 支持多语言切换、动态加载、EventBus 集成
 * 功能特性：
 * - 多语言加载与切换
 * - 占位符参数替换（支持 {param} 和 {{param}}）
 * - 复数形式支持
 * - 数字/日期格式化
 * - 上下文感知翻译
 * - 缺失翻译回退机制
 * @module systems/i18n/I18nManager
 */

import { eventBus, GameEvent } from '../EventBus';

export type SupportedLocale = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP';

interface ITranslation {
  [key: string]: string | ITranslation;
}

/**
 * 缺失翻译记录
 */
interface IMissingTranslation {
  key: string;
  locale: SupportedLocale;
  timestamp: number;
}

/**
 * 翻译加载配置
 */
interface ITranslationLoadConfig {
  /** 翻译数据 */
  data: ITranslation;
  /** 命名空间（可选，如 'dialogues', 'cards'） */
  namespace?: string;
}

/**
 * 复数规则类型
 */
type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/**
 * 复数翻译配置
 */
interface IPluralTranslation {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

/**
 * 格式化选项（预留接口，供未来扩展使用）
 * @internal 当前版本未使用，保留供后续版本实现高级格式化功能
 */
export interface IFormatOptions {
  /** 数字格式化选项 */
  number?: Intl.NumberFormatOptions;
  /** 日期格式化选项 */
  date?: Intl.DateTimeFormatOptions;
  /** 货币代码 */
  currency?: string;
}

/**
 * 翻译上下文
 */
interface ITranslationContext {
  /** 性别上下文 */
  gender?: 'male' | 'female' | 'neutral';
  /** 正式程度 */
  formality?: 'formal' | 'informal';
  /** 自定义上下文 */
  [key: string]: string | undefined;
}

/**
 * 核心UI文本（内置）
 */
const BUILT_IN_TRANSLATIONS: Record<SupportedLocale, ITranslation> = {
  'zh-CN': {
    common: {
      confirm: '确认',
      cancel: '取消',
      back: '返回',
      close: '关闭',
      save: '保存',
      load: '读取',
      settings: '设置',
      continue: '继续',
      newGame: '新游戏',
      quit: '退出',
    },
    menu: {
      title: '备注',
      subtitle: 'Footnote',
      continueGame: '继续游戏',
      newGame: '开始新游戏',
      loadGame: '读取存档',
      settings: '游戏设置',
      credits: '制作人员',
      exit: '退出游戏',
    },
    settings: {
      title: '设置',
      audio: '音频',
      bgmVolume: 'BGM音量',
      sfxVolume: '音效音量',
      ambienceVolume: '环境音量',
      display: '显示',
      language: '语言',
      textSpeed: '文字速度',
      autoPlay: '自动播放',
      game: '游戏',
      tutorialHints: '教程提示',
      confirmChoices: '确认选择',
    },
    pause: {
      title: '暂停',
      resume: '继续游戏',
      inventory: '物品栏',
      save: '保存游戏',
      load: '读取存档',
      settings: '设置',
      mainMenu: '返回主菜单',
    },
    inventory: {
      title: '物品栏',
      empty: '暂无物品',
      archive: '档案',
      item: '道具',
      prayer: '祷文',
      verdict: '判词',
    },
    ability: {
      depthPerception: '深度感知',
      depthIntervention: '深度介入',
      timeIntervention: '时间干预',
      locked: '未解锁',
      cooldown: '冷却中',
    },
    dialogue: {
      skip: '跳过',
      auto: '自动',
      log: '历史',
    },
    save: {
      title: '存档管理',
      slot: '存档槽',
      empty: '空',
      autoSave: '自动存档',
      quickSave: '快速存档',
      overwrite: '覆盖存档？',
      loadConfirm: '确定读取此存档？',
      deleteConfirm: '确定删除此存档？',
    },
    achievement: {
      title: '成就',
      unlocked: '已解锁',
      locked: '未解锁',
      hidden: '???',
    },
    tutorial: {
      movement: '使用 WASD 或方向键移动角色',
      interaction: '靠近物体后点击进行交互',
      dialogue: '点击屏幕或按空格键推进对话',
      card: '收集的卡片会记录重要信息',
      skip: '跳过',
      skipAll: '跳过全部',
    },
    system: {
      saving: '保存中...',
      saved: '已保存',
      loading: '加载中...',
      loaded: '已加载',
      error: '发生错误',
      offline: '离线模式',
    },
  },
  'zh-TW': {
    common: {
      confirm: '確認',
      cancel: '取消',
      back: '返回',
      close: '關閉',
      save: '保存',
      load: '讀取',
      settings: '設定',
      continue: '繼續',
      newGame: '新遊戲',
      quit: '退出',
    },
    menu: {
      title: '備註',
      subtitle: 'Footnote',
      continueGame: '繼續遊戲',
      newGame: '開始新遊戲',
      loadGame: '讀取存檔',
      settings: '遊戲設定',
      credits: '製作人員',
      exit: '退出遊戲',
    },
    settings: {
      title: '設定',
      audio: '音訊',
      bgmVolume: 'BGM音量',
      sfxVolume: '音效音量',
      ambienceVolume: '環境音量',
      display: '顯示',
      language: '語言',
      textSpeed: '文字速度',
      autoPlay: '自動播放',
      game: '遊戲',
      tutorialHints: '教學提示',
      confirmChoices: '確認選擇',
    },
    pause: {
      title: '暫停',
      resume: '繼續遊戲',
      inventory: '物品欄',
      save: '保存遊戲',
      load: '讀取存檔',
      settings: '設定',
      mainMenu: '返回主選單',
    },
    inventory: {
      title: '物品欄',
      empty: '暫無物品',
      archive: '檔案',
      item: '道具',
      prayer: '禱文',
      verdict: '判詞',
    },
    ability: {
      depthPerception: '深度感知',
      depthIntervention: '深度介入',
      timeIntervention: '時間干預',
      locked: '未解鎖',
      cooldown: '冷卻中',
    },
    dialogue: {
      skip: '跳過',
      auto: '自動',
      log: '歷史',
    },
    save: {
      title: '存檔管理',
      slot: '存檔槽',
      empty: '空',
      autoSave: '自動存檔',
      quickSave: '快速存檔',
      overwrite: '覆蓋存檔？',
      loadConfirm: '確定讀取此存檔？',
      deleteConfirm: '確定刪除此存檔？',
    },
    achievement: {
      title: '成就',
      unlocked: '已解鎖',
      locked: '未解鎖',
      hidden: '???',
    },
    tutorial: {
      movement: '使用 WASD 或方向鍵移動角色',
      interaction: '靠近物體後點擊進行互動',
      dialogue: '點擊螢幕或按空白鍵推進對話',
      card: '收集的卡片會記錄重要資訊',
      skip: '跳過',
      skipAll: '跳過全部',
    },
    system: {
      saving: '保存中...',
      saved: '已保存',
      loading: '載入中...',
      loaded: '已載入',
      error: '發生錯誤',
      offline: '離線模式',
    },
  },
  'en-US': {
    common: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      back: 'Back',
      close: 'Close',
      save: 'Save',
      load: 'Load',
      settings: 'Settings',
      continue: 'Continue',
      newGame: 'New Game',
      quit: 'Quit',
    },
    menu: {
      title: 'Footnote',
      subtitle: '备注',
      continueGame: 'Continue',
      newGame: 'New Game',
      loadGame: 'Load Game',
      settings: 'Settings',
      credits: 'Credits',
      exit: 'Exit',
    },
    settings: {
      title: 'Settings',
      audio: 'Audio',
      bgmVolume: 'BGM Volume',
      sfxVolume: 'SFX Volume',
      ambienceVolume: 'Ambience Volume',
      display: 'Display',
      language: 'Language',
      textSpeed: 'Text Speed',
      autoPlay: 'Auto Play',
      game: 'Game',
      tutorialHints: 'Tutorial Hints',
      confirmChoices: 'Confirm Choices',
    },
    pause: {
      title: 'Paused',
      resume: 'Resume',
      inventory: 'Inventory',
      save: 'Save Game',
      load: 'Load Game',
      settings: 'Settings',
      mainMenu: 'Main Menu',
    },
    inventory: {
      title: 'Inventory',
      empty: 'No items',
      archive: 'Archives',
      item: 'Items',
      prayer: 'Prayers',
      verdict: 'Verdicts',
    },
    ability: {
      depthPerception: 'Depth Perception',
      depthIntervention: 'Depth Intervention',
      timeIntervention: 'Time Intervention',
      locked: 'Locked',
      cooldown: 'Cooldown',
    },
    dialogue: {
      skip: 'Skip',
      auto: 'Auto',
      log: 'Log',
    },
    save: {
      title: 'Save Manager',
      slot: 'Slot',
      empty: 'Empty',
      autoSave: 'Auto Save',
      quickSave: 'Quick Save',
      overwrite: 'Overwrite save?',
      loadConfirm: 'Load this save?',
      deleteConfirm: 'Delete this save?',
    },
    achievement: {
      title: 'Achievements',
      unlocked: 'Unlocked',
      locked: 'Locked',
      hidden: '???',
    },
    tutorial: {
      movement: 'Use WASD or arrow keys to move',
      interaction: 'Click to interact with nearby objects',
      dialogue: 'Click or press space to advance dialogue',
      card: 'Collected cards record important information',
      skip: 'Skip',
      skipAll: 'Skip All',
    },
    system: {
      saving: 'Saving...',
      saved: 'Saved',
      loading: 'Loading...',
      loaded: 'Loaded',
      error: 'Error occurred',
      offline: 'Offline Mode',
    },
  },
  'ja-JP': {
    common: {
      confirm: '確認',
      cancel: 'キャンセル',
      back: '戻る',
      close: '閉じる',
      save: 'セーブ',
      load: 'ロード',
      settings: '設定',
      continue: '続ける',
      newGame: 'ニューゲーム',
      quit: '終了',
    },
    menu: {
      title: '備註',
      subtitle: 'Footnote',
      continueGame: 'ゲームを続ける',
      newGame: 'ニューゲーム',
      loadGame: 'ロード',
      settings: '設定',
      credits: 'クレジット',
      exit: '終了',
    },
    settings: {
      title: '設定',
      audio: 'オーディオ',
      bgmVolume: 'BGM音量',
      sfxVolume: '効果音音量',
      ambienceVolume: '環境音音量',
      display: '表示',
      language: '言語',
      textSpeed: 'テキスト速度',
      autoPlay: 'オートプレイ',
      game: 'ゲーム',
      tutorialHints: 'チュートリアルヒント',
      confirmChoices: '選択確認',
    },
    pause: {
      title: 'ポーズ',
      resume: '続ける',
      inventory: 'インベントリ',
      save: 'セーブ',
      load: 'ロード',
      settings: '設定',
      mainMenu: 'メインメニュー',
    },
    inventory: {
      title: 'インベントリ',
      empty: 'アイテムなし',
      archive: 'アーカイブ',
      item: 'アイテム',
      prayer: '祈り',
      verdict: '判決',
    },
    ability: {
      depthPerception: '深度知覚',
      depthIntervention: '深度介入',
      timeIntervention: '時間干渉',
      locked: '未解放',
      cooldown: 'クールダウン',
    },
    dialogue: {
      skip: 'スキップ',
      auto: 'オート',
      log: 'ログ',
    },
    save: {
      title: 'セーブ管理',
      slot: 'スロット',
      empty: '空',
      autoSave: 'オートセーブ',
      quickSave: 'クイックセーブ',
      overwrite: '上書きしますか？',
      loadConfirm: 'このセーブをロードしますか？',
      deleteConfirm: 'このセーブを削除しますか？',
    },
    achievement: {
      title: '実績',
      unlocked: '解放済み',
      locked: '未解放',
      hidden: '???',
    },
    tutorial: {
      movement: 'WASDまたは矢印キーで移動',
      interaction: '近づいてクリックでインタラクト',
      dialogue: 'クリックまたはスペースで会話を進める',
      card: '集めたカードは重要な情報を記録',
      skip: 'スキップ',
      skipAll: '全てスキップ',
    },
    system: {
      saving: 'セーブ中...',
      saved: 'セーブ完了',
      loading: 'ロード中...',
      loaded: 'ロード完了',
      error: 'エラーが発生しました',
      offline: 'オフラインモード',
    },
  },
};

/**
 * 语言名称映射
 */
export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en-US': 'English',
  'ja-JP': '日本語',
};

/**
 * 国际化管理器
 */
class I18nManager {
  private _currentLocale: SupportedLocale = 'zh-CN';
  private _fallbackLocale: SupportedLocale = 'zh-CN';
  private _translations: Map<SupportedLocale, ITranslation> = new Map();
  private _listeners: Set<() => void> = new Set();
  private _missingTranslations: IMissingTranslation[] = [];
  private _maxMissingRecords: number = 100;
  private _warnOnMissing: boolean = true;

  /** 数字格式化器缓存 */
  private _numberFormatters: Map<string, Intl.NumberFormat> = new Map();
  /** 日期格式化器缓存 */
  private _dateFormatters: Map<string, Intl.DateTimeFormat> = new Map();
  /** 复数规则缓存 */
  private _pluralRules: Map<SupportedLocale, Intl.PluralRules> = new Map();

  constructor() {
    // 加载内置翻译
    Object.entries(BUILT_IN_TRANSLATIONS).forEach(([locale, translations]) => {
      this._translations.set(locale as SupportedLocale, translations);
    });

    // 初始化复数规则
    this._initPluralRules();

    // 检测系统语言
    this._detectLocale();
  }

  /**
   * 初始化复数规则
   */
  private _initPluralRules(): void {
    for (const locale of this.getSupportedLocales()) {
      try {
        this._pluralRules.set(locale, new Intl.PluralRules(locale));
      } catch {
        // 如果不支持该语言，使用英语规则
        this._pluralRules.set(locale, new Intl.PluralRules('en'));
      }
    }
  }

  /**
   * 检测系统语言
   */
  private _detectLocale(): void {
    // 先检查本地存储
    const stored = localStorage.getItem('footnote_locale');
    if (stored && this._isValidLocale(stored)) {
      this._currentLocale = stored as SupportedLocale;
      return;
    }

    // 检测浏览器语言
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) {
      this._currentLocale =
        browserLang.includes('TW') || browserLang.includes('HK') ? 'zh-TW' : 'zh-CN';
    } else if (browserLang.startsWith('ja')) {
      this._currentLocale = 'ja-JP';
    } else if (browserLang.startsWith('en')) {
      this._currentLocale = 'en-US';
    }
  }

  /**
   * 验证语言代码
   */
  private _isValidLocale(locale: string): locale is SupportedLocale {
    return ['zh-CN', 'zh-TW', 'en-US', 'ja-JP'].includes(locale);
  }

  /**
   * 获取翻译文本
   * @param key 键路径，如 'menu.title' 或 'common.confirm'
   * @param params 插值参数，支持 {param} 和 {{param}} 两种格式
   */
  public t(key: string, params?: Record<string, string | number>): string {
    const value =
      this._getValue(key, this._currentLocale) || this._getValue(key, this._fallbackLocale);

    if (typeof value !== 'string') {
      this._recordMissingTranslation(key);
      return key;
    }

    // 处理参数插值，支持 {param} 和 {{param}} 两种格式
    if (params) {
      return value
        .replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
          return String(params[paramKey] ?? `{{${paramKey}}}`);
        })
        .replace(/\{(\w+)\}/g, (_, paramKey) => {
          return String(params[paramKey] ?? `{${paramKey}}`);
        });
    }

    return value;
  }

  /**
   * 检查翻译键是否存在
   * @param key 键路径
   * @param locale 可选，指定语言（默认当前语言）
   */
  public exists(key: string, locale?: SupportedLocale): boolean {
    const targetLocale = locale || this._currentLocale;
    const value = this._getValue(key, targetLocale);
    return typeof value === 'string';
  }

  /**
   * 复数形式翻译
   * @param key 键路径（翻译值应为对象，包含 zero/one/two/few/many/other）
   * @param count 数量
   * @param params 其他插值参数
   * @example
   * // 翻译定义: { "items": { "zero": "没有物品", "one": "{count}个物品", "other": "{count}个物品" } }
   * i18n.tp('items', 0)  // "没有物品"
   * i18n.tp('items', 1)  // "1个物品"
   * i18n.tp('items', 5)  // "5个物品"
   */
  public tp(key: string, count: number, params?: Record<string, string | number>): string {
    const pluralValue = this._getValue(key, this._currentLocale) as IPluralTranslation | undefined;

    if (!pluralValue || typeof pluralValue !== 'object') {
      // 如果不是复数对象，尝试作为普通翻译
      return this.t(key, { ...params, count });
    }

    const category = this._getPluralCategory(count);
    const template =
      pluralValue[category] ||
      pluralValue.other ||
      this._getValue(key, this._fallbackLocale) ||
      key;

    if (typeof template !== 'string') {
      return key;
    }

    // 自动添加 count 到参数
    return this._interpolate(template, { ...params, count });
  }

  /**
   * 获取复数分类
   */
  private _getPluralCategory(count: number): PluralCategory {
    const rules = this._pluralRules.get(this._currentLocale);
    if (!rules) return 'other';
    return rules.select(count) as PluralCategory;
  }

  /**
   * 插值替换
   */
  private _interpolate(template: string, params: Record<string, string | number>): string {
    return template
      .replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return String(params[paramKey] ?? `{{${paramKey}}}`);
      })
      .replace(/\{(\w+)\}/g, (_, paramKey) => {
        return String(params[paramKey] ?? `{${paramKey}}`);
      });
  }

  /**
   * 带上下文的翻译
   * @param key 键路径
   * @param context 上下文（如性别、正式程度）
   * @param params 插值参数
   * @example
   * // 翻译定义: { "greeting": { "male": "先生，您好", "female": "女士，您好", "default": "您好" } }
   * i18n.tc('greeting', { gender: 'male' })  // "先生，您好"
   */
  public tc(
    key: string,
    context: ITranslationContext,
    params?: Record<string, string | number>
  ): string {
    // 尝试查找带上下文的翻译
    const contextKeys = Object.entries(context)
      .filter(([, v]) => v !== undefined)
      .map(([_k, v]) => `${key}.${v}`);

    for (const contextKey of contextKeys) {
      const value = this._getValue(contextKey, this._currentLocale);
      if (typeof value === 'string') {
        return params ? this._interpolate(value, params) : value;
      }
    }

    // 回退到默认翻译
    const defaultValue =
      this._getValue(`${key}.default`, this._currentLocale) ||
      this._getValue(key, this._currentLocale);

    if (typeof defaultValue === 'string') {
      return params ? this._interpolate(defaultValue, params) : defaultValue;
    }

    return this.t(key, params);
  }

  /**
   * 格式化数字
   * @param value 数值
   * @param options 格式化选项
   */
  public formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    const cacheKey = `${this._currentLocale}-${JSON.stringify(options || {})}`;

    if (!this._numberFormatters.has(cacheKey)) {
      this._numberFormatters.set(cacheKey, new Intl.NumberFormat(this._currentLocale, options));
    }

    return this._numberFormatters.get(cacheKey)!.format(value);
  }

  /**
   * 格式化货币
   * @param value 金额
   * @param currency 货币代码（默认根据语言推断）
   */
  public formatCurrency(value: number, currency?: string): string {
    const defaultCurrency = this._getDefaultCurrency();
    return this.formatNumber(value, {
      style: 'currency',
      currency: currency || defaultCurrency,
    });
  }

  /**
   * 格式化百分比
   * @param value 小数值（0-1）
   * @param decimals 小数位数
   */
  public formatPercent(value: number, decimals = 0): string {
    return this.formatNumber(value, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * 格式化日期
   * @param date 日期对象或时间戳
   * @param options 格式化选项
   */
  public formatDate(date: Date | number, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    const cacheKey = `${this._currentLocale}-date-${JSON.stringify(options || {})}`;

    if (!this._dateFormatters.has(cacheKey)) {
      this._dateFormatters.set(cacheKey, new Intl.DateTimeFormat(this._currentLocale, options));
    }

    return this._dateFormatters.get(cacheKey)!.format(dateObj);
  }

  /**
   * 格式化相对时间（如"3分钟前"、"2小时后"）
   * @param date 目标日期
   * @param baseDate 基准日期（默认当前时间）
   */
  public formatRelativeTime(date: Date | number, baseDate?: Date | number): string {
    const target = typeof date === 'number' ? date : date.getTime();
    const base = baseDate
      ? typeof baseDate === 'number'
        ? baseDate
        : baseDate.getTime()
      : Date.now();
    const diff = target - base;
    const absDiff = Math.abs(diff);
    const isPast = diff < 0;

    // 定义时间单位（毫秒）
    const units: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
      { unit: 'second', ms: 1000 },
      { unit: 'minute', ms: 60 * 1000 },
      { unit: 'hour', ms: 60 * 60 * 1000 },
      { unit: 'day', ms: 24 * 60 * 60 * 1000 },
      { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
      { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
      { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
    ];

    // 找到合适的单位
    let selectedUnit = units[0];
    let value = absDiff / selectedUnit.ms;

    for (let i = units.length - 1; i >= 0; i--) {
      if (absDiff >= units[i].ms) {
        selectedUnit = units[i];
        value = Math.round(absDiff / selectedUnit.ms);
        break;
      }
    }

    try {
      const rtf = new Intl.RelativeTimeFormat(this._currentLocale, { numeric: 'auto' });
      return rtf.format(isPast ? -value : value, selectedUnit.unit);
    } catch {
      // 回退到简单格式
      const timeStr = `${value} ${selectedUnit.unit}${value !== 1 ? 's' : ''}`;
      return isPast ? `${timeStr} ago` : `in ${timeStr}`;
    }
  }

  /**
   * 格式化序数（如"第1"、"第2"）
   * @param value 数值
   */
  public formatOrdinal(value: number): string {
    // 中文/日文直接用"第X"
    if (this._currentLocale.startsWith('zh') || this._currentLocale.startsWith('ja')) {
      return `第${value}`;
    }

    // 英文使用序数后缀
    if (this._currentLocale.startsWith('en')) {
      const suffixes: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
      const rules = this._pluralRules.get(this._currentLocale);
      const category = rules?.select(value) || 'other';

      // 特殊处理 11, 12, 13
      if (value % 100 >= 11 && value % 100 <= 13) {
        return `${value}th`;
      }

      return `${value}${suffixes[category] || 'th'}`;
    }

    return String(value);
  }

  /**
   * 获取默认货币
   */
  private _getDefaultCurrency(): string {
    const currencyMap: Record<SupportedLocale, string> = {
      'zh-CN': 'CNY',
      'zh-TW': 'TWD',
      'en-US': 'USD',
      'ja-JP': 'JPY',
    };
    return currencyMap[this._currentLocale] || 'USD';
  }

  /**
   * 获取当前语言的书写方向
   */
  public getTextDirection(): 'ltr' | 'rtl' {
    // 当前支持的语言都是从左到右
    // 如果将来添加阿拉伯语等RTL语言，需要更新此方法
    return 'ltr';
  }

  /**
   * 获取当前语言的显示名称
   */
  public getLocaleName(locale?: SupportedLocale): string {
    return LOCALE_NAMES[locale || this._currentLocale];
  }

  /**
   * 批量翻译多个键
   * @param keys 翻译键数组
   * @param params 共享的插值参数
   */
  public tMany(keys: string[], params?: Record<string, string | number>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key of keys) {
      result[key] = this.t(key, params);
    }
    return result;
  }

  /**
   * 获取命名空间下的所有翻译
   * @param namespace 命名空间，如 'menu', 'settings'
   * @param locale 可选，指定语言（默认当前语言）
   */
  public tAll(namespace: string, locale?: SupportedLocale): Record<string, string> {
    const targetLocale = locale || this._currentLocale;
    const value = this._getValue(namespace, targetLocale);

    if (typeof value !== 'object' || value === null) {
      return {};
    }

    const result: Record<string, string> = {};
    this._flattenTranslations(value as ITranslation, '', result);
    return result;
  }

  /**
   * 扁平化翻译对象
   */
  private _flattenTranslations(
    obj: ITranslation,
    prefix: string,
    result: Record<string, string>
  ): void {
    for (const key in obj) {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string') {
        result[fullKey] = value;
      } else if (typeof value === 'object' && value !== null) {
        this._flattenTranslations(value as ITranslation, fullKey, result);
      }
    }
  }

  /**
   * 获取嵌套值
   */
  private _getValue(key: string, locale: SupportedLocale): string | ITranslation | undefined {
    const translations = this._translations.get(locale);
    if (!translations) return undefined;

    const keys = key.split('.');
    let current: string | ITranslation = translations;

    for (const k of keys) {
      if (typeof current !== 'object' || !(k in current)) {
        return undefined;
      }
      current = current[k];
    }

    return current;
  }

  /**
   * 记录缺失的翻译
   */
  private _recordMissingTranslation(key: string): void {
    // 检查是否已记录
    const exists = this._missingTranslations.some(
      (m) => m.key === key && m.locale === this._currentLocale
    );

    if (!exists) {
      this._missingTranslations.push({
        key,
        locale: this._currentLocale,
        timestamp: Date.now(),
      });

      // 限制记录数量
      if (this._missingTranslations.length > this._maxMissingRecords) {
        this._missingTranslations.shift();
      }

      // 输出警告
      if (this._warnOnMissing) {
        console.warn(`[I18n] Missing translation: "${key}" for locale "${this._currentLocale}"`);
      }
    }
  }

  /**
   * 获取缺失翻译记录
   */
  public getMissingTranslations(): ReadonlyArray<IMissingTranslation> {
    return [...this._missingTranslations];
  }

  /**
   * 清除缺失翻译记录
   */
  public clearMissingTranslations(): void {
    this._missingTranslations = [];
  }

  /**
   * 设置是否在缺失翻译时输出警告
   */
  public setWarnOnMissing(warn: boolean): void {
    this._warnOnMissing = warn;
  }

  /**
   * 设置当前语言
   */
  public setLocale(locale: SupportedLocale): void {
    if (this._currentLocale === locale) return;

    const previousLocale = this._currentLocale;
    this._currentLocale = locale;
    localStorage.setItem('footnote_locale', locale);

    // 通过 EventBus 发出事件
    eventBus.emitTyped(GameEvent.LOCALE_CHANGED, {
      locale,
      previousLocale,
    });

    // 通知内部监听器
    this._listeners.forEach((listener) => listener());

    console.log(`[I18n] 语言切换为: ${LOCALE_NAMES[locale]}`);
  }

  /**
   * 获取当前语言
   */
  public getLocale(): SupportedLocale {
    return this._currentLocale;
  }

  /**
   * 获取回退语言
   */
  public getFallbackLocale(): SupportedLocale {
    return this._fallbackLocale;
  }

  /**
   * 设置回退语言
   */
  public setFallbackLocale(locale: SupportedLocale): void {
    this._fallbackLocale = locale;
  }

  /**
   * 获取所有支持的语言
   */
  public getSupportedLocales(): SupportedLocale[] {
    return ['zh-CN', 'zh-TW', 'en-US', 'ja-JP'];
  }

  /**
   * 添加语言变化监听器
   */
  public onLocaleChange(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * 加载额外翻译（用于叙事内容、对话等）
   * @param locale 目标语言
   * @param config 翻译加载配置
   */
  public loadTranslations(locale: SupportedLocale, config: ITranslationLoadConfig): void {
    const existing = this._translations.get(locale) || {};
    const { data, namespace } = config;

    let mergedData: ITranslation;

    if (namespace) {
      // 如果指定了命名空间，将数据放在该命名空间下
      mergedData = this._mergeDeep(existing, { [namespace]: data });
    } else {
      mergedData = this._mergeDeep(existing, data);
    }

    this._translations.set(locale, mergedData);
    console.log(
      `[I18n] 加载翻译: ${locale}${namespace ? ` (namespace: ${namespace})` : ''}, 键数: ${this._countKeys(data)}`
    );
  }

  /**
   * 批量加载多语言翻译
   * @param translations 语言到翻译数据的映射
   * @param namespace 可选命名空间
   */
  public loadMultipleTranslations(
    translations: Partial<Record<SupportedLocale, ITranslation>>,
    namespace?: string
  ): void {
    for (const [locale, data] of Object.entries(translations)) {
      if (this._isValidLocale(locale) && data) {
        this.loadTranslations(locale as SupportedLocale, { data, namespace });
      }
    }
  }

  /**
   * 异步加载翻译文件
   * @param locale 目标语言
   * @param url 翻译文件 URL
   * @param namespace 可选命名空间
   */
  public async loadTranslationsFromUrl(
    locale: SupportedLocale,
    url: string,
    namespace?: string
  ): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load translations: ${response.statusText}`);
      }
      const data = (await response.json()) as ITranslation;
      this.loadTranslations(locale, { data, namespace });
    } catch (error) {
      console.error(`[I18n] 加载翻译失败: ${url}`, error);
      throw error;
    }
  }

  /**
   * 卸载指定命名空间的翻译
   * @param namespace 命名空间
   * @param locale 可选，指定语言（默认所有语言）
   */
  public unloadTranslations(namespace: string, locale?: SupportedLocale): void {
    const localesToProcess = locale ? [locale] : this.getSupportedLocales();

    for (const loc of localesToProcess) {
      const translations = this._translations.get(loc);
      if (translations && namespace in translations) {
        delete translations[namespace];
        console.log(`[I18n] 卸载翻译: ${loc} (namespace: ${namespace})`);
      }
    }
  }

  /**
   * 统计翻译键数量
   */
  private _countKeys(obj: ITranslation): number {
    let count = 0;
    for (const value of Object.values(obj)) {
      if (typeof value === 'string') {
        count++;
      } else if (typeof value === 'object' && value !== null) {
        count += this._countKeys(value as ITranslation);
      }
    }
    return count;
  }

  /**
   * 深度合并对象
   */
  private _mergeDeep(target: ITranslation, source: ITranslation): ITranslation {
    const result = { ...target };
    for (const key in source) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        result[key] = this._mergeDeep(
          (result[key] as ITranslation) || {},
          source[key] as ITranslation
        );
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  /**
   * 获取翻译统计信息
   */
  public getStats(): {
    locale: SupportedLocale;
    totalKeys: Record<SupportedLocale, number>;
    missingCount: number;
  } {
    const totalKeys: Record<SupportedLocale, number> = {} as Record<SupportedLocale, number>;

    for (const locale of this.getSupportedLocales()) {
      const translations = this._translations.get(locale);
      totalKeys[locale] = translations ? this._countKeys(translations) : 0;
    }

    return {
      locale: this._currentLocale,
      totalKeys,
      missingCount: this._missingTranslations.length,
    };
  }

  /**
   * 重置为默认状态
   */
  public reset(): void {
    this._currentLocale = 'zh-CN';
    this._fallbackLocale = 'zh-CN';
    this._translations.clear();
    this._missingTranslations = [];
    this._listeners.clear();

    // 重新加载内置翻译
    Object.entries(BUILT_IN_TRANSLATIONS).forEach(([locale, translations]) => {
      this._translations.set(locale as SupportedLocale, translations);
    });

    // 重新检测系统语言
    this._detectLocale();
  }
}

// 单例导出
export const i18n = new I18nManager();

/**
 * 翻译函数快捷方式
 */
export const t = (key: string, params?: Record<string, string | number>): string => {
  return i18n.t(key, params);
};
