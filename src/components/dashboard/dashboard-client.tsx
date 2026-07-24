"use client";

import {
  BarChart3,
  Building2,
  RotateCcw,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency, formatDate, numberFormatter } from "@/lib/format";
import type {
  EmpresaDTO,
  LancamentoDTO,
  SocioDTO,
} from "@/lib/types";

const regimeColors: Record<string, string> = {
  "Simples Nacional": "#345C45",
  "Lucro Presumido": "#7E9B86",
  "Lucro Real": "#A89ACB",
  MEI: "#E86D55",
};

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: "UTC",
});

function monthKey(value: string) {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function DashboardClient({
  empresas,
  socios,
  lancamentos,
}: {
  empresas: EmpresaDTO[];
  socios: SocioDTO[];
  lancamentos: LancamentoDTO[];
}) {
  const [tipo, setTipo] = useState("Todos");
  const [regime, setRegime] = useState("Todos");
  const [periodo, setPeriodo] = useState("6");

  const tipos = useMemo(
    () =>
      Array.from(
        new Set(
          empresas
            .map((empresa) => empresa.tipoCliente)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [empresas],
  );
  const regimes = useMemo(
    () =>
      Array.from(
        new Set(empresas.map((empresa) => empresa.regimeTributario)),
      ),
    [empresas],
  );

  const filteredEmpresas = useMemo(
    () =>
      empresas.filter(
        (empresa) =>
          (tipo === "Todos" || empresa.tipoCliente === tipo) &&
          (regime === "Todos" || empresa.regimeTributario === regime),
      ),
    [empresas, regime, tipo],
  );
  const filteredIds = useMemo(
    () => new Set(filteredEmpresas.map((empresa) => empresa.id)),
    [filteredEmpresas],
  );

  const chartData = useMemo(() => {
    const totals = new Map<string, number>();
    lancamentos.forEach((lancamento) => {
      if (lancamento.tipo !== "ENTRADA" || !filteredIds.has(lancamento.empresaId)) {
        return;
      }
      const key = monthKey(lancamento.competencia);
      totals.set(key, (totals.get(key) ?? 0) + lancamento.valor);
    });
    const items = Array.from(totals, ([key, valor]) => {
      const [year, month] = key.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, 1));
      return {
        key,
        month: monthFormatter
          .format(date)
          .replace(".", "")
          .replace(/^./, (value) => value.toUpperCase()),
        valor,
      };
    }).sort((a, b) => a.key.localeCompare(b.key));
    return periodo === "all" ? items : items.slice(-Number(periodo));
  }, [filteredIds, lancamentos, periodo]);

  const regimeData = useMemo(() => {
    const counts = new Map<string, number>();
    filteredEmpresas.forEach((empresa) =>
      counts.set(
        empresa.regimeTributario,
        (counts.get(empresa.regimeTributario) ?? 0) + 1,
      ),
    );
    return Array.from(counts, ([name, value]) => ({
      name,
      value,
      color: regimeColors[name] ?? "#AEB7B0",
    })).sort((a, b) => b.value - a.value);
  }, [filteredEmpresas]);

  const partnerCount = useMemo(() => {
    if (tipo === "Todos" && regime === "Todos") return socios.length;
    return new Set(
      filteredEmpresas.flatMap((empresa) =>
        empresa.socios.map((vinculo) => vinculo.socioId),
      ),
    ).size;
  }, [filteredEmpresas, regime, socios.length, tipo]);

  const currentRevenue = chartData.at(-1)?.valor ?? 0;
  const activeCount = filteredEmpresas.filter(
    (empresa) => !empresa.dataBaixa,
  ).length;

  function resetFilters() {
    setTipo("Todos");
    setRegime("Todos");
    setPeriodo("6");
  }

  return (
    <>
      <section
        aria-label="Filtros do dashboard"
        className="mt-9 grid gap-4 border-b border-[#d9ded9] pb-6 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1fr_auto]"
      >
        <label>
          <span className="field-label">Tipo de cliente</span>
          <select
            className="field-control"
            onChange={(event) => setTipo(event.target.value)}
            value={tipo}
          >
            <option>Todos</option>
            {tipos.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Regime tributário</span>
          <select
            className="field-control"
            onChange={(event) => setRegime(event.target.value)}
            value={regime}
          >
            <option>Todos</option>
            {regimes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Período</span>
          <select
            className="field-control"
            onChange={(event) => setPeriodo(event.target.value)}
            value={periodo}
          >
            <option value="6">Últimos 6 meses</option>
            <option value="12">Últimos 12 meses</option>
            <option value="all">Todo o período</option>
          </select>
        </label>
        <button
          className="secondary-button self-end border-transparent bg-transparent px-2 shadow-none"
          onClick={resetFilters}
          type="button"
        >
          <RotateCcw size={15} />
          Limpar filtros
        </button>
      </section>

      <section className="grid border-b border-[#d9ded9] py-5 sm:grid-cols-3">
        <Metric
          icon={Building2}
          label="Empresas ativas"
          value={numberFormatter.format(activeCount)}
        />
        <Metric
          icon={UsersRound}
          label="Total de sócios"
          value={numberFormatter.format(partnerCount)}
        />
        <Metric
          icon={WalletCards}
          label="Faturamento do mês"
          value={formatCurrency(currentRevenue)}
        />
      </section>

      <section className="grid gap-8 py-7 xl:grid-cols-[1.55fr_0.8fr]">
        <div className="min-w-0">
          <div className="section-rule">
            <h2 className="text-lg font-semibold tracking-[-0.025em]">
              Faturamento mensal
            </h2>
            <p className="mt-1 text-xs text-[#7b847e]">
              Entradas reconhecidas por competência.
            </p>
          </div>
          <div className="mt-5 h-[340px] min-w-0 rounded-panel border border-[#dfe4df] bg-white/60 px-1 py-4 sm:px-4">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart
                data={chartData}
                margin={{ bottom: 4, left: 0, right: 14, top: 12 }}
              >
                <defs>
                  <linearGradient id="revenueArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7E9B86" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#7E9B86" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#E5E9E5"
                  strokeDasharray="3 5"
                  vertical={false}
                />
                <XAxis
                  axisLine={false}
                  dataKey="month"
                  fontSize={11}
                  tick={{ fill: "#69736C" }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  fontSize={11}
                  tick={{ fill: "#69736C" }}
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #D9DED9",
                    borderRadius: "12px",
                    boxShadow: "0 10px 30px rgba(23,32,27,.12)",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Faturamento",
                  ]}
                />
                <Area
                  activeDot={{
                    fill: "#345C45",
                    r: 5,
                    stroke: "#FFFFFF",
                    strokeWidth: 3,
                  }}
                  dataKey="valor"
                  fill="url(#revenueArea)"
                  stroke="#345C45"
                  strokeWidth={2.5}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 xl:border-l xl:border-[#dde2dd] xl:pl-8">
          <div className="section-rule">
            <h2 className="text-lg font-semibold tracking-[-0.025em]">
              Empresas por regime tributário
            </h2>
            <p className="mt-1 text-xs text-[#7b847e]">
              Distribuição da carteira filtrada.
            </p>
          </div>
          <div className="mt-5 rounded-panel border border-[#dfe4df] bg-white/60 p-5">
            <div className="mx-auto h-[210px] max-w-[280px]">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={regimeData}
                    dataKey="value"
                    innerRadius={56}
                    outerRadius={89}
                    paddingAngle={1.5}
                    stroke="#F7F8F5"
                    strokeWidth={2}
                  >
                    {regimeData.map((entry) => (
                      <Cell fill={entry.color} key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      border: "1px solid #D9DED9",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-3">
              {regimeData.map((item) => (
                <div
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-[11px]"
                  key={item.name}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span className="text-[#5e6861]">{item.name}</span>
                  <span className="font-semibold text-ink">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#d9ded9] pt-6">
        <div className="section-rule">
          <h2 className="text-lg font-semibold tracking-[-0.025em]">
            Atividades recentes
          </h2>
        </div>
        <div className="mt-4 overflow-x-auto rounded-panel border border-[#d9ded9] bg-white/65">
          <table className="data-table min-w-[760px]">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Atividade</th>
                <th>Tipo</th>
                <th>Vencimento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos
                .filter((item) => filteredIds.has(item.empresaId))
                .slice(-3)
                .reverse()
                .map((item) => (
                  <tr key={item.id}>
                    <td className="font-semibold text-ink">
                      {item.empresaNome}
                    </td>
                    <td>{item.descricao}</td>
                    <td>
                      <span
                        className={
                          item.tipo === "ENTRADA"
                            ? "font-semibold text-moss"
                            : "font-semibold text-coral"
                        }
                      >
                        {item.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td>{formatDate(item.vencimento)}</td>
                    <td>
                      <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#34714c]">
                        <span className="h-2 w-2 rounded-full bg-[#3b8056]" />
                        {item.pago ? "Concluída" : "Pendente"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-[#e2e6e2] px-2 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-2 sm:last:border-r-0">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#a8bbaa] bg-[#f3f7f3] text-moss">
        <Icon size={22} strokeWidth={1.65} />
      </span>
      <span>
        <span className="block text-[11px] font-medium text-[#6c766f]">
          {label}
        </span>
        <span className="mt-1 block text-2xl font-semibold tracking-[-0.04em] text-ink lg:text-[1.75rem]">
          {value}
        </span>
      </span>
    </div>
  );
}
