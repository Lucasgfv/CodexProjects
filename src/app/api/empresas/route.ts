import { NextResponse } from "next/server";

import { apiErrorResponse, parseJsonBody } from "@/lib/api-response";
import { requireApiSession } from "@/lib/auth";
import { createEmpresa, listEmpresas } from "@/lib/repository";
import { empresaInputSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    return NextResponse.json(await listEmpresas());
  } catch (error) {
    return apiErrorResponse(error, request, "/api/empresas");
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    const input = await parseJsonBody(request, empresaInputSchema);
    const empresa = await createEmpresa(input);
    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, request, "/api/empresas");
  }
}
