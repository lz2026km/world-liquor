const { chromium } = require('/home/admin/.npm-global/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const DATA_FILE = '/home/admin/hermes/projects/world-liquor/baijiu_data.json';
const IMG_URL_FILE = '/tmp/baijiu_img_urls.json';
const IMG_DIR = '/home/admin/hermes/projects/world-liquor/images';

let data, existingUrls, completedIds;

function loadData() {
  data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log('Total items:', data.length);
}

function loadProgress() {
  try {
    existingUrls = JSON.parse(fs.readFileSync(IMG_URL_FILE, 'utf8'));
  } catch(e) {
    existingUrls = [];
  }
  completedIds = new Set(existingUrls.map(u => u.id));
  console.log('Existing URLs loaded:', existingUrls.length);
}

function saveUrls() {
  fs.writeFileSync(IMG_URL_FILE, JSON.stringify(existingUrls, null, 2));
}

function saveResult(id, name, url) {
  if (!completedIds.has(id)) {
    existingUrls.push({ id, name, url });
    completedIds.add(id);
    saveUrls();
  }
}

function getRealImageUrls(allUrls) {
  return allUrls.filter(u => {
    if (!u || !u.startsWith('http')) return false;
    if (u.includes('data:')) return false;
    if (u.includes('logo/pc')) return false;
    if (u.includes('img0.baidu.com') || u.includes('img1.baidu.com') || u.includes('img2.baidu.com')) {
      if (u.match(/[&?]f=JPEG/) || u.match(/[&?]fm=/)) return true;
    }
    return false;
  });
}

function makeSearchUrl(keyword) {
  return `https://image.baidu.com/search/index?word=${encodeURIComponent(keyword)}&tn=baiduimage`;
}

function downloadImage(imgUrl, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = imgUrl.startsWith('https') ? https : http;
    const step = protocol.get(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://image.baidu.com',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      },
      timeout: 20000
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      const tmpPath = destPath + '.tmp';
      const out = fs.createWriteStream(tmpPath);
      res.pipe(out);
      out.on('finish', () => {
        fs.renameSync(tmpPath, destPath);
        resolve();
      });
      out.on('error', reject);
    });
    step.on('error', reject);
    step.on('timeout', () => { step.destroy(); reject(new Error('Timeout')); });
  });
}

const BROWSER_RESTART_EVERY = 20;
const ITEM_DELAY = 2000;
const BATCH_DELAY = 6000;

(async function main() {
  loadData();
  loadProgress();

  const remain = data.filter(item => !completedIds.has(item.id));
  console.log('Remaining:', remain.length);

  let processedInSession = 0;
  let sessionIdx = 0;

  async function processItem(page, item) {
    const keyword = `${item.name} ${item.ename || ''} 白酒`.trim();
    await page.goto(makeSearchUrl(keyword), { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    for (let s = 0; s < 3; s++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(400);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    const allUrls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .map(img => img.dataset.src || img.dataset.url || img.dataset.original || img.src || '')
        .filter(u => u && u.startsWith('http') && !u.includes('data:image'));
    });

    const realUrls = getRealImageUrls(allUrls);
    const url = realUrls.length > 1 ? realUrls[1] : (realUrls[0] || null);
    return { item, url };
  }

  while (true) {
    if (processedInSession > 0 && processedInSession % BROWSER_RESTART_EVERY === 0) {
      console.log(`\n  [Session ${sessionIdx}] Restarting browser...`);
      // browser will be recreated below
    }

    // Check if we need to start a fresh browser
    if (!global._browser || processedInSession % BROWSER_RESTART_EVERY === 0) {
      if (global._browser) {
        try { await global._browser.close(); } catch(e) {}
      }
      sessionIdx++;
      global._browser = await chromium.launch({
        headless: true,
        executablePath: '/usr/bin/google-chrome',
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-webgl',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-first-run',
          '--safebrowsing-disable-auto-update'
        ]
      });
      global._page = await global._browser.newPage();
      await global._page.setViewportSize({ width: 1280, height: 900 });
      await global._page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8' });
      console.log(`\n  [Session ${sessionIdx}] Browser restarted`);
    }

    const page = global._page;
    const item = remain.find(i => !completedIds.has(i.id));
    if (!item) break;

    console.log(`  [${completedIds.size + 1}/${data.length}] ${item.name}`);
    try {
      const result = await processItem(page, item);
      if (result.url) {
        saveResult(result.item.id, result.item.name, result.url);
        console.log(`    ✅ ${result.url.substring(0, 80)}`);
      } else {
        console.log(`    ❌ no image found`);
      }
    } catch(e) {
      console.log(`    ⚠️ ${e.message.substring(0, 80)}`);
    }

    processedInSession++;
    await new Promise(r => setTimeout(r, ITEM_DELAY));
  }

  if (global._browser) {
    try { await global._browser.close(); } catch(e) {}
  }

  console.log('\n=== URL Collection Complete ===');
  console.log('Total URLs:', existingUrls.length);

  // Download images
  console.log('\n=== Downloading Images ===');
  fs.mkdirSync(IMG_DIR, { recursive: true });

  let dlOk = 0, dlFail = 0;
  const toDl = existingUrls.filter(u => u.url);

  async function dlWorker(b) {
    const safe = b.name.replace(/[\/\\\?\*\|:<>"]/g, '_').substring(0, 40);
    const dest = path.join(IMG_DIR, `${b.id}_${safe}.jpg`);
    try {
      await downloadImage(b.url, dest);
      return true;
    } catch(e) {
      return false;
    }
  }

  const STEP = 8;
  for (let k = 0; k < toDl.length; k += STEP) {
    const chunk = toDl.slice(k, k + STEP);
    console.log(`  Downloading ${k+1}-${Math.min(k+STEP, toDl.length)}/${toDl.length}...`);
    const res = await Promise.all(chunk.map(b => dlWorker(b)));
    res.forEach(r => { if (r) dlOk++; else dlFail++; });
    if (k + STEP < toDl.length) await new Promise(r => setTimeout(r, 1200));
  }

  console.log('\n=== DONE ===');
  console.log('URLs extracted:', existingUrls.length);
  console.log('Images downloaded:', dlOk);
  console.log('Images failed:', dlFail);
})().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});