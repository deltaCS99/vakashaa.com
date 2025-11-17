// middleware.ts
import { auth } from "@/auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes
} from "@/routes";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const pathname = nextUrl.pathname;

  // Allow API auth routes
  if (pathname.startsWith(apiAuthPrefix)) {
    return null;
  }

  // Check if route is public
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname === "/" ||
    pathname.startsWith("/tours") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/about");

  // Allow public routes
  if (isPublicRoute) {
    return null;
  }

  // Check if route is auth-related (login, register, etc.)
  const isAuthRoute = authRoutes.includes(pathname);

  // Handle auth routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      const redirectUrl =
        userRole === "Admin"
          ? "/admin/dashboard"
          : userRole === "Operator"
            ? "/operator/dashboard"
            : DEFAULT_LOGIN_REDIRECT;

      return Response.redirect(new URL(redirectUrl, nextUrl));
    }
    return null;
  }

  // SPECIAL: /operator/apply - requires login but NOT operator role
  if (pathname === "/operator/apply") {
    if (!isLoggedIn) {
      return Response.redirect(
        new URL("/login?callbackUrl=/operator/apply", nextUrl)
      );
    }
    return null;
  }

  // Require authentication for protected routes
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname + nextUrl.search);
    return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  // Role-based protection: /operator/* routes
  if (pathname.startsWith("/operator")) {
    if (userRole !== "Operator") {
      return Response.redirect(new URL("/", nextUrl));
    }
  }

  // Role-based protection: /admin routes
  if (pathname.startsWith("/admin")) {
    if (userRole !== "Admin") {
      return Response.redirect(new URL("/", nextUrl));
    }
  }

  // Allow authenticated users to proceed
  return null;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};