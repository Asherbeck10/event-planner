/**
 * Global E2E teardown — removes all test data created during the run.
 */
import { createClient } from "@supabase/supabase-js";
import { TEST_USER, TEST_USER_2 } from "./global-setup";

async function globalTeardown() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return;

  const admin = createClient(url, key);

  // Fetch user IDs so we can delete cascading data
  const { data: users } = await admin
    .from("users")
    .select("id")
    .in("email", [TEST_USER.email, TEST_USER_2.email]);

  if (users?.length) {
    const ids = users.map((u: { id: string }) => u.id);
    await admin.from("rsvps").delete().in("user_id", ids);
    await admin.from("events").delete().in("organizer_id", ids);
    await admin.from("users").delete().in("id", ids);
  }

  console.log("[E2E] DB cleaned up.");
}

export default globalTeardown;
