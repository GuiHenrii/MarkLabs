# MarkLabs - Hub de Inteligencia para Redes Sociais

**Versao atual: v0.1.2**

Bem-vindo ao **MarkLabs**, a solucao para gerenciamento de presenca digital, analise de dados e automacao em redes sociais. Este projeto usa uma arquitetura moderna em monorepo para manter a plataforma organizada, escalavel e facil de evoluir.

## O que mudou na v0.1.2

- Revisao da interface web com navegação mais consistente no `layout`, `sidebar` e `topbar`.
- Ajustes visuais globais para melhorar a experiencia em desktop e mobile.
- Evolucao da tela de composicao de posts, com fluxo mais confiavel de criacao e envio.
- Correcao do falso positivo de publicacao quando a API rejeita o conteudo.
- Expansao das rotas de analytics para coleta ao vivo por conta social.
- Consolidacao de metricas por periodo com suporte a `7 dias`, `30 dias`, `90 dias` e `6 meses`.
- Melhorias nos provedores sociais de Facebook, Instagram e LinkedIn.
- Ajustes nas rotas de conexao, callback e sincronizacao de contas.
- Atualizacoes em worker, rotas de API, `next.config.ts` e workflows de CI/E2E.

## Estrutura do Projeto

O ecossistema e dividido em aplicacoes e pacotes compartilhados:

- Apps:
  - `web`: Interface principal com Next.js.
  - `worker`: Processamento de tarefas em background.
- Packages:
  - `database`: Esquemas e cliente Prisma.
  - `social`: Provedores de integracao sociais.
  - `ui`: Componentes de interface compartilhados.
  - `permissions`: Sistema de controle de acesso.

## Tecnologias Principais

- Framework: [Next.js](https://nextjs.org/)
- Linguagem: [TypeScript](https://www.typescriptlang.org/)
- Banco de Dados: [Prisma](https://www.prisma.io/) com PostgreSQL
- Estilização: [Tailwind CSS](https://tailwindcss.com/)
- Autenticação: [NextAuth.js](https://next-auth.js.org/)
- Gerenciamento de Monorepo: [Turborepo](https://turbo.build/)
- Comunicação/E-mail: [Resend](https://resend.com/)
- Uploads: [Cloudinary](https://cloudinary.com/)
- Fila de Tarefas: [BullMQ](https://docs.bullmq.io/) + [Redis](https://redis.io/)

## Como Comecar

### Pre-requisitos
- Node.js >= 18
- Redis para os workers
- PostgreSQL

### Instalacao

1. Clone o repositorio.
2. Instale as dependencias:

```bash
npm install
```

### Configuracao

Crie um arquivo `.env.local` na pasta `apps/web` usando o `.env.example` como guia e preencha as chaves necessarias.

> **Nota de seguranca:** Chaves de API nunca devem ser commitadas.

### Execucao

Para rodar o projeto em modo de desenvolvimento:

```bash
npm run dev
```

## Funcionalidades

- Gestao de multiplas contas sociais
- Dashboard intuitivo com Recharts
- Agendamento de postagens
- Sistema de convites para times
- Autenticacao robusta com JWT e sessions

---
Desenvolvido com amor por **UNIT**.
