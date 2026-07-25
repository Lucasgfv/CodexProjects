import { NextResponse } from "next/server";

import {
  createLancamento,
  listLancamentos,
} from "@/lib/repository";
import {
  getErrorMessage,
  getErrorStatus,
  lancamentoInputSchema,
} from "@/lib/validation";

export async function GET() {
  try {
    return NextResponse.json(await listLancamentos());
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = lancamentoInputSchema.parse(await request.json());
    return NextResponse.json(await createLancamento(input), {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) },
    );
  }
}
