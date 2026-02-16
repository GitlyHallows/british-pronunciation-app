const { chromium } = require('playwright');

(async () => {
  const userDataDir = '/tmp/chrome-pw-profile';
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath,
    headless: true,
    args: ['--profile-directory=Default']
  });

  const page = context.pages()[0] || (await context.newPage());
  await page.goto('https://vercel.com/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  const title = await page.title();
  const url = page.url();
  const body = await page.textContent('body');

  console.log(JSON.stringify({ title, url, bodySnippet: (body || '').slice(0, 500) }, null, 2));
  await context.close();
})();
