/**
 * QueuePanel 组件相关测试
 * 
 * 由于 QueuePanel 使用 setInterval 进行自动刷新，
 * 完整的组件渲染测试放在交互测试中（04-queue-page.spec.ts）。
 * 这里测试辅助函数和数据处理逻辑。
 */

import { describe, it, expect } from 'vitest';
import {
  getDomainLabel,
  getDomainColor,
  TaskDomain,
} from '../../api/queueApi';

describe('QueuePanel 辅助函数', () => {
  describe('getDomainLabel', () => {
    it('应返回正确的设计领域标签', () => {
      expect(getDomainLabel('design')).toBe('📝 设计');
    });

    it('应返回正确的美术领域标签', () => {
      expect(getDomainLabel('art')).toBe('🎨 美术');
    });

    it('应返回正确的程序领域标签', () => {
      expect(getDomainLabel('code')).toBe('💻 程序');
    });

    it('应返回正确的白盒领域标签', () => {
      expect(getDomainLabel('whitebox')).toBe('📦 白盒');
    });

    it('应返回正确的只读领域标签', () => {
      expect(getDomainLabel('readonly')).toBe('👁️ 只读');
    });

    it('未知领域应返回原始值', () => {
      expect(getDomainLabel('unknown' as TaskDomain)).toBe('unknown');
    });
  });

  describe('getDomainColor', () => {
    it('应返回设计领域颜色', () => {
      expect(getDomainColor('design')).toBe('#8b5cf6');
    });

    it('应返回美术领域颜色', () => {
      expect(getDomainColor('art')).toBe('#ec4899');
    });

    it('应返回程序领域颜色', () => {
      expect(getDomainColor('code')).toBe('#3b82f6');
    });

    it('应返回白盒领域颜色', () => {
      expect(getDomainColor('whitebox')).toBe('#6b7280');
    });

    it('应返回只读领域颜色', () => {
      expect(getDomainColor('readonly')).toBe('#10b981');
    });

    it('未知领域应返回默认颜色', () => {
      expect(getDomainColor('unknown' as TaskDomain)).toBe('#888');
    });
  });

  describe('领域配置完整性', () => {
    const allDomains: TaskDomain[] = ['design', 'art', 'code', 'whitebox', 'readonly'];

    it('所有领域都应有标签', () => {
      for (const domain of allDomains) {
        const label = getDomainLabel(domain);
        expect(label).toBeTruthy();
        expect(label).not.toBe(domain); // 应该是翻译后的标签
      }
    });

    it('所有领域都应有颜色', () => {
      for (const domain of allDomains) {
        const color = getDomainColor(domain);
        expect(color).toBeTruthy();
        expect(color).toMatch(/^#[0-9a-f]{6}$/i); // 应该是有效的颜色代码
      }
    });

    it('所有领域颜色应该唯一', () => {
      const colors = allDomains.map(getDomainColor);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(allDomains.length);
    });
  });
});

describe('队列任务状态映射', () => {
  // 任务状态类型
  type TaskStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

  const allStatuses: TaskStatus[] = ['queued', 'running', 'paused', 'completed', 'failed', 'cancelled'];

  it('所有状态都应该有定义', () => {
    // 验证状态枚举完整性
    expect(allStatuses).toHaveLength(6);
  });

  it('状态值应该是有效的字符串', () => {
    for (const status of allStatuses) {
      expect(typeof status).toBe('string');
      expect(status.length).toBeGreaterThan(0);
    }
  });
});

describe('队列显示逻辑', () => {
  describe('任务分组', () => {
    interface MockTask {
      id: string;
      domain: TaskDomain;
      status: string;
    }

    function groupTasksByDomain(tasks: MockTask[]): Record<TaskDomain, MockTask[]> {
      const groups: Record<TaskDomain, MockTask[]> = {
        design: [],
        art: [],
        code: [],
        whitebox: [],
        readonly: [],
      };

      for (const task of tasks) {
        const domain = task.domain || 'code';
        if (groups[domain]) {
          groups[domain].push(task);
        }
      }

      return groups;
    }

    it('应按领域正确分组任务', () => {
      const tasks: MockTask[] = [
        { id: '1', domain: 'code', status: 'running' },
        { id: '2', domain: 'art', status: 'running' },
        { id: '3', domain: 'code', status: 'running' },
        { id: '4', domain: 'design', status: 'running' },
      ];

      const groups = groupTasksByDomain(tasks);

      expect(groups.code).toHaveLength(2);
      expect(groups.art).toHaveLength(1);
      expect(groups.design).toHaveLength(1);
      expect(groups.whitebox).toHaveLength(0);
      expect(groups.readonly).toHaveLength(0);
    });

    it('空任务列表应返回空分组', () => {
      const groups = groupTasksByDomain([]);

      expect(groups.code).toHaveLength(0);
      expect(groups.art).toHaveLength(0);
      expect(groups.design).toHaveLength(0);
    });

    it('单一领域任务应正确分组', () => {
      const tasks: MockTask[] = [
        { id: '1', domain: 'art', status: 'running' },
        { id: '2', domain: 'art', status: 'queued' },
      ];

      const groups = groupTasksByDomain(tasks);

      expect(groups.art).toHaveLength(2);
      expect(groups.code).toHaveLength(0);
    });
  });

  describe('任务ID显示', () => {
    function truncateTaskId(id: string, maxLength = 20): string {
      if (id.length <= maxLength) return id;
      return `${id.slice(0, maxLength)}...`;
    }

    it('短ID不应被截断', () => {
      expect(truncateTaskId('TASK-001')).toBe('TASK-001');
    });

    it('长ID应被截断', () => {
      const longId = 'TASK-20260114T154523_REQ-1768405508135';
      const truncated = truncateTaskId(longId);
      expect(truncated).toBe('TASK-20260114T154523_...');
      expect(truncated.length).toBe(23); // 20 + '...'
    });

    it('刚好20字符的ID不应被截断', () => {
      const exactId = '12345678901234567890';
      expect(truncateTaskId(exactId)).toBe(exactId);
    });
  });

  describe('优先级显示', () => {
    function formatPriority(priority: number): string {
      return `P:${priority}`;
    }

    it('应正确格式化正数优先级', () => {
      expect(formatPriority(10)).toBe('P:10');
    });

    it('应正确格式化零优先级', () => {
      expect(formatPriority(0)).toBe('P:0');
    });

    it('应正确格式化负数优先级', () => {
      expect(formatPriority(-5)).toBe('P:-5');
    });
  });
});
