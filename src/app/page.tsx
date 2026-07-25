import {
  ArrowRight,
  BarChart3,
  Calculator,
  FileCheck2,
  FileSignature,
  MessagesSquare,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { QuickNotes } from "@/components/quick-notes";
import { cn } from "@/lib/format";

const modules = [
  {
    title: "Gerador de contratos",
    description: "Crie, personalize e gerencie contratos com mais agilidade.",
    href: "/apps/gerador-contratos",
    icon: FileSignature,
    tone: "moss",
    featured: true,
  },
  {
    title: "Contabilidade",
    description: "Lançamentos, apurações e obrigações.",
    href: "/apps/contabilidade",
    icon: Calculator,
    tone: "sage",
  },
  {
    title: "Contrato de prestação de serviços",
    description: "Gere contrato e procuração com os dados cadastrados.",
    href: "/apps/contrato-prestacao-servicos",
    icon: FileCheck2,
    tone: "moss",
  },
  {
    title: "Respostas rápidas",
    description: "Encontre e copie mensagens usadas no atendimento.",
    href: "/apps/respostas-rapidas",
    icon: MessagesSquare,
    tone: "sage",
  },
  {
    title: "Clientes e banco de dados",
    description: "Gerencie clientes, contatos e documentos.",
    href: "/db-admin",
    icon: UsersRound,
    tone: "lavender",
  },
  {
    title: "Dashboard gerencial",
    description: "Acompanhe indicadores e resultados.",
    href: "/dashboard",
    icon: BarChart3,
    tone: "moss",
  },
];

const toneClasses = {
  moss: {
    bar: "bg-moss",
    icon: "text-moss bg-[#eef4ef]",
    arrow: "text-moss",
  },
  sage: {
    bar: "bg-sage",
    icon: "text-[#5c7f66] bg-[#f0f5f1]",
    arrow: "text-[#5c7f66]",
  },
  lavender: {
    bar: "bg-lavender",
    icon: "text-[#796ba2] bg-lavender/15",
    arrow: "text-[#796ba2]",
  },
};

export default function HomePage() {
  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <div className="grid gap-9 lg:grid-cols-[minmax(0,1.65fr)_minmax(330px,0.75fr)] lg:gap-14">
        <section>
          <h1 className="max-w-3xl text-[3.4rem] font-semibold leading-[0.98] tracking-[-0.055em] text-ink sm:text-[4.6rem]">
            Olá, bom dia.
          </h1>
          <p className="mt-6 text-xl tracking-[-0.025em] text-[#69716c] sm:text-2xl">
            O que vamos organizar hoje?
          </p>

          <div className="mt-11 space-y-3">
            {modules.map((module) => {
              const Icon = module.icon;
              const tone = toneClasses[module.tone as keyof typeof toneClasses];
              return (
                <Link
                  className={cn(
                    "group relative flex min-h-[86px] items-center overflow-hidden rounded-panel border border-[#d5dbd5] bg-white/65 pr-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#b9c4bb] hover:bg-white hover:shadow-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#345c4526]",
                    module.featured && "min-h-[152px]",
                  )}
                  href={module.href}
                  key={module.href}
                >
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 w-2",
                      tone.bar,
                    )}
                  />
                  <span
                    className={cn(
                      "ml-8 grid shrink-0 place-items-center rounded-2xl transition duration-300 group-hover:scale-105 sm:ml-10",
                      module.featured ? "h-16 w-16" : "h-12 w-12",
                      tone.icon,
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      size={module.featured ? 31 : 24}
                      strokeWidth={1.65}
                    />
                  </span>
                  <span className="min-w-0 flex-1 px-5 sm:px-7">
                    <span
                      className={cn(
                        "block font-semibold tracking-[-0.025em] text-ink",
                        module.featured ? "text-2xl" : "text-[15px]",
                      )}
                    >
                      {module.title}
                    </span>
                    <span
                      className={cn(
                        "mt-1 block text-[#768079]",
                        module.featured ? "text-sm" : "text-xs",
                      )}
                    >
                      {module.description}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d2d8d2] bg-white transition duration-300 group-hover:translate-x-1 group-hover:border-[#b8c4ba]",
                      tone.arrow,
                    )}
                  >
                    <ArrowRight size={17} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <QuickNotes />
      </div>
    </div>
  );
}
