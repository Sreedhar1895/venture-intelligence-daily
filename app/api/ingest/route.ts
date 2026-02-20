import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { classifyArticle } from "@/lib/classifyArticle";
import { extractStartupsFromArticle } from "@/lib/extractStartupsFromArticle";
import { computeArticleScoreForStartup } from "@/lib/startupScore";
import { supabaseAdmin } from "@/lib/supabase";

const parser = new Parser();
const RSS_FEEDS = [
  { url: "https://techcrunch.com/feed/", source: "TechCrunch" },
  { url: "https://venturebeat.com/feed/", source: "VentureBeat" },
  { url: "https://news.crunchbase.com/feed/", source: "Crunchbase News" },
  { url: "https://www.finsmes.com/feed/", source: "FinSMEs" },
  { url: "https://pitchbook.com/news/rss", source: "PitchBook" },
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
          stage: classification.stage,
          summary: classification.summary,
          strategic_note: classification.strategic_note,
          relevance_score: classification.relevance_score,
        });
        ingested++;

        // Extract startups from article and upsert into Startups to Watch (rubric score)
        const extracted = await extractStartupsFromArticle(item.title, item.content);
        const sourceLink = { label: "Source", url: item.link };
        for (const s of extracted) {
          const trimmedName = s.name.trim();
          if (!trimmedName) continue;
          const sectorTags = s.sector_relevance?.length ? s.sector_relevance : classification.sector_tags;
          const points = computeArticleScoreForStartup(
            sectorTags,
            classification.event_type,
            s.signed_customers,
            s.team_grew,
            s.raised_funding
          );
          if (points <= 0) continue;
          const signals = {
            signed_customers: s.signed_customers,
            team_grew: s.team_grew,
            raised_funding: s.raised_funding,
          };
          const { data: existing } = await supabase
            .from("startups")
            .select("id, links, overall_score, moat_note, signals")
            .ilike("name", trimmedName)
            .limit(1)
            .maybeSingle();
          const newOverall = (existing?.overall_score ?? 0) + points;
          if (existing) {
            const links = Array.isArray(existing.links) ? existing.links : [];
            const hasLink = links.some((l: { url?: string }) => l.url === item.link);
            const existingSignals = (existing.signals as Record<string, boolean>) || {};
            await supabase
              .from("startups")
              .update({
                why_interesting: s.why_interesting || (existing as { why_interesting?: string }).why_interesting,
                featured: newOverall > 0,
                sector_tags: sectorTags,
                overall_score: newOverall,
                moat_note: s.moat_note || (existing.moat_note as string) || null,
                signals: {
                  signed_customers: existingSignals.signed_customers || s.signed_customers,
                  team_grew: existingSignals.team_grew || s.team_grew,
                  raised_funding: existingSignals.raised_funding || s.raised_funding,
                },
                links: hasLink ? links : [...links, sourceLink],
              })
              .eq("id", existing.id);
          } else {
            await supabase.from("startups").insert({
              name: trimmedName,
              website: null,
              sector_tags: sectorTags,
              why_interesting: s.why_interesting,
              founding_team: null,
              featured: newOverall > 0,
              overall_score: newOverall,
              moat_note: s.moat_note,
              signals,
              links: [sourceLink],
            });
          }
        }
      }
    }

    return NextResponse.json({ ingested });
  } catch (e) {
    console.error("Ingest error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ingest failed" }, { status: 500 });
  }
}
