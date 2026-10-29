# Nexo Contábil

Aplicação local de gestão contábil construída com Next.js App Router,
TypeScript, Tailwind CSS, Prisma ORM e PostgreSQL.

## Documentação de arquitetura e produção

- [Histórico, arquitetura e deploy na AWS](docs/ARQUITETURA-HISTORICO-DEPLOY-AWS.md)
- [Guia operacional do AWS Lightsail](docs/AWS-LIGHTSAIL-PRODUCAO.md)
- [Checklist de produção do Fiscal Leve](docs/FISCAL-LEVE-PRODUCAO.md)
- [Manual do banco de dados](docs/MANUAL-BANCO-DE-DADOS.md)

## Requisitos

- Node.js e pnpm
- Docker Desktop com Docker Compose

## Configuração inicial

Crie o arquivo local de ambiente com uma senha aleatória:

```bash
pnpm db:setup
```

O arquivo `.env` não deve ser enviado ao Git. Para configurar manualmente,
copie `.env.example` e mantenha a mesma senha em `POSTGRES_PASSWORD` e
`DATABASE_URL`.

Instale as dependências, inicie o PostgreSQL e aplique as migrations:

```bash
pnpm install
pnpm db:up
pnpm db:generate
pnpm db:migrate:deploy
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000). Usuários sem sessão são
direcionados automaticamente para `/login`.

## Acesso administrativo

O Nexo usa sessões seguras armazenadas no PostgreSQL. O cadastro público está
desativado e a instalação aceita somente um administrador. Para criar o acesso
inicial ou trocar a senha administrativa, execute no PowerShell:

```powershell
$env:ADMIN_NAME="Administrador"
$env:ADMIN_EMAIL="admin@empresa.com.br"
$env:ADMIN_PASSWORD="uma-senha-forte-com-12-ou-mais-caracteres"
pnpm auth:seed-admin
Remove-Item Env:ADMIN_NAME,Env:ADMIN_EMAIL,Env:ADMIN_PASSWORD
```

O comando armazena somente o hash da senha e encerra as sessões anteriores.
Também é possível alterar a senha autenticado pela página `/conta`.

O PostgreSQL fica disponível somente em `127.0.0.1:5432`. Os dados permanecem
no volume Docker `postgres_data` quando o container é reiniciado ou removido
com `pnpm db:down`.

> Não execute `docker compose down -v` sem um backup confirmado: a opção `-v`
> remove o volume persistente.

## Comandos do PostgreSQL

```bash
pnpm db:up               # inicia o PostgreSQL
pnpm db:down             # encerra os containers sem apagar o volume
pnpm db:logs             # acompanha os logs
pnpm db:migrate:dev      # cria/aplica migration durante desenvolvimento
pnpm db:migrate:deploy   # aplica migrations já versionadas
pnpm db:studio           # abre o Prisma Studio
```

Sem `DATABASE_URL`, ou quando o PostgreSQL está indisponível, a aplicação abre
os dados de demonstração em modo somente leitura. As APIs recusam gravações
nesse modo para não dar a falsa impressão de persistência.

## Backup e restauração

Crie um dump portável e comprimido:

```bash
pnpm db:backup
```

O arquivo será salvo em `backups/nexo-contabil-AAAAMMDD-HHMMSS.dump`, junto
com seu SHA-256. Dumps contêm dados pessoais e empresariais: não os envie ao
Git e transporte-os somente em mídia ou armazenamento criptografado.

Restaure um backup:

```powershell
pnpm db:restore -- "C:\caminho\nexo-contabil-20260724-210000.dump"
```

O script valida o dump, exige a palavra `RESTAURAR`, cria um backup preventivo
do banco atual, restaura os dados e aplica migrations pendentes.

Consulte o
[manual completo de transferência do banco](docs/MANUAL-BANCO-DE-DADOS.md)
para configurar outro computador e transportar o dump nos dois sentidos.

Para migrar futuramente à rede da empresa, restaure o dump em um único
computador/servidor. Os demais usuários devem acessar a aplicação pelo
navegador; não exponha a porta `5432` diretamente na rede.

## Preenchimento pelo cartÃ£o CNPJ

Ao criar uma empresa em `/db-admin`, use a Ã¡rea de cartÃ£o CNPJ para arrastar
uma imagem ou PDF. A leitura do documento ocorre temporariamente no navegador:
o arquivo nÃ£o Ã© enviado, salvo na pasta do projeto ou gravado no PostgreSQL.

O OCR local encontra o CNPJ e envia somente esse nÃºmero para a rota server-side
de consulta pÃºblica. Os dados estruturados retornados preenchem razÃ£o social,
nome fantasia, porte, data de abertura, endereÃ§o, CEP, cidade, UF, telefone e
e-mail. Revise os campos antes de salvar.

Se a imagem estiver ilegÃ­vel ou a consulta pÃºblica estiver indisponÃ­vel, o
cadastro continua disponÃ­vel para preenchimento manual. O serviÃ§o utilizado Ã© a
[BrasilAPI](https://brasilapi.com.br/), que fornece dados cadastrais pÃºblicos e
pode sofrer limites ou indisponibilidade.

## Rotas

- `/` — início e lembretes locais
- `/dashboard` — indicadores, filtros e gráficos
- `/db-admin` — CRUD de empresas, sócios, vínculos e alterações
- `/apps/gerador-contratos` — gerador anterior, preservado
- `/apps/contrato-prestacao-servicos` — contrato e procuração preenchidos pelo banco
- `/apps/respostas-rapidas` — biblioteca local de mensagens com backup JSON
- `/apps/contabilidade` — entradas, saídas e vencimentos
- `/apps/fiscal-leve` — rotina fiscal, MEIs, certificados, acessos e indicadores
- `/apps` e `/app/apps` — hub de aplicações

As mensagens rápidas ficam no `localStorage` do navegador. Exportar e importar
JSON é o mecanismo de backup e transferência entre computadores.

## Fiscal Leve

O módulo Fiscal Leve usa o mesmo PostgreSQL do Nexo. A migração inicial dos
dados legados já foi concluída e a antiga pasta de origem foi removida. Em uma
nova instalação, aplique as migrations normalmente:

```bash
pnpm db:migrate:deploy
```

Antes de publicar, configure `DATABASE_URL`, `FISCAL_CREDENTIALS_KEY` e
`APP_ORIGIN`, `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL` no cofre de segredos do
provedor. As senhas de acesso manual são criptografadas no banco e não são
devolvidas no carregamento geral do módulo.

Consulte o [guia de publicação do Fiscal Leve](docs/FISCAL-LEVE-PRODUCAO.md)
antes de disponibilizar o Nexo na internet.

## Validação

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Os HTMLs usados como referência permanecem em `docs/legacy/indexx`.
