"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return <button className="button" onClick={() => window.print()}><Printer size={16} /> Imprimir ficha</button>;
}
