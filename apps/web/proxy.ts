import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedRoutes = ["/profile"];
const authRoutes = ["/login", "/register"];
const adminRoutes = ["/admin"];

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secret");

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const backendUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  let requiresAuth = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (isAdminRoute) requiresAuth = true;

  if (!requiresAuth && !isAuthRoute) return NextResponse.next();

  const cookieHeader = request.headers.get("cookie") || "";

  const accessToken = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("access_token="))
    ?.split("=")[1];

  let user: { sub: string; userType: string } | null = null;
  let needsRefresh = true;
  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, JWT_SECRET);
      user = payload as { sub: string; userType: string };
      needsRefresh = false;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      needsRefresh = true;
    }
  }

  if (!needsRefresh && user) {
    if (isAuthRoute) return NextResponse.redirect(new URL("/", request.url));
    if (isAdminRoute && user.userType !== "ADMIN")
      return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  try {
    const apiRes = await fetch(`${backendUrl}/auth/session`, {
      method: "POST",
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    });
    const isAuthorized = apiRes.ok;

    if (isAuthorized) {
      let response: NextResponse<unknown>;
      const user: { id: string; userType: string } = await apiRes
        .clone()
        .json();

      if ((isAdminRoute && user.userType !== "ADMIN") || isAuthRoute) {
        response = NextResponse.redirect(new URL("/", request.url));
      } else {
        response = NextResponse.next();
      }
      const setCookieHeader = apiRes.headers.get("set-cookie");
      if (setCookieHeader) {
        response.headers.set("Set-Cookie", setCookieHeader);
      }
      return response;
    } else {
      if (requiresAuth) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.next();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (er) {
    if (requiresAuth)
      return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
