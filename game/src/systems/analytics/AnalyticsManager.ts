/**
 * 数据统计管理器
 * 追踪游戏事件、用户行为和性能指标
 * @module systems/analytics/AnalyticsManager
 */

import { createLogger } from '@/utils/Logger';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { safeStorage } from '@/systems/storage';

const logger = createLogger('Analytics');

// ==================== 类型定义 ====================

export interface IAnalyticsEvent {
  /** 事件名称 */
  name: string;
  /** 事件类别 */
  category: 'gameplay' | 'ui' | 'system' | 'performance' | 'error';
  /** 事件参数 */
  params?: Record<string, string | number | boolean>;
  /** 时间戳 */
  timestamp: number;
  /** 会话ID */
  sessionId: string;
}

export interface ISessionData {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  events: IAnalyticsEvent[];
  device: IDeviceInfo;
  performance: IPerformanceSummary;
}

export interface IDeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  isTouchDevice: boolean;
  isOnline: boolean;
}

export interface IPerformanceSummary {
  avgFps: number;
  minFps: number;
  loadTime: number;
  memoryPeak?: number;
}

export interface IAnalyticsConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 上报端点 */
  endpoint?: string;
  /** 批量上报数量 */
  batchSize: number;
  /** 上报间隔(ms) */
  flushInterval: number;
  /** 是否在开发模式下启用 */
  enableInDev: boolean;
  /** 采样率 (0-1) */
  sampleRate: number;
}

// ==================== 默认配置 ====================

const DEFAULT_CONFIG: IAnalyticsConfig = {
  enabled: true,
  endpoint: undefined, // 未配置则只本地存储
  batchSize: 20,
  flushInterval: 30000, // 30秒
  enableInDev: false,
  sampleRate: 1.0,
};

// ==================== 管理器实现 ====================

class AnalyticsManager {
  private _config: IAnalyticsConfig;
  private _sessionId: string;
  private _sessionStartTime: number;
  private _eventQueue: IAnalyticsEvent[] = [];
  private _flushTimer: number | null = null;
  private _fpsHistory: number[] = [];
  private _isInitialized: boolean = false;

  constructor() {
    this._config = { ...DEFAULT_CONFIG };
    this._sessionId = this._generateSessionId();
    this._sessionStartTime = Date.now();
  }

  /**
   * 初始化
   */
  public init(config?: Partial<IAnalyticsConfig>): void {
    if (this._isInitialized) return;

    this._config = { ...DEFAULT_CONFIG, ...config };

    // 检查是否应该启用
    const isDev = import.meta.env.DEV;
    if (isDev && !this._config.enableInDev) {
      logger.info('开发模式下已禁用');
      return;
    }

    // 采样检查
    if (Math.random() > this._config.sampleRate) {
      logger.info('未被采样');
      return;
    }

    if (!this._config.enabled) {
      logger.info('已禁用');
      return;
    }

    this._setupEventListeners();
    this._startFlushTimer();
    this._trackSessionStart();
    this._isInitialized = true;

    logger.info('初始化完成，会话ID:', this._sessionId);
  }

