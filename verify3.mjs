import { chromium } from "playwright";
import fs from "fs";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  });
  const page = await context.newPage();

  await page.goto("http://localhost:3000/");

  // Wait for load
  await page.waitForTimeout(3000);

  await page.screenshot({ path: "/home/jules/verification/screenshots/home3.png", fullPage: true });

  // Click on the first album
  const albums = page.locator(".sleeve-entry");
  if (await albums.count() > 0) {
    await albums.first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "/home/jules/verification/screenshots/album_page.png", fullPage: true });
  }

  // Go to admin
  await page.goto("http://localhost:3000/admin");
  await page.waitForTimeout(2000);

  const emailInput = page.locator("input[type='email']").first();
  if (await emailInput.count() > 0) {
    await emailInput.fill("admin@example.com");
    await page.locator("input[type='password']").fill("admin");
    await page.locator("button[type='submit']").click();
    await page.waitForTimeout(3000);

    // expand first album
    const expandBtn = page.locator(".desk-sleeve-trigger").first();
    if (await expandBtn.count() > 0) {
      await expandBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  await page.screenshot({ path: "/home/jules/verification/screenshots/admin3.png", fullPage: true });

  await browser.close();
  console.log("Screenshots captured!");
}

run().catch(console.error);
