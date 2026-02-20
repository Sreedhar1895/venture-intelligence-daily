import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// When adding scraped/API sources (Lu.ma, Eventbrite, etc.), validate each event with
// validateEventRelevance() from @/lib/validateEvent before inserting - skip insert if !relevant.

type EventTemplate = {
  title: string;
  city: string;
  month: number; // 1-12
  day: number;
  url: string;
  registration_url?: string;
  source: string;
  event_type: string;
  sector_tags?: string[];
};

const EVENT_TEMPLATES: EventTemplate[] = [
  { title: "Y Combinator Demo Day", city: "San Francisco", month: 3, day: 26, url: "https://www.ycombinator.com/demoday", registration_url: "https://www.ycombinator.com/demoday", source: "YC", event_type: "demo_day", sector_tags: ["AI-native"] },
  { title: "Techstars Demo Day", city: "Various", month: 4, day: 15, url: "https://www.techstars.com/accelerators", source: "Techstars", event_type: "demo_day" },
  { title: "NeurIPS", city: "Vancouver", month: 12, day: 8, url: "https://nips.cc", registration_url: "https://nips.cc/register", source: "NeurIPS", event_type: "conference", sector_tags: ["AI-native"] },
  { title: "ICML", city: "Vienna", month: 7, day: 21, url: "https://icml.cc", registration_url: "https://icml.cc/register", source: "ICML", event_type: "conference", sector_tags: ["AI-native"] },
  { title: "ICLR", city: "Singapore", month: 5, day: 5, url: "https://iclr.cc", registration_url: "https://iclr.cc/register", source: "ICLR", event_type: "conference", sector_tags: ["AI-native"] },
  { title: "ICRA", city: "Hong Kong", month: 5, day: 26, url: "https://www.ieee-ras.org/conferences-workshops/fully-sponsored/icra", registration_url: "https://www.ieee-ras.org/conferences-workshops/fully-sponsored/icra", source: "IEEE RAS", event_type: "conference", sector_tags: ["Robotics"] },
  { title: "RSS", city: "Delft", month: 7, day: 14, url: "https://roboticsconference.org", source: "RSS", event_type: "conference", sector_tags: ["Robotics"] },
  { title: "TechCrunch Disrupt", city: "San Francisco", month: 10, day: 20, url: "https://techcrunch.com/events/disrupt", registration_url: "https://techcrunch.com/events/disrupt", source: "TechCrunch", event_type: "conference" },
  { title: "All In Summit", city: "Los Angeles", month: 9, day: 19, url: "https://allinsummit.com", registration_url: "https://allinsummit.com", source: "All In", event_type: "conference" },
];

// URLs of events removed from curated list - delete from DB on ingest
const REMOVED_URLS = ["https://www.sxsw.com"];

function toFutureDate(month: number, day: number): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let year = now.getFullYear();
  const d = new Date(year, month - 1, day);
  if (d < today) year += 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export async function POST() {
  try {
    const supabase = supabaseAdmin;
    for (const url of REMOVED_URLS) {
      await supabase.from("events").delete().eq("url", url);
    }
    let ingested = 0;
    for (const ev of EVENT_TEMPLATES) {
      const date = toFutureDate(ev.month, ev.day);
      const { error } = await supabase.from("events").upsert(
        {
          title: ev.title,
          city: ev.city,
          date,
          url: ev.url,
          registration_url: ev.registration_url || null,
          source: ev.source,
          event_type: ev.event_type,
          sector_tags: ev.sector_tags || [],
        },
        { onConflict: "url" }
      );
      if (!error) ingested++;
    }

    return NextResponse.json({ ingested });
  } catch (e) {
    console.error("Events ingest error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Events ingest failed" },
      { status: 500 }
    );
  }
}
