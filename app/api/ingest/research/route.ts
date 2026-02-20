import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { classifyResearch } from "@/lib/classifyResearch";
import { supabaseAdmin } from "@/lib/supabase";

const parser = new Parser();
const ARXIV_URL =
  "http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.RO&sortBy=submittedDate&sortOrder=descending&start=0&max_results=25";

async function fetchArxivPapers() {
  const res = await fetch(ARXIV_URL, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`arXiv API failed: ${res.status}`);
  const xml = await res.text();
  const feed = await parser.parseString(xml);
  return (feed.items || []).map((item) => {
    const link =
      typeof item.link === "string"
        ? item.link
        : (item as { links?: { url?: string }[] }).links?.[0]?.url;
    return {
      title: item.title || "",
      link: link || item.guid || "",
      abstract: (item.contentSnippet || item.content || "").replace(/\s+/g, " ").trim(),
      pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : null,
    };
  });
}

export async function POST() {
  try {
    const items = await fetchArxivPapers();
    const supabase = supabaseAdmin;
    let ingested = 0;

    for (const item of items) {
      if (!item.link || !item.title) continue;

      const { data: existing } = await supabase
        .from("research")
        .select("id")
        .eq("url", item.link)
        .maybeSingle();
      if (existing) continue;

      const classification = await classifyResearch(item.title, item.abstract || "");

      await supabase.from("research").insert({
        title: item.title,
        source: "arXiv",
        url: item.link,
        abstract: item.abstract?.slice(0, 15000) || null,
        published_at: item.pubDate,
        sector_tags: classification.sector_tags,
        summary: classification.summary,
        relevance_score: classification.relevance_score,
      });
      ingested++;
    }

    return NextResponse.json({ ingested });
  } catch (e) {
    console.error("Research ingest error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Research ingest failed" },
      { status: 500 }
    );
  }
}
