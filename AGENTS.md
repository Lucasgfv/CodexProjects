# AGENTS.md — AutCompany

Este arquivo orienta pessoas e agentes de IA que alteram este repositório. O objetivo é manter o AutCompany simples, previsível, seguro para os dados dos clientes e fácil de manter.

## Objetivo e prioridades

O AutCompany é um sistema interno para cadastrar, consultar, editar e imprimir fichas de empresas de um escritório contábil. Priorize, nesta ordem:

1. Não perder nem corromper dados de empresas e sócios.
2. Manter cadastro, edição, consulta e impressão funcionando.
3. Validar dados no servidor e apresentar erros compreensíveis.
4. Preservar uma estrutura simples e consistente.
5. Manter boa experiência em desktop, celular e impressão A4.

## Stack e estrutura atual

- `app/`: rotas do Next.js App Router, páginas e Server Actions.
- `components/`: formulários e componentes de interface reutilizáveis.
- `lib/`: utilitários e instância compartilhada do Prisma.
- `prisma/schema.prisma`: fonte de verdade do modelo do banco.
- `prisma/seed.ts`: dados de demonstração/desenvolvimento.
- `compose.yml`: aplicação, PostgreSQL e pgAdmin em Docker.
- `app/globals.css`: estilos globais, responsivos e de impressão.

Tecnologias: Next.js 15, React 19, TypeScript estrito, Prisma 6, PostgreSQL 16, pnpm e Docker Compose.

## Antes de alterar

- Leia `README.md`, este arquivo e `MANUAL_REINICIALIZACAO.md`.
- Execute `git status --short` e preserve alterações existentes que não fazem parte da tarefa.
- Localize a rota, o componente, a Server Action e os modelos afetados antes de editar.
- Nunca copie valores reais de `.env` para código, documentação, commit ou diagnóstico.
- Prefira uma mudança pequena e completa a uma refatoração ampla sem necessidade.

## Organização e padrões

- Mantenha páginas e layouts em `app/`, componentes de UI em `components/` e código compartilhado em `lib/`.
- Use o alias `@/` para imports internos.
- Use Server Components por padrão. Adicione `"use client"` somente quando houver estado, eventos ou API do navegador.
- Centralize o acesso ao banco no Prisma; não espalhe SQL ou novas instâncias de `PrismaClient`.
- Extraia lógica repetida de normalização, validação e formatação para funções com nomes claros.
- Se uma página misturar consulta, formulário e apresentação complexa, separe por responsabilidade.
- Não adicione dependências quando uma solução curta com a stack atual for suficiente.
- Mantenha textos da interface em português e arquivos em UTF-8.

## Banco de dados e Prisma

- Trate `prisma/schema.prisma` como fonte de verdade.
- Para mudanças versionadas no modelo, prefira `pnpm db:migrate` e inclua a migração gerada no commit.
- Use `pnpm db:push` somente para protótipos locais ou inicialização prevista; ele não substitui o histórico de migrações.
- Antes de remover ou renomear campos, tabelas, enums ou relações, planeje a migração e faça backup.
- Não execute `docker compose down -v`, `prisma migrate reset` ou equivalentes sem autorização explícita: eles podem apagar o banco.
- Preserve restrições importantes, especialmente unicidade de CNPJ e CPF e relações com exclusão em cascata.
- O seed deve ser seguro para desenvolvimento e nunca sobrescrever dados reais silenciosamente.

## Server Actions, validação e segurança

- Valide no servidor toda entrada do usuário, mesmo que o navegador já valide.
- Normalize CNPJ, CPF, CEP, telefone, e-mail, datas, números e UF antes de persistir quando a tarefa envolver esses campos.
- Não confie em casts TypeScript para validar enums recebidos por `FormData`; confira os valores em tempo de execução.
- Converta números e datas explicitamente e trate valores inválidos antes de chamar o Prisma.
- Mostre mensagens úteis para erros esperados. Não exponha credenciais, stack traces ou detalhes internos do banco.
- Ao alterar dados, revalide todas as rotas afetadas.
- Use transação quando operações em várias tabelas puderem deixar dados inconsistentes após falha parcial.
- Antes de ampliar o uso, priorize autenticação, autorização e proteção das rotas de alteração e exclusão.

## Interface e impressão

- Preserve acessibilidade: labels associados, teclado, foco visível e HTML semântico.
- Verifique estados vazio, carregando, sucesso e erro quando aplicáveis.
- Teste celular e desktop após mudanças de layout.
- Confira mudanças na ficha também na impressão A4 retrato.
- Não deixe botões ou navegação aparecerem na folha impressa.
- Evite quebrar blocos essenciais entre páginas ou sobrepor o workflow do rodapé.

## Qualidade e verificações

Após instalar as dependências, execute na raiz:

```powershell
pnpm exec tsc --noEmit
pnpm build
```

O projeto ainda não possui suíte de testes automatizados. Ao implementar lógica relevante, adicione testes apropriados e cubra principalmente normalização, validação, ações de cadastro/edição e regras do banco.

O script `pnpm lint` só deve ser usado depois de confirmar que está configurado e compatível com a versão atual do Next.js. Se estiver quebrado por configuração, corrija-o em uma tarefa própria e documente o comando válido.

Checklist manual mínimo para mudanças funcionais:

1. Abrir a página inicial.
2. Criar uma empresa com dados válidos.
3. Confirmar rejeição de dados obrigatórios inválidos.
4. Abrir e editar a empresa criada.
5. Adicionar um sócio, quando a mudança tocar essa área.
6. Conferir a ficha em desktop, celular e impressão.
7. Confirmar que os dados continuam após reiniciar a aplicação.

## Docker e ambiente local

- Local: PostgreSQL acessível pela `DATABASE_URL` de `.env`, depois `pnpm dev`.
- Containers: `docker compose up --build`.
- Dentro do container, o host do banco é `db`; fora dele, normalmente é `localhost`.
- Ao alterar portas, volumes ou credenciais de desenvolvimento, atualize `compose.yml`, `.env.example`, `README.md` e o manual.
- Nunca comite `.env`. Documente novas variáveis com valores seguros em `.env.example`.

## Ordem recomendada de melhorias

1. Corrigir problemas de codificação UTF-8 visíveis nos textos.
2. Adicionar validação robusta no servidor e mensagens de erro nos formulários.
3. Implementar autenticação e autorização antes de uso com dados reais ou acesso em rede.
4. Criar testes automatizados e um comando único de verificação.
5. Versionar mudanças do banco com migrações Prisma.
6. Adicionar confirmação e proteção para exclusões.
7. Configurar lint e integração contínua para tipos, testes e build.
8. Criar estratégia documentada de backup e restauração do PostgreSQL.
9. Adicionar observabilidade sem registrar dados pessoais ou fiscais sensíveis.

## Commits, revisão e definição de pronto

- Um commit deve representar uma mudança coerente.
- Formato sugerido: `tipo(área): descrição curta`, como `fix(empresas): validar CNPJ antes do cadastro`.
- Não misture formatação geral, refatoração e funcionalidade sem relação.
- Revise o diff e confirme que não há segredos, dumps, artefatos `.next` ou temporários.
- Na entrega, informe o que mudou, verificações executadas e riscos ou passos manuais restantes.

Uma mudança está pronta quando atende ao pedido, preserva os dados, passa na checagem de tipos e no build, foi testada no fluxo afetado, mantém a impressão quando aplicável e deixa documentação e configuração coerentes.
