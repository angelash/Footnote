import { chromium } from 'playwright';

async function diagnose() {
  console.log('🚀 Starting Footnote Game Diagnosis...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 1. Console Monitoring
  const logs: string[] = [];
  page.on('console', msg => logs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`));
  
  // 2. Network Monitoring
  const failedRequests: string[] = [];
  page.on('requestfailed', req => failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`));

  console.log('🌐 Navigating to http://localhost:5173...');
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e: any) {
    console.error('❌ Failed to load page fully:', e.message);
  }

  // 3. Screenshot
  await page.screenshot({ path: 'debug-game.png', fullPage: true });
  console.log('📸 Screenshot saved: debug-game.png');

  // 4. Phaser Internals Check
  // We need to wait a bit for Phaser to boot
  await page.waitForTimeout(2000);

  const phaserInfo = await page.evaluate(() => {
    // Check if Phaser is loaded
    // @ts-ignore
    if (!window.Phaser) return { status: 'Phaser lib not found on window' };

    // Try to find the game instance
    // Usually attached to window.game in dev mode, or we can search DOM
    // @ts-ignore
    const game = window.game;
    
    if (!game) return { status: 'Game instance not found on window.game' };

    return {
      status: 'Running',
      version: game.config.gameTitle + ' ' + game.config.gameVersion,
      loop: {
        actualFps: Math.round(game.loop.actualFps),
        delta: Math.round(game.loop.delta),
        frame: game.loop.frame
      },
      scenes: game.scene.scenes.map((s: any) => ({
        key: s.sys.settings.key,
        status: s.sys.settings.status, // 5 = RUNNING
        active: s.sys.settings.active,
        visible: s.sys.settings.visible,
        displayListSize: s.children?.list?.length || 0
      }))
    };
  });

  console.log('🎮 Phaser Engine Status:');
  console.log(JSON.stringify(phaserInfo, null, 2));

  // 5. DOM Check
  const canvasExists = await page.isVisible('canvas');
  console.log(`🎨 Canvas Element Visible: ${canvasExists}`);

  console.log('\n--- Console Logs ---');
  console.log(logs.slice(-20).join('\n') || '(No logs)'); // Show last 20

  console.log('\n--- Failed Requests ---');
  console.log(failedRequests.join('\n') || '(No failures)');

  await browser.close();
}

diagnose().catch(console.error);
