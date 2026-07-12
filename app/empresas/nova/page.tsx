import { createEmpresa } from "@/app/actions";
import { CompanyForm } from "@/components/company-form";
import Link from "next/link";

export default function NovaEmpresa() {
  return <main className="form-shell"><Link className="back" href="/">← Voltar para empresas</Link><CompanyForm action={createEmpresa} /></main>;
}
