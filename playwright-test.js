const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Start a simple static server
const MIME = { '.html': 'text/html', '.json': 'application/json' };
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

async function runTests() {
  // Start server on a random port
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const BASE = `http://localhost:${port}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let passed = 0, failed = 0;
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Console Error] ${msg.text()}`);
    if (msg.type() === 'log') console.log(`  [Log] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    errors.push(`[Page Error] ${err.message}`);
  });

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (e) {
      console.log(`❌ ${name}: ${e.message}`);
      failed++;
    }
  }

  await test('页面加载正常', async () => {
    await page.goto(BASE + '/', { timeout: 60000, waitUntil: 'commit' });
    await page.waitForTimeout(10000);
    const title = await page.title();
    if (!title.includes('World')) throw new Error(`Title: ${title}`);
  });

  await test('卡片数量显示 > 0', async () => {
    const txt = await page.locator('#totalCount').textContent();
    const n = parseInt(txt);
    if (n <= 0) throw new Error(`totalCount = ${txt}`);
    console.log(`   → 共 ${n} 款`);
  });

  await test('骨架屏已消失', async () => {
    const sk = await page.locator('#skeletonGrid').evaluate(el => el.style.display);
    if (sk !== 'none' && sk !== '') throw new Error(`骨架屏 visible, display=${sk}`);
    console.log('   → 骨架屏已隐藏');
  });

  await test('筛选"酱香型"有效', async () => {
    const btn = page.locator('button[data-filter="type"][data-value="酱香型"]');
    await btn.waitFor({ timeout: 10000 });
    await btn.click();
    await page.waitForTimeout(800);
    const txt = await page.locator('#totalCount').textContent();
    const n = parseInt(txt);
    if (n <= 0) throw new Error(`筛选后 count = ${txt}`);
    console.log(`   → 筛选后 ${n} 款`);
  });

  await test('取消筛选恢复全部', async () => {
    await page.locator('button[data-filter="type"][data-value="all"]').click();
    await page.waitForTimeout(500);
    const txt = await page.locator('#totalCount').textContent();
    if (parseInt(txt) <= 0) throw new Error(`count = ${txt}`);
  });

  await test('搜索"茅台"返回结果', async () => {
    await page.locator('#searchInput').fill('茅台');
    await page.locator('#searchInput').press('Enter');
    await page.waitForTimeout(1000);
    const n = parseInt(await page.locator('#totalCount').textContent());
    if (n <= 0) throw new Error(`搜索结果 count = ${n}`);
    console.log(`   → "茅台" 找到 ${n} 款`);
  });

  await test('点击卡片打开详情', async () => {
    await page.locator('#searchInput').fill('');
    await page.locator('#searchInput').press('Escape');
    await page.waitForTimeout(500);
    const cards = await page.locator('.liquor-card').count();
    console.log(`   → 卡片数: ${cards}`);
    if (cards > 0) {
      await page.locator('.liquor-card').first().click();
      await page.waitForTimeout(800);
      const vis = await page.locator('#modalOverlay').isVisible();
      if (!vis) throw new Error('模态框未显示');
      console.log('   → 模态框打开成功');
      await page.locator('#modalClose').click();
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 通过: ${passed}  ❌ 失败: ${failed}`);
  if (errors.length > 0) {
    console.log('\n浏览器控制台错误/日志:');
    errors.slice(0, 15).forEach(e => console.log(`  ${e}`));
  }

  await browser.close();
  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => { console.error(e.message); process.exit(1); });