// Creates the single nhOS owner account with the Supabase Admin API.
// Usage: pnpm owner:create   (reads .env.local)
//
// The owner email is fixed in src/config/owner.ts. The account has NO
// password: nhOS signs in only through an emailed verification link.
// Public sign-up is disabled and the database refuses any other account.
import { createClient } from "@supabase/supabase-js";
import { OWNER_EMAIL } from "../src/config/owner.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data, error } = await admin.auth.admin.createUser({ email: OWNER_EMAIL, email_confirm: true });

if (error) {
  console.error(`Could not create owner: ${error.message}`);
  process.exit(1);
}

console.log(`Owner account created: ${data.user.email} (${data.user.id})`);
console.log("Sign in at /login with this email and open the verification link.");
