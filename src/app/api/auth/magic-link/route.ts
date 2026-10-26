import { NextRequest, NextResponse } from "next/server";
import { authStore } from "@/lib/auth-store";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ success: false, error: "Email parameter is required" }, { status: 400 });
  }

  const record = authStore.getLatestMagicLinkRecord(email);

  if (!record) {
    return NextResponse.json({ success: false, message: "No active magic link found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    email,
    url: record.url,
    delivered: record.delivered,
    error: record.error || null,
  });
}
