import { Platform } from "@marklabs/database";
import { AnalyticsSnapshot, PublishResult, SocialProvider } from "./index";

const GRAPH_API = "https://graph.facebook.com/v20.0";

interface InstagramAccountType {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
}

export class InstagramProvider implements SocialProvider {
  platform = Platform.INSTAGRAM;

  constructor(private readonly clientId: string, private readonly clientSecret: string) {}

  getAuthUrl(redirectUri: string, state: string) {
    // Escopos básicos e necessários para Instagram Business via Facebook Login
    // Removendo instagram_content_publish e instagram_manage_insights se estiverem causando erro em modo dev
    return `https://www.facebook.com/v20.0/dialog/oauth?${new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state,
      scope: "instagram_basic,pages_show_list,pages_read_engagement,business_management",
      response_type: "code",
    })}`;
  }

  async exchangeCode(code: string, redirectUri: string) {
    // 1. Trocar código por token de acesso (User Access Token)
    const tokenResponse = await fetch(`${GRAPH_API}/oauth/access_token?${new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri,
      code,
    })}`);

    if (!tokenResponse.ok) throw new Error("Não foi possível trocar o código OAuth do Instagram/Facebook.");
    const token = await tokenResponse.json() as { access_token: string; expires_in?: number };

    // 2. Buscar a conta do Instagram Business vinculada à página do Facebook
    let pagesResponse = await fetch(`${GRAPH_API}/me/accounts?${new URLSearchParams({
      fields: "id,name,instagram_business_account{id,username,name,profile_picture_url}",
      access_token: token.access_token,
    })}`);

    let pagesText = await pagesResponse.text();
    console.log("[INSTAGRAM DEBUG] Resposta de /me/accounts:", pagesText);
    
    let pages = JSON.parse(pagesText) as { data?: Array<{ id: string; name: string; instagram_business_account?: InstagramAccountType }> };
    let igAccount: InstagramAccountType | undefined = pages.data?.find(p => p.instagram_business_account)?.instagram_business_account;

    // Se não encontrou nas páginas pessoais, busca via Business Manager
    if (!igAccount) {
      console.log("[INSTAGRAM DEBUG] Buscando contas do Instagram via Business API...");
      const bizResponse = await fetch(`${GRAPH_API}/me/businesses?${new URLSearchParams({ access_token: token.access_token })}`);
      const bizData = await bizResponse.json() as { data?: Array<{ id: string; name: string }> };
      const business = bizData.data?.[0];

      if (business) {
        // 1. Tenta buscar contas do Instagram vinculadas diretamente ao Business Manager
        const bizIgResponse = await fetch(`${GRAPH_API}/${business.id}/instagram_accounts?${new URLSearchParams({ 
          fields: "id,username,name,profile_pic", 
          access_token: token.access_token 
        })}`);
        const bizIgData = await bizIgResponse.json() as { data?: Array<{ id: string; username: string; name?: string; profile_pic?: string }> };
        
        if (bizIgData.data && bizIgData.data.length > 0) {
          console.log("[INSTAGRAM DEBUG] Contas encontradas diretamente no Business:", bizIgData.data);
          const first = bizIgData.data[0];
          if (first) {
            igAccount = {
              id: first.id,
              username: first.username,
              name: first.name || first.username,
              profile_picture_url: first.profile_pic
            };
          }
        }

        // 2. Se não achou direto, varre TODAS as páginas (owned e client) procurando o Instagram
        if (!igAccount) {
          for (const edge of ["owned_pages", "client_pages"]) {
            const bizPagesResponse = await fetch(`${GRAPH_API}/${business.id}/${edge}?${new URLSearchParams({ 
              fields: "id,name,instagram_business_account{id,username,name,profile_picture_url}", 
              access_token: token.access_token 
            })}`);
            const bizPagesData = await bizPagesResponse.json() as { data?: Array<{ id: string; name: string; instagram_business_account?: { id: string; username: string; name: string; profile_picture_url?: string } }> };
            
            if (bizPagesData.data && bizPagesData.data.length > 0) {
              console.log(`[INSTAGRAM DEBUG] Páginas encontradas em ${edge}:`, bizPagesData.data.map(p => ({ id: p.id, name: p.name, hasIg: !!p.instagram_business_account })));
              // Encontra a primeira página que REALMENTE tem Instagram vinculado (ex: Mark Share)
              const pageWithIg = bizPagesData.data.find(p => p.instagram_business_account);
              if (pageWithIg?.instagram_business_account) {
                igAccount = pageWithIg.instagram_business_account;
                break;
              }
            }
          }
        }
      }
    }

    // Se ainda não encontrou, tenta buscar direto no endpoint de Instagram do usuário ou pelo ID autorizado
    if (!igAccount) {
      console.log("[INSTAGRAM DEBUG] Tentando buscar detalhes diretos do Instagram...");
      // Tenta buscar no perfil direto do usuário
      const directIg = await fetch(`${GRAPH_API}/me?${new URLSearchParams({ 
        fields: "accounts{instagram_business_account{id,username,name,profile_picture_url}}", 
        access_token: token.access_token 
      })}`);
      const directIgData = await directIg.json() as any;
      const directFound = directIgData.accounts?.data?.find((p: any) => p.instagram_business_account)?.instagram_business_account;
      if (directFound) {
        igAccount = directFound;
      }
    }

    // Se a API ainda não listou mas você autorizou a conta no diálogo, consulta a conta do Instagram dinamicamente via debug_token
    if (!igAccount) {
      console.log("[INSTAGRAM DEBUG] Inspecionando escopos do token para encontrar IDs de Instagram autorizados...");
      try {
        const debugTokenResponse = await fetch(`${GRAPH_API}/debug_token?${new URLSearchParams({
          input_token: token.access_token,
          access_token: `${this.clientId}|${this.clientSecret}`,
        })}`);
        const debugTokenData = await debugTokenResponse.json() as any;
        
        // Extrai os IDs das contas ou páginas que o usuário selecionou na tela
        const granularScopes = debugTokenData?.data?.granular_scopes || [];
        const igScope = granularScopes.find((s: any) => s.scope === "instagram_basic" || s.scope === "pages_show_list");
        const targetIds: string[] = igScope?.target_ids || [];

        console.log("[INSTAGRAM DEBUG] IDs autorizados encontrados no token:", targetIds);

        for (const targetId of targetIds) {
          console.log(`[INSTAGRAM DEBUG] Consultando nó autorizado: ${targetId}`);
          
          // 1. Busca os dados da página do Facebook usando 'picture' (correto para páginas)
          const nodeResponse = await fetch(`${GRAPH_API}/${targetId}?${new URLSearchParams({ 
            fields: "id,name,access_token,picture,instagram_business_account{id,username,name,profile_picture_url}", 
            access_token: token.access_token 
          })}`);
          const nodeData = await nodeResponse.json() as any;
          console.log(`[INSTAGRAM DEBUG] Resposta do nó ${targetId}:`, nodeData);

          if (nodeData && !nodeData.error) {
            // Se o nó já retornou o Instagram vinculado
            if (nodeData.instagram_business_account) {
              igAccount = nodeData.instagram_business_account;
              break;
            }

            // Se for uma página e tiver Page Access Token, consulta o nó do Instagram diretamente
            if (nodeData.access_token) {
              const pageIgResponse = await fetch(`${GRAPH_API}/${targetId}?${new URLSearchParams({ 
                fields: "instagram_business_account{id,username,name,profile_picture_url}", 
                access_token: nodeData.access_token 
              })}`);
              const pageIgData = await pageIgResponse.json() as any;
              console.log(`[INSTAGRAM DEBUG] Resposta com Page Token para ${targetId}:`, pageIgData);
              if (pageIgData?.instagram_business_account) {
                igAccount = pageIgData.instagram_business_account;
                break;
              }
            }
          } else {
            // Se o nó for diretamente uma conta de Instagram (e não uma página)
            const directIgResponse = await fetch(`${GRAPH_API}/${targetId}?${new URLSearchParams({ 
              fields: "id,username,name,profile_picture_url", 
              access_token: token.access_token 
            })}`);
            const directIgData = await directIgResponse.json() as any;
            if (directIgData && !directIgData.error && directIgData.username) {
              igAccount = directIgData;
              break;
            }
          }
        }
      } catch (err) {
        console.error("[INSTAGRAM DEBUG] Erro ao inspecionar debug_token:", err);
      }
    }

    if (!igAccount) throw new Error("Nenhuma conta do Instagram Business encontrada vinculada às suas páginas do Facebook.");

    return {
      accessToken: token.access_token,
      platformId: igAccount.id,
      name: igAccount.name || igAccount.username,
      username: igAccount.username,
      avatar: igAccount.profile_picture_url,
      tokenExpiry: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined,
    };
  }

