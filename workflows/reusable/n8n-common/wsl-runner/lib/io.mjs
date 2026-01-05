/**
 * IO utilities
 * 文件读写操作（含原子写入）
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

/**
 * 确保目录存在
 * @param {string} absDir 绝对路径
 */
export async function ensureDir(absDir) {
  await fs.mkdir(absDir, { recursive: true });
}

/**
 * 写入 JSON 文件
 * @param {string} absPath 绝对路径
 * @param {any} data 数据
 */
export async function writeJson(absPath, data) {
  await ensureDir(path.posix.dirname(absPath));
  await fs.writeFile(absPath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 写入文本文件
 * @param {string} absPath 绝对路径
 * @param {string} text 文本
 */
export async function writeText(absPath, text) {
  await ensureDir(path.posix.dirname(absPath));
  await fs.writeFile(absPath, text, 'utf8');
}

/**
 * 原子写入（tmp + rename）
 * @param {string} absPath 目标绝对路径
 * @param {string} content 内容
 */
export async function atomicWrite(absPath, content) {
  const dir = path.posix.dirname(absPath);
  await ensureDir(dir);
  
  const tmpName = `.tmp_${crypto.randomBytes(8).toString('hex')}`;
  const tmpPath = path.posix.join(dir, tmpName);
  
  await fs.writeFile(tmpPath, content, 'utf8');
  await fs.rename(tmpPath, absPath);
}

/**
 * 追加文本到文件
 * @param {string} absPath 绝对路径
 * @param {string} text 文本
 */
export async function appendText(absPath, text) {
  await ensureDir(path.posix.dirname(absPath));
  await fs.appendFile(absPath, text, 'utf8');
}

/**
 * 读取 JSON 文件
 * @param {string} absPath 绝对路径
 * @returns {Promise<any|null>} 数据或 null
 */
export async function readJson(absPath) {
  try {
    const content = await fs.readFile(absPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * 读取文本文件
 * @param {string} absPath 绝对路径
 * @returns {Promise<string|null>} 文本或 null
 */
export async function readText(absPath) {
  try {
    return await fs.readFile(absPath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * 检查文件是否存在
 * @param {string} absPath 绝对路径
 * @returns {Promise<boolean>}
 */
export async function exists(absPath) {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

