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

## Etapa 10 — 17/07/2026 — Backup e conciliação das migrações

**Pedido resumido:** proteger os dados existentes, reconciliar o histórico do Prisma e retirar `prisma db push` da inicialização normal.

**Situação anterior:** o banco local continha dados persistidos e duas migrações existentes no repositório não estavam registradas como aplicadas.

**Trabalho realizado:**

- criado o backup restaurável `backups/autcompany_pre_plano_20260717_141808.dump`, mantido fora do Git;
- calculado o SHA-256 `3FD2A8FE9C0708C0F99A2CD59EC20CF63EEA885771F8F7B161F096B15D9E6657` e criado o arquivo lateral `.sha256`;
- restaurado o dump em banco temporário, sem sobrescrever o banco principal;
- comparados o banco restaurado e um banco vazio criado pelas migrações;
- conciliadas as migrações existentes e adicionadas as migrações de fundação/segurança e auditoria imutável;
- substituído o fluxo de inicialização por um serviço isolado que executa `prisma migrate deploy` antes da aplicação.

**Superfícies afetadas:** PostgreSQL, `prisma/migrations`, Dockerfile, `compose.yml`, scripts de backup/restauração e documentação operacional.

**Verificações registradas:** quatro migrações aplicadas; `prisma migrate status` limpo; restauração repetida em 20/07/2026 com 1 empresa, 1 sócio e 1 contato preservados.

**Pendências identificadas:** configurar e executar a cópia externa real em NAS/outro computador e agendar a retenção operacional.

**Commit:** `e914d78`.

**Estado:** Validado localmente; cópia externa ainda pendente.

## Etapa 11 — 17/07/2026 — Autenticação e matriz de permissões

**Pedido resumido:** criar login sem cadastro público e separar os acessos de administrador, operador e visualizador.

**Situação anterior:** páginas, ações e downloads podiam ser acessados sem autenticação centralizada.

**Trabalho realizado:**

- implementado Auth.js com e-mail, senha e sessão JWT de oito horas;
- criados os papéis `ADMIN`, `OPERADOR` e `VISUALIZADOR`;
- protegidas páginas, Server Actions e downloads no servidor;
- criadas as rotas `/login`, `/usuarios` e `/alterar-senha`;
- adicionados bloqueio por tentativas inválidas, bloqueio lógico de contas e troca obrigatória de senha temporária;
- criado comando seguro para o primeiro administrador.

**Superfícies afetadas:** autenticação, middleware, cabeçalho, páginas protegidas, usuários e autorização das Server Actions.

**Verificações registradas:** testes automatizados de senha e permissões; em 20/07/2026, os três papéis foram autenticados no navegador e tiveram acessos permitidos/bloqueados conforme a matriz; uma conta temporária foi redirecionada obrigatoriamente para `/alterar-senha`.

**Pendências identificadas:** validar o HTTPS e a confiança do certificado nos computadores reais antes de uso em rede.

**Commit:** `e914d78`.

**Estado:** Implementado e validado em ambiente local isolado.

## Etapa 12 — 17/07/2026 — Integridade cadastral e auditoria

**Pedido resumido:** substituir exclusões permanentes por ciclos reversíveis e registrar as mutações com autor e valores anteriores/novos.

**Situação anterior:** `TipoCliente.INATIVO` misturava classificação comercial e estado operacional; operações relacionadas e histórico técnico eram incompletos.

**Trabalho realizado:**

- criado `StatusEmpresa { ATIVA, INATIVA }` e migrados os estados existentes sem excluir registros;
- removida a exclusão permanente da empresa da interface;
- implementadas inativação e reativação de empresas e contatos, saída de sócio e remoção lógica de certificados/documentos;
- ampliadas validações no servidor e transações para operações relacionadas;
- mantida a linha do tempo legível em `AlteracaoEmpresa` e criada auditoria técnica imutável separada;
- automatizados eventos cadastrais relevantes e restringida a auditoria ao administrador.

**Superfícies afetadas:** schema Prisma, cadastro empresarial, dashboard, ações de sócios/contatos/certificados/documentos e `/auditoria`.

**Verificações registradas:** em 20/07/2026, uma empresa sintética foi inativada e ocultada do dashboard padrão, exibida no filtro de inativas e reativada; 1 sócio, 1 contato e 4 certificados permaneceram vinculados; as ações `INATIVAR` e `REATIVAR` foram registradas na auditoria com autor e diferenças.

**Pendências identificadas:** ampliar a cobertura de integração das Server Actions e testar volumes maiores de auditoria.

