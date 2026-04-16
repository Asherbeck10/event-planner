"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginUser, registerUser, type AuthState } from "@/actions/auth";

type Mode = "login" | "register";

const initialState: AuthState = {};

export function AuthForm({ mode, callbackUrl }: { mode: Mode; callbackUrl?: string }) {
  const action = mode === "login" ? loginUser : registerUser;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "login" ? "Sign in to Event Planner" : "Create an account"}
          </h1>
          <p className="text-muted mt-1 text-sm">
            {mode === "login"
              ? "Welcome back! Enter your details."
              : "Join to create and discover events."}
          </p>
        </div>

        {state.error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-md px-4 py-3 text-sm">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {callbackUrl && (
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
          )}

          {mode === "register" && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Jane Doe"
                required
                className="input-field"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              required
              className="input-field"
            />
          </div>

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending
              ? "Please wait..."
              : mode === "login"
              ? "Sign In →"
              : "Create Account →"}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Register
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
