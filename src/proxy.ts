import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PORTAL_USERNAMES = [
  process.env.APP_USERNAME_3 ?? "timemarket",
  process.env.APP_USERNAME_4 ?? "susana",
  // Time Market sub-usuarios por tienda
  "tm.vivar", "tm.terranova", "tm.chipana", "tm.playabrava", "tm.anibalpinto",
  "tm.tarapaca", "tm.losmolles", "tm.bilbao2", "tm.peninsula",
];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const username = req.auth?.user?.name;
  const isPortalUser = PORTAL_USERNAMES.includes(username ?? "");

  const path = req.nextUrl.pathname;
  const isLoginPage = path === "/login";
  const isAuthPage = path === "/forgot-password" || path === "/reset-password";
  const isLandingPage = path === "/landing";
  const isApiAuth = path.startsWith("/api/auth");
  const isApiGuia = path.startsWith("/api/guia") || path.startsWith("/api/liquidacion") || path.startsWith("/api/comprobante");
  const isPortalPage = path === "/portal";

  // Always allow auth and PDF API routes
  if (isApiAuth || isApiGuia) return NextResponse.next();

  // Páginas de recuperación de contraseña y landing pública (acceso sin login)
  if (isAuthPage || isLandingPage) return NextResponse.next();

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js)$).*)"],
};
