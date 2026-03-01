import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** Bulk backfill cofounder_linkedins for startups.
 * Body: { updates: { startup_id?: string, startup_name?: string, cofounder_linkedins: { name: string, url: string }[] }[] }
 * Use startup_id (UUID) or startup_name (matched case-insensitively). Optionally set x-backfill-secret header if BACKFILL_SECRET env is set.
 */
export async function POST(request: Request) {
  try {
    const secret = process.env.BACKFILL_SECRET;
    if (secret) {
      const header = request.headers.get("x-backfill-secret");
      if (header !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const updates = body?.updates;
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Body must include updates: array of { startup_id?: string, startup_name?: string, cofounder_linkedins: { name: string, url: string }[] }" },
        { status: 400 }
      );
    }

    let updated = 0;
    for (const row of updates) {
      const cofounderLinkedIns = Array.isArray(row.cofounder_linkedins)
        ? (row.cofounder_linkedins as { name: string; url: string }[]).filter(
            (c) => typeof c?.name === "string" && typeof c?.url === "string"
          )
        : [];
      if (cofounderLinkedIns.length === 0) continue;

      let id: string | null = null;
      if (row.startup_id && typeof row.startup_id === "string") {
        id = row.startup_id.trim();
      } else if (row.startup_name && typeof row.startup_name === "string") {
        const name = row.startup_name.trim();
        if (!name) continue;
        const { data: found } = await supabaseAdmin
          .from("startups")
          .select("id")
          .ilike("name", name)
          .limit(1)
          .maybeSingle();
        id = found?.id ?? null;
      }
      if (!id) continue;

      const { error } = await supabaseAdmin
        .from("startups")
        .update({ cofounder_linkedins: cofounderLinkedIns })
        .eq("id", id);

      if (!error) updated++;
    }

    return NextResponse.json({
      total: updates.length,
      updated,
      message: `Updated cofounder_linkedins for ${updated} startup(s).`,
    });
  } catch (e) {
    console.error("Backfill cofounder linkedins error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Backfill failed" },
      { status: 500 }
    );
  }
}
