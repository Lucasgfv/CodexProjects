import { NextRequest, NextResponse } from "next/server";

import { hasSessionCookie } from "@/lib/session-cookie";

type RateLimitEntry = { count: number; resetAt: number };

const rateLimits = new Map<string, RateLimitEntry>();
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/health"];

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    PUBLIC_API_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

function unauthenticatedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Autenticação necessária." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          "WWW-Authenticate": "Session",
        },
      },
    );
  }

  const loginUrl = new URL("/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (nextPath !== "/") loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function allowedOrigins(request: NextRequest) {
  const configured = [
    process.env.APP_ORIGIN,
    ...(process.env.CORS_ALLOWED_ORIGINS ?? "").split(","),
  ]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));
  return new Set([request.nextUrl.origin, ...configured]);
}

function applyCorsHeaders(
  response: NextResponse,
  origin: string | null,
  isAllowed: boolean,
) {
  response.headers.set("Vary", "Origin");
  if (!origin || !isAllowed) return;
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Requested-With",
  );
  response.headers.set("Access-Control-Max-Age", "600");
}

function clientAddress(request: NextRequest) {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function consumeWriteLimit(request: NextRequest) {
  const limit = positiveInteger(process.env.API_WRITE_RATE_LIMIT, 60);
  const windowMs = positiveInteger(
    process.env.API_WRITE_RATE_WINDOW_MS,
    60_000,
  );
  const now = Date.now();
  const key = `${clientAddress(request)}:${request.nextUrl.pathname}`;
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRequest = pathname.startsWith("/api/");
  const origin = request.headers.get("origin");
  const isAllowedOrigin =
    !isApiRequest || !origin || allowedOrigins(request).has(origin);

  if (!isAllowedOrigin) {
    return NextResponse.json(
      { error: "Origem não permitida." },
      { status: 403, headers: { "Cache-Control": "no-store", Vary: "Origin" } },
    );
  }

  if (isApiRequest && request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    applyCorsHeaders(response, origin, true);
    return response;
  }

  if (!isPublicPath(pathname) && !hasSessionCookie(request.headers)) {
    const response = unauthenticatedResponse(request);
    if (isApiRequest) applyCorsHeaders(response, origin, true);
    return response;
  }

  if (isApiRequest && WRITE_METHODS.has(request.method)) {
    const rateLimit = consumeWriteLimit(request);
    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        { error: "Muitas alterações em pouco tempo. Tente novamente em instantes." },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(rateLimit.retryAfter),
          },
        },
      );
      applyCorsHeaders(response, origin, true);
      return response;
    }
  }

  const requestHeaders = new Headers(request.headers);
  const requestId = crypto.randomUUID();
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-nexo-pathname", pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Request-Id", requestId);
  if (isApiRequest) applyCorsHeaders(response, origin, true);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff|woff2)).*)",
  ],
};
