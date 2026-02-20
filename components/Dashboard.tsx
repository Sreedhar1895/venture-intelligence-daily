"use client";

import { useEffect, useState } from "react";
import { ArticleCard } from "./ArticleCard";
import { EventsList } from "./EventsList";
import { ResearchCard } from "./ResearchCard";
import { FeaturedStartupCard } from "./FeaturedStartupCard";
import { useTheme } from "./ThemeProvider";
import type { Article, Research, Startup, PinnedItem } from "@/types/database";

const SECTOR_FILTERS = ["All", "AI-native", "Fintech", "Robotics", "Vertical SaaS", "Other"];
const STAGE_FILTERS = [
  { value: "", label: "All stages" },
  { value: "early_stage", label: "Early stage" },
  { value: "growth_late_stage", label: "Growth / Late stage" },
  { value: "public_pe", label: "Public / PE" },
];

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

type TabType = "signals" | "research" | "startups" | "tracked" | "pinned";

export function Dashboard() {
  const { theme, toggle } = useTheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [research, setResearch] = useState<Research[]>([]);
  const [featuredStartups, setFeaturedStartups] = useState<Startup[]>([]);
  const [pins, setPins] = useState<PinnedItem[]>([]);
  const [updates, setUpdates] = useState<unknown[]>([]);
  const [starredStartups, setStarredStartups] = useState<{ id: string; name: string }[]>([]);
  const [sector, setSector] = useState("All");
  const [stage, setStage] = useState("");
  const [tab, setTab] = useState<TabType>("signals");
  const [loading, setLoading] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function load() {
      setArticlesError(null);
      const stageParam = stage ? `?stage=${stage}` : "";
      const res = await fetch(`/api/articles${stageParam}`);
      const json = await res.json();
      if (cancelled) return;
      if (json.error) {
        setArticlesError(json.error);
        setArticles([]);
      } else {
        const arts = Array.isArray(json.articles) ? json.articles : [];
        setArticles(arts as Article[]);
      }

      const sectorParam = sector !== "All" ? `?sector=${encodeURIComponent(sector)}` : "";
      const resResearch = await fetch(`/api/research${sectorParam}`);
      const jsonResearch = await resResearch.json();
      if (!cancelled) setResearch(Array.isArray(jsonResearch.research) ? (jsonResearch.research as Research[]) : []);

      const resStartups = await fetch("/api/startups/featured");
      const jsonStartups = await resStartups.json();
      if (!cancelled) setFeaturedStartups(Array.isArray(jsonStartups.startups) ? (jsonStartups.startups as Startup[]) : []);

      const resPins = await fetch(`/api/pins?userId=${DEMO_USER_ID}`);
      const jsonPins = await resPins.json();
      if (!cancelled) setPins(Array.isArray(jsonPins.pins) ? (jsonPins.pins as PinnedItem[]) : []);

      const resStarred = await fetch(`/api/starred?userId=${DEMO_USER_ID}`);
      const jsonStarred = await resStarred.json();
      if (!cancelled) setStarredStartups(Array.isArray(jsonStarred.starred) ? jsonStarred.starred : []);

      const updatesRes = await fetch(`/api/tracked-updates?userId=${DEMO_USER_ID}`);
      const updatesJson = await updatesRes.json();
      if (!cancelled) setUpdates(updatesJson.updates || []);

      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [stage, sector]);

  const filtered =
    sector === "All"
      ? articles
      : articles.filter((a) => a.sector_tags?.includes(sector as never));

  const pinnedSet = new Set(pins.map((p) => `${p.item_type}:${p.item_id}`));
  const isPinned = (type: string, id: string) => pinnedSet.has(`${type}:${id}`);

  const handlePin = async (item: { type: string; id: string; title: string; url: string }) => {
    const res = await fetch("/api/pins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: DEMO_USER_ID,
        itemType: item.type,
        itemId: item.id,
        itemTitle: item.title,
        itemUrl: item.url,
      }),
    });
    const json = await res.json();
    if (json.pin) setPins((prev) => [...prev.filter((p) => !(p.item_type === item.type && p.item_id === item.id)), json.pin]);
  };

  const handleUnpin = async (itemType: string, itemId: string) => {
    await fetch(`/api/pins?userId=${DEMO_USER_ID}&itemType=${itemType}&itemId=${itemId}`, { method: "DELETE" });
    setPins((prev) => prev.filter((p) => !(p.item_type === itemType && p.item_id === itemId)));
  };

  const handleStar = async (startupName: string) => {
    const res = await fetch("/api/star", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: DEMO_USER_ID,
        startupName,
      }),
    });
    const json = await res.json();
    if (json.startupId)
      setStarredStartups((prev) =>
        prev.some((s) => s.name.toLowerCase() === startupName.toLowerCase())
          ? prev
          : [...prev, { id: json.startupId, name: startupName }]
      );
  };

  const handleUnstar = async (startupId: string) => {
    await fetch(`/api/star?userId=${DEMO_USER_ID}&startupId=${startupId}`, { method: "DELETE" });
    setStarredStartups((prev) => prev.filter((s) => s.id !== startupId));
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
          <EventsList
            onPin={handlePin}
            pinnedEventIds={new Set(pins.filter((p) => p.item_type === "event").map((p) => p.item_id))}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            {([
              { id: "signals" as TabType, label: "Top Signals" },
              { id: "research" as TabType, label: "Research" },
              { id: "startups" as TabType, label: "Startups to Watch" },
              { id: "tracked" as TabType, label: "Tracked Startups" },
              { id: "pinned" as TabType, label: "Pinned" },
            ]).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  tab === id ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "signals" && (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="mr-2 self-center text-sm text-neutral-500">Sector:</span>
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
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="mr-2 self-center text-sm text-neutral-500">Stage:</span>
                {STAGE_FILTERS.map(({ value, label }) => (
                  <button
                    key={value || "all"}
                    type="button"
                    onClick={() => setStage(value)}
                    className={`rounded px-3 py-1 text-sm ${
                      stage === value ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                  >
                    {label}
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
                      onUnstar={handleUnstar}
                      starredStartups={starredStartups}
                      onPin={handlePin}
                      isPinned={isPinned("article", article.id)}
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

          {tab === "research" && (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="mr-2 self-center text-sm text-neutral-500">Sector:</span>
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
                  {research.map((r) => (
                    <ResearchCard
                      key={r.id}
                      research={r}
                      onPin={handlePin}
                      isPinned={isPinned("research", r.id)}
                    />
                  ))}
                  {research.length === 0 && (
                    <p className="text-neutral-500">No research yet. Add research sources or run research ingest.</p>
                  )}
                </div>
              )}
            </>
          )}

          {tab === "startups" && (
            loading ? (
              <p className="text-neutral-500">Loading...</p>
            ) : (
              <div className="space-y-4">
                {featuredStartups.map((s) => (
                  <FeaturedStartupCard
                    key={s.id}
                    startup={s}
                    onStar={handleStar}
                    onUnstar={handleUnstar}
                    starredStartups={starredStartups}
                    onPin={handlePin}
                    isPinned={isPinned("startup", s.id)}
                  />
                ))}
                {featuredStartups.length === 0 && (
                  <p className="text-neutral-500">
                    No startups to watch yet. Run ingestion to discover startups from news. Startups are scored by: vertical (1), new customers/partnerships (5), accelerator/funding (4), key hires (2), research (3). Only those with score &gt; 0 appear here.
                  </p>
                )}
              </div>
            )
          )}

          {tab === "pinned" && (
            <div className="space-y-4">
              {pins.length === 0 ? (
                <p className="text-neutral-500">No pinned items. Pin news, research, events, or startups from other tabs.</p>
              ) : (
                pins.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div>
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">{pin.item_type}</span>
                      <a
                        href={pin.item_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 font-medium hover:underline"
                      >
                        {pin.item_title || pin.item_id}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnpin(pin.item_type, pin.item_id)}
                      className="rounded px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      Unpin
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "tracked" && (
            <div className="space-y-4">
              <h3 className="font-semibold">Startups you&apos;re tracking</h3>
              {starredStartups.length === 0 ? (
                <p className="text-neutral-500">Star startups from Top Signals or Startups to Watch to track them here.</p>
              ) : (
                starredStartups.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <span className="font-medium">{s.name}</span>
                    <button
                      type="button"
                      onClick={() => handleUnstar(s.id)}
                      className="rounded px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title="Stop tracking"
                    >
                      ★ Unstar
                    </button>
                  </div>
                ))
              )}
              {(updates as unknown[]).length > 0 && (
                <>
                  <h3 className="mt-6 font-semibold">Updates</h3>
                  {(updates as { id: string; title: string; url?: string; startups?: { name: string } }[]).map((u) => (
                    <div
                      key={u.id}
                      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <a href={u.url || "#"} className="font-medium hover:underline">
                        {u.title}
                      </a>
                      <p className="mt-1 text-sm text-neutral-500">{u.startups?.name}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
