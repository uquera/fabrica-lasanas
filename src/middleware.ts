import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PORTAL_USERNAME = process.env.APP_USERNAME_3 ?? "timemarket";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const username = req.auth?.user?.name;
  const isPortalUser = username === PORTAL_USERNAME;

  const path = req.nextUrl.pathname;
  const isLoginPage = path === "/login";
  const isApiAuth = path.startsWith("/api/auth");
  const isApiGuia = path.startsWith("/api/guia") || path.startsWith("/api/liquidacion");
  const isPortalPage = path === "/portal";

  // Always allow auth and PDF API routes
  if (isApiAuth || isApiGuia) return NextResponse.next();

  // Login page
  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(isPortalUser ? "/portal" : "/", req.url));
    }
    return NextResponse.next();
  }

  // Not logged in → login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Portal user can only access /portal
  if (isPortalUser && !isPortalPage) {
    return NextResponse.redirect(new URL("/portal", req.url));
  }

  // Regular users cannot access /portal
  if (!isPortalUser && isPortalPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
