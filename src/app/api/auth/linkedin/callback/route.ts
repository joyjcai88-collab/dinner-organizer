import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("linkedin_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return Response.redirect(new URL("/?linkedin_error=invalid_state", request.nextUrl.origin));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return Response.redirect(new URL("/?linkedin_error=not_configured", request.nextUrl.origin));
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/linkedin/callback`;

  const tokenResp = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenResp.ok) {
    return Response.redirect(new URL("/?linkedin_error=token_failed", request.nextUrl.origin));
  }

  const tokenData = await tokenResp.json();
  const accessToken = tokenData.access_token;

  const profileResp = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileResp.ok) {
    return Response.redirect(new URL("/?linkedin_error=profile_failed", request.nextUrl.origin));
  }

  const profile = await profileResp.json();

  const linkedinData = encodeURIComponent(
    JSON.stringify({
      name: profile.name || "",
      firstName: profile.given_name || "",
      lastName: profile.family_name || "",
      email: profile.email || "",
      picture: profile.picture || "",
      sub: profile.sub || "",
    })
  );

  const response = Response.redirect(
    new URL(`/?linkedin_connected=true`, request.nextUrl.origin)
  );

  response.headers.append(
    "Set-Cookie",
    `linkedin_profile=${linkedinData}; Path=/; SameSite=Lax; Max-Age=86400`
  );
  response.headers.append(
    "Set-Cookie",
    `linkedin_oauth_state=; Path=/; HttpOnly; Max-Age=0`
  );

  return response;
}
