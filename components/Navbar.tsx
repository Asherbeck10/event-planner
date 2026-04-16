"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

export function Navbar({ session }: { session: Session | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-700 bg-slate-900 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground hover:text-primary transition-colors">
          <span className="text-primary">📅</span> Event Planner
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/events" className="text-muted hover:text-foreground transition-colors text-sm font-medium">
            Events
          </Link>
          {session ? (
            <>
              <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/events/new" className="btn-primary text-sm py-1.5 px-3">
                + Create Event
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-muted hover:text-foreground transition-colors text-sm font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-muted hover:text-foreground transition-colors text-sm font-medium">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm py-1.5 px-3">
                Get Started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-muted hover:text-foreground p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="md:hidden border-t border-slate-700 bg-slate-900 px-4 py-4 space-y-3">
          <Link href="/events" onClick={() => setMenuOpen(false)} className="block text-muted hover:text-foreground text-sm font-medium">
            Events
          </Link>
          {session ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block text-muted hover:text-foreground text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/events/new" onClick={() => setMenuOpen(false)} className="block text-muted hover:text-foreground text-sm font-medium">
                + Create Event
              </Link>
              <button
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                className="block text-muted hover:text-foreground text-sm font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="block text-muted hover:text-foreground text-sm font-medium">
                Sign In
              </Link>
              <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="block btn-primary text-sm py-1.5 px-3 text-center">
                Get Started
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
