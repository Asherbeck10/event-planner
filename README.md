# Event Planner

A full-stack event planning application built with Next.js 16, Supabase, and Auth.js. Create events, manage RSVPs, and discover what's happening near you.

## Features

- **Authentication** — Sign up and sign in with email/password
- **Event Management** — Create, edit, and delete events
- **RSVP System** — RSVP to events with capacity limits
- **Dashboard** — Manage your events and RSVPs in one place
- **Search & Filter** — Find events by keyword, category, and location
- **Responsive Design** — Mobile-friendly dark UI

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Auth.js v5 (NextAuth) |
| Validation | Zod v4 |
| Deployment | Vercel |

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to the **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Project Settings → API** to get your keys

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AUTH_SECRET=your_random_secret  # generate with: openssl rand -base64 32
```

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
  page.tsx                  # Home — hero + upcoming events
  dashboard/page.tsx        # My Events + My RSVPs tabs
  events/
    page.tsx                # Browse events with search/filter
    new/page.tsx            # Create event (protected)
    [id]/page.tsx           # Event detail + RSVP
    [id]/edit/page.tsx      # Edit event (organizer only)
  auth/
    login/page.tsx
    register/page.tsx
  api/auth/[...nextauth]/   # Auth.js API route

actions/
  auth.ts                   # register / login server actions
  events.ts                 # event CRUD server actions
  rsvps.ts                  # RSVP toggle server action

components/
  Navbar.tsx                # Auth-aware responsive navbar
  EventCard.tsx             # Event listing card
  EventForm.tsx             # Shared create/edit form
  AuthForm.tsx              # Shared login/register form
  RSVPButton.tsx            # RSVP toggle with optimistic UI
  SearchFilter.tsx          # Search + category + location filters

lib/
  auth.ts                   # NextAuth config
  db.ts                     # Supabase client + shared types
  validations.ts            # Zod schemas + EVENT_CATEGORIES

supabase/
  schema.sql                # Database schema
```

## Deployment

### Deploy to Vercel

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add all four environment variables from `.env.local` in the Vercel dashboard
4. Deploy

> Make sure `SUPABASE_SERVICE_ROLE_KEY` is added as a **server-only** environment variable (not prefixed with `NEXT_PUBLIC_`).

