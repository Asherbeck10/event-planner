import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserEvents, deleteEvent } from "@/actions/events";
import { getUserRsvpEvents, toggleRSVP } from "@/actions/rsvps";
import type { EventWithMeta } from "@/lib/db";

export const metadata = {
  title: "Dashboard — Event Planner",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MyEventRow({ event }: { event: EventWithMeta }) {
  async function handleDelete() {
    "use server";
    await deleteEvent(event.id);
  }

  return (
    <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{event.title}</h3>
        <p className="text-muted text-sm mt-0.5">
          {formatDate(event.date)} · {event.location} · {event.rsvp_count}
          {event.max_attendees ? `/${event.max_attendees}` : ""} attending
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/events/${event.id}`} className="btn-secondary text-sm py-1.5 px-3">
          View
        </Link>
        <Link href={`/events/${event.id}/edit`} className="btn-secondary text-sm py-1.5 px-3">
          Edit
        </Link>
        <form action={handleDelete}>
          <button type="submit" className="btn-danger text-sm py-1.5 px-3">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

function RSVPRow({ event }: { event: EventWithMeta }) {
  async function handleCancel() {
    "use server";
    await toggleRSVP(event.id);
  }

  return (
    <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{event.title}</h3>
        <p className="text-muted text-sm mt-0.5">
          {formatDate(event.date)} · {event.location} · By{" "}
          {event.organizer?.name}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/events/${event.id}`} className="btn-secondary text-sm py-1.5 px-3">
          View
        </Link>
        <form action={handleCancel}>
          <button type="submit" className="btn-danger text-sm py-1.5 px-3">
            Cancel RSVP
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?callbackUrl=/dashboard");

  const { tab } = await searchParams;
  const activeTab = tab === "rsvps" ? "rsvps" : "events";

  const [myEvents, myRsvps] = await Promise.all([
    getUserEvents(session.user.id),
    getUserRsvpEvents(session.user.id),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {session.user.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted mt-1">Manage your events and RSVPs</p>
        </div>
        <Link href="/events/new" className="btn-primary sm:shrink-0">
          + Create Event
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-6">
        <Link
          href="/dashboard?tab=events"
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "events"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          My Events
          {myEvents.length > 0 && (
            <span className="ml-2 bg-slate-700 text-xs rounded-full px-2 py-0.5">
              {myEvents.length}
            </span>
          )}
        </Link>
        <Link
          href="/dashboard?tab=rsvps"
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "rsvps"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          My RSVPs
          {myRsvps.length > 0 && (
            <span className="ml-2 bg-slate-700 text-xs rounded-full px-2 py-0.5">
              {myRsvps.length}
            </span>
          )}
        </Link>
      </div>

      {/* My Events tab */}
      {activeTab === "events" && (
        <div className="space-y-3">
          {myEvents.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <p className="text-4xl mb-3">🎤</p>
              <p className="text-lg font-medium">No events yet</p>
              <p className="text-sm mt-1">Create your first event to get started.</p>
              <Link href="/events/new" className="btn-primary inline-block mt-4">
                Create Event
              </Link>
            </div>
          ) : (
            myEvents.map((event) => <MyEventRow key={event.id} event={event} />)
          )}
        </div>
      )}

      {/* My RSVPs tab */}
      {activeTab === "rsvps" && (
        <div className="space-y-3">
          {myRsvps.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <p className="text-4xl mb-3">🎟️</p>
              <p className="text-lg font-medium">No RSVPs yet</p>
              <p className="text-sm mt-1">Browse events and RSVP to ones you like.</p>
              <Link href="/events" className="btn-primary inline-block mt-4">
                Browse Events
              </Link>
            </div>
          ) : (
            myRsvps.map((event) => <RSVPRow key={event.id} event={event} />)
          )}
        </div>
      )}
    </div>
  );
}
