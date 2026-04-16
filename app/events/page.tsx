import { Suspense } from "react";
import { getEvents } from "@/actions/events";
import { EventCard } from "@/components/EventCard";
import { SearchFilter } from "@/components/SearchFilter";
import Link from "next/link";

export const metadata = {
  title: "Browse Events — Event Planner",
};

type SearchParams = {
  search?: string;
  category?: string;
  location?: string;
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Browse Events</h1>
          <p className="text-muted mt-1">Find something exciting to do</p>
        </div>
        <Link href="/events/new" className="btn-primary hidden sm:inline-flex">
          + Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <Suspense>
          <SearchFilter />
        </Suspense>
      </div>

      {/* Event grid */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card h-64 animate-pulse" />
            ))}
          </div>
        }
      >
        <EventsList filters={filters} />
      </Suspense>
    </div>
  );
}

async function EventsList({ filters }: { filters: SearchParams }) {
  const events = await getEvents(filters);

  if (events.length === 0) {
    return (
      <div className="text-center py-20 text-muted">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-lg font-medium">No events found</p>
        <p className="text-sm mt-1">Try adjusting your filters or create a new event.</p>
        <Link href="/events/new" className="btn-primary inline-block mt-4">
          Create Event
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
