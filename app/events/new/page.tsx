import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EventForm } from "@/components/EventForm";
import { createEvent } from "@/actions/events";

export const metadata = {
  title: "Create Event — Event Planner",
};

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?callbackUrl=/events/new");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
        <p className="text-muted mt-1">Fill in the details and publish your event.</p>
      </div>
      <div className="card p-8">
        <EventForm action={createEvent} submitLabel="Create Event" />
      </div>
    </div>
  );
}
