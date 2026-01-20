/**
 * 存档管理器
 * 使用IndexedDB进行本地存储，支持多槽位存档
 * @module systems/save/SaveManager
 */

import { createLogger } from '@/utils/Logger';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { safeStorage } from '@/systems/storage';

const logger = createLogger('SaveManager');
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
  /** SA-003: 存档字段长度限制 */
  LIMITS: {
    NAME_MAX_LENGTH: 100,
    CHAPTER_MAX_LENGTH: 50,
    ZONE_MAX_LENGTH: 50,
    SCREENSHOT_MAX_LENGTH: 500000, // ~500KB base64
    MAX_PLAY_TIME: 999999999, // ~31年，防止溢出
  },
};

// ==================== 存档校验 ====================

/**
 * SA-003: 存档结构校验错误
 */
export class SaveValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly reason: 'missing' | 'type' | 'range' | 'format'
  ) {
    super(message);
    this.name = 'SaveValidationError';
  }
}

/**
 * SA-003: 校验存档数据结构
 * 检查字段存在性、类型和范围
 */
function validateSaveData(data: unknown): asserts data is ISaveData {
  if (typeof data !== 'object' || data === null) {
    throw new SaveValidationError('存档数据必须是对象', 'root', 'type');
  }

  const save = data as Record<string, unknown>;

  // 必需字段检查
  const requiredFields: Array<{
    key: string;
    type: string;
    validate?: (v: unknown) => boolean;
    maxLength?: number;
  }> = [
    { key: 'version', type: 'number', validate: (v) => Number.isInteger(v) && (v as number) > 0 },
    {
      key: 'slot',
      type: 'number',
      validate: (v) =>
        Number.isInteger(v) && (v as number) >= 0 && (v as number) <= CONFIG.MAX_SLOTS,
    },
    {
      key: 'timestamp',
      type: 'number',
      validate: (v) =>
        Number.isInteger(v) && (v as number) > 0 && (v as number) <= Date.now() + 86400000,
    },
    { key: 'name', type: 'string', maxLength: CONFIG.LIMITS.NAME_MAX_LENGTH },
    {
      key: 'playTime',
      type: 'number',
      validate: (v) =>
        typeof v === 'number' && (v as number) >= 0 && (v as number) <= CONFIG.LIMITS.MAX_PLAY_TIME,
    },
    { key: 'chapter', type: 'string', maxLength: CONFIG.LIMITS.CHAPTER_MAX_LENGTH },
    { key: 'currentZone', type: 'string', maxLength: CONFIG.LIMITS.ZONE_MAX_LENGTH },
    { key: 'worldState', type: 'object' },
    { key: 'narrativeState', type: 'object' },
  ];

  for (const field of requiredFields) {
    if (!(field.key in save)) {
      throw new SaveValidationError(`缺少必需字段: ${field.key}`, field.key, 'missing');
    }

    const value = save[field.key];

    // 类型检查
    if (typeof value !== field.type) {
      throw new SaveValidationError(
        `字段 ${field.key} 类型错误: 期望 ${field.type}, 实际 ${typeof value}`,
        field.key,
        'type'
      );
    }

    // 自定义验证
    if (field.validate && !field.validate(value)) {
      throw new SaveValidationError(`字段 ${field.key} 值无效`, field.key, 'range');
    }

    // 字符串长度限制
    if (field.maxLength && typeof value === 'string' && value.length > field.maxLength) {
      throw new SaveValidationError(
        `字段 ${field.key} 超过长度限制 (${value.length}/${field.maxLength})`,
        field.key,
        'range'
      );
    }
  }

  // 可选字段检查: screenshot
  if ('screenshot' in save && save.screenshot !== undefined) {
    if (typeof save.screenshot !== 'string') {
      throw new SaveValidationError('screenshot 必须是字符串', 'screenshot', 'type');
    }
    if ((save.screenshot as string).length > CONFIG.LIMITS.SCREENSHOT_MAX_LENGTH) {
      throw new SaveValidationError(
        `screenshot 超过长度限制 (${(save.screenshot as string).length}/${CONFIG.LIMITS.SCREENSHOT_MAX_LENGTH})`,
        'screenshot',
        'range'
      );
    }
  }

  // 校验 worldState 结构
  validateWorldState(save.worldState);

  // 校验 narrativeState 结构
  validateNarrativeState(save.narrativeState);
}

/**
 * SA-003: 校验 worldState 结构
 */
function validateWorldState(data: unknown): void {
  if (typeof data !== 'object' || data === null) {
    throw new SaveValidationError('worldState 必须是对象', 'worldState', 'type');
  }

  const state = data as Record<string, unknown>;

  // 检查必需的 worldState 字段
  const requiredFields = ['currentChapter', 'currentZone'];
  for (const field of requiredFields) {
    if (!(field in state)) {
      throw new SaveValidationError(
        `worldState 缺少必需字段: ${field}`,
        `worldState.${field}`,
        'missing'
      );
    }
  }
}

/**
 * SA-003: 校验 narrativeState 结构
 */
