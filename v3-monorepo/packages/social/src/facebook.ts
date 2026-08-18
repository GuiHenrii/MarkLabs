import { Platform } from "@marklabs/database";
import { AnalyticsSnapshot, PublishInput, PublishResult, SocialProvider } from "./index";

const GRAPH_API = "https://graph.facebook.com/v20.0";

export class FacebookProvider implements SocialProvider {
  platform = Platform.FACEBOOK;
  constructor(private readonly clientId: string, private readonly clientSecret: string) {}

  private isPermissionError(errorData: unknown) {
    const error = errorData as { error?: { code?: number; message?: string } } | undefined;
    return error?.error?.code === 100 && !!error.error.message?.includes("pages_read_engagement");
  }

  private async canReadPageInsights(accessToken: string) {
    const permissionsResponse = await fetch(
      `${GRAPH_API}/me/permissions?${new URLSearchParams({ access_token: accessToken })}`
    );

    if (!permissionsResponse.ok) return false;

    const permissionsData = (await permissionsResponse.json()) as {
      data?: Array<{ permission?: string; status?: string }>;
    };

    return (
      permissionsData.data?.some(
        (permission) => permission.permission === "pages_read_engagement" && permission.status === "granted"
      ) ?? false
    );
  }

  private async getPageAccessToken(platformId: string, accessToken: string) {
    // If we already have a page token, Meta will usually return the page node directly.
    const directPageResponse = await fetch(
      `${GRAPH_API}/${platformId}?${new URLSearchParams({
        fields: "access_token",
        access_token: accessToken,
      })}`
    );

    if (directPageResponse.ok) {
      const directPageData = (await directPageResponse.json()) as { access_token?: string };
      if (directPageData.access_token) return directPageData.access_token;
    }

    // Fallback: resolve the page token from the user's connected pages list.
    const pagesResponse = await fetch(
      `${GRAPH_API}/me/accounts?${new URLSearchParams({
        fields: "id,access_token",
        access_token: accessToken,
      })}`
    );

    if (!pagesResponse.ok) return accessToken;

    const pagesData = (await pagesResponse.json()) as { data?: Array<{ id: string; access_token?: string }> };
    return pagesData.data?.find((page) => page.id === platformId)?.access_token ?? accessToken;
  }

  getAuthUrl(redirectUri: string, state: string) {
    return `https://www.facebook.com/v20.0/dialog/oauth?${new URLSearchParams({ 
      client_id: this.clientId, 
      redirect_uri: redirectUri, 
      state, 
      scope: "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_manage_posts,business_management", 
      response_type: "code",
      auth_type: "rerequest",
      return_scopes: "true",
    })}`;
  }

  async exchangeCode(code: string, redirectUri: string) {
    const tokenResponse = await fetch(`${GRAPH_API}/oauth/access_token?${new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret, redirect_uri: redirectUri, code })}`);
    if (!tokenResponse.ok) throw new Error("Não foi possível trocar o código OAuth do Facebook.");
    const token = await tokenResponse.json() as { access_token: string; expires_in?: number };

    // DEBUG: Verificar as permissões reais do Token concedido
    try {
      const permsResponse = await fetch(`${GRAPH_API}/me/permissions?access_token=${token.access_token}`);
      const permsText = await permsResponse.text();
      console.log("[FACEBOOK DEBUG] Permissões concedidas pelo Token:", permsText);

      const meResponse = await fetch(`${GRAPH_API}/me?fields=id,name,email&access_token=${token.access_token}`);
      console.log("[FACEBOOK DEBUG] Dados do Usuário (/me):", await meResponse.text());
    } catch (e) {
      console.error("[FACEBOOK DEBUG] Erro ao buscar dados de depuração:", e);
    }

    // Try personal pages first
    const pagesResponse = await fetch(`${GRAPH_API}/me/accounts?${new URLSearchParams({ fields: "id,name,access_token,picture", access_token: token.access_token })}`);
    const pagesText = await pagesResponse.text();
    console.log("[FACEBOOK DEBUG] /me/accounts status:", pagesResponse.status, "body:", pagesText);
    const pages = JSON.parse(pagesText) as { data?: Array<{ id: string; name: string; access_token: string; picture?: { data?: { url?: string } } }> };
    let page = pages.data?.[0];

    // If no personal pages, try Business Manager pages
    if (!page) {
      console.log("[FACEBOOK DEBUG] No personal pages found, trying Business API...");
      const bizResponse = await fetch(`${GRAPH_API}/me/businesses?${new URLSearchParams({ access_token: token.access_token })}`);
      const bizText = await bizResponse.text();
      console.log("[FACEBOOK DEBUG] businesses raw response:", bizText);
      const bizData = JSON.parse(bizText) as { data?: Array<{ id: string; name: string }> };
      const business = bizData.data?.[0];
      
      if (business) {
        // Try owned_pages first, then client_pages (for agency accounts)
        for (const edge of ["owned_pages", "client_pages"]) {
          console.log(`[FACEBOOK DEBUG] Trying edge: ${edge} for business: ${business.id}`);
          const bizPagesResponse = await fetch(`${GRAPH_API}/${business.id}/${edge}?${new URLSearchParams({ fields: "id,name,access_token,picture", access_token: token.access_token })}`);
          const bizPagesText = await bizPagesResponse.text();
          console.log(`[FACEBOOK DEBUG] Response for ${edge}:`, bizPagesText);
          const bizPagesData = JSON.parse(bizPagesText) as { data?: Array<{ id: string; name: string; access_token: string; picture?: { data?: { url?: string } } }> };
          if (bizPagesData.data && bizPagesData.data.length > 0) {
            const bizPage = bizPagesData.data[0];
            if (bizPage) {
              page = {
                id: bizPage.id,
                name: bizPage.name,
                access_token: bizPage.access_token || token.access_token,
                picture: bizPage.picture
              };
              break;
            }
          }
        }
      } else {
        console.log("[FACEBOOK DEBUG] No businesses found for this user.");
      }
    }

    if (!page) {
      console.log("[FACEBOOK DEBUG] Nenhuma página encontrada. Usando perfil pessoal como fallback.");
      const meResponse = await fetch(`${GRAPH_API}/me?${new URLSearchParams({ fields: "id,name,picture", access_token: token.access_token })}`);
      const meData = await meResponse.json() as { id: string; name: string; picture?: { data?: { url?: string } } };
      return { 
        accessToken: token.access_token, 
        platformId: meData.id, 
        name: meData.name, 
        username: undefined, 
        avatar: meData.picture?.data?.url, 
        tokenExpiry: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined 
      };
    }
    return { accessToken: page.access_token, platformId: page.id, name: page.name, username: undefined, avatar: page.picture?.data?.url, tokenExpiry: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined };
  }

