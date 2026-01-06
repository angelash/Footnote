/**
 * Notify Node Executor
 * 
 * 通知发送节点
 * 
 * 支持的渠道:
 * - console: 控制台输出
 * - http/webhook: HTTP Webhook
 * - log: 写入日志文件
 * 
 * Config:
 * - channel: 通知渠道
 * - message: 消息内容（支持模板变量）
 * - level: 通知级别 ('info'/'success'/'warning'/'error')
 * - webhookUrl: Webhook URL (http/webhook 渠道)
 * - webhookMethod: HTTP 方法 (默认 'POST')
 * - webhookHeaders: 自定义头
 * - logPath: 日志文件路径 (log 渠道)
 * - title: 标题
 * - data: 附加数据
 * 
 * @module lib/v2/executors/notify
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NodeExecutor, successResult, failureResult } from '../executor-base.mjs';

/**
 * 支持的渠道
 */
const CHANNELS = ['console', 'http', 'webhook', 'log'];

/**
 * 通知级别图标
 */
const LEVEL_ICONS = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

/**
 * Notify 节点执行器
 */
export class NotifyExecutor extends NodeExecutor {
  constructor() {
    super('notify');
  }

  /**
   * 发送通知
   * @param {Object} config - 节点配置
   * @param {Object} context - 执行上下文
   * @param {Object} options - 执行选项
   * @returns {Promise<NodeResult>}
   */
  async execute(config, context, options) {
    const {
      channel = 'console',
      message = '',
      level = 'info',
      title = '',
      data = {},
      webhookUrl,
      webhookMethod = 'POST',
      webhookHeaders = {},
      logPath,
    } = config;

    if (!CHANNELS.includes(channel)) {
      return failureResult(`Unsupported channel: ${channel}. Supported: ${CHANNELS.join(', ')}`);
    }

    this.info(`Sending notification via ${channel}`, { level, title });

    try {
      switch (channel) {
        case 'console':
          return await this._notifyConsole(message, level, title, data);

        case 'http':
        case 'webhook':
          return await this._notifyWebhook(message, level, title, data, {
            url: webhookUrl,
            method: webhookMethod,
            headers: webhookHeaders,
          }, options);

        case 'log':
          return await this._notifyLog(message, level, title, data, logPath);

        default:
          return failureResult(`Channel not implemented: ${channel}`);
      }
    } catch (err) {
      this.error(`Notification failed: ${err.message}`);
      return failureResult(`Notification failed: ${err.message}`);
    }
  }

  /**
   * 控制台通知
   */
  async _notifyConsole(message, level, title, data) {
    const icon = LEVEL_ICONS[level] || LEVEL_ICONS.info;
    const timestamp = new Date().toISOString();
    
    let output = `\n${icon} [${timestamp}]`;
    if (title) {
      output += ` ${title}`;
    }
    output += `\n${message}`;
    
    if (Object.keys(data).length > 0) {
      output += `\n${JSON.stringify(data, null, 2)}`;
    }
    
    // 根据级别选择输出方法
    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warning':
        console.warn(output);
        break;
      default:
        console.log(output);
    }

    return successResult({
      channel: 'console',
      level,
      message,
      timestamp,
    });
  }

  /**
   * Webhook 通知
   */
  async _notifyWebhook(message, level, title, data, webhookConfig, options) {
    const { url, method, headers } = webhookConfig;

    if (!url) {
      return failureResult('Webhook URL is required');
    }

    const timestamp = new Date().toISOString();
    
    // 构建请求体
    const payload = {
      title: title || `Notification - ${level.toUpperCase()}`,
      msg: message,
      level,
      timestamp,
      data,
    };

    // 创建 AbortController
    const controller = new AbortController();
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const responseText = await response.text();
      let responseBody;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }

      if (response.ok) {
        this.info(`Webhook notification sent: ${response.status}`);
        return successResult({
          channel: 'webhook',
          url,
          status: response.status,
          response: responseBody,
          timestamp,
        });
      } else {
        this.warn(`Webhook returned error: ${response.status}`);
        return failureResult(`Webhook error: ${response.status}`, {
          channel: 'webhook',
          url,
          status: response.status,
          response: responseBody,
          timestamp,
        });
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Execution cancelled');
      }
      throw err;
    }
  }

  /**
   * 日志文件通知
   */
  async _notifyLog(message, level, title, data, logPath) {
    const timestamp = new Date().toISOString();
    const icon = LEVEL_ICONS[level] || LEVEL_ICONS.info;
    
    // 构建日志行
    let logLine = `[${timestamp}] ${icon} [${level.toUpperCase()}]`;
    if (title) {
      logLine += ` ${title}:`;
    }
    logLine += ` ${message}`;
    
    if (Object.keys(data).length > 0) {
      logLine += ` | data=${JSON.stringify(data)}`;
    }
    logLine += '\n';

    // 确定日志路径
    const targetPath = logPath || path.join(process.cwd(), 'logs', 'notifications.log');
    const absolutePath = path.resolve(targetPath);

    // 确保目录存在
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    // 追加到日志文件
    await fs.appendFile(absolutePath, logLine, 'utf-8');

    this.info(`Notification logged to ${targetPath}`);

    return successResult({
      channel: 'log',
      path: absolutePath,
      level,
      message,
      timestamp,
    });
  }
}

/**
 * 创建 Notify 执行器实例
 * @returns {NotifyExecutor}
 */
export function createNotifyExecutor() {
  return new NotifyExecutor();
}

export default NotifyExecutor;

