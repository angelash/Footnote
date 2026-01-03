/**
 * 存档管理器
 * 使用IndexedDB进行本地存储，支持多槽位存档
 * @module systems/save/SaveManager
 */

import { eventBus, GameEvent } from '@/systems/EventBus';
import { worldState } from '@/systems/world';
import { narrativeEngine } from '@/systems/narrative';
import type { IWorldStateData } from '@/systems/world';
import type { IForeshadowState } from '@/systems/narrative';

// ==================== 配置常量 ====================

const CONFIG = {
  /** IndexedDB数据库名 */
  DB_NAME: 'FootnoteGameDB',
  /** 数据库版本 */
  DB_VERSION: 1,
  /** 存档Store名 */
  SAVE_STORE: 'saves',
  /** 设置Store名 */
  SETTINGS_STORE: 'settings',
  /** 最大存档槽数 */
  MAX_SLOTS: 5,
  /** 自动存档槽ID */
  AUTO_SAVE_SLOT: 0,
  /** 存档版本号 */
  SAVE_VERSION: 1,
};

// ==================== 类型定义 ====================

/**
 * 游戏设置
 */
export interface IGameSettings {
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  autoPlay: boolean;
  autoPlayDelay: number;
  language: string;
  showTutorials: boolean;
}

/**
 * 序列化的叙事状态（用于存档）
 */
interface INarrativeStateSerialized {
  obtainedCards: string[];
  viewedCards: string[];
  foreshadowStates: Record<string, IForeshadowState>;
  dialogueHistory: string[];
}

/**
 * 完整存档数据
 */
export interface ISaveData {
  /** 存档版本 */
  version: number;
  /** 存档槽位 */
  slot: number;
  /** 存档时间戳 */
  timestamp: number;
  /** 存档名称（可自定义） */
  name: string;
  /** 游戏时长（秒） */
  playTime: number;
  /** 当前章节 */
  chapter: string;
  /** 当前Zone */
  currentZone: string;
  /** 世界状态 */
  worldState: IWorldStateData;
  /** 叙事状态 */
  narrativeState: INarrativeStateSerialized;
  /** 截图数据（base64） */
  screenshot?: string;
}

/**
 * 存档元数据（用于列表显示）
 */
export interface ISaveMetadata {
  slot: number;
  name: string;
  timestamp: number;
  playTime: number;
  chapter: string;
  currentZone: string;
  hasScreenshot: boolean;
}

// ==================== SaveManager类 ====================

/**
 * 存档管理器
 */
class SaveManager {
  private static _instance: SaveManager | null = null;
  private _db: IDBDatabase | null = null;
  private _isInitialized: boolean = false;
  private _settings: IGameSettings;

  private constructor() {
    this._settings = this._getDefaultSettings();
  }

  static getInstance(): SaveManager {
    if (!SaveManager._instance) {
      SaveManager._instance = new SaveManager();
    }
    return SaveManager._instance;
  }

  // ==================== 初始化 ====================

  /**
   * 初始化存档系统
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      this._db = await this._openDatabase();
      await this._loadSettings();
      this._isInitialized = true;
      console.log('[SaveManager] 初始化完成');
    } catch (error) {
      console.error('[SaveManager] 初始化失败:', error);
      // 回退到LocalStorage
      this._fallbackToLocalStorage();
    }
  }

  // ==================== 存档操作 ====================

  /**
   * 保存游戏
   */
  async save(slot: number, name?: string, screenshot?: string): Promise<boolean> {
    if (slot < 0 || slot > CONFIG.MAX_SLOTS) {
      console.error(`[SaveManager] 无效的存档槽位: ${slot}`);
      return false;
    }

    eventBus.emit(GameEvent.SAVE_START, { slot });

    try {
      const saveData: ISaveData = {
        version: CONFIG.SAVE_VERSION,
        slot,
        timestamp: Date.now(),
        name: name || this._generateSaveName(slot),
        playTime: worldState.getPlayTime(),
        chapter: worldState.getState().currentChapter,
        currentZone: worldState.getCurrentZone(),
        worldState: worldState.serialize(),
        narrativeState: narrativeEngine.serialize(),
        screenshot,
      };

      await this._writeSave(saveData);

      eventBus.emit(GameEvent.SAVE_COMPLETE, {
        slot,
        timestamp: saveData.timestamp,
      });

      console.log(`[SaveManager] 存档成功: 槽位${slot}`);
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      eventBus.emit(GameEvent.SAVE_ERROR, { slot, error: errorMsg });
      console.error(`[SaveManager] 存档失败:`, error);
      return false;
    }
  }

