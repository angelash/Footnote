/**
 * File Node Executor
 * 
 * 文件操作节点
 * 
 * 支持的操作:
 * - read: 读取文件内容
 * - write: 写入文件
 * - append: 追加内容
 * - delete: 删除文件
 * - copy: 复制文件
 * - move: 移动文件
 * - exists: 检查文件是否存在
 * - list: 列出目录内容
 * - mkdir: 创建目录
 * - stat: 获取文件信息
 * 
 * Config:
 * - operation: 操作类型
 * - path: 文件路径
 * - content: 写入内容 (write/append)
 * - destination: 目标路径 (copy/move)
 * - encoding: 编码 (默认 'utf-8')
 * - glob: glob 模式 (list)
 * - recursive: 是否递归 (mkdir/list)
 * 
 * @module lib/v2/executors/file
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NodeExecutor, successResult, failureResult } from '../executor-base.mjs';

/**
 * 支持的操作
 */
const OPERATIONS = ['read', 'write', 'append', 'delete', 'copy', 'move', 'exists', 'list', 'mkdir', 'stat'];

/**
 * File 节点执行器
 */
export class FileExecutor extends NodeExecutor {
  constructor() {
    super('file');
  }

  /**
   * 执行文件操作
   * @param {Object} config - 节点配置
   * @param {Object} context - 执行上下文
   * @param {Object} options - 执行选项
   * @returns {Promise<NodeResult>}
   */
  async execute(config, context, options) {
    const {
      operation,
      path: filePath,
      content,
      destination,
      encoding = 'utf-8',
      recursive = false,
    } = config;

    if (!operation) {
      return failureResult('File operation is required');
    }

    if (!OPERATIONS.includes(operation)) {
      return failureResult(`Unsupported operation: ${operation}. Supported: ${OPERATIONS.join(', ')}`);
    }

    if (!filePath && operation !== 'list') {
      return failureResult('File path is required');
    }

    this.info(`File operation: ${operation}`, { path: filePath });

    try {
      switch (operation) {
        case 'read':
          return await this._read(filePath, encoding);

        case 'write':
          return await this._write(filePath, content, encoding);

        case 'append':
          return await this._append(filePath, content, encoding);

        case 'delete':
          return await this._delete(filePath);

        case 'copy':
          return await this._copy(filePath, destination);

        case 'move':
          return await this._move(filePath, destination);

        case 'exists':
          return await this._exists(filePath);

        case 'list':
          return await this._list(filePath || '.', recursive);

        case 'mkdir':
          return await this._mkdir(filePath, recursive);

        case 'stat':
          return await this._stat(filePath);

        default:
          return failureResult(`Operation not implemented: ${operation}`);
      }
    } catch (err) {
      this.error(`File operation failed: ${err.message}`);
      return failureResult(`File operation failed: ${err.message}`);
    }
  }

  /**
   * 读取文件
   */
  async _read(filePath, encoding) {
    const absolutePath = path.resolve(filePath);
    const content = await fs.readFile(absolutePath, encoding);
    this.info(`Read ${content.length} characters from ${filePath}`);
    return successResult({
      path: absolutePath,
      content,
      size: Buffer.byteLength(content, encoding),
    });
  }

  /**
   * 写入文件
   */
  async _write(filePath, content, encoding) {
    if (content === undefined || content === null) {
      return failureResult('Content is required for write operation');
    }

    const absolutePath = path.resolve(filePath);
    
    // 确保目录存在
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    
    const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    await fs.writeFile(absolutePath, data, encoding);
    
    const stats = await fs.stat(absolutePath);
    this.info(`Wrote ${stats.size} bytes to ${filePath}`);
    
    return successResult({
      path: absolutePath,
      size: stats.size,
      written: true,
    });
  }

  /**
   * 追加内容
   */
  async _append(filePath, content, encoding) {
    if (content === undefined || content === null) {
      return failureResult('Content is required for append operation');
    }

    const absolutePath = path.resolve(filePath);
    
    // 确保目录存在
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    
    const data = typeof content === 'string' ? content : JSON.stringify(content);
    await fs.appendFile(absolutePath, data, encoding);
    
    const stats = await fs.stat(absolutePath);
    this.info(`Appended to ${filePath}, total size: ${stats.size}`);
    
    return successResult({
      path: absolutePath,
      size: stats.size,
      appended: true,
    });
  }

