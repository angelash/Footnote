/**
 * 安全存储封装
 * 统一封装 IndexedDB、localStorage、内存存储
 * 提供统一的 try/catch、能力探测和回退机制
 * @module systems/storage/SafeStorage
 */

import { createLogger } from '@/utils/Logger';

const logger = createLogger('SafeStorage');

// ==================== 类型定义 ====================

/**
 * 存储后端类型
 */
export type StorageBackend = 'indexedDB' | 'localStorage' | 'memory';

/**
 * 存储能力信息
 */
export interface IStorageCapabilities {
  /** IndexedDB 是否可用 */
  indexedDB: boolean;
  /** localStorage 是否可用 */
  localStorage: boolean;
  /** 当前使用的后端 */
  activeBackend: StorageBackend;
  /** 是否为降级模式 */
  isDegraded: boolean;
}

/**
 * 存储配置
 */
export interface ISafeStorageConfig {
  /** 键前缀，用于隔离不同模块的数据 */
  prefix: string;
  /** 优先使用的后端（默认 localStorage） */
  preferredBackend?: 'localStorage' | 'memory';
}

// ==================== SafeStorage 类 ====================

/**
 * 安全存储管理器
 * 提供统一的存储 API，内置异常处理和回退机制
 */
class SafeStorage {
  private static _instance: SafeStorage | null = null;

  /** 存储能力缓存 */
  private _capabilities: IStorageCapabilities | null = null;

  /** 内存回退存储 */
  private _memoryStore: Map<string, string> = new Map();

  /** localStorage 是否可用 */
  private _localStorageAvailable: boolean | null = null;

  /** indexedDB 是否可用 */
  private _indexedDBAvailable: boolean | null = null;

  private constructor() {
    // 单例模式
  }

  /**
   * 获取单例实例
   */
  static getInstance(): SafeStorage {
    if (!SafeStorage._instance) {
      SafeStorage._instance = new SafeStorage();
    }
    return SafeStorage._instance;
  }

  // ==================== 能力探测 ====================

  /**
   * 检测 localStorage 是否可用
   * 包括隐私模式、存储配额等情况
   */
  isLocalStorageAvailable(): boolean {
    if (this._localStorageAvailable !== null) {
      return this._localStorageAvailable;
    }

    try {
      const testKey = '__safe_storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      this._localStorageAvailable = true;
    } catch {
      this._localStorageAvailable = false;
      logger.warn('localStorage 不可用（可能是隐私模式或配额已满）');
    }

    return this._localStorageAvailable;
  }

  /**
   * 检测 IndexedDB 是否可用
   */
  isIndexedDBAvailable(): boolean {
    if (this._indexedDBAvailable !== null) {
      return this._indexedDBAvailable;
    }

    try {
      this._indexedDBAvailable = typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
      this._indexedDBAvailable = false;
    }

    if (!this._indexedDBAvailable) {
      logger.warn('IndexedDB 不可用');
    }

    return this._indexedDBAvailable;
  }

  /**
   * 获取存储能力信息
   */
  getCapabilities(): IStorageCapabilities {
    if (this._capabilities) {
      return this._capabilities;
    }

    const indexedDB = this.isIndexedDBAvailable();
    const localStorage = this.isLocalStorageAvailable();

    let activeBackend: StorageBackend;
    if (localStorage) {
      activeBackend = 'localStorage';
    } else {
      activeBackend = 'memory';
    }

    this._capabilities = {
      indexedDB,
      localStorage,
      activeBackend,
      isDegraded: !localStorage,
    };

    logger.info(`存储能力检测完成: ${JSON.stringify(this._capabilities)}`);

    return this._capabilities;
  }

  // ==================== 基础存储操作 ====================

