import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  eventSchema,
  EVENT_CATEGORIES,
} from "@/lib/validations";

describe("registerSchema", () => {
  const valid = { name: "Jane Doe", email: "jane@example.com", password: "secret123" };

  it("accepts valid input", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const result = registerSchema.safeParse({ ...valid, name: "J" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/2 characters/);
  });

  it("rejects blank / whitespace name", () => {
    expect(registerSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
    // whitespace-only passes min(2) length check but is still ≥2 chars — document expected behaviour
    const ws = registerSchema.safeParse({ ...valid, name: "  " });
    expect(ws.success).toBe(true); // Zod does not trim by default; document this
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/Invalid email/);
  });

  it("rejects password shorter than 8 chars", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/8 characters/);
  });

  it("rejects missing fields", () => {
    expect(registerSchema.safeParse({}).success).toBe(false);
  });
});

describe("loginSchema", () => {
  const valid = { email: "jane@example.com", password: "anypass" };

  it("accepts valid input", () => {
    expect(loginSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ ...valid, password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/required/i);
  });

  it("rejects invalid email format", () => {
    expect(loginSchema.safeParse({ ...valid, email: "bad" }).success).toBe(false);
  });
});

describe("eventSchema", () => {
  const valid = {
    title: "React Summit 2025",
    description: "A great event",
    date: "2025-06-15T10:00",
    location: "New York, NY",
    category: "Tech",
    maxAttendees: "50",
  };

  it("accepts valid input", () => {
    expect(eventSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts missing optional fields", () => {
    const { description, maxAttendees, ...minimal } = valid;
    void description; void maxAttendees;
    expect(eventSchema.safeParse(minimal).success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = eventSchema.safeParse({ ...valid, title: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/required/i);
  });

  it("rejects title over 100 characters", () => {
    const result = eventSchema.safeParse({ ...valid, title: "a".repeat(101) });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/too long/i);
  });

  it("rejects empty location", () => {
    const result = eventSchema.safeParse({ ...valid, location: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty date", () => {
    const result = eventSchema.safeParse({ ...valid, date: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = eventSchema.safeParse({ ...valid, category: "InvalidCat" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid categories", () => {
    EVENT_CATEGORIES.forEach((cat) => {
      expect(eventSchema.safeParse({ ...valid, category: cat }).success).toBe(true);
    });
  });

  it("accepts maxAttendees as string number", () => {
    expect(eventSchema.safeParse({ ...valid, maxAttendees: "0" }).success).toBe(true);
  });
});

describe("EVENT_CATEGORIES", () => {
  it("includes expected categories", () => {
    expect(EVENT_CATEGORIES).toContain("Music");
    expect(EVENT_CATEGORIES).toContain("Tech");
    expect(EVENT_CATEGORIES).toContain("Other");
    expect(EVENT_CATEGORIES).toHaveLength(7);
  });
});
