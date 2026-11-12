// End-to-end check of the main CRUD flows through the real UI, against a
// LOCAL dev server + local Supabase. Creates data, verifies it, then deletes it.
// Usage: node --env-file=.env.local scripts/e2e.mjs [screenshotDir]
import { chromium } from "playwright-core";
import { generateOwnerTokenHash } from "./lib/dev-session.mjs";
import assert from "node:assert/strict";

const shots = process.argv[2];
const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
if (!/127\.0\.0\.1|localhost/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")) {
  console.error("e2e.mjs only runs against a local Supabase instance.");
  process.exit(1);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => localStorage.setItem("theme", "dark"));
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

const step = async (name, fn) => {
  process.stdout.write(`- ${name} … `);
  await fn();
  console.log("ok");
};
const shot = async (name) => shots && page.screenshot({ path: `${shots}/e2e-${name}.png`, fullPage: true });
const toast = (text) => page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 });

await step("sign in", async () => {
  await page.goto(`${base}/auth/callback?token_hash=${await generateOwnerTokenHash()}&type=magiclink`);
  await page.waitForURL(`${base}/`);
});

const assetName = `E2E Laptop ${Date.now().toString().slice(-6)}`;

await step("asset form validation", async () => {
  await page.goto(`${base}/assets/new`);
  await page.getByRole("button", { name: "Create asset" }).click();
  await page.getByText("Name is required").waitFor();
});

await step("create asset", async () => {
  await page.fill("#name", assetName);
  await page.fill("#purchase_date", "2024-01-01");
  await page.fill("#purchase_price", "24000000");
  await page.getByRole("button", { name: "Create asset" }).click();
  await page.waitForURL(/\/assets\/[0-9a-f-]{36}$/);
  await page.getByRole("heading", { name: assetName }).waitFor();
  await page.getByText(/Rp\s?24\.000\.000/).first().waitFor();
  await page.getByText("Owned for").waitFor();
  assert.equal(await page.getByText(/market value/i).count(), 0);
  assert.equal(await page.getByText(/depreciation/i).count(), 0);
  await shot("asset-detail");
});

const assetUrl = page.url();

await step("edit asset price", async () => {
  await page.goto(`${assetUrl}/edit`);
  await page.fill("#purchase_price", "21500000");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL(assetUrl);
  await page.getByText(/Rp\s?21\.500\.000/).first().waitFor();
});

await step("asset list + filters", async () => {
  await page.goto(`${base}/assets`);
  await page.getByText(assetName).waitFor();
  await page.fill('input[aria-label="Search assets"]', "no-such-asset");
  await page.getByText("No assets match these filters").waitFor();
  await page.fill('input[aria-label="Search assets"]', "");
  await shot("assets");
});

await step("CV: personal info + experience + skill + template", async () => {
  await page.goto(`${base}/cv`);
  await page.fill("#full_name", "Alex Example");
  await page.fill("#professional_title", "Platform Engineer");
  await page.getByRole("button", { name: "Save personal info" }).click();
  await toast("Unsaved changes").catch(() => {});
  await page.getByRole("tab", { name: "Experience" }).click();
  await page.getByRole("button", { name: /Add experience/ }).first().click();
  await page.fill("#company", "E2E Corp");
  await page.fill("#position", "Senior Engineer");
  await page.fill("#start_date", "2022-03-01");
  await page.locator("#is_current").click();
  await page.fill("#responsibilities", "Own the platform\nMentor engineers");
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await page.getByText("Senior Engineer · E2E Corp").first().waitFor();
  await page.getByRole("tab", { name: "Skills" }).click();
  await page.getByRole("button", { name: /Add skill/ }).first().click();
  await page.fill("#skill_name", "TypeScript");
  await page.fill("#skill_category", "Languages");
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await page.getByText("Languages · Intermediate").waitFor();
  // Live preview contains the data
  await page.locator(".cv-page").getByText("E2E Corp").first().waitFor();
  await page.getByRole("tab", { name: "Layout" }).click();
  await page.getByRole("button", { name: /ATS Friendly/ }).click();
  await page.locator(".cv-page").getByText("Work Experience").waitFor();
  await page.waitForTimeout(800);
  await shot("cv-ats");
  await page.getByRole("button", { name: /Developer Portfolio/ }).click();
  await page.waitForTimeout(800);
  await shot("cv-developer");
  await page.getByRole("button", { name: /Modern Minimalist/ }).click();
});

