"use server";

import { supabaseAdmin, type EventWithMeta, type DbUser } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleRSVP(eventId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in to RSVP." };

  const userId = session.user.id;

  // Check if RSVP exists
  const { data: existing } = await supabaseAdmin
    .from("rsvps")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Remove RSVP
    await supabaseAdmin.from("rsvps").delete().eq("id", existing.id);
  } else {
    // Check max_attendees limit
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("max_attendees")
      .eq("id", eventId)
      .single();

    if (event?.max_attendees != null) {
      const { count } = await supabaseAdmin
        .from("rsvps")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId);

      if (count !== null && count >= (event.max_attendees ?? Infinity)) {
        return { error: "This event is full." };
      }
    }

    await supabaseAdmin.from("rsvps").insert({ event_id: eventId, user_id: userId });
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
  return {};
}

type RawRsvpRow = {
  event: EventWithMeta & {
    rsvps: [{ count: number }] | [];
    organizer: Pick<DbUser, "id" | "name" | "email">;
  } | null;
};

export async function getUserRsvpEvents(userId: string): Promise<EventWithMeta[]> {
  const { data, error } = await supabaseAdmin
    .from("rsvps")
    .select(`
      event:events(
        *,
        organizer:users!organizer_id(id, name, email),
        rsvps(count)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as RawRsvpRow[])
    .map((row) => row.event)
    .filter((ev): ev is NonNullable<RawRsvpRow["event"]> => ev !== null)
    .map((ev) => ({
      ...ev,
      organizer: ev.organizer,
      rsvp_count: ev.rsvps?.[0]?.count ?? 0,
      user_has_rsvp: true,
    }));
}
