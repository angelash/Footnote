/**
 * QueuePanel 组件测试
 * 验证队列显示在关键场景下的正确性
 * 
 * 注意：组件使用 setInterval 进行自动刷新，测试使用 fake timers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { QueuePanel } from '../../components/Queue/QueuePanel';
import * as queueApi from '../../api/queueApi';

// Mock queue API
vi.mock('../../api/queueApi', async () => {
  const actual = await vi.importActual('../../api/queueApi');
  return {
    ...actual,
    getQueueStatus: vi.fn(),
    getQueueHistory: vi.fn(),
    pauseQueue: vi.fn(),
    resumeQueue: vi.fn(),
    clearQueue: vi.fn(),
    cancelTask: vi.fn(),
    retryTask: vi.fn(),
    setTaskPriority: vi.fn(),
    getSubtasks: vi.fn(),
  };
});

const mockGetQueueStatus = queueApi.getQueueStatus as ReturnType<typeof vi.fn>;
const mockGetQueueHistory = queueApi.getQueueHistory as ReturnType<typeof vi.fn>;
const mockPauseQueue = queueApi.pauseQueue as ReturnType<typeof vi.fn>;
const mockResumeQueue = queueApi.resumeQueue as ReturnType<typeof vi.fn>;

// 基础 Mock 数据
const mockEmptyStatus: queueApi.QueueStatus = {
  ok: true,
  paused: false,
  running_tasks: [],
  running_count: 0,
  queue: [],
  scheduler: {
    running_by_domain: {
      design: { count: 0, max: 1, tasks: [] },
      art: { count: 0, max: 1, tasks: [] },
      code: { count: 0, max: 1, tasks: [] },
      whitebox: { count: 0, max: 1, tasks: [] },
      readonly: { count: 0, max: 3, tasks: [] },
    },
    running_lock_keys: [],
    total_running: 0,
  },
  history_count: 0,
};

const mockEmptyHistory: queueApi.HistoryResponse = {
  ok: true,
  history: [],
  total: 0,
  limit: 20,
  offset: 0,
};

// 创建测试任务
function createMockTask(
  overrides: Partial<queueApi.QueuedTask> = {}
): queueApi.QueuedTask {
  return {
    id: `TASK-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    flowspec: 'test-flow.json',
    inputs: {},
    priority: 0,
    parent_id: null,
    status: 'queued',
    domain: 'code',
    access_mode: 'write',
    lock_key: null,
    queued_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('QueuePanel 组件', () => {
  beforeEach(() => {
    // 使用 fake timers 来处理 setInterval
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockGetQueueStatus.mockResolvedValue(mockEmptyStatus);
    mockGetQueueHistory.mockResolvedValue(mockEmptyHistory);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('初始加载', () => {
    it('加载完成后应显示队列标题', async () => {
      render(<QueuePanel />);

      // 等待初始加载
      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText('🚦 任务队列')).toBeInTheDocument();
      });
    });

    it('空队列时应显示空闲状态', async () => {
      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText('空闲')).toBeInTheDocument();
        expect(screen.getByText('暂无等待任务')).toBeInTheDocument();
      });
    });
  });

  describe('队列状态显示', () => {
    it('应正确显示运行中的任务数量', async () => {
      const runningTask = createMockTask({
        id: 'TASK-RUNNING-001',
        status: 'running',
        domain: 'code',
      });

      mockGetQueueStatus.mockResolvedValue({
        ...mockEmptyStatus,
        running_tasks: [runningTask],
        running_count: 1,
      });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText(/当前执行 \(1\)/)).toBeInTheDocument();
      });
    });

    it('应正确显示等待队列数量', async () => {
      const queuedTask = createMockTask({
        id: 'TASK-QUEUED-001',
        status: 'queued',
      });

      mockGetQueueStatus.mockResolvedValue({
        ...mockEmptyStatus,
        queue: [queuedTask],
      });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText(/等待队列 \(1\)/)).toBeInTheDocument();
      });
    });

    it('暂停状态时应显示"队列已暂停"', async () => {
      mockGetQueueStatus.mockResolvedValue({
        ...mockEmptyStatus,
        paused: true,
      });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText('队列已暂停')).toBeInTheDocument();
      });
    });
  });

  describe('领域分组显示', () => {
    it('应按领域分组显示运行中的任务', async () => {
      const codeTasks = [
        createMockTask({ id: 'CODE-001', status: 'running', domain: 'code' }),
      ];
      const artTasks = [
        createMockTask({ id: 'ART-001', status: 'running', domain: 'art' }),
      ];

      mockGetQueueStatus.mockResolvedValue({
        ...mockEmptyStatus,
        running_tasks: [...codeTasks, ...artTasks],
        running_count: 2,
      });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText(/💻 程序/)).toBeInTheDocument();
        expect(screen.getByText(/🎨 美术/)).toBeInTheDocument();
      });
    });

    it('应正确显示领域颜色标识', async () => {
      const task = createMockTask({
        id: 'TASK-DOMAIN-TEST',
        status: 'queued',
        domain: 'design',
      });

      mockGetQueueStatus.mockResolvedValue({
        ...mockEmptyStatus,
        queue: [task],
      });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        const domainBadge = screen.getByText('📝 设计');
        expect(domainBadge).toBeInTheDocument();
      });
    });
  });

  describe('任务操作', () => {
    it('点击暂停按钮应暂停队列', async () => {
      mockPauseQueue.mockResolvedValue({ ok: true, message: 'Queue paused' });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText('🚦 任务队列')).toBeInTheDocument();
      });

      const pauseButton = screen.getByText('⏸ 暂停');
      fireEvent.click(pauseButton);

      await vi.runAllTimersAsync();

      expect(mockPauseQueue).toHaveBeenCalled();
    });

    it('暂停状态时点击恢复按钮应恢复队列', async () => {
      mockGetQueueStatus.mockResolvedValue({
        ...mockEmptyStatus,
        paused: true,
      });
      mockResumeQueue.mockResolvedValue({ ok: true, message: 'Queue resumed' });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText('▶ 恢复')).toBeInTheDocument();
      });

      const resumeButton = screen.getByText('▶ 恢复');
      fireEvent.click(resumeButton);

      await vi.runAllTimersAsync();

      expect(mockResumeQueue).toHaveBeenCalled();
    });

    it('空队列时清空按钮应禁用', async () => {
      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        const clearButton = screen.getByText('🗑 清空');
        expect(clearButton).toBeDisabled();
      });
    });

    it('有任务时清空按钮应启用', async () => {
      mockGetQueueStatus.mockResolvedValue({
        ...mockEmptyStatus,
        queue: [createMockTask()],
      });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        const clearButton = screen.getByText('🗑 清空');
        expect(clearButton).not.toBeDisabled();
      });
    });
  });

  describe('任务卡片交互', () => {
    it('点击任务应触发 onTaskClick 回调', async () => {
      const onTaskClick = vi.fn();
      const task = createMockTask({
        id: 'TASK-CLICK-TEST',
        status: 'queued',
      });

      mockGetQueueStatus.mockResolvedValue({
        ...mockEmptyStatus,
        queue: [task],
      });

      render(<QueuePanel onTaskClick={onTaskClick} />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        const taskCard = screen.getByText(/TASK-CLICK-TEST/);
        fireEvent.click(taskCard.closest('.queue-task-card')!);
      });

      expect(onTaskClick).toHaveBeenCalledWith('TASK-CLICK-TEST');
    });

    it('等待中的任务应显示优先级控制按钮', async () => {
      const task = createMockTask({
        id: 'TASK-PRIORITY-TEST',
        status: 'queued',
        priority: 0,
      });

      mockGetQueueStatus.mockResolvedValue({
        ...mockEmptyStatus,
        queue: [task],
      });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByTitle('提高优先级')).toBeInTheDocument();
        expect(screen.getByTitle('降低优先级')).toBeInTheDocument();
        expect(screen.getByTitle('取消任务')).toBeInTheDocument();
      });
    });

    it('失败的任务应显示重试按钮', async () => {
      const task = createMockTask({
        id: 'TASK-FAILED-TEST',
        status: 'failed',
        error: 'Test error',
      });

      mockGetQueueHistory.mockResolvedValue({
        ...mockEmptyHistory,
        history: [task],
        total: 1,
      });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByTitle('重试任务')).toBeInTheDocument();
      });
    });

    it('运行中的任务应显示停止按钮', async () => {
      const task = createMockTask({
        id: 'TASK-RUNNING-STOP',
        status: 'running',
        domain: 'code',
      });

      mockGetQueueStatus.mockResolvedValue({
        ...mockEmptyStatus,
        running_tasks: [task],
        running_count: 1,
      });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText('⏹ 停止')).toBeInTheDocument();
      });
    });
  });

  describe('错误处理', () => {
    it('API 错误应显示错误信息', async () => {
      mockGetQueueStatus.mockRejectedValue(new Error('Network error'));

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('任务错误信息应在卡片中显示', async () => {
      const task = createMockTask({
        id: 'TASK-ERROR-DISPLAY',
        status: 'failed',
        error: 'Execution failed: timeout',
      });

      mockGetQueueHistory.mockResolvedValue({
        ...mockEmptyHistory,
        history: [task],
        total: 1,
      });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText('Execution failed: timeout')).toBeInTheDocument();
      });
    });
  });

  describe('状态统计显示', () => {
    it('应显示完整的状态统计', async () => {
      mockGetQueueStatus.mockResolvedValue({
        ...mockEmptyStatus,
        running_tasks: [createMockTask({ status: 'running', domain: 'code' })],
        running_count: 1,
        queue: [createMockTask(), createMockTask()],
        history_count: 15,
      });

      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText(/运行: 1/)).toBeInTheDocument();
        expect(screen.getByText(/队列: 2/)).toBeInTheDocument();
        expect(screen.getByText(/历史: 15/)).toBeInTheDocument();
      });
    });

    it('应显示最后更新时间', async () => {
      render(<QueuePanel />);

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText(/更新于/)).toBeInTheDocument();
      });
    });
  });
});
