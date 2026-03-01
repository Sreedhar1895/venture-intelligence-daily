"use client";

import { useEffect, useState } from "react";
import { ArticleCard } from "./ArticleCard";
import { EventsList } from "./EventsList";
import { ResearchCard } from "./ResearchCard";
import { FeaturedStartupCard } from "./FeaturedStartupCard";
import { BellIcon } from "./BellIcon";
import { PinIcon } from "./PinIcon";
import { useTheme } from "./ThemeProvider";
import type { Article, Research, Startup, PinnedItem } from "@/types/database";

const SECTOR_FILTERS = ["All", "AI-native", "Fintech", "Robotics", "Vertical SaaS", "Other"];
const TIME_RANGE_OPTIONS = [
  { value: "today_future", label: "Today & future" },
  { value: "7d", label: "Past 7 days" },
  { value: "30d", label: "Past 30 days" },
  { value: "90d", label: "Past 90 days" },
];
const ACCELERATOR_FILTERS = [
  { value: "YC", label: "Y Combinator" },
  { value: "SPC", label: "South Park Commons" },
  { value: "Neo", label: "Neo" },
  { value: "Techstars", label: "Techstars" },
  { value: "500 Global", label: "500 Global" },
];
const UNIVERSITY_FILTERS = [
  { value: "CMU", label: "Carnegie Mellon" },
  { value: "MIT", label: "MIT" },
  { value: "Stanford", label: "Stanford" },
  { value: "Berkeley", label: "Berkeley" },
  { value: "Harvard", label: "Harvard" },
  { value: "Other", label: "Others" },
];
const STAGE_FILTERS = [
  { value: "", label: "All stages" },
  { value: "early_stage", label: "Early stage" },
  { value: "growth_late_stage", label: "Growth / Late stage" },
  { value: "public_pe", label: "Public / PE" },
];

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

type TabType = "signals" | "research" | "startups" | "tracked" | "pinned" | "notifications";

