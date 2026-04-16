import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventCard } from "@/components/EventCard";
import type { EventWithMeta } from "@/lib/db";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const baseEvent: EventWithMeta = {
  id: "event-1",
  title: "React Summit 2025",
  description: "A great tech conference",
  date: "2025-06-15T10:00:00Z",
  location: "New York, NY",
  category: "Tech",
  organizer_id: "user-1",
  organizer: { id: "user-1", name: "Jane Doe", email: "jane@example.com" },
  max_attendees: 50,
  rsvp_count: 12,
  user_has_rsvp: false,
  image_url: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("EventCard", () => {
  it("renders event title and category", () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText("React Summit 2025")).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
  });

  it("renders event location and date", () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText("New York, NY")).toBeInTheDocument();
    expect(screen.getByText(/Jun 15, 2025/i)).toBeInTheDocument();
  });

  it("renders attendee count with max", () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText("12 / 50 attending")).toBeInTheDocument();
  });

  it("renders attendee count without max when unlimited", () => {
    render(<EventCard event={{ ...baseEvent, max_attendees: null }} />);
    expect(screen.getByText("12 attending")).toBeInTheDocument();
  });

  it("shows 'Full' badge when at capacity", () => {
    render(<EventCard event={{ ...baseEvent, rsvp_count: 50, max_attendees: 50 }} />);
    expect(screen.getByText("Full")).toBeInTheDocument();
  });

  it("does not show 'Full' badge when not at capacity", () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.queryByText("Full")).not.toBeInTheDocument();
  });

  it("renders description when present", () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText("A great tech conference")).toBeInTheDocument();
  });

  it("does not render description when absent", () => {
    render(<EventCard event={{ ...baseEvent, description: null }} />);
    expect(screen.queryByText("A great tech conference")).not.toBeInTheDocument();
  });

  it("renders organizer name", () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText("By Jane Doe")).toBeInTheDocument();
  });

  it("falls back to 'Unknown' organizer when organizer is null", () => {
    render(<EventCard event={{ ...baseEvent, organizer: null as never }} />);
    expect(screen.getByText("By Unknown")).toBeInTheDocument();
  });

  it("links to the event detail page", () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/events/event-1");
  });
});
