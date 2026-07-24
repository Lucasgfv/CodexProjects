import { NextResponse } from "next/server";

import { getDatabaseStatus } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getDatabaseStatus();
  return NextResponse.json(status);
}
