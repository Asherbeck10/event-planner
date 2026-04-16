import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client — safe for client-side use (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — server-side only, bypasses Row Level Security
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export type DbUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: string;
};

export type DbEvent = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string;
  category: string;
  organizer_id: string;
  max_attendees: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DbRsvp = {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
};

export type EventWithMeta = DbEvent & {
  organizer: Pick<DbUser, "id" | "name" | "email">;
  rsvp_count: number;
  user_has_rsvp?: boolean;
};
