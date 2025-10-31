// middleware.ts - FIXED VERSION

import { auth } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, publicRoutes } from "@/routes";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute =
    publicRoutes.includes(nextUrl.pathname) ||
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/tours") ||
    nextUrl.pathname.startsWith("/blog") ||
    nextUrl.pathname.startsWith("/about");
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  console.log("🔍 Middleware Debug Info:");
  console.log("➡️ Path:", nextUrl.pathname);
  console.log("🧍 Logged In:", isLoggedIn);
  console.log("🎭 User Role:", userRole);
  console.log("🛣️ isApiAuthRoute:", isApiAuthRoute);
  console.log("🌍 isPublicRoute:", isPublicRoute);
  console.log("🔐 isAuthRoute:", isAuthRoute);

  // Allow API auth routes
  if (isApiAuthRoute) {
    console.log("✅ Allowing API auth route");
    return null;
  }

  // Handle auth routes (login, register, etc.)
  if (isAuthRoute) {
    if (isLoggedIn) {
      let redirectUrl = DEFAULT_LOGIN_REDIRECT;
      if (userRole === "Admin") redirectUrl = "/admin/dashboard";
      else if (userRole === "Operator") redirectUrl = "/operator/dashboard";

      console.log("🔁 Redirecting logged-in user from auth route to:", redirectUrl);
      return Response.redirect(new URL(redirectUrl, nextUrl));
    }
    console.log("✅ Allowing unauthenticated access to auth route");
    return null;
  }

  // Allow public routes
  if (isPublicRoute) {
    console.log("✅ Allowing public route");
    return null;
  }

  // SPECIAL CASE: /operator/apply - requires login but NOT operator role
  if (nextUrl.pathname === "/operator/apply") {
    if (!isLoggedIn) {
      console.log("🚫 /operator/apply requires login, redirecting to /login");
      return Response.redirect(new URL("/login?callbackUrl=/operator/apply", nextUrl));
    }
    // Already an operator with profile? Redirect to dashboard
    // (This check happens in the page component itself)
    console.log("✅ Allowing logged-in user to access /operator/apply");
    return null;
  }

  // Require authentication for all other routes
  if (!isLoggedIn) {
    console.log("🚫 Not logged in, redirecting to /login");
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Role-based protection for /operator/* routes (except /operator/apply handled above)
  if (nextUrl.pathname.startsWith("/operator")) {
    if (userRole !== "Operator") {
      console.log("🚫 Access denied: non-Operator trying to access /operator route");
      return Response.redirect(new URL("/", nextUrl));
    } else {
      console.log("✅ Operator access granted");
    }
  }

  // Role-based protection for /admin routes
  if (nextUrl.pathname.startsWith("/admin")) {
    if (userRole !== "Admin") {
      console.log("🚫 Access denied: non-Admin trying to access /admin route");
      return Response.redirect(new URL("/", nextUrl));
    } else {
      console.log("✅ Admin access granted");
    }
  }

  // Customer routes - just need to be logged in
  if (nextUrl.pathname.startsWith("/customer")) {
    if (!isLoggedIn) {
      console.log("🚫 Unauthenticated user trying to access /customer route");
      return Response.redirect(new URL("/login", nextUrl));
    } else {
      console.log("✅ Customer access granted");
    }
  }

  console.log("✅ Request allowed to proceed");
  return null;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};