  /**
   * 自动存档
   */
  async autoSave(): Promise<boolean> {
    return this.save(CONFIG.AUTO_SAVE_SLOT, '自动存档');
  }

  /**
   * 加载存档
   */
  async load(slot: number): Promise<boolean> {
    try {
      const saveData = await this._readSave(slot);
      if (!saveData) {
        console.warn(`[SaveManager] 槽位${slot}没有存档`);
        return false;
      }

      // 版本迁移（如需要）
      const migratedData = this._migrateSaveData(saveData);

      // 恢复状态
      worldState.restore(migratedData.worldState);
      narrativeEngine.restore(migratedData.narrativeState);

      console.log(`[SaveManager] 加载成功: 槽位${slot}`);
      return true;
    } catch (error) {
      console.error(`[SaveManager] 加载失败:`, error);
      return false;
    }
  }

  /**
   * 删除存档
   */
  async deleteSave(slot: number): Promise<boolean> {
    try {
      await this._deleteSave(slot);
      console.log(`[SaveManager] 删除成功: 槽位${slot}`);
      return true;
    } catch (error) {
      console.error(`[SaveManager] 删除失败:`, error);
      return false;
    }
  }

  /**
   * 获取所有存档元数据
   */
  async getSaveList(): Promise<ISaveMetadata[]> {
    const saves: ISaveMetadata[] = [];

    for (let slot = 0; slot <= CONFIG.MAX_SLOTS; slot++) {
      try {
        const saveData = await this._readSave(slot);
        if (saveData) {
          saves.push({
            slot: saveData.slot,
            name: saveData.name,
            timestamp: saveData.timestamp,
            playTime: saveData.playTime,
            chapter: saveData.chapter,
            currentZone: saveData.currentZone,
            hasScreenshot: !!saveData.screenshot,
          });
        }
      } catch {
        // 跳过读取失败的槽位
      }
    }

    return saves;
  }

  /**
   * 检查槽位是否有存档
   */
  async hasSave(slot: number): Promise<boolean> {
    const saveData = await this._readSave(slot);
    return saveData !== null;
  }

  // ==================== 设置操作 ====================

  /**
   * 获取当前设置
   */
  getSettings(): IGameSettings {
    return { ...this._settings };
  }

  /**
   * 更新设置
   */
  async updateSettings(partial: Partial<IGameSettings>): Promise<void> {
    this._settings = { ...this._settings, ...partial };
    await this._saveSettings();
    eventBus.emit(GameEvent.SETTINGS_UPDATE, { settings: this._settings });
  }

  /**
   * 重置设置为默认值
   */
  async resetSettings(): Promise<void> {
    this._settings = this._getDefaultSettings();
    await this._saveSettings();
    eventBus.emit(GameEvent.SETTINGS_UPDATE, { settings: this._settings });
  }

  // ==================== 私有方法 - IndexedDB ====================

  private _openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

