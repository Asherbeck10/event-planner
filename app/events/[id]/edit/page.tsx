import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEventById, updateEvent } from "@/actions/events";
import { EventForm } from "@/components/EventForm";

export const metadata = {
  title: "Edit Event — Event Planner",
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/auth/login?callbackUrl=/events/${id}/edit`);

  const event = await getEventById(id);
  if (!event) notFound();

  if (event.organizer_id !== session.user.id) {
    redirect(`/events/${id}`);
  }

  // Bind the event id into the action
  const updateWithId = updateEvent.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Edit Event</h1>
        <p className="text-muted mt-1">Update the details for &ldquo;{event.title}&rdquo;</p>
      </div>
      <div className="card p-8">
        <EventForm
          action={updateWithId}
          defaultValues={event}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
