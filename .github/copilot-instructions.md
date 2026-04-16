# Copilot Instructions

## Commands

- Use `pnpm` for repo commands. The project is checked in with `pnpm-lock.yaml` and `pnpm-workspace.yaml`.
- `pnpm dev` starts the local Next.js dev server.
- `pnpm lint` runs ESLint using the flat config in `eslint.config.mjs`.
- `pnpm build` creates the production build.
- `pnpm start` serves the production build.
- There is no automated test setup yet: no `test` script, no test config, and no `*.test.*` or `*.spec.*` files. Do not invent single-test commands until a test runner is added.
- `pnpm build` may print a Turbopack workspace-root warning if Next.js detects another lockfile above this repo. Treat that as a warning, not a failed build.

## High-level architecture

This is a full-stack event planning application built with Next.js 16 App Router.

### Routes
- `app/page.tsx` — Home page: hero section + upcoming events grid
- `app/events/page.tsx` — Browse all events with search/filter
- `app/events/[id]/page.tsx` — Event detail with RSVP button
- `app/events/new/page.tsx` — Create event form (protected)
- `app/events/[id]/edit/page.tsx` — Edit event form (organizer only)
- `app/dashboard/page.tsx` — User dashboard: "My Events" + "My RSVPs" tabs
- `app/auth/login/page.tsx` — Login page
- `app/auth/register/page.tsx` — Register page
- `app/api/auth/[...nextauth]/route.ts` — NextAuth v5 API handler

### Key files
- `lib/auth.ts` — NextAuth v5 config (Credentials provider, JWT sessions). Exports `auth`, `signIn`, `signOut`, `handlers`.
- `lib/db.ts` — Supabase client singletons (`supabase` for client, `supabaseAdmin` for server). Also exports shared DB types.
- `lib/validations.ts` — Zod v4 schemas for auth and event forms. Also exports `EVENT_CATEGORIES` constant.
- `actions/auth.ts` — `registerUser` and `loginUser` Server Actions.
- `actions/events.ts` — `getEvents`, `getEventById`, `getUserEvents`, `createEvent`, `updateEvent`, `deleteEvent` Server Actions.
- `actions/rsvps.ts` — `toggleRSVP` and `getUserRsvpEvents` Server Actions.
- `proxy.ts` — Route protection (Next.js 16 uses `proxy.ts` instead of `middleware.ts`).
- `supabase/schema.sql` — Database schema to run in Supabase SQL Editor.

### Components
- `components/Navbar.tsx` — Auth-aware, mobile-responsive navbar (client component using `next-auth/react` `signOut`).
- `components/EventCard.tsx` — Event listing card with category badge, meta, RSVP count.
- `components/EventForm.tsx` — Shared create/edit form (client component, uses `useActionState`).
- `components/AuthForm.tsx` — Shared login/register form (client component).
- `components/RSVPButton.tsx` — RSVP toggle button with optimistic UI via `useTransition`.
- `components/SearchFilter.tsx` — Search + category + location filters (client component, updates URL params).

### Database (Supabase / PostgreSQL)
Three tables: `users`, `events`, `rsvps`. We manage our own `users` table with bcrypt-hashed passwords — we do **not** use Supabase Auth. Row Level Security is disabled; authorization is handled in the app layer.

## Key conventions

- Treat this as a **Next.js 16** codebase. In Next.js 16, `middleware.ts` is deprecated — use `proxy.ts` instead.
- **All data mutations use Server Actions** — no custom route handlers (except the NextAuth API route).
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never import `supabaseAdmin` in client components.
- `auth()` from `lib/auth.ts` is the session helper for Server Components (NextAuth v5 pattern — no `getServerSession`).
- Tailwind v4: no `tailwind.config.*`; theme tokens are defined in `app/globals.css` under `@theme`. Shared utility classes (`.card`, `.btn-primary`, `.input-field`, etc.) are in `@layer components`.
- Prefer Server Components by default. Add `'use client'` only when browser-only APIs or interactivity is needed.
- Use the `@/*` path alias from `tsconfig.json` for all root-relative imports.
- ESLint uses the flat-config format in `eslint.config.mjs`. No `any` types — use `unknown` with explicit casts via intermediate typed interfaces.
- Event categories are a fixed predefined list defined in `lib/validations.ts` (`EVENT_CATEGORIES`). Do not add free-form category input.
