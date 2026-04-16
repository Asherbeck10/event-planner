import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/actions/events";

// ---- Module mocks ----
vi.mock("@/lib/db", () => ({ supabaseAdmin: { from: vi.fn() } }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { supabaseAdmin } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const mockSession = { user: { id: "user-1", name: "Jane", email: "jane@example.com" }, expires: "2099" };

const mockEventRow = {
  id: "event-1",
  title: "React Summit",
  description: "Tech event",
  date: "2025-06-15T10:00:00Z",
  location: "New York, NY",
  category: "Tech",
  organizer_id: "user-1",
  max_attendees: 50,
  image_url: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  organizer: { id: "user-1", name: "Jane", email: "jane@example.com" },
  rsvps: [{ count: 5 }],
};

/** Chainable Supabase query mock */
function chain(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const c: Record<string, unknown> = {};
  ["select", "insert", "update", "delete", "eq", "neq", "order", "ilike", "or", "not"].forEach(
    (m) => { c[m] = vi.fn().mockReturnValue(c); }
  );
  c.single = vi.fn().mockResolvedValue(result);
  // direct await
  (c as { then?: (...args: unknown[]) => unknown }).then = (res: (v: typeof result) => unknown) =>
    Promise.resolve(result).then(res);
  return c;
}

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

beforeEach(() => vi.clearAllMocks());

// ── getEvents ─────────────────────────────────────────────────────

describe("getEvents", () => {
  it("returns mapped events on success", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: [mockEventRow], error: null }) as ReturnType<typeof supabaseAdmin.from>
    );

    const events = await getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("React Summit");
    expect(events[0].rsvp_count).toBe(5);
  });

  it("returns empty array on DB error", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: null, error: { message: "DB error" } }) as ReturnType<typeof supabaseAdmin.from>
    );

    expect(await getEvents()).toEqual([]);
  });

  it("returns empty array when data is null", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: null, error: null }) as ReturnType<typeof supabaseAdmin.from>
    );
    expect(await getEvents()).toEqual([]);
  });

  it("applies category filter", async () => {
    const mockChain = chain({ data: [], error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      mockChain as ReturnType<typeof supabaseAdmin.from>
    );

    await getEvents({ category: "Tech" });
    expect(vi.mocked(mockChain.eq as (...args: unknown[]) => unknown)).toHaveBeenCalledWith("category", "Tech");
  });

  it("skips category filter when value is 'all'", async () => {
    const mockChain = chain({ data: [], error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      mockChain as ReturnType<typeof supabaseAdmin.from>
    );

    await getEvents({ category: "all" });
    expect(vi.mocked(mockChain.eq as (...args: unknown[]) => unknown)).not.toHaveBeenCalledWith("category", "all");
  });

  it("applies search filter via or()", async () => {
    const mockChain = chain({ data: [], error: null });
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      mockChain as ReturnType<typeof supabaseAdmin.from>
    );

    await getEvents({ search: "summit" });
    expect(vi.mocked(mockChain.or as (...args: unknown[]) => unknown)).toHaveBeenCalledWith(
      expect.stringContaining("summit")
    );
  });
});

// ── getEventById ───────────────────────────────────────────────────

describe("getEventById", () => {
  it("returns event when found", async () => {
    const eventChain = chain({ data: mockEventRow, error: null });
    const rsvpChain = chain({ data: null, error: null });

    vi.mocked(supabaseAdmin.from)
      .mockReturnValueOnce(eventChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(rsvpChain as ReturnType<typeof supabaseAdmin.from>);

    const event = await getEventById("event-1", "user-1");
    expect(event).not.toBeNull();
    expect(event?.title).toBe("React Summit");
  });

  it("returns null when event not found", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: null, error: { message: "Not found" } }) as ReturnType<typeof supabaseAdmin.from>
    );

    expect(await getEventById("missing-id")).toBeNull();
  });

  it("sets user_has_rsvp=true when user has RSVP", async () => {
    const eventChain = chain({ data: mockEventRow, error: null });
    const rsvpChain = chain({ data: { id: "rsvp-1" }, error: null });

    vi.mocked(supabaseAdmin.from)
      .mockReturnValueOnce(eventChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(rsvpChain as ReturnType<typeof supabaseAdmin.from>);

    const event = await getEventById("event-1", "user-1");
    expect(event?.user_has_rsvp).toBe(true);
  });

  it("sets user_has_rsvp=false when no RSVP", async () => {
    const eventChain = chain({ data: mockEventRow, error: null });
    const rsvpChain = chain({ data: null, error: null });

    vi.mocked(supabaseAdmin.from)
      .mockReturnValueOnce(eventChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(rsvpChain as ReturnType<typeof supabaseAdmin.from>);

    const event = await getEventById("event-1", "user-1");
    expect(event?.user_has_rsvp).toBe(false);
  });

  it("does not query rsvps when userId not provided", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: mockEventRow, error: null }) as ReturnType<typeof supabaseAdmin.from>
    );

    await getEventById("event-1");
    // Only 1 from() call (no RSVP lookup)
    expect(vi.mocked(supabaseAdmin.from)).toHaveBeenCalledTimes(1);
  });
});