  async publish(accessToken: string, platformId: string, input: PublishInput): Promise<PublishResult> {
    const response = await fetch(`${GRAPH_API}/${platformId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ message: input.content, access_token: accessToken }),
    });
    if (!response.ok) return { success: false, error: "O Facebook recusou a publicação." };
    const data = await response.json() as { id?: string };
    return data.id ? { success: true, providerPostId: data.id } : { success: false, error: "Resposta inválida do Facebook." };
  }

  async getAnalytics(accessToken: string, platformId: string): Promise<AnalyticsSnapshot> {
    const pageAccessToken = await this.getPageAccessToken(platformId, accessToken);

    const canReadInsights = await this.canReadPageInsights(accessToken);
    if (!canReadInsights) {
      console.warn(
        `[FACEBOOK ANALYTICS] Missing pages_read_engagement for platformId=${platformId}. Returning empty snapshot.`
      );
      return { followers: 0, impressions: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0 };
    }
    
    const [insightsResponse, postsResponse] = await Promise.all([
      fetch(
        `${GRAPH_API}/${platformId}/insights?${new URLSearchParams({
          metric: "page_fans,page_impressions,page_post_engagements,page_impressions_unique",
          access_token: pageAccessToken,
        })}`
      ),
      fetch(
        `${GRAPH_API}/${platformId}/posts?${new URLSearchParams({
          fields: "insights.metric(post_impressions,post_impressions_unique,post_engaged_users)",
          access_token: pageAccessToken,
          limit: "10",
        })}`
      ),
    ]);

    if (!insightsResponse.ok) {
      const errorData = await insightsResponse.json().catch(() => ({}));
      if (!this.isPermissionError(errorData)) {
        console.error("[FACEBOOK ANALYTICS ERROR]", errorData);
      }
      return { followers: 0, impressions: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0 };
    }

    const insightsData = (await insightsResponse.json()) as { data?: Array<{ name: string; values?: Array<{ value: number }> }> };
    const postsData = postsResponse.ok ? (await postsResponse.json()) as { data?: Array<{ insights?: { data?: Array<{ name: string; values?: Array<{ value: number }> }> } }> } : {};

    const byName = new Map((insightsData.data ?? []).map((item) => [item.name, item.values?.[0]?.value ?? 0]));
    const followers = byName.get("page_fans") ?? 0;
    const impressions = byName.get("page_impressions") ?? 0;
    const reach = byName.get("page_impressions_unique") ?? 0;
    const engagement = byName.get("page_post_engagements") ?? 0;

    const postMetrics = (postsData.data ?? []).flatMap((post) => post.insights?.data ?? []);
    const likes = postMetrics.find((metric) => metric.name === "post_impressions_unique")?.values?.[0]?.value ?? 0;
    const comments = postMetrics.find((metric) => metric.name === "post_engaged_users")?.values?.[0]?.value ?? 0;

    return { followers, impressions, reach, engagement, likes, comments, shares: 0 };
  }

  async verifyHealth(accessToken: string) {
    const response = await fetch(`${GRAPH_API}/me?${new URLSearchParams({ access_token: accessToken })}`);
    return response.ok;
  }
}
