import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse, parseJsonBody } from "@/lib/api-response";
import { requireApiSession } from "@/lib/auth";
import {
  addFiscalTask,
  updateFiscalCompany,
  updateFiscalTask,
} from "@/lib/fiscal-leve";

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
    notes: z.string().max(4000, "As observações são muito longas.").optional(),
  }),
  z.object({
    type: z.literal("taskStatus"),
    taskId: z.string().min(1).max(64),
    status: statusSchema,
  }),
  z.object({
    type: z.literal("addTask"),
    name: z
      .string()
      .trim()
      .min(2, "Informe o nome da atividade.")
      .max(120, "O nome da atividade é muito longo."),
    status: statusSchema,
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
      return NextResponse.json(await updateFiscalCompany(id, input));
    }
    if (input.type === "taskStatus") {
      return NextResponse.json(
        await updateFiscalTask(id, input.taskId, input.status),
      );
    }
    return NextResponse.json(
      await addFiscalTask(id, input.name, input.status),
    );
  } catch (error) {
    return apiErrorResponse(error, request, "/api/fiscal-leve/companies/[id]");
  }
}
