"use client";

import { PinIcon } from "./PinIcon";
import type { Startup } from "@/types/database";

interface FeaturedStartupCardProps {
  startup: Startup;
  onStar?: (name: string) => void;
  onUnstar?: (startupId: string) => void;
  starredStartups?: { id: string; name: string }[];
  onPin?: (item: { type: "startup"; id: string; title: string; url: string }) => void;
  isPinned?: boolean;
}

export function FeaturedStartupCard({ startup, onStar, onUnstar, starredStartups = [], onPin, isPinned }: FeaturedStartupCardProps) {
  const starred = starredStartups.find((s) => s.name.toLowerCase() === startup.name.toLowerCase());
  const isStarred = !!starred;

  const handleStarClick = () => {
    if (isStarred && onUnstar && starred) onUnstar(starred.id);
    else if (!isStarred && onStar) onStar(startup.name);
  };
  const links = Array.isArray(startup.links) ? startup.links : [];
  const primaryUrl = startup.website || (links[0]?.url) || "#";
  const signals = (startup.signals || {}) as { signed_customers?: boolean; team_grew?: boolean; raised_funding?: boolean };

  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
          >
            {startup.name}
          </a>
          {(startup.overall_score != null && startup.overall_score > 0) && (
            <span className="ml-2 text-xs text-neutral-400">Score: {startup.overall_score}</span>
          )}
          {startup.founding_team && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Founding team: {startup.founding_team}
            </p>
          )}
          {startup.why_interesting && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {startup.why_interesting}
            </p>
          )}
          {startup.moat_note && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
              Moat: {startup.moat_note}
            </p>
          )}
          {(signals.signed_customers || signals.team_grew || signals.raised_funding) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {signals.raised_funding && (
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs dark:bg-emerald-900/30">Raised funding</span>
              )}
              {signals.signed_customers && (
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs dark:bg-blue-900/30">New customers</span>
              )}
              {signals.team_grew && (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs dark:bg-amber-900/30">Team grew</span>
              )}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {startup.sector_tags?.map((tag) => (
              <span
                key={tag}
                className="rounded bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800"
              >
                {tag}
              </span>
            ))}
          </div>
          {links.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {links.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {(onStar || onUnstar) && (
            <button
              type="button"
              onClick={handleStarClick}
              className="rounded p-1.5 text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title={isStarred ? "Stop tracking" : "Track startup"}
            >
              {isStarred ? "★" : "☆"}
            </button>
          )}
          {onPin && (
            <button
              type="button"
              onClick={() => onPin({ type: "startup", id: startup.id, title: startup.name, url: primaryUrl })}
              className="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title={isPinned ? "Pinned" : "Pin"}
            >
              <PinIcon pinned={isPinned} size={18} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
