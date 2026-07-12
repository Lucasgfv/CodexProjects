# AutCompany

Aplicativo interno para cadastro, gestão e impressão de fichas de empresas clientes de um escritório contábil.

## Stack

- Next.js (App Router), React e TypeScript
- Server Actions no Node.js
- Prisma ORM e PostgreSQL
- CSS responsivo com folha A4 dedicada para impressão

## Executar

1. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`.
2. Instale as dependências com `pnpm install`.
3. Crie a estrutura com `pnpm db:push` (ou `pnpm db:migrate`).
4. Opcionalmente carregue dados de exemplo com `pnpm db:seed`.
5. Inicie com `pnpm dev`.

Sem conexão com PostgreSQL, a página inicial e a ficha demonstrativa continuam disponíveis em modo de demonstração. Cadastros e edições eigem o banco configurado.

## Impressão

Na ficha cadastral, use **Imprimir ficha**. O CSS define A4 retrato, containers indivisíveis e workflow fixado na base física da folha sem sobrepor o conteúdo.
