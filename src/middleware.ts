import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Stripe webhook endpoint must NOT require auth cookies —
  // Stripe POSTs directly. Auth is handled via stripe-signature header.
  if (request.nextUrl.pathname === "/api/billing/webhook") {
    return NextResponse.next();
  }

  const token =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!token) {
    const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Redirect to login with a safe callbackUrl (pathname only, no external URLs)
    const callbackPath = request.nextUrl.pathname;
    const loginUrl = new URL("/login", request.url);
    if (callbackPath.startsWith("/")) {
      loginUrl.searchParams.set("callbackUrl", callbackPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/episodes/:path*",
    "/api/content/:path*",
    "/api/upload/:path*",
    "/api/style-profile/:path*",
    "/api/billing/:path*",
  ],
};
