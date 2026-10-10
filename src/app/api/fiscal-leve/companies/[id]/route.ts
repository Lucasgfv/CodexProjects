import { NextResponse } from "next/server";
import { z } from "zod";

import {
  addFiscalTask,
  updateFiscalCompany,
  updateFiscalTask,
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
    notes: z.string().optional(),
  }),
  z.object({
    type: z.literal("taskStatus"),
    taskId: z.string().min(1),
    status: statusSchema,
  }),
  z.object({
    type: z.literal("addTask"),
    name: z.string().trim().min(2, "Informe o nome da atividade."),
    status: statusSchema,
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
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) },
    );
  }
}
