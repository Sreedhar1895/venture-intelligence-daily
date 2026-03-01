import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get("sector");
    const accelerator = searchParams.get("accelerator");
    const university = searchParams.get("university");
    const view = searchParams.get("view") || "news"; // news | accelerators | academic
    let query = supabaseAdmin
      .from("startups")
      .select("*")
      .eq("featured", true)
      .order("overall_score", { ascending: false, nullsFirst: false })
      .limit(100);
    if (sector && sector !== "All") {
      query = query.contains("sector_tags", [sector]);
    }
    if (view === "accelerators") {
      if (accelerator) query = query.eq("accelerator", accelerator);
      else query = query.not("accelerator", "is", null);
    }
    if (view === "academic") {
      if (university) query = query.eq("university", university);
      else query = query.not("university", "is", null);
    }
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const startups = (data ?? []).map((s) => ({
      ...s,
      links: Array.isArray(s.links) ? s.links : [],
      overall_score: s.overall_score ?? 0,
      signals: s.signals && typeof s.signals === "object" ? s.signals : {},
    }));
    return NextResponse.json({ startups });
  } catch (e) {
    console.error("Featured startups API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch startups" },
      { status: 500 }
    );
  }
}
