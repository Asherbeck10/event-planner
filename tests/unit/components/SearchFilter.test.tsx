import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchFilter } from "@/components/SearchFilter";

// useRouter, usePathname, useSearchParams are mocked in tests/setup.ts
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const mockPush = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  } as ReturnType<typeof useRouter>);
  vi.mocked(usePathname).mockReturnValue("/events");
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);
});

describe("SearchFilter", () => {
  it("renders search input, category select, and location input", () => {
    render(<SearchFilter />);
    expect(screen.getByPlaceholderText("Search events...")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Filter by location...")).toBeInTheDocument();
  });

  it("renders all category options", () => {
    render(<SearchFilter />);
    expect(screen.getByRole("option", { name: "All Categories" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Tech" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Music" })).toBeInTheDocument();
  });

  it("populates search input from searchParams", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("search=react") as ReturnType<typeof useSearchParams>
    );
    render(<SearchFilter />);
    expect(screen.getByPlaceholderText("Search events...")).toHaveValue("react");
  });

  it("updates URL when search input changes", () => {
    render(<SearchFilter />);
    fireEvent.change(screen.getByPlaceholderText("Search events..."), {
      target: { value: "summit" },
    });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("search=summit"));
  });

  it("updates URL when category changes", () => {
    render(<SearchFilter />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Tech" } });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("category=Tech"));
  });

  it("removes param from URL when input is cleared", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("search=react") as ReturnType<typeof useSearchParams>
    );
    render(<SearchFilter />);
    fireEvent.change(screen.getByPlaceholderText("Search events..."), {
      target: { value: "" },
    });
    const calledUrl = mockPush.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("search=");
  });
});
