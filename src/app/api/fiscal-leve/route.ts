import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse, parseJsonBody } from "@/lib/api-response";
import { requireApiSession } from "@/lib/auth";
import { createFiscalMei, getFiscalSnapshot } from "@/lib/fiscal-leve";
import { cnpjInputSchema } from "@/lib/validation";

const newMeiSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do MEI.")
    .max(160, "O nome do MEI é muito longo."),
  cnpj: cnpjInputSchema,
  responsible: z
    .string()
    .trim()
    .min(2, "Informe o responsável.")
    .max(80, "O nome do responsável é muito longo."),
});

export async function GET(request: Request) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    return NextResponse.json(await getFiscalSnapshot());
  } catch (error) {
    return apiErrorResponse(error, request, "/api/fiscal-leve");
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    const input = await parseJsonBody(request, newMeiSchema);
    return NextResponse.json(await createFiscalMei(input), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, request, "/api/fiscal-leve");
  }
}
