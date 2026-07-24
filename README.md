# Nexo Contábil

Aplicação local de gestão contábil modular construída com Next.js (App Router),
TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL e Recharts.

## Executar

```bash
pnpm install
pnpm db:generate
pnpm dev
```

Acesse `http://localhost:3000`.

Sem `DATABASE_URL`, a aplicação inicia em **modo demonstração** com dados em
memória, permitindo testar todos os fluxos da interface.

## Conectar ao PostgreSQL

1. Copie `.env.example` para `.env`.
2. Ajuste `DATABASE_URL` para o banco local.
3. Crie as tabelas e inicie o projeto:

```bash
pnpm db:push
pnpm dev
```

## Rotas

- `/` — início, módulos e lembretes locais
- `/dashboard` — indicadores, filtros e gráficos
- `/db-admin` — CRUD de empresas, sócios, vínculos e alterações
- `/apps/gerador-contratos` — preenchimento e impressão/PDF
- `/apps/contabilidade` — entradas, saídas e vencimentos
- `/apps` e `/app/apps` — hub de aplicações

## Validação

```bash
pnpm typecheck
pnpm lint
pnpm build
```
