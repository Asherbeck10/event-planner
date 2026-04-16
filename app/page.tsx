import Link from "next/link";
import { getEvents } from "@/actions/events";
import { EventCard } from "@/components/EventCard";

export default async function HomePage() {
  const events = await getEvents();
  const upcomingEvents = events.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-background py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-block text-primary text-5xl mb-2">📅</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Discover Events{" "}
            <span className="text-primary">Near You</span>
          </h1>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Find and join events happening in your area, or create your own and
            manage RSVPs with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/events" className="btn-primary text-base px-6 py-3">
              Browse All Events
            </Link>
            <Link href="/auth/register" className="btn-secondary text-base px-6 py-3">
              Create an Event
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">Upcoming Events</h2>
          <Link href="/events" className="text-primary hover:underline text-sm font-medium">
            View all →
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-lg font-medium">No events yet</p>
            <p className="text-sm mt-1">Be the first to create one!</p>
            <Link href="/events/new" className="btn-primary inline-block mt-4">
              Create Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* CTA banner */}
      <section className="bg-slate-900 border-t border-slate-700 py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Ready to host your own event?</h2>
          <p className="text-muted">
            Create an event, set the details, and let attendees RSVP — all in one place.
          </p>
          <Link href="/auth/register" className="btn-primary inline-block px-8 py-3 text-base">
            Get Started Free →
          </Link>
        </div>
      </section>
    </div>
  );
}

