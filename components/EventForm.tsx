"use client";

import { useActionState } from "react";
import { EVENT_CATEGORIES } from "@/lib/validations";
import type { DbEvent } from "@/lib/db";
import type { EventActionState } from "@/actions/events";

type EventFormProps = {
  action: (prev: EventActionState, formData: FormData) => Promise<EventActionState>;
  defaultValues?: Partial<DbEvent>;
  submitLabel?: string;
};

const initialState: EventActionState = {};

function toLocalDatetimeValue(isoString?: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  // format: YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16);
}

export function EventForm({ action, defaultValues, submitLabel = "Create Event" }: EventFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-md px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
          Event Title <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder="e.g. React Summit 2025"
          defaultValue={defaultValues?.title}
          className="input-field"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Tell people what to expect..."
          defaultValue={defaultValues?.description ?? ""}
          className="input-field resize-none"
        />
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-foreground mb-1">
          Date & Time <span className="text-red-400">*</span>
        </label>
        <input
          id="date"
          name="date"
          type="datetime-local"
          required
          defaultValue={toLocalDatetimeValue(defaultValues?.date)}
          className="input-field"
        />
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
          Location <span className="text-red-400">*</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          required
          placeholder="e.g. New York, NY or Online"
          defaultValue={defaultValues?.location}
          className="input-field"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
          Category <span className="text-red-400">*</span>
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue={defaultValues?.category ?? ""}
          className="input-field"
        >
          <option value="" disabled>
            Select a category
          </option>
          {EVENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Max Attendees */}
      <div>
        <label htmlFor="maxAttendees" className="block text-sm font-medium text-foreground mb-1">
          Max Attendees{" "}
          <span className="text-muted text-xs font-normal">(leave blank for unlimited)</span>
        </label>
        <input
          id="maxAttendees"
          name="maxAttendees"
          type="number"
          min={1}
          placeholder="e.g. 50"
          defaultValue={defaultValues?.max_attendees ?? ""}
          className="input-field"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="btn-secondary flex-1 sm:flex-none sm:px-6"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="btn-primary flex-1 sm:flex-none sm:px-6"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
