import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasAccess = request.cookies.get("portfolio_access")?.value === "true";
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  if (isLoginPage) {
    return NextResponse.next();
  }

  if (!hasAccess) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/portfolio/:path*", "/reports/:path*"],
};