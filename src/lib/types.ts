export type EmpresaSocioDTO = {
  id: string;
  socioId: string;
  nome: string;
  cpf: string;
  nacionalidade: string | null;
  estadoCivil: string | null;
  profissao: string | null;
  rg: string | null;
  orgaoEmissor: string | null;
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  cargo: string | null;
  percentualParticipacao: number;
  recebeProlabore: boolean;
  valorProlabore: number | null;
  dataEntrada: string;
  dataSaida: string | null;
};

export type AlteracaoContratualDTO = {
  id: string;
  numeroAlteracao: number | null;
  dataAlteracao: string;
  descricaoResumida: string | null;
};

export type EmpresaDTO = {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  tipoCliente: string | null;
  porte: string | null;
  regimeTributario: string;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  capitalSocial: number | null;
  honorarioMensal: number | null;
  dataInicio: string;
  dataBaixa: string | null;
  socios: EmpresaSocioDTO[];
  alteracoesContratuais: AlteracaoContratualDTO[];
};

export type SocioDTO = {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  email: string | null;
  telefone: string | null;
  nacionalidade: string | null;
  estadoCivil: string | null;
  profissao: string | null;
  rg: string | null;
  orgaoEmissor: string | null;
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  totalEmpresas: number;
};

export type LancamentoDTO = {
  id: string;
  empresaId: string;
  empresaNome: string;
  tipo: "ENTRADA" | "SAIDA";
  descricao: string;
  valor: number;
  vencimento: string;
  competencia: string;
  pago: boolean;
};

export type EmpresaInput = Omit<
  EmpresaDTO,
  "id" | "socios" | "alteracoesContratuais"
> & {
  sociosVinculados?: Array<{
    socioId: string;
    cargo?: string | null;
    percentualParticipacao: number;
    recebeProlabore: boolean;
    valorProlabore?: number | null;
    dataEntrada: string;
    dataSaida?: string | null;
  }>;
  alteracoes?: Array<{
    numeroAlteracao?: number | null;
    dataAlteracao: string;
    descricaoResumida?: string | null;
  }>;
};

export type SocioInput = Omit<SocioDTO, "id" | "totalEmpresas">;

export type LancamentoInput = Omit<
  LancamentoDTO,
  "id" | "empresaNome"
>;

export type DatabaseStatus = {
  connected: boolean;
  mode: "postgresql" | "demo";
  label: string;
};
