const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const reqs = [];
  page.on('request', req => reqs.push(req.url().split('/').pop() + ' ' + req.resourceType()));
  page.on('response', resp => {
    if (resp.status() >= 400) console.log('ERR RESP:', resp.status(), resp.url().split('/').pop());
  });
  page.on('console', msg => console.log('[C]', msg.type(), msg.text().substring(0,80)));
  page.on('pageerror', err => console.log('[PE]', err.message.substring(0,100)));
  
  // Intercept baijiu_data.json request
  await page.route('**/baijiu_data.json', async route => {
    const fs = require('fs');
    const body = fs.readFileSync(path.join(__dirname, 'baijiu_data.json'));
    await route.fulfill({ contentType: 'application/json', body });
    console.log('Intercepted baijiu_data.json');
  });
  
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  
  console.log('Starting goto...');
  await page.goto('file:///home/admin/hermes/projects/world-liquor/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('DOM loaded, waiting...');
  await page.waitForTimeout(3000);
  
  const dataLen = await page.evaluate(() => typeof DATA !== 'undefined' ? DATA.length : 'UNDEF').catch(() => 'err');
  const cards = await page.locator('.liquor-card').count();
  console.log('DATA:', dataLen, 'Cards:', cards);
  console.log('Requests made:', reqs.join(', '));
  
  await browser.close();
}
main().catch(e => console.error('Fatal:', e.message));
