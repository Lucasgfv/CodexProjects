# Manual de inicialização, reinicialização e recuperação

Este manual cobre desenvolvimento local, Docker e a preparação operacional do AutCompany. Execute os comandos na raiz do repositório.

> No Windows, se o PowerShell bloquear `pnpm.ps1`, use `pnpm.cmd`. Não reduza a política de segurança global apenas para contornar esse aviso.

## Primeira inicialização com Docker

Pré-requisitos: Docker Desktop ativo e portas locais `3000`, `5050` e `5432` livres.

```powershell
Copy-Item .env.example .env
docker compose up --build -d
docker compose ps
docker compose logs --tail 100 migrate app db
```

O container `migrate` deve terminar com código `0`. Ele executa `prisma migrate deploy`; a aplicação só inicia depois disso. Se a migração falhar, não use `db push` para contornar o erro: interrompa o uso e analise a migração e o backup.

O Compose padrão constrói uma imagem fechada com `next build`, executa com `next start` e não monta o código-fonte do Windows. Não há Watchpack, polling ou recompilação de rotas durante a navegação. Isso elimina a principal causa local de lentidão e de manifestos inconsistentes associados à mensagem `missing required error components, refreshing...`. O PostgreSQL e seus volumes não são tocados.

- Sistema: `http://127.0.0.1:3000`
- pgAdmin: `http://localhost:5050`
- PostgreSQL no próprio computador: `localhost:5432`

Essas portas ficam vinculadas a `127.0.0.1` e não devem ser publicadas na rede.

Use sempre `http://127.0.0.1:3000` como endereço local. `0.0.0.0` é apenas o endereço de escuta interno e nunca deve ser usado no navegador ou como callback. As variáveis `AUTH_URL` e `AUTCOMPANY_PUBLIC_URL` devem apontar para a mesma origem pública; em produção, ambas devem usar o endereço HTTPS definitivo.

## Desenvolvimento em Docker com atualização automática

Use este modo somente para alterar código:

```powershell
docker compose -f compose.yml -f compose.dev.yml up --build -d
```

O complemento monta o código-fonte e usa `next dev`. No Docker Desktop para Windows, recompilações e monitoramento de arquivos podem tornar as primeiras navegações significativamente mais lentas. Volte ao modo operacional com `docker compose down` e depois `docker compose up --build -d`, sem acrescentar `-v`.

## Criar o primeiro administrador

O comando recusa a criação quando já existe um administrador. A senha não deve ser colocada em código, documentação ou histórico do terminal.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-admin.ps1 -Email admin@dominio.local -Name "Administrador"
```

No primeiro login, a troca da senha é obrigatória. Depois disso, novos usuários são criados por um administrador em `/usuarios`.

## Reinicialização diária com Docker

Reiniciar sem apagar dados:

```powershell
docker compose restart
docker compose ps
```

Se os containers estiverem parados, use `docker compose up -d`. Após mudanças de dependências, Dockerfile, Prisma ou configuração:

```powershell
docker compose up --build -d
docker compose logs --tail 150 migrate app db
```

Para parar preservando o banco:

```powershell
docker compose down
```

Nunca acrescente `-v`: isso remove volumes e pode apagar o PostgreSQL e o pgAdmin.

## Inicialização local sem Docker para a aplicação

Pré-requisitos: Node.js 22, pnpm e PostgreSQL acessível.

```powershell
Copy-Item .env.example .env
pnpm install --frozen-lockfile
pnpm db:deploy
pnpm dev
```

Abra `http://127.0.0.1:3000`. Em banco novo de desenvolvimento, o seed é opcional:

```powershell
pnpm db:seed
```

Não use `db:push` no fluxo normal. Mudanças versionadas do schema exigem nova migração; ambientes que apenas recebem a aplicação usam `pnpm db:deploy`.

## Backup diário e semanal

Defina um destino externo disponível, como NAS ou outro computador:

```powershell
$env:AUTCOMPANY_BACKUP_EXTERNAL = "D:\BackupsExternos\AutCompany"
powershell -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

O script:

1. gera dump PostgreSQL no formato custom;
2. copia para `backups/daily`;
3. cria checksum SHA256;
4. cria cópia semanal aos domingos;
5. mantém 30 diários e 12 semanais, local e externamente;
6. falha de forma visível se o destino externo não estiver configurado ou disponível.

Para o compose de produção, informe também o arquivo e o usuário:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup.ps1 -ComposeFile compose.production.yml -DatabaseUser autcompany
```

Agende o comando no sistema operacional e monitore o código de saída. Um arquivo existente não substitui uma restauração de teste.

## Validar uma restauração

