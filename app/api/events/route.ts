import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const timeRange = searchParams.get("timeRange") || "today_future";
    const today = new Date().toISOString().slice(0, 10);
    let query = supabaseAdmin
      .from("events")
      .select("*")
      .order("date", { ascending: timeRange === "today_future" })
      .limit(100);
    if (timeRange === "today_future") {
      query = query.gte("date", today);
    } else {
      const now = new Date();
      let fromDate: string;
      if (timeRange === "7d") {
        const d = new Date(now); d.setDate(d.getDate() - 7); fromDate = d.toISOString().slice(0, 10);
      } else if (timeRange === "30d") {
        const d = new Date(now); d.setDate(d.getDate() - 30); fromDate = d.toISOString().slice(0, 10);
      } else if (timeRange === "90d") {
        const d = new Date(now); d.setDate(d.getDate() - 90); fromDate = d.toISOString().slice(0, 10);
      } else {
        fromDate = "1970-01-01";
      }
      query = query.lt("date", today).gte("date", fromDate);
    }
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
