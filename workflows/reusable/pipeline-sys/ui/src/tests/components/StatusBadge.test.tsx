/**
 * StatusBadge 组件测试
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../components/Common/StatusBadge';

describe('StatusBadge', () => {
  it('should render PENDING status', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('should render RUNNING status', () => {
    render(<StatusBadge status="RUNNING" />);
    expect(screen.getByText('RUNNING')).toBeInTheDocument();
  });

  it('should render SUCCESS status', () => {
    render(<StatusBadge status="SUCCESS" />);
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
  });

  it('should render FAILED status', () => {
    render(<StatusBadge status="FAILED" />);
    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });

  it('should render SKIPPED status', () => {
    render(<StatusBadge status="SKIPPED" />);
    expect(screen.getByText('SKIPPED')).toBeInTheDocument();
  });

  it('should render CANCELLED status', () => {
    render(<StatusBadge status="CANCELLED" />);
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });

  it('should render TIMEOUT status', () => {
    render(<StatusBadge status="TIMEOUT" />);
    expect(screen.getByText('TIMEOUT')).toBeInTheDocument();
  });

  it('should have correct CSS class based on status', () => {
    const { container, rerender } = render(<StatusBadge status="SUCCESS" />);
    expect(container.firstChild).toHaveClass('status-success');

    rerender(<StatusBadge status="FAILED" />);
    expect(container.firstChild).toHaveClass('status-failed');

    rerender(<StatusBadge status="RUNNING" />);
    expect(container.firstChild).toHaveClass('status-running');
  });

  it('should apply small size class when size is small', () => {
    const { container } = render(<StatusBadge status="PENDING" size="small" />);
    expect(container.firstChild).toHaveClass('status-badge-small');
  });
});

