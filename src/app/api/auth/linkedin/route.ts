import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: "LinkedIn not configured" }, { status: 500 });
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/linkedin/callback`;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile email",
  });

  // Build the 302 by hand: Response.redirect() returns immutable headers, so
  // setting the state cookie on it throws TypeError: immutable.
  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://www.linkedin.com/oauth/v2/authorization?${params}`,
      "Set-Cookie": `linkedin_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
    },
  });
}
