/**
 * Status Badge Component
 * 状态徽章
 */

import { NodeStatus } from '../../types/dto';
import './StatusBadge.css';

interface IStatusBadgeProps {
  ok?: boolean;
  status?: NodeStatus;
}

export function StatusBadge({ ok, status }: IStatusBadgeProps) {
  // 如果传入 status，使用 status；否则根据 ok 判断
  let displayStatus: NodeStatus | 'OK' | 'ERROR';
  let label: string;

  if (status !== undefined) {
    displayStatus = status;
    label = status;
  } else if (ok !== undefined) {
    displayStatus = ok ? 'OK' : 'ERROR';
    label = ok ? 'OK' : 'ERROR';
  } else {
    displayStatus = NodeStatus.PENDING;
    label = 'PENDING';
  }

  const getStatusClass = () => {
    switch (displayStatus) {
      case NodeStatus.PENDING:
        return 'status-pending';
      case NodeStatus.RUNNING:
        return 'status-running';
      case NodeStatus.SUCCESS:
      case 'OK':
        return 'status-success';
      case NodeStatus.FAILED:
      case 'ERROR':
        return 'status-failed';
      case NodeStatus.SKIPPED:
        return 'status-skipped';
      case NodeStatus.CANCELLED:
        return 'status-cancelled';
      case NodeStatus.TIMEOUT:
        return 'status-timeout';
      default:
        return 'status-pending';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {label}
    </span>
  );
}

