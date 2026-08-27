import { Platform } from "@marklabs/database";
import { AnalyticsSnapshot, PublishInput, PublishResult, SocialProvider } from "./index";

const GRAPH_API = "https://graph.facebook.com/v25.0";

interface InstagramAccountType {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
}

type InstagramInsight = { name: string; values?: Array<{ value?: number }>; total_value?: { value?: number } };

export class InstagramProvider implements SocialProvider {
  platform = Platform.INSTAGRAM;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly loginConfigId?: string
  ) {}

  private async getInsightMetrics(accessToken: string, platformId: string, metric: string, extraParams?: Record<string, string>) {
    const response = await fetch(`${GRAPH_API}/${platformId}/insights?${new URLSearchParams({
      metric,
      period: "day",
      access_token: accessToken,
      ...extraParams,
    })}`);
    const data = (await response.json().catch(() => ({}))) as {
      data?: InstagramInsight[];
      error?: { code?: number; message?: string };
    };

    return {
      ok: response.ok,
      data: response.ok ? data.data ?? [] : [],
      message: data.error?.message,
      code: data.error?.code,
    };
  }

  getAuthUrl(redirectUri: string, state: string) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state,
    });

    if (this.loginConfigId) {
      params.set("config_id", this.loginConfigId);
      params.set("response_type", "code");
      params.set("override_default_response_type", "true");
    } else {
      params.set("scope", "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_metadata");
      params.set("response_type", "code");
      params.set("return_scopes", "true");
    }

    return `https://www.facebook.com/v25.0/dialog/oauth?${params}`;
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

    const allIgAccounts: Array<InstagramAccountType> = [];

    // 2. Buscar a conta do Instagram Business vinculada à página do Facebook
    let pagesResponse = await fetch(`${GRAPH_API}/me/accounts?${new URLSearchParams({
      fields: "id,name,instagram_business_account{id,username,name,profile_picture_url}",
      limit: "100",
      access_token: token.access_token,
    })}`);

    let pagesText = await pagesResponse.text();
    
    let pages = JSON.parse(pagesText) as {
      data?: Array<{
        id: string;
        name: string;
        access_token?: string;
        instagram_business_account?: InstagramAccountType;
      }>;
    };
    if (pages.data) {
      for (const p of pages.data) {
        if (p.instagram_business_account) allIgAccounts.push(p.instagram_business_account);
      }
    }

    const bizResponse = await fetch(`${GRAPH_API}/me/businesses?${new URLSearchParams({ limit: "100", access_token: token.access_token })}`);
    const bizData = await bizResponse.json() as { data?: Array<{ id: string; name: string }> };

    if (bizData.data) {
      for (const business of bizData.data) {
        // 1. Tenta buscar contas do Instagram vinculadas diretamente ao Business Manager
        const bizIgResponse = await fetch(`${GRAPH_API}/${business.id}/instagram_accounts?${new URLSearchParams({ 
          fields: "id,username,name,profile_pic", 
          limit: "100",
          access_token: token.access_token 
        })}`);
        const bizIgData = await bizIgResponse.json() as { data?: Array<{ id: string; username: string; name?: string; profile_pic?: string }> };
        
        if (bizIgData.data) {
          for (const first of bizIgData.data) {
            allIgAccounts.push({
              id: first.id,
              username: first.username,
              name: first.name || first.username,
              profile_picture_url: first.profile_pic
            });
          }
        }

        // 2. Varre TODAS as páginas (owned e client) procurando o Instagram
        for (const edge of ["owned_pages", "client_pages"]) {
          const bizPagesResponse = await fetch(`${GRAPH_API}/${business.id}/${edge}?${new URLSearchParams({ 
            fields: "id,name,instagram_business_account{id,username,name,profile_picture_url}", 
            limit: "100",
            access_token: token.access_token 
          })}`);
          const bizPagesData = await bizPagesResponse.json() as { data?: Array<{ id: string; name: string; instagram_business_account?: InstagramAccountType }> };
          
          if (bizPagesData.data) {
            for (const p of bizPagesData.data) {
              if (p.instagram_business_account) allIgAccounts.push(p.instagram_business_account);
            }
          }
        }
      }
    }

    // Tenta buscar no perfil direto do usuário
    const directIg = await fetch(`${GRAPH_API}/me?${new URLSearchParams({ 
      fields: "accounts.limit(100){instagram_business_account{id,username,name,profile_picture_url}}", 
      access_token: token.access_token 
    })}`);
    const directIgData = await directIg.json() as any;
    if (directIgData.accounts?.data) {
      for (const p of directIgData.accounts.data) {
        if (p.instagram_business_account) allIgAccounts.push(p.instagram_business_account);
      }
    }

    try {
      const debugTokenResponse = await fetch(`${GRAPH_API}/debug_token?${new URLSearchParams({
        input_token: token.access_token,
        access_token: `${this.clientId}|${this.clientSecret}`,
      })}`);
      const debugTokenData = await debugTokenResponse.json() as any;
      
      const granularScopes = debugTokenData?.data?.granular_scopes || [];
      const igScope = granularScopes.find((s: any) => s.scope === "instagram_basic" || s.scope === "pages_show_list");
      const targetIds: string[] = igScope?.target_ids || [];

      for (const targetId of targetIds) {
        const nodeResponse = await fetch(`${GRAPH_API}/${targetId}?${new URLSearchParams({ 
          fields: "id,name,access_token,picture,instagram_business_account{id,username,name,profile_picture_url}", 
          access_token: token.access_token 
        })}`);
        const nodeData = await nodeResponse.json() as any;

        if (nodeData && !nodeData.error) {
          if (nodeData.instagram_business_account) {
            allIgAccounts.push(nodeData.instagram_business_account);
          }
          if (nodeData.access_token) {
            const pageIgResponse = await fetch(`${GRAPH_API}/${targetId}?${new URLSearchParams({ 
              fields: "instagram_business_account{id,username,name,profile_picture_url}", 
              access_token: nodeData.access_token 
            })}`);
            const pageIgData = await pageIgResponse.json() as any;
            if (pageIgData?.instagram_business_account) {
              allIgAccounts.push(pageIgData.instagram_business_account);
            }
          }
        } else {
          const directIgResponse = await fetch(`${GRAPH_API}/${targetId}?${new URLSearchParams({ 
            fields: "id,username,name,profile_picture_url", 
            access_token: token.access_token 
          })}`);
          const directIgData = await directIgResponse.json() as any;
          if (directIgData && !directIgData.error && directIgData.username) {
            allIgAccounts.push(directIgData);
          }
        }
      }
    } catch {
    }

    const uniqueIgs = Array.from(new Map(allIgAccounts.map((a) => [a.id, a])).values());

    if (uniqueIgs.length === 0) throw new Error("Nenhuma conta do Instagram Business encontrada vinculada às suas páginas do Facebook.");

    return uniqueIgs.map((igAccount) => ({
      accessToken: token.access_token, // USE USER TOKEN
      platformId: igAccount.id,
      name: igAccount.name || igAccount.username,
      username: igAccount.username,
      avatar: igAccount.profile_picture_url,
      tokenExpiry: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined,
    }));
  }

  async publish(accessToken: string, platformId: string, input: PublishInput): Promise<PublishResult> {
    const mediaUrls = input.media ?? [];
    const content = input.content;
    const postType = input.postType ?? "POST";

    if (!mediaUrls.length) {
      return { success: false, error: "O Instagram exige pelo menos uma imagem ou vídeo." };
    }

    if (postType === "STORY" && mediaUrls.length !== 1) {
      return { success: false, error: "Story aceita apenas uma mídia por publicação." };
    }

    if (postType === "REEL" && mediaUrls.length !== 1) {
      return { success: false, error: "Reel aceita apenas um vídeo por publicação." };
    }

    if (postType === "REEL" && mediaUrls[0]?.type !== "VIDEO") {
      return { success: false, error: "Reel no Instagram precisa ser vídeo. Use Post ou Story para imagem." };
    }

    if (postType === "CAROUSEL" && mediaUrls.length < 2) {
      return { success: false, error: "Carrossel precisa de pelo menos 2 mídias." };
    }

    try {
      const isVideo = mediaUrls[0]?.type === "VIDEO";
      const params = new URLSearchParams();
      params.append("caption", content);
      params.append("access_token", accessToken);

      if (postType === "STORY") {
        params.append("media_type", "STORIES");
        if (isVideo) {
          params.append("video_url", mediaUrls[0]!.url);
        } else {
          params.append("image_url", mediaUrls[0]!.url);
        }
      } else if (postType === "REEL" || isVideo) {
        params.append("media_type", "REELS");
        params.append("video_url", mediaUrls[0]!.url);
        params.append("share_to_feed", "true");
      } else if (mediaUrls.length > 1) {
        params.append("media_type", "CAROUSEL");
      } else {
        params.append("image_url", mediaUrls[0]!.url);
      }

      if (postType === "CAROUSEL" || mediaUrls.length > 1) {
        const children: string[] = [];
        for (const media of mediaUrls) {
          const childParams = new URLSearchParams({
            access_token: accessToken,
            is_carousel_item: "true",
          });
          
          if (media.type === "VIDEO") {
            childParams.set("media_type", "VIDEO");
            childParams.set("video_url", media.url);
          } else {
            childParams.set("image_url", media.url);
          }
          
          const childResponse = await fetch(`${GRAPH_API}/${platformId}/media`, { method: "POST", body: childParams });
          if (!childResponse.ok) {
            const error = await childResponse.json().catch(() => ({}));
            return { success: false, error: error?.error?.message || "Falha ao criar container filho no Instagram." };
          }
          const childData = await childResponse.json() as { id: string };
          
          // Se for vídeo, precisamos esperar o container ficar pronto (FINISHED) antes de anexar ao carrossel
          if (media.type === "VIDEO") {
            const ready = await this.waitForContainerReady(childData.id, accessToken);
            if (!ready.success) return ready;
          }
          
          children.push(childData.id);
        }
        // O Instagram espera um array com as strings dos IDs dos filhos.
        const parentParams = new URLSearchParams({ access_token: accessToken, caption: content, media_type: "CAROUSEL" });
        // Na Fetch API / URLSearchParams, append do mesmo nome repetido nem sempre é aceito pelo Graph API.
        // É melhor enviar children como uma string separada por vírgulas, ou usar a notação de array que o Facebook aceita:
        parentParams.append("children", children.join(","));
        
        const parentResponse = await fetch(`${GRAPH_API}/${platformId}/media`, { method: "POST", body: parentParams });
        if (!parentResponse.ok) {
          const error = await parentResponse.json().catch(() => ({}));
          return { success: false, error: error?.error?.message || "Falha ao criar carrossel no Instagram." };
        }
        const parentData = await parentResponse.json() as { id: string };
        const publishResponse = await fetch(`${GRAPH_API}/${platformId}/media_publish`, {
          method: "POST",
          body: new URLSearchParams({ creation_id: parentData.id, access_token: accessToken }),
        });
        if (!publishResponse.ok) return { success: false, error: "Falha ao publicar carrossel no Instagram." };
        const published = await publishResponse.json() as { id: string };
        return { success: true, providerPostId: published.id };
      }

      const containerResponse = await fetch(`${GRAPH_API}/${platformId}/media`, { method: "POST", body: params });
      if (!containerResponse.ok) {
        const error = await containerResponse.json().catch(() => ({}));
        return { success: false, error: error?.error?.message || "Falha ao criar container de mídia no Instagram." };
      }
      const { id: creationId } = await containerResponse.json() as { id: string };

      const ready = await this.waitForContainerReady(creationId, accessToken);
      if (!ready.success) return ready;

      const publishResponse = await fetch(`${GRAPH_API}/${platformId}/media_publish`, {
        method: "POST",
        body: new URLSearchParams({ creation_id: creationId, access_token: accessToken }),
      });
      if (!publishResponse.ok) return { success: false, error: "Falha ao publicar no Instagram." };
      const data = await publishResponse.json() as { id: string };
      return { success: true, providerPostId: data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido ao publicar no Instagram." };
    }
  }

  private async waitForContainerReady(creationId: string, accessToken: string): Promise<PublishResult> {
    const maxAttempts = 24; // Esperar até 60 segundos (24 * 2.5s)
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const response = await fetch(`${GRAPH_API}/${creationId}?${new URLSearchParams({
        fields: "status_code,status",
        access_token: accessToken,
      })}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { success: false, error: error?.error?.message || "Falha ao verificar o status do container do Instagram." };
      }

      const data = await response.json() as { status_code?: string; status?: string };
      const status = data.status_code || data.status;
      if (status === "FINISHED") return { success: true };
      if (status === "ERROR") {
        console.error("[INSTAGRAM REEL/CAROUSEL ERROR] Meta rejeitou a mídia. Resposta da API:", JSON.stringify(data, null, 2));
        return { success: false, error: "O Instagram rejeitou o container de mídia." };
      }

      await new Promise((resolve) => setTimeout(resolve, 2500));
    }

    return { success: false, error: "O container do Instagram demorou para ficar pronto. A mídia pode ainda estar sendo processada pela Meta." };
  }

  async getAnalytics(accessToken: string, platformId: string): Promise<AnalyticsSnapshot> {
    const warnings: string[] = [];

    const [accountResponse, mediaResponse] = await Promise.all([
      fetch(`${GRAPH_API}/${platformId}?${new URLSearchParams({
        fields: "followers_count,media_count,username,name",
        access_token: accessToken,
      })}`),
      fetch(`${GRAPH_API}/${platformId}/media?${new URLSearchParams({
        fields: "like_count,comments_count",
        limit: "10",
        access_token: accessToken,
      })}`),
    ]);

    if (!accountResponse.ok) {
      const errorData = await accountResponse.json().catch(() => ({}));
      console.error("[INSTAGRAM ANALYTICS ERROR]", errorData);
      warnings.push("Instagram não retornou dados da conta.");
      return { followers: 0, impressions: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0, warnings };
    }

    const accountData = (await accountResponse.json()) as { followers_count?: number };
    const mediaData = mediaResponse.ok
      ? (await mediaResponse.json()) as { data?: Array<{ like_count?: number; comments_count?: number }> }
      : {};
    if (!mediaResponse.ok) warnings.push("Instagram não retornou métricas de mídia.");
    const mediaItems = mediaData.data ?? [];

    let insightsData: { data?: InstagramInsight[] } = {};
    const [reachInsights, totalInsights, profileViewInsights] = await Promise.all([
      this.getInsightMetrics(accessToken, platformId, "reach"),
      this.getInsightMetrics(accessToken, platformId, "views,accounts_engaged,total_interactions,likes,comments,shares,saves", { metric_type: "total_value" }),
      this.getInsightMetrics(accessToken, platformId, "profile_views", { metric_type: "total_value" }),
    ]);

    if (reachInsights.ok) {
      insightsData.data = [...(insightsData.data ?? []), ...reachInsights.data];
    } else if (reachInsights.code !== 10) {
      warnings.push(reachInsights.message || "Instagram nao retornou alcance para esta conta.");
    }

    if (totalInsights.ok) {
      insightsData.data = [...(insightsData.data ?? []), ...totalInsights.data];
    } else if (totalInsights.code !== 10) {
      warnings.push(totalInsights.message || "Instagram nao retornou totais para esta conta.");
    }

    if (profileViewInsights.ok) {
      insightsData.data = [...(insightsData.data ?? []), ...profileViewInsights.data];
    } else if (profileViewInsights.code !== 10) {
      warnings.push(profileViewInsights.message || "Instagram nao retornou visualizacoes de perfil.");
    }

    const byName = new Map((insightsData.data ?? []).map((item) => [item.name, item.total_value?.value ?? item.values?.[0]?.value ?? 0]));
    const impressions = byName.get("views") ?? 0;
    const reach = byName.get("reach") ?? 0;
    const mediaLikes = mediaItems.reduce((sum, media) => sum + (media.like_count ?? 0), 0);
    const mediaComments = mediaItems.reduce((sum, media) => sum + (media.comments_count ?? 0), 0);
    const likes = byName.get("likes") ?? mediaLikes;
    const comments = byName.get("comments") ?? mediaComments;
    const shares = byName.get("shares") ?? 0;
    const saves = byName.get("saves") ?? 0;
    const engagement = Math.max(byName.get("total_interactions") ?? 0, byName.get("accounts_engaged") ?? 0, likes + comments + shares + saves);

    return {
      followers: accountData.followers_count ?? 0,
      impressions,
      reach,
      engagement,
      likes,
      comments,
      shares,
      warnings,
    };
  }

  async verifyHealth(accessToken: string) {
    const response = await fetch(`${GRAPH_API}/me?${new URLSearchParams({ access_token: accessToken })}`);
    return response.ok;
  }
}
