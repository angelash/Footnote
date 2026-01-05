/**
 * Events Tailer Service
 * tail events.ndjson -> SSE
 */

import { promises as fs, createReadStream, watch } from 'node:fs';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { parseNdjsonLine } from '@pipeline-sys/shared';
import type { IEventV1 } from '@pipeline-sys/shared';

const POLL_INTERVAL_MS = 500;
const MAX_RECONNECT_WAIT_MS = 30000;

export interface ITailerOptions {
  /** 从哪个 seq 开始（用于断线重连） */
  fromSeq?: number;
  /** 文件不存在时的等待超时 */
  waitForFileTimeoutMs?: number;
}

/**
 * 事件 Tailer
 * 支持断线重连，文件不存在时等待
 */
export class EventsTailer extends EventEmitter {
  private _filePath: string;
  private _fromSeq: number;
  private _position: number = 0;
  private _watcher: ReturnType<typeof watch> | null = null;
  private _pollTimer: ReturnType<typeof setTimeout> | null = null;
  private _stopped: boolean = false;

  constructor(filePath: string, options: ITailerOptions = {}) {
    super();
    this._filePath = filePath;
    this._fromSeq = options.fromSeq ?? 0;
  }

  /**
   * 开始 tail
   */
  async start(): Promise<void> {
    this._stopped = false;
    await this._waitForFile();
    await this._readNewLines();
    this._startWatching();
  }

  /**
   * 停止 tail
   */
  stop(): void {
    this._stopped = true;
    if (this._watcher) {
      this._watcher.close();
      this._watcher = null;
    }
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
  }

  /**
   * 等待文件存在
   */
  private async _waitForFile(): Promise<void> {
    const startTime = Date.now();
    
    while (!this._stopped) {
      try {
        await fs.access(this._filePath);
        return;
      } catch {
        if (Date.now() - startTime > MAX_RECONNECT_WAIT_MS) {
          this.emit('error', new Error('File not found: ' + this._filePath));
          return;
        }
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    }
  }

  /**
   * 读取新行
   */
  private async _readNewLines(): Promise<void> {
    if (this._stopped) return;

    try {
      const stat = await fs.stat(this._filePath);
      
      if (stat.size <= this._position) {
        return;
      }

      const content = await fs.readFile(this._filePath, 'utf8');
      const lines = content.slice(this._position).split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const event = parseNdjsonLine(line);
        if (event && event.seq > this._fromSeq) {
          this.emit('event', event);
        }
      }
      
      this._position = content.length;
    } catch (e) {
      this.emit('error', e);
    }
  }

  /**
   * 开始监视文件变化
   */
  private _startWatching(): void {
    if (this._stopped) return;

    try {
      this._watcher = watch(path.dirname(this._filePath), async (eventType, filename) => {
        if (filename === path.basename(this._filePath)) {
          await this._readNewLines();
        }
      });

      this._watcher.on('error', (e) => {
        this.emit('error', e);
        this._fallbackToPoll();
      });
    } catch {
      this._fallbackToPoll();
    }
  }

  /**
   * 回退到轮询模式
   */
  private _fallbackToPoll(): void {
    if (this._stopped) return;

    this._pollTimer = setInterval(async () => {
      if (this._stopped) {
        if (this._pollTimer) clearInterval(this._pollTimer);
        return;
      }
      await this._readNewLines();
    }, POLL_INTERVAL_MS);
  }
}

/**
 * 创建 SSE 响应生成器
 */
export function createSseEventGenerator(tailer: EventsTailer): AsyncGenerator<string, void, unknown> {
  const events: IEventV1[] = [];
  let resolveNext: ((value: IteratorResult<string, void>) => void) | null = null;
  let done = false;

  tailer.on('event', (event: IEventV1) => {
    const data = `id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    if (resolveNext) {
      resolveNext({ value: data, done: false });
      resolveNext = null;
    } else {
      events.push(event);
    }
  });

  tailer.on('error', () => {
    done = true;
    if (resolveNext) {
      resolveNext({ value: undefined as unknown as string, done: true });
    }
  });

  return {
    async next(): Promise<IteratorResult<string, void>> {
      if (done) {
        return { value: undefined as unknown as string, done: true };
      }
      
      const event = events.shift();
      if (event) {
        return { value: `id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`, done: false };
      }
      
      return new Promise(resolve => {
        resolveNext = resolve;
      });
    },
    async return(): Promise<IteratorResult<string, void>> {
      done = true;
      tailer.stop();
      return { value: undefined as unknown as string, done: true };
    },
    throw(): Promise<IteratorResult<string, void>> {
      done = true;
      tailer.stop();
      return Promise.resolve({ value: undefined as unknown as string, done: true });
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}

