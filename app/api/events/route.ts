import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const today = new Date().toISOString().slice(0, 10);
    let query = supabaseAdmin
      .from("events")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(100);
    if (city && city !== "All") {
      query = query.eq("city", city);
    }
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ events: data ?? [] });
  } catch (e) {
    console.error("Events API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch events" },
      { status: 500 }
    );
  }
}
