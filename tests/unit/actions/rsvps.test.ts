import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleRSVP, getUserRsvpEvents } from "@/actions/rsvps";

// ---- Module mocks ----
vi.mock("@/lib/db", () => ({ supabaseAdmin: { from: vi.fn() } }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { supabaseAdmin } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const mockSession = { user: { id: "user-1", name: "Jane", email: "jane@example.com" }, expires: "2099" };

/** Chainable Supabase query mock */
function chain(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const c: Record<string, unknown> = {};
  ["select", "insert", "update", "delete", "eq", "neq", "order", "ilike", "or", "not"].forEach(
    (m) => { c[m] = vi.fn().mockReturnValue(c); }
  );
  c.single = vi.fn().mockResolvedValue(result);
  (c as { then?: (...args: unknown[]) => unknown }).then = (res: (v: typeof result) => unknown) =>
    Promise.resolve(result).then(res);
  return c;
}

beforeEach(() => vi.clearAllMocks());

// ── toggleRSVP ─────────────────────────────────────────────────────

describe("toggleRSVP", () => {
  it("returns error when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await toggleRSVP("event-1");
    expect(result.error).toMatch(/signed in/i);
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it("removes RSVP when one already exists", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    // Check existing → found
    const existingChain = chain({ data: { id: "rsvp-1" }, error: null });
    // Delete chain
    const deleteChain = chain({ data: {}, error: null });

    vi.mocked(supabaseAdmin.from)
      .mockReturnValueOnce(existingChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(deleteChain as ReturnType<typeof supabaseAdmin.from>);

    const result = await toggleRSVP("event-1");
    expect(result.error).toBeUndefined();
    expect(revalidatePath).toHaveBeenCalledWith("/events/event-1");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("creates RSVP when none exists and there is capacity", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    // Check existing → not found
    const existingChain = chain({ data: null, error: null });
    // Event max_attendees check
    const eventChain = chain({ data: { max_attendees: 50 }, error: null });
    // RSVP count check
    const countChain = chain({ data: null, error: null, count: 5 });
    // Insert
    const insertChain = chain({ data: {}, error: null });

    vi.mocked(supabaseAdmin.from)
      .mockReturnValueOnce(existingChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(eventChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(countChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(insertChain as ReturnType<typeof supabaseAdmin.from>);

    const result = await toggleRSVP("event-1");
    expect(result.error).toBeUndefined();
  });

  it("returns error when event is full", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    // Check existing → not found
    const existingChain = chain({ data: null, error: null });
    // Event has max 10 attendees
    const eventChain = chain({ data: { max_attendees: 10 }, error: null });
    // Count already at max
    const countChain = chain({ data: null, error: null, count: 10 });

    vi.mocked(supabaseAdmin.from)
      .mockReturnValueOnce(existingChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(eventChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(countChain as ReturnType<typeof supabaseAdmin.from>);

    const result = await toggleRSVP("event-1");
    expect(result.error).toMatch(/full/i);
  });

  it("returns error when at exactly the last seat (count === max_attendees)", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    const existingChain = chain({ data: null, error: null });
    const eventChain = chain({ data: { max_attendees: 1 }, error: null });
    const countChain = chain({ data: null, error: null, count: 1 });

    vi.mocked(supabaseAdmin.from)
      .mockReturnValueOnce(existingChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(eventChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(countChain as ReturnType<typeof supabaseAdmin.from>);

    const result = await toggleRSVP("event-1");
    expect(result.error).toMatch(/full/i);
  });

  it("allows RSVP when event has no max_attendees limit", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    const existingChain = chain({ data: null, error: null });
    const eventChain = chain({ data: { max_attendees: null }, error: null });
    const insertChain = chain({ data: {}, error: null });

    vi.mocked(supabaseAdmin.from)
      .mockReturnValueOnce(existingChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(eventChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(insertChain as ReturnType<typeof supabaseAdmin.from>);

    const result = await toggleRSVP("event-1");
    expect(result.error).toBeUndefined();
  });
});

// ── getUserRsvpEvents ──────────────────────────────────────────────

describe("getUserRsvpEvents", () => {
  it("returns events with user_has_rsvp=true", async () => {
    const rsvpEventRow = {
      event: {
        id: "event-1",
        title: "Tech Meetup",
        description: "Fun",
        date: "2025-05-10T18:00:00Z",
        location: "NYC",
        category: "Tech",
        organizer_id: "user-2",
        max_attendees: null,
        image_url: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        organizer: { id: "user-2", name: "Bob", email: "bob@example.com" },
        rsvps: [{ count: 3 }],
      },
    };

    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: [rsvpEventRow], error: null }) as ReturnType<typeof supabaseAdmin.from>
    );

    const events = await getUserRsvpEvents("user-1");
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Tech Meetup");
    expect(events[0].user_has_rsvp).toBe(true);
    expect(events[0].rsvp_count).toBe(3);
  });

  it("returns empty array on DB error", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: null, error: { message: "DB error" } }) as ReturnType<typeof supabaseAdmin.from>
    );

    expect(await getUserRsvpEvents("user-1")).toEqual([]);
  });

  it("filters out null events from the result", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: [{ event: null }, { event: null }], error: null }) as ReturnType<typeof supabaseAdmin.from>
    );

    expect(await getUserRsvpEvents("user-1")).toEqual([]);
  });
});