await step("CV print route renders from DB", async () => {
  const [popup] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: "Print or save as PDF" }).click()]);
  await popup.addInitScript(() => (window.print = () => {}));
  await popup.waitForLoadState("networkidle");
  await popup.locator(".cv-page").getByText("Alex Example").waitFor();
  const pdf = await popup.pdf({ format: "A4", printBackground: true });
  assert.ok(pdf.length > 5000);
  await popup.close();
});

await step("CVE: watch + note + reviewed", async () => {
  await page.goto(`${base}/cve/CVE-2024-3400`);
  await page.getByText("Known exploited vulnerability (CISA KEV)").waitFor({ timeout: 45000 });
  await page.getByRole("button", { name: "Add to watchlist" }).click();
  await page.getByRole("button", { name: "Mark reviewed" }).waitFor();
  await page.fill('textarea[aria-label="New note"]', "Checked: no PAN-OS in inventory.");
  await page.getByRole("button", { name: "Add note" }).click();
  await page.getByText("Checked: no PAN-OS in inventory.").last().waitFor();
  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await page.getByRole("button", { name: "Reviewed" }).waitFor();
  await shot("cve-detail");
  await page.goto(`${base}/cve/watchlist`);
  await page.getByRole("tab", { name: /Reviewed \(1\)/ }).waitFor();
});

await step("News: save + mark read", async () => {
  await page.goto(`${base}/news`);
  const first = page.locator('button[aria-label="Save for later"]').first();
  await first.waitFor({ timeout: 30000 });
  await first.click();
  await toast("Saved to read later");
  await shot("news");
  await page.goto(`${base}/news/saved`);
  await page.getByRole("tab", { name: /Read later \(1\)/ }).waitFor();
  await page.getByRole("button", { name: "Mark as read" }).first().click();
  await page.getByRole("tab", { name: /Read \(1\)/ }).waitFor();
});

if (shots) {
  await page.goto(`${base}/`);
  await page.waitForTimeout(3000);
  await shot("overview");
}

// --------------------------- cleanup ----------------------------------------
await step("cleanup: delete asset (confirm dialog)", async () => {
  await page.goto(assetUrl);
  await page.getByRole("button", { name: "Delete" }).first().click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await page.waitForURL(`${base}/assets`);
});

await step("cleanup: remove CVE, article, CV entries", async () => {
  await page.goto(`${base}/cve/watchlist`);
  await page.getByRole("tab", { name: /All/ }).click();
  await page.getByRole("button", { name: "Remove CVE-2024-3400" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
  await page.getByText("No tracked CVEs").waitFor();

  await page.goto(`${base}/news/saved`);
  await page.getByRole("tab", { name: /All saved/ }).click();
  await page.getByRole("button", { name: "Remove bookmark" }).first().click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
  await page.getByText("Nothing here yet").waitFor();

  await page.goto(`${base}/cv`);
  await page.getByRole("tab", { name: "Experience" }).click();
  await page.getByRole("button", { name: "Delete Senior Engineer · E2E Corp" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await page.getByText("No experience yet").waitFor();
  await page.getByRole("tab", { name: "Skills" }).click();
  await page.getByRole("button", { name: "Delete TypeScript" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await page.getByText("No skill yet").waitFor();
});

await browser.close();
if (errors.length) {
  console.log("Page errors:\n" + [...new Set(errors)].join("\n"));
  process.exit(1);
}
console.log("\nAll E2E flows passed");
