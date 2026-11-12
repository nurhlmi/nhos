// Verifies Row Level Security on a LOCAL Supabase instance:
// the owner can CRUD their rows, an anonymous client sees nothing and
// cannot write. Creates and removes its own test rows.
// Usage: node --env-file=.env.local scripts/rls-check.mjs
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import { ownerSession } from "./lib/dev-session.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url ?? "")) {
  console.error("rls-check.mjs only runs against a local Supabase instance.");
  process.exit(1);
}

const anon = createClient(url, key, { auth: { persistSession: false } });
const { client: owner, user } = await ownerSession();
const uid = user.id;

const tables = [
  "profiles", "dashboard_preferences", "currency_watchlists", "assets",
  "cve_bookmarks", "cve_notes", "news_bookmarks", "cv_profiles", "cv_experiences", "cv_educations",
  "cv_skills", "cv_projects", "cv_certifications",
];

let passed = 0;
const check = async (name, fn) => {
  await fn();
  passed++;
  console.log(`ok  ${name}`);
};

for (const t of tables) {
  await check(`anon cannot read ${t}`, async () => {
    const { data, error } = await anon.from(t).select("*").limit(5);
    assert.ok(error || data.length === 0);
  });
}

let assetId;
await check("owner inserts asset (user_id defaults to auth.uid())", async () => {
  const { data, error } = await owner
    .from("assets")
    .insert({ name: "RLS test", purchase_date: "2024-01-01", purchase_price: 1000 })
    .select("*")
    .single();
  assert.ifError(error);
  assert.equal(data.user_id, uid);
  assetId = data.id;
});

await check("owner cannot spoof user_id", async () => {
  const { error } = await owner.from("assets").insert({
    user_id: "00000000-0000-0000-0000-000000000000",
    name: "spoof", purchase_date: "2024-01-01", purchase_price: 1,
  });
  assert.ok(error);
});

await check("anon cannot insert asset", async () => {
  const { error } = await anon.from("assets").insert({ name: "x", purchase_date: "2024-01-01", purchase_price: 1 });
  assert.ok(error);
});

await check("anon cannot delete owner asset", async () => {
  await anon.from("assets").delete().eq("id", assetId);
  const { data } = await owner.from("assets").select("id").eq("id", assetId);
  assert.equal(data.length, 1);
});

await check("non-positive purchase price rejected by constraint", async () => {
  const { error } = await owner.from("assets").update({ purchase_price: -1 }).eq("id", assetId);
  assert.ok(error);
});

await check("owner deletes own asset", async () => {
  const { error } = await owner.from("assets").delete().eq("id", assetId);
  assert.ifError(error);
  const { data } = await owner.from("assets").select("id").eq("id", assetId);
  assert.equal(data.length, 0);
});

await check("owner storage upload restricted to own folder", async () => {
  const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
  const bad = await owner.storage.from("asset-images").upload(`someone-else/test.png`, blob, { contentType: "image/png" });
  assert.ok(bad.error);
  const good = await owner.storage.from("asset-images").upload(`${uid}/rls-test.png`, blob, { contentType: "image/png", upsert: true });
  assert.ifError(good.error);
  await owner.storage.from("asset-images").remove([`${uid}/rls-test.png`]);
});

console.log(`\n${passed} checks passed`);
