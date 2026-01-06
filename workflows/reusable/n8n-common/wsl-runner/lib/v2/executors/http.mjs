/**
 * HTTP Node Executor
 * 
 * HTTP 请求节点
 * 
 * Config:
 * - method: HTTP 方法 (GET/POST/PUT/PATCH/DELETE/HEAD)
 * - url: 请求 URL
 * - headers: 请求头
 * - query: 查询参数
 * - body: 请求体
 * - bodyType: 请求体类型 ('json'/'form'/'text'/'binary')
 * - auth: 认证配置 { type, credentials }
 * - timeout: 超时时间 (ms)
 * - validateStatus: 状态码验证表达式
 * - followRedirects: 是否跟随重定向 (默认 true)
 * - maxRedirects: 最大重定向次数 (默认 5)
 * 
 * @module lib/v2/executors/http
 */

import { NodeExecutor, successResult, failureResult } from '../executor-base.mjs';

/**
 * 支持的 HTTP 方法
 */
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/**
 * HTTP 节点执行器
 */
export class HttpExecutor extends NodeExecutor {
  constructor() {
    super('http');
  }

  /**
   * 执行 HTTP 请求
   * @param {Object} config - 节点配置
   * @param {Object} context - 执行上下文
   * @param {Object} options - 执行选项
   * @returns {Promise<NodeResult>}
   */
  async execute(config, context, options) {
    const {
      method = 'GET',
      url,
      headers = {},
      query = {},
      body,
      bodyType = 'json',
      auth,
      timeout = 30000,
      validateStatus,
      followRedirects = true,
      maxRedirects = 5,
    } = config;

    if (!url) {
      return failureResult('URL is required');
    }

    const upperMethod = method.toUpperCase();
    if (!METHODS.includes(upperMethod)) {
      return failureResult(`Unsupported HTTP method: ${method}. Supported: ${METHODS.join(', ')}`);
    }

    this.info(`HTTP ${upperMethod} ${url}`);

    try {
      // 构建完整 URL（带查询参数）
      const fullUrl = this._buildUrl(url, query);

      // 构建请求头
      const requestHeaders = { ...headers };

      // 处理认证
      if (auth) {
        const authHeader = this._buildAuthHeader(auth);
        if (authHeader) {
          requestHeaders['Authorization'] = authHeader;
        }
      }

      // 构建请求体
      let requestBody = undefined;
      if (body && ['POST', 'PUT', 'PATCH'].includes(upperMethod)) {
        const { processedBody, contentType } = this._processBody(body, bodyType);
        requestBody = processedBody;
        if (contentType && !requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = contentType;
        }
      }

      // 创建 AbortController 用于超时和取消
      const controller = new AbortController();
      let timeoutId;

      // 设置超时
      if (timeout > 0) {
        timeoutId = setTimeout(() => controller.abort(), timeout);
      }

      // 处理外部取消信号
      if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort());
      }

      try {
        // 发送请求
        const response = await fetch(fullUrl, {
          method: upperMethod,
          headers: requestHeaders,
          body: requestBody,
          signal: controller.signal,
          redirect: followRedirects ? 'follow' : 'manual',
        });

        // 清除超时
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // 获取响应头
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // 获取响应体
        const contentType = response.headers.get('content-type') || '';
        let responseBody;

        if (contentType.includes('application/json')) {
          try {
            responseBody = await response.json();
          } catch {
            responseBody = await response.text();
          }
        } else if (contentType.includes('text/')) {
          responseBody = await response.text();
        } else {
          // 二进制数据转为 base64
          const buffer = await response.arrayBuffer();
          responseBody = {
            type: 'binary',
            base64: Buffer.from(buffer).toString('base64'),
            size: buffer.byteLength,
          };
        }

        const output = {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody,
          url: response.url,
          redirected: response.redirected,
        };

        // 验证状态码
        const isSuccess = this._validateStatus(response.status, validateStatus);

        if (isSuccess) {
          this.info(`HTTP response: ${response.status} ${response.statusText}`);
          return successResult(output);
        } else {
          this.warn(`HTTP error: ${response.status} ${response.statusText}`);
          return failureResult(`HTTP ${response.status} ${response.statusText}`, output);
        }

      } catch (err) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (err.name === 'AbortError') {
          if (options.signal?.aborted) {
            throw new Error('Execution cancelled');
          }
          return failureResult('Request timeout');
        }
        throw err;
      }

    } catch (err) {
      this.error(`HTTP request failed: ${err.message}`);
      return failureResult(`HTTP request failed: ${err.message}`);
    }
  }

  /**
   * 构建完整 URL
   */
  _buildUrl(baseUrl, query) {
    const url = new URL(baseUrl);
    
    if (query && typeof query === 'object') {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }
    
    return url.toString();
  }

  /**
   * 构建认证头
   */
  _buildAuthHeader(auth) {
    const { type, credentials } = auth;

    switch (type) {
      case 'basic': {
        const [username, password] = credentials.split(':');
        const encoded = Buffer.from(`${username}:${password || ''}`).toString('base64');
        return `Basic ${encoded}`;
      }

      case 'bearer':
        return `Bearer ${credentials}`;

      case 'apikey':
        // API Key 通常放在自定义头中，这里只处理 Authorization 头的情况
        return credentials;

      default:
        this.warn(`Unknown auth type: ${type}`);
        return null;
    }
  }

  /**
   * 处理请求体
   */
  _processBody(body, bodyType) {
    switch (bodyType) {
      case 'json':
        return {
          processedBody: typeof body === 'string' ? body : JSON.stringify(body),
          contentType: 'application/json',
        };

      case 'form': {
        if (typeof body === 'object') {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(body)) {
            params.append(key, String(value));
          }
          return {
            processedBody: params.toString(),
            contentType: 'application/x-www-form-urlencoded',
          };
        }
        return { processedBody: body, contentType: 'application/x-www-form-urlencoded' };
      }

      case 'text':
        return {
          processedBody: String(body),
          contentType: 'text/plain',
        };

      case 'binary':
        return {
          processedBody: body,
          contentType: 'application/octet-stream',
        };

      default:
        return {
          processedBody: body,
          contentType: null,
        };
    }
  }

  /**
   * 验证状态码
   */
  _validateStatus(status, validateExpr) {
    // 默认：2xx 为成功
    if (!validateExpr) {
      return status >= 200 && status < 300;
    }

    // 自定义验证表达式
    try {
      // 简单表达式求值
      const fn = new Function('status', `return ${validateExpr}`);
      return Boolean(fn(status));
    } catch {
      // 表达式无效，使用默认规则
      return status >= 200 && status < 300;
    }
  }
}

/**
 * 创建 HTTP 执行器实例
 * @returns {HttpExecutor}
 */
export function createHttpExecutor() {
  return new HttpExecutor();
}

export default HttpExecutor;

