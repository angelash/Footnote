import { chromium } from 'playwright';

async function diagnose() {
  console.log('🚀 Starting Diagnosis...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[Console] ${msg.text()}`));
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'debug.png' });
    console.log('📸 Screenshot saved.');
  } catch (e) {
    console.error('❌ Failed:', e);
  }
  
  await browser.close();
}
diagnose();
