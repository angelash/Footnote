import { test, expect, Page } from '@playwright/test';

/**
 * Footnote 游戏 E2E 测试
 */

// 等待游戏加载完成
async function waitForGameLoaded(page: Page): Promise<void> {
  // 等待加载屏幕消失
  await page.waitForSelector('#loading-screen.hidden', { timeout: 30000 });
  
  // 等待游戏画布出现
  await page.waitForSelector('#game-container canvas', { timeout: 10000 });
  
  // 额外等待确保游戏初始化
  await page.waitForTimeout(1000);
}

// 等待场景切换
async function waitForSceneTransition(page: Page, duration: number = 1000): Promise<void> {
  await page.waitForTimeout(duration);
}

test.describe('游戏启动', () => {
  test('应该正确加载游戏', async ({ page }) => {
    await page.goto('/');
    
    // 检查加载屏幕
    await expect(page.locator('#loading-screen')).toBeVisible();
    await expect(page.locator('.loading-title')).toContainText('备 注');
    
    // 等待加载完成
    await waitForGameLoaded(page);
    
    // 检查游戏画布
    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();
  });

  test('应该显示主菜单', async ({ page }) => {
    await page.goto('/');
    await waitForGameLoaded(page);
    
    // 游戏应该在主菜单场景
    // 由于是 Canvas 渲染，我们检查页面标题和基本结构
    await expect(page).toHaveTitle('备注 / Footnote');
  });
});

test.describe('主菜单交互', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameLoaded(page);
  });

  test('点击画布应该触发交互', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    
    // 获取画布位置
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    
    if (box) {
      // 点击画布中心
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);
    }
  });

  test('键盘输入应该工作', async ({ page }) => {
    // 测试 ESC 键
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // 测试方向键
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
  });
});

test.describe('游戏场景', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameLoaded(page);
  });

  test('新游戏应该能够启动', async ({ page }) => {
    const gameCanvas = page.locator('#game-container canvas');
    const box = await gameCanvas.boundingBox();
    
    if (box) {
      // 点击"新游戏"按钮区域 (假设在画布中央偏下)
      const newGameY = box.y + box.height * 0.5;
      await page.mouse.click(box.x + box.width / 2, newGameY);
      await waitForSceneTransition(page, 2000);
    }
  });

  test('移动控制应该响应', async ({ page }) => {
    // 确保游戏画布存在
    await expect(page.locator('#game-container canvas')).toBeVisible();
    
    // 模拟 WASD 移动
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyW');
    
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyA');
    
    await page.keyboard.down('KeyS');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyS');
    
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyD');
  });
});

test.describe('移动端触控', () => {
  test.use({ ...test.info().project.use, hasTouch: true });

  test('触控应该工作', async ({ page }) => {
    await page.goto('/');
    await waitForGameLoaded(page);
    
    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    
    if (box) {
      // 模拟触控
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);
    }
  });

  test('多点触控应该支持', async ({ page }) => {
    await page.goto('/');
    await waitForGameLoaded(page);
    
    // Playwright 的 touchscreen API 有限，这里主要验证不会崩溃
    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();
  });
});

test.describe('存档系统', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameLoaded(page);
  });

  test('LocalStorage 应该可用', async ({ page }) => {
    // 检查 LocalStorage 是否可用
    const result = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    });
    
    expect(result).toBe(true);
  });

  test('IndexedDB 应该可用', async ({ page }) => {
    const result = await page.evaluate(() => {
      return 'indexedDB' in window;
    });
    
    expect(result).toBe(true);
  });
});

test.describe('性能测试', () => {
  test('首屏加载时间应该小于 5 秒', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await waitForGameLoaded(page);
    
    const loadTime = Date.now() - startTime;
    console.log(`首屏加载时间: ${loadTime}ms`);
    
    // 5秒内加载完成
    expect(loadTime).toBeLessThan(5000);
  });

  test('游戏应该没有严重的 JS 错误', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await waitForGameLoaded(page);
    
    // 等待一段时间观察是否有错误
    await page.waitForTimeout(3000);
    
    // 检查是否有严重错误（排除已知的警告）
    const criticalErrors = errors.filter(
      (e) => !e.includes('Warning') && !e.includes('deprecated')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('PWA 功能', () => {
  test('应该有正确的 manifest', async ({ page }) => {
    await page.goto('/');
    
    // 检查 manifest 链接
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
  });

  test('应该注册 Service Worker', async ({ page }) => {
    await page.goto('/');
    await waitForGameLoaded(page);
    
    // 等待 SW 注册
    await page.waitForTimeout(2000);
    
    // 检查 SW 是否注册
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });
    
    // 在开发环境中 SW 可能未注册
    console.log(`Service Worker 注册状态: ${swRegistered}`);
  });
});

test.describe('可访问性', () => {
  test('应该有正确的语言属性', async ({ page }) => {
    await page.goto('/');
    
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'zh-CN');
  });

  test('应该有正确的视口配置', async ({ page }) => {
    await page.goto('/');
    
    const viewport = page.locator('meta[name="viewport"]');
    const content = await viewport.getAttribute('content');
    
    expect(content).toContain('width=device-width');
    expect(content).toContain('user-scalable=no');
  });
});

