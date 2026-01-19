/**
 * 统一日志工具类
 *
 * 用于替换原有的 console 语句，提供：
 * - 统一的日志格式
 * - 日志级别控制
 * - 生产环境日志过滤
 * - 模块标签支持
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface ILoggerConfig {
  level: LogLevel;
  enabled: boolean;
  showTimestamp: boolean;
  showModule: boolean;
}

const DEFAULT_CONFIG: ILoggerConfig = {
  level: import.meta.env.PROD ? LogLevel.WARN : LogLevel.DEBUG,
  enabled: true,
  showTimestamp: !import.meta.env.PROD,
  showModule: true,
};

let globalConfig: ILoggerConfig = { ...DEFAULT_CONFIG };

/**
 * 格式化日志消息
 */
function formatMessage(module: string, message: string): string {
  const parts: string[] = [];

  if (globalConfig.showTimestamp) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    parts.push(`[${time}.${ms}]`);
  }

  if (globalConfig.showModule && module) {
    parts.push(`[${module}]`);
  }

  parts.push(message);

  return parts.join(' ');
}

/**
 * Logger 类 - 提供统一的日志接口
 */
class LoggerClass {
  private _module: string;

  constructor(module: string = '') {
    this._module = module;
  }

  /**
   * 创建带模块标签的 Logger 实例
   */
  static create(module: string): LoggerClass {
    return new LoggerClass(module);
  }

  /**
   * 配置全局日志设置
   */
  static configure(config: Partial<ILoggerConfig>): void {
    globalConfig = { ...globalConfig, ...config };
  }

  /**
   * 设置日志级别
   */
  static setLevel(level: LogLevel): void {
    globalConfig.level = level;
  }

  /**
   * 启用/禁用日志
   */
  static setEnabled(enabled: boolean): void {
    globalConfig.enabled = enabled;
  }

  /**
   * 获取当前配置
   */
  static getConfig(): Readonly<ILoggerConfig> {
    return { ...globalConfig };
  }

  /**
   * 重置为默认配置
   */
  static reset(): void {
    globalConfig = { ...DEFAULT_CONFIG };
  }

  /**
   * 调试日志
   */
  debug(message: string, ...args: unknown[]): void {
    if (!globalConfig.enabled || globalConfig.level > LogLevel.DEBUG) return;
    // eslint-disable-next-line no-console
    console.debug(formatMessage(this._module, message), ...args);
  }

  /**
   * 信息日志
   */
  info(message: string, ...args: unknown[]): void {
    if (!globalConfig.enabled || globalConfig.level > LogLevel.INFO) return;
    // eslint-disable-next-line no-console
    console.info(formatMessage(this._module, message), ...args);
  }

  /**
   * 日志（与 info 相同）
   */
  log(message: string, ...args: unknown[]): void {
    if (!globalConfig.enabled || globalConfig.level > LogLevel.INFO) return;
    // eslint-disable-next-line no-console
    console.log(formatMessage(this._module, message), ...args);
  }

  /**
   * 警告日志
   */
  warn(message: string, ...args: unknown[]): void {
    if (!globalConfig.enabled || globalConfig.level > LogLevel.WARN) return;
    // eslint-disable-next-line no-console
    console.warn(formatMessage(this._module, message), ...args);
  }

  /**
   * 错误日志
   */
  error(message: string, ...args: unknown[]): void {
    if (!globalConfig.enabled || globalConfig.level > LogLevel.ERROR) return;
    // eslint-disable-next-line no-console
    console.error(formatMessage(this._module, message), ...args);
  }

  /**
   * 分组日志开始
   */
  group(label: string): void {
    if (!globalConfig.enabled || globalConfig.level > LogLevel.DEBUG) return;
    // eslint-disable-next-line no-console
    console.group(formatMessage(this._module, label));
  }

  /**
   * 折叠分组日志开始
   */
  groupCollapsed(label: string): void {
    if (!globalConfig.enabled || globalConfig.level > LogLevel.DEBUG) return;
    // eslint-disable-next-line no-console
    console.groupCollapsed(formatMessage(this._module, label));
  }

  /**
   * 分组日志结束
   */
  groupEnd(): void {
    if (!globalConfig.enabled || globalConfig.level > LogLevel.DEBUG) return;
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  /**
   * 表格日志
   */
  table(data: unknown): void {
    if (!globalConfig.enabled || globalConfig.level > LogLevel.DEBUG) return;
    // eslint-disable-next-line no-console
    console.table(data);
  }

  /**
   * 性能计时开始
   */
  time(label: string): void {
    if (!globalConfig.enabled || globalConfig.level > LogLevel.DEBUG) return;
    // eslint-disable-next-line no-console
    console.time(`[${this._module}] ${label}`);
  }

  /**
   * 性能计时结束
   */
  timeEnd(label: string): void {
    if (!globalConfig.enabled || globalConfig.level > LogLevel.DEBUG) return;
    // eslint-disable-next-line no-console
    console.timeEnd(`[${this._module}] ${label}`);
  }

  /**
   * 带条件的日志
   */
  assert(condition: boolean, message: string, ...args: unknown[]): void {
    if (!globalConfig.enabled) return;
    // eslint-disable-next-line no-console
    console.assert(condition, formatMessage(this._module, message), ...args);
  }
}

/**
 * 默认 Logger 实例（无模块标签）
 */
export const Logger = new LoggerClass('');

/**
 * 创建带模块标签的 Logger
 * @param module 模块名称
 * @returns Logger 实例
 *
 * @example
 * ```typescript
 * const logger = createLogger('GameScene');
 * logger.info('Scene created');
 * logger.debug('Debug info', { detail: 'value' });
 * ```
 */
export function createLogger(module: string): LoggerClass {
  return LoggerClass.create(module);
}

// 导出配置方法
export const configureLogger = LoggerClass.configure;
export const setLogLevel = LoggerClass.setLevel;
export const setLogEnabled = LoggerClass.setEnabled;
export const getLogConfig = LoggerClass.getConfig;
export const resetLogger = LoggerClass.reset;
