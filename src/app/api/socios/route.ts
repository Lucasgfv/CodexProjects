import { NextResponse } from "next/server";

import { createSocio, listSocios } from "@/lib/repository";
import { getErrorMessage, socioInputSchema } from "@/lib/validation";

export async function GET() {
  try {
    return NextResponse.json(await listSocios());
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = socioInputSchema.parse(await request.json());
    return NextResponse.json(await createSocio(input), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
