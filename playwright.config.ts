import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { config } from "dotenv";

// Load .env.local so global-setup/teardown and the webServer can read
// NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.
// (Playwright runs outside Next.js and does not load .env.local automatically.)
config({ path: path.resolve(__dirname, ".env.local") });
const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

/**
 * For CI: set TEST_BASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * SUPABASE_SERVICE_ROLE_KEY, AUTH_SECRET, and AUTH_URL as environment secrets
 * instead of relying on .env.local.
 */

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/e2e/.results",
  fullyParallel: false, // Tests share DB state — run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start the Next.js dev server automatically when running locally
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          NODE_ENV: "test",
        },
      },

  globalSetup: path.resolve(__dirname, "tests/e2e/global-setup.ts"),
  globalTeardown: path.resolve(__dirname, "tests/e2e/global-teardown.ts"),
});
