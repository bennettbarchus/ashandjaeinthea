import { NextRequest, NextResponse } from "next/server";
import { getRsvpSettings } from "@/lib/rsvp-config";
import {
  guestDisplayName,
  sanitizePersonalMessage,
  invitedGuestsForHousehold,
  loadWelcomeContext,
  welcomeInvitationRequestSchema,
} from "@/lib/welcome";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { InvitationGuest } from "@/types/rsvp";
import type { WelcomeInvitationResponse } from "@/types/welcome";

const NOT_FOUND = "We couldn't find your invitation.";

/**
 * Resolves a household picked from a masked search result into the guests
 * invited to Friday, plus any answers already on file.
 *
 * There is intentionally no verification step in this flow (per spec), so
 * the response is limited to what the Friday event needs — this route
 * never discloses the household's other event invitations, and the
 * matching submit route can only write the Friday rows.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`welcome-invitation:${ip}`, {
    limit: 15,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = welcomeInvitationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }
  const { householdId } = parsed.data;

  try {
    const settings = await getRsvpSettings();
    if (!settings.rsvpOpen) {
      return NextResponse.json(
        { error: "RSVP is currently closed." },
        { status: 403 }
      );
    }

    const ctx = await loadWelcomeContext();
    if (!ctx.event) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }

    const householdRow = ctx.households.find(
      (r) => r.data.household_id === householdId
    );
    if (!householdRow) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }
    const household = householdRow.data;

    const invitedGuests = invitedGuestsForHousehold(ctx, householdId);
    if (invitedGuests.length === 0) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }

    const event = ctx.event;
    const invitationByGuestId = new Map(
      ctx.invitations
        .map((r) => r.data)
        .filter((inv) => inv.event_id === event.event_id)
        .map((inv) => [inv.guest_id, inv])
    );
    const guests: InvitationGuest[] = invitedGuests.map((guest) => {
      const inv = invitationByGuestId.get(guest.guest_id);
      return {
        id: guest.guest_id,
        displayName: guestDisplayName(guest),
        firstName: guest.first_name,
        isPlusOne: guest.is_plus_one === "TRUE",
        plusOneNameEditable: guest.plus_one_name_editable === "TRUE",
        events: [
          {
            eventId: event.event_id,
            eventName: event.event_name,
            eventDate: event.event_date,
            eventTime: event.event_time,
            location: event.location,
            requiresMeal: event.requires_meal === "TRUE",
            attendance:
              inv?.attendance === "YES" || inv?.attendance === "NO"
                ? inv.attendance
                : null,
            mealChoice: "",
            steakTemperature: "",
            dietaryNotes: inv?.dietary_notes ?? "",
          },
        ],
      };
    });

    const response: WelcomeInvitationResponse = {
      household: {
        id: household.household_id,
        name: household.household_name || household.primary_guest_name,
        // Optional; the column may not exist on older sheets, hence the fallback.
        personalMessage: sanitizePersonalMessage(household.personal_message ?? ""),
      },
      guests,
      event: {
        eventId: event.event_id,
        eventName: event.event_name,
        eventDate: event.event_date,
        eventTime: event.event_time,
        location: event.location,
        requiresMeal: event.requires_meal === "TRUE",
      },
      settings,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error(
      "Welcome invitation lookup failed:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
