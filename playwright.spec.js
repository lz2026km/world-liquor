const { test, expect } = require('@playwright/test');

test.describe('世界白酒大全 v1.0', () => {
  test.beforeEach(async ({ page }) => {
    // 监听 console 错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[Console Error] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      console.error(`[Page Error] ${err.message}`);
    });
  });

  test('页面加载正常，无崩溃', async ({ page }) => {
    await page.goto('http://localhost:5197/');
    // 等待页面加载（骨架屏消失或卡片出现）
    await page.waitForTimeout(3000);
    // 检查标题
    const title = await page.title();
    console.log('Title:', title);
    expect(title).toContain('World Liquor');
  });

  test('卡片数量显示正常', async ({ page }) => {
    await page.goto('http://localhost:5197/');
    await page.waitForTimeout(3000);
    // 检查 totalCount 是否大于 0
    const countText = await page.locator('#totalCount').textContent();
    console.log('Total count:', countText);
    const count = parseInt(countText);
    expect(count).toBeGreaterThan(0);
  });

  test('筛选功能正常', async ({ page }) => {
    await page.goto('http://localhost:5197/');
    await page.waitForTimeout(3000);
    // 点击"酱香型"筛选
    await page.click('button[data-filter="type"][data-value="酱香型"]');
    await page.waitForTimeout(500);
    const count = parseInt(await page.locator('#totalCount').textContent());
    console.log('After filter count:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('搜索功能正常', async ({ page }) => {
    await page.goto('http://localhost:5197/');
    await page.waitForTimeout(3000);
    // 输入搜索
    const searchInput = page.locator('#searchInput');
    await searchInput.fill('茅台');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    const count = parseInt(await page.locator('#totalCount').textContent());
    console.log('Search result count:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('收藏按钮可点击', async ({ page }) => {
    await page.goto('http://localhost:5197/');
    await page.waitForTimeout(3000);
    // 点击第一个卡片的收藏按钮
    const favBtn = page.locator('.fav-btn').first();
    if (await favBtn.isVisible()) {
      await favBtn.click();
      await page.waitForTimeout(300);
      console.log('Fav button clicked OK');
    }
  });
});