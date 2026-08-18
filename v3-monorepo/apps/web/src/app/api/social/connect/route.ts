import crypto from "crypto";
import { NextResponse } from "next/server";
import { FacebookProvider, LinkedInProvider, InstagramProvider } from "@marklabs/social";
import { apiErrorResponse, requireTeamAccess } from "@/lib/authorization";

const OAUTH_COOKIE = "marklabs_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform");
  const teamId = url.searchParams.get("teamId");
  
  if (!platform || !teamId) return NextResponse.json({ error: "Parâmetros ausentes." }, { status: 400 });

  try {
    await requireTeamAccess(teamId, "settings:manage");
    const state = crypto.randomBytes(32).toString("base64url");
    const redirectUri = `${process.env.NEXTAUTH_URL || url.origin}/api/social/callback`;
    
    let authUrl = "";
    
    if (platform === "FACEBOOK") {
      const appId = process.env.META_APP_ID;
      const appSecret = process.env.META_APP_SECRET;
      if (!appId || !appSecret) return NextResponse.json({ error: "Integração Meta não configurada." }, { status: 503 });
      authUrl = new FacebookProvider(appId, appSecret).getAuthUrl(redirectUri, state);
    } else if (platform === "INSTAGRAM") {
      const appId = process.env.META_APP_ID;
      const appSecret = process.env.META_APP_SECRET;
      if (!appId || !appSecret) return NextResponse.json({ error: "Integração Meta não configurada." }, { status: 503 });
      authUrl = new InstagramProvider(appId, appSecret).getAuthUrl(redirectUri, state);
    } else if (platform === "LINKEDIN") {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      if (!clientId || !clientSecret) return NextResponse.json({ error: "Integração LinkedIn não configurada." }, { status: 503 });
      authUrl = new LinkedInProvider(clientId, clientSecret).getAuthUrl(redirectUri, state);
    } else {
      return NextResponse.json({ error: `Plataforma ${platform} não suportada.` }, { status: 400 });
    }

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, teamId, platform, expiresAt: Date.now() + 10 * 60_000 }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/social", maxAge: 600 });
    return response;
  } catch (error) {
    const result = apiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
