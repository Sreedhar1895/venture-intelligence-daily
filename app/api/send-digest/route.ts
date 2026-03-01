import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.DIGEST_FROM_EMAIL || "onboarding@resend.dev";

/** Build and send daily digest + startup update emails. Call from cron. */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ ok: false, message: "RESEND_API_KEY not set" });
  }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: topArticles } = await supabaseAdmin
      .from("articles")
      .select("id, title, url, source, summary")
      .gte("published_at", yesterday.toISOString())
      .order("relevance_score", { ascending: false })
      .limit(10);

    let digestSent = 0;
    let startupAlertsSent = 0;

    const { data: users } = await supabaseAdmin.from("users").select("id, email");
    if (!users?.length) return NextResponse.json({ digestSent, startupAlertsSent });

    for (const user of users) {
      if (!user.email) continue;

      const { data: prefs } = await supabaseAdmin.from("user_preferences").select("email_digest_enabled").eq("user_id", user.id).maybeSingle();
      if (prefs?.email_digest_enabled) {
        const { data: starred } = await supabaseAdmin.from("starred_startups").select("startup_id").eq("user_id", user.id);
        const startupIds = (starred ?? []).map((s) => s.startup_id);
        let updatesHtml = "";
        if (startupIds.length > 0) {
          const { data: updates } = await supabaseAdmin
            .from("startup_updates")
            .select("*, startups(name)")
            .in("startup_id", startupIds)
            .gte("published_at", yesterday.toISOString())
            .order("published_at", { ascending: false })
            .limit(15);
          if (updates?.length) {
            updatesHtml = "<h3>Updates from startups you track</h3><ul>" + (updates as { title: string; url?: string; startups?: { name: string } }[])
              .map((u) => `<li><a href="${u.url || "#"}">${u.title}</a> (${u.startups?.name ?? ""})</li>`).join("") + "</ul>";
          }
        }
        const articlesHtml = "<h3>Must-read news</h3><ul>" + (topArticles ?? []).map((a) => `<li><a href="${a.url}">${a.title}</a> (${a.source})</li>`).join("") + "</ul>";
        const html = `<p>Your daily Venture Intelligence summary.</p>${articlesHtml}${updatesHtml}<p>You can unsubscribe in the app under Notifications.</p>`;
        const { error } = await resend.emails.send({ from: FROM_EMAIL, to: user.email, subject: "Venture Intelligence Daily", html });
        if (!error) digestSent++;
      }

      const { data: notifSubs } = await supabaseAdmin.from("startup_notifications").select("startup_id").eq("user_id", user.id);
      const notifiedStartupIds = (notifSubs ?? []).map((s) => s.startup_id);
      for (const startupId of notifiedStartupIds) {
        const { data: startupUpdates } = await supabaseAdmin
          .from("startup_updates")
          .select("*, startups(name)")
          .eq("startup_id", startupId)
          .gte("published_at", yesterday.toISOString())
          .limit(5);
        if (startupUpdates?.length) {
          const startupName = (startupUpdates[0] as { startups?: { name: string } }).startups?.name ?? "Startup";
          const listHtml = (startupUpdates as { title: string; url?: string }[]).map((u) => `<li><a href="${u.url || "#"}">${u.title}</a></li>`).join("");
          const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: `Updates: ${startupName}`,
            html: `<p>New updates for <strong>${startupName}</strong>:</p><ul>${listHtml}</ul><p>Unsubscribe in the app under Notifications.</p>`,
          });
          if (!error) startupAlertsSent++;
        }
      }
    }

    return NextResponse.json({ ok: true, digestSent, startupAlertsSent });
  } catch (e) {
    console.error("Send digest error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Send failed" }, { status: 500 });
  }
}