  /**
   * 安全设置值
   * @param key 存储键
   * @param value 值（将被 JSON 序列化）
   * @param prefix 可选前缀
   * @returns 是否成功
   */
  set<T>(key: string, value: T, prefix: string = 'footnote'): boolean {
    const fullKey = `${prefix}_${key}`;

    try {
      const serialized = JSON.stringify(value);

      if (this.isLocalStorageAvailable()) {
        localStorage.setItem(fullKey, serialized);
        return true;
      }

      // 回退到内存存储
      this._memoryStore.set(fullKey, serialized);
      return true;
    } catch (error) {
      logger.error(`存储写入失败 [${fullKey}]:`, error);

      // 最后的回退：尝试写入内存
      try {
        this._memoryStore.set(fullKey, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * 安全获取值
   * @param key 存储键
   * @param defaultValue 默认值
   * @param prefix 可选前缀
   * @returns 解析后的值或默认值
   */
  get<T>(key: string, defaultValue: T | null = null, prefix: string = 'footnote'): T | null {
    const fullKey = `${prefix}_${key}`;

    try {
      let data: string | null = null;

      if (this.isLocalStorageAvailable()) {
        data = localStorage.getItem(fullKey);
      }

      // 如果 localStorage 没有，检查内存存储
      if (data === null) {
        data = this._memoryStore.get(fullKey) || null;
      }

      if (data === null) {
        return defaultValue;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      logger.warn(`存储读取失败 [${fullKey}]:`, error);
      return defaultValue;
    }
  }

  /**
   * 安全删除值
   * @param key 存储键
   * @param prefix 可选前缀
   * @returns 是否成功
   */
  remove(key: string, prefix: string = 'footnote'): boolean {
    const fullKey = `${prefix}_${key}`;

    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.removeItem(fullKey);
      }

      // 同时清理内存存储
      this._memoryStore.delete(fullKey);
      return true;
    } catch (error) {
      logger.warn(`存储删除失败 [${fullKey}]:`, error);
      return false;
    }
  }

  /**
   * 检查键是否存在
   * @param key 存储键
   * @param prefix 可选前缀
   */
  has(key: string, prefix: string = 'footnote'): boolean {
    const fullKey = `${prefix}_${key}`;

    try {
      if (this.isLocalStorageAvailable()) {
        return localStorage.getItem(fullKey) !== null;
      }
      return this._memoryStore.has(fullKey);
    } catch {
      return this._memoryStore.has(fullKey);
    }
  }

  // ==================== 批量操作 ====================

  /**
   * 获取指定前缀的所有键
   * @param prefix 前缀
   * @returns 键列表（不含前缀）
   */
  getKeys(prefix: string = 'footnote'): string[] {
    const keys: string[] = [];
    const fullPrefix = `${prefix}_`;

    try {
      if (this.isLocalStorageAvailable()) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(fullPrefix)) {
            keys.push(key.substring(fullPrefix.length));
          }
        }
      }

      // 同时检查内存存储
      for (const key of this._memoryStore.keys()) {
        if (key.startsWith(fullPrefix)) {
          const shortKey = key.substring(fullPrefix.length);
          if (!keys.includes(shortKey)) {
            keys.push(shortKey);
          }
        }
      }
    } catch (error) {
      logger.warn(`获取存储键失败:`, error);
    }

    return keys;
  }

  /**
   * 清除指定前缀的所有数据
   * @param prefix 前缀
   * @returns 清除的键数量
   */
  clearPrefix(prefix: string): number {
    const keys = this.getKeys(prefix);
    let count = 0;

    for (const key of keys) {
      if (this.remove(key, prefix)) {
        count++;
      }
    }

    logger.info(`已清除 ${count} 个 [${prefix}] 前缀的存储项`);
    return count;
  }

  // ==================== 高级功能 ====================

  /**
   * 原子性更新（读取-修改-写入）
   * @param key 存储键
   * @param updater 更新函数
   * @param defaultValue 默认值
   * @param prefix 可选前缀
   * @returns 更新后的值，失败返回 null
   */
  update<T>(
    key: string,
    updater: (current: T | null) => T,
    defaultValue: T | null = null,
    prefix: string = 'footnote'
  ): T | null {
    try {
      const current = this.get<T>(key, defaultValue, prefix);
      const updated = updater(current);
      const success = this.set(key, updated, prefix);
      return success ? updated : null;
    } catch (error) {
      logger.error(`存储更新失败 [${prefix}_${key}]:`, error);
      return null;
    }
  }

