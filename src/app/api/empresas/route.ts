import { NextResponse } from "next/server";

import { createEmpresa, listEmpresas } from "@/lib/repository";
import { empresaInputSchema, getErrorMessage } from "@/lib/validation";

export async function GET() {
  try {
    return NextResponse.json(await listEmpresas());
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = empresaInputSchema.parse(await request.json());
    const empresa = await createEmpresa(input);
    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
