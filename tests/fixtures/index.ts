import type { DbUser, DbEvent, EventWithMeta } from "@/lib/db";

export const testUser: DbUser = {
  id: "user-1",
  name: "Jane Doe",
  email: "jane@example.com",
  password: "$2b$12$hashedpassword",
  created_at: "2025-01-01T00:00:00Z",
};

export const testUser2: DbUser = {
  id: "user-2",
  name: "Bob Smith",
  email: "bob@example.com",
  password: "$2b$12$hashedpassword2",
  created_at: "2025-01-02T00:00:00Z",
};

export const testEvent: DbEvent = {
  id: "event-1",
  title: "React Summit 2025",
  description: "A great tech event",
  date: "2025-06-15T10:00:00Z",
  location: "New York, NY",
  category: "Tech",
  organizer_id: "user-1",
  max_attendees: 50,
  image_url: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

export const testEventWithMeta: EventWithMeta = {
  ...testEvent,
  organizer: { id: "user-1", name: "Jane Doe", email: "jane@example.com" },
  rsvp_count: 5,
  user_has_rsvp: false,
};

export const mockSession = {
  user: { id: "user-1", name: "Jane Doe", email: "jane@example.com" },
  expires: "2099-01-01",
};

/** Creates a chainable Supabase query mock that resolves with the given result. */
export function createSupabaseMock(result: {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select", "insert", "update", "delete", "eq", "neq", "or",
    "ilike", "order", "not", "in", "is",
  ];

  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });

  // .single() resolves
  chain.single = vi.fn().mockResolvedValue(result);
  // direct await on chain
  (chain as unknown as Promise<typeof result>).then = (resolve: (v: typeof result) => unknown) =>
    Promise.resolve(result).then(resolve);

  return { from: vi.fn().mockReturnValue(chain), _chain: chain };
}
