/**
 * 云存档管理器
 * 支持存档同步、冲突解决和离线队列
 * @module systems/cloud/CloudSaveManager
 */

import { createLogger } from '@/utils/Logger';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { safeStorage } from '@/systems/storage';

const logger = createLogger('CloudSave');
import { saveManager } from '@/systems/save';
import type { ISaveData, ISaveMetadata } from '@/systems/save';

// ==================== 类型定义 ====================

export interface ICloudSaveConfig {
  /** API 端点 */
  endpoint: string;
  /** 用户标识 */
  userId?: string;
  /** 访问令牌 */
  accessToken?: string;
  /** 同步间隔(ms) */
  syncInterval: number;
  /** 是否启用 */
  enabled: boolean;
}

export interface ICloudSaveMetadata {
  saveId: string;
  userId: string;
  slot: number;
  timestamp: number;
  checksum: string;
  version: string;
  description?: string;
}

export interface ICloudSaveResponse {
  success: boolean;
  data?: ISaveData;
  metadata?: ICloudSaveMetadata;
  error?: string;
  conflictData?: ISaveData;
}

export interface ISyncResult {
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: string[];
}

type ConflictStrategy = 'local' | 'cloud' | 'latest' | 'manual';

// ==================== 默认配置 ====================

const DEFAULT_CONFIG: ICloudSaveConfig = {
  endpoint: '',
  userId: undefined,
  accessToken: undefined,
  syncInterval: 60000, // 1分钟
  enabled: false,
};

// ==================== 管理器实现 ====================

class CloudSaveManager {
  private _config: ICloudSaveConfig;
  private _syncTimer: number | null = null;
  private _pendingUploads: Map<number, ISaveData> = new Map();
  private _isSyncing: boolean = false;
  private _lastSyncTime: number = 0;
  private _conflictStrategy: ConflictStrategy = 'latest';

  constructor() {
    this._config = { ...DEFAULT_CONFIG };
  }

  /**
   * 初始化云存档
   * @throws {Error} 当 endpoint 不是 HTTPS（localhost 除外）时抛出错误
   */
  public init(config: Partial<ICloudSaveConfig>): void {
    this._config = { ...DEFAULT_CONFIG, ...config };

    if (!this._config.enabled || !this._config.endpoint) {
      logger.info('云存档未启用或未配置端点');
      return;
    }

    // SA-002: 强制 HTTPS endpoint（localhost 除外用于开发）
    if (!this._isSecureEndpoint(this._config.endpoint)) {
      const error = new Error(`云存档端点必须使用 HTTPS 协议: ${this._config.endpoint}`);
      logger.error(error.message);
      throw error;
    }

    if (!this._config.userId || !this._config.accessToken) {
      logger.info('未登录，云存档不可用');
      return;
    }

    this._setupEventListeners();
    this._startSyncTimer();
    this._loadPendingUploads();

    logger.info('初始化完成');
  }

  /**
   * 检查 endpoint 是否安全（HTTPS 或 localhost）
   * SA-002: HTTPS 强制校验
   */
  private _isSecureEndpoint(endpoint: string): boolean {
    try {
      const url = new URL(endpoint);
      // 允许 localhost 用于本地开发
      const isLocalhost =
        url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
      // 必须是 HTTPS 或 localhost
      return url.protocol === 'https:' || isLocalhost;
    } catch {
      // 无效 URL
      return false;
    }
  }

  /**
   * 设置事件监听
   */
  private _setupEventListeners(): void {
    // 监听本地存档完成
    eventBus.onTyped(GameEvent.SAVE_COMPLETE, (payload) => {
      // 需要从SaveManager获取完整存档数据
      void this._onLocalSaveComplete(payload.slot);
    });

    // 监听网络状态
    window.addEventListener('online', () => {
      logger.info('网络恢复，尝试同步');
      this._processPendingUploads();
    });
  }

  /**
   * 本地存档完成回调
   */
  private async _onLocalSaveComplete(slot: number): Promise<void> {
    // 从IndexedDB获取完整存档数据
    const saveData = await this._getLocalSaveData(slot);
    if (saveData) {
      this._queueUpload(slot, saveData);
    }
  }

  /**
   * 获取本地存档数据
   */
  private async _getLocalSaveData(slot: number): Promise<ISaveData | null> {
    // 使用saveManager的内部方法获取存档数据
    // 由于saveManager.load()会直接应用到游戏状态，我们需要直接访问IndexedDB
    try {
      const db = await this._openDB();
      const tx = db.transaction('saves', 'readonly');
      const store = tx.objectStore('saves');
      const request = store.get(slot);

      return new Promise((resolve, reject): void => {
        request.onsuccess = (): void => resolve(request.result || null);
        request.onerror = (): void => reject(request.error);
      });
    } catch (error) {
      logger.error('获取本地存档失败:', error);
      return null;
    }
  }

