/**
 * Run Store
 * 全局状态（run 列表/当前 run/节点状态）
 */

import { create } from 'zustand';
import type {
  IRunListItem,
  IStatus,
  IGraph,
  INodeRunsSnapshot,
  IEvent,
  INodeRun,
  NodeStatus,
} from '../types/dto';
import { EventType } from '../types/dto';

interface IRunState {
  // 列表
  runs: IRunListItem[];
  runsLoading: boolean;
  runsError: string | null;

  // 当前 run
  currentRunId: string | null;
  currentStatus: IStatus | null;
  currentGraph: IGraph | null;
  currentNodeRuns: INodeRunsSnapshot | null;
  currentLoading: boolean;
  currentError: string | null;

  // 选中的节点
  selectedNodeId: string | null;

  // 事件时间线
  events: IEvent[];
  eventsConnected: boolean;

  // Actions
  setRuns: (runs: IRunListItem[]) => void;
  setRunsLoading: (loading: boolean) => void;
  setRunsError: (error: string | null) => void;

  setCurrentRun: (
    runId: string,
    status: IStatus,
    graph: IGraph | null,
    nodeRuns: INodeRunsSnapshot | null
  ) => void;
  setCurrentLoading: (loading: boolean) => void;
  setCurrentError: (error: string | null) => void;
  clearCurrentRun: () => void;

  setSelectedNodeId: (nodeId: string | null) => void;

  addEvent: (event: IEvent) => void;
  clearEvents: () => void;
  setEventsConnected: (connected: boolean) => void;

  // 根据事件更新节点状态
  updateNodeFromEvent: (event: IEvent) => void;
}

export const useRunStore = create<IRunState>((set, get) => ({
  // 初始状态
  runs: [],
  runsLoading: false,
  runsError: null,

  currentRunId: null,
  currentStatus: null,
  currentGraph: null,
  currentNodeRuns: null,
  currentLoading: false,
  currentError: null,

  selectedNodeId: null,

  events: [],
  eventsConnected: false,

  // Actions
  setRuns: (runs) => set({ runs }),
  setRunsLoading: (loading) => set({ runsLoading: loading }),
  setRunsError: (error) => set({ runsError: error }),

  setCurrentRun: (runId, status, graph, nodeRuns) =>
    set({
      currentRunId: runId,
      currentStatus: status,
      currentGraph: graph,
      currentNodeRuns: nodeRuns,
      currentError: null,
    }),
  setCurrentLoading: (loading) => set({ currentLoading: loading }),
  setCurrentError: (error) => set({ currentError: error }),
  clearCurrentRun: () =>
    set({
      currentRunId: null,
      currentStatus: null,
      currentGraph: null,
      currentNodeRuns: null,
      currentError: null,
      selectedNodeId: null,
      events: [],
      eventsConnected: false,
    }),

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event].slice(-1000), // 保留最近 1000 条
    })),
  clearEvents: () => set({ events: [] }),
  setEventsConnected: (connected) => set({ eventsConnected: connected }),

  updateNodeFromEvent: (event) => {
    const state = get();
    if (!state.currentNodeRuns) return;

    const nodeId = event.node_id;
    if (!nodeId) return;

    const nodeRuns = { ...state.currentNodeRuns };
    const nodes = { ...nodeRuns.nodes };
    const nodeRun: INodeRun = nodes[nodeId] || {
      status: 'PENDING' as NodeStatus,
      attempt: 0,
      started_at: null,
      ended_at: null,
      elapsed_ms: null,
      last_error: null,
      outputs: [],
    };

    switch (event.type) {
      case EventType.NODE_STARTED:
        nodes[nodeId] = {
          ...nodeRun,
          status: 'RUNNING' as NodeStatus,
          attempt: (event.payload as { attempt?: number }).attempt || nodeRun.attempt + 1,
          started_at: event.ts,
          ended_at: null,
          elapsed_ms: null,
        };
        break;

      case EventType.NODE_FINISHED:
        nodes[nodeId] = {
          ...nodeRun,
          status: (event.payload as { status?: NodeStatus }).status || nodeRun.status,
          ended_at: event.ts,
          elapsed_ms: (event.payload as { elapsed_ms?: number }).elapsed_ms || null,
          last_error: (event.payload as { error?: string }).error || null,
        };
        break;

      case EventType.NODE_TIMEOUT:
        nodes[nodeId] = {
          ...nodeRun,
          status: 'TIMEOUT' as NodeStatus,
          ended_at: event.ts,
        };
        break;

      case EventType.NODE_RETRY_SCHEDULED:
        // 重试调度，不改变状态
        break;

      default:
        return;
    }

    set({
      currentNodeRuns: {
        ...nodeRuns,
        nodes,
        updated_at: event.ts,
      },
    });
  },
}));

