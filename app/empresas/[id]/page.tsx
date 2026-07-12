import { addSocio, deleteEmpresa } from "@/app/actions";
import { CompanySheet } from "@/components/company-sheet";
import { PrintButton } from "@/components/print-button";
import { demoEmpresa } from "@/lib/demo";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let company: any;
  if (id === "demonstracao") company = demoEmpresa;
  else {
    try { company = await prisma.empresa.findUnique({ where: { id }, include: { socios: { include: { socio: { include: { vinculos: true } } } } } }); }
    catch { company = null; }
  }
  if (!company) notFound();
  const isDemo = id === "demonstracao";
  const deleteAction = deleteEmpresa.bind(null, id);
  const partnerAction = addSocio.bind(null, id);

  return <>
    <nav className="print-toolbar no-print"><Link className="back" style={{ margin: 0 }} href="/">← Voltar para empresas</Link><div className="row-actions">{!isDemo && <Link className="button secondary" href={`/empresas/${id}/editar`}>Editar</Link>}<PrintButton /></div></nav>
    <CompanySheet company={company} />
    {!isDemo && <main className="form-shell no-print" style={{ marginTop: 0 }}>
      <form action={partnerAction} className="form-card"><h2 className="section-title" style={{ fontSize: 20 }}>Adicionar sócio ou vínculo</h2><div className="form-grid">
        <div className="field span-6"><label>Nome *</label><input required name="nome" /></div><div className="field"><label>CPF *</label><input required name="cpf" /></div><div className="field"><label>Participação (%)</label><input type="number" min="0" max="100" step="0.01" name="participacao" /></div><div className="field span-6"><label>Endereço *</label><input required name="enderecoSocio" /></div><div className="field span-6"><label>Cargo</label><input name="cargo" /></div>
        <div className="field"><label>Tipo de observação</label><select name="vinculoTipo"><option value="SOCIO_EM_OUTRA_EMPRESA">Sócio em outra empresa</option><option value="VINCULO_DE_INTERESSE">Vínculo de interesse</option></select></div><div className="field span-8"><label>Observação que aparecerá na ficha</label><input name="vinculoDescricao" placeholder="Ex.: Sócio na empresa X" /></div>
      </div><div className="form-actions"><button className="button" type="submit">Adicionar sócio</button></div></form>
      <form action={deleteAction} style={{ marginTop: 18, textAlign: "right" }}><button className="button danger" type="submit">Excluir empresa</button></form>
    </main>}
  </>;
}
