import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("articles")
      .select("*")
      .order("relevance_score", { ascending: false })
      .limit(100);
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
