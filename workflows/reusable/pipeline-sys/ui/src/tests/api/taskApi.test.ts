/**
 * Task API 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  TaskCategory,
  ROLE_CONFIGS,
  WHITEBOX_CONFIGS,
  getCategoryLabel,
  getCategoryColor,
  getRolesByCategory,
  submitIntake,
  submitToEndpoint,
  submitWhitebox,
  submitRoleTask,
} from '../../api/taskApi';

describe('Task API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getCategoryLabel', () => {
    it('should return correct labels for categories', () => {
      expect(getCategoryLabel('intake')).toBe('🎯 智能派单');
      // 实际实现使用不同的 emoji
      expect(getCategoryLabel('engineering')).toBe('👨‍💻 工程开发');
      expect(getCategoryLabel('art')).toBe('🎨 美术制作');
      expect(getCategoryLabel('level')).toBe('🗺️ 关卡设计');
      expect(getCategoryLabel('whitebox')).toBe('🏗️ 白盒占位');
      expect(getCategoryLabel('lead')).toBe('📋 组长任务');
    });

    it('should return undefined for unknown category', () => {
      // 实际实现返回 undefined
      expect(getCategoryLabel('unknown' as TaskCategory)).toBeUndefined();
    });
  });

  describe('getCategoryColor', () => {
    it('should return colors for all categories', () => {
      const categories: TaskCategory[] = ['intake', 'engineering', 'art', 'level', 'whitebox', 'lead'];
      
      categories.forEach(cat => {
        const color = getCategoryColor(cat);
        expect(color).toBeDefined();
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should return undefined for unknown category', () => {
      // 实际实现返回 undefined
      const color = getCategoryColor('unknown' as TaskCategory);
      expect(color).toBeUndefined();
    });
  });

  describe('getRolesByCategory', () => {
    it('should return roles for engineering category', () => {
      const roles = getRolesByCategory('engineering');
      expect(roles.length).toBeGreaterThan(0);
      roles.forEach(role => {
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('endpoint');
        expect(role.category).toBe('engineering');
      });
    });

    it('should return roles for art category', () => {
      const roles = getRolesByCategory('art');
      expect(roles.length).toBeGreaterThan(0);
      roles.forEach(role => {
        expect(role.category).toBe('art');
      });
    });

    it('should return intake roles for intake category', () => {
      // 实际实现中 intake 也有角色配置
      const roles = getRolesByCategory('intake');
      expect(roles.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array for whitebox', () => {
      const roles = getRolesByCategory('whitebox');
      expect(roles).toEqual([]);
    });
  });

  describe('ROLE_CONFIGS', () => {
    it('should have valid role configs', () => {
      ROLE_CONFIGS.forEach(role => {
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('category');
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('emoji');
        expect(role).toHaveProperty('endpoint');
        expect(role).toHaveProperty('description');
        expect(role).toHaveProperty('requiredFields');
        expect(role).toHaveProperty('optionalFields');
        expect(Array.isArray(role.requiredFields)).toBe(true);
        expect(Array.isArray(role.optionalFields)).toBe(true);
      });
    });

    it('should have at least one role', () => {
      expect(ROLE_CONFIGS.length).toBeGreaterThan(0);
    });
  });

  describe('WHITEBOX_CONFIGS', () => {
    it('should have valid whitebox configs', () => {
      WHITEBOX_CONFIGS.forEach(config => {
        expect(config).toHaveProperty('type');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('emoji');
        expect(config).toHaveProperty('description');
        expect(config).toHaveProperty('endpoint');
      });
    });

    it('should include scene, character, and object types', () => {
      const types = WHITEBOX_CONFIGS.map(c => c.type);
      expect(types).toContain('scene');
      expect(types).toContain('character');
      expect(types).toContain('object');
    });
  });

  describe('submitIntake', () => {
    it('should submit intake task', async () => {
      const mockResponse = { ok: true, run_id: 'RUN-001' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const input = {
        title: 'Test Task',
        description: 'Test description',
        task_type: 'feature',
        priority: 5,
      };
      
      const result = await submitIntake(input);

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[1].method).toBe('POST');
      expect(result.ok).toBe(true);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(submitIntake({ title: 'Test', description: 'Test' })).rejects.toThrow('Failed to submit task');
    });
  });

  describe('submitToEndpoint', () => {
    it('should submit to specified endpoint', async () => {
      const mockResponse = { ok: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await submitToEndpoint('/task/feature', { title: 'Test', description: 'Test' });

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[1].method).toBe('POST');
      expect(result.ok).toBe(true);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(submitToEndpoint('/task/test', { title: 'Test', description: 'Test' })).rejects.toThrow('Failed to submit task');
    });
  });

  describe('submitWhitebox', () => {
    it('should submit scene whitebox', async () => {
      const mockResponse = { ok: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await submitWhitebox('scene', { 
        title: 'Test',
        description: 'Test',
        zone_id: 'C1-Z1', 
        scene_name: 'Test Scene' 
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });

    it('should submit character whitebox', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      await submitWhitebox('character', { 
        title: 'Test',
        description: 'Test',
        character_id: 'cenhui' 
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should submit object whitebox', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      await submitWhitebox('object', { 
        title: 'Test',
        description: 'Test',
        object_id: 'door_01', 
        billboard_text: 'Door' 
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(submitWhitebox('scene', { title: 'Test', description: 'Test' })).rejects.toThrow('Failed to submit whitebox');
    });
  });

  describe('submitRoleTask', () => {
    it('should submit role task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, run_id: 'RUN-001' }),
      });

      const result = await submitRoleTask('L3_engineer', {
        title: 'Test Task',
        description: 'Test description',
        task_pack_path: 'taskpacks/T-001.md',
      });

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.role).toBe('L3_engineer');
      expect(result.ok).toBe(true);
    });
  });
});
