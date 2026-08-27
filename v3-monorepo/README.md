# MarkLabs - Social Media Manager

Plataforma unificada para gerenciamento, agendamento e publicacao de conteudos nas redes sociais, com suporte a automacao, analytics em tempo real e integracoes com a API da OpenAI.

## Versao atual

**v0.1.0**

## O que mudou ate agora

### Nova base visual e navegacao
- Revisao geral da interface web com visual mais consistente no `layout`, `sidebar` e `topbar`.
- Ajustes de estilo global em `globals.css` para deixar a experiencia mais polida em desktop e mobile.
- Refinos na pagina inicial do app e em rotas como `dashboard`, `media`, `settings`, `calendar` e `accounts`.

### Composer e publicacao
- Evolucao importante da tela de composicao de posts, com melhor suporte a fluxos de criacao e envio.
- Correcao do fluxo de publicacao para evitar falso positivo visual quando a API rejeita o conteudo.
- Melhoria no tratamento de erros da Graph API, com mensagens mais claras para o usuario e logs mais uteis no backend.

### Analytics
- Reescrita e expansao das rotas de analytics para buscar dados ao vivo por conta social.
- Consolidacao de metrica por periodo com suporte a janelas como `7 dias`, `30 dias`, `90 dias` e `6 meses`.
- Adicao de warnings por conta quando ha falha de token, indisponibilidade de coletor ou erro de integracao.
- Atualizacao dos componentes de analytics de Ads e Organic para refletir o novo fluxo.

### Integracoes sociais
- Refinamento do pacote `@marklabs/social` com contrato mais claro para providers.
- Ajustes nas implementacoes de Facebook, Instagram e LinkedIn.
- Melhorias no fluxo de conexao e callback de contas sociais.
- Ajustes na listagem e sincronizacao de contas conectadas.

### Infraestrutura e jobs
- Atualizacoes nas rotas de API para suportar melhor o ciclo de publicacao e leitura de dados.
- Ajustes no worker para processamentos de background.
- Mudancas no `next.config.ts` para suportar o novo comportamento da aplicacao.
- Atualizacoes nos workflows de CI e E2E para acompanhar o estado atual do projeto.

## Funcionalidades do sistema

- Gerenciamento de multiplas contas sociais
- Criacao de Posts, Carrosseis, Reels e Stories
- Agendamento de publicacoes com calendario integrado
- Analytics consolidado por conta e por periodo
- Integracao nativa com armazenamento de midia
- Suporte a multiplos workspaces e times

## Tecnologias

- Frontend / Backend: Next.js 14+, App Router, Turborepo
- Banco de dados: Prisma ORM, PostgreSQL
- Autenticacao: NextAuth.js
- Armazenamento de midia: Cloudflare R2 / AWS S3
- Estilizacao: Tailwind CSS + UI Components
- Fila e jobs: Upstash Redis (QStash)
