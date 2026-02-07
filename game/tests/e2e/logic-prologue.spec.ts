import { test, expect, Page } from '@playwright/test';

test.describe('Game Logic: Prologue Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // 监听 Console，特别是 Logic 层的日志
    page.on('console', msg => {
      if (msg.text().includes('[Narrative]')) {
        console.log(`📖 ${msg.text()}`);
      }
    });
    await page.goto('/');
    // 等待游戏启动
    await page.waitForFunction(() => window.game && window.game.isBooted);
  });

  test('Logic-01: Dialogue Progression', async ({ page }) => {
    // 1. 获取初始状态
    const initialDialogue = await page.evaluate(() => {
      // @ts-ignore
      const narrative = window.game.registry.get('NarrativeSystem'); // 假设系统挂在 registry
      // 或者通过 Scene 获取
      // @ts-ignore
      const gameScene = window.game.scene.getScene('GameScene');
      if (!gameScene) return { error: 'GameScene not found' };
      
      // 假设 NarrativeSystem 是 Scene 的一个属性或 Component
      // 这里我们需要根据实际代码结构调整。先盲猜一下常用的结构。
      // @ts-ignore
      return { sceneKey: gameScene.sys.settings.key };
    });

    console.log('Initial State:', initialDialogue);
    expect(initialDialogue).not.toHaveProperty('error');

    // 2. 模拟点击推进 (Input System)
    // 我们可以直接调用 Input Plugin 或者触发 DOM 点击
    await page.locator('canvas').click();
    await page.waitForTimeout(500); // Wait for transition

    // 3. 再次获取状态 (Expect change)
    // ...
  });
});
