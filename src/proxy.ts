import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import { ROUTES, safeNext } from "@/lib/routes";

export const config = {
  matcher: ["/journal/:path*", "/onboarding/:path*", "/sign-in", "/sign-up"],
};

const PROTECTED = [ROUTES.journal, "/onboarding"];
const AUTH_ONLY: string[] = [ROUTES.signIn, ROUTES.signUp];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasCookie = Boolean(getSessionCookie(request));

  if (!hasCookie && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = new URL(ROUTES.signIn, request.nextUrl);
    url.searchParams.set("next", safeNext(pathname + search));
    return NextResponse.redirect(url);
  }

  if (hasCookie && AUTH_ONLY.includes(pathname)) {
    return NextResponse.redirect(new URL(ROUTES.journal, request.nextUrl));
  }

  return NextResponse.next();
}
