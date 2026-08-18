# MarkLabs Web

Aplicação web principal do MarkLabs, construída com Next.js no monorepo.

## O que este app faz

- Autenticação e seleção de equipe.
- Banco de mídias com upload direto para Cloudflare R2.
- Compositor de posts com mídia, agendamento e pré-visualização.
- Integração com contas sociais conectadas.
- Publicação e agendamento de posts via API interna.

## Fluxo de mídia

O fluxo atual ficou assim:

```text
Frontend
  ↓
/api/media/upload
  ↓
Next.js processa e salva
  ↓
Cloudflare R2
```

Também foi criada a rota de leitura proxy para servir a mídia pelo próprio app:

```text
/api/media/[id]/file
```

## Ajuste automático de proporção

Quando uma imagem é enviada pelo compositor, o app tenta ajustar automaticamente a proporção conforme o tipo de post:

- `POST`: `4:5`
- `REEL`: `9:16`
- `STORY`: `9:16`
- `CAROUSEL`: `1:1`

Se a imagem precisar ser recortada, a interface mostra um aviso informando que o ajuste foi feito automaticamente.

## Publicação

O botão `Publicar Agora` fica habilitado no composer e envia o post pela API interna.

Se for necessário bloquear publicação direta temporariamente, isso pode ser feito na rota:

- [`src/app/api/posts/route.ts`](./src/app/api/posts/route.ts)

## Variáveis de ambiente

As credenciais do R2 usadas atualmente no app são estas:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_PUBLIC_URL` opcional

Outras variáveis importantes do projeto:

- `NEXT_PUBLIC_APP_URL`
- `NEXTAUTH_URL`
- `META_APP_ID`
- `META_APP_SECRET`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`

## Desenvolvimento

```bash
npm install
npm run dev --workspace=web
```

## Verificação

```bash
npm run check-types --workspace=web
```

## Observações

- O upload usa R2 diretamente para evitar o limite antigo de upload no servidor.
- A mídia salva no banco pode apontar para a rota proxy do app, e o sistema normaliza isso quando precisa publicar em plataformas externas.
- O projeto continua em evolução, então algumas integrações podem ser ajustadas conforme novas credenciais ou limites das plataformas.
