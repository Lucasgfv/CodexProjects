import type { PapelUsuario } from "@prisma/client";

export const canEditCompanies = (papel: PapelUsuario) => papel === "ADMIN" || papel === "OPERADOR";
