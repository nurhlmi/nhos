// Authenticated smoke test against a running dev server (local Supabase only).
// Signs in as the owner (admin-generated magic link, local only), builds the @supabase/ssr session
// cookie and requests each route. Prints status codes only, never secrets.
// Usage: node --env-file=.env.local scripts/smoke.mjs [path ...]
import { ownerSession } from "./lib/dev-session.mjs";

const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const data = await ownerSession();

const ref = new URL(url).hostname.split(".")[0];
const name = `sb-${ref}-auth-token`;
const value = "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64url");
const CHUNK = 3180;
const cookies = [];
if (value.length <= CHUNK) cookies.push(`${name}=${value}`);
else for (let i = 0, n = 0; i < value.length; i += CHUNK, n++) cookies.push(`${name}.${n}=${value.slice(i, i + CHUNK)}`);
const cookie = cookies.join("; ");

const dumpDir = process.env.SMOKE_DUMP_DIR;
const paths = process.argv.slice(2);
let failed = 0;
for (const path of paths) {
  const started = Date.now();
  const res = await fetch(base + path, { headers: { cookie }, redirect: "manual" });
  const body = await res.text();
  const ms = Date.now() - started;
  if (dumpDir) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(`${dumpDir}/${path.replace(/[^a-z0-9]+/gi, "_")}.out`, body);
  }
  const ok = res.status < 400;
  if (!ok) failed++;
  let summary = "";
  if ((res.headers.get("content-type") ?? "").includes("json")) {
    try {
      const json = JSON.parse(body);
      summary = json.error ? `error=${json.error}` : JSON.stringify(json).slice(0, 220);
    } catch {}
  } else if (res.status >= 300 && res.status < 400) {
    summary = `-> ${res.headers.get("location")}`;
  } else {
    const errMatch = body.match(/<title>([^<]*)<\/title>/);
    summary = errMatch ? `title="${errMatch[1]}"` : "";
  }
  console.log(`${res.status} ${String(ms).padStart(5)}ms ${path} ${summary}`);
}
process.exit(failed ? 1 : 0);
