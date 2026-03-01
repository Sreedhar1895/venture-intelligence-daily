import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const timeRange = searchParams.get("timeRange") || "today_future"; // today_future | 7d | 30d | 90d
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let fromDate: string | null = null;
    if (timeRange === "7d") {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      fromDate = d.toISOString();
    } else if (timeRange === "30d") {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      fromDate = d.toISOString();
    } else if (timeRange === "90d") {
      const d = new Date(today);
      d.setDate(d.getDate() - 90);
      fromDate = d.toISOString();
    }
    // today_future: no lower bound (show all)
    let query = supabaseAdmin
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("relevance_score", { ascending: false })
      .limit(100);
    if (fromDate) query = query.gte("published_at", fromDate);
    if (timeRange === "today_future") query = query.gte("published_at", today.toISOString());
    if (stage && ["early_stage", "growth_late_stage", "public_pe"].includes(stage)) {
      query = query.eq("stage", stage);
    }
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ articles: data ?? [] });
  } catch (e) {
    console.error("Articles API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