  async publish(accessToken: string, platformId: string, content: string, mediaUrls?: string[]): Promise<PublishResult> {
    if (!mediaUrls?.length) {
      return { success: false, error: "O Instagram exige pelo menos uma imagem ou vídeo." };
    }

    try {
      // 1. Criar container de mídia
      const params = new URLSearchParams();
      if (mediaUrls[0]) params.append("image_url", mediaUrls[0]);
      params.append("caption", content);
      params.append("access_token", accessToken);

      const containerResponse = await fetch(`${GRAPH_API}/${platformId}/media`, {
        method: "POST",
        body: params,
      });

      if (!containerResponse.ok) {
        const error = await containerResponse.json();
        return { success: false, error: error.error?.message || "Falha ao criar container de mídia no Instagram." };
      }

      const { id: creationId } = await containerResponse.json() as { id: string };

      // 2. Publicar o container
      const publishResponse = await fetch(`${GRAPH_API}/${platformId}/media_publish`, {
        method: "POST",
        body: new URLSearchParams({
          creation_id: creationId,
          access_token: accessToken,
        }),
      });

      if (!publishResponse.ok) return { success: false, error: "Falha ao publicar no Instagram." };
      const data = await publishResponse.json() as { id: string };

      return { success: true, providerPostId: data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido ao publicar no Instagram." };
    }
  }

  async getAnalytics(accessToken: string, platformId: string): Promise<AnalyticsSnapshot> {
    return { followers: 0, impressions: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0 };
  }

  async verifyHealth(accessToken: string) {
    const response = await fetch(`${GRAPH_API}/me?${new URLSearchParams({ access_token: accessToken })}`);
    return response.ok;
  }
}
