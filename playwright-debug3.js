const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

const MIME = { '.html': 'text/html', '.json': 'application/json', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  console.log('REQ:', req.method, req.url);
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

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Intercept ALL requests
  page.on('request', req => {
    console.log('→REQ:', req.url());
  });
  page.on('response', resp => {
    console.log('←RESP:', resp.status(), resp.url().split('/').pop());
  });
  page.on('requestfailed', req => {
    console.log('×FAIL:', req.url().split('/').pop(), req.failure()?.errorText);
  });
  page.on('console', msg => {
    if (msg.type() !== 'warning') console.log('CON['+msg.type()+']:', msg.text().substring(0,150));
  });
  page.on('pageerror', err => console.log('PAGERR:', err.message.substring(0,200)));

  await page.goto(BASE + '/', { waitUntil: 'commit', timeout: 10000 });
  console.log('Page committed');
  
  // Wait longer for data load
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(1000);
    const dataLen = await page.evaluate(() => typeof DATA !== 'undefined' ? DATA.length : 'undef').catch(() => 'err');
    const cards = await page.locator('.liquor-card').count();
    console.log(`[${i+1}s] DATA: ${dataLen}, Cards: ${cards}`);
    if (cards > 0) break;
  }

  await browser.close();
  server.close();
}

main().catch(e => console.error('Fatal:', e.message));
