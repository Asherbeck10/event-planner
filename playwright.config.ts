import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * E2E tests require a running Next.js server and a Supabase database.
 * Set TEST_BASE_URL to override the default localhost URL.
 * For CI: set TEST_BASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * SUPABASE_SERVICE_ROLE_KEY, NEXTAUTH_SECRET, and NEXTAUTH_URL.
 */
const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

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
