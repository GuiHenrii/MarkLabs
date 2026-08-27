import { Platform } from "@marklabs/database";
import { AnalyticsSnapshot, PublishInput, PublishResult, SocialProvider } from "./index";

const GRAPH_API = "https://graph.facebook.com/v25.0";

type GraphError = { error?: { code?: number; message?: string } };
type InsightValue = number | Record<string, number> | undefined;

export class FacebookProvider implements SocialProvider {
  platform = Platform.FACEBOOK;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly loginConfigId?: string
  ) {}

  private getErrorDetails(errorData: unknown) {
    const error = errorData as GraphError | undefined;
    return {
      code: error?.error?.code,
      message: error?.error?.message,
    };
  }

  private async readJsonWithRetry<T>(url: string, retryMessage: string): Promise<{ response: Response; data: T & GraphError }> {
    const fetchOnce = async () => {
      const response = await fetch(url);
      const data = (await response.json().catch(() => ({}))) as T & GraphError;
      return { response, data };
    };

    const first = await fetchOnce();
    if (first.response.ok) return first;

    if (first.data?.error?.code === 4) {
      throw new Error(`META_RATE_LIMIT:${first.data?.error?.message || retryMessage}`);
    }

    throw new Error(first.data?.error?.message || retryMessage);
  }

  private async getPageAccessToken(platformId: string, accessToken: string) {
    const directResponse = await fetch(
      `${GRAPH_API}/${platformId}?${new URLSearchParams({
        fields: "id",
        access_token: accessToken,
      })}`
    );

    if (directResponse.ok) {
      const directPage = (await directResponse.json()) as { id?: string };
      if (directPage.id === platformId) return accessToken;
    }

    const pagesResponse = await fetch(
      `${GRAPH_API}/me/accounts?${new URLSearchParams({
        fields: "id,access_token",
        limit: "100",
        access_token: accessToken,
      })}`
    );

    if (!pagesResponse.ok) return null;

    const pagesData = (await pagesResponse.json()) as { data?: Array<{ id: string; access_token?: string }> };
    return pagesData.data?.find((page) => page.id === platformId)?.access_token ?? null;
  }

  private sumInsightValues(values?: Array<{ value?: InsightValue }>) {
    return (values ?? []).reduce((sum, entry) => {
      if (typeof entry.value === "number") return sum + entry.value;
      if (entry.value && typeof entry.value === "object") {
        return sum + Object.values(entry.value).reduce((nestedSum, value) => nestedSum + (Number(value) || 0), 0);
      }
      return sum;
    }, 0);
  }

  private async getInsightMetric(platformId: string, pageAccessToken: string, metric: string, periodParams: Record<string, string>) {
    const response = await fetch(
      `${GRAPH_API}/${platformId}/insights?${new URLSearchParams({
        metric,
        period: "day",
        ...periodParams,
        access_token: pageAccessToken,
      })}`
    );
    const data = (await response.json().catch(() => ({}))) as GraphError & {
      data?: Array<{ name: string; values?: Array<{ value?: InsightValue }> }>;
    };

    if (!response.ok) {
      return { ok: false as const, metric, value: 0, message: this.getErrorDetails(data).message };
    }

    return { ok: true as const, metric, value: this.sumInsightValues(data.data?.[0]?.values) };
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
      params.set("scope", "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_manage_posts,pages_read_user_content,read_insights");
      params.set("response_type", "code");
      params.set("return_scopes", "true");
    }

    return `https://www.facebook.com/v25.0/dialog/oauth?${params}`;
  }

  async exchangeCode(code: string, redirectUri: string) {
    const tokenResponse = await fetch(
      `${GRAPH_API}/oauth/access_token?${new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        code,
      })}`
    );
    if (!tokenResponse.ok) throw new Error("Não foi possível trocar o código OAuth do Facebook.");
    const token = (await tokenResponse.json()) as { access_token: string; expires_in?: number };

    const allPages: Array<{ id: string; name: string; access_token: string; picture?: { data?: { url?: string } } }> = [];

    const pagesUrl = `${GRAPH_API}/me/accounts?${new URLSearchParams({
      fields: "id,name,access_token,picture",
      limit: "100",
      access_token: token.access_token,
    })}`;
    const pagesResult = await this.readJsonWithRetry<{ data?: Array<{ id: string; name: string; access_token: string; picture?: { data?: { url?: string } } }> }>(
      pagesUrl,
      "Não foi possível listar as páginas vinculadas ao Facebook."
    );
    if (pagesResult.data.data) {
      allPages.push(...pagesResult.data.data);
    }

    const uniquePages = Array.from(new Map(allPages.map((p) => [p.id, p])).values());

    if (uniquePages.length === 0) {
      throw new Error(
        "Nenhuma Página do Facebook foi encontrada para esta conta. Verifique se o usuário tem acesso à Página e se o app recebeu pages_show_list e pages_read_engagement."
      );
    }

    return uniquePages.map((page) => ({
      accessToken: page.access_token || token.access_token,
      refreshToken: token.access_token,
      platformId: page.id,
      name: page.name,
      username: undefined,
      avatar: page.picture?.data?.url,
      tokenExpiry: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined,
    }));
  }

  async publish(accessToken: string, platformId: string, input: PublishInput): Promise<PublishResult> {
    const response = await fetch(`${GRAPH_API}/${platformId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ message: input.content, access_token: accessToken }),
    });
    if (!response.ok) return { success: false, error: "O Facebook recusou a publicação." };
    const data = (await response.json()) as { id?: string };
    return data.id ? { success: true, providerPostId: data.id } : { success: false, error: "Resposta inválida do Facebook." };
  }

  async getAnalytics(accessToken: string, platformId: string, since?: Date): Promise<AnalyticsSnapshot> {
    const warnings: string[] = [];
    const pageAccessToken = await this.getPageAccessToken(platformId, accessToken);

    if (!pageAccessToken) {
      return {
        followers: 0,
        impressions: 0,
        reach: 0,
        engagement: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        warnings: [
          "Não foi possível obter um Page Access Token para esta conta do Facebook. Reconecte a página com permissão pages_read_engagement.",
        ],
      };
    }

    const periodParams = {
      since: Math.floor((since ?? new Date(Date.now() - 30 * 86_400_000)).getTime() / 1000).toString(),
      until: Math.floor(Date.now() / 1000).toString(),
    };

    const [pageResponse, postsResponse, ...insightResults] = await Promise.all([
      fetch(
        `${GRAPH_API}/${platformId}?${new URLSearchParams({
          fields: "followers_count",
          access_token: pageAccessToken,
        })}`
      ),
      fetch(
        `${GRAPH_API}/${platformId}/posts?${new URLSearchParams({
          fields: "shares,comments.limit(0).summary(true),reactions.limit(0).summary(true)",
          limit: "100",
          ...periodParams,
          access_token: pageAccessToken,
        })}`
      ),
      this.getInsightMetric(platformId, pageAccessToken, "page_media_view", periodParams),
      this.getInsightMetric(platformId, pageAccessToken, "page_total_media_view_unique", periodParams),
      this.getInsightMetric(platformId, pageAccessToken, "page_views_total", periodParams),
      this.getInsightMetric(platformId, pageAccessToken, "page_post_engagements", periodParams),
      this.getInsightMetric(platformId, pageAccessToken, "page_follows", periodParams),
      this.getInsightMetric(platformId, pageAccessToken, "page_daily_follows", periodParams),
    ]);

    if (!pageResponse.ok) {
      const errorData = await pageResponse.json().catch(() => ({}));
      console.error("[FACEBOOK PAGE ERROR]", errorData);
      warnings.push("Facebook não retornou followers_count da página.");
    }

    for (const result of insightResults) {
      if (result.ok) continue;
      warnings.push(`Facebook nao retornou ${result.metric}: ${result.message ?? "resposta invalida"}.`);
    }

    if (!postsResponse.ok) {
      const errorData = await postsResponse.json().catch(() => ({}));
      const { message } = this.getErrorDetails(errorData);
      if (!message?.includes("pages_read_user_content")) {
        warnings.push(`Facebook nao retornou interacoes dos posts: ${message ?? "resposta invalida"}.`);
      }
    }

    const pageData = pageResponse.ok ? ((await pageResponse.json()) as { followers_count?: number }) : {};
    const postsData = postsResponse.ok
      ? ((await postsResponse.json()) as {
          data?: Array<{
            shares?: { count?: number };
            comments?: { summary?: { total_count?: number } };
            reactions?: { summary?: { total_count?: number } };
          }>;
        })
      : {};
    const byName = new Map(insightResults.filter((result) => result.ok).map((result) => [result.metric, result.value]));
    const followers = pageData.followers_count ?? 0;
    const impressions = Math.max(byName.get("page_media_view") ?? 0, byName.get("page_views_total") ?? 0);
    const postTotals = (postsData.data ?? []).reduce(
      (total, post) => ({
        likes: total.likes + (post.reactions?.summary?.total_count ?? 0),
        comments: total.comments + (post.comments?.summary?.total_count ?? 0),
        shares: total.shares + (post.shares?.count ?? 0),
      }),
      { likes: 0, comments: 0, shares: 0 }
    );
    const interactionTotal = postTotals.likes + postTotals.comments + postTotals.shares;
    const engagement = Math.max(byName.get("page_post_engagements") ?? 0, interactionTotal);
    const reach = Math.max(byName.get("page_total_media_view_unique") ?? 0, impressions);

    return { followers, impressions, reach, engagement, likes: postTotals.likes, comments: postTotals.comments, shares: postTotals.shares, warnings };
  }

  async verifyHealth(accessToken: string) {
    const response = await fetch(`${GRAPH_API}/me?${new URLSearchParams({ access_token: accessToken })}`);
    return response.ok;
  }
}
