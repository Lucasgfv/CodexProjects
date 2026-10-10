"use client";

import { AlertTriangle, ArrowRight, UsersRound } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { FiscalCompanyDTO, FiscalMeiDTO } from "@/lib/fiscal-leve";

import {
  companyProgress,
  limitPercent,
  meiLimitTone,
  openTasks,
} from "./fiscal-utils";

const COLORS = {
  done: "#345c45",
  inProgress: "#8eaa95",
  pending: "#f1bb3f",
  danger: "#e86d55",
  lavender: "#a89acb",
};

function countTaskStatus(companies: FiscalCompanyDTO[], taskName: string) {
  const result = { done: 0, in_progress: 0, pending: 0, not_applicable: 0 };
  for (const company of companies) {
    const task = company.tasks.find((item) => item.name === taskName);
    if (task) result[task.status] += 1;
  }
  return result;
}

function LegendRow({
  color,
  label,
  value,
  total,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 border-b border-[#edf0ed] py-2.5 text-[11px] last:border-0">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      <span className="text-[#5f6962]">{label}</span>
      <strong className="text-ink">{value}</strong>
      <span className="w-9 text-right text-[#89918b]">
        {total ? Math.round((value / total) * 100) : 0}%
      </span>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-panel border border-[#dce1dc] bg-white p-5 shadow-[0_10px_30px_rgba(23,32,27,0.035)] ${className}`}
    >
      <header>
        <h2 className="text-[17px] font-semibold tracking-[-0.025em] text-ink">
          {title}
        </h2>
        <p className="mt-1 text-[11px] leading-5 text-[#778079]">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

export function FiscalOverview({
  companies,
  meis,
  onOpenCompany,
  onOpenMei,
}: {
  companies: FiscalCompanyDTO[];
  meis: FiscalMeiDTO[];
  onOpenCompany: (id: string) => void;
  onOpenMei: (id: string) => void;
}) {
  const calculations = useMemo(() => {
    const apuracao = countTaskStatus(companies, "Apuração Simples");
    const sped = countTaskStatus(companies, "SPED ICMS");
    const destda = countTaskStatus(companies, "DeSTDA");
    const applicableApuracao =
      apuracao.done + apuracao.in_progress + apuracao.pending;

    const analysis = { regular: 0, pending: 0, attention: 0, overdue: 0 };
    for (const company of companies) {
      const count = openTasks(company).length;
      if (count === 0) analysis.regular += 1;
      else if (count >= 5) analysis.overdue += 1;
      else if (count >= 3) analysis.attention += 1;
      else analysis.pending += 1;
    }

    const limits = { safe: 0, attention: 0, danger: 0 };
    for (const mei of meis) limits[meiLimitTone(mei)] += 1;

    const tasks = companies.flatMap((company) => company.tasks).filter(
      (task) => task.status !== "not_applicable",
    );
    const onTime = tasks.filter((task) => task.status === "done").length;
    const overdue = tasks.length - onTime;

    return {
      apuracao,
      applicableApuracao,
      spedData: [
        {
          name: "SPED ICMS",
          Entregues: sped.done,
          "Em andamento": sped.in_progress,
          Pendentes: sped.pending,
        },
        {
          name: "DeSTDA",
          Entregues: destda.done,
          "Em andamento": destda.in_progress,
          Pendentes: destda.pending,
        },
      ],
      analysis,
      limits,
      onTime,
      overdue,
    };
  }, [companies, meis]);

  const priorities = useMemo(
    () =>
      [...companies]
        .filter((company) => openTasks(company).length > 0)
        .sort(
          (a, b) =>
            openTasks(b).length - openTasks(a).length ||
            companyProgress(a) - companyProgress(b),
        )
        .slice(0, 6),
    [companies],
  );

  const nearLimit = useMemo(
    () =>
      [...meis]
        .filter((mei) => meiLimitTone(mei) !== "safe")
        .sort((a, b) => limitPercent(b) - limitPercent(a))
        .slice(0, 2),
    [meis],
  );

  const apuracaoData = [
    { name: "Apuradas", value: calculations.apuracao.done, color: COLORS.done },
    {
      name: "Em apuração",
      value: calculations.apuracao.in_progress,
      color: COLORS.inProgress,
    },
    {
      name: "Com pendência",
      value: calculations.apuracao.pending,
      color: COLORS.pending,
    },
  ];

  const limitData = [
    {
      name: "Faturamento regular",
      value: calculations.limits.safe,
      color: "#4f9668",
    },
    {
      name: "Próximo de R$ 64.800",
      value: calculations.limits.attention,
      color: COLORS.pending,
    },
    {
      name: "Limite estourado",
      value: calculations.limits.danger,
      color: COLORS.danger,
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
      <div className="grid min-w-0 gap-4 lg:grid-cols-6">
        <Panel
          className="lg:col-span-3"
          description={`Situação do Simples Nacional (${calculations.applicableApuracao} clientes aplicáveis)`}
          title="Apurações"
        >
          <div className="mt-4 grid items-center gap-3 sm:grid-cols-[190px_1fr]">
            <div className="relative h-[180px] min-w-0">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    data={apuracaoData}
                    dataKey="value"
                    innerRadius={48}
                    isAnimationActive={false}
                    outerRadius={76}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {apuracaoData.map((item) => (
                      <Cell fill={item.color} key={item.name} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                <strong className="text-2xl tracking-[-0.04em] text-ink">
                  {calculations.applicableApuracao}
                </strong>
                <span className="text-[10px] text-[#7a837d]">clientes</span>
              </div>
            </div>
            <div>
              {apuracaoData.map((item) => (
                <LegendRow
                  color={item.color}
                  key={item.name}
                  label={item.name}
                  total={calculations.applicableApuracao}
                  value={item.value}
                />
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-3"
          description={`Entregas da competência (${companies.length} clientes)`}
          title="SPED / DeSTDA"
        >
          <div className="mt-4 h-[215px]">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={calculations.spedData} margin={{ left: -20 }}>
                <CartesianGrid stroke="#e7ebe7" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="name"
                  fontSize={10}
                  tick={{ fill: "#667068" }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  fontSize={10}
                  tick={{ fill: "#879089" }}
                  tickLine={false}
                />
                <Tooltip />
                <Bar
                  dataKey="Entregues"
                  fill={COLORS.done}
                  isAnimationActive={false}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Em andamento"
                  fill={COLORS.inProgress}
                  isAnimationActive={false}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Pendentes"
                  fill={COLORS.pending}
                  isAnimationActive={false}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          description={`Situação geral de ${companies.length + meis.length} clientes`}
          title="Análise fiscal"
        >
          <div className="mt-4">
            <LegendRow
              color={COLORS.done}
              label="Regular"
              total={companies.length}
              value={calculations.analysis.regular}
            />
            <LegendRow
              color={COLORS.pending}
              label="Com pendências"
              total={companies.length}
              value={calculations.analysis.pending}
            />
            <LegendRow
              color={COLORS.lavender}
              label="Em atenção"
              total={companies.length}
              value={calculations.analysis.attention}
            />
            <LegendRow
              color={COLORS.danger}
              label="Em atraso"
              total={companies.length}
              value={calculations.analysis.overdue}
            />
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          description={`Faturamento acumulado (${meis.length} MEIs)`}
          title="Status de limite do MEI"
        >
          <div className="mt-2 grid items-center gap-2 sm:grid-cols-[125px_1fr] lg:grid-cols-1 2xl:grid-cols-[125px_1fr]">
            <div className="relative h-[125px]">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    data={limitData}
                    dataKey="value"
                    innerRadius={34}
                    isAnimationActive={false}
                    outerRadius={54}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {limitData.map((item) => (
                      <Cell fill={item.color} key={item.name} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                <strong className="text-xl text-ink">{meis.length}</strong>
                <span className="text-[9px] text-[#7a837d]">MEIs</span>
              </div>
            </div>
            <div>
              {limitData.map((item) => (
                <LegendRow
                  color={item.color}
                  key={item.name}
                  label={item.name}
                  total={meis.length}
                  value={item.value}
                />
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          description="Obrigações da competência"
          title="Pendências"
        >
          <div className="mt-3 h-[175px]">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={[
                  { name: "Em dia", value: calculations.onTime, fill: COLORS.done },
                  {
                    name: "Em atraso",
                    value: calculations.overdue,
                    fill: COLORS.danger,
                  },
                ]}
                margin={{ left: -22 }}
              >
                <CartesianGrid stroke="#e7ebe7" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="name"
                  fontSize={10}
                  tick={{ fill: "#667068" }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  fontSize={10}
                  tick={{ fill: "#879089" }}
                  tickLine={false}
                />
                <Tooltip />
                <Bar
                  dataKey="value"
                  isAnimationActive={false}
                  radius={[5, 5, 0, 0]}
                >
                  {[
                    { fill: COLORS.done },
                    { fill: COLORS.danger },
                  ].map((item, index) => (
                    <Cell fill={item.fill} key={index} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <aside className="rounded-panel border border-[#dce1dc] bg-white shadow-[0_10px_30px_rgba(23,32,27,0.035)]">
        <div className="border-b border-[#e5e9e5] p-5">
          <div className="flex items-center gap-2 text-ink">
            <AlertTriangle className="text-[#c88e18]" size={18} />
            <h2 className="text-[17px] font-semibold tracking-[-0.025em]">
              Prioridades da competência
            </h2>
          </div>
          <p className="mt-1 text-[11px] text-[#778079]">
            Clientes com mais atividades abertas.
          </p>
        </div>
        <div>
          {priorities.map((company) => (
            <button
              className="group flex w-full items-center gap-3 border-b border-[#edf0ed] px-5 py-4 text-left transition hover:bg-[#f7faf7]"
              key={company.id}
              onClick={() => onOpenCompany(company.id)}
              type="button"
            >
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-[12px] font-semibold text-ink">
                  {company.name}
                </strong>
                <span className="mt-1 block text-[10px] text-[#7b847e]">
                  {company.responsible} · {openTasks(company).length} pendências
                </span>
              </span>
              <ArrowRight
                className="text-[#9aa29c] transition group-hover:translate-x-1 group-hover:text-moss"
                size={16}
              />
            </button>
          ))}
          {nearLimit.map((mei) => (
            <button
              className="group flex w-full items-center gap-3 border-b border-[#edf0ed] px-5 py-4 text-left transition hover:bg-[#f7faf7]"
              key={mei.id}
              onClick={() => onOpenMei(mei.id)}
              type="button"
            >
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-[12px] font-semibold text-ink">
                  {mei.name}
                </strong>
                <span className="mt-1 block text-[10px] text-[#b17408]">
                  MEI · {limitPercent(mei)}% do limite
                </span>
              </span>
              <ArrowRight
                className="text-[#9aa29c] transition group-hover:translate-x-1 group-hover:text-moss"
                size={16}
              />
            </button>
          ))}
        </div>
        <div className="m-5 flex items-center gap-3 rounded-xl bg-[#edf3ee] p-4 text-moss">
          <UsersRound size={20} />
          <div>
            <strong className="block text-xl tracking-[-0.04em]">
              {companies.length + meis.length}
            </strong>
            <span className="text-[10px] font-medium">clientes acompanhados</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
