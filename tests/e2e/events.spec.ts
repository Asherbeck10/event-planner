import { test, expect, TEST_USER, TEST_USER_2, login, createEventViaUI } from "./fixtures";

// Use a timestamp so event titles are unique per run
const ts = Date.now();
const EVENT_TITLE = `E2E Event ${ts}`;
const FUTURE_DATE = "2099-12-31T10:00";

test.describe("Event listing", () => {
  test("homepage shows events list", async ({ page }) => {
    await page.goto("/");
    // The page should contain a heading or events grid
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("/events page is accessible without login", async ({ page }) => {
    await page.goto("/events");
    await expect(page).toHaveURL("/events");
    await expect(page.getByPlaceholder("Search events...")).toBeVisible();
  });
});

test.describe("Event CRUD", () => {

  test("authenticated user can create an event", async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
    await createEventViaUI(page, {
      title: EVENT_TITLE,
      date: FUTURE_DATE,
      location: "Test City, TC",
      category: "Tech",
      description: "An E2E test event",
      maxAttendees: "20",
    });

    // Redirected to event detail page
    await expect(page.getByRole("heading", { name: EVENT_TITLE })).toBeVisible();
    await expect(page.getByText("Test City, TC")).toBeVisible();
  });

  test("event detail page shows RSVP button", async ({ page }) => {
    // Create as user 2 — user 1 (non-organizer) must see the RSVP button.
    // The organizer never sees the RSVP button on their own event.
    await login(page, TEST_USER_2.email, TEST_USER_2.password);
    await createEventViaUI(page, {
      title: `RSVP Visible ${ts}`,
      date: FUTURE_DATE,
      location: "Somewhere",
      category: "Music",
    });
    const eventUrl = page.url().split("?")[0];

    // Switch to user 1
    await page.context().clearCookies();
    await login(page, TEST_USER.email, TEST_USER.password);
    await page.goto(eventUrl);

    await expect(page.getByRole("button", { name: /rsvp to event/i })).toBeVisible();
  });

  test("owner can edit their event", async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);

    await createEventViaUI(page, {
      title: `Editable Event ${ts}`,
      date: FUTURE_DATE,
      location: "Original City",
      category: "Art",
    });

    // Click edit link (only visible to owner)
    await page.getByRole("link", { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/edit/);

    await page.fill('input[name="title"]', `Edited Event ${ts}`);
    await page.fill('input[name="location"]', "Edited City");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/events\/[a-z0-9-]+/, { timeout: 15_000 });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: `Edited Event ${ts}` })).toBeVisible();
    await expect(page.getByText("Edited City")).toBeVisible();
  });

  test("owner can delete their event", async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);

    await createEventViaUI(page, {
      title: `Deletable Event ${ts}`,
      date: FUTURE_DATE,
      location: "Delete City",
      category: "Food",
    });

    // Click the delete button (form submit)
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /delete/i }).click();

    // Should redirect to dashboard after delete
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test("non-owner cannot edit someone else's event", async ({ page }) => {
    // Create event as user 1
    await login(page, TEST_USER.email, TEST_USER.password);
    await createEventViaUI(page, {
      title: `Protected Event ${ts}`,
      date: FUTURE_DATE,
      location: "Lock City",
      category: "Networking",
    });
    const eventUrl = page.url().split("?")[0];

    // Log out and log in as user 2 — cookie clearing is reliable with NextAuth v5
    await page.context().clearCookies();
    await login(page, TEST_USER_2.email, TEST_USER_2.password);
    await page.goto(eventUrl);

    // Edit link should NOT be visible
    await expect(page.getByRole("link", { name: /edit/i })).not.toBeVisible();
  });

  test("search filters events by title", async ({ page }) => {
    await page.goto("/events");
    await page.fill('input[placeholder="Search events..."]', EVENT_TITLE);
    // Results should contain our event (or be empty if not yet created)
    await page.waitForTimeout(500); // allow URL update
    const url = new URL(page.url());
    expect(url.searchParams.get("search")).toBe(EVENT_TITLE);
  });

  test("category filter updates URL", async ({ page }) => {
    await page.goto("/events");
    await page.selectOption('select', "Tech");
    await page.waitForTimeout(300);
    const url = new URL(page.url());
    expect(url.searchParams.get("category")).toBe("Tech");
  });
});

test.describe("Event form validation", () => {
  test("shows error when creating event with empty title", async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
    await page.goto("/events/new");
    // Fill required fields but leave title empty, then bypass the browser's
    // `required` attribute so the form submits and Zod validation runs server-side.
    await page.fill('input[name="date"]', FUTURE_DATE);
    await page.fill('input[name="location"]', "Somewhere");
    await page.selectOption('select[name="category"]', "Tech");
    await page.evaluate(() => {
      const el = document.querySelector<HTMLInputElement>('input[name="title"]');
      if (el) el.removeAttribute("required");
    });
    await page.click('button[type="submit"]');
    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("404 handling", () => {
  test("shows 404 page for unknown event", async ({ page }) => {
    const response = await page.goto("/events/non-existent-id-xyz");
    // Either a 404 status or the custom not-found UI
    const is404 = response?.status() === 404;
    const hasNotFound = await page.getByText(/not found/i).isVisible();
    expect(is404 || hasNotFound).toBeTruthy();
  });
});
