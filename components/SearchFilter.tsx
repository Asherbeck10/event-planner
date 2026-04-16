"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { EVENT_CATEGORIES } from "@/lib/validations";

export function SearchFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
        <input
          type="search"
          placeholder="Search events..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateParam("search", e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {/* Category */}
      <select
        defaultValue={searchParams.get("category") ?? ""}
        onChange={(e) => updateParam("category", e.target.value)}
        className="input-field sm:w-44"
      >
        <option value="">All Categories</option>
        {EVENT_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* Location */}
      <input
        type="text"
        placeholder="Filter by location..."
        defaultValue={searchParams.get("location") ?? ""}
        onChange={(e) => updateParam("location", e.target.value)}
        className="input-field sm:w-48"
      />
    </div>
  );
}
