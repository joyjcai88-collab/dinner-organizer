// Server-side helpers for Luma's public API (https://public-api.luma.com).
// CORS is blocked on api endpoints, so the browser talks to our route handlers
// and we relay with the caller's key. The key is never stored server-side.

const BASE = "https://public-api.luma.com";

export class LumaError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/** Follow entries/has_more/next_cursor pagination until done or maxItems. */
export async function lumaFetchAll<T>(
  path: string,
  params: Record<string, string>,
  apiKey: string,
  maxItems: number
): Promise<T[]> {
  const entries: T[] = [];
  let cursor: string | undefined;

  do {
    const url = new URL(`${BASE}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("pagination_limit", "50");
    if (cursor) url.searchParams.set("pagination_cursor", cursor);

    const res = await fetch(url, {
      headers: { "x-luma-api-key": apiKey },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      // Luma: 400 = missing key, 401 = bad key ("You are not signed in."), 429 = rate limit
      const message =
        res.status === 401
          ? "Luma rejected the API key. Check it in Calendar Settings → Developer → API Keys."
          : res.status === 429
            ? "Luma rate limit hit. Wait a minute and try again."
            : (body?.message ?? `Luma returned ${res.status}.`);
      throw new LumaError(message, res.status);
    }

    const data = (await res.json()) as {
      entries: T[];
      has_more: boolean;
      next_cursor?: string;
    };
    entries.push(...data.entries);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor && entries.length < maxItems);

  return entries.slice(0, maxItems);
}

export function keyFromRequest(request: Request): string {
  const key = request.headers.get("x-luma-key");
  if (!key) throw new LumaError("Missing Luma API key.", 400);
  return key;
}

export function errorResponse(e: unknown): Response {
  if (e instanceof LumaError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  return Response.json({ error: "Couldn't reach Luma." }, { status: 502 });
}
