import { NextResponse } from "next/server";

import { apiErrorResponse, parseJsonBody } from "@/lib/api-response";
import { requireApiSession } from "@/lib/auth";
import {
  createLancamento,
  listLancamentos,
} from "@/lib/repository";
import { lancamentoInputSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    return NextResponse.json(await listLancamentos());
  } catch (error) {
    return apiErrorResponse(error, request, "/api/lancamentos");
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    const input = await parseJsonBody(request, lancamentoInputSchema);
    return NextResponse.json(await createLancamento(input), {
      status: 201,
    });
  } catch (error) {
    return apiErrorResponse(error, request, "/api/lancamentos");
  }
}