function validateNarrativeState(data: unknown): void {
  if (typeof data !== 'object' || data === null) {
    throw new SaveValidationError('narrativeState 必须是对象', 'narrativeState', 'type');
  }

  const state = data as Record<string, unknown>;

  // 检查数组类型字段
  const arrayFields = ['obtainedCards', 'viewedCards', 'dialogueHistory'];
  for (const field of arrayFields) {
    if (field in state && !Array.isArray(state[field])) {
      throw new SaveValidationError(
        `narrativeState.${field} 必须是数组`,
        `narrativeState.${field}`,
        'type'
      );
    }
  }

  // 检查 foreshadowStates 是否为对象
  if ('foreshadowStates' in state) {
    if (typeof state.foreshadowStates !== 'object' || state.foreshadowStates === null) {
      throw new SaveValidationError(
        'narrativeState.foreshadowStates 必须是对象',
        'narrativeState.foreshadowStates',
        'type'
      );
    }
  }
}

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
      logger.info('初始化完成');
    } catch (error) {
      logger.error('初始化失败:', error);
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
      logger.error(`无效的存档槽位: ${slot}`);
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

      logger.info(`存档成功: 槽位${slot}`);
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      eventBus.emit(GameEvent.SAVE_ERROR, { slot, error: errorMsg });
      logger.error('存档失败:', error);
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
   * SA-003: 加载前进行结构校验
   */
  async load(slot: number): Promise<boolean> {
    try {
      const saveData = await this._readSave(slot);
      if (!saveData) {
        logger.warn(`槽位${slot}没有存档`);
        return false;
      }

      // SA-003: 结构校验
      try {
        validateSaveData(saveData);
      } catch (validationError) {
        if (validationError instanceof SaveValidationError) {
          logger.error(`存档校验失败 [${validationError.field}]: ${validationError.message}`);
        }
        throw validationError;
      }

      // 版本迁移（如需要）
      const migratedData = this._migrateSaveData(saveData);

      // 恢复状态
      worldState.restore(migratedData.worldState);
      narrativeEngine.restore(migratedData.narrativeState);

      logger.info(`加载成功: 槽位${slot}`);
      return true;
    } catch (error) {
      logger.error('加载失败:', error);
      return false;
    }
  }

  /**
   * 删除存档
   */
  async deleteSave(slot: number): Promise<boolean> {
    try {
      await this._deleteSave(slot);
      logger.info(`删除成功: 槽位${slot}`);
      return true;
    } catch (error) {
      logger.error('删除失败:', error);
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
    return new Promise((resolve, reject): void => {
      const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

      request.onerror = (): void => {
        reject(new Error('无法打开IndexedDB'));
      };

      request.onsuccess = (): void => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event): void => {
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

    return new Promise((resolve, reject): void => {
      const transaction = this._db!.transaction([CONFIG.SAVE_STORE], 'readwrite');
      const store = transaction.objectStore(CONFIG.SAVE_STORE);
      const request = store.put(saveData);

      request.onerror = (): void => reject(new Error('写入存档失败'));
      request.onsuccess = (): void => resolve();
    });
  }

  private async _readSave(slot: number): Promise<ISaveData | null> {
    if (!this._db) {
      return this._readFromLocalStorage(`save_${slot}`);
    }

    return new Promise((resolve, reject): void => {
      const transaction = this._db!.transaction([CONFIG.SAVE_STORE], 'readonly');
      const store = transaction.objectStore(CONFIG.SAVE_STORE);
      const request = store.get(slot);

      request.onerror = (): void => reject(new Error('读取存档失败'));
      request.onsuccess = (): void => resolve(request.result || null);
    });
  }

  private async _deleteSave(slot: number): Promise<void> {
    if (!this._db) {
      safeStorage.remove(`save_${slot}`);
      return;
    }

    return new Promise((resolve, reject): void => {
      const transaction = this._db!.transaction([CONFIG.SAVE_STORE], 'readwrite');
      const store = transaction.objectStore(CONFIG.SAVE_STORE);
      const request = store.delete(slot);

      request.onerror = (): void => reject(new Error('删除存档失败'));
      request.onsuccess = (): void => resolve();
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

    return new Promise((resolve): void => {
      const transaction = this._db!.transaction([CONFIG.SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(CONFIG.SETTINGS_STORE);
      const request = store.get('game_settings');

      request.onsuccess = (): void => {
        if (request.result) {
          this._settings = { ...this._getDefaultSettings(), ...request.result.data };
        }
        resolve();
      };

      request.onerror = (): void => {
        logger.warn('加载设置失败，使用默认值');
        resolve();
      };
    });
  }

  private async _saveSettings(): Promise<void> {
    if (!this._db) {
      this._writeToLocalStorage('settings', this._settings);
      return;
    }

    return new Promise((resolve, reject): void => {
      const transaction = this._db!.transaction([CONFIG.SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(CONFIG.SETTINGS_STORE);
      const request = store.put({ id: 'game_settings', data: this._settings });

      request.onerror = (): void => reject(new Error('保存设置失败'));
      request.onsuccess = (): void => resolve();
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
    logger.warn('使用LocalStorage作为回退存储');
    this._isInitialized = true;
  }

  private _writeToLocalStorage(key: string, data: unknown): void {
    if (!safeStorage.set(key, data)) {
      logger.error('LocalStorage写入失败');
    }
  }

  private _readFromLocalStorage<T>(key: string): T | null {
    return safeStorage.get<T>(key);
  }

  // ==================== 私有方法 - 版本迁移 ====================

  private _migrateSaveData(saveData: ISaveData): ISaveData {
    // 版本迁移逻辑
    if (saveData.version < CONFIG.SAVE_VERSION) {
      logger.info(`迁移存档: v${saveData.version} -> v${CONFIG.SAVE_VERSION}`);

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
