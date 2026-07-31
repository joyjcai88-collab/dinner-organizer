import { lumaFetchAll, keyFromRequest, errorResponse } from "@/lib/luma-server";

interface LumaEvent {
  id: string;
  name: string;
  start_at: string | null;
  location_type?: string;
  geo_address_json: {
    description?: string;
    address?: string;
    city?: string;
  } | null;
}

const ONLINE_TYPES = new Set(["discord", "meet", "twitch", "twitter", "youtube", "zoom"]);

export async function GET(request: Request) {
  try {
    const key = keyFromRequest(request);
    const events = await lumaFetchAll<LumaEvent>(
      "/v1/calendars/events/list",
      { sort_column: "start_at", sort_direction: "desc" },
      key,
      200
    );

    return Response.json({
      events: events.map((e) => ({
        id: e.id,
        name: e.name,
        date: (e.start_at ?? "").slice(0, 10),
        venue:
          e.geo_address_json?.description ||
          e.geo_address_json?.address ||
          e.geo_address_json?.city ||
          (e.location_type && ONLINE_TYPES.has(e.location_type) ? "Online" : ""),
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
