import { chromium } from 'playwright';

const URL = 'https://aether-panel.aether-panel.workers.dev/panel';
const USER = 'nikzad';
const PASS = 'Nikzad@2026!';

async function testViewport(width, height, label) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));

  // Login first (POST via the page context to get cookie)
  await page.goto('https://aether-panel.aether-panel.workers.dev/login');
  await page.fill('#u', USER);
  await page.fill('#p', PASS);
  await page.click('#f button');
  await page.waitForURL('**/panel', { timeout: 15000 }).catch(()=>{});
  await page.waitForTimeout(2000);

  await page.goto(URL);
  await page.waitForTimeout(1500);

  const diag = await page.evaluate(() => {
    const v = (el) => el ? ({
      w: el.getBoundingClientRect().width,
      h: el.getBoundingClientRect().height,
      x: el.getBoundingClientRect().x,
      y: el.getBoundingClientRect().y,
      visible: getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0
    }) : null;
    const issues = [];
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > window.innerWidth + 2 && r.height > 4 && getComputedStyle(el).display !== 'none') {
        // check it's not inside overflow container
        let p = el.parentElement; let inScroll=false;
        while (p) { if (getComputedStyle(p).overflowX === 'auto' || getComputedStyle(p).overflowX === 'scroll') { inScroll=true; break; } p=p.parentElement; }
        if (!inScroll && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
          issues.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,80), w: Math.round(r.width), x: Math.round(r.x) });
        }
      }
    });
    return {
      win: { w: window.innerWidth, h: window.innerHeight },
      appTopbar: v(document.querySelector('.app-topbar')),
      topnav: v(document.querySelector('.topnav')),
      bottomnav: v(document.querySelector('.bottomnav')),
      main: v(document.querySelector('main.app-main')),
      search: v(document.getElementById('search')),
      btnNew: v(document.getElementById('btn-new')),
      meChip: v(document.querySelector('.me-chip')),
      brand: v(document.querySelector('.brand')),
      tableOverflow: v(document.querySelector('#users-table')),
      statGrid: v(document.querySelector('section[data-page="dashboard"] .grid')),
      issues: issues.slice(0, 20)
    };
  });

  await page.screenshot({ path: `/home/user/aether-panel/test/mobile-${label}.png`, fullPage: true });

  // Also test users view (click the visible nav item)
  const navSel = width < 768 ? '.bottomnav .nav-item[data-view="users"]' : '.topnav .nav-item[data-view="users"]';
  await page.click(navSel);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `/home/user/aether-panel/test/mobile-${label}-users.png`, fullPage: true });

  console.log(`\n===== ${label} (${width}x${height}) =====`);
  console.log(JSON.stringify(diag, null, 2));
  if (logs.length) console.log('LOGS:', logs.join('\n'));
  await browser.close();
}

await testViewport(390, 844, 'iphone');
await testViewport(360, 640, 'android-small');
await testViewport(768, 1024, 'tablet');
