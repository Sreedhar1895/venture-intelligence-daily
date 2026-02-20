import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("starred_startups")
      .select("startup_id, startups(name)")
      .eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const starred = (data || [])
      .map((s) => {
        const name = (s as { startups: { name: string } | null }).startups?.name;
        const id = (s as { startup_id: string }).startup_id;
        return name && id ? { id, name } : null;
      })
      .filter((x): x is { id: string; name: string } => x != null);

    return NextResponse.json({ starred });
  } catch (e) {
    console.error("Starred API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch starred" },
      { status: 500 }
    );
  }
}
