"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArticleCard } from "./ArticleCard";
import { EventsList } from "./EventsList";
import { useTheme } from "./ThemeProvider";
import type { Article } from "@/types/database";

const SECTOR_FILTERS = ["All", "AI-native", "Fintech", "Robotics", "Vertical SaaS", "Other"];

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

export function Dashboard() {
  const { theme, toggle } = useTheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [updates, setUpdates] = useState<unknown[]>([]);
  const [starredNames, setStarredNames] = useState<string[]>([]);
  const [sector, setSector] = useState("All");
  const [tab, setTab] = useState<"signals" | "tracked">("signals");
  const [loading, setLoading] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setArticlesError(null);
      const res = await fetch("/api/articles");
      const json = await res.json();
      if (json.error) {
        setArticlesError(json.error);
        setArticles([]);
      } else {
        const arts = Array.isArray(json.articles) ? json.articles : [];
        setArticles(arts as Article[]);
      }

      const { data: starData } = await supabase
        .from("starred_startups")
        .select("startups(name)")
        .eq("user_id", DEMO_USER_ID);
      const names = (starData || [])
        .map((s) => (s as { startups: { name: string } | null }).startups?.name)
        .filter(Boolean) as string[];
      setStarredNames(names);

      const updatesRes = await fetch(`/api/tracked-updates?userId=${DEMO_USER_ID}`);
      const updatesJson = await updatesRes.json();
      setUpdates(updatesJson.updates || []);

      setLoading(false);
    }
    load();
  }, []);

  const filtered =
    sector === "All"
      ? articles
      : articles.filter((a) => a.sector_tags?.includes(sector as never));

  const handleStar = async (startupName: string) => {
    await fetch("/api/star", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: DEMO_USER_ID,
        startupName,
      }),
    });
    setStarredNames((prev) => (prev.includes(startupName) ? prev : [...prev, startupName]));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex items-center justify-between border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <h1 className="text-2xl font-bold">Venture Intelligence Daily</h1>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/csv?type=articles"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Export CSV
          </a>
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <div className="mt-6 flex gap-6">
        <aside className="w-64 shrink-0">
          <EventsList />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex gap-2">
            {(["signals", "tracked"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  tab === t ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                {t === "signals" ? "Top Signals" : "Tracked Startups"}
              </button>
            ))}
          </div>

          {tab === "signals" && (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                {SECTOR_FILTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSector(s)}
                    className={`rounded px-3 py-1 text-sm ${
                      sector === s ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {loading ? (
                <p className="text-neutral-500">Loading...</p>
              ) : (
                <div className="space-y-4">
                  {filtered.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onStar={handleStar}
                      starredStartups={starredNames}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-neutral-500">
                      {articlesError
                        ? `Could not load articles: ${articlesError}. Run the SQL in supabase/migrations/001_initial_schema.sql in your Supabase project, then run ingestion.`
                        : "No articles. Run ingestion."}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {tab === "tracked" && (
            <div className="space-y-4">
              {updates.length === 0 ? (
                <p className="text-neutral-500">No updates for starred startups yet.</p>
              ) : (
                updates.map((u: { id: string; title: string; url?: string; startups?: { name: string } }) => (
                  <div
                    key={u.id}
                    className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <a href={u.url || "#"} className="font-medium hover:underline">
                      {u.title}
                    </a>
                    <p className="mt-1 text-sm text-neutral-500">{u.startups?.name}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
