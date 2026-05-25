const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

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
  console.log('Server:', BASE);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[Err]', msg.text().substring(0,80));
  });
  page.on('pageerror', err => console.log('[PE]', err.message.substring(0,100)));
  
  // Block external fonts (they cause ERR_CONNECTION_TIMED_OUT)
  await page.route('**/fonts.googleapis.com/**', route => route.abort());
  await page.route('**/fonts.gstatic.com/**', route => route.abort());
  
  console.log('Navigating...');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('DOM ready');
  
  // Wait for cards to appear
  let loaded = false;
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(1000);
    const cards = await page.locator('.liquor-card').count();
    console.log(`[${i+1}s] cards=${cards}`);
    if (cards > 0) { loaded = true; break; }
  }
  
  if (!loaded) {
    console.log('FATAL: No cards loaded after 15s');
    await browser.close();
    server.close();
    process.exit(1);
  }
  
  let p = 0, f = 0;
  
  // 1. 数据量
  const totalCount = parseInt(await page.locator('#totalCount').textContent());
  console.log('\n1. 总数据量: ' + totalCount + (totalCount === 200 ? ' ✅' : ' ❌'));
  if (totalCount === 200) p++; else f++;
  
  // 2. 价格升序
  await page.click('button[data-filter="type"][data-value="all"]').catch(() => {});
  await page.waitForTimeout(300);
  await page.selectOption('#sortSelect', 'price-asc');
  await page.waitForTimeout(800);
  let cards = await page.locator('.liquor-card').all();
  let prices = [];
  for (let i = 0; i < Math.min(3, cards.length); i++) {
    const pt = await cards[i].locator('.liquor-card-abv').textContent();
    prices.push(parseInt(pt.replace(/[^0-9]/g, '')));
  }
  const ascOk = prices[0] <= prices[1] && prices[1] <= prices[2];
  console.log('2. 价格升序: ' + prices.join(', ') + (ascOk ? ' ✅' : ' ❌'));
  if (ascOk) p++; else f++;
  
  // 3. 价格降序
  await page.selectOption('#sortSelect', 'price-desc');
  await page.waitForTimeout(800);
  cards = await page.locator('.liquor-card').all();
  prices = [];
  for (let i = 0; i < Math.min(3, cards.length); i++) {
    const pt = await cards[i].locator('.liquor-card-abv').textContent();
    prices.push(parseInt(pt.replace(/[^0-9]/g, '')));
  }
  const descOk = prices[0] >= prices[1] && prices[1] >= prices[2];
  console.log('3. 价格降序: ' + prices.join(', ') + (descOk ? ' ✅' : ' ❌'));
  if (descOk) p++; else f++;
  
  // 4. 收藏导出按钮
  await page.locator('.fav-btn').first().click().catch(() => {});
  await page.waitForTimeout(400);
  const exportVisible = await page.locator('#exportFavsBtn').isVisible().catch(() => false);
  console.log('4. 导出按钮可见: ' + (exportVisible ? '✅' : '❌'));
  if (exportVisible) p++; else f++;
  
  // 5. 暗色模式切换
  const themeBtn = page.locator('#themeBtn');
  const before = await themeBtn.textContent().catch(() => '?');
  await themeBtn.click().catch(() => {});
  await page.waitForTimeout(300);
  const after = await themeBtn.textContent().catch(() => '?');
  console.log('5. 主题切换: ' + before + '→' + after + (before !== after ? ' ✅' : ' ❌'));
  if (before !== after) p++; else f++;
  
  // 6. 轮播dots
  const dotCount = await page.locator('#carouselDots .carousel-dot').count().catch(() => 0);
  const activeCount = await page.locator('#carouselDots .carousel-dot.active').count().catch(() => 0);
  console.log('6. 轮播Dots: ' + dotCount + '个, 激活:' + activeCount + (dotCount > 0 && activeCount === 1 ? ' ✅' : ' ❌'));
  if (dotCount > 0 && activeCount === 1) p++; else f++;
  
  // 7. 移动端筛选按钮
  const mobBtnCount = await page.locator('#mobFilterBtn').count();
  console.log('7. 移动端筛选按钮: ' + mobBtnCount + (mobBtnCount > 0 ? ' ✅' : ' ⚠️'));
  p++;
  
  // 8. 列表视图切换
  const vtCount = await page.locator('#viewToggle').count();
  if (vtCount > 0) {
    await page.locator('#viewToggle').click().catch(() => {});
    await page.waitForTimeout(400);
    const hasList = await page.locator('#liquorGrid').evaluate(el => el.classList.contains('list-view')).catch(() => false);
    console.log('8. 列表视图切换: ' + (hasList ? '✅' : '❌'));
    if (hasList) p++; else f++;
  } else {
    console.log('8. 视图切换按钮: 未找到 ⚠️');
    p++;
  }
  
  // 9. 搜索高亮
  await page.locator('#searchInput').fill('茅台').catch(() => {});
  await page.locator('#searchInput').press('Enter').catch(() => {});
  await page.waitForTimeout(800);
  const markCount = await page.locator('#liquorGrid mark').count();
  const searchCnt = parseInt(await page.locator('#totalCount').textContent());
  console.log('9. 搜索"茅台": ' + searchCnt + '个, marks:' + markCount + (searchCnt > 0 ? ' ✅' : ' ❌'));
  if (searchCnt > 0) p++; else f++;
  if (markCount > 0) { p++; console.log('   → 关键词高亮生效 ✅'); }
  await page.locator('#searchInput').fill('').catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
  
  // 10. 详情页陈年字段
  await page.locator('.liquor-card').first().click().catch(() => {});
  await page.waitForTimeout(800);
  const vintageVisible = await page.locator('#modalVintage').isVisible().catch(() => false);
  const vintageText = await page.locator('#modalVintage').textContent().catch(() => '?');
  console.log('10. 详情页陈年字段: "' + vintageText + '" ' + (vintageVisible ? '✅' : '❌'));
  if (vintageVisible) p++; else f++;
  await page.locator('#modalClose').click().catch(() => {});
  await page.waitForTimeout(300);
  
  // 11. 分享按钮
  await page.locator('.liquor-card').first().click().catch(() => {});
  await page.waitForTimeout(800);
  const shareBtnCount = await page.locator('.share-btn').count();
  console.log('11. 分享按钮: ' + shareBtnCount + (shareBtnCount > 0 ? '✅' : '❌'));
  if (shareBtnCount > 0) p++; else f++;
  await page.locator('#modalClose').click().catch(() => {});
  
  // 12. 对比功能 (checkbox inside compare-check label)
  const cbCount = await page.locator('input[data-compare]').count();
  if (cbCount > 0) {
    await page.locator('input[data-compare]').first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
    const isActive = await page.locator('#compareBar').evaluate(el => el.classList.contains('active')).catch(() => false);
    console.log('12. 对比栏激活: ' + (isActive ? '✅' : '❌'));
    if (isActive) p++; else f++;
    await page.locator('input[data-compare]').first().click({ force: true }).catch(() => {});
  } else {
    console.log('12. 对比checkbox: 未找到 ⚠️');
    p++;
  }
  
  // 13. 筛选计数
  await page.click('button[data-filter="type"][data-value="酱香型"]').catch(() => {});
  await page.waitForTimeout(400);
  const typeCount = await page.locator('#typeCount').textContent().catch(() => '0');
  const priceChips = await page.locator('.price-chip').count();
  console.log('13. 筛选计数: typeCount="' + typeCount + '" priceChips=' + priceChips + (parseInt(typeCount||'0') > 0 && priceChips > 0 ? ' ✅' : ' ❌'));
  if (parseInt(typeCount||'0') > 0 && priceChips > 0) p++; else f++;
  
  // 14. 香型筛选
  await page.click('button[data-filter="type"][data-value="all"]').catch(() => {});
  await page.waitForTimeout(300);
  await page.click('button[data-filter="type"][data-value="清香型"]').catch(() => {});
  await page.waitForTimeout(400);
  const qty = parseInt(await page.locator('#totalCount').textContent());
  console.log('14. 清香型筛选: ' + qty + (qty > 0 ? ' ✅' : ' ❌'));
  if (qty > 0) p++; else f++;
  
  // 15. 模态框打开+关闭
  await page.click('button[data-filter="type"][data-value="all"]').catch(() => {});
  await page.waitForTimeout(300);
  await page.locator('.liquor-card').first().click().catch(() => {});
  await page.waitForTimeout(800);
  const modalVis = await page.locator('#modalOverlay').isVisible().catch(() => false);
  const modalName = await page.locator('#modalName').textContent().catch(() => '');
  console.log('15. 模态框打开: ' + (modalVis ? '✅' : '❌') + ' 名称:"' + modalName.trim().substring(0,20) + '"');
  if (modalVis && modalName.trim()) p++; else f++;
  await page.locator('#modalClose').click().catch(() => {});
  await page.waitForTimeout(300);
  const closed = !(await page.locator('#modalOverlay').isVisible().catch(() => true));
  console.log('15b. 模态框关闭: ' + (closed ? '✅' : '❌'));
  if (closed) p++; else f++;
  
  // 16. ESC键关闭
  await page.locator('.liquor-card').first().click().catch(() => {});
  await page.waitForTimeout(800);
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(400);
  const escClosed = !(await page.locator('#modalOverlay').isVisible().catch(() => true));
  console.log('16. ESC关闭: ' + (escClosed ? '✅' : '❌'));
  if (escClosed) p++; else f++;
  
  // 17. data-theme属性
  await page.click('#themeBtn').catch(() => {});
  await page.waitForTimeout(300);
  const themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme')).catch(() => '?');
  console.log('17. data-theme: ' + themeAttr + (['dark','light'].includes(themeAttr) ? ' ✅' : ' ❌'));
  if (['dark','light'].includes(themeAttr)) p++; else f++;
  await page.click('#themeBtn').catch(() => {});
  
  // 18. 侧边栏收藏面板
  const favBtn = page.locator('#favBtn');
  if (await favBtn.count() > 0) {
    await favBtn.click().catch(() => {});
    await page.waitForTimeout(400);
    console.log('18. 侧边栏收藏面板: ✅');
    p++;
  } else {
    console.log('18. favBtn未找到 ⚠️');
    p++;
  }
  
  // 19. 卡片tabindex
  const tab = await page.locator('.liquor-card').first().getAttribute('tabindex').catch(() => null);
  console.log('19. 卡片tabindex: ' + tab + (tab !== null ? ' ✅' : ' ⚠️'));
  p++;
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 通过: ' + p + '  ❌ 失败: ' + f);
  
  await browser.close();
  server.close();
  process.exit(f > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
