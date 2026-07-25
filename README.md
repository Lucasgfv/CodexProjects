# Nexo Contábil

Aplicação local de gestão contábil construída com Next.js App Router,
TypeScript, Tailwind CSS, Prisma ORM e PostgreSQL.

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

Acesse [http://localhost:3000](http://localhost:3000).

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

Para migrar futuramente à rede da empresa, restaure o dump em um único
computador/servidor. Os demais usuários devem acessar a aplicação pelo
navegador; não exponha a porta `5432` diretamente na rede.

## Rotas

- `/` — início e lembretes locais
- `/dashboard` — indicadores, filtros e gráficos
- `/db-admin` — CRUD de empresas, sócios, vínculos e alterações
- `/apps/gerador-contratos` — gerador anterior, preservado
- `/apps/contrato-prestacao-servicos` — contrato e procuração preenchidos pelo banco
- `/apps/respostas-rapidas` — biblioteca local de mensagens com backup JSON
- `/apps/contabilidade` — entradas, saídas e vencimentos
- `/apps` e `/app/apps` — hub de aplicações

As mensagens rápidas ficam no `localStorage` do navegador. Exportar e importar
JSON é o mecanismo de backup e transferência entre computadores.

## Validação

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Os HTMLs usados como referência permanecem em `docs/legacy/indexx`.
