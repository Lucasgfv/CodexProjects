import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse, parseJsonBody } from "@/lib/api-response";
import { requireApiSession } from "@/lib/auth";
import {
  setFiscalMeiGuideSent,
  updateFiscalMeiAccess,
  updateFiscalMeiActivity,
  updateFiscalMeiProfile,
  updateFiscalMeiRevenue,
} from "@/lib/fiscal-leve";
import { cpfInputSchema } from "@/lib/validation";

const statusSchema = z.enum([
  "pending",
  "in_progress",
  "done",
  "not_applicable",
]);

const mutationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("profile"),
    responsible: z.string().trim().min(1).max(80).optional(),
    referenceLimit: z.number().finite().min(0).max(1_000_000_000).optional(),
    checked: z.boolean().optional(),
    inactive: z.boolean().optional(),
    notes: z.string().max(4000, "As observações são muito longas.").optional(),
  }),
  z.object({
    type: z.literal("revenue"),
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    value: z.number().finite().min(0).max(1_000_000_000),
  }),
  z.object({
    type: z.literal("activityStatus"),
    activityId: z.string().min(1).max(64),
    status: statusSchema,
  }),
  z.object({
    type: z.literal("guideSent"),
    activityId: z.string().min(1).max(64),
    sent: z.boolean(),
  }),
  z.object({
    type: z.literal("access"),
    certificateDescription: z.string().trim().max(160),
    certificateActive: z.boolean(),
    certificateExpiresAt: z
      .string()
      .max(40)
      .refine((value) => !Number.isNaN(Date.parse(value)), "Informe uma data válida.")
      .nullable(),
    accessCpf: cpfInputSchema,
    accessPassword: z.string().min(6, "Use pelo menos 6 caracteres.").max(256).optional(),
  }),
]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const unauthorized = await requireApiSession(request);
    if (unauthorized) return unauthorized;
    const { id } = await context.params;
    const input = await parseJsonBody(request, mutationSchema);

    if (input.type === "profile") {
      return NextResponse.json(await updateFiscalMeiProfile(id, input));
    }
    if (input.type === "revenue") {
      return NextResponse.json(
        await updateFiscalMeiRevenue(id, input.year, input.month, input.value),
      );
    }
    if (input.type === "activityStatus") {
      return NextResponse.json(
        await updateFiscalMeiActivity(id, input.activityId, input.status),
      );
    }
    if (input.type === "guideSent") {
      return NextResponse.json(
        await setFiscalMeiGuideSent(id, input.activityId, input.sent),
      );
    }
    return NextResponse.json(await updateFiscalMeiAccess(id, input));
  } catch (error) {
    return apiErrorResponse(error, request, "/api/fiscal-leve/meis/[id]");
  }
}
