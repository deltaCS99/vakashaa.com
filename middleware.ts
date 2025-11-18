// middleware.ts
import { auth } from "@/auth";

// Inline route definitions to avoid bundling issues
const publicRoutes = ["/verify"];
const authRoutes = [
  "/login",
  "/register",
  "/error",
  "/resend",
  "/reset",
  "/new-password",
  "/two-factor"
];
const apiAuthPrefix = "/api/auth";
const DEFAULT_LOGIN_REDIRECT = "/";

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

  if (isApiAuthRoute) return null;

  if (isAuthRoute) {
    if (isLoggedIn) {
      let redirectUrl = DEFAULT_LOGIN_REDIRECT;
      if (userRole === "Admin") redirectUrl = "/admin/dashboard";
      else if (userRole === "Operator") redirectUrl = "/operator/dashboard";
      return Response.redirect(new URL(redirectUrl, nextUrl));
    }
    return null;
  }

  if (isPublicRoute) return null;

  if (nextUrl.pathname === "/operator/apply") {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/login?callbackUrl=/operator/apply", nextUrl));
    }
    return null;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/operator") && userRole !== "Operator") {
    return Response.redirect(new URL("/", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/admin") && userRole !== "Admin") {
    return Response.redirect(new URL("/", nextUrl));
  }

  return null;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};