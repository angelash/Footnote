/**
 * 国际化管理器
 * 支持多语言切换和动态加载
 * @module systems/i18n/I18nManager
 */

export type SupportedLocale = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP';

interface ITranslation {
  [key: string]: string | ITranslation;
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

  constructor() {
    // 加载内置翻译
    Object.entries(BUILT_IN_TRANSLATIONS).forEach(([locale, translations]) => {
      this._translations.set(locale as SupportedLocale, translations);
    });

    // 检测系统语言
    this._detectLocale();
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
      this._currentLocale = browserLang.includes('TW') || browserLang.includes('HK') ? 'zh-TW' : 'zh-CN';
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
   * @param params 插值参数
   */
  public t(key: string, params?: Record<string, string | number>): string {
    const value = this._getValue(key, this._currentLocale) || this._getValue(key, this._fallbackLocale) || key;

    if (typeof value !== 'string') {
      return key;
    }

    // 处理参数插值 {{param}}
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return String(params[paramKey] ?? `{{${paramKey}}}`);
      });
    }

    return value;
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
   * 设置当前语言
   */
  public setLocale(locale: SupportedLocale): void {
    if (this._currentLocale === locale) return;

    this._currentLocale = locale;
    localStorage.setItem('footnote_locale', locale);

    // 通知监听器
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
   * 加载额外翻译（用于叙事内容等）
   */
  public loadTranslations(locale: SupportedLocale, translations: ITranslation): void {
    const existing = this._translations.get(locale) || {};
    this._translations.set(locale, this._mergeDeep(existing, translations));
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
}

// 单例导出
export const i18n = new I18nManager();

/**
 * 翻译函数快捷方式
 */
export const t = (key: string, params?: Record<string, string | number>): string => {
  return i18n.t(key, params);
};

