import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const GET = handlers.GET;

// Wrap POST to rate-limit login attempts (10/minute per IP)
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`auth:${ip}`, 10, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }
  return handlers.POST(request);
}
