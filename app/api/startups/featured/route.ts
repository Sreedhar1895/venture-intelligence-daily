import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("startups")
      .select("*")
      .eq("featured", true)
      .order("overall_score", { ascending: false, nullsFirst: false })
      .limit(50);
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
