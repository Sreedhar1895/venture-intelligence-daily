"use client";

import { getEventsByCity } from "@/lib/events";
import { useState, useMemo } from "react";
import { PinIcon } from "./PinIcon";

const CITIES = ["All", "San Francisco", "New York", "Boston", "Austin"];

interface EventsListProps {
  onPin?: (item: { type: "event"; id: string; title: string; url: string }) => void;
  pinnedEventIds?: Set<string>;
}

export function EventsList({ onPin, pinnedEventIds }: EventsListProps) {
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
      <ul className="mt-4 space-y-3">
        {events.length === 0 ? (
          <li className="text-sm text-neutral-500">No events. Add an events source to ingest to see real data.</li>
        ) : (
          events.map((e) => {
            const eventUrl = e.url && e.url !== "#" ? e.url : e.registration_url || "#";
            return (
              <li key={e.id} className="text-sm">
                <div className="flex justify-between gap-2">
                  {eventUrl !== "#" ? (
                    <a
                      href={eventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                    >
                      {e.title}
                    </a>
                  ) : (
                    <span className="font-medium">{e.title}</span>
                  )}
                  {onPin && (
                    <button
                      type="button"
                      onClick={() => onPin({ type: "event", id: e.id, title: e.title, url: e.registration_url || e.url })}
                      className="shrink-0 rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title={pinnedEventIds?.has(e.id) ? "Pinned" : "Pin"}
                    >
                      <PinIcon pinned={pinnedEventIds?.has(e.id)} size={16} />
                    </button>
                  )}
                </div>
                <span className="block text-neutral-500">{e.city} · {e.date}</span>
                {e.registration_url && e.registration_url !== eventUrl && (
                  <a
                    href={e.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Register
                  </a>
                )}
                {eventUrl !== "#" && !e.registration_url && (
                  <a
                    href={eventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Event link
                  </a>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
