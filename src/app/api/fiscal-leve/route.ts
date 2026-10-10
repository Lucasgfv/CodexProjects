import { NextResponse } from "next/server";
import { z } from "zod";

import { createFiscalMei, getFiscalSnapshot } from "@/lib/fiscal-leve";
import { getErrorMessage, getErrorStatus } from "@/lib/validation";

const newMeiSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do MEI."),
  cnpj: z.string().trim().min(14, "Informe um CNPJ válido."),
  responsible: z.string().trim().min(2, "Informe o responsável."),
});

export async function GET() {
  try {
    return NextResponse.json(await getFiscalSnapshot());
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) },
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = newMeiSchema.parse(await request.json());
    return NextResponse.json(await createFiscalMei(input), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) },
    );
  }
}
