"use client";

import {
  ChevronDown,
  Plus,
  Save,
  Trash2,
  UserRoundPlus,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";

import { DrawerShell } from "@/components/db-admin/drawer-shell";
import {
  CnpjCardUploader,
  type CnpjLookupResult,
} from "@/components/db-admin/cnpj-card-uploader";
import { toInputDate } from "@/lib/format";
import type {
  EmpresaDTO,
  EmpresaInput,
  SocioDTO,
} from "@/lib/types";

type LinkForm = {
  socioId: string;
  cargo: string;
  percentualParticipacao: string;
  recebeProlabore: boolean;
  valorProlabore: string;
  dataEntrada: string;
  dataSaida: string;
};

type ChangeForm = {
  numeroAlteracao: string;
  dataAlteracao: string;
  descricaoResumida: string;
};

type EmpresaForm = {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  tipoCliente: string;
  porte: string;
  regimeTributario: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  numeroEndereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  capitalSocial: string;
  honorarioMensal: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  cnaePrincipal: string;
  cnaesSecundarios: string;
  ramoAtividade: string;
  servicoProduto: string;
  quantidadeFuncionarios: string;
  situacaoAlvaras: string;
  participaLicitacoes: string;
  contadorAnterior: string;
  dataAtualizacaoBancaria: string;
  pendenciasFiscais: string;
  ranking: string;
  referenciasComerciais: Array<{ nome: string; cidade: string; uf: string }>;
  dataInicio: string;
  dataBaixa: string;
  socios: LinkForm[];
  alteracoes: ChangeForm[];
};

const regimes = [
  "Simples Nacional",
  "Lucro Presumido",
  "Lucro Real",
  "MEI",
];

function emptyForm(): EmpresaForm {
  return {
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    tipoCliente: "Mensal",
    porte: "",
    regimeTributario: "Simples Nacional",
    email: "",
    telefone: "",
    cep: "",
    endereco: "",
    numeroEndereco: "",
    bairro: "",
    cidade: "",
    uf: "",
    capitalSocial: "",
    honorarioMensal: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    cnaePrincipal: "",
    cnaesSecundarios: "",
    ramoAtividade: "",
    servicoProduto: "",
    quantidadeFuncionarios: "",
    situacaoAlvaras: "",
    participaLicitacoes: "",
    contadorAnterior: "",
    dataAtualizacaoBancaria: "",
    pendenciasFiscais: "",
    ranking: "",
    referenciasComerciais: [{ nome: "", cidade: "", uf: "" }, { nome: "", cidade: "", uf: "" }],
    dataInicio: new Date().toISOString().slice(0, 10),
    dataBaixa: "",
    socios: [],
    alteracoes: [],
  };
}

function toForm(empresa?: EmpresaDTO | null): EmpresaForm {
  if (!empresa) return emptyForm();
  return {
    razaoSocial: empresa.razaoSocial,
    nomeFantasia: empresa.nomeFantasia ?? "",
    cnpj: empresa.cnpj,
    tipoCliente: empresa.tipoCliente ?? "Mensal",
    porte: empresa.porte ?? "",
    regimeTributario: empresa.regimeTributario,
    email: empresa.email ?? "",
    telefone: empresa.telefone ?? "",
    cep: empresa.cep ?? "",
    endereco: empresa.endereco ?? "",
    numeroEndereco: empresa.numeroEndereco ?? "",
    bairro: empresa.bairro ?? "",
    cidade: empresa.cidade ?? "",
    uf: empresa.uf ?? "",
    capitalSocial: empresa.capitalSocial?.toString() ?? "",
    honorarioMensal: empresa.honorarioMensal?.toString() ?? "",
    inscricaoEstadual: empresa.inscricaoEstadual ?? "",
    inscricaoMunicipal: empresa.inscricaoMunicipal ?? "",
    cnaePrincipal: empresa.cnaePrincipal ?? "",
    cnaesSecundarios: empresa.cnaesSecundarios ?? "",
    ramoAtividade: empresa.ramoAtividade ?? "",
    servicoProduto: empresa.servicoProduto ?? "",
    quantidadeFuncionarios: empresa.quantidadeFuncionarios?.toString() ?? "",
    situacaoAlvaras: empresa.situacaoAlvaras ?? "",
    participaLicitacoes: empresa.participaLicitacoes === null ? "" : empresa.participaLicitacoes ? "sim" : "nao",
    contadorAnterior: empresa.contadorAnterior ?? "",
    dataAtualizacaoBancaria: toInputDate(empresa.dataAtualizacaoBancaria),
    pendenciasFiscais: empresa.pendenciasFiscais === null ? "" : empresa.pendenciasFiscais ? "sim" : "nao",
    ranking: empresa.ranking ?? "",
    referenciasComerciais: empresa.referenciasComerciais?.length === 2 ? empresa.referenciasComerciais : [{ nome: "", cidade: "", uf: "" }, { nome: "", cidade: "", uf: "" }],
    dataInicio: toInputDate(empresa.dataInicio),
    dataBaixa: toInputDate(empresa.dataBaixa),
    socios: empresa.socios.map((vinculo) => ({
      socioId: vinculo.socioId,
      cargo: vinculo.cargo ?? "",
      percentualParticipacao: vinculo.percentualParticipacao.toString(),
      recebeProlabore: vinculo.recebeProlabore,
      valorProlabore: vinculo.valorProlabore?.toString() ?? "",
      dataEntrada: toInputDate(vinculo.dataEntrada),
      dataSaida: toInputDate(vinculo.dataSaida),
    })),
    alteracoes: empresa.alteracoesContratuais.map((alteracao) => ({
      numeroAlteracao: alteracao.numeroAlteracao?.toString() ?? "",
      dataAlteracao: toInputDate(alteracao.dataAlteracao),
      descricaoResumida: alteracao.descricaoResumida ?? "",
    })),
  };
}

function FormField({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="field-label">
        {label}
        {required ? <span className="ml-0.5 text-coral">*</span> : null}
      </span>
      {children}
    </label>
  );
}

async function readResponse(response: Response) {
  const data = (await response.json()) as EmpresaDTO | { error: string };
  if (!response.ok) {
    throw new Error("error" in data ? data.error : "Não foi possível salvar.");
  }
  return data as EmpresaDTO;
}

export function EmpresaDrawer({
  empresa,
  socios,
  onClose,
  onCreateSocio,
  onSaved,
  onError,
}: {
  empresa?: EmpresaDTO | null;
  socios: SocioDTO[];
  onClose: () => void;
  onCreateSocio?: () => void;
  onSaved: (empresa: EmpresaDTO) => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState<EmpresaForm>(() => toForm(empresa));
  const [isPending, startTransition] = useTransition();
  const usedSocios = useMemo(
    () => new Set(form.socios.map((vinculo) => vinculo.socioId)),
    [form.socios],
  );

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function applyCnpjData(data: CnpjLookupResult) {
    setForm((current) => ({
      ...current,
      cnpj: data.cnpj,
      razaoSocial: data.razaoSocial || current.razaoSocial,
      nomeFantasia: data.nomeFantasia ?? current.nomeFantasia,
      porte: data.porte ?? current.porte,
      dataInicio: data.dataInicio ?? current.dataInicio,
      endereco: data.endereco ?? current.endereco,
      cep: data.cep ?? current.cep,
      cidade: data.cidade ?? current.cidade,
      uf: data.uf ?? current.uf,
      telefone: data.telefone ?? current.telefone,
      email: data.email ?? current.email,
    }));
  }

  function addSocio() {
    const socio = socios.find((item) => !usedSocios.has(item.id));
    if (!socio) {
      onError("Cadastre outro sócio antes de criar um novo vínculo.");
      return;
    }
    setForm((current) => ({
      ...current,
      socios: [
        ...current.socios,
        {
          socioId: socio.id,
          cargo: "Sócio",
          percentualParticipacao: "0",
          recebeProlabore: false,
          valorProlabore: "",
          dataEntrada:
            current.dataInicio || new Date().toISOString().slice(0, 10),
          dataSaida: "",
        },
      ],
    }));
  }

  function handleAddSocio() {
    if (socios.length) {
      addSocio();
      return;
    }
    if (onCreateSocio) {
      onCreateSocio();
      return;
    }
    onError("Cadastre um sócio para criar o vínculo.");
  }

  function updateSocio(
    index: number,
    field: keyof LinkForm,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      socios: current.socios.map((vinculo, itemIndex) =>
        itemIndex === index ? { ...vinculo, [field]: value } : vinculo,
      ),
    }));
  }

  function addAlteracao() {
    setForm((current) => ({
      ...current,
      alteracoes: [
        ...current.alteracoes,
        {
          numeroAlteracao: String(current.alteracoes.length + 1),
          dataAlteracao: new Date().toISOString().slice(0, 10),
          descricaoResumida: "",
        },
      ],
    }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const participation = form.socios.reduce(
      (total, vinculo) =>
        total + Number(vinculo.percentualParticipacao || 0),
      0,
    );
    if (participation > 100.001) {
      onError("A participação total dos sócios não pode ultrapassar 100%.");
      return;
    }

    const payload: EmpresaInput = {
      razaoSocial: form.razaoSocial,
      nomeFantasia: form.nomeFantasia || null,
      cnpj: form.cnpj,
      tipoCliente: form.tipoCliente || null,
      porte: form.porte || null,
      regimeTributario: form.regimeTributario,
      email: form.email || null,
      telefone: form.telefone || null,
      cep: form.cep || null,
      endereco: form.endereco || null,
      numeroEndereco: form.numeroEndereco || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      uf: form.uf.trim().toUpperCase() || null,
      capitalSocial: form.capitalSocial
        ? Number(form.capitalSocial.replace(",", "."))
        : null,
      honorarioMensal: form.honorarioMensal
        ? Number(form.honorarioMensal.replace(",", "."))
        : null,
      inscricaoEstadual: form.inscricaoEstadual || null,
      inscricaoMunicipal: form.inscricaoMunicipal || null,
      cnaePrincipal: form.cnaePrincipal || null,
      cnaesSecundarios: form.cnaesSecundarios || null,
      ramoAtividade: form.ramoAtividade || null,
      servicoProduto: form.servicoProduto || null,
      quantidadeFuncionarios: form.quantidadeFuncionarios === "" ? null : Number(form.quantidadeFuncionarios),
      situacaoAlvaras: form.situacaoAlvaras || null,
      participaLicitacoes: form.participaLicitacoes === "" ? null : form.participaLicitacoes === "sim",
      contadorAnterior: form.contadorAnterior || null,
      dataAtualizacaoBancaria: form.dataAtualizacaoBancaria || null,
      pendenciasFiscais: form.pendenciasFiscais === "" ? null : form.pendenciasFiscais === "sim",
      ranking: form.ranking || null,
      dataInicio: form.dataInicio,
      dataBaixa: form.dataBaixa || null,
      sociosVinculados: form.socios.map((vinculo) => ({
        socioId: vinculo.socioId,
        cargo: vinculo.cargo || null,
        percentualParticipacao: Number(
          vinculo.percentualParticipacao.replace(",", "."),
        ),
        recebeProlabore: vinculo.recebeProlabore,
        valorProlabore: vinculo.valorProlabore
          ? Number(vinculo.valorProlabore.replace(",", "."))
          : null,
        dataEntrada: vinculo.dataEntrada,
        dataSaida: vinculo.dataSaida || null,
      })),
      alteracoes: form.alteracoes.map((alteracao) => ({
        numeroAlteracao: alteracao.numeroAlteracao
          ? Number(alteracao.numeroAlteracao)
          : null,
        dataAlteracao: alteracao.dataAlteracao,
        descricaoResumida: alteracao.descricaoResumida || null,
      })),
      referenciasComerciais: form.referenciasComerciais,
    };

    startTransition(async () => {
      try {
        const response = await fetch(
          empresa ? `/api/empresas/${empresa.id}` : "/api/empresas",
          {
            method: empresa ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        onSaved(await readResponse(response));
      } catch (error) {
        onError(
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a empresa.",
        );
      }
    });
  }

  return (
    <form id="empresa-form" onSubmit={submit}>
      <DrawerShell
        description="Dados cadastrais, vínculos societários e histórico contratual."
        footer={
          <>
            <button
              className="secondary-button"
              disabled={isPending}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="primary-button min-w-[150px]"
              disabled={isPending}
              form="empresa-form"
              type="submit"
            >
              <Save size={16} />
              {isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </>
        }
        onClose={onClose}
        title={empresa ? "Editar empresa" : "Nova empresa"}
      >
        {!empresa ? <CnpjCardUploader onDataExtracted={applyCnpjData} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Razão social" required>
            <input
              autoFocus
              className="field-control"
              name="razaoSocial"
              onChange={updateField}
              required
              value={form.razaoSocial}
            />
          </FormField>
          <FormField label="Nome fantasia">
            <input
              className="field-control"
              name="nomeFantasia"
              onChange={updateField}
              value={form.nomeFantasia}
            />
          </FormField>
          <FormField label="CNPJ" required>
            <input
              className="field-control"
              name="cnpj"
              onChange={updateField}
              required
              value={form.cnpj}
            />
          </FormField>
          <FormField label="Regime tributário" required>
            <select
              className="field-control"
              name="regimeTributario"
              onChange={updateField}
              value={form.regimeTributario}
            >
              {regimes.map((regime) => (
                <option key={regime}>{regime}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Tipo de cliente">
            <select
              className="field-control"
              name="tipoCliente"
              onChange={updateField}
              value={form.tipoCliente}
            >
              <option>Mensal</option>
              <option>Avulso</option>
            </select>
          </FormField>
          <FormField label="E-mail">
            <input
              className="field-control"
              name="email"
              onChange={updateField}
              type="email"
              value={form.email}
            />
          </FormField>
          <FormField label="Telefone">
            <input
              className="field-control"
              name="telefone"
              onChange={updateField}
              value={form.telefone}
            />
          </FormField>
          <FormField label="CEP">
            <input
              className="field-control"
              name="cep"
              onChange={updateField}
              value={form.cep}
            />
          </FormField>
          <FormField className="sm:col-span-2" label="Endereço">
            <input
              className="field-control"
              name="endereco"
              onChange={updateField}
              value={form.endereco}
            />
          </FormField>
          <FormField label="Número">
            <input className="field-control" name="numeroEndereco" onChange={updateField} value={form.numeroEndereco} />
          </FormField>
          <FormField label="Bairro">
            <input className="field-control" name="bairro" onChange={updateField} value={form.bairro} />
          </FormField>
          <FormField label="Cidade">
            <input
              className="field-control"
              name="cidade"
              onChange={updateField}
              value={form.cidade}
            />
          </FormField>
          <FormField label="UF">
            <input
              className="field-control uppercase"
              maxLength={2}
              name="uf"
              onChange={updateField}
              placeholder="MG"
              value={form.uf}
            />
          </FormField>
          <FormField label="Capital social (R$)">
            <input
              className="field-control"
              min="0"
              name="capitalSocial"
              onChange={updateField}
              step="0.01"
              type="number"
              value={form.capitalSocial}
            />
          </FormField>
          <FormField label="Honorário mensal (R$)">
            <input
              className="field-control"
              min="0"
              name="honorarioMensal"
              onChange={updateField}
              step="0.01"
              type="number"
              value={form.honorarioMensal}
            />
          </FormField>
          <FormField label="Data de início" required>
            <input
              className="field-control"
              name="dataInicio"
              onChange={updateField}
              required
              type="date"
              value={form.dataInicio}
            />
          </FormField>
          <FormField label="Data de baixa">
            <input
              className="field-control"
              name="dataBaixa"
              onChange={updateField}
              type="date"
              value={form.dataBaixa}
            />
          </FormField>
        </div>

        <section className="mt-7 rounded-panel border border-[#d9ded9] bg-white p-4 sm:p-5">
          <h3 className="text-sm font-semibold">Dados da ficha cadastral</h3>
          <p className="mt-1 text-[11px] text-[#7b847e]">Preencha todos os campos para emitir a ficha.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FormField label="Inscrição estadual"><input className="field-control" name="inscricaoEstadual" onChange={updateField} value={form.inscricaoEstadual} /></FormField>
            <FormField label="Inscrição municipal"><input className="field-control" name="inscricaoMunicipal" onChange={updateField} value={form.inscricaoMunicipal} /></FormField>
            <FormField label="CNAE principal"><input className="field-control" name="cnaePrincipal" onChange={updateField} value={form.cnaePrincipal} /></FormField>
            <FormField label="CNAEs secundários"><input className="field-control" name="cnaesSecundarios" onChange={updateField} value={form.cnaesSecundarios} /></FormField>
            <FormField label="Ramo de atividade"><input className="field-control" name="ramoAtividade" onChange={updateField} value={form.ramoAtividade} /></FormField>
            <FormField label="Serviço ou produto"><input className="field-control" name="servicoProduto" onChange={updateField} value={form.servicoProduto} /></FormField>
            <FormField label="Quantidade de funcionários"><input className="field-control" min="0" name="quantidadeFuncionarios" onChange={updateField} type="number" value={form.quantidadeFuncionarios} /></FormField>
            <FormField label="Alvarás"><select className="field-control" name="situacaoAlvaras" onChange={updateField} value={form.situacaoAlvaras}><option value="">Selecione</option><option>Prontos</option><option>Em andamento</option><option>Não se aplica</option></select></FormField>
            <FormField label="Participa de licitações"><select className="field-control" name="participaLicitacoes" onChange={updateField} value={form.participaLicitacoes}><option value="">Selecione</option><option value="sim">Sim</option><option value="nao">Não</option></select></FormField>
            <FormField label="Contador anterior"><input className="field-control" name="contadorAnterior" onChange={updateField} value={form.contadorAnterior} /></FormField>
            <FormField label="Data da atualização bancária"><input className="field-control" name="dataAtualizacaoBancaria" onChange={updateField} type="date" value={form.dataAtualizacaoBancaria} /></FormField>
            <FormField label="Pendências fiscais"><select className="field-control" name="pendenciasFiscais" onChange={updateField} value={form.pendenciasFiscais}><option value="">Selecione</option><option value="sim">Sim</option><option value="nao">Não</option></select></FormField>
            <FormField label="Ranking"><select className="field-control" name="ranking" onChange={updateField} value={form.ranking}><option value="">Selecione</option>{["A", "B", "C", "D", "S", "SS"].map((item) => <option key={item}>{item}</option>)}</select></FormField>
          </div>
          <h4 className="mt-6 text-xs font-semibold">Referências comerciais</h4>
          <div className="mt-3 space-y-3">{form.referenciasComerciais.map((item, index) => <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_80px]" key={index}><input aria-label={`Referência ${index + 1}`} className="field-control" placeholder={`Comercial ${index + 1}`} value={item.nome} onChange={(event) => setForm((current) => ({ ...current, referenciasComerciais: current.referenciasComerciais.map((reference, i) => i === index ? { ...reference, nome: event.target.value } : reference) }))} /><input aria-label={`Cidade da referência ${index + 1}`} className="field-control" placeholder="Cidade" value={item.cidade} onChange={(event) => setForm((current) => ({ ...current, referenciasComerciais: current.referenciasComerciais.map((reference, i) => i === index ? { ...reference, cidade: event.target.value } : reference) }))} /><input aria-label={`UF da referência ${index + 1}`} className="field-control uppercase" maxLength={2} placeholder="UF" value={item.uf} onChange={(event) => setForm((current) => ({ ...current, referenciasComerciais: current.referenciasComerciais.map((reference, i) => i === index ? { ...reference, uf: event.target.value.toUpperCase() } : reference) }))} /></div>)}</div>
        </section>

        <section className="mt-7 rounded-panel border border-[#d9ded9] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e5e1] px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold">Sócios vinculados</h3>
              <p className="mt-0.5 text-[11px] text-[#7b847e]">
                Participação total:{" "}
                {form.socios.reduce(
                  (total, item) =>
                    total + Number(item.percentualParticipacao || 0),
                  0,
                )}
                %
              </p>
              {!socios.length ? (
                <p className="mt-1 text-[11px] text-[#9a6c20]">
                  Nenhum sócio cadastrado. Crie um cadastro para vinculá-lo à empresa.
                </p>
              ) : null}
            </div>
            <button
              className="secondary-button h-9 px-3"
              onClick={handleAddSocio}
              type="button"
            >
              <UserRoundPlus size={15} />
              {socios.length ? "Adicionar sócio" : "Cadastrar sócio"}
            </button>
          </div>
          <div className="divide-y divide-[#e5e8e5]">
            {form.socios.length ? (
              form.socios.map((vinculo, index) => (
                <div
                  className="grid gap-3 p-4 sm:grid-cols-[1.2fr_1fr_0.65fr_auto]"
                  key={`${vinculo.socioId}-${index}`}
                >
                  <FormField label="Sócio">
                    <select
                      className="field-control h-10"
                      onChange={(event) =>
                        updateSocio(index, "socioId", event.target.value)
                      }
                      value={vinculo.socioId}
                    >
                      {socios.map((socio) => (
                        <option
                          disabled={
                            socio.id !== vinculo.socioId &&
                            usedSocios.has(socio.id)
                          }
                          key={socio.id}
                          value={socio.id}
                        >
                          {socio.nome}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Cargo">
                    <input
                      className="field-control h-10"
                      onChange={(event) =>
                        updateSocio(index, "cargo", event.target.value)
                      }
                      value={vinculo.cargo}
                    />
                  </FormField>
                  <FormField label="Participação">
                    <div className="relative">
                      <input
                        className="field-control h-10 pr-8"
                        max="100"
                        min="0"
                        onChange={(event) =>
                          updateSocio(
                            index,
                            "percentualParticipacao",
                            event.target.value,
                          )
                        }
                        step="0.01"
                        type="number"
                        value={vinculo.percentualParticipacao}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-[#7c857f]">
                        %
                      </span>
                    </div>
                  </FormField>
                  <button
                    aria-label="Remover vínculo"
                    className="icon-button mt-5 hover:text-coral"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        socios: current.socios.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }))
                    }
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                  <label className="flex items-center gap-2 sm:col-span-2">
                    <input
                      checked={vinculo.recebeProlabore}
                      className="h-4 w-4 accent-[#345c45]"
                      onChange={(event) =>
                        updateSocio(
                          index,
                          "recebeProlabore",
                          event.target.checked,
                        )
                      }
                      type="checkbox"
                    />
                    <span className="text-xs text-[#536058]">
                      Recebe pró-labore
                    </span>
                  </label>
                  {vinculo.recebeProlabore ? (
                    <FormField label="Valor do pró-labore">
                      <input
                        className="field-control h-10"
                        min="0"
                        onChange={(event) =>
                          updateSocio(
                            index,
                            "valorProlabore",
                            event.target.value,
                          )
                        }
                        step="0.01"
                        type="number"
                        value={vinculo.valorProlabore}
                      />
                    </FormField>
                  ) : (
                    <span />
                  )}
                  <FormField label="Data de entrada">
                    <input
                      className="field-control h-10"
                      onChange={(event) =>
                        updateSocio(index, "dataEntrada", event.target.value)
                      }
                      type="date"
                      value={vinculo.dataEntrada}
                    />
                  </FormField>
                </div>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-xs text-[#818a84]">
                Nenhum sócio vinculado.
              </p>
            )}
          </div>
        </section>

        <details className="group mt-4 rounded-panel border border-[#d9ded9] bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 text-sm font-semibold">
            <span>
              Alterações contratuais{" "}
              <span className="ml-1 text-xs font-normal text-[#7e8781]">
                ({form.alteracoes.length})
              </span>
            </span>
            <ChevronDown
              className="transition group-open:rotate-180"
              size={17}
            />
          </summary>
          <div className="border-t border-[#e2e6e2]">
            {form.alteracoes.map((alteracao, index) => (
              <div
                className="grid gap-3 border-b border-[#e5e8e5] p-4 sm:grid-cols-[0.55fr_0.9fr_1.8fr_auto]"
                key={`alteracao-${index}`}
              >
                <FormField label="Número">
                  <input
                    className="field-control h-10"
                    min="1"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        alteracoes: current.alteracoes.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                numeroAlteracao: event.target.value,
                              }
                            : item,
                        ),
                      }))
                    }
                    type="number"
                    value={alteracao.numeroAlteracao}
                  />
                </FormField>
                <FormField label="Data">
                  <input
                    className="field-control h-10"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        alteracoes: current.alteracoes.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, dataAlteracao: event.target.value }
                            : item,
                        ),
                      }))
                    }
                    type="date"
                    value={alteracao.dataAlteracao}
                  />
                </FormField>
                <FormField label="Descrição resumida">
                  <input
                    className="field-control h-10"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        alteracoes: current.alteracoes.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                descricaoResumida: event.target.value,
                              }
                            : item,
                        ),
                      }))
                    }
                    value={alteracao.descricaoResumida}
                  />
                </FormField>
                <button
                  aria-label="Remover alteração"
                  className="icon-button mt-5 hover:text-coral"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      alteracoes: current.alteracoes.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    }))
                  }
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              className="flex w-full items-center justify-center gap-2 px-4 py-4 text-xs font-semibold text-moss transition hover:bg-[#f3f7f3]"
              onClick={addAlteracao}
              type="button"
            >
              <Plus size={15} />
              Adicionar alteração contratual
            </button>
          </div>
        </details>
      </DrawerShell>
    </form>
  );
}
