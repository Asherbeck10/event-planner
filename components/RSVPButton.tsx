"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRSVP } from "@/actions/rsvps";

type RSVPButtonProps = {
  eventId: string;
  hasRsvp: boolean;
  isFull: boolean;
  isLoggedIn: boolean;
};

export function RSVPButton({ eventId, hasRsvp, isFull, isLoggedIn }: RSVPButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      router.push(`/auth/login?callbackUrl=/events/${eventId}`);
      return;
    }

    startTransition(async () => {
      const result = await toggleRSVP(eventId);
      if (result.error) {
        alert(result.error);
      }
    });
  }

  if (!hasRsvp && isFull) {
    return (
      <button disabled className="btn-secondary opacity-50 cursor-not-allowed w-full sm:w-auto">
        Event Full
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`w-full sm:w-auto ${
        hasRsvp ? "btn-danger" : "btn-primary"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isPending
        ? "Updating..."
        : hasRsvp
        ? "✓ Cancel RSVP"
        : isLoggedIn
        ? "RSVP to Event"
        : "Sign In to RSVP"}
    </button>
  );
}
