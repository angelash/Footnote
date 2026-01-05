/**
 * Node Card Component
 * 行为树节点卡片
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StatusBadge } from '../Common/StatusBadge';
import type { NodeStatus, NodeType, IOutputRef } from '../../types/dto';
import './NodeCard.css';

interface INodeCardData {
  id: string;
  title: string;
  nodeType: NodeType;
  status: NodeStatus;
  attempt: number;
  elapsed_ms?: number | null;
  outputs: IOutputRef[];
}

function NodeCardComponent({ data }: NodeProps<INodeCardData>) {
  const { title, nodeType, status, attempt, elapsed_ms } = data;

  const formatElapsed = (ms: number | null | undefined) => {
    if (ms == null) return '';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getTypeIcon = () => {
    switch (nodeType) {
      case 'stage':
        return '▣';
      case 'group':
        return '▤';
      case 'task':
        return '▢';
      default:
        return '○';
    }
  };

  return (
    <div className={`node-card node-card-${status.toLowerCase()}`}>
      <Handle type="target" position={Position.Top} />
      
      <div className="node-card-header">
        <span className="node-type-icon">{getTypeIcon()}</span>
        <span className="node-title">{title}</span>
      </div>
      
      <div className="node-card-body">
        <StatusBadge status={status} />
        {attempt > 1 && <span className="node-attempt">×{attempt}</span>}
        {elapsed_ms != null && (
          <span className="node-elapsed">{formatElapsed(elapsed_ms)}</span>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export const NodeCard = memo(NodeCardComponent);

