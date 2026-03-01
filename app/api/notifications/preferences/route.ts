import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** POST: subscribe (enabled: true) or unsubscribe (enabled: false) from daily digest */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, enabled } = body as { userId?: string; enabled?: boolean };
    if (!userId || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "userId and enabled required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("user_preferences").upsert(
      { user_id: userId, email_digest_enabled: enabled },
      { onConflict: "user_id" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ dailyDigest: enabled });
  } catch (e) {
    console.error("Notifications preferences error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
