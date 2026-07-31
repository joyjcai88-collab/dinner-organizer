import { NextRequest } from "next/server";
import { searchLinkedInProfiles } from "@/lib/linkedin";

export async function GET(request: NextRequest) {
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
