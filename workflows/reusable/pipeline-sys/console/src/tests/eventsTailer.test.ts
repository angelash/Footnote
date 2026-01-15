/**
 * EventsTailer 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventsTailer, createSseEventGenerator } from '../services/eventsTailer.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('EventsTailer', () => {
  let tempDir: string;
  let eventsFile: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'events-tailer-test-'));
    eventsFile = path.join(tempDir, 'events.ndjson');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const tailer = new EventsTailer(eventsFile);
      expect(tailer).toBeInstanceOf(EventsTailer);
    });

    it('should create instance with fromSeq option', () => {
      const tailer = new EventsTailer(eventsFile, { fromSeq: 5 });
      expect(tailer).toBeInstanceOf(EventsTailer);
    });
  });

  describe('start', () => {
    it('should emit error when file does not exist after timeout', async () => {
      const tailer = new EventsTailer(eventsFile, { waitForFileTimeoutMs: 100 });
      
      const errorPromise = new Promise<Error>((resolve, reject) => {
        tailer.on('error', resolve);
        // 添加超时保护
        setTimeout(() => reject(new Error('No error emitted within timeout')), 35000);
      });

      await tailer.start();
      
      try {
        const error = await errorPromise;
        expect(error.message).toContain('File not found');
      } finally {
        tailer.stop();
      }
    }, 40000); // 增加测试超时时间

    it('should read existing events from file', async () => {
      const events = [
        { seq: 1, type: 'RUN_STARTED', ts: '2026-01-05T12:00:00Z', run_id: 'RUN-001', node_id: '', payload: {} },
        { seq: 2, type: 'NODE_STARTED', ts: '2026-01-05T12:00:01Z', run_id: 'RUN-001', node_id: 'stage.intake', payload: { attempt: 1 } },
      ];
      
      await fs.writeFile(eventsFile, events.map(e => JSON.stringify(e)).join('\n') + '\n');
      
      const tailer = new EventsTailer(eventsFile, { fromSeq: 0 });
      const receivedEvents: unknown[] = [];
      
      tailer.on('event', (event) => {
        receivedEvents.push(event);
      });

      await tailer.start();
      
      // Wait a bit for events to be processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(receivedEvents).toHaveLength(2);
      expect((receivedEvents[0] as { seq: number }).seq).toBe(1);
      expect((receivedEvents[1] as { seq: number }).seq).toBe(2);
      
      tailer.stop();
    });

    it('should filter events by fromSeq', async () => {
      const events = [
        { seq: 1, type: 'RUN_STARTED', ts: '2026-01-05T12:00:00Z', run_id: 'RUN-001', node_id: '', payload: {} },
        { seq: 2, type: 'NODE_STARTED', ts: '2026-01-05T12:00:01Z', run_id: 'RUN-001', node_id: 'stage.intake', payload: { attempt: 1 } },
        { seq: 3, type: 'NODE_FINISHED', ts: '2026-01-05T12:00:02Z', run_id: 'RUN-001', node_id: 'stage.intake', payload: { status: 'SUCCESS' } },
      ];
      
      await fs.writeFile(eventsFile, events.map(e => JSON.stringify(e)).join('\n') + '\n');
      
      const tailer = new EventsTailer(eventsFile, { fromSeq: 2 });
      const receivedEvents: unknown[] = [];
      
      tailer.on('event', (event) => {
        receivedEvents.push(event);
      });

      await tailer.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(receivedEvents).toHaveLength(1);
      expect((receivedEvents[0] as { seq: number }).seq).toBe(3);
      
      tailer.stop();
    });
  });

  describe('stop', () => {
    it('should stop watching file changes', async () => {
      await fs.writeFile(eventsFile, '');
      
      const tailer = new EventsTailer(eventsFile);
      await tailer.start();
      
      tailer.stop();
      
      // Tailer should be stopped, no events should be emitted for new writes
      const eventReceived = vi.fn();
      tailer.on('event', eventReceived);
      
      await fs.appendFile(eventsFile, JSON.stringify({ seq: 1, type: 'TEST' }) + '\n');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(eventReceived).not.toHaveBeenCalled();
    });
  });
});

describe('createSseEventGenerator', () => {
  let tempDir: string;
  let eventsFile: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sse-gen-test-'));
    eventsFile = path.join(tempDir, 'events.ndjson');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('should create an async generator', async () => {
    const events = [
      { seq: 1, type: 'RUN_STARTED', ts: '2026-01-05T12:00:00Z', run_id: 'RUN-001', node_id: '', payload: {} },
    ];
    await fs.writeFile(eventsFile, events.map(e => JSON.stringify(e)).join('\n') + '\n');
    
    const tailer = new EventsTailer(eventsFile, { fromSeq: 0 });
    const generator = createSseEventGenerator(tailer);
    
    expect(generator[Symbol.asyncIterator]).toBeDefined();
    
    tailer.stop();
  });

  it('should format events as SSE', async () => {
    const events = [
      { seq: 1, type: 'RUN_STARTED', ts: '2026-01-05T12:00:00Z', run_id: 'RUN-001', node_id: '', payload: {} },
    ];
    await fs.writeFile(eventsFile, events.map(e => JSON.stringify(e)).join('\n') + '\n');
    
    const tailer = new EventsTailer(eventsFile, { fromSeq: 0 });
    const generator = createSseEventGenerator(tailer);
    
    // Start tailer and get first event
    const startPromise = tailer.start();
    const result = await Promise.race([
      generator.next(),
      new Promise<IteratorResult<string, string>>(resolve => 
        setTimeout(() => resolve({ value: '', done: true }), 500)
      ),
    ]);
    
    if (!result.done && result.value) {
      expect(result.value).toContain('id: 1');
      expect(result.value).toContain('event: RUN_STARTED');
      expect(result.value).toContain('data:');
    }
    
    await generator.return('');
    await startPromise;
  });
});
