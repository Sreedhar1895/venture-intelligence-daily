import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** GET: daily digest status + list of startups user is notifying on */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const { data: prefs } = await supabaseAdmin
      .from("user_preferences")
      .select("email_digest_enabled")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: subs } = await supabaseAdmin
      .from("startup_notifications")
      .select("startup_id")
      .eq("user_id", userId);

    const startupIds = (subs ?? []).map((s) => s.startup_id).filter(Boolean);
    let startups: { id: string; name: string; cofounder_linkedins?: { name: string; url: string }[] }[] = [];
    if (startupIds.length > 0) {
      const { data: startupRows } = await supabaseAdmin
        .from("startups")
        .select("id, name, cofounder_linkedins")
        .in("id", startupIds);
      startups = (startupRows ?? []).map((s) => ({
        id: s.id,
        name: s.name ?? "",
        cofounder_linkedins: Array.isArray(s.cofounder_linkedins) ? s.cofounder_linkedins : undefined,
      }));
    }

    return NextResponse.json({
      dailyDigest: prefs?.email_digest_enabled ?? false,
      startups,
    });
  } catch (e) {
    console.error("Notifications GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
