/**
 * StatusBadge 组件测试
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { NodeStatus } from '../../types/dto';

describe('StatusBadge', () => {
  it('should render PENDING status', () => {
    render(<StatusBadge status={NodeStatus.PENDING} />);
    expect(screen.getByText('PENDING')).toBeDefined();
  });

  it('should render RUNNING status', () => {
    render(<StatusBadge status={NodeStatus.RUNNING} />);
    expect(screen.getByText('RUNNING')).toBeDefined();
  });

  it('should render SUCCESS status', () => {
    render(<StatusBadge status={NodeStatus.SUCCESS} />);
    expect(screen.getByText('SUCCESS')).toBeDefined();
  });

  it('should render FAILED status', () => {
    render(<StatusBadge status={NodeStatus.FAILED} />);
    expect(screen.getByText('FAILED')).toBeDefined();
  });

  it('should render SKIPPED status', () => {
    render(<StatusBadge status={NodeStatus.SKIPPED} />);
    expect(screen.getByText('SKIPPED')).toBeDefined();
  });

  it('should render CANCELLED status', () => {
    render(<StatusBadge status={NodeStatus.CANCELLED} />);
    expect(screen.getByText('CANCELLED')).toBeDefined();
  });

  it('should render TIMEOUT status', () => {
    render(<StatusBadge status={NodeStatus.TIMEOUT} />);
    expect(screen.getByText('TIMEOUT')).toBeDefined();
  });

  it('should have correct CSS class based on status', () => {
    const { container, rerender } = render(<StatusBadge status={NodeStatus.SUCCESS} />);
    expect(container.querySelector('.status-success')).toBeDefined();

    rerender(<StatusBadge status={NodeStatus.FAILED} />);
    expect(container.querySelector('.status-failed')).toBeDefined();

    rerender(<StatusBadge status={NodeStatus.RUNNING} />);
    expect(container.querySelector('.status-running')).toBeDefined();
  });

  it('should render OK when ok is true', () => {
    render(<StatusBadge ok={true} />);
    expect(screen.getByText('OK')).toBeDefined();
  });

  it('should render ERROR when ok is false', () => {
    render(<StatusBadge ok={false} />);
    expect(screen.getByText('ERROR')).toBeDefined();
  });
});
