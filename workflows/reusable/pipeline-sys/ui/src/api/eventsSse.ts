/**
 * Events SSE Client
 * SSE 订阅与重连
 */

import type { IEvent } from '../types/dto';

export interface IEventsSseOptions {
  /** 从哪个 seq 开始 */
  fromSeq?: number;
  /** 事件回调 */
  onEvent?: (event: IEvent) => void;
  /** 连接打开回调 */
  onOpen?: () => void;
  /** 连接关闭回调 */
  onClose?: () => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * 创建 SSE 连接
 */
export function createEventsSse(runId: string, options: IEventsSseOptions = {}): {
  close: () => void;
} {
  const { fromSeq = 0, onEvent, onOpen, onClose, onError } = options;

  let eventSource: EventSource | null = null;
  let closed = false;

  const connect = () => {
    if (closed) return;

    const url = `/api/runs/${runId}/events`;
    eventSource = new EventSource(url);

    // 设置 Last-Event-ID（用于断线重连）
    if (fromSeq > 0) {
      // EventSource 不支持自定义 header，需要在 URL 中传递
      // 或者在服务端支持 query param
    }

    eventSource.onopen = () => {
      onOpen?.();
    };

    eventSource.onerror = () => {
      onError?.(new Error('SSE connection error'));
      // 自动重连由 EventSource 处理
    };

    // 监听所有事件类型
    eventSource.addEventListener('connected', (e) => {
      // 连接确认
      console.log('[SSE] Connected:', (e as MessageEvent).data);
    });

    eventSource.addEventListener('RUN_STARTED', handleEvent);
    eventSource.addEventListener('RUN_FINISHED', handleEvent);
    eventSource.addEventListener('RUN_CANCEL_REQUESTED', handleEvent);
    eventSource.addEventListener('RUN_CANCELLED', handleEvent);
    eventSource.addEventListener('NODE_STARTED', handleEvent);
    eventSource.addEventListener('NODE_LOG', handleEvent);
    eventSource.addEventListener('NODE_FINISHED', handleEvent);
    eventSource.addEventListener('NODE_RETRY_SCHEDULED', handleEvent);
    eventSource.addEventListener('NODE_TIMEOUT', handleEvent);
    eventSource.addEventListener('LOCK_ACQUIRED', handleEvent);
    eventSource.addEventListener('LOCK_STALE_CLEARED', handleEvent);
    eventSource.addEventListener('LOCK_RELEASED', handleEvent);
    eventSource.addEventListener('error', (e) => {
      const data = (e as MessageEvent).data;
      if (data) {
        try {
          const parsed = JSON.parse(data);
          onError?.(new Error(parsed.error || 'Unknown error'));
        } catch {
          // ignore
        }
      }
    });
  };

  const handleEvent = (e: Event) => {
    const messageEvent = e as MessageEvent;
    try {
      const event = JSON.parse(messageEvent.data) as IEvent;
      onEvent?.(event);
    } catch (err) {
      console.error('[SSE] Failed to parse event:', err);
    }
  };

  const close = () => {
    closed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    onClose?.();
  };

  connect();

  return { close };
}

