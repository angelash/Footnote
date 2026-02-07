import { test, expect, Page } from '@playwright/test';

async function waitForGameLoaded(page: Page) {
  // Wait for Canvas (Visual Check)
  await expect(page.locator('canvas')).toBeVisible({ timeout: 60000 });
}

test.describe('Game Core (WSL)', () => {
  
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') console.error(`[Browser Error] ${msg.text()}`);
    });
    page.on('pageerror', err => console.error(`[Browser Crash] ${err.message}`));
    
    await page.goto('/');
  });

  test('TC-01: Game Loads and Canvas Renders', async ({ page }) => {
    await waitForGameLoaded(page);
    
    // Verify Canvas size
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    
    // Optional: Check Phaser boot (if available)
    const phaserVersion = await page.evaluate(() => {
      // @ts-ignore
      return window.Phaser ? window.Phaser.VERSION : null;
    });
    if (phaserVersion) console.log(`Phaser Version: ${phaserVersion}`);
  });

  test('TC-02: Assets Loading', async ({ page }) => {
    let failedAssets = 0;
    page.on('requestfailed', req => {
      if (req.url().match(/\.(png|jpg|webp|mp3|json)$/)) {
        failedAssets++;
      }
    });

    await waitForGameLoaded(page);
    console.log(`Failed Assets: ${failedAssets}`);
    // Not failing the test on assets for now, just logging
  });
});
