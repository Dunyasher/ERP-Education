const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.toString());
  });
  page.on('requestfailed', req => {
    console.log('REQUEST FAILED:', req.url(), req.failure().errorText);
  });

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });

  // take screenshot
  await page.screenshot({ path: 'login-debug.png', fullPage: true });

  await browser.close();
})();