import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from("dismissed_items")
      .select("item_type, item_id")
      .eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const dismissed = (data ?? []).map((r) => `${r.item_type}:${r.item_id}`);
    return NextResponse.json({ dismissed });
  } catch (e) {
    console.error("Dismissed API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch dismissed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, itemType, itemId } = body;
    if (!userId || !itemType || !itemId) {
      return NextResponse.json({ error: "userId, itemType, itemId required" }, { status: 400 });
    }
    if (!["article", "event", "research", "startup"].includes(itemType)) {
      return NextResponse.json({ error: "itemType must be article|event|research|startup" }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from("dismissed_items").upsert(
      { user_id: userId, item_type: itemType, item_id: itemId },
      { onConflict: "user_id,item_type,item_id" }
    ).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ dismissed: data });
  } catch (e) {
    console.error("Dismiss API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to dismiss" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const itemType = searchParams.get("itemType");
    const itemId = searchParams.get("itemId");
    if (!userId || !itemType || !itemId) {
      return NextResponse.json({ error: "userId, itemType, itemId required" }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("dismissed_items")
      .delete()
      .eq("user_id", userId)
      .eq("item_type", itemType)
      .eq("item_id", itemId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Undismiss API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to undismiss" },
      { status: 500 }
    );
  }
}
