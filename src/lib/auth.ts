import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function requiredAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET deve conter pelo menos 32 caracteres.",
    );
  }

  return secret;
}

function trustedOrigins() {
  return [
    process.env.APP_ORIGIN,
    ...(process.env.CORS_ALLOWED_ORIGINS ?? "").split(","),
  ]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));
}

const baseURL = process.env.BETTER_AUTH_URL?.trim();

export const auth = betterAuth({
  appName: "Nexo Contábil",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: requiredAuthSecret(),
  ...(baseURL ? { baseURL } : {}),
  trustedOrigins: trustedOrigins(),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
  },
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: {
      generateId: "uuid",
      joins: true,
    },
  },
  plugins: [nextCookies()],
});

export async function getSession(requestHeaders: Headers) {
  return auth.api.getSession({ headers: requestHeaders });
}

export async function requireApiSession(request: Request) {
  const session = await getSession(request.headers);

  if (session) return null;

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
