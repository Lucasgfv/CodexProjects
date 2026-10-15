# Fiscal Leve — preparação para produção

O Fiscal Leve foi incorporado ao Nexo Contábil e grava empresas, tarefas,
MEIs, faturamentos, certificados, acessos e configurações no mesmo PostgreSQL.
Este guia reúne os itens que precisam ser concluídos antes de liberar acesso
pela internet.

## Variáveis obrigatórias

Configure as variáveis no provedor de hospedagem, sem adicioná-las ao Git:

- `DATABASE_URL`: conexão PostgreSQL com SSL, usuário exclusivo e permissões
  restritas ao banco do Nexo.
- `FISCAL_CREDENTIALS_KEY`: chave longa e exclusiva usada para criptografar as
  senhas de acesso manual dos MEIs. Guarde uma cópia em cofre de segredos.
- `APP_ORIGIN`: origem HTTPS oficial da aplicação, por exemplo
  `https://nexo.exemplo.com.br`.
- `BETTER_AUTH_SECRET`: segredo aleatório exclusivo, com pelo menos 32
  caracteres, usado para assinar e proteger as sessões.
- `BETTER_AUTH_URL`: endereço HTTPS oficial da aplicação. Em previews da
  Vercel, deixe ausente para que o endereço seja inferido da requisição.
- `CORS_ALLOWED_ORIGINS`: origens adicionais, separadas por vírgula. Deixe
  vazio quando frontend e backend usam o mesmo domínio.
- `API_MAX_BODY_BYTES`: limite dos corpos JSON; o padrão é 65536 bytes.
- `API_WRITE_RATE_LIMIT` e `API_WRITE_RATE_WINDOW_MS`: limite básico de
  alterações por endereço e rota.

Trocar `FISCAL_CREDENTIALS_KEY` sem antes recriptografar os registros torna as
senhas já salvas ilegíveis.

## Banco de dados

No processo de publicação, execute:

```bash
pnpm db:generate
pnpm db:migrate:deploy
```

A migração inicial do antigo Fiscal Leve já foi concluída. A pasta de origem e
o importador não fazem parte da aplicação final. Não inclua arquivos de backup
na imagem publicada. Mantenha backups automáticos, criptografados e testados
por meio de restaurações periódicas.

## Proteções já aplicadas

- Login administrativo por e-mail e senha, com hash seguro no banco e cadastro
  público desativado.
- Sessões de oito horas em cookies `HttpOnly`, `SameSite` e `Secure` em
  produção, com logout e troca de senha. O cache de sessão no cookie permanece
  desativado para que a revogação seja conferida imediatamente no banco.
- Páginas e APIs validam a sessão real no servidor; o middleware faz apenas o
  redirecionamento antecipado e nunca é a única barreira.
- Limite de tentativas do login persistido no PostgreSQL, compartilhado entre
  instâncias da aplicação.
- CSP, HSTS em produção, bloqueio de iframe, `nosniff`, política de referência
  e restrição de câmera, microfone e localização.
- CORS restrito à própria origem e às origens explicitamente configuradas.
- Respostas de API sem cache, com identificador de requisição e mensagens de
  erro que não expõem stack trace.
- Validação Zod, limite real do corpo JSON e tratamento seguro dos erros Prisma.
- Limitação básica de escritas. Em múltiplas instâncias, complemente-a no WAF
  ou em um armazenamento de limite distribuído.
- Senhas fiscais criptografadas no banco e ausentes dos snapshots enviados ao
  navegador. O campo permite somente substituição por uma nova senha.

## Segurança antes da liberação

- Substituir a senha administrativa temporária e guardar a definitiva em um
  gerenciador de senhas.
- Configurar `BETTER_AUTH_SECRET` como segredo diferente em produção e preview.
- Usar HTTPS obrigatório; os cookies seguros são ativados automaticamente no
  ambiente de produção.
- Não expor a porta do PostgreSQL à internet; somente a aplicação deve acessar
  o banco pela rede privada do provedor.
- Configurar rate limiting distribuído ou WAF no provedor antes da abertura pública.
- Se novos usuários forem adicionados futuramente, criar perfis e escopo por
  organização antes de habilitar qualquer novo cadastro.
- Formalizar política de retenção e descarte dos dados pessoais conforme a LGPD.
- Remover dados de demonstração e conferir os responsáveis por cada carteira.

## Verificação de cada publicação

Execute antes de gerar a versão final:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Depois da publicação, valide o fluxo completo em ambiente de homologação:

1. acesso autenticado ao hub e ao Fiscal Leve;
2. bloqueio das páginas e APIs após logout;
3. troca de senha e encerramento das demais sessões;
4. alteração de status com data automática;
5. envio e cancelamento de guia do MEI;
6. atualização de certificado, CPF e senha;
7. persistência após reiniciar a aplicação;
8. backup e restauração do banco.

Somente promova a versão para produção depois que essa homologação estiver
concluída e o acesso público anônimo estiver bloqueado.
