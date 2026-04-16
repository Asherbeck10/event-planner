import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const protectedPaths = ["/dashboard", "/events/new"];
  const isProtected =
    protectedPaths.some((path) => nextUrl.pathname.startsWith(path)) ||
    /^\/events\/[^/]+\/edit$/.test(nextUrl.pathname);

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${nextUrl.pathname}`, nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
