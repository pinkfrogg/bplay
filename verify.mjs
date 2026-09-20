import { chromium } from "playwright";
import fs from "fs";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/");

  // Wait for load
  await page.waitForTimeout(2000);

  await page.screenshot({ path: "/home/jules/verification/screenshots/home.png", fullPage: true });

  // Click on the first album
  const albums = await page.locator(".sleeve-entry");
  if (await albums.count() > 0) {
    await albums.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "/home/jules/verification/screenshots/album_page.png", fullPage: true });
  }

  // Go to admin
  await page.goto("http://localhost:3000/admin");
  await page.waitForTimeout(1000);

  const emailInput = page.locator("input[type='email']").first();
  if (await emailInput.count() > 0) {
    await emailInput.fill("admin@example.com");
    await page.locator("input[type='password']").fill("admin");
    await page.locator("button[type='submit']").click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: "/home/jules/verification/screenshots/admin.png", fullPage: true });

  await browser.close();
  console.log("Screenshots captured!");
}

run().catch(console.error);