  /**
   * 打开IndexedDB
   */
  private _openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject): void => {
      const request = indexedDB.open('FootnoteGameDB', 1);
      request.onsuccess = (): void => resolve(request.result);
      request.onerror = (): void => reject(request.error);
    });
  }

  /**
   * 导入存档到本地
   */
  private async _importSaveToLocal(slot: number, saveData: ISaveData): Promise<void> {
    try {
      const db = await this._openDB();
      const tx = db.transaction('saves', 'readwrite');
      const store = tx.objectStore('saves');

      saveData.slot = slot;
      store.put(saveData);

      await new Promise<void>((resolve, reject): void => {
        tx.oncomplete = (): void => resolve();
        tx.onerror = (): void => reject(tx.error);
      });
    } catch (error) {
      logger.error('导入存档失败:', error);
    }
  }

  /**
   * 启动同步定时器
   */
  private _startSyncTimer(): void {
    if (this._syncTimer) {
      clearInterval(this._syncTimer);
    }

    this._syncTimer = window.setInterval(() => {
      this.sync();
    }, this._config.syncInterval);
  }

  /**
   * 加载待上传队列
   */
  private _loadPendingUploads(): void {
    const stored = safeStorage.get<Record<string, ISaveData>>('pending_uploads', null, 'cloud');
    if (stored) {
      this._pendingUploads = new Map(Object.entries(stored).map(([k, v]) => [Number(k), v]));
    }
  }

  /**
   * 保存待上传队列
   */
  private _savePendingUploads(): void {
    const obj = Object.fromEntries(this._pendingUploads);
    if (!safeStorage.set('pending_uploads', obj, 'cloud')) {
      logger.warn('保存待上传队列失败');
    }
  }

  /**
   * 添加到上传队列
   */
  private _queueUpload(slot: number, saveData: ISaveData): void {
    this._pendingUploads.set(slot, saveData);
    this._savePendingUploads();

    // 如果在线，立即尝试上传
    if (navigator.onLine) {
      this._uploadSave(slot, saveData);
    }
  }

  /**
   * 处理待上传队列
   */
  private async _processPendingUploads(): Promise<void> {
    if (!navigator.onLine || this._pendingUploads.size === 0) return;

    for (const [slot, saveData] of this._pendingUploads) {
      const success = await this._uploadSave(slot, saveData);
      if (success) {
        this._pendingUploads.delete(slot);
      }
    }

    this._savePendingUploads();
  }

  /**
   * 上传存档
   */
  private async _uploadSave(slot: number, saveData: ISaveData): Promise<boolean> {
    if (!this._config.enabled || !this._config.endpoint) return false;

    try {
      // SA-001: 使用 HMAC-SHA256 计算校验和
      const checksum = await this._calculateChecksumAsync(saveData);

      const response = await fetch(`${this._config.endpoint}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this._config.accessToken}`,
        },
        body: JSON.stringify({
          userId: this._config.userId,
          slot,
          saveData,
          checksum,
          version: saveData.version,
          timestamp: saveData.timestamp,
        }),
      });

      const result: ICloudSaveResponse = await response.json();

      if (result.success) {
        logger.info(`槽位 ${slot} 上传成功`);
        eventBus.emit(GameEvent.CLOUD_SAVE_UPLOAD, { slot, success: true });
        return true;
      } else if (result.conflictData) {
        // 处理冲突
        await this._handleConflict(slot, saveData, result.conflictData);
        return false;
      } else {
        logger.error('上传失败:', result.error);
        return false;
      }
    } catch (error) {
      logger.error('上传异常:', error);
      return false;
    }
  }

  /**
   * 下载存档
   */
  public async downloadSave(slot: number): Promise<ISaveData | null> {
    if (!this._config.enabled || !this._config.endpoint) return null;

    try {
      const response = await fetch(`${this._config.endpoint}/save/${this._config.userId}/${slot}`, {
        headers: {
          Authorization: `Bearer ${this._config.accessToken}`,
        },
      });

      const result: ICloudSaveResponse = await response.json();

      if (result.success && result.data) {
        logger.info(`槽位 ${slot} 下载成功`);
        eventBus.emit(GameEvent.CLOUD_SAVE_DOWNLOAD, { slot, success: true });
        return result.data;
      } else {
        logger.error('下载失败:', result.error);
        return null;
      }
    } catch (error) {
      logger.error('下载异常:', error);
      return null;
    }
  }

  /**
   * 获取云端存档列表
   */
  public async listCloudSaves(): Promise<ICloudSaveMetadata[]> {
    if (!this._config.enabled || !this._config.endpoint) return [];

    try {
      const response = await fetch(`${this._config.endpoint}/saves/${this._config.userId}`, {
        headers: {
          Authorization: `Bearer ${this._config.accessToken}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        return result.saves || [];
      }
      return [];
    } catch (error) {
      logger.error('获取列表失败:', error);
      return [];
    }
  }

  /**
   * 同步所有存档
   */
  public async sync(): Promise<ISyncResult> {
    const result: ISyncResult = {
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: [],
    };

    if (!this._config.enabled || this._isSyncing) {
      return result;
    }

    this._isSyncing = true;
    logger.info('开始同步...');

    try {
      // 获取云端存档列表
      const cloudSaves = await this.listCloudSaves();

      // 获取本地存档列表
      const localSaveList = await saveManager.getSaveList();
      const localSlots = localSaveList.map((s: ISaveMetadata) => s.slot);

      // 比较并同步
      for (const localMeta of localSaveList) {
        const localSave = await this._getLocalSaveData(localMeta.slot);
        if (!localSave) continue;

        const cloudMeta = cloudSaves.find((s) => s.slot === localMeta.slot);

        if (!cloudMeta) {
          // 云端没有，上传
          const success = await this._uploadSave(localMeta.slot, localSave);
          if (success) result.uploaded++;
        } else if (localSave.timestamp > cloudMeta.timestamp) {
          // 本地较新，上传
          const success = await this._uploadSave(localMeta.slot, localSave);
          if (success) result.uploaded++;
        } else if (localSave.timestamp < cloudMeta.timestamp) {
          // 云端较新，下载
          const cloudSave = await this.downloadSave(localMeta.slot);
          if (cloudSave) {
            await this._importSaveToLocal(localMeta.slot, cloudSave);
            result.downloaded++;
          }
        }
        // 时间相同则跳过
      }

      // 下载本地没有的云端存档
      for (const cloudMeta of cloudSaves) {
        if (!localSlots.includes(cloudMeta.slot)) {
          const cloudSave = await this.downloadSave(cloudMeta.slot);
          if (cloudSave) {
            await this._importSaveToLocal(cloudMeta.slot, cloudSave);
            result.downloaded++;
          }
        }
      }

      this._lastSyncTime = Date.now();
      logger.info('同步完成:', result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      logger.error('同步失败:', error);
    } finally {
      this._isSyncing = false;
    }

    return result;
  }

  /**
   * 处理冲突
   */
  private async _handleConflict(
    slot: number,
    localData: ISaveData,
    cloudData: ISaveData
  ): Promise<void> {
    logger.warn(`槽位 ${slot} 存在冲突`);

    let resolvedData: ISaveData;

    switch (this._conflictStrategy) {
      case 'local':
        resolvedData = localData;
        break;
      case 'cloud':
        resolvedData = cloudData;
        break;
      case 'latest':
        resolvedData = localData.timestamp > cloudData.timestamp ? localData : cloudData;
        break;
      case 'manual':
        // 触发冲突解决事件
        eventBus.emit(GameEvent.CLOUD_SAVE_CONFLICT, {
          slot,
          localData,
          cloudData,
        });
        return;
      default:
        resolvedData = localData;
    }

    // 保存解决后的数据
    await this._importSaveToLocal(slot, resolvedData);
    await this._uploadSave(slot, resolvedData);
  }

  /**
   * 设置冲突解决策略
   */
  public setConflictStrategy(strategy: ConflictStrategy): void {
    this._conflictStrategy = strategy;
  }

  /**
   * 手动解决冲突
   */
  public async resolveConflict(slot: number, useLocal: boolean): Promise<void> {
    const localData = await this._getLocalSaveData(slot);
    if (!localData) return;

    if (useLocal) {
      await this._uploadSave(slot, localData);
    } else {
      const cloudData = await this.downloadSave(slot);
      if (cloudData) {
        await this._importSaveToLocal(slot, cloudData);
      }
    }
  }

  /**
   * 计算校验和（HMAC-SHA256）
   * SA-001: 使用加密哈希确保防篡改能力
   * @param data 存档数据
   * @returns HMAC-SHA256 哈希值（十六进制）
   */
  private async _calculateChecksumAsync(data: ISaveData): Promise<string> {
    const str = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(str);

    // 使用 userId 作为 HMAC 密钥的一部分，确保每个用户的签名不同
    // 注意：在生产环境中，应使用服务端密钥进行验证
    const keyMaterial = encoder.encode(`footnote_cloud_save_${this._config.userId || 'anonymous'}`);

    // 导入密钥
    const key = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // 计算 HMAC
    const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);

    // 转换为十六进制字符串
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 获取同步状态
   */
  public getSyncStatus(): {
    isSyncing: boolean;
    lastSyncTime: number;
    pendingCount: number;
  } {
    return {
      isSyncing: this._isSyncing,
      lastSyncTime: this._lastSyncTime,
      pendingCount: this._pendingUploads.size,
    };
  }

  /**
   * 检查是否已配置
   */
  public isConfigured(): boolean {
    return !!(
      this._config.enabled &&
      this._config.endpoint &&
      this._config.userId &&
      this._config.accessToken
    );
  }

  /**
   * 登录
   */
  public login(userId: string, accessToken: string): void {
    this._config.userId = userId;
    this._config.accessToken = accessToken;
    logger.info('用户已登录:', userId);
  }

  /**
   * 登出
   */
  public logout(): void {
    this._config.userId = undefined;
    this._config.accessToken = undefined;
    this._pendingUploads.clear();
    this._savePendingUploads();
    logger.info('用户已登出');
  }

  /**
   * 销毁
   */
  public destroy(): void {
    if (this._syncTimer) {
      clearInterval(this._syncTimer);
      this._syncTimer = null;
    }
  }
}

// 单例导出
export const cloudSaveManager = new CloudSaveManager();
