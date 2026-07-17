# Histórico de desenvolvimento do AutCompany

Este documento registra a evolução funcional e técnica do AutCompany por etapas de trabalho. Ele resume solicitações, resultados, verificações e pendências sem reproduzir conversas completas nem incluir dados de clientes.

## Como manter este histórico

Ao concluir cada entrega:

1. adicione uma nova etapa antes de encerrar a tarefa ou preparar o commit;
2. descreva somente o que foi efetivamente implementado ou verificado;
3. separe trabalho concluído, validação, diagnóstico e planejamento;
4. registre os comandos de verificação realmente executados;
5. relacione o commit, quando ele já existir; caso contrário, informe `Ainda não criado`.

Cada entrada deve conter: pedido resumido, situação anterior, trabalho realizado, superfícies afetadas, verificações, pendências, commit e estado.

---

## Etapa 1 — 12/07/2026 — Estado inicial versionado

**Pedido resumido:** colocar no Git o projeto AutCompany que já estava em desenvolvimento.

**Situação anterior:** o sistema existia localmente, mas ainda não possuía um marco versionado no repositório.

**Trabalho realizado:**

- versionada a base Next.js com App Router, React e TypeScript;
- incluídos dashboard, cadastro, consulta e edição de empresas;
- incluído o componente inicial da ficha cadastral e sua impressão;
- incluídos schema Prisma, seed, Server Actions, estilos e configurações do projeto.

**Superfícies afetadas:** `/`, `/empresas/nova`, `/empresas/[id]`, `/empresas/[id]/editar`, Prisma e componentes de cadastro/ficha.

**Verificações registradas:** não há evidência detalhada de comandos de verificação nesse marco inicial.

**Pendências identificadas:** infraestrutura do banco, proteção de acesso, validações mais rigorosas e evolução do cadastro.

**Commit:** `0da0278` — `Primeiro commit: subindo projeto existente`.

**Estado:** Concluído.

## Etapa 2 — 14/07/2026 — Infraestrutura PostgreSQL e Docker

**Pedido resumido:** estruturar a execução local com aplicação, banco persistente e ferramenta administrativa.

**Situação anterior:** o projeto possuía configuração local, mas não uma composição completa de serviços em containers.

**Trabalho realizado:**

- criados `Dockerfile` e `compose.yml`;
- configurados aplicação, PostgreSQL e pgAdmin;
- adicionados volumes persistentes e verificação de saúde do banco;
- incluídas configurações de ambiente e arquivos ignorados pelo Docker/Git.

**Superfícies afetadas:** infraestrutura Docker, conexão PostgreSQL e arquivos de ambiente de desenvolvimento.

**Verificações registradas:** criação dos serviços versionada; a validação operacional completa foi registrada em etapa posterior.

**Pendências identificadas:** separar claramente execução de desenvolvimento e produção, proteger portas administrativas e substituir `db push` no fluxo definitivo.

**Commit:** `608f899` — `DB`.

**Estado:** Concluído.

## Etapa 3 — 15/07/2026 — Reestruturação da central de cadastro

**Pedido resumido:** transformar a antiga ficha em uma central de cadastro empresarial mais completa, preparando uma ficha automática posterior.

**Situação anterior:** já existiam rotas básicas de empresa e um componente de ficha, mas os dados complementares não possuíam uma central estruturada.

**Trabalho realizado:**

- transformada `/empresas/[id]` na central do cadastro empresarial;
- ampliados dados cadastrais da empresa e do quadro societário;
- incluídos contatos por área, certificados PJ/PF, histórico estruturado e documentos;
- mantida `/empresas/[id]/editar` para os dados principais;
- criado download de documentos vinculados à empresa;
- adicionadas Server Actions transacionais e validações no servidor;
- criadas migração de baseline e migração aditiva da reestruturação.

**Superfícies afetadas:** cadastro, edição, sócios, contatos, certificados, histórico, documentos, Server Actions e schema Prisma.

**Verificações registradas:** testes de validação e extração, checagem de tipos e build foram executados no ciclo da entrega.

**Pendências identificadas:** autenticação, edição/inativação dos registros relacionados, auditoria automática, conciliação do histórico de migrações e rota definitiva da ficha.

**Commit:** `3991d6a` — `Rota de cadastros`.

**Estado:** Concluído.

## Etapa 4 — 15/07/2026 — Dashboard e persistência real

**Pedido resumido:** fazer o dashboard trabalhar somente com dados persistidos no PostgreSQL.

**Situação anterior:** o projeto ainda possuía dados demonstrativos e não deixava suficientemente claro quando o banco estava indisponível.

**Trabalho realizado:**

- dashboard alimentado por consulta Prisma;
- removido o uso de demonstração como se fosse dado real quando o PostgreSQL falha;
- adicionados aviso de indisponibilidade, busca e indicadores calculados sobre registros persistidos;
- adicionados atalhos para consulta e edição das empresas.

**Superfícies afetadas:** `/`, componente do dashboard e consulta de empresas.

**Verificações registradas:** dashboard posteriormente aberto no navegador com registro persistido.

**Pendências identificadas:** status operacional de empresa, indicadores de ativas/inativas e regras definitivas para o dashboard.

**Commit:** incluído em `3991d6a`.

**Estado:** Concluído e validado localmente.

## Etapa 5 — 15/07/2026 — Importação do cartão CNPJ

**Pedido resumido:** permitir anexar o cartão CNPJ e aproveitar seus dados para agilizar o cadastro.

