# AutCompany

Sistema interno para cadastrar, consultar, manter e imprimir fichas de empresas de um escritório contábil. O estado atual inclui autenticação, autorização por papéis, inativação sem perda de dados, auditoria técnica, controle de certificados e importação local do Cartão CNPJ.

Consulte o [histórico de desenvolvimento](./HISTORICO_DESENVOLVIMENTO.md) para ver, etapa a etapa, o que foi implementado, validado, diagnosticado e planejado. O [manual operacional](./MANUAL_REINICIALIZACAO.md) contém inicialização, backup, restauração e produção.

## Funcionalidades e rotas

- `/login`: acesso por e-mail e senha, sem cadastro público.
- `/`: dashboard com empresas ativas por padrão, busca e indicadores do PostgreSQL.
- `/empresas/nova`: cadastro com importação opcional de PDF, JPG ou PNG do Cartão CNPJ.
- `/empresas/[id]`: central cadastral, sócios, contatos, certificados, histórico e documentos.
- `/empresas/[id]/editar`: edição dos dados principais.
- `/empresas/[id]/ficha`: ficha consolidada para desktop, celular e impressão A4.
- `/certificados`: vencidos, próximos em até 30 dias e em dia; empresas inativas ficam ocultas por padrão.
- `/usuarios`: contas e papéis, acessível somente a administradores.
- `/auditoria`: trilha técnica imutável, acessível somente a administradores.
- `/alterar-senha`: troca obrigatória da senha temporária.

Papéis disponíveis:

- `ADMIN`: cadastro empresarial, usuários e auditoria.
- `OPERADOR`: cadastro e manutenção empresarial.
- `VISUALIZADOR`: consulta e impressão, sem mutações.

Usuários são bloqueados, não excluídos. Empresas, contatos, certificados e documentos usam inativação ou remoção lógica nos fluxos expostos pela aplicação.

## Stack

- Next.js 15, React 19 e TypeScript estrito;
- Auth.js com sessão JWT e autorização também validada no servidor;
- Prisma 6 e PostgreSQL 16;
- OCR local com PDF.js, Tesseract.js e dados de idioma empacotados;
- pnpm e Docker Compose.

## Primeira execução com Docker

1. Crie `.env` a partir de `.env.example` e gere um `AUTH_SECRET` exclusivo.
2. Inicie os serviços:

```powershell
docker compose up --build -d
docker compose ps
```

O serviço `migrate` executa `prisma migrate deploy` antes da aplicação. O fluxo normal não usa `prisma db push`.

3. Crie o primeiro administrador uma única vez, sem colocar a senha no repositório:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-admin.ps1 -Email admin@dominio.local -Name "Administrador"
```

4. Abra `http://127.0.0.1:3000`, entre com a conta criada e troque a senha temporária.

As portas de desenvolvimento são vinculadas somente a `127.0.0.1`: aplicação `3000`, PostgreSQL `5432` e pgAdmin `5050`.

## Execução local

Com Node.js 22, pnpm e PostgreSQL acessível:

```powershell
pnpm install --frozen-lockfile
pnpm db:deploy
pnpm dev
```

Use `pnpm db:seed` somente em banco de desenvolvimento vazio ou descartável. O seed não deve ser executado sobre dados reais sem revisão.

## Migrações e banco existente

O banco local analisado em 17/07/2026 foi copiado, restaurado, comparado com um banco vazio e conciliado. As quatro migrações atuais estão aplicadas e `prisma migrate status` está limpo.

Para qualquer outro banco criado anteriormente por `db push`, não marque migrações como aplicadas por suposição. Faça backup restaurável, valide a restauração, compare os schemas e siga o procedimento de baseline do Prisma. Nunca use `prisma migrate reset`, `docker compose down -v` ou exclusão de banco com dados.

Em banco novo e vazio, use somente:

```powershell
pnpm db:deploy
```

## Cartão CNPJ e OCR

O importador:

- lê diretamente PDFs com texto selecionável;
- usa OCR local em PDFs digitalizados, JPG e PNG;
- valida a assinatura real do arquivo e limita o tamanho a 5 MB;
- preenche somente campos vazios;
- suporta CNPJ numérico e alfanumérico;
- exige que a pessoa revise os campos antes de salvar, com aviso especial para baixa confiança.

Nenhuma API externa é utilizada. Arquivos anexados ao cadastro são armazenados no PostgreSQL; o OCR não salva automaticamente os dados extraídos.

## Certificados

Novos registros guardam somente empresa, titular `PJ`/`PF`, emissão e vencimento. Não são solicitados nem armazenados arquivo, senha, nome, CPF/CNPJ ou emissora. Dados legados continuam preservados. Uma renovação deve ser cadastrada como novo registro; o anterior permanece no histórico.

## Backup e produção

Crie backup local e externo com checksum:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

Defina `AUTCOMPANY_BACKUP_EXTERNAL` para um NAS ou outro computador. O script mantém 30 cópias diárias e 12 semanais em cada destino. Valide periodicamente uma restauração isolada:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-backup.ps1 -BackupPath .\backups\daily\arquivo.dump
```

O modelo de produção está em `compose.production.yml` e usa build fechado, `next start`, PostgreSQL sem porta publicada e HTTPS interno pelo Caddy. Antes do uso real, copie `.env.production.example`, defina host, segredos e destino externo e valide o certificado interno nos computadores clientes.

## Verificação

```powershell
pnpm test
pnpm test:ocr
pnpm exec tsc --noEmit
pnpm build
pnpm db:status
```

O workflow `.github/workflows/verify.yml` repete migrações, testes, tipos e build em PostgreSQL isolado.
