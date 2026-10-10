import { NextResponse } from "next/server";
import { z } from "zod";

import { updateCurrentResponsible } from "@/lib/fiscal-leve";
import { getErrorMessage, getErrorStatus } from "@/lib/validation";

const inputSchema = z.object({
  currentResponsible: z.string().trim().min(1),
});

export async function PATCH(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    return NextResponse.json({
      currentResponsible: await updateCurrentResponsible(
        input.currentResponsible,
      ),
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) },
    );
  }
}
