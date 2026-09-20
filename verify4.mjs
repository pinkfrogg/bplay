import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" });

  // Set the admin cookie directly since login doesn't have a visible form but uses window.prompt or direct auth if bypassing
  // For standard API route cookies:
  await context.addCookies([{
    name: 'owner_session',
    value: 'true',
    domain: 'localhost',
    path: '/'
  }]);

  const page = await context.newPage();

  console.log("Navigating to admin...");
  await page.goto('http://localhost:3000/desk');
  await page.waitForTimeout(2000);

  // If there's an overlay or prompt we bypass by mocking the cookie.

  console.log("Taking screenshot of inline creation form...");
  await page.screenshot({ path: '/home/jules/verification/screenshots/admin4_inline.png', fullPage: true });

  await browser.close();
  console.log("Done.");
})();
