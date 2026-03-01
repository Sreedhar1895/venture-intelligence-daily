import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const YC_API_URL = "https://api.ycombinator.com/v0.1/companies";

interface YCCompany {
  id: number;
  name: string;
  slug: string;
  website?: string;
  oneLiner?: string;
  longDescription?: string;
  url?: string;
  batch?: string;
  tags?: string[];
}

async function fetchAllYCCompanies(): Promise<YCCompany[]> {
  const companies: YCCompany[] = [];
  let url: string | null = YC_API_URL;

  while (url) {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`YC API failed: ${res.status}`);
    const data = (await res.json()) as { companies?: YCCompany[]; nextPage?: string };
    if (data.companies?.length) companies.push(...data.companies);
    url = data.nextPage || null;
  }

  return companies;
}

function mapYCTagsToSector(tags: string[] | undefined): string[] {
  if (!tags?.length) return [];
  const sectorMap: Record<string, string> = {
    AI: "AI-native",
    "Artificial Intelligence": "AI-native",
    "Generative AI": "AI-native",
    Fintech: "Fintech",
    Robotics: "Robotics",
    SaaS: "Vertical SaaS",
  };
  return [...new Set(tags.filter((t) => sectorMap[t]).map((t) => sectorMap[t]))];
}

export async function POST() {
  try {
    const companies = await fetchAllYCCompanies();
    const supabase = supabaseAdmin;
    let ingested = 0;

    for (const c of companies) {
      if (!c.name?.trim()) continue;

      const { data: existing } = await supabase
        .from("startups")
        .select("id")
        .ilike("name", c.name.trim())
        .limit(1)
        .maybeSingle();

      const sectorTags = mapYCTagsToSector(c.tags);
      const sourceLink = c.url
        ? { label: "YC", url: c.url }
        : { label: "Website", url: c.website || "#" };

      if (existing) {
        const { data: current } = await supabase.from("startups").select("links, sector_tags").eq("id", existing.id).single();
        const links = Array.isArray(current?.links) ? (current.links as { url?: string }[]) : [];
        const hasYcLink = links.some((l) => l.url === c.url || l.url === c.website);
        const newLinks = hasYcLink ? links : [...links, sourceLink];
        const newSectorTags = sectorTags.length ? sectorTags : ((current?.sector_tags as string[]) || ["Other"]);
        await supabase
          .from("startups")
          .update({
            accelerator: "YC",
            batch: c.batch || null,
            sector_tags: newSectorTags,
            why_interesting: c.oneLiner || null,
            website: c.website || null,
            featured: true,
            links: newLinks,
          })
          .eq("id", existing.id);
        ingested++;
      } else {
        await supabase.from("startups").insert({
          name: c.name.trim(),
          website: c.website || null,
          sector_tags: sectorTags.length ? sectorTags : ["Other"],
          why_interesting: c.oneLiner || c.longDescription?.slice(0, 300) || null,
          founding_team: null,
          featured: true,
          overall_score: 1,
          accelerator: "YC",
          batch: c.batch || null,
          links: [sourceLink],
        });
        ingested++;
      }
    }

    return NextResponse.json({ ingested });
  } catch (e) {
    console.error("Accelerator ingest error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Accelerator ingest failed" },
      { status: 500 }
    );
  }
}
