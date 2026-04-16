/**
 * Global E2E setup — seeds a known test user into the Supabase DB.
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * If the vars are absent (e.g. pure unit-test run) this is a no-op.
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export const TEST_USER = {
  email: "e2e-test@example.com",
  password: "TestPassword123!",
  name: "E2E Test User",
};

export const TEST_USER_2 = {
  email: "e2e-other@example.com",
  password: "OtherPassword456!",
  name: "E2E Other User",
};

async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn("[E2E] Supabase env vars not set — skipping DB seed.");
    return;
  }

  const admin = createClient(url, key);

  // Clean up any leftovers from a previous run
  await admin.from("rsvps").delete().like("user_id", "e2e-%");
  await admin.from("events").delete().like("organizer_id", "e2e-%");
  await admin.from("users").delete().eq("email", TEST_USER.email);
  await admin.from("users").delete().eq("email", TEST_USER_2.email);

  const hash1 = await bcrypt.hash(TEST_USER.password, 10);
  const hash2 = await bcrypt.hash(TEST_USER_2.password, 10);

  const { error: e1 } = await admin
    .from("users")
    .insert({ name: TEST_USER.name, email: TEST_USER.email, password: hash1 });

  const { error: e2 } = await admin
    .from("users")
    .insert({ name: TEST_USER_2.name, email: TEST_USER_2.email, password: hash2 });

  if (e1 || e2) {
    throw new Error(`[E2E] Seed failed: ${e1?.message ?? e2?.message}`);
  }

  console.log("[E2E] DB seeded.");
}

export default globalSetup;
