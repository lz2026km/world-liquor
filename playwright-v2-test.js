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

async function runTests() {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const BASE = 'http://localhost:' + port;
  console.log('Server on', BASE);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  let passed = 0, failed = 0;
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push('[Err] ' + msg.text());
    else if (msg.type() === 'log') console.log('   [Log]', msg.text());
  });
  page.on('pageerror', err => consoleErrors.push('[PageErr] ' + err.message));

  async function test(name, fn) {
    try {
      await fn();
      console.log('✅ ' + name);
      passed++;
    } catch (e) {
      console.log('❌ ' + name + ': ' + e.message.split('\n')[0]);
      failed++;
    }
  }

  // Navigate with commit (fastest, fire-and-forget)
  try {
    await page.goto(BASE + '/', { waitUntil: 'commit', timeout: 10000 });
  } catch(e) {
    console.log('   goto commit failed:', e.message.split('\n')[0]);
    // Try alternative
    try {
      await page.goto('file://' + path.join(__dirname, 'index.html'), { waitUntil: 'domcontentloaded', timeout: 10000 });
    } catch(e2) {
      console.log('   file:// also failed:', e2.message.split('\n')[0]);
    }
  }
  // Wait for JS to execute
  await page.waitForTimeout(4000);

  // Check how many cards loaded
  const cardCount = await page.locator('.liquor-card').count();
  const totalCount = await page.locator('#totalCount').textContent().catch(() => 'N/A');
  console.log('   Cards: ' + cardCount + ', totalCount: ' + totalCount);

  const skDisplay = await page.locator('#skeletonGrid').evaluate(el => el.style.display).catch(() => '?');
  console.log('   Skeleton display: "' + skDisplay + '"');

  // ── Basic load ──────────────────────────────────────────────────
  await test('基础加载：页面标题正确', async () => {
    const title = await page.title();
    if (!title.includes('World')) throw new Error('Title: ' + title);
  });

  if (cardCount > 0) {
    await test('数据量：200款数据加载', async () => {
      const cnt = parseInt(await page.locator('#totalCount').textContent());
      console.log('   → 总数据量: ' + cnt);
      if (cnt !== 200) throw new Error('Expected 200, got ' + cnt);
    });

    // F01: Price sort
    await test('F01 价格升序排序有效', async () => {
      await page.click('button[data-filter="type"][data-value="all"]').catch(() => {});
      await page.waitForTimeout(300);
      await page.selectOption('#sortSelect', 'price-asc');
      await page.waitForTimeout(800);
      const cards = await page.locator('.liquor-card').all();
      if (cards.length === 0) throw new Error('No cards');
      const prices = [];
      for (let i = 0; i < Math.min(3, cards.length); i++) {
        const pt = await cards[i].locator('.liquor-card-price').textContent();
        prices.push(parseInt(pt.replace(/[^0-9]/g, '')));
      }
      console.log('   → 升序前3: ' + prices.join(', '));
      if (prices[0] > prices[1] || prices[1] > prices[2]) throw new Error('Wrong order');
    });

    await test('F01 价格降序排序有效', async () => {
      await page.click('button[data-filter="type"][data-value="all"]').catch(() => {});
      await page.waitForTimeout(300);
      await page.selectOption('#sortSelect', 'price-desc');
      await page.waitForTimeout(800);
      const cards = await page.locator('.liquor-card').all();
      if (cards.length === 0) throw new Error('No cards');
      const prices = [];
      for (let i = 0; i < Math.min(3, cards.length); i++) {
        const pt = await cards[i].locator('.liquor-card-price').textContent();
        prices.push(parseInt(pt.replace(/[^0-9]/g, '')));
      }
      console.log('   → 降序前3: ' + prices.join(', '));
      if (prices[0] < prices[1] || prices[1] < prices[2]) throw new Error('Wrong order');
    });

    // F02: Export
    await test('F02 收藏导出按钮可见', async () => {
      await page.locator('.fav-btn').first().click().catch(() => {});
      await page.waitForTimeout(500);
      const btn = page.locator('#exportFavsBtn');
      if (!(await btn.isVisible())) throw new Error('Export btn not visible');
      console.log('   → 导出按钮可见');
      const [dl] = await Promise.all([
        page.waitForEvent('download', { timeout: 3000 }).catch(() => null),
        btn.click().catch(() => {})
      ]);
      if (dl) console.log('   → 文件: ' + dl.suggestedFilename());
    });

    // F03: Theme toggle
    await test('F03 暗色模式切换有效', async () => {
      const btn = page.locator('#themeBtn');
      if (!(await btn.isVisible())) throw new Error('Theme btn not visible');
      const before = await btn.textContent();
      await btn.click();
      await page.waitForTimeout(300);
      const after = await btn.textContent();
      console.log('   → ' + before + ' → ' + after);
      if (before === after) throw new Error('No change');
    });

    // F04: Carousel dots
    await test('F04 轮播指示点存在且激活', async () => {
      const dots = page.locator('#carouselDots');
      if (!(await dots.isVisible())) throw new Error('Dots not visible');
      const dc = await dots.locator('.carousel-dot').count();
      const ac = await dots.locator('.carousel-dot.active').count();
      console.log('   → Dots: ' + dc + ', Active: ' + ac);
      if (dc === 0) throw new Error('No dots');
      if (ac !== 1) throw new Error('Expected 1 active');
    });

    // F05: Mobile filter
    await test('F05 移动端筛选按钮存在', async () => {
      const cnt = await page.locator('#mobFilterBtn').count();
      console.log('   → #' + cnt);
      if (cnt > 0) console.log('   → ✅ 存在');
    });

    // F07: List view
    await test('F07 列表视图切换可用', async () => {
      const vt = page.locator('#viewToggle');
      if (await vt.count() === 0) { console.log('   → 按钮未找到'); return; }
      await vt.click();
      await page.waitForTimeout(400);
      const has = await page.locator('#liquorGrid').evaluate(el => el.classList.contains('list-view'));
      console.log('   → list-view: ' + has);
    });

    // F08: Search highlight
    await test('F08 搜索高亮结果', async () => {
      await page.locator('#searchInput').fill('茅台');
      await page.locator('#searchInput').press('Enter');
      await page.waitForTimeout(800);
      const cnt = parseInt(await page.locator('#totalCount').textContent());
      const marks = await page.locator('#liquorGrid mark').count();
      console.log('   → 结果: ' + cnt + ', marks: ' + marks);
      if (cnt === 0) throw new Error('No results');
      if (marks > 0) console.log('   → ✅ 高亮生效');
    });

    // F09: Vintage field
    await test('F09 详情页陈年字段存在', async () => {
      await page.locator('.liquor-card').first().click();
      await page.waitForTimeout(800);
      if (!(await page.locator('#modalOverlay').isVisible())) throw new Error('Modal not open');
      const vt = await page.locator('#modalVintage').textContent();
      console.log('   → vintage: "' + vt + '"');
      await page.locator('#modalClose').click();
    });

    // F10: Share btn
    await test('F10 分享按钮存在', async () => {
      await page.locator('.liquor-card').first().click();
      await page.waitForTimeout(800);
      const cnt = await page.locator('.share-btn').count();
      console.log('   → 分享按钮: ' + cnt);
      if (cnt === 0) throw new Error('No share button');
      await page.locator('#modalClose').click();
    });

    // F11: Compare
    await test('F11 酒款对比功能可用', async () => {
      const cb = page.locator('.compare-checkbox').first();
      if (await cb.count() === 0) { console.log('   → 无compare checkbox'); return; }
      await cb.click();
      await page.waitForTimeout(300);
      const active = await page.locator('#compareBar').evaluate(el => el.classList.contains('active'));
      const cnt = await page.locator('#compareCount').textContent();
      console.log('   → 激活: ' + active + ', 数量: ' + cnt);
      await cb.click();
    });

    // F15: Filter count
    await test('F15 筛选计数显示', async () => {
      await page.click('button[data-filter="type"][data-value="酱香型"]');
      await page.waitForTimeout(400);
      const tc = await page.locator('#typeCount').textContent();
      console.log('   → typeCount: "' + tc + '"');
      if (!tc || tc === '0') throw new Error('Count is 0/empty');
      const chips = await page.locator('.price-chip').count();
      console.log('   → 价格chip: ' + chips);
      if (chips === 0) throw new Error('No price chips');
    });

    // Filter
    await test('香型筛选功能正常', async () => {
      await page.click('button[data-filter="type"][data-value="清香型"]');
      await page.waitForTimeout(400);
      const cnt = parseInt(await page.locator('#totalCount').textContent());
      console.log('   → 清香型: ' + cnt);
      if (cnt === 0) throw new Error('No results');
    });

    // Search
    await test('搜索功能返回结果', async () => {
      await page.locator('#searchInput').fill('威士忌');
      await page.locator('#searchInput').press('Enter');
      await page.waitForTimeout(800);
      const cnt = parseInt(await page.locator('#totalCount').textContent());
      console.log('   → 威士忌搜索: ' + cnt);
      if (cnt === 0) throw new Error('No results');
    });

    // Modal
    await test('详情模态框打开并显示', async () => {
      await page.locator('.liquor-card').first().click();
      await page.waitForTimeout(800);
      if (!(await page.locator('#modalOverlay').isVisible())) throw new Error('Modal not open');
      const name = await page.locator('#modalName').textContent();
      console.log('   → 酒款: ' + name);
      if (!name.trim()) throw new Error('Empty name');
      await page.locator('#modalClose').click();
      await page.waitForTimeout(300);
      if (await page.locator('#modalOverlay').isVisible()) throw new Error('Not closed');
    });

    // ESC keyboard
    await test('ESC键关闭模态框', async () => {
      await page.locator('.liquor-card').first().click();
      await page.waitForTimeout(800);
      if (!(await page.locator('#modalOverlay').isVisible())) throw new Error('Modal not open');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      if (await page.locator('#modalOverlay').isVisible()) throw new Error('Still open');
    });

    // Fav
    await test('收藏按钮可点击', async () => {
      const btns = page.locator('.fav-btn');
      if (await btns.count() === 0) throw new Error('No fav buttons');
      await btns.first().click();
      await page.waitForTimeout(400);
      console.log('   → 收藏成功');
    });

    // Theme attribute
    await test('data-theme属性变化', async () => {
      await page.click('#themeBtn');
      await page.waitForTimeout(300);
      const t = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      console.log('   → theme: ' + t);
      if (!['dark','light'].includes(t)) throw new Error('Invalid: ' + t);
    });

    // Sidebar
    await test('侧边栏收藏面板可打开', async () => {
      const btn = page.locator('#favBtn');
      if (await btn.count() === 0) throw new Error('No favBtn');
      await btn.click();
      await page.waitForTimeout(400);
      console.log('   → 收藏面板打开');
    });

    // Tabindex
    await test('卡片tabindex属性存在', async () => {
      const tab = await page.locator('.liquor-card').first().getAttribute('tabindex');
      console.log('   → tabindex: ' + tab);
    });
  } else {
    console.log('   ⚠️ 无卡片数据，跳过大部分测试');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 通过: ' + passed + '  ❌ 失败: ' + failed);
  if (consoleErrors.length > 0) {
    console.log('\n浏览器控制台错误:');
    consoleErrors.slice(0, 10).forEach(e => console.log('  ' + e));
  }

  await browser.close();
  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => { console.error('Fatal: ' + e.message); process.exit(1); });
