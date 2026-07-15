# AutCompany

Aplicativo interno para cadastro e gestão de empresas clientes de um escritório contábil.

## Rotas atuais

- `/`: dashboard alimentado pelo PostgreSQL.
- `/empresas/nova`: criação do cadastro e importação opcional do Cartão CNPJ em PDF.
- `/empresas/[id]`: central do cadastro, com dados principais, sócios, contatos, certificados, histórico e documentos.
- `/empresas/[id]/editar`: edição dos dados principais.

As rotas de ficha automática, faturamento e autenticação serão implementadas em etapas posteriores. Até a autenticação estar pronta, o sistema não deve ser exposto na internet nem usado com dados reais em uma rede não confiável.

## Stack

- Next.js (App Router), React e TypeScript
- Server Actions no Node.js
- Prisma ORM e PostgreSQL
- CSS responsivo

## Executar

1. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`.
2. Instale as dependências com `pnpm install`.
3. Crie a estrutura com `pnpm db:migrate`.
4. Opcionalmente carregue dados de exemplo com `pnpm db:seed`.
5. Inicie com `pnpm dev`.

Sem conexão com PostgreSQL, o dashboard mostra um aviso de indisponibilidade e não exibe dados demonstrativos como se fossem registros reais. Cadastros e edições exigem o banco configurado.

## Migração de um banco criado anteriormente com `db:push`

O projeto agora possui uma migração de baseline e uma migração aditiva para o cadastro completo. Em um banco que já contém as tabelas antigas, faça backup e marque somente a baseline como aplicada antes de executar a nova migração:

```powershell
pnpm exec prisma migrate resolve --applied 20260714000000_baseline
pnpm exec prisma migrate deploy
```

Em um banco novo e vazio, execute apenas `pnpm exec prisma migrate deploy`. Não use `prisma migrate reset` em banco com dados.

## Cartão CNPJ e certificados

O importador aceita o PDF original da Receita Federal com texto selecionável, preenche apenas campos vazios e suporta CNPJ numérico e alfanumérico. PDFs digitalizados como imagem ainda não possuem OCR.

O controle de certificados registra titular PJ/PF, tipo, emissora, emissão e vencimento. Senhas e arquivos de certificado digital não são armazenados.

## Verificação

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```
