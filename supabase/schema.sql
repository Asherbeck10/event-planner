-- Event Planner Database Schema
-- Run this in your Supabase SQL editor to set up the database.

-- Users table (managed by our app auth layer, not Supabase Auth)
create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text unique not null,
  password   text not null, -- bcrypt hash
  created_at timestamptz default now()
);

-- Events table
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  date          timestamptz not null,
  location      text not null,
  category      text not null,
  organizer_id  uuid references users(id) on delete cascade not null,
  max_attendees integer,
  image_url     text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- RSVPs table (unique per user + event)
create table if not exists rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references events(id) on delete cascade not null,
  user_id    uuid references users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

-- Indexes for common queries
create index if not exists events_organizer_id_idx on events(organizer_id);
create index if not exists events_category_idx on events(category);
create index if not exists events_date_idx on events(date);
create index if not exists rsvps_event_id_idx on rsvps(event_id);
create index if not exists rsvps_user_id_idx on rsvps(user_id);
