const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

const MIME = { '.html': 'text/html', '.json': 'application/json', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'text/plain';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

async function main() {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const BASE = 'http://localhost:' + port;
  console.log('Server on', BASE);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('CONSOLE[' + msg.type() + ']', msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR:', err.message));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', resp => {
    if (resp.status() >= 400) console.log('RESPONSE ERROR:', resp.status(), resp.url());
  });

  console.log('Going to page...');
  try {
    await page.goto(BASE + '/', { waitUntil: 'commit', timeout: 10000 });
    console.log('Page committed');
  } catch(e) {
    console.log('goto failed:', e.message.split('\n')[0]);
  }

  console.log('Waiting 8s...');
  await page.waitForTimeout(8000);
  
  const cardCount = await page.locator('.liquor-card').count();
  const totalCount = await page.locator('#totalCount').textContent().catch(() => 'err');
  const skDisplay = await page.locator('#skeletonGrid').evaluate(el => el.style.display).catch(() => '?');
  console.log('Cards:', cardCount, 'totalCount:', totalCount, 'skeleton:', skDisplay);

  // Try getting DATA from page
  const dataLen = await page.evaluate(() => typeof DATA !== 'undefined' ? DATA.length : 'undefined').catch(() => 'err');
  console.log('DATA.length:', dataLen);

  await browser.close();
  server.close();
}

main().catch(e => console.error('Fatal:', e.message));
