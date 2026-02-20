import { NextResponse } from "next/server";

/** Email digest is disabled for now. Re-enable by wiring Resend and uncommenting cron in vercel.json. */
export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Email digest is currently disabled.",
  });
}
