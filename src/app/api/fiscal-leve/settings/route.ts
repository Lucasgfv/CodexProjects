import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse, parseJsonBody } from "@/lib/api-response";
import { requireApiSession } from "@/lib/auth";
import { updateCurrentResponsible } from "@/lib/fiscal-leve";

const inputSchema = z.object({
  currentResponsible: z.string().trim().min(1).max(80),
});

export async function PATCH(request: Request) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    const input = await parseJsonBody(request, inputSchema);
    return NextResponse.json({
      currentResponsible: await updateCurrentResponsible(
        input.currentResponsible,
      ),
    });
  } catch (error) {
    return apiErrorResponse(error, request, "/api/fiscal-leve/settings");
  }
}
