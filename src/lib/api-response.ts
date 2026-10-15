import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { PersistenceUnavailableError } from "@/lib/errors";

const DEFAULT_MAX_BODY_BYTES = 64 * 1024;
const MAX_CONFIGURED_BODY_BYTES = 1024 * 1024;

class ApiInputError extends Error {
  constructor(
    readonly status: number,
    readonly publicMessage: string,
  ) {
    super(publicMessage);
    this.name = "ApiInputError";
  }
}

function configuredBodyLimit() {
  const configured = Number(process.env.API_MAX_BODY_BYTES);
  if (!Number.isSafeInteger(configured) || configured <= 0) {
    return DEFAULT_MAX_BODY_BYTES;
  }
  return Math.min(configured, MAX_CONFIGURED_BODY_BYTES);
}

async function readBoundedBody(request: Request) {
  const limit = configuredBodyLimit();
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > limit) {
    throw new ApiInputError(413, "A solicitação excede o tamanho permitido.");
  }

  if (!request.body) {
    throw new ApiInputError(400, "Envie os dados da solicitação.");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new ApiInputError(413, "A solicitação excede o tamanho permitido.");
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiInputError(415, "Envie os dados no formato JSON.");
  }

  const rawBody = await readBoundedBody(request);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new ApiInputError(400, "O conteúdo enviado não é um JSON válido.");
  }
  return schema.parse(parsed);
}

function isDatabaseConnectionError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "PrismaClientInitializationError" ||
      error.message.includes("Can't reach database server") ||
      error.message.includes("P1001") ||
      error.message.includes("P1002"))
  );
}

function publicError(error: unknown) {
  if (error instanceof ApiInputError) {
    return { status: error.status, message: error.publicMessage };
  }
  if (error instanceof z.ZodError) {
    return {
      status: 400,
      message: error.issues[0]?.message ?? "Revise os dados informados.",
    };
  }
  if (
    error instanceof PersistenceUnavailableError ||
    isDatabaseConnectionError(error)
  ) {
    return {
      status: 503,
      message: "O banco de dados está temporariamente indisponível.",
    };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return { status: 409, message: "Já existe um registro com esses dados." };
    }
    if (error.code === "P2025") {
      return { status: 404, message: "Registro não encontrado." };
    }
  }
  return { status: 500, message: "Não foi possível concluir a operação." };
}

function logServerError(
  error: unknown,
  requestId: string,
  route: string,
  method: string,
) {
  const details: Record<string, unknown> = {
    level: "error",
    requestId,
    route,
    method,
    errorName: error instanceof Error ? error.name : "UnknownError",
  };

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    details.errorCode = error.code;
  }
  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    details.message = error.message;
    details.stack = error.stack;
  }

  console.error(JSON.stringify(details));
}

export function apiErrorResponse(
  error: unknown,
  request: Request,
  route: string,
) {
  const result = publicError(error);
  const requestId =
    request.headers.get("x-request-id")?.slice(0, 128) ?? crypto.randomUUID();

  if (result.status >= 500) {
    logServerError(error, requestId, route, request.method);
  }

  return NextResponse.json(
    { error: result.message, requestId },
    {
      status: result.status,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
      },
    },
  );
}
