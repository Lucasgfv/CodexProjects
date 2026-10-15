import { NextResponse } from "next/server";

import { apiErrorResponse, parseJsonBody } from "@/lib/api-response";
import { requireApiSession } from "@/lib/auth";
import { deleteSocio, updateSocio } from "@/lib/repository";
import { socioInputSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    const { id } = await context.params;
    const input = await parseJsonBody(request, socioInputSchema);
    return NextResponse.json(await updateSocio(id, input));
  } catch (error) {
    return apiErrorResponse(error, request, "/api/socios/[id]");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    const { id } = await context.params;
    await deleteSocio(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, request, "/api/socios/[id]");
  }
}
