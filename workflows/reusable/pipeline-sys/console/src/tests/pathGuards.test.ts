/**
 * Path Guards 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  safeResolveUnderProject,
  safeResolveUnderRun,
  isHiddenDir,
  normalizePath,
} from '../services/pathGuards.js';

describe('safeResolveUnderProject', () => {
  const projectRoot = '/home/user/project';

  it('should resolve valid relative path', () => {
    const result = safeResolveUnderProject(projectRoot, 'src/index.ts');
    expect(result).toBe('/home/user/project/src/index.ts');
  });

  it('should resolve nested path', () => {
    const result = safeResolveUnderProject(projectRoot, 'workflows/project/logs/automation_runs');
    expect(result).toBe('/home/user/project/workflows/project/logs/automation_runs');
  });

  it('should throw for path traversal attempt', () => {
    expect(() => safeResolveUnderProject(projectRoot, '../other')).toThrow('Path escapes');
    expect(() => safeResolveUnderProject(projectRoot, '../../etc/passwd')).toThrow('Path escapes');
  });

  it('should throw for absolute path outside project', () => {
    expect(() => safeResolveUnderProject(projectRoot, '/etc/passwd')).toThrow('Path escapes');
  });

  it('should allow project root itself', () => {
    const result = safeResolveUnderProject(projectRoot, '.');
    expect(result).toBe(projectRoot);
  });
});

describe('safeResolveUnderRun', () => {
  const runDir = '/home/user/project/workflows/project/logs/automation_runs/RUN-123';

  it('should resolve valid relative path', () => {
    const result = safeResolveUnderRun(runDir, 'status.json');
    expect(result).toBe(`${runDir}/status.json`);
  });

  it('should resolve nested path', () => {
    const result = safeResolveUnderRun(runDir, 'nodes/execute.plan.json');
    expect(result).toBe(`${runDir}/nodes/execute.plan.json`);
  });

  it('should throw for path traversal', () => {
    expect(() => safeResolveUnderRun(runDir, '../other-run/status.json')).toThrow('Path escapes');
  });
});

describe('isHiddenDir', () => {
  it('should return true for underscore prefix', () => {
    expect(isHiddenDir('_lock')).toBe(true);
    expect(isHiddenDir('_temp')).toBe(true);
  });

  it('should return true for dot prefix', () => {
    expect(isHiddenDir('.git')).toBe(true);
    expect(isHiddenDir('.hidden')).toBe(true);
  });

  it('should return false for normal directories', () => {
    expect(isHiddenDir('RUN-123')).toBe(false);
    expect(isHiddenDir('logs')).toBe(false);
    expect(isHiddenDir('nodes')).toBe(false);
  });
});

describe('normalizePath', () => {
  it('should normalize paths with ..', () => {
    expect(normalizePath('a/b/../c')).toBe('a/c');
  });

  it('should normalize paths with .', () => {
    expect(normalizePath('a/./b/./c')).toBe('a/b/c');
  });

  it('should normalize multiple slashes', () => {
    expect(normalizePath('a//b///c')).toBe('a/b/c');
  });
});

