import { NextResponse } from "next/server";

import { apiErrorResponse, parseJsonBody } from "@/lib/api-response";
import { requireApiSession } from "@/lib/auth";
import {
  deleteEmpresa,
  getEmpresa,
  updateEmpresa,
} from "@/lib/repository";
import { empresaInputSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    const { id } = await context.params;
    const empresa = await getEmpresa(id);
    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada." },
        { status: 404 },
      );
    }
    return NextResponse.json(empresa);
  } catch (error) {
    return apiErrorResponse(error, request, "/api/empresas/[id]");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    const { id } = await context.params;
    const input = await parseJsonBody(request, empresaInputSchema);
    return NextResponse.json(await updateEmpresa(id, input));
  } catch (error) {
    return apiErrorResponse(error, request, "/api/empresas/[id]");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    const { id } = await context.params;
    await deleteEmpresa(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, request, "/api/empresas/[id]");
  }
}
