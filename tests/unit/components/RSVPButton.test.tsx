import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RSVPButton } from "@/components/RSVPButton";

// toggleRSVP is a server action — mock the actions module
vi.mock("@/actions/rsvps", () => ({
  toggleRSVP: vi.fn().mockResolvedValue({}),
}));

import { toggleRSVP } from "@/actions/rsvps";
import { useRouter } from "next/navigation";

// useRouter is already mocked in tests/setup.ts via next/navigation mock
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
});

describe("RSVPButton", () => {
  it("shows 'RSVP to Event' when logged in and no RSVP", () => {
    render(<RSVPButton eventId="e1" hasRsvp={false} isFull={false} isLoggedIn={true} />);
    expect(screen.getByRole("button")).toHaveTextContent("RSVP to Event");
  });

  it("shows 'Sign In to RSVP' when not logged in", () => {
    render(<RSVPButton eventId="e1" hasRsvp={false} isFull={false} isLoggedIn={false} />);
    expect(screen.getByRole("button")).toHaveTextContent("Sign In to RSVP");
  });

  it("shows 'Cancel RSVP' when user has RSVP'd", () => {
    render(<RSVPButton eventId="e1" hasRsvp={true} isFull={false} isLoggedIn={true} />);
    expect(screen.getByRole("button")).toHaveTextContent("Cancel RSVP");
  });

  it("shows disabled 'Event Full' when full and no RSVP", () => {
    render(<RSVPButton eventId="e1" hasRsvp={false} isFull={true} isLoggedIn={true} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveTextContent("Event Full");
    expect(btn).toBeDisabled();
  });

  it("still shows cancel button when user has RSVP even if full", () => {
    render(<RSVPButton eventId="e1" hasRsvp={true} isFull={true} isLoggedIn={true} />);
    expect(screen.getByRole("button")).toHaveTextContent("Cancel RSVP");
  });

  it("redirects to login with callbackUrl when not logged in", () => {
    render(<RSVPButton eventId="e42" hasRsvp={false} isFull={false} isLoggedIn={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith("/auth/login?callbackUrl=/events/e42");
  });

  it("calls toggleRSVP when logged in and clicked", async () => {
    render(<RSVPButton eventId="e1" hasRsvp={false} isFull={false} isLoggedIn={true} />);
    fireEvent.click(screen.getByRole("button"));
    // Allow the transition to flush
    await vi.waitFor(() => {
      expect(toggleRSVP).toHaveBeenCalledWith("e1");
    });
  });
});
