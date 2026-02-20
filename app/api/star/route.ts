import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, startupName, startupWebsite, sectorTags } = body as {
      userId: string;
      startupName: string;
      startupWebsite?: string;
      sectorTags?: string[];
    };

    if (!userId || !startupName) {
      return NextResponse.json({ error: "userId and startupName required" }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    let { data: startup } = await supabase
      .from("startups")
      .select("id")
      .ilike("name", startupName.trim())
      .single();

    if (!startup) {
      const { data: inserted } = await supabase
        .from("startups")
        .insert({
          name: startupName.trim(),
          website: startupWebsite || null,
          sector_tags: sectorTags || [],
        })
        .select("id")
        .single();
      startup = inserted;
    }

    if (!startup) return NextResponse.json({ error: "Failed to get/create startup" }, { status: 500 });

    await supabase.from("starred_startups").upsert(
      { user_id: userId, startup_id: startup.id },
      { onConflict: "user_id,startup_id" }
    );

    return NextResponse.json({ startupId: startup.id });
  } catch (e) {
    console.error("Star error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Star failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const startupId = searchParams.get("startupId");

    if (!userId || !startupId) {
      return NextResponse.json({ error: "userId and startupId required" }, { status: 400 });
    }

    await supabaseAdmin
      .from("starred_startups")
      .delete()
      .eq("user_id", userId)
      .eq("startup_id", startupId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Unstar error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unstar failed" },
      { status: 500 }
    );
  }
}
