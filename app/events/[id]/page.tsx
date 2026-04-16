import { notFound } from "next/navigation";
import Link from "next/link";
import { getEventById, deleteEvent } from "@/actions/events";
import { RSVPButton } from "@/components/RSVPButton";
import { auth } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return { title: "Event Not Found" };
  return { title: `${event.title} — Event Planner` };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const event = await getEventById(id, session?.user?.id);

  if (!event) notFound();

  const isOrganizer = session?.user?.id === event.organizer_id;
  const isFull =
    event.max_attendees !== null && event.rsvp_count >= event.max_attendees;

  async function handleDelete() {
    "use server";
    await deleteEvent(id);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back link */}
      <Link href="/events" className="text-muted hover:text-foreground text-sm flex items-center gap-1 mb-6">
        ← Back to events
      </Link>

      <div className="card p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-blue-900/50 text-blue-300 border-blue-700">
                {event.category}
              </span>
              {isFull && (
                <span className="text-xs text-red-400 border border-red-700 rounded-full px-2.5 py-1">
                  Full
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
            <p className="text-muted text-sm">
              Organized by <span className="text-foreground">{event.organizer?.name}</span>
            </p>
          </div>

          {isOrganizer && (
            <div className="flex gap-2 shrink-0">
              <Link
                href={`/events/${event.id}/edit`}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                Edit
              </Link>
              <form action={handleDelete}>
                <button type="submit" className="btn-danger text-sm py-1.5 px-3">
                  Delete
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="grid sm:grid-cols-2 gap-4 py-4 border-t border-b border-slate-700">
          <div className="flex items-start gap-2 text-sm">
            <span className="mt-0.5">📅</span>
            <div>
              <p className="text-muted text-xs uppercase tracking-wide font-medium mb-0.5">Date & Time</p>
              <p className="text-foreground">{formatDate(event.date)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="mt-0.5">📍</span>
            <div>
              <p className="text-muted text-xs uppercase tracking-wide font-medium mb-0.5">Location</p>
              <p className="text-foreground">{event.location}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="mt-0.5">👥</span>
            <div>
              <p className="text-muted text-xs uppercase tracking-wide font-medium mb-0.5">Attendees</p>
              <p className="text-foreground">
                {event.rsvp_count}
                {event.max_attendees ? ` / ${event.max_attendees}` : ""} attending
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-2">About</h2>
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>
        )}

        {/* RSVP */}
        {!isOrganizer && (
          <div className="pt-2">
            <RSVPButton
              eventId={event.id}
              hasRsvp={event.user_has_rsvp ?? false}
              isFull={isFull}
              isLoggedIn={!!session?.user}
            />
          </div>
        )}
      </div>
    </div>
  );
}