  /**
   * 删除文件
   */
  async _delete(filePath) {
    const absolutePath = path.resolve(filePath);
    
    try {
      const stats = await fs.stat(absolutePath);
      if (stats.isDirectory()) {
        await fs.rm(absolutePath, { recursive: true });
        this.info(`Deleted directory: ${filePath}`);
      } else {
        await fs.unlink(absolutePath);
        this.info(`Deleted file: ${filePath}`);
      }
      return successResult({ path: absolutePath, deleted: true });
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.warn(`File not found: ${filePath}`);
        return successResult({ path: absolutePath, deleted: false, notFound: true });
      }
      throw err;
    }
  }

  /**
   * 复制文件
   */
  async _copy(srcPath, destPath) {
    if (!destPath) {
      return failureResult('Destination is required for copy operation');
    }

    const absoluteSrc = path.resolve(srcPath);
    const absoluteDest = path.resolve(destPath);
    
    // 确保目标目录存在
    await fs.mkdir(path.dirname(absoluteDest), { recursive: true });
    
    await fs.copyFile(absoluteSrc, absoluteDest);
    
    const stats = await fs.stat(absoluteDest);
    this.info(`Copied ${srcPath} to ${destPath}`);
    
    return successResult({
      source: absoluteSrc,
      destination: absoluteDest,
      size: stats.size,
      copied: true,
    });
  }

  /**
   * 移动文件
   */
  async _move(srcPath, destPath) {
    if (!destPath) {
      return failureResult('Destination is required for move operation');
    }

    const absoluteSrc = path.resolve(srcPath);
    const absoluteDest = path.resolve(destPath);
    
    // 确保目标目录存在
    await fs.mkdir(path.dirname(absoluteDest), { recursive: true });
    
    await fs.rename(absoluteSrc, absoluteDest);
    
    this.info(`Moved ${srcPath} to ${destPath}`);
    
    return successResult({
      source: absoluteSrc,
      destination: absoluteDest,
      moved: true,
    });
  }

  /**
   * 检查文件是否存在
   */
  async _exists(filePath) {
    const absolutePath = path.resolve(filePath);
    
    try {
      const stats = await fs.stat(absolutePath);
      return successResult({
        path: absolutePath,
        exists: true,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      });
    } catch (err) {
      if (err.code === 'ENOENT') {
        return successResult({
          path: absolutePath,
          exists: false,
        });
      }
      throw err;
    }
  }

  /**
   * 列出目录内容
   */
  async _list(dirPath, recursive) {
    const absolutePath = path.resolve(dirPath);
    
    const items = [];
    
    async function scan(dir, prefix = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const relativePath = prefix ? path.join(prefix, entry.name) : entry.name;
        const fullPath = path.join(dir, entry.name);
        
        const item = {
          name: entry.name,
          path: relativePath,
          isFile: entry.isFile(),
          isDirectory: entry.isDirectory(),
        };
        
        if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          item.size = stats.size;
          item.mtime = stats.mtime.toISOString();
        }
        
        items.push(item);
        
        if (recursive && entry.isDirectory()) {
          await scan(fullPath, relativePath);
        }
      }
    }
    
    await scan(absolutePath);
    
    this.info(`Listed ${items.length} items in ${dirPath}`);
    
    return successResult({
      path: absolutePath,
      count: items.length,
      items,
    });
  }

  /**
   * 创建目录
   */
  async _mkdir(dirPath, recursive) {
    const absolutePath = path.resolve(dirPath);
    
    await fs.mkdir(absolutePath, { recursive });
    
    this.info(`Created directory: ${dirPath}`);
    
    return successResult({
      path: absolutePath,
      created: true,
    });
  }

  /**
   * 获取文件信息
   */
  async _stat(filePath) {
    const absolutePath = path.resolve(filePath);
    const stats = await fs.stat(absolutePath);
    
    return successResult({
      path: absolutePath,
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
      atime: stats.atime.toISOString(),
      mtime: stats.mtime.toISOString(),
      ctime: stats.ctime.toISOString(),
      birthtime: stats.birthtime.toISOString(),
    });
  }
}

/**
 * 创建 File 执行器实例
 * @returns {FileExecutor}
 */
export function createFileExecutor() {
  return new FileExecutor();
}

export default FileExecutor;

