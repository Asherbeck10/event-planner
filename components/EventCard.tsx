import Link from "next/link";
import type { EventWithMeta } from "@/lib/db";

const CATEGORY_COLORS: Record<string, string> = {
  Music: "bg-purple-900/50 text-purple-300 border-purple-700",
  Sports: "bg-green-900/50 text-green-300 border-green-700",
  Tech: "bg-blue-900/50 text-blue-300 border-blue-700",
  Food: "bg-orange-900/50 text-orange-300 border-orange-700",
  Art: "bg-pink-900/50 text-pink-300 border-pink-700",
  Networking: "bg-cyan-900/50 text-cyan-300 border-cyan-700",
  Other: "bg-slate-700/50 text-slate-300 border-slate-600",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EventCard({ event }: { event: EventWithMeta }) {
  const categoryColor = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.Other;
  const isFull =
    event.max_attendees !== null && event.rsvp_count >= event.max_attendees;

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <div className="card h-full flex flex-col p-5 gap-3 hover:border-primary/50 transition-colors">
        {/* Category badge */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${categoryColor}`}>
            {event.category}
          </span>
          {isFull && (
            <span className="text-xs text-red-400 border border-red-700 rounded-full px-2.5 py-1">
              Full
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {event.title}
        </h3>

        {/* Description */}
        {event.description && (
          <p className="text-muted text-sm line-clamp-2 flex-1">{event.description}</p>
        )}

        {/* Meta */}
        <div className="space-y-1.5 mt-auto">
          <div className="flex items-center gap-1.5 text-muted text-sm">
            <span>📅</span>
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted text-sm">
            <span>📍</span>
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted text-sm">
            <span>👥</span>
            <span>
              {event.rsvp_count}
              {event.max_attendees ? ` / ${event.max_attendees}` : ""} attending
            </span>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-3">
          <p className="text-xs text-muted">
            By {event.organizer?.name ?? "Unknown"}
          </p>
        </div>
      </div>
    </Link>
  );
}
