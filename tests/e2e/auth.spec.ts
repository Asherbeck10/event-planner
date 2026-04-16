import { test, expect, TEST_USER, TEST_USER_2, login, logout } from "./fixtures";

test.describe("Authentication", () => {
  test("user can register a new account", async ({ page }) => {
    const uniqueEmail = `test-register-${Date.now()}@example.com`;

    await page.goto("/auth/register");
    await page.fill('input[name="name"]', "New Test User");
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // Should land on dashboard after successful registration
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test("user can log in with valid credentials", async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', "wrong-password");
    await page.click('button[type="submit"]');

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("user can log out", async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
    await logout(page);
    await expect(page).toHaveURL("/");
  });

  test("redirects to callbackUrl after login", async ({ page }) => {
    await page.goto("/auth/login?callbackUrl=/events");
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/events/, { timeout: 10_000 });
  });

  test("unauthenticated user is redirected from protected routes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5_000 });
  });

  test("unauthenticated user is redirected from create event page", async ({ page }) => {
    await page.goto("/events/new");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5_000 });
  });

  test("shows validation error for short password on register", async ({ page }) => {
    await page.goto("/auth/register");
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', "valid@example.com");
    await page.fill('input[name="password"]', "short");
    await page.click('button[type="submit"]');
    await expect(page.getByText(/8 characters/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Registration with existing email", () => {
  test("shows error when registering with an email already in use", async ({ page }) => {
    await page.goto("/auth/register");
    await page.fill('input[name="name"]', "Duplicate User");
    await page.fill('input[name="email"]', TEST_USER.email); // already seeded
    await page.fill('input[name="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("User 2 auth", () => {
  test("second test user can also log in", async ({ page }) => {
    await login(page, TEST_USER_2.email, TEST_USER_2.password);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
