import { NextResponse } from "next/server";
import { extractStartupsFromArticle } from "@/lib/extractStartupsFromArticle";
import { computeArticleScoreForStartup } from "@/lib/startupScore";
import { supabaseAdmin } from "@/lib/supabase";

/** Backfill Startups to Watch from existing articles. Call once after initial ingest. */
export async function POST() {
  try {
    const supabase = supabaseAdmin;
    const { data: articles, error } = await supabase
      .from("articles")
      .select("id, title, url, raw_content, sector_tags, event_type")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!articles?.length) return NextResponse.json({ processed: 0, startupsAdded: 0 });

    let startupsAdded = 0;

    for (const article of articles) {
      const content = (article.raw_content as string) || "";
      const extracted = await extractStartupsFromArticle(article.title, content);
      const sourceLink = { label: "Source", url: article.url };

      for (const s of extracted) {
        const trimmedName = s.name.trim();
        if (!trimmedName) continue;

        const sectorTags = s.sector_relevance?.length
          ? s.sector_relevance
          : (article.sector_tags as string[] | null) ?? [];
        const points = computeArticleScoreForStartup(
          sectorTags,
          article.event_type as string | null,
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
          const hasLink = links.some((l: { url?: string }) => l.url === article.url);
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
          startupsAdded++;
        }
      }
    }

    return NextResponse.json({
      processed: articles.length,
      startupsAdded,
      message: `Processed ${articles.length} articles. Startups table updated.`,
    });
  } catch (e) {
    console.error("Backfill startups error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Backfill failed" },
      { status: 500 }
    );
  }
}