**Commit:** `e914d78`.

**Estado:** Implementado e validado em ambiente local isolado.

## Etapa 13 — 17/07/2026 — Ficha automatizada e rota de certificados

**Pedido resumido:** criar uma ficha consolidada por empresa e retirar o controle de certificados do dashboard.

**Situação anterior:** existia um componente inicial de ficha, mas não uma rota consolidada; certificados não tinham uma visão geral independente com limites formalizados.

**Trabalho realizado:**

- criada `/empresas/[id]/ficha` com dados cadastrais, sócios atuais/retirantes, contatos, certificados mínimos e histórico relevante;
- criada `/certificados`, separada do dashboard;
- limitados novos certificados a empresa, titular PJ/PF, emissão e vencimento, preservando campos legados;
- implementada a classificação vencido, próximo até 30 dias e em dia a partir de 31 dias;
- mantidas empresas inativas ocultas por padrão na listagem de certificados;
- corrigida em 20/07/2026 a ficha móvel para remover overflow horizontal e empilhar blocos de forma legível.

**Superfícies afetadas:** ficha, estilos responsivos/de impressão, central da empresa, dashboard e rota de certificados.

**Verificações registradas:** navegador em desktop e viewport móvel de 390 px; ficha sem overflow em ambos; regras `@page` A4 retrato, ocultação de `.no-print` e largura de 210 mm confirmadas; limites -1, 0, 30 e 31 dias validados na interface e em testes; filtro “Próximos” retornou exatamente os registros de 0 e 30 dias.

**Pendências identificadas:** repetir a conferência na pré-visualização nativa e em uma impressora física antes da implantação definitiva.

**Commit:** implementação principal em `e914d78`; correção responsiva de 20/07/2026 ainda sem commit.

**Estado:** Implementado e validado localmente; impressão física pendente.

## Etapa 14 — 17/07/2026 — Confiabilidade, OCR e preparação de produção

**Pedido resumido:** ampliar validações e testes, adicionar OCR local e preparar uma operação interna mais segura.

**Situação anterior:** somente PDFs textuais eram importados e não havia comando abrangente de verificação, CI ou compose fechado de produção.

**Trabalho realizado:**

- adicionado OCR local para imagens e PDFs digitalizados, sempre com revisão humana antes do cadastro;
- validada a assinatura real dos uploads e mantido o limite de 5 MB;
- adicionados logs sem dados pessoais/fiscais e testes de regras críticas;
- criado workflow de CI para migrações, testes, tipos e build;
- criado compose de produção com `next start`, PostgreSQL sem porta publicada e HTTPS interno pelo Caddy;
- criados scripts de backup, restauração e bootstrap administrativo.

**Superfícies afetadas:** importador do Cartão CNPJ, validações, testes, CI, Docker e documentação operacional.

**Verificações registradas:** em 20/07/2026, 15/15 testes principais e 5/5 testes de OCR passaram, TypeScript passou e o build de produção foi concluído em camada Docker isolada. Os testes OCR passaram a registrar explicitamente a fonte Liberation Sans já fornecida por `pdfjs-dist`, evitando imagens sintéticas vazias em ambientes Alpine.

**Pendências identificadas:** não adicionar API externa até haver provedor, custos e termos definidos; acompanhar os avisos não bloqueantes do Auth.js/Jose no build Edge; validar HTTPS no ambiente definitivo.

**Commit:** implementação principal em `e914d78`; estabilização dos testes OCR de 20/07/2026 ainda sem commit.

**Estado:** Implementado e validado localmente.

## Etapa 15 — 20/07/2026 — Validação final no navegador e fechamento documental

**Pedido resumido:** retomar o trabalho interrompido e concluir as verificações restantes antes da implantação.

**Situação anterior:** a implementação estava versionada, mas o histórico terminava no planejamento e faltavam evidências de navegador para papéis, ciclo da empresa, certificados e responsividade.

**Trabalho realizado:**

- criado/reutilizado banco temporário `autcompany_browser_test`, sem modificar os registros do banco principal;
- criadas contas e registros exclusivamente sintéticos para QA;
- validada a matriz de páginas e controles dos três papéis;
- validada a troca obrigatória de senha temporária sem executar a troca final;
- exercitados busca do dashboard, filtros de certificados, inativação, consulta de inativas, reativação e auditoria;
- corrigido o layout móvel da ficha;
- removido `encType` redundante de um formulário com Server Action, eliminando o erro do React no console;
- corrigida a documentação que afirmava não haver testes automatizados;
- atualizado este histórico com as entregas posteriores ao planejamento;
- removidos o container e o banco temporários ao final, mantendo `app`, PostgreSQL principal e volumes ativos.

