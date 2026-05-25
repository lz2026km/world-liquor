const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('[C]', msg.type(), msg.text().substring(0,80)));
  page.on('pageerror', err => console.log('[PE]', err.message.substring(0,100)));
  
  console.log('Starting goto...');
  const r = await page.goto('file:///home/admin/hermes/projects/world-liquor/index.html', { timeout: 0 })
    .catch(e => ({ error: e.message }));
  console.log('goto result:', r?.error || 'success');
  console.log('After goto');
  await page.waitForTimeout(3000);
  console.log('After wait');
  
  const t = await page.title().catch(e => 'err: '+e.message);
  console.log('Title:', t);
  
  await browser.close();
}
main().catch(e => console.error('Fatal:', e.message));