export function Dashboard() {
  const { theme, toggle } = useTheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [research, setResearch] = useState<Research[]>([]);
  const [featuredStartups, setFeaturedStartups] = useState<Startup[]>([]);
  const [pins, setPins] = useState<PinnedItem[]>([]);
  const [updates, setUpdates] = useState<unknown[]>([]);
  const [starredStartups, setStarredStartups] = useState<{ id: string; name: string; cofounder_linkedins?: { name: string; url: string }[] }[]>([]);
  const [dismissedSet, setDismissedSet] = useState<Set<string>>(new Set());
  const [sector, setSector] = useState("All");
  const [stage, setStage] = useState("");
  const [timeRange, setTimeRange] = useState("today_future");
  const [startupView, setStartupView] = useState<"news" | "accelerators" | "academic">("news");
  const [startupAccelerator, setStartupAccelerator] = useState("");
  const [startupUniversity, setStartupUniversity] = useState("");
  const [tab, setTab] = useState<TabType>("signals");
  const [loading, setLoading] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [notifiedStartups, setNotifiedStartups] = useState<{ id: string; name: string; cofounder_linkedins?: { name: string; url: string }[] }[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function load() {
      setArticlesError(null);
      const articleParams = new URLSearchParams();
      if (stage) articleParams.set("stage", stage);
      if (timeRange) articleParams.set("timeRange", timeRange);
      const articleQs = articleParams.toString() ? `?${articleParams}` : "";
      const res = await fetch(`/api/articles${articleQs}`);
      const json = await res.json();
      if (cancelled) return;
      if (json.error) {
        setArticlesError(json.error);
        setArticles([]);
      } else {
        const arts = Array.isArray(json.articles) ? json.articles : [];
        setArticles(arts as Article[]);
      }

      const researchParams = new URLSearchParams();
      if (sector !== "All") researchParams.set("sector", sector);
      if (timeRange) researchParams.set("timeRange", timeRange);
      const researchQs = researchParams.toString() ? `?${researchParams}` : "";
      const resResearch = await fetch(`/api/research${researchQs}`);
      const jsonResearch = await resResearch.json();
      if (!cancelled) setResearch(Array.isArray(jsonResearch.research) ? (jsonResearch.research as Research[]) : []);

      const startupParams = new URLSearchParams();
      if (sector !== "All") startupParams.set("sector", sector);
      startupParams.set("view", startupView);
      if (startupAccelerator) startupParams.set("accelerator", startupAccelerator);
      if (startupUniversity) startupParams.set("university", startupUniversity);
      const startupQs = startupParams.toString() ? `?${startupParams}` : "";
      const resStartups = await fetch(`/api/startups/featured${startupQs}`);
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

      const resDismissed = await fetch(`/api/dismissed?userId=${DEMO_USER_ID}`);
      const jsonDismissed = await resDismissed.json();
      if (!cancelled) setDismissedSet(new Set(Array.isArray(jsonDismissed.dismissed) ? jsonDismissed.dismissed : []));

      const resNotifications = await fetch(`/api/notifications?userId=${DEMO_USER_ID}`);
      const jsonNotifications = await resNotifications.json();
      if (!cancelled) {
        setDailyDigest(Boolean(jsonNotifications.dailyDigest));
        setNotifiedStartups(Array.isArray(jsonNotifications.startups) ? jsonNotifications.startups : []);
      }

      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [stage, sector, timeRange, startupView, startupAccelerator, startupUniversity]);

  const filtered =
    sector === "All"
      ? articles
      : articles.filter((a) => a.sector_tags?.includes(sector as never));
  const filteredArticles = filtered.filter((a) => !dismissedSet.has(`article:${a.id}`));

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

  const handleDismiss = async (itemType: string, itemId: string) => {
    await fetch("/api/dismissed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: DEMO_USER_ID, itemType, itemId }),
    });
    setDismissedSet((prev) => new Set([...prev, `${itemType}:${itemId}`]));
  };

  const handleDailyDigestToggle = async (enabled: boolean) => {
    await fetch("/api/notifications/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: DEMO_USER_ID, enabled }),
    });
    setDailyDigest(enabled);
  };

  const handleNotifyStartup = async (startupId: string, startupName: string) => {
    await fetch("/api/notifications/startups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: DEMO_USER_ID, startupId }),
    });
    setNotifiedStartups((prev) => (prev.some((x) => x.id === startupId) ? prev : [...prev, { id: startupId, name: startupName }]));
  };

  const handleUnnotifyStartup = async (startupId: string) => {
    await fetch(`/api/notifications/startups?userId=${DEMO_USER_ID}&startupId=${startupId}`, { method: "DELETE" });
    setNotifiedStartups((prev) => prev.filter((s) => s.id !== startupId));
  };

  const isNotified = (startupId: string) => notifiedStartups.some((s) => s.id === startupId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex items-center justify-between border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <h1 className="text-2xl font-bold">Venture Intelligence Daily</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-500">Time:</span>
          {TIME_RANGE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTimeRange(value)}
              className={`rounded px-2 py-1 text-sm ${
                timeRange === value ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              {label}
            </button>
          ))}
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
            onUnpin={handleUnpin}
            pinnedEventIds={new Set(pins.filter((p) => p.item_type === "event").map((p) => p.item_id))}
            dismissedEventIds={new Set([...dismissedSet].filter((k) => k.startsWith("event:")).map((k) => k.replace("event:", "")))}
            onDismiss={handleDismiss}
            timeRange={timeRange}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            {([
              { id: "signals" as TabType, label: "Feed" },
              { id: "research" as TabType, label: "Research" },
              { id: "startups" as TabType, label: "Startups to Watch" },
              { id: "tracked" as TabType, label: "Tracked Startups" },
              { id: "pinned" as TabType, label: "Pinned" },
              { id: "notifications" as TabType, label: "Notifications" },
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
                  {filteredArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onStar={handleStar}
                      onUnstar={handleUnstar}
                      starredStartups={starredStartups}
                      onPin={handlePin}
                      onUnpin={handleUnpin}
                      isPinned={isPinned("article", article.id)}
                      onDismiss={handleDismiss}
                    />
                  ))}
                  {filteredArticles.length === 0 && (
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
                  {research.filter((r) => !dismissedSet.has(`research:${r.id}`)).map((r) => (
                    <ResearchCard
                      key={r.id}
                      research={r}
                      onPin={handlePin}
                      onUnpin={handleUnpin}
                      isPinned={isPinned("research", r.id)}
                      onDismiss={handleDismiss}
                    />
                  ))}
                  {research.filter((r) => !dismissedSet.has(`research:${r.id}`)).length === 0 && (
                    <p className="text-neutral-500">No research yet. Add research sources or run research ingest.</p>
                  )}
                </div>
              )}
            </>
          )}

          {tab === "startups" && (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="mr-2 self-center text-sm text-neutral-500">Source:</span>
                {(["news", "accelerators", "academic"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setStartupView(v);
                      setStartupAccelerator("");
                      setStartupUniversity("");
                    }}
                    className={`rounded px-3 py-1 text-sm ${
                      startupView === v ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                  >
                    {v === "news" ? "In the news" : v === "accelerators" ? "Accelerators" : "Academic spinoffs"}
                  </button>
                ))}
              </div>
              {startupView === "accelerators" && (
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="mr-2 self-center text-sm text-neutral-500">Accelerator:</span>
                  {ACCELERATOR_FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStartupAccelerator(startupAccelerator === value ? "" : value)}
                      className={`rounded px-3 py-1 text-sm ${
                        startupAccelerator === value ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {startupView === "academic" && (
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="mr-2 self-center text-sm text-neutral-500">University:</span>
                  {UNIVERSITY_FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStartupUniversity(startupUniversity === value ? "" : value)}
                      className={`rounded px-3 py-1 text-sm ${
                        startupUniversity === value ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
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
                  {featuredStartups.filter((s) => !dismissedSet.has(`startup:${s.id}`)).map((s) => (
                    <FeaturedStartupCard
                      key={s.id}
                      startup={s}
                      onStar={handleStar}
                      onUnstar={handleUnstar}
                      starredStartups={starredStartups}
                      onPin={handlePin}
                      onUnpin={handleUnpin}
                      isPinned={isPinned("startup", s.id)}
                      onNotify={handleNotifyStartup}
                      onUnnotify={handleUnnotifyStartup}
                      isNotified={isNotified(s.id)}
                      onDismiss={handleDismiss}
                    />
                  ))}
                  {featuredStartups.filter((s) => !dismissedSet.has(`startup:${s.id}`)).length === 0 && (
                    <p className="text-neutral-500">
                      {startupView === "accelerators"
                        ? "No accelerator-backed startups yet. Run ingestion to discover them from news."
                        : startupView === "academic"
                        ? "No academic spinoffs yet. Run ingestion to discover them from news."
                        : "No startups to watch yet. Run ingestion to discover startups from news."}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {tab === "pinned" && (
            <div className="space-y-4">
              {pins.length === 0 ? (
                <p className="text-neutral-500">No pinned items. Pin news, research, events, or startups from other tabs.</p>
              ) : (
                pins.map((pin) => {
                  const cofounderLinkedIns = (pin as PinnedItem & { cofounder_linkedins?: { name: string; url: string }[] }).cofounder_linkedins;
                  return (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">{pin.item_type}</span>
                      <a
                        href={pin.item_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 font-medium hover:underline"
                      >
                        {pin.item_title || pin.item_id}
                      </a>
                      {Array.isArray(cofounderLinkedIns) && cofounderLinkedIns.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {cofounderLinkedIns.map((c) => (
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
                    </div>
                    <div className="flex items-center gap-1">
                      {pin.item_type === "startup" && (
                        <button
                          type="button"
                          onClick={() =>
                            isNotified(pin.item_id)
                              ? handleUnnotifyStartup(pin.item_id)
                              : handleNotifyStartup(pin.item_id, pin.item_title || pin.item_id)
                          }
                          className="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          title={isNotified(pin.item_id) ? "Unsubscribe from updates" : "Get email updates for this startup"}
                        >
                          <BellIcon on={isNotified(pin.item_id)} size={18} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleUnpin(pin.item_type, pin.item_id)}
                        className="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title="Unpin"
                      >
                        <PinIcon pinned size={18} />
                      </button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "notifications" && (
            <div className="space-y-6">
              <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="font-semibold">Daily updates</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Get a daily email with must-read news, updates to startups you track, and similar articles and startups.
                </p>
                <button
                  type="button"
                  onClick={() => handleDailyDigestToggle(!dailyDigest)}
                  className={`mt-3 rounded-lg px-4 py-2 text-sm font-medium ${
                    dailyDigest ? "bg-neutral-200 dark:bg-neutral-700" : "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  }`}
                >
                  {dailyDigest ? "Subscribed · Click to unsubscribe" : "Subscribe to daily updates"}
                </button>
              </section>
              <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="font-semibold">Startup update emails</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  You receive emails when there are updates about these startups.
                </p>
                {notifiedStartups.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-500">No startups. Use the bell icon on any startup to get update emails.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {notifiedStartups.map((s) => (
                      <li key={s.id} className="flex items-center justify-between rounded border border-neutral-100 p-2 dark:border-neutral-800">
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{s.name}</span>
                          {Array.isArray(s.cofounder_linkedins) && s.cofounder_linkedins.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-2">
                              {s.cofounder_linkedins.map((c: { name: string; url: string }) => (
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
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUnnotifyStartup(s.id)}
                          className="text-sm text-neutral-500 hover:underline"
                        >
                          Unsubscribe
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {tab === "tracked" && (
            <div className="space-y-4">
              <h3 className="font-semibold">Startups you&apos;re tracking</h3>
              {starredStartups.length === 0 ? (
                <p className="text-neutral-500">Star startups from Feed or Startups to Watch to track them here.</p>
              ) : (
                starredStartups.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{s.name}</span>
                      {Array.isArray(s.cofounder_linkedins) && s.cofounder_linkedins.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {s.cofounder_linkedins.map((c: { name: string; url: string }) => (
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
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          isNotified(s.id) ? handleUnnotifyStartup(s.id) : handleNotifyStartup(s.id, s.name)
                        }
                        className="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title={isNotified(s.id) ? "Unsubscribe from updates" : "Get email updates for this startup"}
                      >
                        <BellIcon on={isNotified(s.id)} size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnstar(s.id)}
                        className="rounded px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title="Stop tracking"
                      >
                        ★ Unstar
                      </button>
                    </div>
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
