/**
 * Shared Playwright fixtures and helpers for E2E tests.
 */
import { test as base, expect, type Page } from "@playwright/test";
import { TEST_USER, TEST_USER_2 } from "./global-setup";

export { expect };
export { TEST_USER, TEST_USER_2 };

// ── helpers ────────────────────────────────────────────────────────

export async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 10_000 });
}

export async function logout(page: Page) {
  // The navbar has a sign-out button/form when authenticated
  const signOutBtn = page.getByRole("button", { name: /sign out/i });
  if (await signOutBtn.isVisible()) {
    await signOutBtn.click();
    await page.waitForURL("/");
  }
}

export async function createEventViaUI(
  page: Page,
  fields: {
    title: string;
    date: string;
    location: string;
    category?: string;
    description?: string;
    maxAttendees?: string;
  }
) {
  await page.goto("/events/new");
  await page.fill('input[name="title"]', fields.title);
  if (fields.description) {
    await page.fill('textarea[name="description"]', fields.description);
  }
  await page.fill('input[name="date"]', fields.date);
  await page.fill('input[name="location"]', fields.location);
  if (fields.category) {
    await page.selectOption('select[name="category"]', fields.category);
  }
  if (fields.maxAttendees) {
    await page.fill('input[name="maxAttendees"]', fields.maxAttendees);
  }
  await page.click('button[type="submit"]');
  // Wait for redirect to the new event's detail page
  await page.waitForURL(/\/events\/[^/]+$/, { timeout: 10_000 });
}

// ── custom fixture: authenticated page ───────────────────────────

type Fixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  // Playwright's `use` callback is not a React hook — disable the false-positive
  /* eslint-disable react-hooks/rules-of-hooks */
  authenticatedPage: async ({ page }, use) => {
    await login(page, TEST_USER.email, TEST_USER.password);
    await use(page);
  },
  /* eslint-enable react-hooks/rules-of-hooks */
});
