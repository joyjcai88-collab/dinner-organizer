import { NextRequest } from "next/server";

/**
 * Redirect back into the app. Built by hand rather than with
 * Response.redirect(), whose headers are immutable and would throw when the
 * session cookies are attached.
 */
function backToApp(request: NextRequest, query: string, cookies: string[] = []) {
  const headers = new Headers({
    Location: new URL(`/app?${query}`, request.nextUrl.origin).toString(),
  });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("linkedin_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return backToApp(request, "linkedin_error=invalid_state");
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return backToApp(request, "linkedin_error=not_configured");
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
    return backToApp(request, "linkedin_error=token_failed");
  }

  const tokenData = await tokenResp.json();
  const accessToken = tokenData.access_token;

  const profileResp = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileResp.ok) {
    return backToApp(request, "linkedin_error=profile_failed");
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

  return backToApp(request, "linkedin_connected=true", [
    `linkedin_profile=${linkedinData}; Path=/; SameSite=Lax; Max-Age=86400`,
    `linkedin_oauth_state=; Path=/; HttpOnly; Max-Age=0`,
  ]);
}
