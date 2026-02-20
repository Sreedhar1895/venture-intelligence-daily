import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "articles";

  try {
    if (type === "articles") {
      const { data } = await supabaseAdmin
        .from("articles")
        .select("title, source, url, event_type, relevance_score, summary")
        .order("relevance_score", { ascending: false })
        .limit(500);

      const headers = ["title", "source", "url", "event_type", "relevance_score", "summary"];
      const rows = (data || []).map((r) =>
        headers.map((h) => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`).join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=articles.csv",
        },
      });
    }

    if (type === "startups") {
      const { data } = await supabaseAdmin.from("startups").select("name, website, sector_tags");
      const headers = ["name", "website", "sector_tags"];
      const rows = (data || []).map((r) =>
        headers.map((h) => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`).join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=startups.csv",
        },
      });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    );
  }
}
