# Publicação do Nexo Contábil no AWS Lightsail

Esta configuração prioriza o menor custo mensal sem publicar o PostgreSQL na
internet. Uma única instância Lightsail executa Caddy, Next.js e PostgreSQL em
containers separados. Caddy é a única entrada pública e emite/renova o
certificado HTTPS automaticamente.

## Recursos AWS

- Lightsail Linux com 2 GB de memória, 2 vCPUs e IP estático.
- Zona DNS do Lightsail ou DNS mantido no registrador atual.
- Snapshots automáticos diários da instância.
- Bucket S3 privado para uma segunda cópia dos dumps do PostgreSQL.
- AWS Budgets com alerta de custo mensal.

Não são necessários inicialmente Load Balancer, ECS, Fargate, NAT Gateway,
CloudFront ou RDS. Considere separar o banco quando o volume, a disponibilidade
ou a equipe justificarem o custo adicional.

## 1. Preparar a conta

1. Ative MFA na conta raiz da AWS e use um usuário administrativo separado.
2. Em Billing, crie um orçamento mensal e alertas em 80% e 100% do limite.
3. Crie a instância Lightsail na região de São Paulo (`sa-east-1`) usando
   Ubuntu 24.04 LTS e o plano Linux de 2 GB.
4. Anexe um IP estático.
5. No firewall, deixe públicos somente TCP 80, TCP 443 e UDP 443. Restrinja
   TCP 22 ao IP administrativo; nunca abra 5432.

## 2. Apontar o domínio

Crie um registro `A` para o subdomínio desejado apontando ao IP estático. O
valor de `NEXO_DOMAIN`, `APP_ORIGIN` e `BETTER_AUTH_URL` deve ser exatamente
esse endereço, sem barra final.

## 3. Instalar o runtime no servidor

Instale Docker Engine com o repositório oficial do Docker e habilite o plugin
Docker Compose. Adicione o usuário de implantação ao grupo `docker` e abra uma
nova sessão SSH antes de continuar.

## 4. Enviar e configurar o projeto

Copie o projeto para `/opt/nexo-contabil`. No servidor:

```bash
cd /opt/nexo-contabil
cp .env.production.example .env.production
chmod 600 .env.production
```

Edite `.env.production` e gere valores diferentes para cada segredo:

```bash
openssl rand -hex 32
```

Use uma senha hexadecimal para `POSTGRES_PASSWORD` e repita o mesmo valor em
`DATABASE_URL`. Não reutilize `BETTER_AUTH_SECRET` nem
`FISCAL_CREDENTIALS_KEY`.

## 5. Subir a homologação

```bash
docker compose -f compose.production.yaml build
docker compose -f compose.production.yaml up -d
docker compose -f compose.production.yaml ps
docker compose -f compose.production.yaml logs --tail=100 migrate app caddy
```

O serviço `migrate` executa `prisma migrate deploy` antes de liberar o app. O
PostgreSQL e a porta 3000 ficam somente nas redes privadas do Docker.

## 6. Criar o administrador

Não grave a senha no arquivo de ambiente. Execute o seed com variáveis apenas
na sessão SSH:

```bash
export ADMIN_NAME='Administrador'
export ADMIN_EMAIL='admin@exemplo.com.br'
read -rsp 'Senha inicial: ' ADMIN_PASSWORD && echo
export ADMIN_PASSWORD
docker compose -f compose.production.yaml run --rm \
  -e ADMIN_NAME \
  -e ADMIN_EMAIL \
  -e ADMIN_PASSWORD \
  migrate node scripts/seed-admin.mjs
unset ADMIN_PASSWORD
```

Assim, a senha não fica registrada no histórico do shell.

## 7. Configurar backups

Instale `postgresql-client` e AWS CLI no servidor. Crie um bucket S3 privado,
ative versionamento, bloqueio total de acesso público, criptografia padrão e
uma regra de ciclo de vida. Depois configure uma tarefa diária com:

```bash
export AWS_S3_BACKUP_URI='s3://nome-do-bucket/nexo-contabil'
bash scripts/backup-production.sh
```

O script cria um dump no formato customizado, calcula SHA-256, valida o arquivo
com `pg_restore --list` e envia dump e checksum ao S3 com criptografia SSE-S3.
Faça uma restauração de homologação periodicamente; backup sem teste de
restauração não encerra o risco de perda.

## 8. Homologar antes da liberação

- acesso anônimo redireciona para `/login`;
- APIs de negócio retornam 401 sem sessão;
- login, logout e troca de senha funcionam;
- Fiscal Leve persiste alterações depois de reiniciar o container;
- o banco pode ser restaurado a partir de um dump recente;
- os snapshots automáticos estão ativos;
- o alerta de orçamento foi recebido.

Consulte também `docs/FISCAL-LEVE-PRODUCAO.md` para o gate funcional e de
segurança completo.
