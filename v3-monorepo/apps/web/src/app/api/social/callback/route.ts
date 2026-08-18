import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Platform, prisma } from "@marklabs/database";
import { FacebookProvider, InstagramProvider, LinkedInProvider } from "@marklabs/social";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";

const OAUTH_COOKIE = "marklabs_oauth_state";

async function getMetaPermissions(accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v20.0/me/permissions?${new URLSearchParams({
      access_token: accessToken,
    })}`
  );

  if (!response.ok) return [];

  const data = (await response.json()) as {
    data?: Array<{ permission?: string; status?: string }>;
  };

  return data.data ?? [];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = (await cookies()).get(OAUTH_COOKIE)?.value;
  console.log("[DEBUG] Callback params:", { code: !!code, state: !!state, cookie: !!cookie });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || url.origin;
  const fail = (reason: string) => NextResponse.redirect(new URL(`/accounts?error=${encodeURIComponent(reason)}`, baseUrl));
  if (!code || !state || !cookie) {
    console.error("[DEBUG] Missing required OAuth params:", { code, state, cookie });
    return fail("oauth_failed");
  }
  try {
    const saved = JSON.parse(cookie) as { state: string; teamId: string; platform: string; expiresAt: number };
    if (saved.state !== state || saved.expiresAt < Date.now()) return fail("oauth_state_invalid");
    await requireTeamAccess(saved.teamId, "settings:manage");
    
    let account;
    let platform = saved.platform as Platform;

    if (saved.platform === "FACEBOOK" || saved.platform === "INSTAGRAM") {
      const appId = process.env.META_APP_ID;
      const appSecret = process.env.META_APP_SECRET;
      if (!appId || !appSecret) return fail("meta_not_configured");
      
      const provider = saved.platform === "FACEBOOK" 
        ? new FacebookProvider(appId, appSecret)
        : new InstagramProvider(appId, appSecret);
        
      account = await provider.exchangeCode(code, `${process.env.NEXTAUTH_URL || url.origin}/api/social/callback`);

      try {
        const permissions = await getMetaPermissions(account.accessToken);
        console.log(`[META CALLBACK] ${saved.platform} permissions:`, permissions);

        if (
          saved.platform === "FACEBOOK" &&
          !permissions.some((permission) => permission.permission === "pages_read_engagement" && permission.status === "granted")
        ) {
          return fail("facebook_missing_pages_read_engagement");
        }
      } catch (debugError) {
        console.error("[META CALLBACK] Failed to inspect permissions:", debugError);
      }
    } else if (saved.platform === "LINKEDIN") {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      if (!clientId || !clientSecret) return fail("linkedin_not_configured");
      account = await new LinkedInProvider(clientId, clientSecret).exchangeCode(code, `${process.env.NEXTAUTH_URL || url.origin}/api/social/callback`);
    } else {
      return fail("unsupported_platform");
    }

    if (!account || !account.accessToken) {
      console.error("[CALLBACK ERROR] Account or Access Token is missing:", account);
      return fail("oauth_failed");
    }

    await prisma.socialAccount.upsert({
      where: { teamId_platform_platformId: { teamId: saved.teamId, platform, platformId: account.platformId } },
      update: { 
        name: account.name, 
        username: account.username ?? null, 
        avatar: account.avatar ?? null, 
        accessToken: account.accessToken as string, 
        tokenExpiry: account.tokenExpiry ?? null, 
        isActive: true 
      },
      create: { 
        teamId: saved.teamId, 
        platform, 
        platformId: account.platformId, 
        name: account.name, 
        username: account.username ?? null, 
        avatar: account.avatar ?? null, 
        accessToken: account.accessToken as string, 
        tokenExpiry: account.tokenExpiry ?? null 
      },
    });
    const response = NextResponse.redirect(new URL("/accounts?connected=true", baseUrl));
    response.cookies.delete(OAUTH_COOKIE);
    return response;
  } catch (error) {
    console.error("[CALLBACK ERROR]", error);
    const result = apiErrorResponse(error);
    return fail(result.status === 403 ? "oauth_forbidden" : "oauth_failed");
  }
}