  /**
   * 生成会话ID
   */
  private _generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 获取设备信息
   */
  private _getDeviceInfo(): IDeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      isTouchDevice: 'ontouchstart' in window,
      isOnline: navigator.onLine,
    };
  }

  /**
   * 设置事件监听
   */
  private _setupEventListeners(): void {
    // 游戏事件
    eventBus.onTyped(GameEvent.GAME_START, (payload) => {
      this.track('game_start', 'gameplay', { isNewGame: payload.isNewGame });
    });

    eventBus.onTyped(GameEvent.ZONE_ENTER, (payload) => {
      this.track('zone_enter', 'gameplay', {
        zoneId: payload.zoneId,
        isFirstVisit: payload.isFirstVisit,
      });
    });

    eventBus.onTyped(GameEvent.CARD_OBTAIN, (payload) => {
      this.track('card_obtain', 'gameplay', { cardId: payload.cardId });
    });

    eventBus.onTyped(GameEvent.ABILITY_UNLOCK, (payload) => {
      this.track('ability_unlock', 'gameplay', { abilityType: payload.abilityType });
    });

    eventBus.onTyped(GameEvent.ENDING_REACH, (payload) => {
      this.track('ending_reach', 'gameplay', { endingType: payload.endingType });
    });

    eventBus.onTyped(GameEvent.DIALOGUE_START, (payload) => {
      this.track('dialogue_start', 'gameplay', { dialogueId: payload.dialogueId });
    });

    eventBus.onTyped(GameEvent.DIALOGUE_CHOICE, (payload) => {
      this.track('choice_selected', 'gameplay', {
        dialogueId: payload.dialogueId,
        choiceText: payload.choiceText,
        choiceIndex: payload.choiceIndex,
      });
    });

    // UI事件
    eventBus.onTyped(GameEvent.UI_PANEL_OPEN, (payload) => {
      this.track('panel_open', 'ui', { panelType: payload.panelType });
    });

    // 系统事件
    eventBus.onTyped(GameEvent.SAVE_COMPLETE, () => {
      this.track('save_complete', 'system');
    });

    eventBus.onTyped(GameEvent.LOAD_COMPLETE, () => {
      this.track('load_complete', 'system');
    });

    // 页面可见性
    document.addEventListener('visibilitychange', () => {
      this.track(document.hidden ? 'page_hidden' : 'page_visible', 'system');
    });

    // 页面卸载
    window.addEventListener('beforeunload', () => {
      this._trackSessionEnd();
      this._flush(true); // 同步刷新
    });
  }

  /**
   * 启动定时刷新
   */
  private _startFlushTimer(): void {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
    }

    this._flushTimer = window.setInterval(() => {
      this._flush();
    }, this._config.flushInterval);
  }

  /**
   * 追踪会话开始
   */
  private _trackSessionStart(): void {
    this.track('session_start', 'system', {
      ...this._getDeviceInfo(),
    });
  }

  /**
   * 追踪会话结束
   */
  private _trackSessionEnd(): void {
    const duration = Date.now() - this._sessionStartTime;
    const avgFps =
      this._fpsHistory.length > 0
        ? this._fpsHistory.reduce((a, b) => a + b, 0) / this._fpsHistory.length
        : 0;

    this.track('session_end', 'system', {
      duration,
      avgFps: Math.round(avgFps),
      minFps: Math.min(...this._fpsHistory, 60),
      eventsCount: this._eventQueue.length,
    });
  }

  /**
   * 追踪事件
   */
  public track(
    name: string,
    category: IAnalyticsEvent['category'],
    params?: Record<string, string | number | boolean>
  ): void {
    if (!this._config.enabled) return;

    const event: IAnalyticsEvent = {
      name,
      category,
      params,
      timestamp: Date.now(),
      sessionId: this._sessionId,
    };

    this._eventQueue.push(event);

    // 本地日志
    if (import.meta.env.DEV) {
      logger.debug('Event:', event);
    }

    // 达到批量大小时刷新
    if (this._eventQueue.length >= this._config.batchSize) {
      this._flush();
    }
  }

  /**
   * 追踪错误
   */
  public trackError(error: Error, context?: string): void {
    this.track('error', 'error', {
      message: error.message,
      stack: error.stack?.substring(0, 500) || '',
      context: context || '',
    });
  }

  /**
   * 追踪性能
   */
  public trackPerformance(fps: number): void {
    this._fpsHistory.push(fps);

    // 只保留最近 100 个样本
    if (this._fpsHistory.length > 100) {
      this._fpsHistory.shift();
    }
  }

  /**
   * 追踪加载时间
   */
  public trackLoadTime(phase: string, duration: number): void {
    this.track('load_time', 'performance', {
      phase,
      duration,
    });
  }

  /**
   * 刷新事件队列
   */
  private async _flush(sync: boolean = false): Promise<void> {
    if (this._eventQueue.length === 0) return;

    const events = [...this._eventQueue];
    this._eventQueue = [];

    // 本地存储
    this._saveToLocal(events);

    // 远程上报
    if (this._config.endpoint) {
      if (sync) {
        // 同步发送（页面卸载时）
        this._sendSync(events);
      } else {
        await this._send(events);
      }
    }
  }

  /**
   * 保存到本地
   */
  private _saveToLocal(events: IAnalyticsEvent[]): void {
    const key = this._sessionId;
    const existing = safeStorage.get<IAnalyticsEvent[]>(key, [], 'analytics') || [];
    const updated = [...existing, ...events].slice(-500); // 最多保留 500 条
    if (!safeStorage.set(key, updated, 'analytics')) {
      logger.warn('本地存储失败');
    }
  }

  /**
   * 异步发送
   */
  private async _send(events: IAnalyticsEvent[]): Promise<void> {
    if (!this._config.endpoint) return;

    try {
      await fetch(this._config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this._sessionId,
          events,
          device: this._getDeviceInfo(),
        }),
      });
    } catch (error) {
      logger.warn('上报失败:', error);
      // 失败的事件重新加入队列
      this._eventQueue.unshift(...events);
    }
  }

  /**
   * 同步发送（使用 sendBeacon）
   */
  private _sendSync(events: IAnalyticsEvent[]): void {
    if (!this._config.endpoint) return;

    try {
      const data = JSON.stringify({
        sessionId: this._sessionId,
        events,
        device: this._getDeviceInfo(),
      });

      navigator.sendBeacon(this._config.endpoint, data);
    } catch (error) {
      logger.warn('Beacon 发送失败:', error);
    }
  }

  /**
   * 获取会话数据
   */
  public getSessionData(): ISessionData {
    const avgFps =
      this._fpsHistory.length > 0
        ? this._fpsHistory.reduce((a, b) => a + b, 0) / this._fpsHistory.length
        : 0;

    return {
      id: this._sessionId,
      startTime: this._sessionStartTime,
      events: [...this._eventQueue],
      device: this._getDeviceInfo(),
      performance: {
        avgFps: Math.round(avgFps),
        minFps: Math.min(...this._fpsHistory, 60),
        loadTime: 0, // 需要从外部设置
      },
    };
  }

  /**
   * 获取本地存储的所有会话
   */
  public getStoredSessions(): string[] {
    return safeStorage.getKeys('analytics');
  }

  /**
   * 清除本地存储
   */
  public clearStoredData(): void {
    const count = safeStorage.clearPrefix('analytics');
    logger.info(`已清除 ${count} 条本地数据`);
  }

  /**
   * 销毁
   */
  public destroy(): void {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }
    this._flush(true);
    this._isInitialized = false;
  }
}

// 单例导出
export const analyticsManager = new AnalyticsManager();
