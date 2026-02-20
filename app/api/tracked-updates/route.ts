import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const { data: starred } = await supabaseAdmin
      .from("starred_startups")
      .select("startup_id")
      .eq("user_id", userId);

    const startupIds = (starred || []).map((s) => s.startup_id).filter(Boolean);

    if (startupIds.length === 0) {
      return NextResponse.json({ updates: [] });
    }

    const { data: updates } = await supabaseAdmin
      .from("startup_updates")
      .select("*, startups(name)")
      .in("startup_id", startupIds)
      .order("published_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ updates: updates || [] });
  } catch (e) {
    console.error("Tracked updates error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 500 }
    );
  }
}
