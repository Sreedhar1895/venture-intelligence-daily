"use client";

import { PinIcon } from "./PinIcon";
import { BellIcon } from "./BellIcon";
import { RemoveIcon } from "./RemoveIcon";
import type { Startup } from "@/types/database";

interface FeaturedStartupCardProps {
  startup: Startup;
  onStar?: (name: string) => void;
  onUnstar?: (startupId: string) => void;
  starredStartups?: { id: string; name: string }[];
  onPin?: (item: { type: "startup"; id: string; title: string; url: string }) => void;
  onUnpin?: (itemType: string, itemId: string) => void;
  isPinned?: boolean;
  onNotify?: (startupId: string, startupName: string) => void;
  onUnnotify?: (startupId: string) => void;
  isNotified?: boolean;
  onDismiss?: (itemType: "startup", itemId: string) => void;
}

export function FeaturedStartupCard({ startup, onStar, onUnstar, starredStartups = [], onPin, onUnpin, onNotify, onUnnotify, isPinned, isNotified, onDismiss }: FeaturedStartupCardProps) {
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
          {startup.founding_team && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Founding team: {startup.founding_team}
            </p>
          )}
          {Array.isArray(startup.cofounder_linkedins) && startup.cofounder_linkedins.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {startup.cofounder_linkedins.map((c) => (
                <a
                  key={c.url}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  {c.name} (LinkedIn)
                </a>
              ))}
            </div>
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
          {(startup.accelerator || startup.batch || startup.university) && (
            <div className="mt-1 flex flex-wrap gap-2">
              {startup.accelerator && startup.batch && (
                <span className="rounded bg-violet-100 px-2 py-0.5 text-xs dark:bg-violet-900/30">
                  {startup.accelerator} {startup.batch} · Demo Day
                </span>
              )}
              {startup.accelerator && !startup.batch && (
                <span className="rounded bg-violet-100 px-2 py-0.5 text-xs dark:bg-violet-900/30">
                  {startup.accelerator}
                </span>
              )}
              {startup.university && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                  {startup.university}
                </span>
              )}
            </div>
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
          {(onPin || onUnpin) && (
            <button
              type="button"
              onClick={() => (isPinned && onUnpin ? onUnpin("startup", startup.id) : onPin?.({ type: "startup", id: startup.id, title: startup.name, url: primaryUrl }))}
              className="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title={isPinned ? "Unpin" : "Pin"}
            >
              <PinIcon pinned={isPinned} size={18} />
            </button>
          )}
          {(onNotify || onUnnotify) && (
            <button
              type="button"
              onClick={() => (isNotified && onUnnotify ? onUnnotify(startup.id) : onNotify?.(startup.id, startup.name))}
              className="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title={isNotified ? "Stop update emails" : "Get update emails"}
            >
              <BellIcon on={isNotified} size={18} />
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss("startup", startup.id)}
              className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              title="Remove from view"
            >
              <RemoveIcon size={18} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
