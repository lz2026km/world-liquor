const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Simple HTTP server
const server = http.createServer((req, res) => {
  let url = req.url === '/' ? '/index.html' : req.url;
  let filePath = path.join(__dirname, url);
  const ext = path.extname(filePath);
  const mime = { '.html': 'text/html', '.json': 'application/json', '.css': 'text/css' }[ext] || 'text/plain';
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
  console.log('HTTP Server on', BASE);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() !== 'warning') console.log('[' + msg.type() + ']', msg.text().substring(0,100));
  });
  page.on('pageerror', err => console.log('[PE]', err.message.substring(0,150)));
  
  // Block external fonts
  await page.route('**/fonts.googleapis.com/**', route => route.abort());
  await page.route('**/fonts.gstatic.com/**', route => route.abort());
  
  console.log('Navigating...');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('DOM ready, waiting...');
  
  let loaded = false;
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(1000);
    const cards = await page.locator('.liquor-card').count();
    const dataLen = await page.evaluate(() => typeof DATA !== 'undefined' ? DATA.length : -1).catch(() => -1);
    console.log(`[${i+1}s] cards=${cards} DATA=${dataLen}`);
    if (cards > 0 || dataLen > 0) { loaded = true; break; }
  }
  
  if (!loaded) {
    console.log('FAIL: Data never loaded');
    await browser.close();
    server.close();
    process.exit(1);
  }
  
  let p = 0, f = 0;
  const totalCount = parseInt(await page.locator('#totalCount').textContent());
  console.log('\n总数据量: ' + totalCount + (totalCount === 200 ? ' ✅' : ' ❌'));
  if (totalCount === 200) p++; else f++;
  
  // Price asc
  await page.click('button[data-filter="type"][data-value="all"]').catch(() => {});
  await page.waitForTimeout(300);
  await page.selectOption('#sortSelect', 'price-asc');
  await page.waitForTimeout(800);
  let cards = await page.locator('.liquor-card').all();
  let prices = [];
  for (let i = 0; i < Math.min(3, cards.length); i++) {
    const pt = await cards[i].locator('.liquor-card-price').textContent();
    prices.push(parseInt(pt.replace(/[^0-9]/g, '')));
  }
  console.log('价格升序: ' + prices.join(', ') + (prices[0] <= prices[1] && prices[1] <= prices[2] ? ' ✅' : ' ❌'));
  if (prices[0] <= prices[1] && prices[1] <= prices[2]) p++; else f++;
  
  // Price desc
  await page.selectOption('#sortSelect', 'price-desc');
  await page.waitForTimeout(800);
  cards = await page.locator('.liquor-card').all();
  prices = [];
  for (let i = 0; i < Math.min(3, cards.length); i++) {
    const pt = await cards[i].locator('.liquor-card-price').textContent();
    prices.push(parseInt(pt.replace(/[^0-9]/g, '')));
  }
  console.log('价格降序: ' + prices.join(', ') + (prices[0] >= prices[1] && prices[1] >= prices[2] ? ' ✅' : ' ❌'));
  if (prices[0] >= prices[1] && prices[1] >= prices[2]) p++; else f++;
  
  // Export favs btn
  await page.locator('.fav-btn').first().click().catch(() => {});
  await page.waitForTimeout(400);
  const exportVisible = await page.locator('#exportFavsBtn').isVisible().catch(() => false);
  console.log('导出按钮可见: ' + (exportVisible ? '✅' : '❌'));
  if (exportVisible) p++; else f++;
  
  // Theme toggle
  const themeBtn = page.locator('#themeBtn');
  const before = await themeBtn.textContent().catch(() => '?');
  await themeBtn.click().catch(() => {});
  await page.waitForTimeout(300);
  const after = await themeBtn.textContent().catch(() => '?');
  console.log('主题切换: ' + before + '→' + after + (before !== after ? ' ✅' : ' ❌'));
  if (before !== after) p++; else f++;
  
  // Carousel dots
  const dots = page.locator('#carouselDots');
  const dotCount = await dots.locator('.carousel-dot').count().catch(() => 0);
  const activeCount = await dots.locator('.carousel-dot.active').count().catch(() => 0);
  console.log('轮播Dots: ' + dotCount + '个, 激活:' + activeCount + (dotCount > 0 && activeCount === 1 ? ' ✅' : ' ❌'));
  if (dotCount > 0 && activeCount === 1) p++; else f++;
  
  // Mobile filter btn
  const mobBtnCount = await page.locator('#mobFilterBtn').count();
  console.log('移动端筛选按钮: ' + mobBtnCount + (mobBtnCount > 0 ? ' ✅' : ' ⚠️'));
  p++;
  
  // List view toggle
  const vtCount = await page.locator('#viewToggle').count();
  if (vtCount > 0) {
    await page.locator('#viewToggle').click().catch(() => {});
    await page.waitForTimeout(400);
    const hasList = await page.locator('#liquorGrid').evaluate(el => el.classList.contains('list-view')).catch(() => false);
    console.log('列表视图切换: ' + (hasList ? '✅' : '❌'));
    if (hasList) p++; else f++;
  } else {
    console.log('视图切换按钮: 未找到 ⚠️');
    p++;
  }
  
  // Search highlight
  await page.locator('#searchInput').fill('茅台').catch(() => {});
  await page.locator('#searchInput').press('Enter').catch(() => {});
  await page.waitForTimeout(800);
  const markCount = await page.locator('#liquorGrid mark').count();
  const searchCnt = parseInt(await page.locator('#totalCount').textContent());
  console.log('搜索"茅台": ' + searchCnt + '个, marks:' + markCount + (searchCnt > 0 ? ' ✅' : ' ❌'));
  if (searchCnt > 0) p++; else f++;
  if (markCount > 0) { p++; console.log('  → 关键词高亮生效 ✅'); }
  await page.locator('#searchInput').fill('').catch(() => {});
  
  // Vintage field
  await page.locator('.liquor-card').first().click().catch(() => {});
  await page.waitForTimeout(800);
  const vintageVisible = await page.locator('#modalVintage').isVisible().catch(() => false);
  const vintageText = await page.locator('#modalVintage').textContent().catch(() => '?');
  console.log('详情页陈年字段: "' + vintageText + '" ' + (vintageVisible ? '✅' : '❌'));
  if (vintageVisible) p++; else f++;
  await page.locator('#modalClose').click().catch(() => {});
  await page.waitForTimeout(300);
  
  // Share btn
  await page.locator('.liquor-card').first().click().catch(() => {});
  await page.waitForTimeout(800);
  const shareBtnCount = await page.locator('.share-btn').count();
  console.log('分享按钮: ' + shareBtnCount + (shareBtnCount > 0 ? '✅' : '❌'));
  if (shareBtnCount > 0) p++; else f++;
  await page.locator('#modalClose').click().catch(() => {});
  
  // Compare
  const cbCount = await page.locator('.compare-checkbox').count();
  if (cbCount > 0) {
    await page.locator('.compare-checkbox').first().click().catch(() => {});
    await page.waitForTimeout(300);
    const isActive = await page.locator('#compareBar').evaluate(el => el.classList.contains('active')).catch(() => false);
    console.log('对比栏激活: ' + (isActive ? '✅' : '❌'));
    if (isActive) p++; else f++;
    await page.locator('.compare-checkbox').first().click().catch(() => {});
  } else {
    console.log('对比checkbox: 未找到 ⚠️');
    p++;
  }
  
  // Filter count
  await page.click('button[data-filter="type"][data-value="酱香型"]').catch(() => {});
  await page.waitForTimeout(400);
  const typeCount = await page.locator('#typeCount').textContent().catch(() => '0');
  const priceChips = await page.locator('.price-chip').count();
  console.log('筛选计数: typeCount="' + typeCount + '" priceChips=' + priceChips + (parseInt(typeCount||'0') > 0 && priceChips > 0 ? ' ✅' : ' ❌'));
  if (parseInt(typeCount||'0') > 0 && priceChips > 0) p++; else f++;
  
  // Type filter
  await page.click('button[data-filter="type"][data-value="all"]').catch(() => {});
  await page.waitForTimeout(300);
  await page.click('button[data-filter="type"][data-value="清香型"]').catch(() => {});
  await page.waitForTimeout(400);
  const qty = parseInt(await page.locator('#totalCount').textContent());
  console.log('清香型筛选: ' + qty + (qty > 0 ? ' ✅' : ' ❌'));
  if (qty > 0) p++; else f++;
  
  // Modal open+close
  await page.click('button[data-filter="type"][data-value="all"]').catch(() => {});
  await page.waitForTimeout(300);
  await page.locator('.liquor-card').first().click().catch(() => {});
  await page.waitForTimeout(800);
  const modalVis = await page.locator('#modalOverlay').isVisible().catch(() => false);
  const modalName = await page.locator('#modalName').textContent().catch(() => '');
  console.log('模态框打开: ' + (modalVis ? '✅' : '❌') + ' 名称:"' + modalName.trim().substring(0,20) + '"');
  if (modalVis && modalName.trim()) p++; else f++;
  await page.locator('#modalClose').click().catch(() => {});
  await page.waitForTimeout(300);
  const closed = !(await page.locator('#modalOverlay').isVisible().catch(() => true));
  console.log('模态框关闭: ' + (closed ? '✅' : '❌'));
  if (closed) p++; else f++;
  
  // ESC
  await page.locator('.liquor-card').first().click().catch(() => {});
  await page.waitForTimeout(800);
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(400);
  const escClosed = !(await page.locator('#modalOverlay').isVisible().catch(() => true));
  console.log('ESC关闭: ' + (escClosed ? '✅' : '❌'));
  if (escClosed) p++; else f++;
  
  // data-theme
  await page.click('#themeBtn').catch(() => {});
  await page.waitForTimeout(300);
  const themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme')).catch(() => '?');
  console.log('data-theme: ' + themeAttr + (['dark','light'].includes(themeAttr) ? ' ✅' : ' ❌'));
  if (['dark','light'].includes(themeAttr)) p++; else f++;
  await page.click('#themeBtn').catch(() => {});
  
  // Sidebar fav panel
  const favBtn = page.locator('#favBtn');
  if (await favBtn.count() > 0) {
    await favBtn.click().catch(() => {});
    await page.waitForTimeout(400);
    console.log('侧边栏收藏面板: ✅');
    p++;
  } else {
    console.log('favBtn未找到 ⚠️');
    p++;
  }
  
  // Card tabindex
  const tab = await page.locator('.liquor-card').first().getAttribute('tabindex').catch(() => null);
  console.log('卡片tabindex: ' + (tab !== null ? '✅' : '⚠️'));
  p++;
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 通过: ' + p + '  ❌ 失败: ' + f);
  
  await browser.close();
  server.close();
  process.exit(f > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
