import { NextResponse } from "next/server";

import { apiErrorResponse, parseJsonBody } from "@/lib/api-response";
import { requireApiSession } from "@/lib/auth";
import { createSocio, listSocios } from "@/lib/repository";
import { socioInputSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    return NextResponse.json(await listSocios());
  } catch (error) {
    return apiErrorResponse(error, request, "/api/socios");
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    const input = await parseJsonBody(request, socioInputSchema);
    return NextResponse.json(await createSocio(input), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, request, "/api/socios");
  }
}