  /**
   * 带过期时间的存储
   * @param key 存储键
   * @param value 值
   * @param ttlMs 过期时间（毫秒）
   * @param prefix 可选前缀
   */
  setWithExpiry<T>(key: string, value: T, ttlMs: number, prefix: string = 'footnote'): boolean {
    const item = {
      value,
      expiry: Date.now() + ttlMs,
    };
    return this.set(key, item, prefix);
  }

  /**
   * 获取带过期时间的值
   * @param key 存储键
   * @param prefix 可选前缀
   * @returns 值（如果已过期返回 null）
   */
  getWithExpiry<T>(key: string, prefix: string = 'footnote'): T | null {
    const item = this.get<{ value: T; expiry: number }>(key, null, prefix);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      // 已过期，删除并返回 null
      this.remove(key, prefix);
      return null;
    }

    return item.value;
  }

  // ==================== 导出/导入 ====================

  /**
   * 导出指定前缀的所有数据
   * @param prefix 前缀
   * @returns 键值对对象
   */
  export(prefix: string = 'footnote'): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const keys = this.getKeys(prefix);

    for (const key of keys) {
      const value = this.get(key, null, prefix);
      if (value !== null) {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * 导入数据
   * @param data 键值对对象
   * @param prefix 前缀
   * @param overwrite 是否覆盖已存在的键
   * @returns 成功导入的数量
   */
  import(
    data: Record<string, unknown>,
    prefix: string = 'footnote',
    overwrite: boolean = true
  ): number {
    let count = 0;

    for (const [key, value] of Object.entries(data)) {
      if (!overwrite && this.has(key, prefix)) {
        continue;
      }

      if (this.set(key, value, prefix)) {
        count++;
      }
    }

    logger.info(`已导入 ${count} 个存储项到 [${prefix}] 前缀`);
    return count;
  }

  // ==================== 存储统计 ====================

  /**
   * 获取存储使用统计
   */
  getStats(): {
    localStorage: { used: number; available: boolean };
    memory: { count: number; estimatedSize: number };
  } {
    let localStorageUsed = 0;

    try {
      if (this.isLocalStorageAvailable()) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            if (value) {
              localStorageUsed += key.length + value.length;
            }
          }
        }
      }
    } catch {
      // 忽略
    }

    let memorySize = 0;
    for (const [key, value] of this._memoryStore.entries()) {
      memorySize += key.length + value.length;
    }

    return {
      localStorage: {
        used: localStorageUsed * 2, // UTF-16 每字符 2 字节
        available: this.isLocalStorageAvailable(),
      },
      memory: {
        count: this._memoryStore.size,
        estimatedSize: memorySize * 2,
      },
    };
  }

  /**
   * 重置内部状态（用于测试）
   */
  _reset(): void {
    this._memoryStore.clear();
    this._localStorageAvailable = null;
    this._indexedDBAvailable = null;
    this._capabilities = null;
  }
}

// ==================== 导出 ====================

/**
 * SafeStorage 单例实例
 */
export const safeStorage = SafeStorage.getInstance();

/**
 * 便捷函数：安全获取值
 */
export function safeGet<T>(
  key: string,
  defaultValue: T | null = null,
  prefix: string = 'footnote'
): T | null {
  return safeStorage.get(key, defaultValue, prefix);
}

/**
 * 便捷函数：安全设置值
 */
export function safeSet<T>(key: string, value: T, prefix: string = 'footnote'): boolean {
  return safeStorage.set(key, value, prefix);
}

/**
 * 便捷函数：安全删除值
 */
export function safeRemove(key: string, prefix: string = 'footnote'): boolean {
  return safeStorage.remove(key, prefix);
}
