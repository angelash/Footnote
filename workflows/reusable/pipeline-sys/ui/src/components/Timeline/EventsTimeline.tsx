/**
 * Events Timeline Component
 * 事件时间线
 */

import { useRef, useEffect, useState } from 'react';
import { useRunStore } from '../../state/runStore';
import type { IEvent, EventType } from '../../types/dto';
import './EventsTimeline.css';

export function EventsTimeline() {
  const { events } = useRunStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // 自动滚动到底部（受 checkbox 控制）
  useEffect(() => {
    if (autoScroll && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'RUN_STARTED':
        return '▶';
      case 'RUN_FINISHED':
        return '■';
      case 'RUN_CANCEL_REQUESTED':
      case 'RUN_CANCELLED':
        return '⊘';
      case 'NODE_STARTED':
        return '●';
      case 'NODE_FINISHED':
        return '◉';
      case 'NODE_LOG':
        return '┃';
      case 'NODE_RETRY_SCHEDULED':
        return '↻';
      case 'NODE_TIMEOUT':
        return '⏱';
      case 'LOCK_ACQUIRED':
      case 'LOCK_RELEASED':
        return '🔒';
      case 'LOCK_STALE_CLEARED':
        return '🗑';
      default:
        return '○';
    }
  };

  const getEventClass = (event: IEvent) => {
    if (event.type.includes('CANCEL')) return 'event-cancelled';
    if (event.type.includes('TIMEOUT')) return 'event-timeout';
    if (event.type.includes('FINISHED')) {
      const payload = event.payload as { status?: string; ok?: boolean };
      if (payload.status === 'FAILED' || payload.ok === false) return 'event-failed';
      if (payload.status === 'SUCCESS' || payload.ok === true) return 'event-success';
    }
    if (event.type === 'NODE_STARTED' || event.type === 'RUN_STARTED') return 'event-running';
    if (event.type === 'NODE_LOG') return 'event-log';
    return '';
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatPayload = (event: IEvent) => {
    const payload = event.payload;
    
    // NODE_LOG: 显示日志文本
    if (event.type === 'NODE_LOG') {
      const logPayload = payload as { text?: string; stream?: string };
      const text = logPayload.text || '';
      const truncated = text.length > 200 ? text.slice(0, 200) + '...' : text;
      return truncated;
    }

    // NODE_FINISHED: 显示状态和耗时
    if (event.type === 'NODE_FINISHED') {
      const finishPayload = payload as { status?: string; elapsed_ms?: number };
      return `${finishPayload.status} (${finishPayload.elapsed_ms}ms)`;
    }

    // RUN_FINISHED: 显示结果
    if (event.type === 'RUN_FINISHED') {
      const runPayload = payload as { ok?: boolean; elapsed_ms?: number };
      return runPayload.ok ? `✓ Success (${runPayload.elapsed_ms}ms)` : '✗ Failed';
    }

    // 其他事件：简单显示
    return '';
  };

  return (
    <div className="events-timeline">
      <div className="timeline-header">
        <h4>Events Timeline</h4>
        <div className="timeline-controls">
          <label className="auto-scroll-toggle">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <span>自动滚动</span>
          </label>
          <span className="event-count">{events.length} events</span>
        </div>
      </div>
      
      <div className="timeline-content" ref={contentRef}>
        {events.length === 0 ? (
          <div className="timeline-empty">Waiting for events...</div>
        ) : (
          events.map((event) => (
            <div key={event.seq} className={`timeline-event ${getEventClass(event)}`}>
              <span className="event-time">{formatTime(event.ts)}</span>
              <span className="event-icon">{getEventIcon(event.type as EventType)}</span>
              <span className="event-type">{event.type}</span>
              {event.node_id && <span className="event-node">{event.node_id}</span>}
              <span className="event-payload">{formatPayload(event)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