// ── createEvent ────────────────────────────────────────────────────

describe("createEvent", () => {
  const validFields = {
    title: "React Summit",
    description: "Tech event",
    date: "2025-06-15T10:00",
    location: "New York, NY",
    category: "Tech",
    maxAttendees: "50",
  };

  it("returns error when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await createEvent({}, makeFormData(validFields));
    expect(result.error).toMatch(/signed in/i);
  });

  it("returns validation error for invalid input", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    const result = await createEvent({}, makeFormData({ ...validFields, title: "" }));
    expect(result.error).toBeDefined();
  });

  it("redirects to event page on success", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: { id: "new-event-1" }, error: null }) as ReturnType<typeof supabaseAdmin.from>
    );
    vi.mocked(redirect).mockImplementation((url) => { throw new Error(`NEXT_REDIRECT:${url}`); });

    await expect(createEvent({}, makeFormData(validFields))).rejects.toThrow("NEXT_REDIRECT:/events/new-event-1");
  });

  it("returns error when DB insert fails", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: null, error: { message: "DB error" } }) as ReturnType<typeof supabaseAdmin.from>
    );

    const result = await createEvent({}, makeFormData(validFields));
    expect(result.error).toMatch(/failed to create/i);
  });
});

// ── updateEvent ────────────────────────────────────────────────────

describe("updateEvent", () => {
  const validFields = {
    title: "Updated Summit",
    description: "Updated desc",
    date: "2025-07-01T10:00",
    location: "Boston, MA",
    category: "Tech",
    maxAttendees: "",
  };

  it("returns error when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await updateEvent("event-1", {}, makeFormData(validFields));
    expect(result.error).toMatch(/signed in/i);
  });

  it("returns error when user is not the owner", async () => {
    vi.mocked(auth).mockResolvedValue({
      ...mockSession,
      user: { ...mockSession.user, id: "user-2" }, // different user
    } as never);

    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: { organizer_id: "user-1" }, error: null }) as ReturnType<typeof supabaseAdmin.from>
    );

    const result = await updateEvent("event-1", {}, makeFormData(validFields));
    expect(result.error).toMatch(/not authorized/i);
  });

  it("returns error when event does not exist", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: null, error: null }) as ReturnType<typeof supabaseAdmin.from>
    );

    const result = await updateEvent("missing-event", {}, makeFormData(validFields));
    expect(result.error).toMatch(/not authorized/i);
  });

  it("redirects to event page on success", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    const ownerChain = chain({ data: { organizer_id: "user-1" }, error: null });
    const updateChain = chain({ data: {}, error: null });

    vi.mocked(supabaseAdmin.from)
      .mockReturnValueOnce(ownerChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(updateChain as ReturnType<typeof supabaseAdmin.from>);

    vi.mocked(redirect).mockImplementation((url) => { throw new Error(`NEXT_REDIRECT:${url}`); });

    await expect(updateEvent("event-1", {}, makeFormData(validFields))).rejects.toThrow(
      "NEXT_REDIRECT:/events/event-1"
    );
    expect(revalidatePath).toHaveBeenCalledWith("/events/event-1");
  });

  it("returns validation error for invalid input", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: { organizer_id: "user-1" }, error: null }) as ReturnType<typeof supabaseAdmin.from>
    );

    const result = await updateEvent("event-1", {}, makeFormData({ ...validFields, category: "INVALID" }));
    expect(result.error).toBeDefined();
  });
});

// ── deleteEvent ────────────────────────────────────────────────────

describe("deleteEvent", () => {
  it("does nothing when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    await deleteEvent("event-1");
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it("does nothing when user is not the owner", async () => {
    vi.mocked(auth).mockResolvedValue({
      ...mockSession,
      user: { ...mockSession.user, id: "user-2" },
    } as never);

    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: { organizer_id: "user-1" }, error: null }) as ReturnType<typeof supabaseAdmin.from>
    );

    await deleteEvent("event-1");
    // Only 1 from() call (the ownership check), no delete call
    expect(vi.mocked(supabaseAdmin.from)).toHaveBeenCalledTimes(1);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("deletes event and redirects to dashboard when owner", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    const ownerChain = chain({ data: { organizer_id: "user-1" }, error: null });
    const deleteChain = chain({ data: {}, error: null });

    vi.mocked(supabaseAdmin.from)
      .mockReturnValueOnce(ownerChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(deleteChain as ReturnType<typeof supabaseAdmin.from>);

    vi.mocked(redirect).mockImplementation((url) => { throw new Error(`NEXT_REDIRECT:${url}`); });

    await expect(deleteEvent("event-1")).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/events");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