O script confere o checksum quando houver arquivo `.sha256`, cria um banco temporário com prefixo controlado, restaura, consulta as contagens essenciais e remove somente esse banco temporário:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-backup.ps1 -BackupPath .\backups\daily\autcompany_AAAAMMDD_HHMMSS.dump
```

Produção:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-backup.ps1 -BackupPath D:\BackupsExternos\AutCompany\daily\arquivo.dump -ComposeFile compose.production.yml -DatabaseUser autcompany
```

Nunca restaure diretamente sobre o banco principal durante uma verificação.

## Produção interna com HTTPS

1. Copie `.env.production.example` para um arquivo de ambiente não versionado.
2. Gere `POSTGRES_PASSWORD` e `AUTH_SECRET` exclusivos.
3. Em `DATABASE_URL`, codifique caracteres especiais da senha para URL e use o host `db`.
4. Defina `AUTCOMPANY_HOST` para o nome interno resolvido na rede.
5. Inicie:

```powershell
docker compose --env-file .env.production -f compose.production.yml up --build -d
docker compose --env-file .env.production -f compose.production.yml ps
```

O PostgreSQL não publica porta e o pgAdmin não faz parte do compose de produção. O Caddy fornece HTTPS interno. Antes de cadastrar credenciais ou dados reais, instale/confie a autoridade local do Caddy nos computadores autorizados e confirme que o navegador não apresenta alerta de certificado.

## Diagnóstico rápido

Aplicação ou migração:

```powershell
docker compose ps
docker compose logs --tail 150 migrate app
pnpm db:status
```

Banco:

```powershell
docker compose ps db
docker compose logs --tail 150 db
```

No Docker, o host do banco é `db`; fora dele, normalmente é `localhost`. Nunca copie valores reais de `.env` para diagnóstico, issue ou mensagem.

## Limpar somente o cache da aplicação

Pare a aplicação e remova apenas `.next`:

```powershell
Remove-Item -Recurse -Force .next
pnpm exec prisma generate
pnpm dev
```

Esse procedimento não toca no PostgreSQL.

Se o erro aparecer após trocar `AUTH_SECRET`, limpe os cookies e dados do site de `localhost` e `127.0.0.1` no navegador e entre novamente. Sessões criadas com o segredo anterior não podem ser descriptografadas pelo novo ambiente. No desenvolvimento Docker, use o endereço canônico `http://127.0.0.1:3000`, configurado também em `AUTH_URL`, para evitar redirecionamentos para `0.0.0.0`.

Se `localhost:3000` apresentar um erro diferente de `127.0.0.1:3000`, verifique se outro processo Node está ocupando a porta IPv6. O Docker operacional deste projeto publica a aplicação em `127.0.0.1`; misturar as duas origens também separa cookies e pode levar o navegador a uma instância antiga.

## Cartão CNPJ sem retenção

O Cartão CNPJ é enviado apenas ao processador temporário de extração. Depois da leitura, o seletor de arquivo é limpo e o cadastro salva somente os campos revisados; o PDF ou a imagem não integra o envio final. O servidor também rejeita `CARTAO_CNPJ` como anexo manual.

Se um banco legado ainda tiver documentos desse tipo, primeiro gere um backup restaurável e valide a restauração. Só depois, com intenção explícita, execute:

```powershell
$env:AUTCOMPANY_CONFIRM_PURGE_CNPJ = "REMOVER"
pnpm.cmd data:purge-cnpj-documents
```

O comando apaga permanentemente apenas registros `CARTAO_CNPJ`. Contratos, alterações, BIC, TEC, alvarás e outros anexos permanecem intactos.

## Verificação de saúde

```powershell
pnpm test
pnpm test:ocr
pnpm exec tsc --noEmit
pnpm build
pnpm db:status
```

Há testes para CPF/CNPJ, CNAE, telefone, datas, senhas, papéis, limites de certificados, assinatura real de uploads e OCR em PDF textual, PDF digitalizado, imagem e entrada inválida. Ainda é necessário manter testes manuais do fluxo completo, das três contas reais e da impressão A4.

## Comandos perigosos

Não execute em banco com dados importantes:

```text
docker compose down -v
pnpm exec prisma migrate reset
DROP DATABASE
```

Também não altere migrações já aplicadas. Crie uma migração aditiva e valide primeiro em cópia restaurada.

## Checklist após reiniciar

1. `db` está saudável, `migrate` terminou com código `0` e `app` está ativo.
2. `/login` abre e uma conta autorizada consegue entrar.
3. O dashboard consulta o PostgreSQL sem dados demonstrativos falsos.
4. Uma empresa existente, seus sócios e documentos continuam disponíveis.
5. Admin, Operador e Visualizador respeitam a matriz de permissões.
6. `/certificados` classifica corretamente os vencimentos.
7. A ficha abre em desktop e celular e imprime em A4 sem navegação.
8. O backup diário foi criado, copiado externamente e possui checksum.
