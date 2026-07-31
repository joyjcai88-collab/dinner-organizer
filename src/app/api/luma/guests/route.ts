import { lumaFetchAll, keyFromRequest, errorResponse, LumaError } from "@/lib/luma-server";

interface LumaGuest {
  user_email: string | null;
  user_name: string | null;
  user_first_name: string | null;
  user_last_name: string | null;
  approval_status: string | null;
  joined_at: string | null;
  event_tickets?: { checked_in_at: string | null }[];
}

export async function GET(request: Request) {
  try {
    const key = keyFromRequest(request);
    const eventId = new URL(request.url).searchParams.get("event");
    if (!eventId) throw new LumaError("Missing event id.", 400);

    const guests = await lumaFetchAll<LumaGuest>(
      "/v1/events/guests/list",
      { event_id: eventId },
      key,
      1000
    );

    return Response.json({
      rows: guests.map((g) => {
        const name =
          g.user_name ??
          `${g.user_first_name ?? ""} ${g.user_last_name ?? ""}`.trim();
        // check-in lives per ticket, not on the guest; online events use joined_at
        const checkedInAt =
          g.event_tickets?.find((t) => t.checked_in_at)?.checked_in_at ??
          g.joined_at ??
          null;
        return {
          name,
          email: g.user_email ?? "",
          approvalStatus: g.approval_status,
          checkedInAt,
        };
      }),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
