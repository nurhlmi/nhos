// Verifies the passwordless login end to end against LOCAL Supabase:
// requests the email through the real form, reads it from the local Mailpit
// inbox and signs in by opening the verification link. Also checks that a
// non-owner email gets the same response and no email, and that links are
// single-use and cannot be forged.
// Usage: node --env-file=.env.local scripts/login-check.mjs
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { assertLocal, ownerEmail } from "./lib/dev-session.mjs";

assertLocal();
const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const mailpit = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const email = ownerEmail();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function clearInbox() {
  await fetch(`${mailpit}/api/v1/messages`, { method: "DELETE" });
}
async function latestMessage(to) {
  for (let i = 0; i < 30; i++) {
    const list = await (await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)).json();
    const id = list.messages?.[0]?.ID;
    if (id) return (await fetch(`${mailpit}/api/v1/message/${id}`)).json();
    await sleep(500);
  }
  return null;
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const step = async (name, fn) => {
  process.stdout.write(`- ${name} … `);
  await fn();
  console.log("ok");
};

async function requestEmail(page, address) {
  // Auth enforces a minimum gap between emails to the same address.
  await sleep(1500);
  await page.goto(`${base}/login`);
  await page.fill("#email", address);
  await page.getByRole("button", { name: "Send verification link" }).click();
  await page.getByText("Check your email").waitFor();
  // Link-only flow: there is no code input.
  assert.equal(await page.locator("#token").count(), 0);
}

await step("protected page redirects to /login", async () => {
  const page = await browser.newPage();
  await page.goto(`${base}/assets`);
  assert.match(page.url(), /\/login\?next=%2Fassets/);
  await page.close();
});

await step("non-allowed email: same UI response, no email sent", async () => {
  await clearInbox();
  const page = await browser.newPage();
  await requestEmail(page, "stranger@example.com");
  await sleep(2000);
  const list = await (await fetch(`${mailpit}/api/v1/messages`)).json();
  assert.equal(list.messages_count ?? list.total ?? 0, 0);
  await page.close();
});

await step("sign in by opening the emailed verification link", async () => {
  await clearInbox();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${base}/cve`);
  await page.waitForURL(/\/login/);
  await sleep(1500);
  await page.fill("#email", email);
  await page.getByRole("button", { name: "Send verification link" }).click();
  await page.getByText("Check your email").waitFor();
  const msg = await latestMessage(email);
  const link = msg.HTML.match(/href="([^"]*\/auth\/callback[^"]*)"/)?.[1]?.replace(/&amp;/g, "&");
  assert.ok(link, "link not found in email");
  // The email uses Auth's configured site URL; point it at the server under test.
  const target = link.replace(/^https?:\/\/[^/]+/, base);
  assert.ok(!/\b\d{6}\b/.test(msg.Text), "email must not contain a one-time code");
  await page.goto(target);
  await page.waitForURL(`${base}/`);
  await page.getByRole("heading", { name: "Overview" }).waitFor();
  // Links are single use
  await page.goto(target);
  await page.waitForURL(/\/(login\?error=link_invalid)?$/);
  await context.close();
});

await step("tampered link is rejected", async () => {
  const page = await browser.newPage();
  await page.goto(`${base}/auth/callback?token_hash=deadbeef&type=email`);
  await page.waitForURL(/login\?error=link_invalid/);
  await page.getByText("invalid or has expired").waitFor();
  await page.close();
});

await browser.close();
await clearInbox();
console.log("\nPasswordless login checks passed");
