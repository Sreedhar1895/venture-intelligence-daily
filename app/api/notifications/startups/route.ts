import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** POST: subscribe to startup updates (add to startup_notifications) */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, startupId } = body as { userId?: string; startupId?: string };
    if (!userId || !startupId) {
      return NextResponse.json({ error: "userId and startupId required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from("startup_notifications").upsert(
      { user_id: userId, startup_id: startupId },
      { onConflict: "user_id,startup_id" }
    ).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ subscribed: true, id: data?.id });
  } catch (e) {
    console.error("Notify startup error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

/** DELETE: unsubscribe from startup updates */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const startupId = searchParams.get("startupId");
    if (!userId || !startupId) {
      return NextResponse.json({ error: "userId and startupId required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("startup_notifications")
      .delete()
      .eq("user_id", userId)
      .eq("startup_id", startupId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Unsubscribe startup error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
