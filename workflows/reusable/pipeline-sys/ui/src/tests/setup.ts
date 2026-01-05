/**
 * Vitest setup file
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展 expect
expect.extend(matchers);

// 每个测试后清理
afterEach(() => {
  cleanup();
});

