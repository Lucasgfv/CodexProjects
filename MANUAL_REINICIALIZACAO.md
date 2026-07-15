# Manual de inicialização, reinicialização e recuperação

Este manual cobre o AutCompany em ambiente local e com Docker. Execute os comandos na raiz do repositório.

> No Windows, se o PowerShell bloquear `pnpm.ps1` pela política de execução, use `pnpm.cmd` nos mesmos comandos (por exemplo, `pnpm.cmd dev`). Não reduza a segurança global do PowerShell apenas para contornar esse aviso.

## Primeira inicialização com Docker (recomendado)

Pré-requisitos: Docker Desktop ativo e portas `3000`, `5050` e `5432` livres.

```powershell
docker compose up --build -d
docker compose ps
```

- Sistema: `http://localhost:3000`
- pgAdmin: `http://localhost:5050`
- PostgreSQL no computador: `localhost:5432`

Para acompanhar a inicialização:

```powershell
docker compose logs -f app db
```

Use `Ctrl+C` para sair dos logs; os containers continuam ativos.

## Reinicialização diária com Docker

Reiniciar sem apagar dados:

```powershell
docker compose restart
docker compose ps
```

Se os containers estavam parados, use `docker compose up -d`. Depois de alterar dependências, Dockerfile, Prisma ou configuração:

```powershell
docker compose up --build -d
docker compose logs --tail 100 app db
```

Para parar preservando o banco:

```powershell
docker compose down
```

**Não acrescente `-v`.** `docker compose down -v` remove volumes e pode apagar todos os dados do PostgreSQL e do pgAdmin.

## Inicialização local

Pré-requisitos: Node.js 22, pnpm e PostgreSQL acessível.

1. Crie `.env` a partir de `.env.example` e ajuste `DATABASE_URL`.
2. Prepare e inicie:

```powershell
pnpm install
pnpm exec prisma generate
pnpm db:push
pnpm dev
```

Abra `http://localhost:3000`. Para encerrar, pressione `Ctrl+C`.

Opcionalmente, em banco de desenvolvimento vazio, carregue a demonstração com `pnpm db:seed`.

## Reinicialização local

Pare com `Ctrl+C` e execute `pnpm dev`. Se o schema Prisma mudou:

```powershell
pnpm exec prisma generate
pnpm db:migrate
pnpm dev
```

Em banco local descartável, `pnpm db:push` pode substituir a migração. Com dados importantes, prefira migração versionada e backup prévio.

## Limpar apenas o cache da aplicação

Pare a aplicação antes. Este procedimento preserva o banco:

```powershell
Remove-Item -Recurse -Force .next
pnpm exec prisma generate
pnpm dev
```

Com Docker, use:

```powershell
docker compose down
docker compose up --build -d
```

## Diagnóstico rápido

Se o sistema não abrir:

```powershell
docker compose ps
docker compose logs --tail 150 app
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

Se o banco não conectar:

```powershell
docker compose ps db
docker compose logs --tail 150 db
```

Confirme que o container `db` está saudável. No Docker, a aplicação usa o host `db`; na execução local, `.env` normalmente usa `localhost`. Confira também se outro PostgreSQL ocupa a porta `5432`.

Se o Prisma Client estiver ausente ou antigo:

```powershell
pnpm exec prisma generate
```

Se houver problema com dependências, tente primeiro:

```powershell
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm build
```

Não apague o lockfile para “resolver” o problema, pois isso atualiza dependências e esconde a causa.

## Verificação de saúde

```powershell
pnpm exec tsc --noEmit
pnpm build
```

Ainda não há testes automatizados configurados. Faça também o checklist manual do `AGENTS.md`.

## Backup antes de manutenção de risco

```powershell
New-Item -ItemType Directory -Force backups
docker compose exec -T db pg_dump -U postgres -d autcompany -Fc > backups\autcompany.backup
```

Confirme que o arquivo existe e tem tamanho maior que zero. `backups/` está ignorada pelo Git e deve continuar assim, principalmente com dados reais.

Teste qualquer restauração primeiro em outro banco. Restaurar pode sobrescrever dados e não deve ser feito no banco principal sem backup e autorização.

## Comandos perigosos

Não execute em banco com dados importantes sem backup e autorização explícita:

```text
docker compose down -v
pnpm exec prisma migrate reset
DROP DATABASE
```

Nunca copie `.env`, dumps ou dados de clientes para commits, tickets ou mensagens.

## Checklist após reiniciar

1. Os serviços estão ativos, ou `pnpm dev` iniciou sem erro.
2. A página inicial abre em `http://localhost:3000`.
3. Uma empresa existente pode ser consultada.
4. Os dados permaneceram após a reinicialização.
5. Cadastro e edição funcionam, se o banco estiver configurado.
6. A ficha continua correta na visualização de impressão.

Se ainda houver falha, registre o comando, a mensagem completa, o serviço e as últimas linhas dos logs, removendo senhas e dados de clientes.
