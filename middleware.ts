// middleware.ts
import { auth } from "@/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const path = nextUrl.pathname;

  // Skip API auth routes
  if (path.startsWith("/api/auth")) return null;

  // Public routes (inline - from your routes.ts)
  const isPublic =
    path === "/" ||
    path === "/verify" ||
    path.startsWith("/tours") ||
    path.startsWith("/blog") ||
    path.startsWith("/about");

  if (isPublic) return null;

  // Auth routes (inline - from your routes.ts)
  const authRoutes = [
    "/login",
    "/register",
    "/error",
    "/resend",
    "/reset",
    "/new-password",
    "/two-factor"
  ];

  const isAuthRoute = authRoutes.includes(path);

  if (isAuthRoute) {
    if (!isLoggedIn) return null; // Allow access to auth pages when not logged in

    // Redirect logged-in users away from auth pages
    const dest =
      role === "Admin" ? "/admin/dashboard" :
        role === "Operator" ? "/operator/dashboard" :
          "/";

    return Response.redirect(new URL(dest, nextUrl));
  }

  // Special case: /operator/apply (requires login but NOT operator role)
  if (path === "/operator/apply") {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/login?callbackUrl=/operator/apply", nextUrl));
    }
    return null; // Allow logged-in users (page will handle if they're already an operator)
  }

  // All other routes require authentication
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(path + nextUrl.search);
    return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  // Role-based protection for /operator routes (except /operator/apply handled above)
  if (path.startsWith("/operator") && role !== "Operator") {
    return Response.redirect(new URL("/", nextUrl));
  }

  // Role-based protection for /admin routes
  if (path.startsWith("/admin") && role !== "Admin") {
    return Response.redirect(new URL("/", nextUrl));
  }

  // Allow authenticated users to proceed
  return null;
});

// Optimized matcher - exclude static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};