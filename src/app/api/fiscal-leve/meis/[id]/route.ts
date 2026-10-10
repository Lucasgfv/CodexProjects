import { NextResponse } from "next/server";
import { z } from "zod";

import {
  setFiscalMeiGuideSent,
  updateFiscalMeiAccess,
  updateFiscalMeiActivity,
  updateFiscalMeiProfile,
  updateFiscalMeiRevenue,
} from "@/lib/fiscal-leve";
import { getErrorMessage, getErrorStatus } from "@/lib/validation";

const statusSchema = z.enum([
  "pending",
  "in_progress",
  "done",
  "not_applicable",
]);

const mutationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("profile"),
    responsible: z.string().trim().min(1).optional(),
    referenceLimit: z.number().finite().min(0).optional(),
    checked: z.boolean().optional(),
    inactive: z.boolean().optional(),
    notes: z.string().optional(),
  }),
  z.object({
    type: z.literal("revenue"),
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    value: z.number().finite().min(0),
  }),
  z.object({
    type: z.literal("activityStatus"),
    activityId: z.string().min(1),
    status: statusSchema,
  }),
  z.object({
    type: z.literal("guideSent"),
    activityId: z.string().min(1),
    sent: z.boolean(),
  }),
  z.object({
    type: z.literal("access"),
    certificateDescription: z.string(),
    certificateActive: z.boolean(),
    certificateExpiresAt: z.string().nullable(),
    accessCpf: z.string(),
    accessPassword: z.string().optional(),
  }),
]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const input = mutationSchema.parse(await request.json());

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
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) },
    );
  }
}
