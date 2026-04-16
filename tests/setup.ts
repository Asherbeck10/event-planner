import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock next/navigation globally — useRouter/usePathname/useSearchParams must be vi.fn()
// so individual tests can call .mockReturnValue() on them.
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// Mock next/cache globally
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock next-auth at the package level so Vitest never tries to resolve next/server
vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  AuthError: class AuthError extends Error {},
}));

// Mock next-auth/react globally
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
  signIn: vi.fn(),
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
