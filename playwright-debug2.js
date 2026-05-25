const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

const MIME = { '.html': 'text/html', '.json': 'application/json', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  console.log('REQUEST:', req.method, req.url);
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'text/plain';
  fs.readFile(filePath, (err, data) => {
    if (err) { console.log('FILE NOT FOUND:', filePath); res.writeHead(404); res.end('Not Found'); return; }
    console.log('SERVED:', filePath, mime);
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

  page.on('console', msg => console.log('CON[' + msg.type() + ']', msg.text().substring(0, 200)));
  page.on('pageerror', err => console.log('PAGERR:', err.message.substring(0, 200)));
  page.on('requestfailed', req => console.log('REQ FAIL:', req.url().split('/').pop(), req.failure()?.errorText));
  page.on('response', resp => {
    if (resp.status() >= 400) console.log('RESP ERR:', resp.status(), resp.url().split('/').pop());
    else console.log('RESP OK:', resp.status(), resp.url().split('/').pop());
  });

  await page.goto(BASE + '/', { waitUntil: 'commit', timeout: 10000 });
  console.log('Page committed, waiting...');
  await page.waitForTimeout(6000);
  
  const dataLen = await page.evaluate(() => typeof DATA !== 'undefined' ? DATA.length : 'UNDEFINED').catch(() => 'EVAL ERR');
  const cards = await page.locator('.liquor-card').count();
  const total = await page.locator('#totalCount').textContent().catch(() => 'err');
  console.log('DATA.length:', dataLen, 'Cards:', cards, 'total:', total);

  await browser.close();
  server.close();
}

main().catch(e => console.error('Fatal:', e.message));
