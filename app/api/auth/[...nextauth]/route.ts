import { handlers } from "@/auth";
import { logSafeError } from "@/lib/logger";
import { NextResponse, type NextRequest } from "next/server";

async function handleAuth(request: NextRequest, method: "GET" | "POST") {
  try {
    return await handlers[method](request);
  } catch (error) {
    const eventId = logSafeError(`autenticacao.rota.${method.toLowerCase()}`, error);
    return NextResponse.json({ message: `Não foi possível processar a autenticação. Código: ${eventId}.` }, { status: 500 });
  }
}

export function GET(request: NextRequest) {
  return handleAuth(request, "GET");
}

export function POST(request: NextRequest) {
  return handleAuth(request, "POST");
}