**Situação anterior:** o preenchimento era manual e não existia endpoint de leitura do documento.

**Trabalho realizado:**

- criado upload de PDF do cartão CNPJ;
- extraídos dados principais de PDFs com texto selecionável;
- preenchidos somente campos ainda vazios no formulário;
- adicionados limite, validação do arquivo e mensagens de erro;
- adicionada normalização para CNPJ numérico e alfanumérico;
- criado teste automatizado da extração.

**Superfícies afetadas:** `/empresas/nova`, formulário empresarial e `/api/cnpj/cartao`.

**Verificações registradas:** testes de extração e validação executados no ciclo da entrega.

**Pendências identificadas:** PDFs digitalizados e imagens ainda não possuem OCR; qualquer dado reconhecido deve continuar passando por revisão humana.

**Commit:** incluído em `3991d6a`.

**Estado:** Concluído para PDFs textuais.

## Etapa 6 — 15/07/2026 — Validações, testes e documentação operacional

**Pedido resumido:** tornar o cadastro mais previsível e documentar a inicialização segura do ambiente.

**Situação anterior:** havia validação limitada e não existia manual operacional completo.

**Trabalho realizado:**

- centralizadas normalização e validação de dados empresariais;
- adicionados testes iniciais de CNPJ e cartão CNPJ;
- criados `AGENTS.md` e `MANUAL_REINICIALIZACAO.md`;
- documentados reinicialização, preservação de volumes e comandos destrutivos que não devem ser usados com dados importantes.

**Superfícies afetadas:** validações compartilhadas, testes, README e documentação operacional.

**Verificações registradas:** `pnpm test`, `pnpm exec tsc --noEmit` e `pnpm build` no ciclo da entrega.

**Pendências identificadas:** ampliar testes para autenticação, permissões, transações, auditoria e fluxos completos.

**Commit:** incluído em `3991d6a`.

**Estado:** Concluído como cobertura inicial.

## Etapa 7 — 15/07/2026 — Validação operacional local

**Pedido resumido:** executar o sistema e abri-lo no navegador.

**Situação anterior:** as funcionalidades estavam implementadas, mas precisavam ser verificadas no ambiente Docker.

**Trabalho realizado:**

- iniciados aplicação, PostgreSQL e pgAdmin em Docker;
- ajustada a inicialização não interativa do gerenciador de pacotes no container;
- aberto o dashboard em `http://localhost:3000`;
- confirmado que uma empresa persistida era exibida e permanecia após reinicialização.

**Superfícies afetadas:** execução Docker e fluxo principal do dashboard.

**Verificações registradas:** abertura no navegador, consulta do registro existente e reinicialização preservando o volume do PostgreSQL.

**Pendências identificadas:** o container ainda inicia com `prisma db push`, inadequado para o fluxo definitivo de produção.

**Commit:** ajuste incluído em `3991d6a`; validação operacional sem commit próprio.

**Estado:** Validado localmente.

## Etapa 8 — 17/07/2026 — Diagnóstico pré-produção

**Pedido resumido:** analisar o que ainda faltava sem modificar o sistema.

**Situação anterior:** o núcleo funcional estava disponível, mas não havia avaliação consolidada de segurança e prontidão operacional.

**Trabalho realizado:** nenhuma alteração de código ou banco.

**Diagnóstico:**

- núcleo de cadastro e persistência funcional;
- ausência de autenticação e autorização;
- operações relacionadas ainda predominantemente de inclusão;
- exclusão permanente de empresa ainda disponível;
- histórico cadastral não equivale a uma auditoria técnica;
- duas migrações presentes no repositório, mas ainda não registradas no banco atual;
- inicialização do container ainda usando `prisma db push`.

**Superfícies analisadas:** schema Prisma, migrações, Server Actions, dashboard, cadastro, Docker e documentação.

**Verificações registradas:** inspeção do código, `prisma migrate status` e confirmação anterior de persistência pelo navegador.

**Pendências identificadas:** executar o plano de fundação e segurança antes de uso em produção.

**Commit:** não se aplica.

**Estado:** Apenas analisado.

## Etapa 9 — 17/07/2026 — Planejamento do próximo ciclo

**Pedido resumido:** alinhar todas as fases antes de implementar novas mudanças.

**Situação anterior:** riscos principais estavam identificados, mas faltavam decisões de produto e uma ordem segura de execução.

**Trabalho realizado:** nenhuma alteração de código ou banco.

**Decisões registradas:**

- preservar todos os dados atuais;
- primeira operação em rede local;
- backups também em NAS ou outro computador;
- papéis `ADMIN`, `OPERADOR` e `VISUALIZADOR`;
- empresas inativas ocultas por padrão;
- histórico cadastral separado da auditoria imutável;
- rota própria para certificados, fora do dashboard;
- certificados novos com apenas empresa, PJ/PF, emissão e vencimento;
- faixa de próximo vencimento definida em 30 dias;
- ficha interna completa;
- OCR local antes de qualquer API externa.

**Superfícies planejadas:** banco, autenticação, cadastro, auditoria, ficha, certificados, OCR, testes e operação.

**Verificações registradas:** análise do repositório e confronto com as documentações oficiais do Next.js e Prisma.

**Pendências identificadas:** implementar cada fase com validação e atualizar este histórico ao fim de cada entrega.

**Commit:** não se aplica.

**Estado:** Planejado, ainda não implementado.

