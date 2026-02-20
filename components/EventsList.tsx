"use client";

import { getEventsByCity } from "@/lib/events";
import { useState, useMemo } from "react";

const CITIES = ["All", "San Francisco", "New York", "Boston", "Austin"];

export function EventsList() {
  const [city, setCity] = useState("All");
  const events = useMemo(() => getEventsByCity(city === "All" ? undefined : city), [city]);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-lg font-semibold">Events</h2>
      <div className="mt-2 flex gap-2 flex-wrap">
        {CITIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCity(c)}
            className={`rounded px-3 py-1 text-sm ${
              city === c
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "bg-neutral-100 dark:bg-neutral-800"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {events.map((e) => (
          <li key={e.id} className="flex justify-between text-sm">
            <span className="font-medium">{e.title}</span>
            <span className="text-neutral-500">{e.city} · {e.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