      request.onerror = () => {
        reject(new Error('无法打开IndexedDB'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建存档Store
        if (!db.objectStoreNames.contains(CONFIG.SAVE_STORE)) {
          db.createObjectStore(CONFIG.SAVE_STORE, { keyPath: 'slot' });
        }

        // 创建设置Store
        if (!db.objectStoreNames.contains(CONFIG.SETTINGS_STORE)) {
          db.createObjectStore(CONFIG.SETTINGS_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  private async _writeSave(saveData: ISaveData): Promise<void> {
    if (!this._db) {
      this._writeToLocalStorage(`save_${saveData.slot}`, saveData);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction([CONFIG.SAVE_STORE], 'readwrite');
      const store = transaction.objectStore(CONFIG.SAVE_STORE);
      const request = store.put(saveData);

      request.onerror = () => reject(new Error('写入存档失败'));
      request.onsuccess = () => resolve();
    });
  }

  private async _readSave(slot: number): Promise<ISaveData | null> {
    if (!this._db) {
      return this._readFromLocalStorage(`save_${slot}`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction([CONFIG.SAVE_STORE], 'readonly');
      const store = transaction.objectStore(CONFIG.SAVE_STORE);
      const request = store.get(slot);

      request.onerror = () => reject(new Error('读取存档失败'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async _deleteSave(slot: number): Promise<void> {
    if (!this._db) {
      localStorage.removeItem(`footnote_save_${slot}`);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction([CONFIG.SAVE_STORE], 'readwrite');
      const store = transaction.objectStore(CONFIG.SAVE_STORE);
      const request = store.delete(slot);

      request.onerror = () => reject(new Error('删除存档失败'));
      request.onsuccess = () => resolve();
    });
  }

  // ==================== 私有方法 - 设置 ====================

  private async _loadSettings(): Promise<void> {
    if (!this._db) {
      const stored = this._readFromLocalStorage('settings');
      if (stored) {
        this._settings = { ...this._getDefaultSettings(), ...stored };
      }
      return;
    }

    return new Promise((resolve) => {
      const transaction = this._db!.transaction([CONFIG.SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(CONFIG.SETTINGS_STORE);
      const request = store.get('game_settings');

      request.onsuccess = () => {
        if (request.result) {
          this._settings = { ...this._getDefaultSettings(), ...request.result.data };
        }
        resolve();
      };

      request.onerror = () => {
        console.warn('[SaveManager] 加载设置失败，使用默认值');
        resolve();
      };
    });
  }

  private async _saveSettings(): Promise<void> {
    if (!this._db) {
      this._writeToLocalStorage('settings', this._settings);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction([CONFIG.SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(CONFIG.SETTINGS_STORE);
      const request = store.put({ id: 'game_settings', data: this._settings });

      request.onerror = () => reject(new Error('保存设置失败'));
      request.onsuccess = () => resolve();
    });
  }

  private _getDefaultSettings(): IGameSettings {
    return {
      masterVolume: 0.8,
      bgmVolume: 0.7,
      sfxVolume: 0.8,
      textSpeed: 'normal',
      autoPlay: false,
      autoPlayDelay: 2000,
      language: 'zh-CN',
      showTutorials: true,
    };
  }

  // ==================== 私有方法 - LocalStorage回退 ====================

  private _fallbackToLocalStorage(): void {
    console.warn('[SaveManager] 使用LocalStorage作为回退存储');
    this._isInitialized = true;
  }

  private _writeToLocalStorage(key: string, data: unknown): void {
    try {
      localStorage.setItem(`footnote_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('[SaveManager] LocalStorage写入失败:', error);
    }
  }

  private _readFromLocalStorage<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(`footnote_${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // ==================== 私有方法 - 版本迁移 ====================

  private _migrateSaveData(saveData: ISaveData): ISaveData {
    // 版本迁移逻辑
    if (saveData.version < CONFIG.SAVE_VERSION) {
      console.log(`[SaveManager] 迁移存档: v${saveData.version} -> v${CONFIG.SAVE_VERSION}`);

      // 根据版本差异进行迁移
      // if (saveData.version < 2) { ... }

      saveData.version = CONFIG.SAVE_VERSION;
    }

    return saveData;
  }

  private _generateSaveName(slot: number): string {
    if (slot === CONFIG.AUTO_SAVE_SLOT) {
      return '自动存档';
    }

    const chapter = worldState.getState().currentChapter;
    const zone = worldState.getCurrentZone();
    return `${chapter} - ${zone}`;
  }
}

// 导出单例
export const saveManager = SaveManager.getInstance();
