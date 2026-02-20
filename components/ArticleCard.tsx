"use client";

import type { Article } from "@/types/database";

interface ArticleCardProps {
  article: Article;
  onStar?: (startupName: string) => void;
  starredStartups?: string[];
}

export function ArticleCard({ article, onStar, starredStartups = [] }: ArticleCardProps) {
  const name = article.related_tracked_startup || extractStartupName(article.title);
  const isStarred = name ? starredStartups.some((s) => s.toLowerCase() === name.toLowerCase()) : false;

  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
          >
            {article.title}
          </a>
          <p className="mt-1 text-sm text-neutral-500">{article.source}</p>
          {article.summary && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
              {article.summary}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {article.sector_tags?.map((tag) => (
              <span
                key={tag}
                className="rounded bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800"
              >
                {tag}
              </span>
            ))}
            {article.event_type && (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs dark:bg-emerald-900/30">
                {article.event_type}
              </span>
            )}
            <span className="text-xs text-neutral-400">Score: {article.relevance_score}</span>
          </div>
        </div>
        {name && onStar && (
          <button
            type="button"
            onClick={() => onStar(name)}
            className="shrink-0 rounded p-1.5 text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title={isStarred ? "Starred" : "Star startup"}
          >
            {isStarred ? "★" : "☆"}
          </button>
        )}
      </div>
    </article>
  );
}

function extractStartupName(title: string): string | null {
  const match = title.match(/(?:^|\s)([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)\s+(?:raises|secures|launches|announces)/i)
    || title.match(/([A-Z][a-z]+)\s+(?:raises|secures)/i);
  return match ? match[1].trim() : null;
}
