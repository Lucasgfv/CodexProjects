# Manual do banco de dados

Este manual explica como iniciar, copiar, restaurar e transportar o banco de
dados do Nexo Contábil entre dois computadores.

## Regra principal

O backup serve para transferir o estado completo do banco de um computador
para outro. Ele não sincroniza nem junta automaticamente alterações feitas nos
dois computadores.

Mantenha apenas um banco como principal:

1. Termine o trabalho no computador de origem.
2. Gere um backup novo.
3. Transfira o arquivo com segurança.
4. Restaure o backup no computador de destino.
5. Somente depois comece a alterar os dados no computador de destino.

Enquanto o backup estiver sendo criado e transferido, evite cadastrar ou
alterar informações no computador de origem.

## O que é necessário em cada computador

- Uma cópia completa deste projeto.
- Docker Desktop instalado e aberto.
- Node.js LTS 22 ou superior.
- pnpm instalado.
- Espaço disponível para o banco e seus backups.

Confirme as instalações no PowerShell:

```powershell
docker --version
node --version
pnpm --version
```

## Configuração inicial em um computador novo

Abra o PowerShell na pasta do projeto e execute:

```powershell
pnpm install
pnpm db:setup
pnpm db:up
pnpm db:generate
pnpm db:migrate:deploy
```

O comando `pnpm db:setup` cria o arquivo local `.env` com uma senha aleatória.
Essa senha é usada pelo PostgreSQL desse computador e não deve ser enviada ao
Git.

Para iniciar a aplicação:

```powershell
pnpm dev
```

Depois acesse:

```text
http://localhost:3000/db-admin
```

## Criar um backup no computador de origem

Confirme que o Docker Desktop está aberto e execute:

```powershell
pnpm db:up
pnpm db:backup
```

O backup será criado na pasta `backups`, com um nome semelhante a:

```text
backups\nexo-contabil-20260728-180000.dump
```

O comando também exibe o SHA-256 do arquivo. Anote esse código para conferir se
o arquivo chegou íntegro ao outro computador.

No computador de destino, confira o SHA-256:

```powershell
Get-FileHash -Algorithm SHA256 "C:\caminho\nexo-contabil-20260728-180000.dump"
```

O resultado deve ser igual ao apresentado na criação do backup.

## Restaurar o backup no outro computador

Copie o arquivo `.dump` para o computador de destino. Ele pode ser colocado na
pasta `backups` do projeto, mas isso não é obrigatório.

Antes da restauração, inicie o PostgreSQL:

```powershell
pnpm db:up
```

Por segurança, crie também um backup manual do banco atual:

```powershell
pnpm db:backup
```

Restaure o arquivo recebido:

```powershell
pnpm db:restore -- "C:\caminho\nexo-contabil-20260728-180000.dump"
```

Quando solicitado, digite exatamente:

```text
RESTAURAR
```

O script:

1. Valida o arquivo `.dump`.
2. Cria outro backup preventivo do banco atual.
3. Substitui o conteúdo do banco pelo conteúdo do backup.
4. Aplica as migrations pendentes.

Depois execute:

```powershell
pnpm dev
```

Confira as empresas e os sócios em:

```text
http://localhost:3000/db-admin
```

## Trazer novamente o banco para o primeiro computador

O procedimento é o mesmo no sentido contrário:

1. No computador que possui os dados mais recentes, execute
   `pnpm db:backup`.
2. Transfira o novo `.dump` para o outro computador.
3. No computador que receberá o banco, execute primeiro
   `pnpm db:backup`.
4. Execute `pnpm db:restore -- "C:\caminho\arquivo.dump"`.
5. Digite `RESTAURAR`.
6. Confira os dados em `/db-admin`.

O banco restaurado passa a representar o estado do computador de origem no
momento em que o dump foi criado. Alterações exclusivas do banco de destino não
são mescladas.

## Senha, chave e arquivo `.env`

O arquivo `.dump` não possui uma chave própria e não é criptografado
automaticamente.

A senha do PostgreSQL fica no `.env` de cada computador. A senha do computador
de destino pode ser diferente da senha usada no computador de origem. O restore
usa as credenciais locais do destino.

Não é necessário copiar o `.env` junto com o dump. Em um computador novo,
prefira executar:

```powershell
pnpm db:setup
```

Se o dump estiver dentro de um arquivo ZIP, 7-Zip, pendrive ou volume
criptografado, desbloqueie ou extraia primeiro o `.dump`. Depois execute
normalmente o comando `pnpm db:restore`.

## Segurança

- Não envie `.env` ou arquivos `.dump` ao Git.
- Transporte dumps apenas em mídia ou armazenamento criptografado.
- Não exponha a porta `5432` na rede.
- Não compartilhe senhas do banco por mensagem ou e-mail.
- Guarde pelo menos um backup anterior até confirmar a restauração.
- Os dumps podem conter CNPJ, CPF, endereços e outros dados pessoais.
- Não execute `docker compose down -v` sem um backup confirmado. A opção `-v`
  apaga o volume persistente do PostgreSQL.

## Comandos de referência

```powershell
pnpm db:up               # inicia o PostgreSQL
pnpm db:down             # encerra sem apagar o volume
pnpm db:logs             # mostra os logs
pnpm db:backup           # cria um dump portátil
pnpm db:restore -- "..." # restaura um dump
pnpm db:migrate:deploy   # aplica migrations existentes
pnpm db:studio           # abre a interface local do Prisma
pnpm dev                 # inicia a aplicação
```

## Problemas comuns

### O comando `node` não foi encontrado

Instale o Node.js LTS 22 ou superior, feche o PowerShell e abra novamente.

### O PostgreSQL está indisponível

Abra o Docker Desktop e execute:

```powershell
pnpm db:up
pnpm db:logs
```

### A aplicação abriu em modo demonstração

Nesse modo as gravações são bloqueadas. Confirme se o PostgreSQL está ativo e
se o arquivo `.env` existe.

### O restore informa que o dump é inválido

Não continue. Gere um backup novo no computador de origem e compare o SHA-256
antes de tentar novamente.

