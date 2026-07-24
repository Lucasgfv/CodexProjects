import { NextResponse } from "next/server";

import {
  deleteEmpresa,
  getEmpresa,
  updateEmpresa,
} from "@/lib/repository";
import { empresaInputSchema, getErrorMessage } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const empresa = await getEmpresa(id);
  if (!empresa) {
    return NextResponse.json(
      { error: "Empresa não encontrada." },
      { status: 404 },
    );
  }
  return NextResponse.json(empresa);
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = empresaInputSchema.parse(await request.json());
    return NextResponse.json(await updateEmpresa(id, input));
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteEmpresa(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
