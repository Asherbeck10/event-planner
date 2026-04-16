"use server";

import { supabaseAdmin, type EventWithMeta, type DbUser } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eventSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EventsFilter = {
  search?: string;
  category?: string;
  location?: string;
};

type RawEventRow = EventWithMeta & {
  rsvps: [{ count: number }] | [];
  organizer: Pick<DbUser, "id" | "name" | "email">;
};

function mapRow(row: RawEventRow): EventWithMeta {
  return {
    ...row,
    organizer: row.organizer,
    rsvp_count: row.rsvps?.[0]?.count ?? 0,
  };
}

export async function getEvents(filter: EventsFilter = {}): Promise<EventWithMeta[]> {
  let query = supabaseAdmin
    .from("events")
    .select(`
      *,
      organizer:users!organizer_id(id, name, email),
      rsvps(count)
    `)
    .order("date", { ascending: true });

  if (filter.category && filter.category !== "all") {
    query = query.eq("category", filter.category);
  }
  if (filter.search) {
    query = query.or(
      `title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`
    );
  }
  if (filter.location) {
    query = query.ilike("location", `%${filter.location}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as unknown as RawEventRow[]).map(mapRow);
}

export async function getEventById(
  id: string,
  userId?: string
): Promise<EventWithMeta | null> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(`
      *,
      organizer:users!organizer_id(id, name, email),
      rsvps(count)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const row = data as unknown as RawEventRow;

  let userHasRsvp = false;
  if (userId) {
    const { data: rsvp } = await supabaseAdmin
      .from("rsvps")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", userId)
      .single();
    userHasRsvp = !!rsvp;
  }

  return {
    ...mapRow(row),
    user_has_rsvp: userHasRsvp,
  };
}

export async function getUserEvents(userId: string): Promise<EventWithMeta[]> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(`
      *,
      organizer:users!organizer_id(id, name, email),
      rsvps(count)
    `)
    .eq("organizer_id", userId)
    .order("date", { ascending: true });

  if (error || !data) return [];
  return (data as unknown as RawEventRow[]).map(mapRow);
}

export type EventActionState = {
  error?: string;
  success?: boolean;
};

export async function createEvent(
  _prev: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
    location: formData.get("location"),
    category: formData.get("category"),
    maxAttendees: formData.get("maxAttendees"),
  });

  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join(", ");
    return { error: messages };
  }

  const { title, description, date, location, category, maxAttendees } = parsed.data;
  const maxAttendeesNum = maxAttendees ? parseInt(maxAttendees, 10) : null;

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .insert({
      title,
      description: description || null,
      date,
      location,
      category,
      max_attendees: maxAttendeesNum,
      organizer_id: session.user.id,
    })
    .select("id")
    .single();

  if (error || !event) return { error: "Failed to create event. Please try again." };

  redirect(`/events/${event.id}`);
}

export async function updateEvent(
  id: string,
  _prev: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from("events")
    .select("organizer_id")
    .eq("id", id)
    .single();

  if (!existing || existing.organizer_id !== session.user.id) {
    return { error: "You are not authorized to edit this event." };
  }

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
    location: formData.get("location"),
    category: formData.get("category"),
    maxAttendees: formData.get("maxAttendees"),
  });

  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join(", ");
    return { error: messages };
  }

  const { title, description, date, location, category, maxAttendees } = parsed.data;
  const maxAttendeesNum = maxAttendees ? parseInt(maxAttendees, 10) : null;

  const { error } = await supabaseAdmin
    .from("events")
    .update({
      title,
      description: description || null,
      date,
      location,
      category,
      max_attendees: maxAttendeesNum,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: "Failed to update event. Please try again." };

  revalidatePath(`/events/${id}`);
  redirect(`/events/${id}`);
}

export async function deleteEvent(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const { data: existing } = await supabaseAdmin
    .from("events")
    .select("organizer_id")
    .eq("id", id)
    .single();

  if (!existing || existing.organizer_id !== session.user.id) return;

  await supabaseAdmin.from("events").delete().eq("id", id);

  revalidatePath("/events");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
