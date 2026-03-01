"use client";

import { PinIcon } from "./PinIcon";
import { RemoveIcon } from "./RemoveIcon";
import type { Research } from "@/types/database";

interface ResearchCardProps {
  research: Research;
  onPin?: (item: { type: "research"; id: string; title: string; url: string }) => void;
  onUnpin?: (itemType: string, itemId: string) => void;
  isPinned?: boolean;
  onDismiss?: (itemType: "research", itemId: string) => void;
}

export function ResearchCard({ research, onPin, onUnpin, isPinned, onDismiss }: ResearchCardProps) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <a
            href={research.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
          >
            {research.title}
          </a>
          <p className="mt-1 text-sm text-neutral-500">{research.source}</p>
          {(research.summary || research.abstract) && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
              {research.summary || research.abstract}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {research.sector_tags?.map((tag) => (
              <span key={tag} className="rounded bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          {(onPin || onUnpin) && (
            <button
              type="button"
              onClick={() => (isPinned && onUnpin ? onUnpin("research", research.id) : onPin?.({ type: "research", id: research.id, title: research.title, url: research.url }))}
              className="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title={isPinned ? "Unpin" : "Pin"}
            >
              <PinIcon pinned={isPinned} size={18} />
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss("research", research.id)}
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
