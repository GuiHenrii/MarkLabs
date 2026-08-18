import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  const publicPaths = [
    "/login",
    "/api/auth",
    "/api/debug",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Static assets and API routes should pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // If the user is not logged in and tries to access a protected route
  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If the user is logged in and tries to access login page, redirect to dashboard
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/select-team", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
