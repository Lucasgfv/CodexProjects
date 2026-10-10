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

Trocar `FISCAL_CREDENTIALS_KEY` sem antes recriptografar os registros torna as
senhas já salvas ilegíveis.

## Banco de dados

No processo de publicação, execute:

```bash
pnpm db:generate
pnpm db:migrate:deploy
```

O comando `pnpm db:import:fiscal` serve para a migração inicial dos dados da
pasta `Flex`. Não inclua essa pasta nem arquivos de backup na imagem final da
aplicação. Mantenha backups automáticos, criptografados e testados por meio de
restaurações periódicas.

## Segurança antes da liberação

- Adicionar autenticação e autorização por perfil antes de expor qualquer rota.
- Restringir o módulo fiscal a usuários autorizados e registrar ações críticas.
- Usar HTTPS obrigatório e cookies seguros na camada de autenticação.
- Não expor a porta do PostgreSQL à internet; somente a aplicação deve acessar
  o banco pela rede privada do provedor.
- Definir limites de requisição e proteção contra tentativas repetidas de acesso.
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
2. alteração de status com data automática;
3. envio e cancelamento de guia do MEI;
4. atualização de certificado, CPF e senha;
5. persistência após reiniciar a aplicação;
6. backup e restauração do banco.

Somente promova a versão para produção depois que essa homologação estiver
concluída e o acesso público anônimo estiver bloqueado.
