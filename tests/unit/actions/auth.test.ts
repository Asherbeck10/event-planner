import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerUser, loginUser } from "@/actions/auth";
import { AuthError } from "next-auth";

// ---- Module mocks ----
vi.mock("@/lib/db", () => ({ supabaseAdmin: { from: vi.fn() } }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn(), compare: vi.fn() } }));

import { supabaseAdmin } from "@/lib/db";
import { signIn } from "@/lib/auth";
import bcrypt from "bcryptjs";

/** Returns a minimal chainable Supabase query mock. */
function chain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  ["select", "insert", "update", "delete", "eq", "neq", "order", "ilike", "or"].forEach(
    (m) => { c[m] = vi.fn().mockReturnValue(c); }
  );
  c.single = vi.fn().mockResolvedValue(result);
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

// ── registerUser ────────────────────────────────────────────────

describe("registerUser", () => {
  const validFields = {
    name: "Jane Doe",
    email: "jane@example.com",
    password: "secret123",
  };

  it("returns validation error for invalid input", async () => {
    const fd = makeFormData({ name: "J", email: "bad", password: "short" });
    const result = await registerUser({}, fd);
    expect(result.error).toBeDefined();
  });

  it("returns error when email already exists", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue(
      chain({ data: { id: "existing-id" }, error: null }) as ReturnType<typeof supabaseAdmin.from>
    );

    const fd = makeFormData(validFields);
    const result = await registerUser({}, fd);
    expect(result.error).toMatch(/already exists/i);
  });

  it("returns error when insert fails", async () => {
    const existingChain = chain({ data: null, error: null });
    const insertChain = chain({ data: null, error: { message: "DB error" } });

    vi.mocked(supabaseAdmin.from)
      .mockReturnValueOnce(existingChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(insertChain as ReturnType<typeof supabaseAdmin.from>);

    vi.mocked(bcrypt.hash).mockResolvedValue("hashedpass" as never);

    const fd = makeFormData(validFields);
    const result = await registerUser({}, fd);
    expect(result.error).toMatch(/failed to create/i);
  });

  it("signs in after successful registration", async () => {
    const existingChain = chain({ data: null, error: null });
    const insertChain = chain({ data: {}, error: null });

    vi.mocked(supabaseAdmin.from)
      .mockReturnValueOnce(existingChain as ReturnType<typeof supabaseAdmin.from>)
      .mockReturnValueOnce(insertChain as ReturnType<typeof supabaseAdmin.from>);

    vi.mocked(bcrypt.hash).mockResolvedValue("hashedpass" as never);
    // signIn throws NEXT_REDIRECT on success
    vi.mocked(signIn).mockRejectedValue(new Error("NEXT_REDIRECT:/dashboard"));

    const fd = makeFormData(validFields);
    await expect(registerUser({}, fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({
      email: validFields.email,
      password: validFields.password,
    }));
  });
});

// ── loginUser ────────────────────────────────────────────────────

describe("loginUser", () => {
  it("throws on successful redirect (NEXT_REDIRECT)", async () => {
    vi.mocked(signIn).mockRejectedValue(new Error("NEXT_REDIRECT:/dashboard"));

    const fd = makeFormData({ email: "jane@example.com", password: "secret123" });
    await expect(loginUser({}, fd)).rejects.toThrow("NEXT_REDIRECT");
  });

  it("returns error for invalid credentials (AuthError)", async () => {
    vi.mocked(signIn).mockRejectedValue(new AuthError("invalid credentials"));

    const fd = makeFormData({ email: "jane@example.com", password: "wrongpass" });
    const result = await loginUser({}, fd);
    expect(result.error).toMatch(/invalid email or password/i);
  });

  it("respects callbackUrl in formData", async () => {
    vi.mocked(signIn).mockRejectedValue(new Error("NEXT_REDIRECT:/events/123"));

    const fd = makeFormData({
      email: "jane@example.com",
      password: "secret123",
      callbackUrl: "/events/123",
    });
    await expect(loginUser({}, fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({
      redirectTo: "/events/123",
    }));
  });

  it("falls back to /dashboard when no callbackUrl", async () => {
    vi.mocked(signIn).mockRejectedValue(new Error("NEXT_REDIRECT:/dashboard"));

    const fd = makeFormData({ email: "jane@example.com", password: "secret123" });
    await expect(loginUser({}, fd)).rejects.toThrow();
    expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({
      redirectTo: "/dashboard",
    }));
  });
});