**Superfícies afetadas:** `app/globals.css`, central cadastral, teste de OCR, `AGENTS.md` e este histórico.

**Verificações registradas:** identidade e conteúdo das páginas, ausência de overlay de erro, nova aba sem erros/avisos de console, interações reais, screenshots desktop/celular, 15 testes principais, 5 testes OCR, TypeScript, build Docker isolado, quatro migrações atualizadas e restauração do backup com checksum.

**Pendências identificadas:** cópia externa do backup, HTTPS nos equipamentos reais e conferência em impressora física dependem do ambiente de implantação; a suíte ainda não cobre todos os Server Actions de ponta a ponta.

**Commit:** alterações desta retomada ainda sem commit.

**Estado:** Validado localmente; pendências operacionais externas registradas.

## Etapa 16 — 20/07/2026 — Ajustes do cadastro e correção do acesso local

**Pedido resumido:** liberar o conteúdo dos CNAEs secundários, substituir “Tempo de empresa” pela data de abertura extraída do Cartão CNPJ, alterar os tipos de cliente para Fixo, Avulso e IRPF e corrigir o erro `missing required error components, refreshing...`.

**Situação anterior:** os CNAEs secundários eram rejeitados quando não correspondiam ao formato rígido de CNAE; o formulário ainda exibia “Tempo de empresa”; `TipoCliente` usava `PRINCIPAL`, `SECUNDARIO`, `PROSPECT` e o legado `INATIVO`; o ambiente Docker compartilhava `.next` com o Windows e redirecionava rotas protegidas entre `127.0.0.1`, `localhost` e `0.0.0.0`, permitindo colisões de manifestos e cookies de sessão antigos.

**Trabalho realizado:**

- removida a validação de formato dos CNAEs secundários, preservando cada linha informada e mantendo a validação do CNAE principal;
- removido “Tempo de empresa” do formulário e da gravação/auditoria corrente; a coluna legada foi preservada no banco para não apagar valores antigos;
- destacado “Data de abertura (Cartão CNPJ)” no formulário, mantendo o preenchimento automático já fornecido pelo importador textual/OCR;
- alterado `TipoCliente` para `FIXO`, `AVULSO` e `IRPF`;
- criada migração transacional e não destrutiva que converte `PRINCIPAL → FIXO`, `SECUNDARIO → AVULSO`, `PROSPECT → IRPF` e o legado `INATIVO → FIXO`;
- criado e restaurado o backup `backups/autcompany_pre_tipo_cliente_20260720.dump`, ignorado pelo Git, com SHA-256 `635A7B1A5285FAF9D04C1CF7B4B7B9F516ABC864AC7B306E8F94CEA45D4B38FE`;
- validada a migração primeiro em cópia restaurada e depois aplicada ao banco principal por `prisma migrate deploy`;
- isolado `.next` em volume Docker próprio e mantida sua limpeza automática a cada inicialização de desenvolvimento;
- definido `http://127.0.0.1:3000` como endereço canônico local e corrigidos os redirecionamentos protegidos;
- adotado o cookie exclusivo `autcompany.session-token`, evitando colisão com sessões antigas de outros ambientes Auth.js;
- documentada a limpeza de cookies/dados do site após troca de `AUTH_SECRET`.

**Superfícies afetadas:** formulário de empresa, validação no servidor, schema e migrações Prisma, seed/demonstração, autenticação, middleware, Docker Compose, configuração do Next.js, README e manual operacional.

**Verificações registradas:** backup restaurado com 1 empresa, 1 sócio, 1 contato e registros relacionados preservados; migração validada em cópia com 1 empresa convertida para `FIXO`; cinco migrações aplicadas e status limpo; navegador abriu `/login` e redirecionou `/empresas/nova` para a URL canônica sem overlay ou erro de console; 16/16 testes principais e 5/5 testes OCR passaram; TypeScript, `git diff --check` e build de produção Docker concluídos.

**Pendências identificadas:** após entrar com uma conta real, conferir visualmente o formulário autenticado e repetir uma importação de Cartão CNPJ real anonimizado; o build mantém apenas os avisos já conhecidos do `jose` sobre APIs de compressão no Edge e o alerta do Docker para o segredo fictício usado exclusivamente durante o build.

**Commit:** alterações ainda sem commit.

**Estado:** Implementado e validado localmente; conferência autenticada com documento real pendente.
