# MarkLabs - Social Media Manager

Plataforma unificada para gerenciamento, agendamento e publicação de conteúdos nas redes sociais, com suporte a fluxos avançados de automação e integração com a API da OpenAI.

## 🚀 Versão atual: v1 0.0.4

### O que há de novo na v0.0.4 (Test v1)
Nesta atualização, focamos em estabilizar o motor de publicações para o Instagram e Meta, resolvendo gargalos na comunicação com a Graph API.

* **Fix do Carrossel do Instagram**: Corrigido o envio do parâmetro `children` para criação de carrosseis no Instagram. A API requeria um array unificado (comma-separated), o que causava `Invalid parameter` ao tentar agrupar mídias num post só.
* **Resolução de Mídias via Cloudflare R2**: Restauramos o uso de URLs Assinadas (Presigned URLs) no envio para o Facebook/Instagram. O envio de URLs brutas `.r2.dev` causava bloqueio (HTTP 403 / Bot Protection) nos servidores do Cloudflare durante a requisição dos robôs da Meta.
* **Melhoria no Timeout de Processamento de Vídeos (Reels/Carrossel)**: 
  * Aumentado o `maxAttempts` do polling de status de containers de mídia no provedor Instagram para aguentar até 60 segundos de processamento.
  * Aumentado o `maxDuration` das rotas de API do Next.js para até 2 minutos (`maxDuration = 120`), prevenindo timeouts prematuros quando o Instagram demora para transcodificar vídeos pesados.
* **Feedback Visual de Publicação Instantânea**: Corrigido um falso positivo na tela de `Composer`. Anteriormente, se a Graph API rejeitasse um conteúdo no ato da publicação, a API backend ainda retornava código HTTP `201`, fazendo a tela ficar "verde". Agora o backend lança corretamente um erro `400` contendo o `errorMessage` exato da plataforma.
* **Logs Detalhados para Debug**: Adicionado payload de erro da Meta nos logs do terminal para facilitar a depuração de rejeições de formato de vídeo ou container.

### Funcionalidades do Sistema
* Gerenciamento de Múltiplas Contas Sociais (Instagram, Facebook, LinkedIn, TikTok, YouTube).
* Interface rica de criação de Posts, Carrosseis, Reels e Stories.
* Agendamento de posts com calendário interativo integrado.
* Integração nativa com Storage (Cloudflare R2).
* Suporte nativo para múltiplos Workspaces/Times.

## 🛠️ Tecnologias
- **Frontend / Backend**: Next.js 14+ (App Router), Turborepo
- **Banco de Dados**: Prisma ORM, PostgreSQL (Neon)
- **Autenticação**: NextAuth.js
- **Armazenamento de Mídia**: Cloudflare R2 / AWS S3
- **Estilização**: Tailwind CSS + UI Components
- **Fila/Jobs (Agendamento)**: Upstash Redis (QStash)
