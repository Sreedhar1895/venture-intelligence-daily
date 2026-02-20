import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get("sector");
    let query = supabaseAdmin
      .from("research")
      .select("*")
      .order("relevance_score", { ascending: false })
      .limit(50);
    if (sector && sector !== "All") {
      query = query.contains("sector_tags", [sector]);
    }
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ research: data ?? [] });
  } catch (e) {
    console.error("Research API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch research" },
      { status: 500 }
    );
  }
}
