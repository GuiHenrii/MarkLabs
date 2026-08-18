# 🚀 MarkLabs - Hub de Inteligência para Redes Sociais

Bem-vindo ao **MarkLabs**, a solução definitiva para gerenciamento de presença digital e análise de dados em redes sociais. Este projeto utiliza uma arquitetura moderna em monorepo para oferecer performance, escalabilidade e uma experiência de usuário fluida.

## 🏗️ Estrutura do Projeto

Nosso ecossistema é dividido em aplicações e pacotes compartilhados:

- **Apps:**
  - `web`: Interface principal construída com Next.js 16 (React 19).
  - `worker`: Processamento de tarefas em background com BullMQ e Redis.
- **Packages:**
  - `database`: Esquemas e cliente Prisma.
  - `social`: Provedores de integração (Facebook, LinkedIn, Instagram).
  - `ui`: Componentes de interface compartilhados.
  - `permissions`: Sistema de controle de acesso.

## 🛠️ Tecnologias Principais

- **Framework:** [Next.js](https://nextjs.org/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Banco de Dados:** [Prisma](https://www.prisma.io/) com PostgreSQL
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Autenticação:** [NextAuth.js](https://next-auth.js.org/)
- **Gerenciamento de Monorepo:** [TurboRepo](https://turbo.build/)
- **Comunicação/E-mail:** [Resend](https://resend.com/)
- **Uploads:** [Cloudinary](https://cloudinary.com/)
- **Fila de Tarefas:** [BullMQ](https://docs.bullmq.io/) + [Redis](https://redis.io/)

## 🚀 Como Começar

### Pré-requisitos
- Node.js >= 18
- Redis (para os workers)
- PostgreSQL

### Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

### Configuração
Crie um arquivo `.env.local` na pasta `apps/web` (use o `.env.example` como guia) e preencha as chaves necessárias (API Keys, Database URL, etc).

> 🛡️ **Nota de Segurança:** Chaves de API nunca devem ser commitadas. O projeto já conta com `.gitignore` configurado na raiz para proteger seus segredos.

### Execução

Para rodar todo o projeto em modo de desenvolvimento:
```bash
npm run dev
```

## 📈 Funcionalidades
- ✅ Gestão de múltiplas contas sociais.
- ✅ Dashboard intuitivo com Recharts.
- ✅ Agendamento de postagens.
- ✅ Sistema de convites para times.
- ✅ Autenticação robusta (JWT + Sessions).

---
Desenvolvido com ❤️ pela equipe **MarkLabs**.
