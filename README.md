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

| Layer      | Technology              |
| ---------- | ----------------------- |
| Framework  | Next.js 16 (App Router) |
| Language   | TypeScript              |
| Styling    | Tailwind CSS v4         |
| Database   | Supabase (PostgreSQL)   |
| Auth       | Auth.js v5 (NextAuth)   |
| Validation | Zod v4                  |
| Testing    | Vitest + Playwright     |
| Deployment | Vercel                  |

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

```text
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

tests/
  setup.ts                  # Global Vitest setup (mocks for next/navigation etc.)
  fixtures/index.ts         # Shared test data and Supabase mock helpers
  unit/
    lib/validations.test.ts # Zod schema unit tests
    actions/
      auth.test.ts          # registerUser / loginUser server action tests
      events.test.ts        # Event CRUD server action tests
      rsvps.test.ts         # RSVP server action tests
    components/
      EventCard.test.tsx
      RSVPButton.test.tsx
      SearchFilter.test.tsx
  e2e/
    global-setup.ts         # Seeds test users in Supabase before the run
    global-teardown.ts      # Removes test data after the run
    fixtures.ts             # Shared helpers + authenticatedPage fixture
    auth.spec.ts            # Register, login, logout, route guards
    events.spec.ts          # CRUD, search/filter, authorization, 404
    rsvp.spec.ts            # RSVP, cancel, capacity, unauthenticated redirect
```

## Testing

### Unit tests (Vitest + React Testing Library)

```bash
pnpm test          # run once
pnpm test:watch    # watch mode
```

83 tests across 7 files covering Zod schemas, all server actions (including auth checks and ownership guards), and all interactive components.

### E2E tests (Playwright)

E2E tests require a running app and a Supabase database. The global setup seeds two test users and cleans them up after the run.

Playwright loads your `.env.local` automatically, so no extra setup is needed locally.

```bash
# Run against the local dev server (starts automatically)
pnpm test:e2e

# Run against a deployed URL
TEST_BASE_URL=https://your-app.vercel.app pnpm test:e2e
```

The same env vars from `.env.local` are used. For CI, set them as environment secrets.

## Deployment

### Deploy to Vercel

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add all four environment variables from `.env.local` in the Vercel dashboard
4. Deploy

> Make sure `SUPABASE_SERVICE_ROLE_KEY` is added as a **server-only** environment variable (not prefixed with `NEXT_PUBLIC_`).
