import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Platform, prisma } from "@marklabs/database";
import { FacebookProvider, InstagramProvider, LinkedInProvider } from "@marklabs/social";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";

const OAUTH_COOKIE = "marklabs_oauth_state";

async function getMetaPermissions(accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v25.0/me/permissions?${new URLSearchParams({
      access_token: accessToken,
    })}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData?.error?.code === 4) return null;
    return [];
  }

  const data = (await response.json()) as {
    data?: Array<{ permission?: string; status?: string }>;
  };

  return data.data ?? [];
}

function hasPermission(
  permissions: Array<{ permission?: string; status?: string }>,
  permissionName: string
) {
  return permissions.some(
    (permission) => permission.permission === permissionName && permission.status === "granted"
  );
}

function grantedPermissions(permissions: Array<{ permission?: string; status?: string }>) {
  return permissions
    .filter((permission) => permission.status === "granted" && permission.permission)
    .map((permission) => permission.permission)
    .sort();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const oauthErrorReason = url.searchParams.get("error_reason");
  const cookie = (await cookies()).get(OAUTH_COOKIE)?.value;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || url.origin;
  const fail = (reason: string) => NextResponse.redirect(new URL(`/accounts?error=${encodeURIComponent(reason)}`, baseUrl));

  if (oauthError) {
    return fail(oauthErrorReason === "user_denied" ? "oauth_cancelled" : `meta_${oauthError}`);
  }

  if (!code || !state || !cookie) {
    return fail("oauth_failed");
  }

  try {
    const saved = JSON.parse(cookie) as { state: string; teamId: string; platform: string; expiresAt: number };
    if (saved.state !== state || saved.expiresAt < Date.now()) return fail("oauth_state_invalid");

    await requireTeamAccess(saved.teamId, "settings:manage");

    let accounts: Array<{
      accessToken: string;
      refreshToken?: string;
      tokenExpiry?: Date;
      platformId: string;
      name: string;
      username?: string;
      avatar?: string;
    }> = [];
    const platform = saved.platform as Platform;

    if (saved.platform === "FACEBOOK" || saved.platform === "INSTAGRAM") {
      const appId = process.env.META_APP_ID;
      const appSecret = process.env.META_APP_SECRET;
      if (!appId || !appSecret) return fail("meta_not_configured");

      const provider =
        saved.platform === "FACEBOOK" ? new FacebookProvider(appId, appSecret) : new InstagramProvider(appId, appSecret);

      accounts = await provider.exchangeCode(code, `${process.env.NEXTAUTH_URL || url.origin}/api/social/callback`);

      try {
        if (accounts.length > 0) {
          const permissions = await getMetaPermissions(accounts[0].accessToken);
          if (permissions) {
            if (saved.platform === "INSTAGRAM" && !hasPermission(permissions, "instagram_basic")) {
              return fail("instagram_missing_basic_permission");
            }

            if (saved.platform === "INSTAGRAM" && !hasPermission(permissions, "pages_read_engagement")) {
            }

            if (saved.platform === "INSTAGRAM") {
              const hasInsightsAccess =
                hasPermission(permissions, "instagram_manage_insights") || hasPermission(permissions, "pages_read_engagement");
            }
          }
        }
      } catch (debugError) {
      }
    } else if (saved.platform === "LINKEDIN") {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      if (!clientId || !clientSecret) return fail("linkedin_not_configured");
      accounts = await new LinkedInProvider(clientId, clientSecret).exchangeCode(code, `${process.env.NEXTAUTH_URL || url.origin}/api/social/callback`);
    } else {
      return fail("unsupported_platform");
    }

    if (!accounts || accounts.length === 0) {
      return fail("oauth_failed");
    }

    for (const account of accounts) {
      await prisma.socialAccount.upsert({
        where: { teamId_platform_platformId: { teamId: saved.teamId, platform, platformId: account.platformId } },
        update: {
          name: account.name,
          username: account.username ?? null,
          avatar: account.avatar ?? null,
          accessToken: account.accessToken as string,
          refreshToken: account.refreshToken ?? null,
          tokenExpiry: account.tokenExpiry ?? null,
          isActive: true,
        },
        create: {
          teamId: saved.teamId,
          platform,
          platformId: account.platformId,
          name: account.name,
          username: account.username ?? null,
          avatar: account.avatar ?? null,
          accessToken: account.accessToken as string,
          refreshToken: account.refreshToken ?? null,
          tokenExpiry: account.tokenExpiry ?? null,
        },
      });
    }

    const response = NextResponse.redirect(new URL("/accounts?connected=true", baseUrl));
    response.cookies.delete(OAUTH_COOKIE);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("META_RATE_LIMIT:")) {
      return fail("facebook_rate_limited");
    }
    const result = apiErrorResponse(error);
    return fail(result.status === 403 ? "oauth_forbidden" : "oauth_failed");
  }
}
