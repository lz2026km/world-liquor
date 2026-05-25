const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('[Err] ' + msg.text());
    console.log('[' + msg.type() + ']', msg.text().substring(0, 100));
  });
  page.on('pageerror', err => {
    errors.push('[PageErr] ' + err.message);
    console.log('PAGEERR:', err.message.substring(0, 200));
  });

  const filePath = 'file://' + path.join(__dirname, 'index.html');
  console.log('Loading:', filePath);
  
  await page.goto(filePath, { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('DOM loaded');
  
  await page.waitForTimeout(5000);
  
  const dataLen = await page.evaluate(() => typeof DATA !== 'undefined' ? DATA.length : 'UNDEF').catch(() => 'EVAL_FAIL');
  const cards = await page.locator('.liquor-card').count();
  console.log('DATA.length:', dataLen, 'Cards:', cards);

  await browser.close();
  console.log('\nErrors:', errors.slice(0, 5));
}

main().catch(e => console.error('Fatal:', e.message));
