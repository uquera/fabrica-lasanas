import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/landing",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/portal",
];

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic || req.auth) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", req.url));
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
