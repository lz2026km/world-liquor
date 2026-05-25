const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  try {
    await page.goto('http://localhost:5198/', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Check what's visible
    const initialLoading = await page.$('#initialLoading');
    const app = await page.$('#app');
    const cardGrid = await page.$('#cardGrid');
    
    const initialLoadingDisplay = initialLoading ? await initialLoading.evaluate(el => el.style.display) : 'not found';
    const appDisplay = app ? await app.evaluate(el => el.style.display) : 'not found';
    const cardGridHTML = cardGrid ? await cardGrid.evaluate(el => el.innerHTML.substring(0, 200)) : 'not found';
    
    console.log('=== Page State ===');
    console.log('initialLoading display:', initialLoadingDisplay);
    console.log('app display:', appDisplay);
    console.log('cardGrid content:', cardGridHTML ? 'has content' : 'EMPTY');
    console.log('Errors:', errors.length ? errors : 'NONE');
    
    // Wait a bit for JS to execute
    await page.waitForTimeout(3000);
    
    const cardGridHTML2 = cardGrid ? await page.$eval('#cardGrid', el => el.innerHTML.substring(0, 500)) : 'not found';
    console.log('\n=== After 3s ===');
    console.log('cardGrid content:', cardGridHTML2);
    console.log('Errors:', errors.length ? errors : 'NONE');
    
  } catch (e) {
    console.error('Test failed:', e.message);
  }
  
  await browser.close();
})();