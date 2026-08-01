import { NextRequest } from "next/server";
import {
  scrapeLinkedInProfile,
  scrapeLinkedInByName,
} from "@/lib/linkedin";
import { LOOKUP_ENABLED, LOOKUP_DISABLED_MESSAGE } from "@/lib/lookup-flag";

export async function POST(request: NextRequest) {
  if (!LOOKUP_ENABLED) {
    return Response.json({ error: LOOKUP_DISABLED_MESSAGE }, { status: 404 });
  }
  const body = await request.json();

  if (body.url) {
    const urlPattern =
      /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/;
    if (!urlPattern.test(body.url)) {
      return Response.json(
        { error: "Invalid LinkedIn profile URL" },
        { status: 400 }
      );
    }
    try {
      const profile = await scrapeLinkedInProfile(body.url);
      if (!profile) {
        return Response.json(
          { error: "Could not fetch profile" },
          { status: 404 }
        );
      }
      return Response.json({ profile });
    } catch {
      return Response.json(
        { error: "Scrape failed" },
        { status: 500 }
      );
    }
  }

  if (body.name) {
    try {
      const profile = await scrapeLinkedInByName(
        body.name,
        body.company
      );
      if (!profile) {
        return Response.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
      return Response.json({ profile });
    } catch {
      return Response.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }
  }

  return Response.json(
    { error: "Provide url or name" },
    { status: 400 }
  );
}
