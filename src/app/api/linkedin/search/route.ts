import { NextRequest } from "next/server";
import { searchLinkedInProfiles } from "@/lib/linkedin";
import { LOOKUP_ENABLED, LOOKUP_DISABLED_MESSAGE } from "@/lib/lookup-flag";

export async function GET(request: NextRequest) {
  if (!LOOKUP_ENABLED) {
    return Response.json({ error: LOOKUP_DISABLED_MESSAGE }, { status: 404 });
  }
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return Response.json({ error: "Query too short" }, { status: 400 });
  }

  try {
    const urls = await searchLinkedInProfiles(q.trim());
    return Response.json({ urls });
  } catch {
    return Response.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
