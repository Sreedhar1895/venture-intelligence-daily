import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("starred_startups")
      .select("startup_id, startups(name, cofounder_linkedins)")
      .eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const starred = (data || [])
      .map((s) => {
        const startups = (s as { startups: { name: string; cofounder_linkedins?: { name: string; url: string }[] } | null }).startups;
        const name = startups?.name;
        const id = (s as { startup_id: string }).startup_id;
        const cofounder_linkedins = Array.isArray(startups?.cofounder_linkedins) ? startups.cofounder_linkedins : undefined;
        return name && id ? { id, name, cofounder_linkedins } : null;
      })
      .filter((x): x is { id: string; name: string; cofounder_linkedins?: { name: string; url: string }[] } => x != null);

    return NextResponse.json({ starred });
  } catch (e) {
    console.error("Starred API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch starred" },
      { status: 500 }
    );
  }
}
