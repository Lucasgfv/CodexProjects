import { createEmpresa } from "@/app/actions";
import { CompanyForm } from "@/components/company-form";
import { requirePageUser } from "@/lib/authz";
import Link from "next/link";

export default async function NovaEmpresa() {
  await requirePageUser(["ADMIN", "OPERADOR"]);
  return <main className="form-shell"><Link className="back" href="/">← Voltar para empresas</Link><CompanyForm action={createEmpresa} /></main>;
}
