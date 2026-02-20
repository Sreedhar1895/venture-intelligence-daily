import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { classifyArticle } from "@/lib/classifyArticle";
import { supabaseAdmin } from "@/lib/supabase";

const parser = new Parser();
const RSS_FEEDS = [
  { url: "https://techcrunch.com/feed/", source: "TechCrunch" },
];

async function fetchFeed(url: string) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map((item) => ({
      title: item.title || "",
      link: item.link || "",
      content: item.contentSnippet || item.content || "",
      pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : null,
    }));
  } catch {
    return [];
  }
}

export async function POST() {
  try {
    const supabase = supabaseAdmin;
    const seen = new Set<string>();
    let ingested = 0;

    for (const feed of RSS_FEEDS) {
      const items = await fetchFeed(feed.url);
      for (const item of items) {
        if (!item.link || seen.has(item.link)) continue;
        seen.add(item.link);

        const { data: existing } = await supabase.from("articles").select("id").eq("url", item.link).single();
        if (existing) continue;

        const classification = await classifyArticle(item.title, item.content, null);

        await supabase.from("articles").insert({
          title: item.title,
          source: feed.source,
          url: item.link,
          published_at: item.pubDate,
          raw_content: item.content.slice(0, 50000),
          sector_tags: classification.sector_tags,
          event_type: classification.event_type,
          summary: classification.summary,
          strategic_note: classification.strategic_note,
          relevance_score: classification.relevance_score,
        });
        ingested++;
      }
    }

    return NextResponse.json({ ingested });
  } catch (e) {
    console.error("Ingest error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ingest failed" }, { status: 500 });
  }
}
