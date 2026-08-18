import { Platform } from "@marklabs/database";
import { AnalyticsSnapshot, PublishResult, SocialProvider } from "./index";

export class LinkedInProvider implements SocialProvider {
  platform = Platform.LINKEDIN;

  constructor(private readonly clientId: string, private readonly clientSecret: string) {}

  getAuthUrl(redirectUri: string, state: string) {
    return `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state,
      scope: "w_member_social r_liteprofile",
    })}`;
  }

  async exchangeCode(code: string, redirectUri: string) {
    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) throw new Error("Não foi possível trocar o código OAuth do LinkedIn.");
    const token = await response.json() as { access_token: string; expires_in: number };

    // Obter perfil básico
    const profileResponse = await fetch("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!profileResponse.ok) throw new Error("Não foi possível obter dados do LinkedIn.");
    const profile = await profileResponse.json() as { id: string; localizedFirstName: string; localizedLastName: string };

    return {
      accessToken: token.access_token,
      platformId: profile.id,
      name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
      username: undefined,
      avatar: undefined,
      tokenExpiry: new Date(Date.now() + token.expires_in * 1000),
    };
  }

  async publish(accessToken: string, platformId: string, content: string, mediaUrls?: string[]): Promise<PublishResult> {
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: `urn:li:person:${platformId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: content },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });

    if (!response.ok) return { success: false, error: "O LinkedIn recusou a publicação." };
    const data = await response.json() as { id: string };
    return { success: true, providerPostId: data.id };
  }

  async getAnalytics(accessToken: string, platformId: string): Promise<AnalyticsSnapshot> {
    return { followers: 0, impressions: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0 };
  }

  async verifyHealth(accessToken: string) {
    const response = await fetch("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.ok;
  }
}
