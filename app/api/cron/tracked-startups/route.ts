import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { classifyArticle } from "@/lib/classifyArticle";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: startups } = await supabaseAdmin.from("startups").select("id, name");
    if (!startups?.length) return NextResponse.json({ processed: 0 });

    let inserted = 0;
    for (const startup of startups) {
      // Placeholder: in production, call a news/search API with startup.name
      // Then for each result: classify with Claude, insert into startup_updates
      const mockTitle = `${startup.name} secures funding`;
      const mockContent = `${startup.name} announced new funding round.`;
      try {
        const classification = await classifyArticle(mockTitle, mockContent, startup.name);
        if (classification.relevance_score >= 5) {
          await supabaseAdmin.from("startup_updates").insert({
            startup_id: startup.id,
            update_type: classification.event_type,
            title: mockTitle,
            summary: classification.summary,
            source: "Manual / API",
            url: null,
            published_at: new Date().toISOString(),
          });
          inserted++;
        }
      } catch {
        // skip
      }
    }

    return NextResponse.json({ processed: startups.length, inserted });
  } catch (e) {
    console.error("Tracked startups cron error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cron failed" },
      { status: 500 }
    );
  }
}
