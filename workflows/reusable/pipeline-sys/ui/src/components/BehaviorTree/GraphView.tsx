/**
 * Graph View Component
 * 行为树图谱视图（使用 ReactFlow）
 */

import { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRunStore } from '../../state/runStore';
import { NodeCard } from './NodeCard';
import type { IGraph, INodeRunsSnapshot, NodeStatus } from '../../types/dto';
import './GraphView.css';

interface IGraphViewProps {
  graph: IGraph;
  nodeRuns: INodeRunsSnapshot | null;
}

// 自定义节点类型
const nodeTypes: NodeTypes = {
  nodeCard: NodeCard,
};

// 将 graph 转换为 ReactFlow 格式
function convertToReactFlow(
  graph: IGraph,
  nodeRuns: INodeRunsSnapshot | null
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 计算节点位置
  const nodePositions = calculatePositions(graph);

  for (const node of graph.nodes) {
    const nodeRun = nodeRuns?.nodes[node.id];
    // 优先使用 nodeRuns 状态，其次使用 graph.nodes 状态（来自 graph.json）
    const status = nodeRun?.status || node.status || ('PENDING' as NodeStatus);

    nodes.push({
      id: node.id,
      type: 'nodeCard',
      position: nodePositions[node.id] || { x: 0, y: 0 },
      data: {
        id: node.id,
        title: node.name || node.title || node.id,
        nodeType: node.type,
        status,
        attempt: nodeRun?.attempt || 0,
        elapsed_ms: nodeRun?.elapsed_ms,
        outputs: node.outputs || [],
      },
    });
  }

  for (const edge of graph.edges) {
    edges.push({
      id: `${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      animated: false,
      style: {
        stroke: 'var(--color-border)',
        strokeWidth: 2,
      },
    });
  }

  return { nodes, edges };
}

// 计算节点位置（简单的自上向下布局）
function calculatePositions(graph: IGraph): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const nodeWidth = 200;
  const nodeHeight = 80;
  const horizontalGap = 50;
  const verticalGap = 100;

  // 按层级分组
  const levels: string[][] = [];
  const nodeLevel: Record<string, number> = {};
  const visited = new Set<string>();

  // 找到起始节点
  const inDegree: Record<string, number> = {};
  for (const node of graph.nodes) {
    inDegree[node.id] = 0;
  }
  for (const edge of graph.edges) {
    inDegree[edge.to] = (inDegree[edge.to] || 0) + 1;
  }

  const startNodes = graph.nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);

  // BFS 计算层级
  let currentLevel = startNodes;
  let levelIndex = 0;

  while (currentLevel.length > 0) {
    levels[levelIndex] = [];
    const nextLevel: string[] = [];

    for (const nodeId of currentLevel) {
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      levels[levelIndex].push(nodeId);
      nodeLevel[nodeId] = levelIndex;

      // 找到下一层节点
      for (const edge of graph.edges) {
        if (edge.from === nodeId && !visited.has(edge.to)) {
          nextLevel.push(edge.to);
        }
      }
    }

    currentLevel = [...new Set(nextLevel)];
    levelIndex++;
  }

  // 计算位置
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const levelWidth = level.length * nodeWidth + (level.length - 1) * horizontalGap;
    const startX = -levelWidth / 2;

    for (let j = 0; j < level.length; j++) {
      const nodeId = level[j];
      positions[nodeId] = {
        x: startX + j * (nodeWidth + horizontalGap),
        y: i * (nodeHeight + verticalGap),
      };
    }
  }

  return positions;
}

export function GraphView({ graph, nodeRuns }: IGraphViewProps) {
  const { selectedNodeId, setSelectedNodeId } = useRunStore();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => convertToReactFlow(graph, nodeRuns),
    [graph, nodeRuns]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 当 nodeRuns 更新时同步节点状态
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  return (
    <div className="graph-view">
      <ReactFlow
        nodes={nodes.map((n) => ({
          ...n,
          selected: n.id === selectedNodeId,
        }))}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background color="var(--color-border)" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const status = node.data?.status;
            switch (status) {
              case 'RUNNING':
                return 'var(--color-running)';
              case 'SUCCESS':
                return 'var(--color-success)';
              case 'FAILED':
                return 'var(--color-failed)';
              case 'CANCELLED':
                return 'var(--color-cancelled)';
              case 'TIMEOUT':
                return 'var(--color-timeout)';
              case 'SKIPPED':
                return 'var(--color-skipped)';
              default:
                return 'var(--color-pending)';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
        />
      </ReactFlow>
    </div>
  );
}

